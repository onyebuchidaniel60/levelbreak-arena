import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { authenticate, requireCsrf } from "../auth";
import { errors } from "../errors";
import {
  claimSession,
  listAvailableSessions,
} from "../services/sessions";
import {
  finishRun,
  getHistory,
  getPayoutForRun,
  getRunDetail,
  submitConsultationResponse,
  submitDecision,
} from "../services/game";

const IdempotencyKey = z.string().uuid();
const ExpectedVersion = z.number().int().min(0);

const ClaimBody = z.object({ idempotencyKey: IdempotencyKey });
const DecisionBody = z.object({
  levelIndex: z.number().int().min(1).max(3),
  decisionKey: z.string().min(1).max(40),
  expectedStateVersion: ExpectedVersion,
  idempotencyKey: IdempotencyKey,
});
const RespondBody = z
  .object({
    action: z.enum(["ANSWER", "SKIP"]),
    answerKey: z.string().min(1).max(40).optional(),
    expectedStateVersion: ExpectedVersion,
    idempotencyKey: IdempotencyKey,
  })
  .superRefine((value, ctx) => {
    if (value.action === "ANSWER" && !value.answerKey) {
      ctx.addIssue({
        code: "custom",
        path: ["answerKey"],
        message: "answerKey is required for ANSWER",
      });
    }
    if (value.action === "SKIP" && value.answerKey) {
      ctx.addIssue({
        code: "custom",
        path: ["answerKey"],
        message: "answerKey must be omitted for SKIP",
      });
    }
  });
const FinishBody = z.object({ idempotencyKey: IdempotencyKey });
const HistoryQuery = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().max(500).optional(),
});
const IdParams = z.object({ runId: z.string().uuid() });
const SessionParams = z.object({ sessionId: z.string().uuid() });
const QuestionParams = z.object({
  runId: z.string().uuid(),
  questionId: z.string().min(1).max(100),
});

function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw errors.badRequest("INVALID_REQUEST", "Invalid request.");
  }
  return result.data;
}

export async function registerPlayerRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    "/api/sessions/available",
    { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } },
    async (request) => {
      await authenticate(request);
      return { sessions: await listAvailableSessions() };
    },
  );

  app.post(
    "/api/sessions/:sessionId/claim",
    { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } },
    async (request: FastifyRequest) => {
      const session = await authenticate(request);
      requireCsrf(request);
      const params = parse(SessionParams, request.params);
      const body = parse(ClaimBody, request.body);
      const result = await claimSession({
        playerId: session.playerId,
        sessionId: params.sessionId,
        idempotencyKey: body.idempotencyKey,
      });
      return result;
    },
  );

  app.get(
    "/api/runs/:runId",
    { config: { rateLimit: { max: 120, timeWindow: "1 minute" } } },
    async (request) => {
      const session = await authenticate(request);
      const params = parse(IdParams, request.params);
      return getRunDetail(params.runId, session.playerId);
    },
  );

  app.post(
    "/api/runs/:runId/decision",
    { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } },
    async (request) => {
      const session = await authenticate(request);
      requireCsrf(request);
      const params = parse(IdParams, request.params);
      const body = parse(DecisionBody, request.body);
      return submitDecision({
        runId: params.runId,
        playerId: session.playerId,
        levelIndex: body.levelIndex,
        decisionKey: body.decisionKey,
        expectedStateVersion: body.expectedStateVersion,
        idempotencyKey: body.idempotencyKey,
      });
    },
  );

  app.post(
    "/api/runs/:runId/consultations/:questionId/respond",
    { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } },
    async (request) => {
      const session = await authenticate(request);
      requireCsrf(request);
      const params = parse(QuestionParams, request.params);
      const body = parse(RespondBody, request.body);
      return submitConsultationResponse({
        runId: params.runId,
        playerId: session.playerId,
        questionId: params.questionId,
        action: body.action,
        answerKey: body.answerKey,
        expectedStateVersion: body.expectedStateVersion,
        idempotencyKey: body.idempotencyKey,
      });
    },
  );

  app.post(
    "/api/runs/:runId/finish",
    { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } },
    async (request) => {
      const session = await authenticate(request);
      requireCsrf(request);
      const params = parse(IdParams, request.params);
      const body = parse(FinishBody, request.body);
      return finishRun({
        runId: params.runId,
        playerId: session.playerId,
        idempotencyKey: body.idempotencyKey,
      });
    },
  );

  app.get(
    "/api/runs/:runId/payout",
    { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } },
    async (request) => {
      const session = await authenticate(request);
      const params = parse(IdParams, request.params);
      return getPayoutForRun(params.runId, session.playerId);
    },
  );

  app.get(
    "/api/history",
    { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } },
    async (request) => {
      const session = await authenticate(request);
      const query = parse(HistoryQuery, request.query);
      return getHistory({
        playerId: session.playerId,
        limit: query.limit,
        cursor: query.cursor,
      });
    },
  );
}
