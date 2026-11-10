import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_ENV: z.enum(["local", "preview", "production"]).default("preview"),
  APP_ORIGIN: z.string().url(),
  PORT: z.coerce.number().int().positive().optional(),
  API_PORT: z.coerce.number().int().positive().optional(),
  DATABASE_URL: z.string().min(1),
  DATABASE_POOL_MAX: z.coerce.number().int().positive().default(10),
  AUTH_SESSION_SECRET: z.string().min(32),
  AUTH_NONCE_TTL_SECONDS: z.coerce.number().int().positive().default(300),
  OPERATOR_AUTH_SECRET: z.string().min(32).optional(),
  OPERATOR_ALLOWLIST_ADDRESSES: z.string().optional(),
  NIMIQ_NETWORK: z.literal("testnet"),
  NIMIQ_TREASURY_ADDRESS: z.string().min(1),
  NIMIQ_TREASURY_PRIVATE_KEY: z.string().min(1).optional(),
  NIMIQ_DEMO_AGENT_ADDRESS: z.string().min(1),
  NIMIQ_DEMO_AGENT_PRIVATE_KEY: z.string().min(1).optional(),
  NIMIQ_EXPLORER_BASE_URL: z.string().url().optional(),
  FUNDING_MINIMUM_LUNA: z.coerce.number().int().positive().default(2500),
  REWARD_PER_ANSWER_LUNA: z.coerce.number().int().positive().default(500),
  MAX_CONSULTATIONS_PER_SESSION: z.coerce.number().int().positive().default(5),
  MAX_REWARD_LIABILITY_LUNA: z.coerce.number().int().positive().optional(),
  LLM_API_KEY: z.string().min(1).optional(),
  LLM_BASE_URL: z.string().url().default("https://api.openai.com/v1"),
  LLM_MODEL: z.string().min(1).default("gpt-4o-mini"),
  LLM_TIMEOUT_MS: z.coerce.number().int().positive().default(8000),
  PAYOUT_WORKER_ENABLED: z.enum(["true", "false"]).default("false"),
  DEMO_FUNDING_ENABLED: z.enum(["true", "false"]).default("false"),
  AUTO_REPLENISH_SESSIONS: z.enum(["true", "false"]).default("false"),
  PREVIEW_MOCK_AUTH_ENABLED: z.enum(["true", "false"]).default("false"),
  LOG_LEVEL: z.string().default("info"),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  const fields = parsed.error.issues
    .map((issue) => issue.path.join("."))
    .filter(Boolean)
    .join(", ");
  throw new Error(`Invalid or missing environment configuration: ${fields}`);
}

const env = parsed.data;

const rewardPerAnswer = BigInt(env.REWARD_PER_ANSWER_LUNA);
const maxLiability =
  rewardPerAnswer * BigInt(env.MAX_CONSULTATIONS_PER_SESSION);
const configuredMaxLiability = env.MAX_REWARD_LIABILITY_LUNA
  ? BigInt(env.MAX_REWARD_LIABILITY_LUNA)
  : maxLiability;

if (
  rewardPerAnswer !== 500n ||
  env.MAX_CONSULTATIONS_PER_SESSION !== 5 ||
  configuredMaxLiability !== 2500n ||
  BigInt(env.FUNDING_MINIMUM_LUNA) < configuredMaxLiability
) {
  throw new Error(
    "Phase 7 financial configuration is fixed at 500 Luna per answer, 5 consultations, 2,500 Luna maximum liability and at least 2,500 Luna funding.",
  );
}

export const config = {
  nodeEnv: env.NODE_ENV,
  appEnv: env.APP_ENV,
  appOrigin: env.APP_ORIGIN,
  port: env.PORT ?? env.API_PORT ?? 3001,
  databaseUrl: env.DATABASE_URL,
  databasePoolMax: env.DATABASE_POOL_MAX,
  authSessionSecret: env.AUTH_SESSION_SECRET,
  authNonceTtlSeconds: env.AUTH_NONCE_TTL_SECONDS,
  operatorAuthSecret: env.OPERATOR_AUTH_SECRET,
  operatorAllowlistAddresses: (env.OPERATOR_ALLOWLIST_ADDRESSES ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
  nimiqNetwork: env.NIMIQ_NETWORK,
  nimiqTreasuryAddress: env.NIMIQ_TREASURY_ADDRESS,
  nimiqTreasuryPrivateKey: env.NIMIQ_TREASURY_PRIVATE_KEY,
  nimiqDemoAgentAddress: env.NIMIQ_DEMO_AGENT_ADDRESS,
  nimiqDemoAgentPrivateKey: env.NIMIQ_DEMO_AGENT_PRIVATE_KEY,
  nimiqExplorerBaseUrl: env.NIMIQ_EXPLORER_BASE_URL,
  fundingMinimumLuna: BigInt(env.FUNDING_MINIMUM_LUNA),
  rewardPerAnswerLuna: rewardPerAnswer,
  maxConsultations: env.MAX_CONSULTATIONS_PER_SESSION,
  maxRewardLiabilityLuna: configuredMaxLiability,
  llmApiKey: env.LLM_API_KEY,
  llmBaseUrl: env.LLM_BASE_URL.replace(/\/+$/, ""),
  llmModel: env.LLM_MODEL,
  llmTimeoutMs: env.LLM_TIMEOUT_MS,
  payoutWorkerEnabled: env.PAYOUT_WORKER_ENABLED === "true",
  demoFundingEnabled: env.DEMO_FUNDING_ENABLED === "true",
  autoReplenishSessions: env.AUTO_REPLENISH_SESSIONS === "true",
  previewMockAuthEnabled: env.PREVIEW_MOCK_AUTH_ENABLED === "true",
  logLevel: env.LOG_LEVEL,
  isProduction: env.NODE_ENV === "production",
  secureCookies: env.NODE_ENV === "production" || env.APP_ENV === "preview",
} as const;
