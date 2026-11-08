import { z } from "zod";
import { config } from "../config";
import { query } from "../db";
import { getQuestionById } from "../domain/consultation-definitions";
import { getScenario } from "../domain/scenario-definitions";
import { errors } from "../errors";
import type { LoggerLike } from "./sessions";

const CACHE_TTL_MS = 10 * 60_000;
const MAX_PROMPT_LENGTH = 600;

type PromptSource = "llm" | "scripted";

type PromptResult = {
  prompt: string;
  source: PromptSource;
};

type CacheEntry = PromptResult & { expiresAt: number };

const promptCache = new Map<string, CacheEntry>();

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

export function buildAgentPromptContext(input: {
  questionId: string;
  questionLevel: number;
  questionText: string;
  evidenceSummary: string;
  earnedLuna: string;
  maxRewardLuna: string;
  maxConsultations: number;
}): string {
  const scenario = getScenario(input.questionLevel);
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
  if (question.evidence.type === "data_card") {
    return `${question.evidence.title}: ${question.evidence.lines.join("; ")}`;
  }
  if (question.evidence.type === "scenario_card") {
    return `${question.evidence.title}: ${question.evidence.lines.join("; ")}`;
  }
  if (question.evidence.type === "text_snippet") {
    return `${question.evidence.title}: ${question.evidence.text}`;
  }
  return `${question.evidence.title}: ${question.evidence.alt}`;
}

async function requestLlmPrompt(context: string): Promise<string> {
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
        temperature: 0.6,
        max_tokens: 140,
        messages: [
          {
            role: "system",
            content:
              "You are the demo requester in LevelBreak Arena, a simulated DeFi learning game. Write one natural agent message of 2-3 sentences (maximum 55 words) that introduces the supplied consultation question. You may mention the player's own earned Luna and the current level. Do not give financial advice. Do not reveal or imply a correct answer. Do not claim to be a real independent agent, a human, or an external payer. Never ask for wallet details, keys, signatures, or personal data. Use only the supplied simulated evidence. Return plain text only, with no markdown, labels, or quotation marks.",
          },
          { role: "user", content: context },
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
    const prompt = sanitizeAgentPrompt(parsed.data.choices[0].message.content);
    if (!prompt) {
      throw new Error("LLM_EMPTY_RESPONSE");
    }
    return prompt;
  } finally {
    clearTimeout(timeout);
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
    player_id: string;
    state: string;
    level_index: number;
    reward_earned_luna: string;
    max_consultations: number;
    max_reward_liability_luna: string;
  }>(
    `SELECT r.id, r.player_id, r.state, r.level_index, r.reward_earned_luna,
            s.max_consultations, s.max_reward_liability_luna
       FROM player_runs r
       JOIN requester_sessions s ON s.id = r.requester_session_id
      WHERE r.id = $1`,
    [input.runId],
  );
  const run = runResult.rows[0];
  if (!run || run.player_id !== input.playerId) {
    throw errors.notFound("Run not found.");
  }

  const question = getQuestionById(input.questionId);
  if (!question) {
    throw errors.notFound("Question not found.");
  }
  if (run.state !== "CONSULTATION_PENDING") {
    throw errors.conflict(
      "QUESTION_NOT_ACTIVE",
      "There is no active consultation for this run.",
    );
  }
  if (question.levelIndex !== run.level_index) {
    throw errors.conflict(
      "QUESTION_NOT_ACTIVE",
      "That question is not active for this level.",
    );
  }

  const cacheKey = `${input.runId}:${input.questionId}`;
  const cached = readCache(cacheKey);
  if (cached) return cached;

  const scripted = writeCache(cacheKey, {
    prompt: question.agentMessage,
    source: "scripted",
  });

  if (!config.llmApiKey) {
    return scripted;
  }

  try {
    const prompt = await requestLlmPrompt(
      buildAgentPromptContext({
        questionId: question.id,
        questionLevel: question.levelIndex,
        questionText: question.question,
        evidenceSummary: evidenceSummary(question.id),
        earnedLuna: run.reward_earned_luna,
        maxRewardLuna: run.max_reward_liability_luna,
        maxConsultations: run.max_consultations,
      }),
    );
    return writeCache(cacheKey, { prompt, source: "llm" });
  } catch (error) {
    input.logger?.warn(
      {
        event: "llm_agent_prompt_fallback",
        questionId: question.id,
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
