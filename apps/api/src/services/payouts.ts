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

async function loadPayoutForUpdate(
  client: PoolClient,
  payoutId: string,
): Promise<PayoutRow | null> {
  const result = await client.query<PayoutRow>(
    `SELECT id, player_run_id, player_id, recipient_address, amount_luna, network_id,
            status, idempotency_key, tx_hash, failure_code, failure_message_safe,
            attempt_count, attempted_at, submitted_at, confirmed_at, created_at, updated_at
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
            SET status = 'FAILED', failure_code = $2,
                failure_message_safe = 'On-chain payout details did not match.',
                tx_hash = COALESCE(tx_hash, $3), updated_at = now()
          WHERE id = $1`,
        [payout.id, mismatch, transaction.transactionHash],
      );
      throw errors.conflict(
        "PAYOUT_TRANSACTION_MISMATCH",
        "On-chain payout details did not match the stored payout.",
      );
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
      `SELECT id, player_run_id, player_id, recipient_address, amount_luna, network_id,
              status, idempotency_key, tx_hash, failure_code, failure_message_safe,
              attempt_count, attempted_at, submitted_at, confirmed_at, created_at, updated_at
         FROM payouts WHERE id = $1`,
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
    if (contextRow?.session_state === "PAYOUT_PENDING") {
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

export async function processQueuedPayout(input: {
  nimiq: NimiqService;
  logger: LoggerLike;
}): Promise<PayoutRow | null> {
  return withTreasuryLock(async () => {
    if (!config.nimiqTreasuryPrivateKey) {
      throw errors.unavailable("Treasury signing is not configured.");
    }

    const claimed = await query<PayoutRow>(
      `UPDATE payouts
          SET status = 'BUILDING', attempt_count = attempt_count + 1,
              attempted_at = now(), updated_at = now()
        WHERE id = (
          SELECT id FROM payouts
           WHERE status = 'QUEUED'
           ORDER BY created_at ASC
           FOR UPDATE SKIP LOCKED
           LIMIT 1
        )
        RETURNING id, player_run_id, player_id, recipient_address, amount_luna,
                  network_id, status, idempotency_key, tx_hash, failure_code,
                  failure_message_safe, attempt_count, attempted_at, submitted_at,
                  confirmed_at, created_at, updated_at`,
    );
    const payout = claimed.rows[0];
    if (!payout) return null;

    const context = await loadPayoutContext(payout.id);
    if (!context) return null;

    if (payout.tx_hash) {
      const existing = await input.nimiq.getTransaction(payout.tx_hash);
      const mismatch = assertTransactionMatchesPayout(payout, existing);
      if (!mismatch) {
        return confirmPayoutWithTransaction(payout.id, existing);
      }
      await setPayoutFailure(
        payout.id,
        "RECONCILING",
        mismatch,
        "Existing payout transaction needs operator reconciliation.",
      );
      return null;
    }

    try {
      const account = await input.nimiq.getAccount(config.nimiqTreasuryAddress);
      if (toLuna(account.balanceLuna) < toLuna(payout.amount_luna)) {
        await setPayoutFailure(
          payout.id,
          "FAILED",
          "TREASURY_INSUFFICIENT_BALANCE",
          "Treasury balance is below the payout amount.",
        );
        return null;
      }

      const sent = await input.nimiq.buildSignAndBroadcastBasicTransfer({
        fromAddress: config.nimiqTreasuryAddress,
        privateKeyHex: config.nimiqTreasuryPrivateKey,
        toAddress: payout.recipient_address,
        amountLuna: toLuna(payout.amount_luna),
        data: `LBA1:${context.public_ref}`,
      });

      assertTransition("payout", "BUILDING", "SUBMITTED");
      await withTransaction(async (client) => {
        await client.query(
          `UPDATE payouts
              SET status = 'SUBMITTED', tx_hash = $2, submitted_at = now(),
                  updated_at = now()
            WHERE id = $1`,
          [payout.id, sent.txHash],
        );
        const run = await client.query<{ id: string; state: string }>(
          `SELECT id, state FROM player_runs WHERE id = $1 FOR UPDATE`,
          [payout.player_run_id],
        );
        if (run.rows[0] && run.rows[0].state === "PAYOUT_QUEUED") {
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
          details: { txHash: sent.txHash },
        });
      });

      const submitted = await loadPayoutContext(payout.id);
      if (!submitted) return null;

      for (let attempt = 0; attempt < 20; attempt += 1) {
        let transaction: NimiqTransactionDetails | null = null;
        try {
          transaction = await input.nimiq.getTransaction(sent.txHash);
        } catch {
          transaction = null;
        }
        if (transaction) {
          const mismatch = assertTransactionMatchesPayout(submitted, transaction);
          if (!mismatch) {
            return confirmPayoutWithTransaction(payout.id, transaction);
          }
          if (mismatch !== "NOT_INCLUDED") {
            await setPayoutFailure(
              payout.id,
              "FAILED",
              mismatch,
              "On-chain payout details did not match the stored payout.",
            );
            return null;
          }
        }
        await new Promise((resolve) => setTimeout(resolve, 3_000));
      }

      await setPayoutFailure(
        payout.id,
        "RECONCILING",
        "NOT_INCLUDED_YET",
        "Payout transaction is not yet confirmed on-chain.",
      );
      return null;
    } catch (error) {
      input.logger.error(
        {
          event: "payout_broadcast_error",
          payoutId: payout.id,
          message: error instanceof Error ? error.message : "unknown",
        },
        "Payout broadcast failed",
      );
      await setPayoutFailure(
        payout.id,
        "RECONCILING",
        "BROADCAST_AMBIGUOUS",
        "Payout broadcast outcome is ambiguous; reconcile before retry.",
      );
      return null;
    }
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
      transaction = await input.nimiq.getTransaction(payout.tx_hash);
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
        "FAILED",
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
      `SELECT id, player_run_id, player_id, recipient_address, amount_luna, network_id,
              status, idempotency_key, tx_hash, failure_code, failure_message_safe,
              attempt_count, attempted_at, submitted_at, confirmed_at, created_at, updated_at
         FROM payouts WHERE id = $1`,
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
      const payout = await processQueuedPayout(input);
      if (payout) {
        input.logger.info(
          { event: "payout_worker_result", payoutId: payout.id, status: payout.status },
          "Payout worker processed a payout",
        );
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
        timer = setTimeout(run, input.intervalMs ?? 10_000);
      }
    }
  };

  timer = setTimeout(run, 2_000);
  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
  };
}


