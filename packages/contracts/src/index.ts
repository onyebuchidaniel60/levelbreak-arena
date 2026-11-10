import { z } from "zod";

export const lunaSchema = z.string().regex(/^\d+$/, "Expected integer Luna");
export const isoDateSchema = z.string();

export const errorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    requestId: z.string().nullable().optional(),
  }),
});

export const playerSchema = z.object({
  address: z.string(),
});

export const publicConfigSchema = z.object({
  productName: z.string(),
  networkLabel: z.string(),
  rewardPerAnswerLuna: lunaSchema,
  maxConsultations: z.number().int().positive(),
  demoMode: z.boolean(),
});

export const exchangeRatesSchema = z.object({
  usd: z.number().positive(),
  eur: z.number().positive(),
  ngn: z.number().positive(),
});

export const nonceResponseSchema = z.object({
  nonceId: z.string().uuid(),
  challenge: z.string(),
  expiresAt: isoDateSchema,
});

export const verifyResponseSchema = z.object({
  player: playerSchema,
  expiresAt: isoDateSchema,
});

export const meResponseSchema = z.object({
  player: playerSchema,
  activeRunId: z.string().uuid().nullable(),
});

export const availableSessionSchema = z.object({
  id: z.string().uuid(),
  publicRef: z.string(),
  maxConsultations: z.number().int().positive(),
  rewardPerAnswerLuna: lunaSchema,
  maxRewardLuna: lunaSchema,
  funded: z.literal(true),
  state: z.string(),
  agentName: z.string().nullable().optional(),
  questionPreview: z.string().nullable().optional(),
});

export const availableSessionsResponseSchema = z.object({
  sessions: z.array(availableSessionSchema),
});

export const claimResponseSchema = z.object({
  runId: z.string().uuid(),
  state: z.string(),
  levelIndex: z.number().int().min(1).max(5),
  stateVersion: z.number().int().min(0),
});

export const scenarioChoiceSchema = z.object({
  decisionKey: z.string(),
  label: z.string(),
});

export const scenarioSchema = z.object({
  id: z.string(),
  version: z.string(),
  levelIndex: z.number().int().min(1).max(5),
  title: z.string(),
  setting: z.string(),
  situation: z.string(),
  prompt: z.string(),
  choices: z.array(scenarioChoiceSchema),
});

const dataCardEvidenceSchema = z.object({
  type: z.literal("data_card"),
  title: z.string(),
  lines: z.array(z.string()),
});

const textSnippetEvidenceSchema = z.object({
  type: z.literal("text_snippet"),
  title: z.string(),
  text: z.string(),
  sourceLabel: z.string(),
});

const scenarioCardEvidenceSchema = z.object({
  type: z.literal("scenario_card"),
  title: z.string(),
  lines: z.array(z.string()),
});

const imageEvidenceSchema = z.object({
  type: z.literal("image"),
  title: z.string(),
  src: z.string(),
  alt: z.string(),
});

export const evidenceSchema = z.union([
  imageEvidenceSchema,
  dataCardEvidenceSchema,
  textSnippetEvidenceSchema,
  scenarioCardEvidenceSchema,
  z
    .object({
      type: z.string(),
      title: z.string().optional(),
    })
    .catchall(z.unknown()),
]);

export const consultationOptionSchema = z.object({
  key: z.enum(["SAFE", "RISKY", "CANT_TELL"]),
  label: z.string(),
  description: z.string(),
});

export const consultationSchema = z.object({
  id: z.string(),
  levelIndex: z.number().int().min(1).max(5),
  evidenceVersion: z.string(),
  agentContext: z.string(),
  agentConfidence: z.enum(["low", "medium", "high"]),
  agentMessage: z.string(),
  agentName: z.string().nullable().optional(),
  evidence: evidenceSchema,
  question: z.string(),
  options: z.array(consultationOptionSchema),
  rewardLuna: lunaSchema,
});

export const decisionResultSchema = z.object({
  scenarioId: z.string(),
  scenarioVersion: z.string(),
  levelIndex: z.number().int().min(1).max(5),
  decisionKey: z.string(),
  decisionLabel: z.string(),
  portfolioBefore: lunaSchema,
  portfolioAfter: lunaSchema,
  delta: z.string(),
  explanation: z.string(),
  lesson: z.string(),
});

export const decisionRecordSchema = z.object({
  decisionId: z.string().uuid(),
  levelIndex: z.number().int().min(1).max(5),
  decisionKey: z.string(),
  result: decisionResultSchema,
  stateVersionBefore: z.number().int().min(0),
  createdAt: isoDateSchema,
});

export const responseRecordSchema = z.object({
  responseId: z.string().uuid(),
  questionId: z.string(),
  levelIndex: z.number().int().min(1).max(5),
  responseKey: z.string().nullable(),
  result: z.enum(["ANSWERED", "SKIPPED"]),
  rewardLuna: lunaSchema,
  createdAt: isoDateSchema,
});

export const runStateSchema = z.enum([
  "NOT_STARTED",
  "IN_PROGRESS",
  "CONSULTATION_PENDING",
  "COMPLETED",
  "PAYOUT_QUEUED",
  "PAYOUT_SUBMITTED",
  "PAYOUT_CONFIRMED",
  "COMPLETED_NO_REWARD",
]);

export const payoutStatusSchema = z.enum([
  "NONE",
  "QUEUED",
  "BUILDING",
  "SUBMITTED",
  "CONFIRMED",
  "FAILED",
  "RECONCILING",
  "CANCELLED",
]);

export const runDetailSchema = z.object({
  runId: z.string().uuid(),
  state: runStateSchema,
  levelIndex: z.number().int().min(1).max(5),
  maxConsultations: z.number().int().positive(),
  stateVersion: z.number().int().min(0),
  portfolio: z.object({
    unit: z.string(),
    value: lunaSchema,
    version: z.string(),
  }),
  earnedLuna: lunaSchema,
  maxRewardLuna: lunaSchema,
  payoutStatus: payoutStatusSchema,
  scenario: scenarioSchema.nullable(),
  consultation: consultationSchema.nullable(),
  decisions: z.array(decisionRecordSchema),
  responses: z.array(responseRecordSchema),
});

export const decisionResponseSchema = z.object({
  decisionId: z.string().uuid(),
  levelIndex: z.number().int().min(1).max(5),
  result: decisionResultSchema,
  nextState: z.string(),
  stateVersion: z.number().int().min(0),
});

export const respondResponseSchema = z.object({
  responseId: z.string().uuid(),
  result: z.enum(["ANSWERED", "SKIPPED"]),
  rewardLuna: lunaSchema,
  earnedLunaTotal: lunaSchema,
  nextState: z.string(),
  stateVersion: z.number().int().min(0),
});

export const finishResponseSchema = z.object({
  runId: z.string().uuid(),
  state: z.string(),
  earnedLuna: lunaSchema,
  payoutId: z.string().uuid().nullable(),
  payoutStatus: z.string(),
});

export const payoutResponseSchema = z.object({
  payoutId: z.string().uuid().nullable(),
  status: payoutStatusSchema,
  amountLuna: lunaSchema,
  txHash: z.string().nullable(),
  explorerUrl: z.string().nullable(),
});

export const agentPromptResponseSchema = z.object({
  prompt: z.string().min(1).max(700),
  source: z.enum(["llm", "scripted", "external"]),
});

export const publicAgentSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  questionsPosted: z.number().int().min(0),
  activeQuestions: z.number().int().min(0),
  rewardsPaidLuna: lunaSchema,
  createdAt: isoDateSchema,
});

export const agentsResponseSchema = z.object({
  agents: z.array(publicAgentSchema),
});

export const historyItemSchema = z.object({
  runId: z.string().uuid(),
  publicRef: z.string(),
  state: z.string(),
  levelIndex: z.number().int().min(0).max(5),
  earnedLuna: lunaSchema,
  payoutId: z.string().uuid().nullable(),
  payoutStatus: z.string(),
  payoutAmountLuna: lunaSchema,
  txHash: z.string().nullable(),
  createdAt: isoDateSchema,
  completedAt: isoDateSchema.nullable(),
});

export const historyResponseSchema = z.object({
  items: z.array(historyItemSchema),
  nextCursor: z.string().nullable(),
});

export type PublicConfig = z.infer<typeof publicConfigSchema>;
export type ExchangeRates = z.infer<typeof exchangeRatesSchema>;
export type NonceResponse = z.infer<typeof nonceResponseSchema>;
export type VerifyResponse = z.infer<typeof verifyResponseSchema>;
export type MeResponse = z.infer<typeof meResponseSchema>;
export type AvailableSession = z.infer<typeof availableSessionSchema>;
export type PublicAgent = z.infer<typeof publicAgentSchema>;
export type AgentsResponse = z.infer<typeof agentsResponseSchema>;
export type ClaimResponse = z.infer<typeof claimResponseSchema>;
export type Scenario = z.infer<typeof scenarioSchema>;
export type Evidence = z.infer<typeof evidenceSchema>;
export type Consultation = z.infer<typeof consultationSchema>;
export type RunDetail = z.infer<typeof runDetailSchema>;
export type DecisionResponse = z.infer<typeof decisionResponseSchema>;
export type RespondResponse = z.infer<typeof respondResponseSchema>;
export type FinishResponse = z.infer<typeof finishResponseSchema>;
export type PayoutResponse = z.infer<typeof payoutResponseSchema>;
export type AgentPromptResponse = z.infer<typeof agentPromptResponseSchema>;
export type HistoryItem = z.infer<typeof historyItemSchema>;
export type HistoryResponse = z.infer<typeof historyResponseSchema>;
export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>;
