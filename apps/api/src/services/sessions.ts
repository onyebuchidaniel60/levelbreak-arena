import { randomBytes } from "node:crypto";
import type { PoolClient } from "pg";
import { config } from "../config";
import { query, withTransaction } from "../db";
import { AppError, errors } from "../errors";
import { assertTransition } from "../domain/state-machines";
import {
  STARTING_PORTFOLIO_UNITS,
  PORTFOLIO_VERSION,
} from "../domain/scenario-definitions";
import { lunaString, toLuna } from "../domain/money";
import type { NimiqService } from "../nimiq/types";
import { recordAudit } from "./audit";

export type LoggerLike = {
  info: (fields: object, message?: string) => void;
  warn: (fields: object, message?: string) => void;
  error: (fields: object, message?: string) => void;
};

type SessionRow = {
  id: string;
  public_ref: string;
  requester_type: string;
  state: string;
  network_id: string;
  treasury_address: string;
  expected_funding_luna: string;
  reward_per_answer_luna: string;
  max_consultations: number;
  max_reward_liability_luna: string;
  reserved_liability_luna: string;
  unused_credit_luna: string;
  funding_deadline: Date;
  claimed_by_player_run_id: string | null;
  creation_idempotency_key: string | null;
  funding_transfer_started_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

type FundingRow = {
  id: string;
  requester_session_id: string;
  tx_hash: string;
  sender_address: string;
  recipient_address: string;
  amount_luna: string;
  network_id: string;
  reference: string;
  status: string;
  block_height: string | null;
  included_at: Date | null;
  verified_at: Date | null;
  verification_error: string | null;
};

type RunRow = {
  id: string;
  requester_session_id: string;
  player_id: string;
  state: string;
  level_index: number;
  state_version: number;
  reward_earned_luna: string;
  claim_idempotency_key: string | null;
  created_at: Date;
};

export type SessionDTO = {
  sessionId: string;
  state: string;
  fundingTxHash: string | null;
  publicRef: string;
};

export type ClaimResult = {
  runId: string;
  state: string;
  levelIndex: number;
  stateVersion: number;
};

const FUNDING_REFERENCE_PREFIX = "LBA1:";
const FUNDING_DEADLINE_MS = 30 * 60 * 1000;

export function isPgUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
}

export function fundingReference(publicRef: string): string {
  return `${FUNDING_REFERENCE_PREFIX}${publicRef}`;
}

function toSessionDTO(row: SessionRow, fundingTxHash: string | null): SessionDTO {
  return {
    sessionId: row.id,
    state: row.state,
    fundingTxHash,
    publicRef: row.public_ref,
  };
}

async function loadSession(sessionId: string): Promise<SessionRow | null> {
  const result = await query<SessionRow>(
    `SELECT id, public_ref, requester_type, state, network_id, treasury_address,
            expected_funding_luna, reward_per_answer_luna, max_consultations,
            max_reward_liability_luna, reserved_liability_luna, unused_credit_luna,
            funding_deadline, claimed_by_player_run_id, creation_idempotency_key,
            funding_transfer_started_at, created_at, updated_at
       FROM requester_sessions
      WHERE id = $1`,
    [sessionId],
  );
  return result.rows[0] ?? null;
}

async function loadFunding(sessionId: string): Promise<FundingRow | null> {
  const result = await query<FundingRow>(
    `SELECT id, requester_session_id, tx_hash, sender_address, recipient_address,
            amount_luna, network_id, reference, status, block_height, included_at,
            verified_at, verification_error
       FROM funding_transactions
      WHERE requester_session_id = $1`,
    [sessionId],
  );
  return result.rows[0] ?? null;
}

async function markFundingFailed(
  sessionId: string,
  code: string,
  actorType: "DEMO_AGENT" | "SYSTEM" = "DEMO_AGENT",
): Promise<void> {
  await withTransaction(async (client) => {
    const result = await client.query<{ state: string }>(
      `SELECT state FROM requester_sessions WHERE id = $1 FOR UPDATE`,
      [sessionId],
    );
    const session = result.rows[0];
    if (!session) return;
    if (session.state !== "AWAITING_FUNDING" && session.state !== "FUNDING_PENDING") {
      return;
    }
    assertTransition("requester_session", session.state, "FUNDING_FAILED");
    await client.query(
      `UPDATE requester_sessions
          SET state = 'FUNDING_FAILED', updated_at = now()
        WHERE id = $1`,
      [sessionId],
    );
    await recordAudit(client, {
      actorType,
      action: "funding_failed",
      resourceType: "requester_session",
      resourceId: sessionId,
      details: { code },
    });
  });
}

async function markFundingRejected(
  sessionId: string,
  fundingId: string,
  reason: string,
): Promise<void> {
  await withTransaction(async (client) => {
    await client.query(
      `UPDATE funding_transactions
          SET status = 'REJECTED', verification_error = $2, updated_at = now()
        WHERE id = $1`,
      [fundingId, reason],
    );
    const result = await client.query<{ state: string }>(
      `SELECT state FROM requester_sessions WHERE id = $1 FOR UPDATE`,
      [sessionId],
    );
    const session = result.rows[0];
    if (
      session &&
      (session.state === "AWAITING_FUNDING" || session.state === "FUNDING_PENDING")
    ) {
      assertTransition("requester_session", session.state, "FUNDING_FAILED");
      await client.query(
        `UPDATE requester_sessions
            SET state = 'FUNDING_FAILED', updated_at = now()
          WHERE id = $1`,
        [sessionId],
      );
    }
    await recordAudit(client, {
      actorType: "SYSTEM",
      action: "funding_rejected",
      resourceType: "requester_session",
      resourceId: sessionId,
      details: { reason },
    });
  });
}

async function activateFunding(
  session: SessionRow,
  funding: FundingRow,
  transaction: {
    transactionHash: string;
    sender: string;
    recipient: string;
    valueLuna: string;
    network: string;
    blockHeight?: number;
  },
): Promise<SessionDTO> {
  try {
    await withTransaction(async (client) => {
      const lockedResult = await client.query<SessionRow>(
        `SELECT id, public_ref, requester_type, state, network_id, treasury_address,
                expected_funding_luna, reward_per_answer_luna, max_consultations,
                max_reward_liability_luna, reserved_liability_luna, unused_credit_luna,
                funding_deadline, claimed_by_player_run_id, creation_idempotency_key,
                funding_transfer_started_at, created_at, updated_at
           FROM requester_sessions
          WHERE id = $1
          FOR UPDATE`,
        [session.id],
      );
      const locked = lockedResult.rows[0];
      if (!locked) throw errors.notFound("Session not found.");
      if (locked.state === "AVAILABLE" || locked.state === "FUNDED") return;
      if (
        locked.state !== "AWAITING_FUNDING" &&
        locked.state !== "FUNDING_PENDING"
      ) {
        throw errors.conflict(
          "SESSION_STATE_CONFLICT",
          "Session cannot be activated from its current state.",
        );
      }

      const duplicate = await client.query<{ requester_session_id: string }>(
        `SELECT requester_session_id
           FROM funding_transactions
          WHERE tx_hash = $1 AND requester_session_id <> $2
          LIMIT 1`,
        [transaction.transactionHash, session.id],
      );
      if (duplicate.rows[0]) {
        throw errors.conflict(
          "FUNDING_TX_REUSED",
          "This funding transaction already belongs to another session.",
        );
      }

      await client.query(
        `UPDATE funding_transactions
            SET status = 'VERIFIED',
                sender_address = $2,
                recipient_address = $3,
                amount_luna = $4,
                network_id = 'testnet',
                reference = $5,
                block_height = $6,
                included_at = now(),
                verified_at = now(),
                verification_error = NULL,
                updated_at = now()
          WHERE id = $1`,
        [
          funding.id,
          transaction.sender,
          transaction.recipient,
          String(transaction.valueLuna),
          funding.reference,
          transaction.blockHeight ?? null,
        ],
      );

      await client.query(
        `INSERT INTO ledger_entries
           (requester_session_id, player_run_id, entry_type, amount_luna, direction,
            idempotency_key, external_ref, metadata)
         VALUES ($1, NULL, 'FUNDING_CONFIRMED', $2, 'CREDIT', $3, $4, $5)
         ON CONFLICT (idempotency_key) DO NOTHING`,
        [
          session.id,
          locked.expected_funding_luna,
          `funding_confirmed:${session.id}`,
          transaction.transactionHash,
          JSON.stringify({
            network: transaction.network,
            blockHeight: transaction.blockHeight ?? null,
          }),
        ],
      );

      assertTransition("requester_session", locked.state, "FUNDED");
      await client.query(
        `UPDATE requester_sessions
            SET state = 'FUNDED',
                reserved_liability_luna = max_reward_liability_luna,
                updated_at = now()
          WHERE id = $1`,
        [session.id],
      );

      assertTransition("requester_session", "FUNDED", "AVAILABLE");
      await client.query(
        `UPDATE requester_sessions
            SET state = 'AVAILABLE', updated_at = now()
          WHERE id = $1`,
        [session.id],
      );

      await recordAudit(client, {
        actorType: "DEMO_AGENT",
        action: "funding_verified",
        resourceType: "requester_session",
        resourceId: session.id,
        details: {
          txHash: transaction.transactionHash,
          blockHeight: transaction.blockHeight ?? null,
          amountLuna: String(transaction.valueLuna),
          reference: funding.reference,
        },
      });
    });
  } catch (error) {
    if (error instanceof AppError && error.code === "FUNDING_TX_REUSED") {
      await markFundingRejected(session.id, funding.id, "DUPLICATE_TX_HASH");
      return {
        ...toSessionDTO(session, funding.tx_hash),
        state: "FUNDING_FAILED",
      };
    }
    throw error;
  }

  const refreshed = await loadSession(session.id);
  const fundingRow = await loadFunding(session.id);
  return toSessionDTO(refreshed ?? session, fundingRow?.tx_hash ?? funding.tx_hash);
}

export async function verifyFundingForSession(
  sessionId: string,
  nimiq: NimiqService,
  options: { attempts?: number; intervalMs?: number } = {},
): Promise<SessionDTO> {
  const session = await loadSession(sessionId);
  if (!session) throw errors.notFound("Session not found.");
  const funding = await loadFunding(sessionId);
  if (!funding) return toSessionDTO(session, null);

  if (
    (session.state === "AVAILABLE" || session.state === "FUNDED") &&
    funding.status === "VERIFIED"
  ) {
    return toSessionDTO(session, funding.tx_hash);
  }
  if (
    session.state === "FUNDING_FAILED" ||
    session.state === "CANCELLED" ||
    session.state === "EXPIRED"
  ) {
    return toSessionDTO(session, funding.tx_hash);
  }

  const attempts = options.attempts ?? 40;
  const intervalMs = options.intervalMs ?? 3_000;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    let verification;
    try {
      verification = await nimiq.verifyIncomingFunding({
        txHash: funding.tx_hash,
        expectedSender: config.nimiqDemoAgentAddress,
        expectedRecipient: session.treasury_address,
        minimumAmountLuna: toLuna(session.expected_funding_luna),
        expectedReference: funding.reference,
      });
    } catch {
      verification = null;
    }

    if (verification?.verified && verification.transaction) {
      return activateFunding(session, funding, verification.transaction);
    }

    if (verification && verification.reason !== "NOT_INCLUDED") {
      await markFundingRejected(session.id, funding.id, verification.reason);
      return {
        ...toSessionDTO(session, funding.tx_hash),
        state: "FUNDING_FAILED",
      };
    }

    if (attempt < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  await query(
    `UPDATE funding_transactions
        SET verification_error = 'NOT_INCLUDED_YET', updated_at = now()
      WHERE id = $1`,
    [funding.id],
  );
  return {
    ...toSessionDTO(session, funding.tx_hash),
    state: "FUNDING_PENDING",
  };
}

async function sendDemoFunding(
  session: SessionRow,
  nimiq: NimiqService,
  logger: LoggerLike,
): Promise<void> {
  if (!config.nimiqDemoAgentPrivateKey) {
    await markFundingFailed(session.id, "DEMO_AGENT_KEY_NOT_CONFIGURED");
    throw errors.unavailable("Demo-agent signing is not configured.");
  }

  await withTransaction(async (client) => {
    const result = await client.query<{ state: string }>(
      `SELECT state FROM requester_sessions WHERE id = $1 FOR UPDATE`,
      [session.id],
    );
    const current = result.rows[0];
    if (!current) throw errors.notFound("Session not found.");
    if (current.state !== "AWAITING_FUNDING") {
      throw errors.conflict(
        "SESSION_STATE_CONFLICT",
        "Session is not awaiting funding.",
      );
    }
    assertTransition("requester_session", "AWAITING_FUNDING", "FUNDING_PENDING");
    await client.query(
      `UPDATE requester_sessions
          SET state = 'FUNDING_PENDING',
              funding_transfer_started_at = now(),
              updated_at = now()
        WHERE id = $1`,
      [session.id],
    );
    await recordAudit(client, {
      actorType: "DEMO_AGENT",
      action: "funding_transfer_started",
      resourceType: "requester_session",
      resourceId: session.id,
      details: { reference: fundingReference(session.public_ref) },
    });
  });

  let sent: { txHash: string } | null = null;
  try {
    const [consensus, account] = await Promise.all([
      nimiq.waitForConsensus(60_000),
      nimiq.getAccount(config.nimiqDemoAgentAddress),
    ]);
    if (!consensus) {
      throw new Error("Testnet consensus was not available");
    }
    const required = toLuna(session.expected_funding_luna);
    if (toLuna(account.balanceLuna) < required) {
      throw new Error("Demo-agent balance is insufficient");
    }

    sent = await nimiq.buildSignAndBroadcastBasicTransfer({
      fromAddress: config.nimiqDemoAgentAddress,
      privateKeyHex: config.nimiqDemoAgentPrivateKey,
      toAddress: session.treasury_address,
      amountLuna: required,
      data: fundingReference(session.public_ref),
    });
  } catch (error) {
    await markFundingFailed(session.id, "FUNDING_TRANSFER_FAILED");
    logger.error(
      {
        event: "demo_funding_send_failed",
        sessionId: session.id,
        message: error instanceof Error ? error.message : "unknown",
      },
      "Demo funding transfer failed",
    );
    throw errors.unavailable("The demo funding transfer could not be submitted.");
  }

  try {
    await withTransaction(async (client) => {
      const locked = await client.query<{ state: string }>(
        `SELECT state FROM requester_sessions WHERE id = $1 FOR UPDATE`,
        [session.id],
      );
      const state = locked.rows[0]?.state;
      if (!state || state !== "FUNDING_PENDING") {
        throw errors.conflict(
          "SESSION_STATE_CONFLICT",
          "Session is not pending funding.",
        );
      }

      const duplicate = await client.query<{ id: string }>(
        `SELECT id FROM funding_transactions WHERE tx_hash = $1 LIMIT 1`,
        [sent!.txHash],
      );
      if (duplicate.rows[0]) {
        throw errors.conflict(
          "FUNDING_TX_REUSED",
          "This funding transaction already exists.",
        );
      }

      await client.query(
        `INSERT INTO funding_transactions
           (requester_session_id, tx_hash, sender_address, recipient_address,
            amount_luna, network_id, reference, status)
         VALUES ($1, $2, $3, $4, $5, 'testnet', $6, 'PENDING')`,
        [
          session.id,
          sent.txHash,
          config.nimiqDemoAgentAddress,
          session.treasury_address,
          session.expected_funding_luna,
          fundingReference(session.public_ref),
        ],
      );
      await recordAudit(client, {
        actorType: "DEMO_AGENT",
        action: "funding_transfer_broadcast",
        resourceType: "requester_session",
        resourceId: session.id,
        details: { txHash: sent.txHash },
      });
    });
  } catch (error) {
    if (error instanceof AppError && error.code === "FUNDING_TX_REUSED") {
      await markFundingFailed(session.id, "DUPLICATE_TX_HASH");
      throw error;
    }
    logger.error(
      {
        event: "demo_funding_persist_failed",
        sessionId: session.id,
        txHash: sent.txHash,
        message: error instanceof Error ? error.message : "unknown",
      },
      "Funding transfer was broadcast but could not be persisted",
    );
    throw errors.unavailable(
      "The funding transfer was broadcast but its record needs reconciliation.",
    );
  }
}

export async function createDemoSession(input: {
  idempotencyKey: string;
  nimiq: NimiqService;
  logger: LoggerLike;
}): Promise<SessionDTO> {
  if (!config.demoFundingEnabled) {
    throw errors.forbidden("Demo funding is disabled.");
  }
  if (config.appEnv === "production") {
    throw errors.forbidden("Demo funding is not allowed in production.");
  }
  if (!config.nimiqDemoAgentPrivateKey) {
    throw errors.unavailable("Demo-agent signing is not configured.");
  }

  const existing = await query<SessionRow>(
    `SELECT id, public_ref, requester_type, state, network_id, treasury_address,
            expected_funding_luna, reward_per_answer_luna, max_consultations,
            max_reward_liability_luna, reserved_liability_luna, unused_credit_luna,
            funding_deadline, claimed_by_player_run_id, creation_idempotency_key,
            funding_transfer_started_at, created_at, updated_at
       FROM requester_sessions
      WHERE creation_idempotency_key = $1`,
    [input.idempotencyKey],
  );
  if (existing.rows[0]) {
    return resumeDemoSession(existing.rows[0], input.nimiq, input.logger);
  }

  const publicRef = randomBytes(8).toString("hex");
  const fundingDeadline = new Date(Date.now() + FUNDING_DEADLINE_MS);
  let session: SessionRow;
  try {
    const result = await query<SessionRow>(
      `INSERT INTO requester_sessions
         (public_ref, requester_type, state, network_id, treasury_address,
          expected_funding_luna, reward_per_answer_luna, max_consultations,
          max_reward_liability_luna, reserved_liability_luna, unused_credit_luna,
          funding_deadline, creation_idempotency_key)
       VALUES ($1, 'SCRIPTED_DEMO', 'AWAITING_FUNDING', 'testnet', $2,
               $3, $4, $5, $6, 0, 0, $7, $8)
       RETURNING id, public_ref, requester_type, state, network_id, treasury_address,
                 expected_funding_luna, reward_per_answer_luna, max_consultations,
                 max_reward_liability_luna, reserved_liability_luna, unused_credit_luna,
                 funding_deadline, claimed_by_player_run_id, creation_idempotency_key,
                 funding_transfer_started_at, created_at, updated_at`,
      [
        publicRef,
        config.nimiqTreasuryAddress,
        String(config.maxRewardLiabilityLuna),
        String(config.rewardPerAnswerLuna),
        config.maxConsultations,
        String(config.maxRewardLiabilityLuna),
        fundingDeadline,
        input.idempotencyKey,
      ],
    );
    session = result.rows[0];
  } catch (error) {
    if (isPgUniqueViolation(error)) {
      const replay = await query<SessionRow>(
        `SELECT id, public_ref, requester_type, state, network_id, treasury_address,
                expected_funding_luna, reward_per_answer_luna, max_consultations,
                max_reward_liability_luna, reserved_liability_luna, unused_credit_luna,
                funding_deadline, claimed_by_player_run_id, creation_idempotency_key,
                funding_transfer_started_at, created_at, updated_at
           FROM requester_sessions
          WHERE creation_idempotency_key = $1`,
        [input.idempotencyKey],
      );
      if (replay.rows[0]) {
        return resumeDemoSession(replay.rows[0], input.nimiq, input.logger);
      }
    }
    throw error;
  }

  await sendDemoFunding(session, input.nimiq, input.logger);
  return verifyFundingForSession(session.id, input.nimiq, {
    attempts: 20,
    intervalMs: 3_000,
  });
}

async function resumeDemoSession(
  session: SessionRow,
  nimiq: NimiqService,
  logger: LoggerLike,
): Promise<SessionDTO> {
  const funding = await loadFunding(session.id);
  if (funding) {
    return verifyFundingForSession(session.id, nimiq);
  }
  if (session.funding_transfer_started_at) {
    return {
      ...toSessionDTO(session, null),
      state: session.state,
    };
  }
  if (session.state !== "AWAITING_FUNDING") {
    return { sessionId: session.id, state: session.state, fundingTxHash: null, publicRef: session.public_ref };
  }
  await sendDemoFunding(session, nimiq, logger);
  return verifyFundingForSession(session.id, nimiq, {
    attempts: 20,
    intervalMs: 3_000,
  });
}

export async function listAvailableSessions(): Promise<
  Array<{
    id: string;
    publicRef: string;
    maxConsultations: number;
    rewardPerAnswerLuna: string;
    maxRewardLuna: string;
    funded: true;
    state: string;
  }>
> {
  const result = await query<{
    id: string;
    public_ref: string;
    max_consultations: number;
    reward_per_answer_luna: string;
    max_reward_liability_luna: string;
    state: string;
  }>(
    `SELECT s.id, s.public_ref, s.max_consultations, s.reward_per_answer_luna,
            s.max_reward_liability_luna, s.state
       FROM requester_sessions s
      WHERE s.state = 'AVAILABLE'
        AND s.claimed_by_player_run_id IS NULL
        AND s.funding_deadline > now()
        AND EXISTS (
          SELECT 1 FROM funding_transactions f
           WHERE f.requester_session_id = s.id AND f.status = 'VERIFIED'
        )
      ORDER BY s.created_at ASC
      LIMIT 50`,
  );

  return result.rows.map((row) => ({
    id: row.id,
    publicRef: row.public_ref,
    maxConsultations: row.max_consultations,
    rewardPerAnswerLuna: lunaString(row.reward_per_answer_luna),
    maxRewardLuna: lunaString(row.max_reward_liability_luna),
    funded: true as const,
    state: row.state,
  }));
}

async function findRunByClaimKey(
  client: PoolClient,
  idempotencyKey: string,
): Promise<RunRow | null> {
  const result = await client.query<RunRow>(
    `SELECT id, requester_session_id, player_id, state, level_index, state_version,
            reward_earned_luna, claim_idempotency_key, created_at
       FROM player_runs
      WHERE claim_idempotency_key = $1`,
    [idempotencyKey],
  );
  return result.rows[0] ?? null;
}

export async function claimSession(input: {
  playerId: string;
  sessionId: string;
  idempotencyKey: string;
}): Promise<ClaimResult> {
  return withTransaction(async (client) => {
    const replay = await findRunByClaimKey(client, input.idempotencyKey);
    if (replay) {
      if (
        replay.player_id !== input.playerId ||
        replay.requester_session_id !== input.sessionId
      ) {
        throw errors.conflict(
          "IDEMPOTENCY_KEY_REUSED",
          "This idempotency key belongs to a different claim.",
        );
      }
      return {
        runId: replay.id,
        state: replay.state,
        levelIndex: replay.level_index,
        stateVersion: replay.state_version,
      };
    }

    const sessionResult = await client.query<SessionRow>(
      `SELECT id, public_ref, requester_type, state, network_id, treasury_address,
              expected_funding_luna, reward_per_answer_luna, max_consultations,
              max_reward_liability_luna, reserved_liability_luna, unused_credit_luna,
              funding_deadline, claimed_by_player_run_id, creation_idempotency_key,
              funding_transfer_started_at, created_at, updated_at
         FROM requester_sessions
        WHERE id = $1
        FOR UPDATE`,
      [input.sessionId],
    );
    const session = sessionResult.rows[0];
    if (!session) throw errors.notFound("Session not found.");

    if (
      session.state !== "AVAILABLE" ||
      session.claimed_by_player_run_id !== null
    ) {
      throw errors.conflict(
        "SESSION_UNAVAILABLE",
        "This session is no longer available.",
      );
    }
    if (session.network_id !== "testnet") {
      throw errors.unprocessable(
        "SESSION_NOT_FUNDED",
        "This session is not funded on the expected network.",
      );
    }
    if (session.funding_deadline.getTime() <= Date.now()) {
      throw errors.conflict("SESSION_EXPIRED", "This session has expired.");
    }

    const funding = await client.query<{ status: string }>(
      `SELECT status FROM funding_transactions
        WHERE requester_session_id = $1
        FOR SHARE`,
      [session.id],
    );
    if (funding.rows[0]?.status !== "VERIFIED") {
      throw errors.unprocessable(
        "SESSION_NOT_FUNDED",
        "This session is not available yet.",
      );
    }

    const player = await client.query<{ status: string }>(
      `SELECT status FROM players WHERE id = $1`,
      [input.playerId],
    );
    if (!player.rows[0] || player.rows[0].status !== "ACTIVE") {
      throw errors.forbidden("Player account is not active.");
    }

    const active = await client.query<{ id: string }>(
      `SELECT id FROM player_runs
        WHERE player_id = $1 AND state IN ('IN_PROGRESS', 'CONSULTATION_PENDING')
        LIMIT 1`,
      [input.playerId],
    );
    if (active.rows[0]) {
      throw errors.conflict(
        "ACTIVE_RUN_EXISTS",
        "You already have an active run.",
      );
    }

    let run: RunRow;
    try {
      const runResult = await client.query<RunRow>(
        `INSERT INTO player_runs
           (requester_session_id, player_id, state, level_index, portfolio_state,
            state_version, reward_earned_luna, claim_idempotency_key)
         VALUES ($1, $2, 'IN_PROGRESS', 1, $3, 0, 0, $4)
         RETURNING id, requester_session_id, player_id, state, level_index,
                   state_version, reward_earned_luna, claim_idempotency_key, created_at`,
        [
          session.id,
          input.playerId,
          JSON.stringify({
            unit: "vUSDT",
            value: lunaString(STARTING_PORTFOLIO_UNITS),
            version: PORTFOLIO_VERSION,
          }),
          input.idempotencyKey,
        ],
      );
      run = runResult.rows[0];
    } catch (error) {
      if (isPgUniqueViolation(error)) {
        const replayAfterRace = await findRunByClaimKey(
          client,
          input.idempotencyKey,
        );
        if (replayAfterRace) {
          return {
            runId: replayAfterRace.id,
            state: replayAfterRace.state,
            levelIndex: replayAfterRace.level_index,
            stateVersion: replayAfterRace.state_version,
          };
        }
        throw errors.conflict(
          "SESSION_UNAVAILABLE",
          "This session is no longer available.",
        );
      }
      throw error;
    }

    assertTransition("requester_session", "AVAILABLE", "CLAIMED");
    await client.query(
      `UPDATE requester_sessions
          SET state = 'CLAIMED', claimed_by_player_run_id = $2, updated_at = now()
        WHERE id = $1`,
      [session.id, run.id],
    );
    assertTransition("requester_session", "CLAIMED", "IN_PROGRESS");
    await client.query(
      `UPDATE requester_sessions
          SET state = 'IN_PROGRESS', updated_at = now()
        WHERE id = $1`,
      [session.id],
    );

    await recordAudit(client, {
      actorType: "PLAYER",
      actorId: input.playerId,
      action: "session_claimed",
      resourceType: "player_run",
      resourceId: run.id,
      details: { sessionId: session.id },
    });

    return {
      runId: run.id,
      state: run.state,
      levelIndex: run.level_index,
      stateVersion: run.state_version,
    };
  });
}
