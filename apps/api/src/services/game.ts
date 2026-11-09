import { config } from "../config";
import { query, withTransaction } from "../db";
import { errors } from "../errors";
import {
  getQuestionForLevel,
  isAllowedAnswer,
} from "../domain/consultation-definitions";
import { lunaString, toLuna } from "../domain/money";
import { evaluateScenario } from "../domain/scenario-definitions";
import { assertTransition } from "../domain/state-machines";
import {
  AGENT_CONSULTATION_OPTIONS,
  agentConsultationContext,
  agentConsultationEvidence,
  agentConsultationMessage,
  agentEvidenceVersion,
} from "./agents";
import { recordAudit } from "./audit";
import {
  generateLevelScenario,
  readGeneratedLevelContent,
  type GeneratedLevelContent,
} from "./llm";
import { isPgUniqueViolation } from "./sessions";

type RunRow = {
  id: string;
  requester_session_id: string;
  player_id: string;
  state: string;
  level_index: number;
  portfolio_state: { unit?: string; value?: string; version?: string };
  state_version: number;
  reward_earned_luna: string;
  generated_content: unknown;
  claim_idempotency_key: string | null;
  finish_idempotency_key: string | null;
  started_at: Date;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

type SessionRow = {
  id: string;
  public_ref: string;
  agent_id: string | null;
  state: string;
  reward_per_answer_luna: string;
  max_consultations: number;
  max_reward_liability_luna: string;
  reserved_liability_luna: string;
};

type DecisionRow = {
  id: string;
  level_index: number;
  decision_key: string;
  result: unknown;
  state_version_before: number;
  created_at: Date;
};

type ResponseRow = {
  id: string;
  question_id: string;
  level_index: number;
  response_key: string | null;
  result: string;
  reward_luna: string;
  created_at: Date;
};

type PayoutRow = {
  id: string;
  player_run_id: string;
  recipient_address: string;
  amount_luna: string;
  network_id: string;
  status: string;
  tx_hash: string | null;
  failure_code: string | null;
  attempted_at: Date | null;
  submitted_at: Date | null;
  confirmed_at: Date | null;
  created_at: Date;
};

function portfolioValue(row: RunRow): bigint {
  return toLuna(row.portfolio_state?.value ?? "0");
}

type GeneratedRunRow = RunRow & {
  max_consultations: number;
  max_reward_liability_luna: string;
};

async function ensureLevelContent(
  run: GeneratedRunRow,
): Promise<GeneratedLevelContent> {
  const existing = readGeneratedLevelContent(
    run.generated_content,
    run.level_index,
  );
  if (existing) return existing;

  const generated = await generateLevelScenario(run.level_index, {
    runId: run.id,
    levelIndex: run.level_index,
    portfolioUnits: portfolioValue(run).toString(),
    portfolioUnit: run.portfolio_state?.unit ?? "vUSDT",
    earnedLuna: run.reward_earned_luna,
    maxRewardLuna: run.max_reward_liability_luna,
    maxConsultations: run.max_consultations,
    previousLevels: [],
  });

  return withTransaction(async (client) => {
    const locked = await client.query<{
      generated_content: unknown;
      level_index: number;
    }>(
      `SELECT generated_content, level_index
         FROM player_runs
        WHERE id = $1
        FOR UPDATE`,
      [run.id],
    );
    const row = locked.rows[0];
    if (!row || row.level_index !== run.level_index) {
      throw errors.conflict(
        "STATE_CONFLICT",
        "The run state changed. Refresh and try again.",
      );
    }
    const raced = readGeneratedLevelContent(
      row.generated_content,
      run.level_index,
    );
    if (raced) return raced;

    const base =
      row.generated_content && typeof row.generated_content === "object"
        ? (row.generated_content as Record<string, unknown>)
        : {};
    const merged = {
      ...base,
      [String(run.level_index)]: generated,
    };
    await client.query(
      `UPDATE player_runs
          SET generated_content = $2, updated_at = now()
        WHERE id = $1`,
      [run.id, JSON.stringify(merged)],
    );
    return generated;
  });
}

function evaluateStoredDecision(
  content: GeneratedLevelContent,
  levelIndex: number,
  decisionKey: string,
  portfolioUnits: bigint,
) {
  const decision = content.decisions.find(
    (item) => item.decisionKey === decisionKey,
  );
  if (!decision) {
    throw new Error(`Decision ${decisionKey} is not allowed at level ${levelIndex}`);
  }
  const after = toLuna(decision.resultingPortfolioUnits);
  if (after < 0n) {
    throw new Error("Generated portfolio value must not be negative");
  }
  return {
    scenarioId: content.scenario.id,
    scenarioVersion: content.scenario.version,
    levelIndex,
    decisionKey,
    decisionLabel: decision.label,
    portfolioBefore: lunaString(portfolioUnits),
    portfolioAfter: lunaString(after),
    delta: lunaString(after - portfolioUnits),
    explanation: decision.explanation,
    lesson: decision.lesson,
  };
}

function decisionDTO(row: DecisionRow) {
  return {
    decisionId: row.id,
    levelIndex: row.level_index,
    decisionKey: row.decision_key,
    result: row.result,
    stateVersionBefore: row.state_version_before,
    createdAt: row.created_at.toISOString(),
  };
}

function responseDTO(row: ResponseRow) {
  return {
    responseId: row.id,
    questionId: row.question_id,
    levelIndex: row.level_index,
    responseKey: row.response_key,
    result: row.result,
    rewardLuna: lunaString(row.reward_luna),
    createdAt: row.created_at.toISOString(),
  };
}

async function loadRunForUpdate(
  client: import("pg").PoolClient,
  runId: string,
): Promise<RunRow | null> {
  const result = await client.query<RunRow>(
    `SELECT id, requester_session_id, player_id, state, level_index, portfolio_state,
            state_version, reward_earned_luna, generated_content,
            claim_idempotency_key, finish_idempotency_key, started_at,
            completed_at, created_at, updated_at
       FROM player_runs
      WHERE id = $1
      FOR UPDATE`,
    [runId],
  );
  return result.rows[0] ?? null;
}

async function loadSessionForUpdate(
  client: import("pg").PoolClient,
  sessionId: string,
): Promise<SessionRow | null> {
  const result = await client.query<SessionRow>(
    `SELECT id, public_ref, agent_id, state, reward_per_answer_luna,
            max_consultations, max_reward_liability_luna, reserved_liability_luna
       FROM requester_sessions
      WHERE id = $1
      FOR UPDATE`,
    [sessionId],
  );
  return result.rows[0] ?? null;
}

async function findDecisionByKey(
  client: import("pg").PoolClient,
  runId: string,
  idempotencyKey: string,
): Promise<DecisionRow | null> {
  const result = await client.query<DecisionRow>(
    `SELECT id, level_index, decision_key, result, state_version_before, created_at
       FROM scenario_decisions
      WHERE player_run_id = $1 AND idempotency_key = $2`,
    [runId, idempotencyKey],
  );
  return result.rows[0] ?? null;
}

async function findResponseByKey(
  client: import("pg").PoolClient,
  runId: string,
  idempotencyKey: string,
): Promise<ResponseRow | null> {
  const result = await client.query<ResponseRow>(
    `SELECT id, question_id, level_index, response_key, result, reward_luna, created_at
       FROM consultation_responses
      WHERE player_run_id = $1 AND idempotency_key = $2`,
    [runId, idempotencyKey],
  );
  return result.rows[0] ?? null;
}

export async function getRunDetail(runId: string, playerId: string) {
  const runResult = await query<
    RunRow & {
      public_ref: string;
      max_consultations: number;
      reward_per_answer_luna: string;
      max_reward_liability_luna: string;
      session_state: string;
      agent_name: string | null;
      agent_consultation_id: string | null;
      agent_question: string | null;
      agent_context: string | null;
      agent_reward_luna: string | null;
      agent_consultation_status: string | null;
    }
  >(
    `SELECT r.id, r.requester_session_id, r.player_id, r.state, r.level_index,
            r.portfolio_state, r.state_version, r.reward_earned_luna,
            r.generated_content, r.claim_idempotency_key,
            r.finish_idempotency_key, r.started_at, r.completed_at,
            r.created_at, r.updated_at,
            s.public_ref, s.max_consultations, s.reward_per_answer_luna,
            s.max_reward_liability_luna, s.state AS session_state,
            a.name AS agent_name,
            c.id AS agent_consultation_id,
            c.question AS agent_question,
            c.context AS agent_context,
            c.reward_luna AS agent_reward_luna,
            c.status AS agent_consultation_status
       FROM player_runs r
       JOIN requester_sessions s ON s.id = r.requester_session_id
       LEFT JOIN agents a ON a.id = s.agent_id
       LEFT JOIN agent_consultations c ON c.requester_session_id = s.id
      WHERE r.id = $1`,
    [runId],
  );
  const run = runResult.rows[0];
  if (!run || run.player_id !== playerId) {
    throw errors.notFound("Run not found.");
  }

  const [decisions, responses, payout] = await Promise.all([
    query<DecisionRow>(
      `SELECT id, level_index, decision_key, result, state_version_before, created_at
         FROM scenario_decisions
        WHERE player_run_id = $1
        ORDER BY level_index ASC`,
      [runId],
    ),
    query<ResponseRow>(
      `SELECT id, question_id, level_index, response_key, result, reward_luna, created_at
         FROM consultation_responses
        WHERE player_run_id = $1
        ORDER BY level_index ASC`,
      [runId],
    ),
    query<PayoutRow>(
      `SELECT id, player_run_id, recipient_address, amount_luna, network_id, status,
              tx_hash, failure_code, attempted_at, submitted_at, confirmed_at, created_at
         FROM payouts
        WHERE player_run_id = $1`,
      [runId],
    ),
  ]);

  const activeLevel =
    run.state === "IN_PROGRESS" || run.state === "CONSULTATION_PENDING";
  const content = activeLevel ? await ensureLevelContent(run) : null;
  const scenario = content?.scenario ?? null;
  const agentConsultation =
    run.agent_consultation_id &&
    run.agent_name &&
    run.agent_question &&
    run.agent_context &&
    run.agent_reward_luna
      ? {
          id: run.agent_consultation_id,
          levelIndex: run.level_index,
          evidenceVersion: agentEvidenceVersion(run.agent_consultation_id),
          agentContext: agentConsultationContext(run.agent_name),
          agentConfidence: "medium" as const,
          agentMessage: agentConsultationMessage(run.agent_name),
          agentName: run.agent_name,
          evidence: agentConsultationEvidence(
            run.agent_name,
            run.agent_context,
          ),
          question: run.agent_question,
          options: AGENT_CONSULTATION_OPTIONS,
          rewardLuna: lunaString(run.agent_reward_luna),
        }
      : null;
  const consultation =
    run.state === "CONSULTATION_PENDING"
      ? agentConsultation ?? content?.consultation ?? null
      : null;

  return {
    runId: run.id,
    state: run.state,
    levelIndex: run.level_index,
    stateVersion: run.state_version,
    portfolio: {
      unit: run.portfolio_state?.unit ?? "vUSDT",
      value: lunaString(portfolioValue(run)),
      version: run.portfolio_state?.version ?? "1",
    },
    earnedLuna: lunaString(run.reward_earned_luna),
    maxConsultations: run.max_consultations,
    maxRewardLuna: lunaString(run.max_reward_liability_luna),
    payoutStatus: payout.rows[0]?.status ?? "NONE",
    scenario,
    consultation,
    decisions: decisions.rows.map(decisionDTO),
    responses: responses.rows.map(responseDTO),
  };
}

export async function submitDecision(input: {
  runId: string;
  playerId: string;
  levelIndex: number;
  decisionKey: string;
  expectedStateVersion: number;
  idempotencyKey: string;
}) {
  return withTransaction(async (client) => {
    const run = await loadRunForUpdate(client, input.runId);
    if (!run || run.player_id !== input.playerId) {
      throw errors.notFound("Run not found.");
    }

    const replay = await findDecisionByKey(
      client,
      run.id,
      input.idempotencyKey,
    );
    if (replay) {
      if (replay.level_index !== input.levelIndex) {
        throw errors.conflict(
          "IDEMPOTENCY_KEY_REUSED",
          "This idempotency key belongs to a different decision.",
        );
      }
      return {
        decisionId: replay.id,
        levelIndex: replay.level_index,
        result: replay.result,
        nextState: "CONSULTATION_PENDING",
        stateVersion: replay.state_version_before + 1,
      };
    }

    if (run.state !== "IN_PROGRESS") {
      throw errors.conflict(
        "STATE_CONFLICT",
        "The run is not ready for a scenario decision.",
      );
    }
    if (run.level_index !== input.levelIndex) {
      throw errors.conflict(
        "STATE_CONFLICT",
        "This is not the current level.",
      );
    }
    if (run.state_version !== input.expectedStateVersion) {
      throw errors.conflict(
        "STATE_CONFLICT",
        "The run state has changed. Refresh and try again.",
      );
    }

    let evaluation;
    try {
      const stored = readGeneratedLevelContent(
        run.generated_content,
        input.levelIndex,
      );
      evaluation = stored
        ? evaluateStoredDecision(
            stored,
            input.levelIndex,
            input.decisionKey,
            portfolioValue(run),
          )
        : evaluateScenario(
            input.levelIndex,
            input.decisionKey,
            portfolioValue(run),
          );
    } catch {
      throw errors.unprocessable(
        "INVALID_DECISION",
        "That decision is not allowed for this level.",
      );
    }

    let decisionId: string;
    try {
      const result = await client.query<{ id: string }>(
        `INSERT INTO scenario_decisions
           (player_run_id, level_index, decision_key, result, idempotency_key,
            state_version_before)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          run.id,
          input.levelIndex,
          input.decisionKey,
          JSON.stringify(evaluation),
          input.idempotencyKey,
          run.state_version,
        ],
      );
      decisionId = result.rows[0].id;
    } catch (error) {
      if (isPgUniqueViolation(error)) {
        const replayAfterRace = await findDecisionByKey(
          client,
          run.id,
          input.idempotencyKey,
        );
        if (replayAfterRace) {
          return {
            decisionId: replayAfterRace.id,
            levelIndex: replayAfterRace.level_index,
            result: replayAfterRace.result,
            nextState: "CONSULTATION_PENDING",
            stateVersion: replayAfterRace.state_version_before + 1,
          };
        }
        throw errors.conflict(
          "LEVEL_ALREADY_DECIDED",
          "This level already has a recorded decision.",
        );
      }
      throw error;
    }

    assertTransition("player_run", "IN_PROGRESS", "CONSULTATION_PENDING");
    await client.query(
      `UPDATE player_runs
          SET state = 'CONSULTATION_PENDING',
              portfolio_state = $2,
              state_version = state_version + 1,
              updated_at = now()
        WHERE id = $1`,
      [
        run.id,
        JSON.stringify({
          unit: "vUSDT",
          value: evaluation.portfolioAfter,
          version: run.portfolio_state?.version ?? "1",
        }),
      ],
    );

    await recordAudit(client, {
      actorType: "PLAYER",
      actorId: input.playerId,
      action: "scenario_decision_recorded",
      resourceType: "player_run",
      resourceId: run.id,
      details: { levelIndex: input.levelIndex, decisionKey: input.decisionKey },
    });

    return {
      decisionId,
      levelIndex: input.levelIndex,
      result: evaluation,
      nextState: "CONSULTATION_PENDING",
      stateVersion: run.state_version + 1,
    };
  });
}

export async function submitConsultationResponse(input: {
  runId: string;
  playerId: string;
  questionId: string;
  action: "ANSWER" | "SKIP";
  answerKey?: string;
  expectedStateVersion: number;
  idempotencyKey: string;
}) {
  return withTransaction(async (client) => {
    const run = await loadRunForUpdate(client, input.runId);
    if (!run || run.player_id !== input.playerId) {
      throw errors.notFound("Run not found.");
    }
    const session = await loadSessionForUpdate(
      client,
      run.requester_session_id,
    );
    if (!session) throw errors.notFound("Session not found.");

    const replay = await findResponseByKey(
      client,
      run.id,
      input.idempotencyKey,
    );
    if (replay) {
      if (replay.question_id !== input.questionId) {
        throw errors.conflict(
          "IDEMPOTENCY_KEY_REUSED",
          "This idempotency key belongs to a different response.",
        );
      }
      return {
        responseId: replay.id,
        result: replay.result,
        rewardLuna: lunaString(replay.reward_luna),
        earnedLunaTotal: lunaString(run.reward_earned_luna),
        nextState: run.state === "IN_PROGRESS" ? "IN_PROGRESS" : run.state,
        stateVersion: run.state_version,
      };
    }

    const existing = await client.query<{ id: string }>(
      `SELECT id FROM consultation_responses
        WHERE player_run_id = $1 AND question_id = $2`,
      [run.id, input.questionId],
    );
    if (existing.rows[0]) {
      throw errors.conflict(
        "QUESTION_ALREADY_RESOLVED",
        "This consultation has already been answered or skipped.",
      );
    }

    if (run.state !== "CONSULTATION_PENDING") {
      throw errors.conflict(
        "STATE_CONFLICT",
        "There is no consultation pending for this run.",
      );
    }
    if (run.state_version !== input.expectedStateVersion) {
      throw errors.conflict(
        "STATE_CONFLICT",
        "The run state has changed. Refresh and try again.",
      );
    }

    const agentConsultation = session.agent_id
      ? ((
          await client.query<{
            id: string;
            status: string;
            reward_luna: string;
          }>(
            `SELECT id, status, reward_luna
               FROM agent_consultations
              WHERE requester_session_id = $1
              FOR UPDATE`,
            [session.id],
          )
        ).rows[0] ?? null)
      : null;
    if (agentConsultation && agentConsultation.status !== "IN_PROGRESS") {
      throw errors.conflict(
        "QUESTION_NOT_ACTIVE",
        "This agent consultation is not active.",
      );
    }

    const storedContent = agentConsultation
      ? null
      : readGeneratedLevelContent(run.generated_content, run.level_index);
    const staticQuestion =
      agentConsultation || storedContent
        ? null
        : getQuestionForLevel(run.level_index);
    const questionId = agentConsultation
      ? agentConsultation.id
      : storedContent
        ? storedContent.consultation.id
        : staticQuestion!.id;
    const evidenceVersion = agentConsultation
      ? agentEvidenceVersion(agentConsultation.id)
      : storedContent
        ? storedContent.consultation.evidenceVersion
        : staticQuestion!.evidenceVersion;
    const answerAllowed = (answerKey: string): boolean =>
      agentConsultation
        ? AGENT_CONSULTATION_OPTIONS.some(
            (option) => option.key === answerKey,
          )
        : storedContent
          ? storedContent.consultation.options.some(
              (option) => option.key === answerKey,
            )
          : isAllowedAnswer(staticQuestion!, answerKey);

    if (questionId !== input.questionId) {
      throw errors.conflict(
        "QUESTION_NOT_ACTIVE",
        "That question is not active for this level.",
      );
    }

    let reward = 0n;
    let responseKey: string | null = null;
    if (input.action === "ANSWER") {
      if (!input.answerKey || !answerAllowed(input.answerKey)) {
        throw errors.unprocessable(
          "INVALID_ANSWER",
          "That answer is not allowed for this question.",
        );
      }
      responseKey = input.answerKey;
      reward = toLuna(config.rewardPerAnswerLuna);

      const earned = toLuna(run.reward_earned_luna);
      const maxLiability = toLuna(session.max_reward_liability_luna);
      const reserved = toLuna(session.reserved_liability_luna);
      if (earned + reward > maxLiability || earned + reward > reserved) {
        throw errors.unprocessable(
          "REWARD_CAP_EXCEEDED",
          "The session reward cap would be exceeded.",
        );
      }
    } else if (input.answerKey) {
      throw errors.unprocessable(
        "INVALID_ANSWER",
        "A skip must not include an answer key.",
      );
    }

    let response: ResponseRow;
    try {
      const result = await client.query<ResponseRow>(
        `INSERT INTO consultation_responses
           (player_run_id, question_id, level_index, evidence_version, response_key,
            result, reward_luna, idempotency_key)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, question_id, level_index, response_key, result, reward_luna, created_at`,
        [
          run.id,
          questionId,
          run.level_index,
          evidenceVersion,
          responseKey,
          input.action === "ANSWER" ? "ANSWERED" : "SKIPPED",
          String(reward),
          input.idempotencyKey,
        ],
      );
      response = result.rows[0];
    } catch (error) {
      if (isPgUniqueViolation(error)) {
        const replayAfterRace = await findResponseByKey(
          client,
          run.id,
          input.idempotencyKey,
        );
        if (replayAfterRace) {
          return {
            responseId: replayAfterRace.id,
            result: replayAfterRace.result,
            rewardLuna: lunaString(replayAfterRace.reward_luna),
            earnedLunaTotal: lunaString(run.reward_earned_luna),
            nextState:
              run.level_index >= session.max_consultations
                ? "COMPLETED"
                : "IN_PROGRESS",
            stateVersion: run.state_version,
          };
        }
        throw errors.conflict(
          "QUESTION_ALREADY_RESOLVED",
          "This consultation has already been answered or skipped.",
        );
      }
      throw error;
    }

    if (reward > 0n) {
      await client.query(
        `INSERT INTO ledger_entries
           (requester_session_id, player_run_id, entry_type, amount_luna, direction,
            idempotency_key, external_ref, metadata)
         VALUES ($1, $2, 'REWARD_RESERVED', $3, 'DEBIT', $4, $5, $6)
         ON CONFLICT (idempotency_key) DO NOTHING`,
        [
          run.requester_session_id,
          run.id,
          String(reward),
          `reward:${response.id}`,
          response.id,
          JSON.stringify({
            questionId,
            levelIndex: run.level_index,
            answerKey: responseKey,
          }),
        ],
      );
    }

    if (agentConsultation) {
      const agentId = session.agent_id;
      if (!agentId) {
        throw errors.conflict(
          "AGENT_CONSULTATION_INVALID",
          "The agent consultation is not linked correctly.",
        );
      }
      if (input.action === "ANSWER") {
        const charged = await client.query(
          `UPDATE agents
              SET balance_luna = balance_luna - $2,
                  reserved_luna = reserved_luna - $2,
                  updated_at = now()
            WHERE id = $1
              AND balance_luna >= $2
              AND reserved_luna >= $2`,
          [agentId, String(reward)],
        );
        if (charged.rowCount !== 1) {
          throw errors.conflict(
            "AGENT_BALANCE_CONFLICT",
            "The agent balance could not be settled.",
          );
        }
      } else {
        const released = await client.query(
          `UPDATE agents
              SET reserved_luna = reserved_luna - $2,
                  updated_at = now()
            WHERE id = $1 AND reserved_luna >= $2`,
          [agentId, lunaString(agentConsultation.reward_luna)],
        );
        if (released.rowCount !== 1) {
          throw errors.conflict(
            "AGENT_BALANCE_CONFLICT",
            "The agent reservation could not be released.",
          );
        }
      }

      await client.query(
        `UPDATE agent_consultations
            SET status = $2, updated_at = now()
          WHERE id = $1`,
        [
          agentConsultation.id,
          input.action === "ANSWER" ? "ANSWERED" : "SKIPPED",
        ],
      );
      await recordAudit(client, {
        actorType: "SYSTEM",
        action:
          input.action === "ANSWER"
            ? "agent_consultation_answered"
            : "agent_consultation_skipped",
        resourceType: "agent_consultation",
        resourceId: agentConsultation.id,
        details: { agentId, rewardLuna: String(reward) },
      });
    }

    const isLastLevel = run.level_index >= session.max_consultations;
    const nextState = isLastLevel ? "COMPLETED" : "IN_PROGRESS";
    assertTransition(
      "player_run",
      "CONSULTATION_PENDING",
      isLastLevel ? "COMPLETED" : "IN_PROGRESS",
    );
    await client.query(
      `UPDATE player_runs
          SET state = $2,
              level_index = $3,
              reward_earned_luna = reward_earned_luna + $4,
              state_version = state_version + 1,
              completed_at = CASE WHEN $2 = 'COMPLETED' THEN now() ELSE completed_at END,
              updated_at = now()
        WHERE id = $1`,
      [run.id, nextState, isLastLevel ? run.level_index : run.level_index + 1, String(reward)],
    );

    if (isLastLevel && session.state === "IN_PROGRESS") {
      assertTransition("requester_session", "IN_PROGRESS", "COMPLETED");
      await client.query(
        `UPDATE requester_sessions
            SET state = 'COMPLETED', updated_at = now()
          WHERE id = $1`,
        [session.id],
      );
    }

    await recordAudit(client, {
      actorType: "PLAYER",
      actorId: input.playerId,
      action:
        input.action === "ANSWER"
          ? "consultation_answered"
          : "consultation_skipped",
      resourceType: "player_run",
      resourceId: run.id,
      details: {
        questionId,
        levelIndex: run.level_index,
        rewardLuna: String(reward),
      },
    });

    return {
      responseId: response.id,
      result: response.result,
      rewardLuna: lunaString(reward),
      earnedLunaTotal: lunaString(toLuna(run.reward_earned_luna) + reward),
      nextState,
      stateVersion: run.state_version + 1,
    };
  });
}

export function buildExplorerUrl(baseUrl: string, txHash: string): string {
  if (baseUrl.includes("#")) {
    return `${baseUrl}${txHash}`;
  }
  return new URL(
    txHash,
    baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`,
  ).toString();
}

function payoutDTO(row: PayoutRow | undefined) {
  if (!row) {
    return {
      payoutId: null,
      status: "NONE" as const,
      amountLuna: "0",
      txHash: null,
      explorerUrl: null,
    };
  }
  const explorerUrl =
    row.tx_hash && config.nimiqExplorerBaseUrl
      ? buildExplorerUrl(config.nimiqExplorerBaseUrl, row.tx_hash)
      : null;
  return {
    payoutId: row.id,
    status: row.status,
    amountLuna: lunaString(row.amount_luna),
    txHash: row.tx_hash,
    explorerUrl,
  };
}

export async function finishRun(input: {
  runId: string;
  playerId: string;
  idempotencyKey: string;
}) {
  return withTransaction(async (client) => {
    const run = await loadRunForUpdate(client, input.runId);
    if (!run || run.player_id !== input.playerId) {
      throw errors.notFound("Run not found.");
    }

    const keyOwner = await client.query<{ id: string }>(
      `SELECT id FROM player_runs WHERE finish_idempotency_key = $1`,
      [input.idempotencyKey],
    );
    if (keyOwner.rows[0] && keyOwner.rows[0].id !== run.id) {
      throw errors.conflict(
        "IDEMPOTENCY_KEY_REUSED",
        "This idempotency key belongs to a different finish request.",
      );
    }

    const existingPayout = await client.query<PayoutRow>(
      `SELECT id, player_run_id, recipient_address, amount_luna, network_id, status,
              tx_hash, failure_code, attempted_at, submitted_at, confirmed_at, created_at
         FROM payouts
        WHERE player_run_id = $1`,
      [run.id],
    );
    if (existingPayout.rows[0]) {
      return {
        runId: run.id,
        state:
          run.state === "COMPLETED" || run.state === "PAYOUT_QUEUED"
            ? "PAYOUT_QUEUED"
            : run.state,
        earnedLuna: lunaString(run.reward_earned_luna),
        payoutId: existingPayout.rows[0].id,
        payoutStatus: existingPayout.rows[0].status,
      };
    }

    if (run.state === "COMPLETED_NO_REWARD") {
      return {
        runId: run.id,
        state: "COMPLETED_NO_REWARD",
        earnedLuna: "0",
        payoutId: null,
        payoutStatus: "NONE",
      };
    }

    if (run.state !== "COMPLETED") {
      throw errors.conflict(
        "RUN_NOT_COMPLETE",
        "The run is not complete yet.",
      );
    }

    const session = await loadSessionForUpdate(
      client,
      run.requester_session_id,
    );
    if (!session) throw errors.notFound("Session not found.");

    const decisionCount = await client.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM scenario_decisions WHERE player_run_id = $1`,
      [run.id],
    );
    const responseCount = await client.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM consultation_responses WHERE player_run_id = $1`,
      [run.id],
    );
    const rewardSum = await client.query<{ total: string }>(
      `SELECT COALESCE(SUM(reward_luna), 0)::text AS total
         FROM consultation_responses
        WHERE player_run_id = $1`,
      [run.id],
    );

    if (
      Number(decisionCount.rows[0].count) !== session.max_consultations ||
      Number(responseCount.rows[0].count) !== session.max_consultations
    ) {
      throw errors.conflict(
        "RUN_NOT_COMPLETE",
        `All ${session.max_consultations} levels must be completed before finishing.`,
      );
    }

    const earned = toLuna(rewardSum.rows[0].total);
    if (earned !== toLuna(run.reward_earned_luna)) {
      throw new Error("Persisted reward total does not match response rows");
    }
    if (
      earned > toLuna(session.max_reward_liability_luna) ||
      earned > toLuna(session.reserved_liability_luna)
    ) {
      throw errors.unprocessable(
        "REWARD_CAP_EXCEEDED",
        "The session reward cap would be exceeded.",
      );
    }

    if (earned === 0n) {
      assertTransition("player_run", "COMPLETED", "COMPLETED_NO_REWARD");
      await client.query(
        `UPDATE player_runs
            SET state = 'COMPLETED_NO_REWARD',
                finish_idempotency_key = COALESCE(finish_idempotency_key, $2),
                updated_at = now()
          WHERE id = $1`,
        [run.id, input.idempotencyKey],
      );
      await client.query(
        `INSERT INTO ledger_entries
           (requester_session_id, player_run_id, entry_type, amount_luna, direction,
            idempotency_key, external_ref, metadata)
         VALUES ($1, $2, 'UNUSED_CREDIT', $3, 'CREDIT', $4, NULL, $5)
         ON CONFLICT (idempotency_key) DO NOTHING`,
        [
          session.id,
          run.id,
          session.max_reward_liability_luna,
          `unused_credit:${session.id}`,
          JSON.stringify({ reason: "no accepted answers" }),
        ],
      );
      if (session.state === "COMPLETED") {
        assertTransition("requester_session", "COMPLETED", "SETTLED");
        await client.query(
          `UPDATE requester_sessions
              SET state = 'SETTLED', updated_at = now()
            WHERE id = $1`,
          [session.id],
        );
      }
      await recordAudit(client, {
        actorType: "PLAYER",
        actorId: input.playerId,
        action: "run_completed_no_reward",
        resourceType: "player_run",
        resourceId: run.id,
        details: { earnedLuna: "0" },
      });
      return {
        runId: run.id,
        state: "COMPLETED_NO_REWARD",
        earnedLuna: "0",
        payoutId: null,
        payoutStatus: "NONE",
      };
    }

    const player = await client.query<{ nimiq_address: string }>(
      `SELECT nimiq_address FROM players WHERE id = $1`,
      [run.player_id],
    );
    if (!player.rows[0]) throw errors.notFound("Player not found.");

    let payout: PayoutRow;
    try {
      const result = await client.query<PayoutRow>(
        `INSERT INTO payouts
           (player_run_id, player_id, recipient_address, amount_luna, network_id,
            status, idempotency_key)
         VALUES ($1, $2, $3, $4, 'testnet', 'QUEUED', $5)
         RETURNING id, player_run_id, recipient_address, amount_luna, network_id,
                   status, tx_hash, failure_code, attempted_at, submitted_at,
                   confirmed_at, created_at`,
        [
          run.id,
          run.player_id,
          player.rows[0].nimiq_address,
          String(earned),
          `payout:${run.id}`,
        ],
      );
      payout = result.rows[0];
    } catch (error) {
      if (isPgUniqueViolation(error)) {
        const replay = await client.query<PayoutRow>(
          `SELECT id, player_run_id, recipient_address, amount_luna, network_id,
                  status, tx_hash, failure_code, attempted_at, submitted_at,
                  confirmed_at, created_at
             FROM payouts
            WHERE player_run_id = $1`,
          [run.id],
        );
        if (replay.rows[0]) {
          return {
            runId: run.id,
            state: "PAYOUT_QUEUED",
            earnedLuna: lunaString(earned),
            payoutId: replay.rows[0].id,
            payoutStatus: replay.rows[0].status,
          };
        }
      }
      throw error;
    }

    await client.query(
      `INSERT INTO ledger_entries
         (requester_session_id, player_run_id, entry_type, amount_luna, direction,
          idempotency_key, external_ref, metadata)
       VALUES ($1, $2, 'PAYOUT_QUEUED', $3, 'DEBIT', $4, $5, $6)
       ON CONFLICT (idempotency_key) DO NOTHING`,
      [
        session.id,
        run.id,
        String(earned),
        `payout_queued:${run.id}`,
        payout.id,
        JSON.stringify({ payoutId: payout.id, recipient: payout.recipient_address }),
      ],
    );

    assertTransition("player_run", "COMPLETED", "PAYOUT_QUEUED");
    await client.query(
      `UPDATE player_runs
          SET state = 'PAYOUT_QUEUED',
              finish_idempotency_key = COALESCE(finish_idempotency_key, $2),
              updated_at = now()
        WHERE id = $1`,
      [run.id, input.idempotencyKey],
    );

    if (session.state === "COMPLETED") {
      assertTransition("requester_session", "COMPLETED", "PAYOUT_PENDING");
      await client.query(
        `UPDATE requester_sessions
            SET state = 'PAYOUT_PENDING', updated_at = now()
          WHERE id = $1`,
        [session.id],
      );
    }

    await recordAudit(client, {
      actorType: "PLAYER",
      actorId: input.playerId,
      action: "payout_queued",
      resourceType: "payout",
      resourceId: payout.id,
      details: { runId: run.id, amountLuna: String(earned) },
    });

    return {
      runId: run.id,
      state: "PAYOUT_QUEUED",
      earnedLuna: lunaString(earned),
      payoutId: payout.id,
      payoutStatus: payout.status,
    };
  });
}

export async function getPayoutForRun(runId: string, playerId: string) {
  const run = await query<{ id: string; player_id: string }>(
    `SELECT id, player_id FROM player_runs WHERE id = $1`,
    [runId],
  );
  if (!run.rows[0] || run.rows[0].player_id !== playerId) {
    throw errors.notFound("Run not found.");
  }
  const payout = await query<PayoutRow>(
    `SELECT id, player_run_id, recipient_address, amount_luna, network_id, status,
            tx_hash, failure_code, attempted_at, submitted_at, confirmed_at, created_at
       FROM payouts
      WHERE player_run_id = $1`,
    [runId],
  );
  return payoutDTO(payout.rows[0]);
}

function decodeCursor(cursor: string | undefined): {
  createdAt: Date;
  id: string;
} | null {
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

export async function getHistory(input: {
  playerId: string;
  limit: number;
  cursor?: string;
}) {
  const limit = Math.min(Math.max(input.limit, 1), 50);
  const cursor = decodeCursor(input.cursor);
  const params: unknown[] = [input.playerId];
  let cursorClause = "";
  if (cursor) {
    params.push(cursor.createdAt, cursor.id);
    cursorClause = `AND (r.created_at, r.id) < ($2, $3)`;
  }
  params.push(limit + 1);

  const result = await query<{
    id: string;
    state: string;
    level_index: number;
    reward_earned_luna: string;
    created_at: Date;
    completed_at: Date | null;
    public_ref: string;
    payout_id: string | null;
    payout_status: string | null;
    payout_amount_luna: string | null;
    tx_hash: string | null;
  }>(
    `SELECT r.id, r.state, r.level_index, r.reward_earned_luna, r.created_at,
            r.completed_at, s.public_ref, p.id AS payout_id, p.status AS payout_status,
            p.amount_luna AS payout_amount_luna, p.tx_hash
       FROM player_runs r
       JOIN requester_sessions s ON s.id = r.requester_session_id
       LEFT JOIN payouts p ON p.player_run_id = r.id
      WHERE r.player_id = $1 ${cursorClause}
      ORDER BY r.created_at DESC, r.id DESC
      LIMIT $${params.length}`,
    params,
  );

  const rows = result.rows.slice(0, limit);
  const next = result.rows.length > limit ? rows[rows.length - 1] : null;
  return {
    items: rows.map((row) => ({
      runId: row.id,
      publicRef: row.public_ref,
      state: row.state,
      levelIndex: row.level_index,
      earnedLuna: lunaString(row.reward_earned_luna),
      payoutId: row.payout_id,
      payoutStatus: row.payout_status ?? "NONE",
      payoutAmountLuna: row.payout_amount_luna
        ? lunaString(row.payout_amount_luna)
        : "0",
      txHash: row.tx_hash,
      createdAt: row.created_at.toISOString(),
      completedAt: row.completed_at?.toISOString() ?? null,
    })),
    nextCursor: next
      ? Buffer.from(
          `${next.created_at.toISOString()}|${next.id}`,
          "utf8",
        ).toString("base64url")
      : null,
  };
}


