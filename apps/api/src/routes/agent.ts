import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { errors } from "../errors";
import type { NimiqService } from "../nimiq/types";
import {
  authenticateAgent,
  createAgentConsultation,
  depositAgentFunds,
  getAgentOverview,
  listAgentConsultations,
  listPublicAgents,
  registerAgent,
} from "../services/agents";

const RegisterBody = z.object({
  name: z.string().trim().min(2).max(80),
  walletAddress: z.string().trim().min(1).max(120),
});

const DepositBody = z.object({
  txHash: z.string().regex(/^[0-9a-fA-F]{64}$/),
});

const ConsultationBody = z.object({
  question: z.string().trim().min(10).max(500),
  context: z.string().trim().min(10).max(2000),
  reward_luna: z.union([
    z.number().int().positive().max(1_000_000),
    z.string().regex(/^\d{1,7}$/),
  ]),
});

function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw errors.badRequest("INVALID_REQUEST", "Invalid request.");
  }
  return result.data;
}

export async function registerAgentRoutes(
  app: FastifyInstance,
  options: { nimiq: NimiqService },
): Promise<void> {
  app.get(
    "/api/agents",
    { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } },
    async () => ({ agents: await listPublicAgents() }),
  );

  app.post(
    "/api/agent/register",
    { config: { rateLimit: { max: 5, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const body = parse(RegisterBody, request.body);
      const result = await registerAgent({
        name: body.name,
        walletAddress: body.walletAddress,
      });
      return reply.code(201).send(result);
    },
  );

  app.post(
    "/api/agent/deposit",
    { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } },
    async (request) => {
      const agent = await authenticateAgent(request);
      const body = parse(DepositBody, request.body);
      return depositAgentFunds({
        agentId: agent.id,
        txHash: body.txHash,
        nimiq: options.nimiq,
        logger: request.log,
      });
    },
  );

  app.post(
    "/api/agent/consultations",
    { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const agent = await authenticateAgent(request);
      const body = parse(ConsultationBody, request.body);
      const result = await createAgentConsultation({
        agentId: agent.id,
        question: body.question,
        context: body.context,
        rewardLuna: body.reward_luna,
      });
      return reply.code(201).send(result);
    },
  );

  app.get(
    "/api/agent/me",
    { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } },
    async (request) => {
      const agent = await authenticateAgent(request);
      return { agent: await getAgentOverview(agent.id) };
    },
  );

  app.get(
    "/api/agent/consultations",
    { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } },
    async (request) => {
      const agent = await authenticateAgent(request);
      return { consultations: await listAgentConsultations(agent.id) };
    },
  );
}
