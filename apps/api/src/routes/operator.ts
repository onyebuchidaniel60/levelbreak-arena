import { timingSafeEqual } from "node:crypto";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { config } from "../config";
import { errors } from "../errors";
import { lunaString } from "../domain/money";
import type { NimiqService } from "../nimiq/types";
import {
  createDemoSession,
  type LoggerLike,
} from "../services/sessions";
import {
  listAuditEvents,
  listOperatorPayouts,
  listOperatorSessions,
  recordOperatorAction,
} from "../services/operator";
import { reconcilePayout, requeuePayout } from "../services/payouts";

const IdempotencyKey = z.string().uuid();
const DemoSessionBody = z.object({ idempotencyKey: IdempotencyKey });
const PayoutParams = z.object({ payoutId: z.string().uuid() });
const ReconcileBody = z.object({ idempotencyKey: IdempotencyKey });
const RequeueBody = z.object({
  idempotencyKey: IdempotencyKey,
  confirmation: z.literal("REQUEUE"),
});
const PageQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().max(500).optional(),
});

function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw errors.badRequest("INVALID_REQUEST", "Invalid request.");
  }
  return result.data;
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function requireOperator(request: FastifyRequest): string {
  const configured = config.operatorAuthSecret;
  if (!configured) {
    throw errors.unavailable("Operator access is not configured.");
  }
  const supplied = request.headers["x-operator-secret"];
  if (typeof supplied !== "string" || !safeEqual(supplied, configured)) {
    throw errors.forbidden("Operator credentials are invalid.");
  }
  const suppliedId = request.headers["x-operator-id"];
  if (typeof suppliedId === "string" && /^[A-Za-z0-9._-]{1,100}$/.test(suppliedId)) {
    return suppliedId;
  }
  return "operator";
}

function payoutSummary(row: {
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
}) {
  return {
    payoutId: row.id,
    runId: row.player_run_id,
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
  };
}

export async function registerOperatorRoutes(
  app: FastifyInstance,
  dependencies: { nimiq: NimiqService; logger: LoggerLike },
): Promise<void> {
  app.post(
    "/api/operator/demo-sessions",
    { config: { rateLimit: { max: 5, timeWindow: "1 minute" } } },
    async (request) => {
      requireOperator(request);
      const body = parse(DemoSessionBody, request.body);
      const result = await createDemoSession({
        idempotencyKey: body.idempotencyKey,
        nimiq: dependencies.nimiq,
        logger: dependencies.logger,
      });
      return {
        sessionId: result.sessionId,
        state: result.state,
        fundingTxHash: result.fundingTxHash,
      };
    },
  );

  app.get(
    "/api/operator/sessions",
    { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } },
    async (request) => {
      requireOperator(request);
      const query = parse(PageQuery, request.query);
      return listOperatorSessions(query);
    },
  );

  app.get(
    "/api/operator/payouts",
    { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } },
    async (request) => {
      requireOperator(request);
      const query = parse(PageQuery, request.query);
      return listOperatorPayouts(query);
    },
  );

  app.get(
    "/api/operator/audit-events",
    { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } },
    async (request) => {
      requireOperator(request);
      const query = parse(PageQuery, request.query);
      return listAuditEvents(query);
    },
  );

  app.post(
    "/api/operator/payouts/:payoutId/reconcile",
    { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } },
    async (request) => {
      const operatorId = requireOperator(request);
      const params = parse(PayoutParams, request.params);
      const body = parse(ReconcileBody, request.body);
      const payout = await reconcilePayout({
        payoutId: params.payoutId,
        nimiq: dependencies.nimiq,
      });
      await recordOperatorAction({
        operatorId,
        action: "payout_reconciled",
        resourceId: payout.id,
        requestId: request.id,
        idempotencyKey: body.idempotencyKey,
        details: { status: payout.status, txHash: payout.tx_hash },
      });
      return payoutSummary(payout);
    },
  );

  app.post(
    "/api/operator/payouts/:payoutId/requeue",
    { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } },
    async (request) => {
      const operatorId = requireOperator(request);
      const params = parse(PayoutParams, request.params);
      const body = parse(RequeueBody, request.body);
      const payout = await requeuePayout({
        payoutId: params.payoutId,
        operatorId,
      });
      await recordOperatorAction({
        operatorId,
        action: "payout_requeued",
        resourceId: payout.id,
        requestId: request.id,
        idempotencyKey: body.idempotencyKey,
        details: { status: payout.status, attemptCount: payout.attempt_count },
      });
      return payoutSummary(payout);
    },
  );
}
