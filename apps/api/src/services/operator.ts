import { query, withTransaction } from "../db";
import { lunaString } from "../domain/money";
import { recordAudit } from "./audit";

type Cursor = { createdAt: Date; id: string } | null;

function decodeCursor(cursor: string | undefined): Cursor {
  if (!cursor) return null;
  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    const [createdAt, id] = decoded.split("|");
    if (!createdAt || !id) return null;
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) return null;
    return { createdAt: date, id };
  } catch {
    return null;
  }
}

function encodeCursor(createdAt: Date, id: string): string {
  return Buffer.from(`${createdAt.toISOString()}|${id}`, "utf8").toString(
    "base64url",
  );
}

export async function listOperatorSessions(input: {
  limit: number;
  cursor?: string;
}) {
  const limit = Math.min(Math.max(input.limit, 1), 100);
  const cursor = decodeCursor(input.cursor);
  const params: unknown[] = [];
  let cursorClause = "";
  if (cursor) {
    params.push(cursor.createdAt, cursor.id);
    cursorClause = `WHERE (s.created_at, s.id) < ($1, $2)`;
  }
  params.push(limit + 1);
  const result = await query<{
    id: string;
    public_ref: string;
    state: string;
    network_id: string;
    expected_funding_luna: string;
    reward_per_answer_luna: string;
    max_reward_liability_luna: string;
    reserved_liability_luna: string;
    unused_credit_luna: string;
    funding_deadline: Date;
    created_at: Date;
    updated_at: Date;
    funding_tx_hash: string | null;
    funding_status: string | null;
    funding_block_height: string | null;
    funding_verified_at: Date | null;
    run_id: string | null;
    run_state: string | null;
    payout_id: string | null;
    payout_status: string | null;
  }>(
    `SELECT s.id, s.public_ref, s.state, s.network_id, s.expected_funding_luna,
            s.reward_per_answer_luna, s.max_reward_liability_luna,
            s.reserved_liability_luna, s.unused_credit_luna, s.funding_deadline,
            s.created_at, s.updated_at,
            f.tx_hash AS funding_tx_hash, f.status AS funding_status,
            f.block_height AS funding_block_height, f.verified_at AS funding_verified_at,
            r.id AS run_id, r.state AS run_state,
            p.id AS payout_id, p.status AS payout_status
       FROM requester_sessions s
       LEFT JOIN funding_transactions f ON f.requester_session_id = s.id
       LEFT JOIN player_runs r ON r.requester_session_id = s.id
       LEFT JOIN payouts p ON p.player_run_id = r.id
       ${cursorClause}
      ORDER BY s.created_at DESC, s.id DESC
      LIMIT $${params.length}`,
    params,
  );
  const rows = result.rows.slice(0, limit);
  const next = result.rows.length > limit ? rows[rows.length - 1] : null;
  return {
    items: rows.map((row) => ({
      sessionId: row.id,
      publicRef: row.public_ref,
      state: row.state,
      networkId: row.network_id,
      expectedFundingLuna: lunaString(row.expected_funding_luna),
      rewardPerAnswerLuna: lunaString(row.reward_per_answer_luna),
      maxRewardLiabilityLuna: lunaString(row.max_reward_liability_luna),
      reservedLiabilityLuna: lunaString(row.reserved_liability_luna),
      unusedCreditLuna: lunaString(row.unused_credit_luna),
      fundingDeadline: row.funding_deadline.toISOString(),
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      funding: row.funding_tx_hash
        ? {
            txHash: row.funding_tx_hash,
            status: row.funding_status,
            blockHeight: row.funding_block_height,
            verifiedAt: row.funding_verified_at?.toISOString() ?? null,
          }
        : null,
      runId: row.run_id,
      runState: row.run_state,
      payoutId: row.payout_id,
      payoutStatus: row.payout_status,
    })),
    nextCursor: next ? encodeCursor(next.created_at, next.id) : null,
  };
}

export async function listOperatorPayouts(input: {
  limit: number;
  cursor?: string;
}) {
  const limit = Math.min(Math.max(input.limit, 1), 100);
  const cursor = decodeCursor(input.cursor);
  const params: unknown[] = [];
  let cursorClause = "";
  if (cursor) {
    params.push(cursor.createdAt, cursor.id);
    cursorClause = `WHERE (p.created_at, p.id) < ($1, $2)`;
  }
  params.push(limit + 1);
  const result = await query<{
    id: string;
    player_run_id: string;
    recipient_address: string;
    amount_luna: string;
    network_id: string;
    status: string;
    tx_hash: string | null;
    failure_code: string | null;
    failure_message_safe: string | null;
    attempt_count: number;
    submitted_at: Date | null;
    confirmed_at: Date | null;
    created_at: Date;
    updated_at: Date;
    public_ref: string;
  }>(
    `SELECT p.id, p.player_run_id, p.recipient_address, p.amount_luna, p.network_id,
            p.status, p.tx_hash, p.failure_code, p.failure_message_safe,
            p.attempt_count, p.submitted_at, p.confirmed_at, p.created_at, p.updated_at,
            s.public_ref
       FROM payouts p
       JOIN player_runs r ON r.id = p.player_run_id
       JOIN requester_sessions s ON s.id = r.requester_session_id
       ${cursorClause}
      ORDER BY p.created_at DESC, p.id DESC
      LIMIT $${params.length}`,
    params,
  );
  const rows = result.rows.slice(0, limit);
  const next = result.rows.length > limit ? rows[rows.length - 1] : null;
  return {
    items: rows.map((row) => ({
      payoutId: row.id,
      runId: row.player_run_id,
      publicRef: row.public_ref,
      recipientAddress: row.recipient_address,
      amountLuna: lunaString(row.amount_luna),
      networkId: row.network_id,
      status: row.status,
      txHash: row.tx_hash,
      failureCode: row.failure_code,
      failureMessageSafe: row.failure_message_safe,
      attemptCount: row.attempt_count,
      submittedAt: row.submitted_at?.toISOString() ?? null,
      confirmedAt: row.confirmed_at?.toISOString() ?? null,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    })),
    nextCursor: next ? encodeCursor(next.created_at, next.id) : null,
  };
}

export async function recordOperatorAction(input: {
  operatorId: string;
  action: string;
  resourceId: string;
  requestId: string;
  idempotencyKey: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  await withTransaction(async (client) => {
    await recordAudit(client, {
      actorType: "OPERATOR",
      actorId: input.operatorId,
      action: input.action,
      resourceType: "payout",
      resourceId: input.resourceId,
      requestId: input.requestId,
      details: {
        ...input.details,
        idempotencyKey: input.idempotencyKey,
      },
    });
  });
}

export async function listAuditEvents(input: {
  limit: number;
  cursor?: string;
}) {
  const limit = Math.min(Math.max(input.limit, 1), 100);
  const cursor = decodeCursor(input.cursor);
  const params: unknown[] = [];
  let cursorClause = "";
  if (cursor) {
    params.push(cursor.createdAt, cursor.id);
    cursorClause = `WHERE (created_at, id) < ($1, $2)`;
  }
  params.push(limit + 1);
  const result = await query<{
    id: string;
    actor_type: string;
    actor_id: string | null;
    action: string;
    resource_type: string;
    resource_id: string;
    request_id: string | null;
    details_redacted: unknown;
    created_at: Date;
  }>(
    `SELECT id, actor_type, actor_id, action, resource_type, resource_id,
            request_id, details_redacted, created_at
       FROM audit_events
       ${cursorClause}
      ORDER BY created_at DESC, id DESC
      LIMIT $${params.length}`,
    params,
  );
  const rows = result.rows.slice(0, limit);
  const next = result.rows.length > limit ? rows[rows.length - 1] : null;
  return {
    items: rows.map((row) => ({
      auditEventId: row.id,
      actorType: row.actor_type,
      actorId: row.actor_id,
      action: row.action,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      requestId: row.request_id,
      details: row.details_redacted,
      createdAt: row.created_at.toISOString(),
    })),
    nextCursor: next ? encodeCursor(next.created_at, next.id) : null,
  };
}
