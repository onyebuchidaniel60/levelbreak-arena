import type { PoolClient } from "pg";
import { config } from "../config";
import { pool, query, withTransaction } from "../db";
import { AppError, errors } from "../errors";
import { toLuna } from "../domain/money";
import { assertTransition } from "../domain/state-machines";
import { addressesEqual } from "../nimiq/address";
import type { NimiqService, NimiqTransactionDetails } from "../nimiq/types";
import { recordAudit } from "./audit";
import type { LoggerLike } from "./sessions";

const TREASURY_WORKER_LOCK = 5_000_031;
const QUEUED_RETRY_BACKOFF_SECONDS = 60;
const CHAIN_READ_TIMEOUT_MS = 15_000;
const BROADCAST_TIMEOUT_MS = 45_000;
/**
 * TestAlbatross basic transfers are currently built with a zero fee. Keep a
 * named reserve so the balance guard is explicit and can be raised without
 * touching the reward amount.
 */
const TREASURY_FEE_RESERVE_LUNA = 0n;
const DEFAULT_CONFIRM_POLL_DELAYS_MS = [5_000, 5_000, 10_000, 15_000, 30_000];

const PAYOUT_COLUMNS = `id, player_run_id, player_id, recipient_address, amount_luna,
  network_id, status, idempotency_key, tx_hash, failure_code, failure_message_safe,
  attempt_count, attempted_at, submitted_at, confirmed_at, created_at, updated_at`;

type PayoutRow = {
  id: string;
  player_run_id: string;
  player_id: string;
  recipient_address: string;
  amount_luna: string;
  network_id: string;
  status: string;
  idempotency_key: string;
  tx_hash: string | null;
  failure_code: string | null;
  failure_message_safe: string | null;
  attempt_count: number;
  attempted_at: Date | null;
  submitted_at: Date | null;
  confirmed_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

type PayoutContext = PayoutRow & {
  run_state: string;
  requester_session_id: string;
  public_ref: string;
  treasury_address: string;
};

function networkIsTestnet(network: string): boolean {
  const normalized = network.toLowerCase();
  return (
    normalized.includes("testalbatross") ||
    normalized === "testnet" ||
    normalized === "5"
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  code: string,
): Promise<T> {
  let timer: NodeJS.Timeout | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error(code)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function loadPayoutForUpdate(
  client: PoolClient,
  payoutId: string,
): Promise<PayoutRow | null> {
  const result = await client.query<PayoutRow>(
    `SELECT ${PAYOUT_COLUMNS}
       FROM payouts
      WHERE id = $1
      FOR UPDATE`,
    [payoutId],
  );
  return result.rows[0] ?? null;
}

async function loadPayoutContext(payoutId: string): Promise<PayoutContext | null> {
  const result = await query<PayoutContext>(
    `SELECT p.id, p.player_run_id, p.player_id, p.recipient_address, p.amount_luna,
            p.network_id, p.status, p.idempotency_key, p.tx_hash, p.failure_code,
            p.failure_message_safe, p.attempt_count, p.attempted_at, p.submitted_at,
            p.confirmed_at, p.created_at, p.updated_at,
            r.state AS run_state, r.requester_session_id, s.public_ref,
            s.treasury_address
       FROM payouts p
       JOIN player_runs r ON r.id = p.player_run_id
       JOIN requester_sessions s ON s.id = r.requester_session_id
      WHERE p.id = $1`,
    [payoutId],
  );
  return result.rows[0] ?? null;
}

function assertTransactionMatchesPayout(
  payout: PayoutRow,
  transaction: NimiqTransactionDetails,
): string | null {
  if (transaction.state !== "included" && transaction.state !== "confirmed") {
    return "NOT_INCLUDED";
  }
  if (!networkIsTestnet(transaction.network)) {
    return "NETWORK_MISMATCH";
  }
  if (!addressesEqual(transaction.sender, config.nimiqTreasuryAddress)) {
    return "SENDER_MISMATCH";
  }
  if (!addressesEqual(transaction.recipient, payout.recipient_address)) {
    return "RECIPIENT_MISMATCH";
  }
  if (toLuna(transaction.valueLuna) !== toLuna(payout.amount_luna)) {
    return "AMOUNT_MISMATCH";
  }
  return null;
}

async function confirmPayoutWithTransaction(
  payoutId: string,
  transaction: NimiqTransactionDetails,
): Promise<PayoutRow> {
  return withTransaction(async (client) => {
    const payout = await loadPayoutForUpdate(client, payoutId);
    if (!payout) throw errors.notFound("Payout not found.");
    if (payout.status === "CONFIRMED") return payout;
    if (payout.status === "CANCELLED") {
      throw errors.conflict("PAYOUT_CANCELLED", "Payout is cancelled.");
    }

    const mismatch = assertTransactionMatchesPayout(payout, transaction);
    if (mismatch) {
      await client.query(
        `UPDATE payouts
            SET status = 'RECONCILING', failure_code = $2,
                failure_message_safe = 'On-chain payout details did not match.',
                tx_hash = COALESCE(tx_hash, $3), updated_at = now()
          WHERE id = $1`,
        [payout.id, mismatch, transaction.transactionHash],
      );
      const refreshed = await client.query<PayoutRow>(
        `SELECT ${PAYOUT_COLUMNS} FROM payouts WHERE id = $1`,
        [payout.id],
      );
      return refreshed.rows[0];
    }

    let currentStatus = payout.status;
    if (currentStatus === "BUILDING") {
      assertTransition("payout", "BUILDING", "SUBMITTED");
      await client.query(
        `UPDATE payouts SET status = 'SUBMITTED', updated_at = now() WHERE id = $1`,
        [payout.id],
      );
      currentStatus = "SUBMITTED";
    }
    assertTransition("payout", currentStatus, "CONFIRMED");
    await client.query(
      `UPDATE payouts
          SET status = 'CONFIRMED',
              tx_hash = $2,
              submitted_at = COALESCE(submitted_at, now()),
              confirmed_at = now(),
              failure_code = NULL,
              failure_message_safe = NULL,
              updated_at = now()
        WHERE id = $1`,
      [payout.id, transaction.transactionHash],
    );

    const run = await client.query<{ id: string; state: string }>(
      `SELECT id, state FROM player_runs WHERE id = $1 FOR UPDATE`,
      [payout.player_run_id],
    );
    const runRow = run.rows[0];
    if (runRow && runRow.state !== "PAYOUT_CONFIRMED") {
      assertTransition("player_run", runRow.state, "PAYOUT_CONFIRMED");
      await client.query(
        `UPDATE player_runs
            SET state = 'PAYOUT_CONFIRMED', updated_at = now()
          WHERE id = $1`,
        [runRow.id],
      );
    }

    const runContext = await client.query<{
      requester_session_id: string;
    }>(`SELECT requester_session_id FROM player_runs WHERE id = $1`, [
      payout.player_run_id,
    ]);
    const sessionId = runContext.rows[0]?.requester_session_id;
    const session = sessionId
      ? await client.query<{ state: string }>(
          `SELECT state FROM requester_sessions WHERE id = $1 FOR UPDATE`,
          [sessionId],
        )
      : null;
    if (session?.rows[0] && session.rows[0].state === "PAYOUT_PENDING") {
      assertTransition("requester_session", "PAYOUT_PENDING", "SETTLED");
      await client.query(
        `UPDATE requester_sessions
            SET state = 'SETTLED', updated_at = now()
          WHERE id = $1`,
        [sessionId],
      );
    }

    await client.query(
      `INSERT INTO ledger_entries
         (requester_session_id, player_run_id, entry_type, amount_luna, direction,
          idempotency_key, external_ref, metadata)
       VALUES ($1, $2, 'PAYOUT_CONFIRMED', $3, 'DEBIT', $4, $5, $6)
       ON CONFLICT (idempotency_key) DO NOTHING`,
      [
        sessionId ?? null,
        payout.player_run_id,
        payout.amount_luna,
        `payout_confirmed:${payout.id}`,
        transaction.transactionHash,
        JSON.stringify({ txHash: transaction.transactionHash }),
      ],
    );

    await recordAudit(client, {
      actorType: "SYSTEM",
      action: "payout_confirmed",
      resourceType: "payout",
      resourceId: payout.id,
      details: { txHash: transaction.transactionHash },
    });

    const refreshed = await client.query<PayoutRow>(
      `SELECT ${PAYOUT_COLUMNS} FROM payouts WHERE id = $1`,
      [payout.id],
    );
    return refreshed.rows[0];
  });
}

async function setPayoutFailure(
  payoutId: string,
  status: "FAILED" | "RECONCILING",
  code: string,
  message: string,
): Promise<void> {
  await withTransaction(async (client) => {
    const payout = await loadPayoutForUpdate(client, payoutId);
    if (!payout || payout.status === "CONFIRMED") return;
    if (payout.status === "QUEUED") {
      if (status !== "FAILED") {
        // A queued payout must stay queued for retryable conditions.
        await client.query(
          `UPDATE payouts
              SET failure_code = $2, failure_message_safe = $3, updated_at = now()
            WHERE id = $1 AND status = 'QUEUED'`,
          [payout.id, code, message],
        );
        return;
      }
      assertTransition("payout", "QUEUED", "FAILED");
    } else if (payout.status === "BUILDING" || payout.status === "SUBMITTED") {
      assertTransition(
        "payout",
        payout.status,
        status === "FAILED" ? "FAILED" : "RECONCILING",
      );
    } else if (payout.status === "RECONCILING" && status === "RECONCILING") {
      // Already reconciling.
    } else if (payout.status === "RECONCILING" && status === "FAILED") {
      assertTransition("payout", "RECONCILING", "FAILED");
    } else if (payout.status === "FAILED") {
      // Keep the first failure.
    } else {
      return;
    }

    await client.query(
      `UPDATE payouts
          SET status = $2, failure_code = $3, failure_message_safe = $4,
              updated_at = now()
        WHERE id = $1`,
      [payout.id, status, code, message],
    );

    const context = await client.query<{
      requester_session_id: string;
      session_state: string;
    }>(
      `SELECT r.requester_session_id, s.state AS session_state
         FROM player_runs r
         JOIN requester_sessions s ON s.id = r.requester_session_id
        WHERE r.id = $1
        FOR UPDATE OF s`,
      [payout.player_run_id],
    );
    const contextRow = context.rows[0];
    if (status === "FAILED" && contextRow?.session_state === "PAYOUT_PENDING") {
      assertTransition("requester_session", "PAYOUT_PENDING", "PAYOUT_FAILED");
      await client.query(
        `UPDATE requester_sessions
            SET state = 'PAYOUT_FAILED', updated_at = now()
          WHERE id = $1`,
        [contextRow.requester_session_id],
      );
    }
  });
}

/**
 * Keep a payout in QUEUED while recording a safe, retryable failure. Used for
 * pre-broadcast checks such as insufficient treasury balance or an unavailable
 * chain; the 60-second claim backoff is derived from attempted_at.
 */
async function markQueuedRetry(
  payoutId: string,
  code: string,
  message: string,
): Promise<PayoutRow | null> {
  const result = await query<PayoutRow>(
    `UPDATE payouts
        SET failure_code = $2, failure_message_safe = $3,
            attempt_count = attempt_count + 1, attempted_at = now(),
            updated_at = now()
      WHERE id = $1 AND status = 'QUEUED'
      RETURNING ${PAYOUT_COLUMNS}`,
    [payoutId, code, message],
  );
  return result.rows[0] ?? null;
}

/**
 * Record a submitted payout before the broadcast is attempted. The update is
 * conditional on the row still being BUILDING with no hash, so a duplicate
 * worker or operator action cannot overwrite an existing hash.
 */
async function markSubmitted(payoutId: string, txHash: string): Promise<void> {
  await withTransaction(async (client) => {
    const payout = await loadPayoutForUpdate(client, payoutId);
    if (!payout) throw errors.notFound("Payout not found.");
    if (payout.status === "SUBMITTED" && payout.tx_hash === txHash) return;
    if (payout.status !== "BUILDING" || payout.tx_hash !== null) {
      throw errors.conflict(
        "PAYOUT_NOT_BUILDING",
        "Payout is not awaiting a broadcast.",
      );
    }

    assertTransition("payout", "BUILDING", "SUBMITTED");
    await client.query(
      `UPDATE payouts
          SET status = 'SUBMITTED', tx_hash = $2, submitted_at = now(),
              failure_code = NULL, failure_message_safe = NULL,
              updated_at = now()
        WHERE id = $1`,
      [payout.id, txHash],
    );

    const run = await client.query<{ id: string; state: string }>(
      `SELECT id, state FROM player_runs WHERE id = $1 FOR UPDATE`,
      [payout.player_run_id],
    );
    if (run.rows[0]?.state === "PAYOUT_QUEUED") {
      assertTransition("player_run", "PAYOUT_QUEUED", "PAYOUT_SUBMITTED");
      await client.query(
        `UPDATE player_runs
            SET state = 'PAYOUT_SUBMITTED', updated_at = now()
          WHERE id = $1`,
        [run.rows[0].id],
      );
    }

    await recordAudit(client, {
      actorType: "SYSTEM",
      action: "payout_submitted",
      resourceType: "payout",
      resourceId: payout.id,
      details: { txHash },
    });
  });
}

/**
 * Record a chain-read problem without changing the payout state. A submitted
 * payout must stay SUBMITTED until the chain proves inclusion or a mismatch.
 */
async function markPostSubmitRetry(
  payoutId: string,
  code: string,
  message: string,
): Promise<PayoutRow | null> {
  const result = await query<PayoutRow>(
    `UPDATE payouts
        SET failure_code = $2, failure_message_safe = $3, updated_at = now()
      WHERE id = $1 AND status IN ('SUBMITTED', 'RECONCILING')
      RETURNING ${PAYOUT_COLUMNS}`,
    [payoutId, code, message],
  );
  return result.rows[0] ?? null;
}

async function withTreasuryLock<T>(
  callback: () => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    const lock = await client.query<{ locked: boolean }>(
      `SELECT pg_try_advisory_lock($1) AS locked`,
      [TREASURY_WORKER_LOCK],
    );
    if (!lock.rows[0].locked) {
      throw errors.conflict(
        "TREASURY_WORKER_BUSY",
        "Another treasury worker operation is in progress.",
      );
    }
    return await callback();
  } finally {
    try {
      await client.query(`SELECT pg_advisory_unlock($1)`, [
        TREASURY_WORKER_LOCK,
      ]);
    } catch {
      // The connection may already be broken; releasing owns the lock.
    }
    client.release();
  }
}

/**
 * On worker start, resolve rows that were left mid-build by a crash. A row with
 * a hash is safe to reconcile as SUBMITTED; a row without one is ambiguous and
 * must be handled by an operator, never blindly re-sent.
 */
export async function recoverInterruptedPayouts(): Promise<number> {
  return withTreasuryLock(async () => {
    const withHash = await query<{ id: string }>(
      `UPDATE payouts
          SET status = 'SUBMITTED', updated_at = now()
        WHERE status = 'BUILDING' AND tx_hash IS NOT NULL
        RETURNING id`,
    );
    const withoutHash = await query<{ id: string }>(
      `UPDATE payouts
          SET status = 'RECONCILING',
              failure_code = 'INTERRUPTED_BUILD',
              failure_message_safe = 'Worker restarted during build; reconcile before retry.',
              updated_at = now()
        WHERE status = 'BUILDING' AND tx_hash IS NULL
        RETURNING id`,
    );
    return (withHash.rowCount ?? 0) + (withoutHash.rowCount ?? 0);
  });
}

export async function processQueuedPayout(input: {
  nimiq: NimiqService;
  logger: LoggerLike;
  /** Test hook: override the bounded confirmation poll delays. */
  confirmPollDelaysMs?: number[];
}): Promise<PayoutRow | null> {
  return withTreasuryLock(async () => {
    if (!config.nimiqTreasuryPrivateKey) {
      throw errors.unavailable("Treasury signing is not configured.");
    }

    const candidateResult = await query<PayoutRow>(
      `SELECT ${PAYOUT_COLUMNS}
         FROM payouts
        WHERE status = 'QUEUED'
          AND tx_hash IS NULL
          AND (attempted_at IS NULL
               OR attempted_at < now() - make_interval(secs => $1))
        ORDER BY created_at ASC
        LIMIT 1`,
      [QUEUED_RETRY_BACKOFF_SECONDS],
    );
    const candidate = candidateResult.rows[0];
    if (!candidate) return null;

    // Pre-broadcast checks happen while the payout is still QUEUED so a
    // transient balance or chain problem can be retried without marking it
    // FAILED or moving it out of the outbox.
    let networkId: number;
    try {
      networkId = await withTimeout(
        input.nimiq.getNetworkId(),
        CHAIN_READ_TIMEOUT_MS,
        "CHAIN_TIMEOUT",
      );
    } catch {
      return markQueuedRetry(
        candidate.id,
        "CHAIN_UNAVAILABLE",
        "Chain network check is unavailable; retry later.",
      );
    }
    if (networkId !== 5) {
      return markQueuedRetry(
        candidate.id,
        "NETWORK_MISMATCH",
        "Payout worker is not on TestAlbatross network 5.",
      );
    }

    let balanceLuna: bigint;
    try {
      const account = await withTimeout(
        input.nimiq.getAccount(config.nimiqTreasuryAddress),
        CHAIN_READ_TIMEOUT_MS,
        "CHAIN_TIMEOUT",
      );
      balanceLuna = toLuna(account.balanceLuna);
    } catch {
      return markQueuedRetry(
        candidate.id,
        "CHAIN_UNAVAILABLE",
        "Treasury balance check is unavailable; retry later.",
      );
    }
    const requiredLuna =
      toLuna(candidate.amount_luna) + TREASURY_FEE_RESERVE_LUNA;
    if (balanceLuna < requiredLuna) {
      return markQueuedRetry(
        candidate.id,
        "TREASURY_INSUFFICIENT_BALANCE",
        "Treasury balance is below the payout amount plus the fee reserve.",
      );
    }

    const claimed = await query<PayoutRow>(
      `UPDATE payouts
          SET status = 'BUILDING', attempt_count = attempt_count + 1,
              attempted_at = now(), failure_code = NULL,
              failure_message_safe = NULL, updated_at = now()
        WHERE id = $1 AND status = 'QUEUED' AND tx_hash IS NULL
        RETURNING ${PAYOUT_COLUMNS}`,
      [candidate.id],
    );
    const payout = claimed.rows[0];
    if (!payout) return null;

    const context = await loadPayoutContext(payout.id);
    if (!context) {
      await setPayoutFailure(
        payout.id,
        "FAILED",
        "PAYOUT_CONTEXT_MISSING",
        "Payout context could not be loaded.",
      );
      return null;
    }

    let submittedHash: string | null = null;
    try {
      const sent = await withTimeout(
        input.nimiq.buildSignAndBroadcastBasicTransfer(
          {
            fromAddress: config.nimiqTreasuryAddress,
            privateKeyHex: config.nimiqTreasuryPrivateKey,
            toAddress: payout.recipient_address,
            amountLuna: toLuna(payout.amount_luna),
            data: `LBA1:${context.public_ref}`,
          },
          {
            onSigned: async (txHash) => {
              await markSubmitted(payout.id, txHash);
              submittedHash = txHash;
            },
          },
        ),
        BROADCAST_TIMEOUT_MS,
        "BROADCAST_TIMEOUT",
      );

      if (!submittedHash) {
        // Defensive fallback for an adapter that returns a hash without
        // invoking the hook. Persist it before reconciling.
        await markSubmitted(payout.id, sent.txHash);
        submittedHash = sent.txHash;
      }
      if (sent.txHash !== submittedHash) {
        throw new Error("Broadcast returned a different transaction hash");
      }
    } catch (error) {
      input.logger.error(
        {
          event: "payout_broadcast_error",
          payoutId: payout.id,
          message: error instanceof Error ? error.message : "unknown",
        },
        "Payout broadcast failed",
      );
      if (submittedHash) {
        return markPostSubmitRetry(
          payout.id,
          "BROADCAST_AMBIGUOUS",
          "Broadcast outcome is ambiguous; reconcile before retry.",
        );
      }
      await setPayoutFailure(
        payout.id,
        "FAILED",
        "BROADCAST_NOT_STARTED",
        "Payout was not broadcast; operator may reconcile and requeue.",
      );
      return null;
    }

    const txHash = submittedHash;
    const delays = input.confirmPollDelaysMs ?? DEFAULT_CONFIRM_POLL_DELAYS_MS;
    let lastPendingStatus: "PENDING" | "UNKNOWN" = "UNKNOWN";
    for (let attempt = 0; attempt <= delays.length; attempt += 1) {
      if (attempt > 0) {
        await sleep(delays[attempt - 1]);
      }

      let status: {
        status: "PENDING" | "INCLUDED" | "REJECTED" | "UNKNOWN";
        transaction: NimiqTransactionDetails | null;
      };
      try {
        status = await withTimeout(
          input.nimiq.getTransactionStatus(txHash),
          CHAIN_READ_TIMEOUT_MS,
          "CHAIN_TIMEOUT",
        );
      } catch {
        status = { status: "UNKNOWN", transaction: null };
      }

      if (status.status === "INCLUDED" && status.transaction) {
        const mismatch = assertTransactionMatchesPayout(
          payout,
          status.transaction,
        );
        if (!mismatch) {
          return confirmPayoutWithTransaction(payout.id, status.transaction);
        }
        if (mismatch === "NOT_INCLUDED") {
          continue;
        }
        await setPayoutFailure(
          payout.id,
          "RECONCILING",
          mismatch,
          "On-chain payout details did not match the stored payout.",
        );
        return null;
      }

      if (status.status === "REJECTED") {
        await setPayoutFailure(
          payout.id,
          "RECONCILING",
          "TRANSACTION_REJECTED",
          "Payout transaction was rejected; reconcile before retry.",
        );
        return null;
      }

      lastPendingStatus =
        status.status === "PENDING" ? "PENDING" : "UNKNOWN";
      // PENDING and UNKNOWN are both non-terminal. Keep polling within the
      // bounded window, then leave the payout SUBMITTED for the next cycle.
    }

    const code =
      lastPendingStatus === "UNKNOWN"
        ? "CHAIN_UNAVAILABLE"
        : "NOT_INCLUDED_YET";
    return markPostSubmitRetry(
      payout.id,
      code,
      code === "CHAIN_UNAVAILABLE"
        ? "Chain status is unavailable; continuing reconciliation."
        : "Payout transaction is not yet included; continuing reconciliation.",
    );
  });
}

/**
 * Reconcile one SUBMITTED or RECONCILING payout. This is also the restart path:
 * an existing tx_hash is queried before any new broadcast is considered.
 */
export async function processSubmittedPayout(input: {
  nimiq: NimiqService;
  logger: LoggerLike;
}): Promise<PayoutRow | null> {
  return withTreasuryLock(async () => {
    const result = await query<PayoutRow>(
      `SELECT ${PAYOUT_COLUMNS}
         FROM payouts
        WHERE status IN ('SUBMITTED', 'RECONCILING')
          AND tx_hash IS NOT NULL
        ORDER BY updated_at ASC
        LIMIT 1`,
    );
    const payout = result.rows[0];
    if (!payout || !payout.tx_hash) return null;

    let status: {
      status: "PENDING" | "INCLUDED" | "REJECTED" | "UNKNOWN";
      transaction: NimiqTransactionDetails | null;
    };
    try {
      status = await withTimeout(
        input.nimiq.getTransactionStatus(payout.tx_hash),
        CHAIN_READ_TIMEOUT_MS,
        "CHAIN_TIMEOUT",
      );
    } catch {
      status = { status: "UNKNOWN", transaction: null };
    }

    if (status.status === "INCLUDED" && status.transaction) {
      const mismatch = assertTransactionMatchesPayout(
        payout,
        status.transaction,
      );
      if (!mismatch) {
        return confirmPayoutWithTransaction(payout.id, status.transaction);
      }
      if (mismatch === "NOT_INCLUDED") {
        return markPostSubmitRetry(
          payout.id,
          "NOT_INCLUDED_YET",
          "Payout transaction is not yet included; continuing reconciliation.",
        );
      }
      await setPayoutFailure(
        payout.id,
        "RECONCILING",
        mismatch,
        "On-chain payout details did not match the stored payout.",
      );
      return loadPayoutContext(payout.id);
    }

    if (status.status === "REJECTED") {
      await setPayoutFailure(
        payout.id,
        "RECONCILING",
        "TRANSACTION_REJECTED",
        "Payout transaction was rejected; reconcile before retry.",
      );
      return loadPayoutContext(payout.id);
    }

    const code =
      status.status === "PENDING" ? "NOT_INCLUDED_YET" : "CHAIN_UNAVAILABLE";
    return markPostSubmitRetry(
      payout.id,
      code,
      code === "CHAIN_UNAVAILABLE"
        ? "Chain status is unavailable; continuing reconciliation."
        : "Payout transaction is not yet included; continuing reconciliation.",
    );
  });
}

export async function reconcilePayout(input: {
  payoutId: string;
  nimiq: NimiqService;
}): Promise<PayoutRow> {
  return withTreasuryLock(async () => {
    const payout = await loadPayoutContext(input.payoutId);
    if (!payout) throw errors.notFound("Payout not found.");

    if (payout.status === "CONFIRMED") return payout;
    if (!payout.tx_hash) {
      await withTransaction(async (client) => {
        const locked = await loadPayoutForUpdate(client, payout.id);
        if (!locked) return;
        if (locked.status === "CONFIRMED") return;
        if (
          locked.status === "BUILDING" ||
          locked.status === "SUBMITTED" ||
          locked.status === "QUEUED"
        ) {
          assertTransition("payout", locked.status, "FAILED");
        } else if (locked.status === "RECONCILING") {
          assertTransition("payout", "RECONCILING", "FAILED");
        }
        await client.query(
          `UPDATE payouts
              SET status = 'FAILED', failure_code = 'NO_TRANSACTION_HASH',
                  failure_message_safe = 'No payout transaction hash is recorded.',
                  updated_at = now()
            WHERE id = $1`,
          [locked.id],
        );
      });
      const refreshed = await loadPayoutContext(input.payoutId);
      if (!refreshed) throw errors.notFound("Payout not found.");
      return refreshed;
    }

    let transaction: NimiqTransactionDetails | null;
    try {
      transaction = await withTimeout(
        input.nimiq.getTransaction(payout.tx_hash),
        CHAIN_READ_TIMEOUT_MS,
        "CHAIN_TIMEOUT",
      );
    } catch {
      transaction = null;
    }
    if (!transaction) {
      await setPayoutFailure(
        payout.id,
        "RECONCILING",
        "TRANSACTION_NOT_FOUND",
        "The recorded payout transaction was not found; keep reconciling.",
      );
      const refreshed = await loadPayoutContext(input.payoutId);
      if (!refreshed) throw errors.notFound("Payout not found.");
      return refreshed;
    }

    const mismatch = assertTransactionMatchesPayout(payout, transaction);
    if (mismatch === "NOT_INCLUDED") {
      await setPayoutFailure(
        payout.id,
        "RECONCILING",
        "NOT_INCLUDED_YET",
        "The payout transaction is not yet included.",
      );
      const refreshed = await loadPayoutContext(input.payoutId);
      if (!refreshed) throw errors.notFound("Payout not found.");
      return refreshed;
    }
    if (mismatch) {
      await setPayoutFailure(
        payout.id,
        "RECONCILING",
        mismatch,
        "On-chain payout details did not match the stored payout.",
      );
      const refreshed = await loadPayoutContext(input.payoutId);
      if (!refreshed) throw errors.notFound("Payout not found.");
      return refreshed;
    }

    return confirmPayoutWithTransaction(payout.id, transaction);
  });
}

export async function requeuePayout(input: {
  payoutId: string;
  operatorId: string;
}): Promise<PayoutRow> {
  return withTransaction(async (client) => {
    const payout = await loadPayoutForUpdate(client, input.payoutId);
    if (!payout) throw errors.notFound("Payout not found.");
    if (payout.status !== "FAILED") {
      throw errors.conflict(
        "PAYOUT_NOT_REQUEUEABLE",
        "Only a failed payout can be requeued after reconciliation.",
      );
    }
    if (payout.tx_hash) {
      throw errors.conflict(
        "PAYOUT_HAS_TRANSACTION",
        "A payout with a transaction hash cannot be requeued.",
      );
    }
    assertTransition("payout", "FAILED", "QUEUED");
    await client.query(
      `UPDATE payouts
          SET status = 'QUEUED', failure_code = NULL, failure_message_safe = NULL,
              updated_at = now()
        WHERE id = $1`,
      [payout.id],
    );

    const context = await client.query<{
      requester_session_id: string;
      session_state: string;
    }>(
      `SELECT r.requester_session_id, s.state AS session_state
         FROM player_runs r
         JOIN requester_sessions s ON s.id = r.requester_session_id
        WHERE r.id = $1
        FOR UPDATE OF s`,
      [payout.player_run_id],
    );
    const contextRow = context.rows[0];
    if (contextRow?.session_state === "PAYOUT_FAILED") {
      assertTransition("requester_session", "PAYOUT_FAILED", "PAYOUT_PENDING");
      await client.query(
        `UPDATE requester_sessions
            SET state = 'PAYOUT_PENDING', updated_at = now()
          WHERE id = $1`,
        [contextRow.requester_session_id],
      );
    }

    await recordAudit(client, {
      actorType: "OPERATOR",
      actorId: input.operatorId,
      action: "payout_requeued",
      resourceType: "payout",
      resourceId: payout.id,
      details: { previousStatus: payout.status, attemptCount: payout.attempt_count },
    });

    const refreshed = await client.query<PayoutRow>(
      `SELECT ${PAYOUT_COLUMNS} FROM payouts WHERE id = $1`,
      [payout.id],
    );
    return refreshed.rows[0];
  });
}

export function startPayoutWorker(input: {
  nimiq: NimiqService;
  logger: LoggerLike;
  intervalMs?: number;
}): () => void {
  let stopped = false;
  let timer: NodeJS.Timeout | null = null;

  const run = async (): Promise<void> => {
    if (stopped) return;
    try {
      // A submitted payout blocks new broadcasts until it reaches a terminal
      // state. This is the treasury serialization guarantee.
      const reconciled = await processSubmittedPayout(input);
      if (reconciled) {
        input.logger.info(
          {
            event: "payout_worker_result",
            stage: "reconcile",
            payoutId: reconciled.id,
            status: reconciled.status,
          },
          "Payout worker reconciled a payout",
        );
      } else {
        const payout = await processQueuedPayout(input);
        if (payout) {
          input.logger.info(
            {
              event: "payout_worker_result",
              stage: "broadcast",
              payoutId: payout.id,
              status: payout.status,
            },
            "Payout worker processed a payout",
          );
        }
      }
    } catch (error) {
      if (error instanceof AppError && error.code === "TREASURY_WORKER_BUSY") {
        input.logger.warn(
          { event: "payout_worker_busy" },
          "Treasury worker lock is busy",
        );
      } else {
        input.logger.error(
          {
            event: "payout_worker_error",
            message: error instanceof Error ? error.message : "unknown",
          },
          "Payout worker failed",
        );
      }
    } finally {
      if (!stopped) {
        timer = setTimeout(run, input.intervalMs ?? 5_000);
      }
    }
  };

  void recoverInterruptedPayouts()
    .then((count) => {
      if (count > 0) {
        input.logger.warn(
          { event: "payout_worker_recovered_interrupted", count },
          "Recovered interrupted payout builds",
        );
      }
    })
    .catch((error) => {
      if (error instanceof AppError && error.code === "TREASURY_WORKER_BUSY") {
        return;
      }
      input.logger.warn(
        {
          event: "payout_worker_recovery_error",
          message: error instanceof Error ? error.message : "unknown",
        },
        "Could not recover interrupted payout builds",
      );
    });

  timer = setTimeout(run, 2_000);
  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
  };
}
