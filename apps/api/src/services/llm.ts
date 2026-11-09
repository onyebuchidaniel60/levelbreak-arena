import { z } from "zod";
import { config } from "../config";
import { query } from "../db";
import {
  getQuestionById,
  getQuestionForLevel,
} from "../domain/consultation-definitions";
import { applyBasisPoints, lunaString, toLuna } from "../domain/money";
import { getScenario } from "../domain/scenario-definitions";
import { errors } from "../errors";
import { agentConsultationMessage } from "./agents";
import type { LoggerLike } from "./sessions";

const CACHE_TTL_MS = 10 * 60_000;
const MAX_PROMPT_LENGTH = 600;
const VIRTUAL_UNITS_PER_VUSDT = 100_000n;

const LEVEL_THEMES = [
  "Stablecoin peg risk",
  "Liquidity pools and impermanent loss",
  "Yield-farming sustainability",
  "Oracle manipulation",
  "Leverage and liquidation cascades",
] as const;

type PromptSource = "llm" | "scripted" | "external";

type PromptResult = {
  prompt: string;
  source: PromptSource;
};

type CacheEntry = PromptResult & { expiresAt: number };

const promptCache = new Map<string, CacheEntry>();

type StoredEvidence =
  | {
      type: "text_snippet";
      title: string;
      text: string;
      sourceLabel: string;
    }
  | {
      type: "data_card";
      title: string;
      lines: readonly string[];
    }
  | {
      type: "scenario_card";
      title: string;
      lines: readonly string[];
    }
  | {
      type: "image";
      title: string;
      src: string;
      alt: string;
    };

export type GeneratedDecision = {
  decisionKey: string;
  label: string;
  /** Whole vUSDT units, for display and audit. */
  resultingPortfolio: number;
  /** Integer virtual portfolio units used by the game engine. */
  resultingPortfolioUnits: string;
  explanation: string;
  lesson: string;
};

export type GeneratedLevelContent = {
  scenario: {
    id: string;
    version: string;
    levelIndex: number;
    title: string;
    setting: string;
    situation: string;
    prompt: string;
    choices: Array<{ decisionKey: string; label: string }>;
  };
  consultation: {
    id: string;
    levelIndex: number;
    evidenceVersion: string;
    agentContext: string;
    agentConfidence: "low" | "medium" | "high";
    agentMessage: string;
    evidence: StoredEvidence;
    question: string;
    options: Array<{
      key: "SAFE" | "RISKY" | "CANT_TELL";
      label: string;
      description: string;
    }>;
    rewardLuna: string;
  };
  decisions: GeneratedDecision[];
  source: PromptSource;
};

export type LevelGenerationContext = {
  runId: string;
  levelIndex: number;
  portfolioUnits: string;
  portfolioUnit: string;
  earnedLuna: string;
  maxRewardLuna: string;
  maxConsultations: number;
  previousLevels?: Array<{ levelIndex: number; title: string }>;
};

const ChatCompletionResponse = z.object({
  choices: z
    .array(
      z.object({
        message: z.object({
          content: z.string(),
        }),
      }),
    )
    .min(1),
});

const LlmDecisionSchema = z.object({
  decisionKey: z.enum(["SAFE", "RISKY"]),
  label: z.string().min(2).max(80),
  resultingPortfolio: z.number().positive().finite(),
  explanation: z.string().min(20).max(900),
});

const LlmLevelSchema = z
  .object({
    title: z.string().min(5).max(140),
    situation: z.string().min(20).max(1400),
    decisions: z.array(LlmDecisionSchema).length(2),
    consultation: z.object({
      question: z.string().min(10).max(320),
      evidence: z.object({
        type: z.literal("text_snippet"),
        payload: z.string().min(20).max(1400),
      }),
      options: z.array(z.enum(["SAFE", "RISKY", "CANT_TELL"])).length(3),
    }),
  })
  .superRefine((value, ctx) => {
    const keys = new Set(value.decisions.map((decision) => decision.decisionKey));
    if (keys.size !== 2) {
      ctx.addIssue({
        code: "custom",
        message: "Decisions must contain one SAFE and one RISKY entry.",
      });
    }
    if (new Set(value.consultation.options).size !== 3) {
      ctx.addIssue({
        code: "custom",
        message: "Consultation options must contain SAFE, RISKY and CANT_TELL.",
      });
    }
  });

export function sanitizeAgentPrompt(value: string): string {
  const normalized = value
    .replace(/```[a-z]*\n?/gi, "")
    .replace(/```/g, "")
    .replace(/^["'“”]+|["'“”]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (normalized.length <= MAX_PROMPT_LENGTH) return normalized;
  const slice = normalized.slice(0, MAX_PROMPT_LENGTH);
  const lastSpace = slice.lastIndexOf(" ");
  return `${slice.slice(0, lastSpace > 300 ? lastSpace : MAX_PROMPT_LENGTH)}…`;
}

export function readGeneratedLevelContent(
  value: unknown,
  levelIndex: number,
): GeneratedLevelContent | null {
  if (!value || typeof value !== "object") return null;
  const level = (value as Record<string, unknown>)[String(levelIndex)];
  if (!level || typeof level !== "object") return null;
  const content = level as Partial<GeneratedLevelContent>;
  if (
    !content.scenario ||
    !content.consultation ||
    !Array.isArray(content.decisions)
  ) {
    return null;
  }
  return content as GeneratedLevelContent;
}

function summarizeEvidence(evidence: StoredEvidence): string {
  if (evidence.type === "text_snippet") {
    return `${evidence.title}: ${evidence.text}`;
  }
  if (evidence.type === "data_card" || evidence.type === "scenario_card") {
    return `${evidence.title}: ${evidence.lines.join("; ")}`;
  }
  return `${evidence.title}: ${evidence.alt}`;
}

export function buildAgentPromptContext(input: {
  questionId: string;
  questionLevel: number;
  questionText: string;
  evidenceSummary: string;
  earnedLuna: string;
  maxRewardLuna: string;
  maxConsultations: number;
  scenarioTitle?: string;
  scenarioSetting?: string;
  scenarioSituation?: string;
}): string {
  const scenario = input.scenarioTitle
    ? {
        title: input.scenarioTitle,
        setting: input.scenarioSetting ?? "AI-generated simulated scenario.",
        situation: input.scenarioSituation ?? "",
      }
    : getScenario(input.questionLevel);
  return JSON.stringify({
    game: "LevelBreak Arena",
    level: input.questionLevel,
    levelsTotal: input.maxConsultations,
    scenario: {
      title: scenario.title,
      setting: scenario.setting,
      situation: scenario.situation,
    },
    question: input.questionText,
    evidenceSummary: input.evidenceSummary,
    playerEarnedLuna: input.earnedLuna,
    sessionMaxRewardLuna: input.maxRewardLuna,
    rules: [
      "The player may answer or skip; skip earns zero.",
      "There is no hidden correct answer and no correctness scoring.",
      "Scenarios and evidence are simulated, not live market data.",
    ],
  });
}

function evidenceSummary(questionId: string): string {
  const question = getQuestionById(questionId);
  if (!question) return "Bundled evidence is available in the consultation card.";
  return summarizeEvidence(question.evidence);
}

function extractJsonObject(value: string): string {
  const start = value.indexOf("{");
  const end = value.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new Error("LLM_JSON_NOT_FOUND");
  }
  return value.slice(start, end + 1);
}

async function requestChatCompletion(input: {
  system: string;
  user: string;
  maxTokens: number;
  temperature: number;
  jsonMode?: boolean;
}): Promise<string> {
  if (!config.llmApiKey) {
    throw new Error("LLM_API_KEY_NOT_CONFIGURED");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.llmTimeoutMs);
  try {
    const response = await fetch(`${config.llmBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${config.llmApiKey}`,
        "content-type": "application/json",
        accept: "application/json",
        "user-agent": "LevelBreakArena/1.0",
      },
      body: JSON.stringify({
        model: config.llmModel,
        temperature: input.temperature,
        max_tokens: input.maxTokens,
        ...(input.jsonMode
          ? { response_format: { type: "json_object" as const } }
          : {}),
        messages: [
          { role: "system", content: input.system },
          { role: "user", content: input.user },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`LLM_HTTP_${response.status}`);
    }
    const parsed = ChatCompletionResponse.safeParse(await response.json());
    if (!parsed.success) {
      throw new Error("LLM_INVALID_RESPONSE");
    }
    return parsed.data.choices[0].message.content;
  } finally {
    clearTimeout(timeout);
  }
}

async function requestLlmPrompt(context: string): Promise<string> {
  const content = await requestChatCompletion({
    system:
      "You are an AI Agent evaluating a new DeFi protocol. You are asking a human user for their subjective risk assessment based on the scenario provided. Do not ask trivia questions. Ask for their judgment and reasoning. You are Agent Zeta in LevelBreak Arena, a simulated DeFi learning game. Write one natural agent message of 2-3 sentences (maximum 55 words) that introduces the supplied consultation question. You may mention the player's own earned Luna and the current level. Do not give financial advice. Do not reveal or imply a correct answer. Do not claim to be a real independent agent, a human, or an external payer. Never ask for wallet details, keys, signatures, or personal data. Use only the supplied simulated evidence. Return plain text only, with no markdown, labels, or quotation marks.",
    user: context,
    maxTokens: 140,
    temperature: 0.6,
  });
  const prompt = sanitizeAgentPrompt(content);
  if (!prompt) {
    throw new Error("LLM_EMPTY_RESPONSE");
  }
  return prompt;
}

function fallbackLevelContent(
  levelIndex: number,
  context: LevelGenerationContext,
): GeneratedLevelContent {
  const scenario = getScenario(levelIndex);
  const question = getQuestionForLevel(levelIndex);
  const currentUnits = toLuna(context.portfolioUnits);
  const decisions = scenario.choices.map((choice) => {
    const outcome = scenario.outcomes[choice.key];
    const resultingUnits = applyBasisPoints(currentUnits, outcome.basisPoints);
    return {
      decisionKey: choice.key,
      label: choice.label,
      resultingPortfolio: Number(resultingUnits) / Number(VIRTUAL_UNITS_PER_VUSDT),
      resultingPortfolioUnits: lunaString(resultingUnits),
      explanation: outcome.explanation,
      lesson: outcome.lesson,
    };
  });

  return {
    source: "scripted",
    scenario: {
      id: scenario.id,
      version: scenario.version,
      levelIndex,
      title: scenario.title,
      setting: scenario.setting,
      situation: scenario.situation,
      prompt: scenario.prompt,
      choices: scenario.choices.map((choice) => ({
        decisionKey: choice.key,
        label: choice.label,
      })),
    },
    consultation: {
      id: question.id,
      levelIndex: question.levelIndex,
      evidenceVersion: question.evidenceVersion,
      agentContext: question.agentContext,
      agentConfidence: question.agentConfidence,
      agentMessage: question.agentMessage,
      evidence: question.evidence,
      question: question.question,
      options: question.options.map((option) => ({
        key: option.key,
        label: option.label,
        description: option.description,
      })),
      rewardLuna: "500",
    },
    decisions,
  };
}

function normalizeGeneratedLevel(
  parsed: z.infer<typeof LlmLevelSchema>,
  levelIndex: number,
  context: LevelGenerationContext,
): GeneratedLevelContent {
  const safe = parsed.decisions.find((decision) => decision.decisionKey === "SAFE");
  const risky = parsed.decisions.find((decision) => decision.decisionKey === "RISKY");
  if (!safe || !risky) throw new Error("LLM_DECISION_KEYS_INVALID");

  const currentUnits = toLuna(context.portfolioUnits);
  const maxUnits = currentUnits * 3n;
  const safeUnits = BigInt(Math.round(safe.resultingPortfolio * 100_000));
  const riskyUnits = BigInt(Math.round(risky.resultingPortfolio * 100_000));
  if (
    safeUnits <= 0n ||
    riskyUnits <= 0n ||
    safeUnits > maxUnits ||
    riskyUnits > maxUnits ||
    safeUnits < riskyUnits
  ) {
    throw new Error("LLM_PORTFOLIO_OUT_OF_RANGE");
  }

  const scenarioId = `ai-${context.runId}-${levelIndex}`;
  const decisionByKey = [safe, risky];
  const options = [
    {
      key: "SAFE" as const,
      label: "Safe enough",
      description: "The evidence supports a lower-risk read.",
    },
    {
      key: "RISKY" as const,
      label: "Risky",
      description: "The evidence shows material risk.",
    },
    {
      key: "CANT_TELL" as const,
      label: "Can't tell",
      description: "The evidence is not sufficient to classify it.",
    },
  ];

  return {
    source: "llm",
    scenario: {
      id: scenarioId,
      version: "ai-1",
      levelIndex,
      title: parsed.title.trim(),
      setting: `AI-generated simulated scenario · Level ${levelIndex}`,
      situation: parsed.situation.trim(),
      prompt: "Choose the response that best reflects your risk judgment.",
      choices: decisionByKey.map((decision) => ({
        decisionKey: decision.decisionKey,
        label: decision.label.trim(),
      })),
    },
    consultation: {
      id: `${scenarioId}-consultation`,
      levelIndex,
      evidenceVersion: `ai-${levelIndex}-v1`,
      agentContext: "Agent Zeta (Simulated) · AI-generated level review",
      agentConfidence: "medium",
      agentMessage: `I am Agent Zeta, evaluating ${parsed.title.trim()}. Review the simulated evidence and give me your subjective risk assessment. There is no hidden correct answer.`,
      evidence: {
        type: "text_snippet",
        title: "AI-generated evidence",
        text: parsed.consultation.evidence.payload.trim(),
        sourceLabel: "Simulated DeFi scenario · AI-generated",
      },
      question: parsed.consultation.question.trim(),
      options,
      rewardLuna: "500",
    },
    decisions: decisionByKey.map((decision) => ({
      decisionKey: decision.decisionKey,
      label: decision.label.trim(),
      resultingPortfolio: decision.resultingPortfolio,
      resultingPortfolioUnits:
        decision.decisionKey === "SAFE"
          ? lunaString(safeUnits)
          : lunaString(riskyUnits),
      explanation: decision.explanation.trim(),
      lesson:
        "Use the simulated evidence and your own risk framework rather than chasing a label.",
    })),
  };
}

export async function generateLevelScenario(
  levelIndex: number,
  playerContext: LevelGenerationContext,
  logger?: LoggerLike,
): Promise<GeneratedLevelContent> {
  if (!config.llmApiKey) {
    return fallbackLevelContent(levelIndex, playerContext);
  }

  const theme = LEVEL_THEMES[levelIndex - 1] ?? LEVEL_THEMES[4];
  const prompt = {
    task: "Generate exactly one level of LevelBreak Arena as strict JSON.",
    levelIndex,
    difficultyTheme: theme,
    progression:
      "Level 1 starts with stablecoin peg risk; level 2 liquidity pools and impermanent loss; level 3 yield sustainability; level 4 oracle manipulation; level 5 leverage and liquidation cascades. Make the scenario progressively harder.",
    currentPortfolioVusdt:
      Number(toLuna(playerContext.portfolioUnits)) /
      Number(VIRTUAL_UNITS_PER_VUSDT),
    portfolioUnit: playerContext.portfolioUnit,
    earnedLuna: playerContext.earnedLuna,
    maxRewardLuna: playerContext.maxRewardLuna,
    maxConsultations: playerContext.maxConsultations,
    previousLevels: playerContext.previousLevels ?? [],
    requiredJsonShape: {
      title: "String",
      situation: "String",
      decisions: [
        {
          decisionKey: "SAFE",
          label: "String",
          resultingPortfolio: 1000,
          explanation: "String",
        },
        {
          decisionKey: "RISKY",
          label: "String",
          resultingPortfolio: 800,
          explanation: "String",
        },
      ],
      consultation: {
        question: "String",
        evidence: { type: "text_snippet", payload: "String" },
        options: ["SAFE", "RISKY", "CANT_TELL"],
      },
    },
    rules: [
      "Return only a valid JSON object, with no markdown fences or commentary.",
      "resultingPortfolio is a whole vUSDT number, not Luna and not raw virtual units. Example: 1000 means 1,000 vUSDT.",
      "SAFE must produce a portfolio value greater than or equal to RISKY.",
      "The scenario must be fictional and simulated; never claim live prices or real protocol data.",
      "The consultation must ask for a subjective human risk assessment, judgment and reasoning; do not ask trivia.",
      "The evidence must be a short text snippet containing the facts needed to make the judgment.",
      "There is no hidden correct answer and no investment advice.",
    ],
  };

  try {
    const content = await requestChatCompletion({
      system:
        "You are Agent Zeta, an AI Agent designing a simulated DeFi learning level for LevelBreak Arena. You evaluate fictional DeFi protocols and ask humans for subjective risk judgments. Return strict JSON only.",
      user: JSON.stringify(prompt),
      maxTokens: 900,
      temperature: 0.7,
      jsonMode: true,
    });
    const parsed = LlmLevelSchema.safeParse(
      JSON.parse(extractJsonObject(content)),
    );
    if (!parsed.success) {
      throw new Error("LLM_LEVEL_SCHEMA_INVALID");
    }
    return normalizeGeneratedLevel(parsed.data, levelIndex, playerContext);
  } catch (error) {
    logger?.warn(
      {
        event: "llm_level_generation_fallback",
        levelIndex,
        reason:
          error instanceof Error && error.name === "AbortError"
            ? "timeout"
            : "provider_or_schema_error",
      },
      "AI level generation fell back to the static scenario",
    );
    return fallbackLevelContent(levelIndex, playerContext);
  }
}

function readCache(key: string): PromptResult | null {
  const entry = promptCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    promptCache.delete(key);
    return null;
  }
  return { prompt: entry.prompt, source: entry.source };
}

function writeCache(key: string, result: PromptResult): PromptResult {
  promptCache.set(key, { ...result, expiresAt: Date.now() + CACHE_TTL_MS });
  return result;
}

export async function generateAgentPrompt(input: {
  runId: string;
  playerId: string;
  questionId: string;
  logger?: LoggerLike;
}): Promise<PromptResult> {
  const runResult = await query<{
    id: string;
    requester_session_id: string;
    player_id: string;
    state: string;
    level_index: number;
    reward_earned_luna: string;
    max_consultations: number;
    max_reward_liability_luna: string;
    generated_content: unknown;
  }>(
    `SELECT r.id, r.requester_session_id, r.player_id, r.state, r.level_index,
            r.reward_earned_luna,
            s.max_consultations, s.max_reward_liability_luna, r.generated_content
       FROM player_runs r
       JOIN requester_sessions s ON s.id = r.requester_session_id
      WHERE r.id = $1`,
    [input.runId],
  );
  const run = runResult.rows[0];
  if (!run || run.player_id !== input.playerId) {
    throw errors.notFound("Run not found.");
  }

  if (run.state !== "CONSULTATION_PENDING") {
    throw errors.conflict(
      "QUESTION_NOT_ACTIVE",
      "There is no active consultation for this run.",
    );
  }

  const externalAgent = await query<{
    id: string;
    question: string;
    context: string;
    agent_name: string;
  }>(
    `SELECT c.id, c.question, c.context, a.name AS agent_name
       FROM agent_consultations c
       JOIN agents a ON a.id = c.agent_id
      WHERE c.id::text = $1 AND c.requester_session_id = $2
      LIMIT 1`,
    [input.questionId, run.requester_session_id],
  );
  const externalAgentRow = externalAgent.rows[0];
  if (externalAgentRow?.agent_name && externalAgentRow.question) {
    return {
      prompt: agentConsultationMessage(externalAgentRow.agent_name),
      source: "external",
    };
  }

  const staticQuestion = getQuestionById(input.questionId);
  const generated = readGeneratedLevelContent(
    run.generated_content,
    run.level_index,
  );
  const generatedQuestion =
    generated?.consultation.id === input.questionId ? generated : null;

  if (!staticQuestion && !generatedQuestion) {
    throw errors.notFound("Question not found.");
  }
  if (
    staticQuestion &&
    staticQuestion.levelIndex !== run.level_index
  ) {
    throw errors.conflict(
      "QUESTION_NOT_ACTIVE",
      "That question is not active for this level.",
    );
  }

  const questionLevel = run.level_index;
  const questionText = generatedQuestion
    ? generatedQuestion.consultation.question
    : staticQuestion!.question;
  const questionId = generatedQuestion
    ? generatedQuestion.consultation.id
    : staticQuestion!.id;
  const fallbackMessage = generatedQuestion
    ? generatedQuestion.consultation.agentMessage
    : staticQuestion!.agentMessage;
  const evidenceText = generatedQuestion
    ? summarizeEvidence(generatedQuestion.consultation.evidence)
    : evidenceSummary(staticQuestion!.id);
  const scenarioFields = generatedQuestion
    ? {
        scenarioTitle: generatedQuestion.scenario.title,
        scenarioSetting: generatedQuestion.scenario.setting,
        scenarioSituation: generatedQuestion.scenario.situation,
      }
    : {};

  const cacheKey = `${input.runId}:${input.questionId}`;
  const cached = readCache(cacheKey);
  if (cached) return cached;

  const scripted = writeCache(cacheKey, {
    prompt: fallbackMessage,
    source: "scripted",
  });

  if (!config.llmApiKey) {
    return scripted;
  }

  try {
    const prompt = await requestLlmPrompt(
      buildAgentPromptContext({
        questionId,
        questionLevel,
        questionText,
        evidenceSummary: evidenceText,
        earnedLuna: run.reward_earned_luna,
        maxRewardLuna: run.max_reward_liability_luna,
        maxConsultations: run.max_consultations,
        ...scenarioFields,
      }),
    );
    return writeCache(cacheKey, { prompt, source: "llm" });
  } catch (error) {
    input.logger?.warn(
      {
        event: "llm_agent_prompt_fallback",
        questionId,
        reason:
          error instanceof Error && error.name === "AbortError"
            ? "timeout"
            : "provider_error",
      },
      "LLM agent prompt fell back to the scripted message",
    );
    return scripted;
  }
}
