import { createHash, randomBytes } from "node:crypto";
import type { FastifyRequest } from "fastify";
import type { PoolClient } from "pg";
import { config } from "../config";
import { query, withTransaction } from "../db";
import { errors } from "../errors";
import { lunaString, toLuna } from "../domain/money";
import { addressesEqual, normalizeAddress } from "../nimiq/address";
import { isTestnetNetwork } from "../nimiq/funding-verification";
import type { NimiqService, NimiqTransactionDetails } from "../nimiq/types";
import { recordAudit } from "./audit";
import { isPgUniqueViolation, type LoggerLike } from "./sessions";

export const AGENT_API_KEY_PREFIX = "lba_agent_";
export const AGENT_CONSULTATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const AGENT_API_KEY_PATTERN = /^lba_agent_[A-Za-z0-9_-]{43}$/;
const DEPOSIT_LOOKUP_ATTEMPTS = 3;
const DEPOSIT_LOOKUP_INTERVAL_MS = 2_000;

export type AgentRow = {
  id: string;
  name: string;
  wallet_address: string;
  balance_luna: string;
  reserved_luna: string;
  created_at: Date;
  updated_at: Date;
};

export type AgentView = {
  agentId: string;
  name: string;
  walletAddress: string;
  balanceLuna: string;
  reservedLuna: string;
  availableLuna: string;
  createdAt: string;
};

export type AgentConsultationView = {
  consultationId: string;
  publicRef: string;
  question: string;
  context: string;
  rewardLuna: string;
  status: string;
  sessionState: string;
  runState: string | null;
  createdAt: string;
  updatedAt: string;
};

export const AGENT_CONSULTATION_OPTIONS = [
  {
    key: "SAFE" as const,
    label: "Safe enough",
    description: "The submitted context supports a lower-risk read.",
  },
  {
    key: "RISKY" as const,
    label: "Risky",
    description: "The submitted context shows material risk.",
  },
  {
    key: "CANT_TELL" as const,
    label: "Can't tell",
    description: "The submitted context is not sufficient to classify it.",
  },
];

export function agentEvidenceVersion(consultationId: string): string {
  return `agent-${consultationId}`;
}

export function agentConsultationContext(agentName: string): string {
  return `Request from ${agentName} · External agent`;
}

export function agentConsultationMessage(agentName: string): string {
  return `${agentName} is requesting your human risk assessment from LevelBreak Arena.`;
}

export function agentConsultationEvidence(agentName: string, context: string) {
  return {
    type: "text_snippet" as const,
    title: `${agentName} context`,
    text: context,
    sourceLabel: "External agent submission · simulated",
  };
}

export function hashAgentApiKey(apiKey: string): string {
  return createHash("sha256").update(apiKey, "utf8").digest("hex");
}

function createAgentApiKey(): string {
  return `${AGENT_API_KEY_PREFIX}${randomBytes(32).toString("base64url")}`;
}

function toAgentView(row: AgentRow): AgentView {
  const balance = toLuna(row.balance_luna);
  const reserved = toLuna(row.reserved_luna);
  return {
    agentId: row.id,
    name: row.name,
    walletAddress: row.wallet_address,
    balanceLuna: lunaString(balance),
    reservedLuna: lunaString(reserved),
    availableLuna: lunaString(balance - reserved),
    createdAt: row.created_at.toISOString(),
  };
}

function addressesMatch(left: string, right: string): boolean {
  try {
    return addressesEqual(left, right);
  } catch {
    return false;
  }
}

function normalizeAgentWallet(value: string): string {
  try {
    const wallet = normalizeAddress(value.trim());
    if (addressesEqual(wallet, config.nimiqTreasuryAddress)) {
      throw new Error("treasury address");
    }
    return wallet;
  } catch {
    throw errors.badRequest(
      "INVALID_AGENT_WALLET",
      "A valid non-treasury Nimiq wallet address is required.",
    );
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function registerAgent(input: {
  name: string;
  walletAddress: string;
}): Promise<{ agent: AgentView; apiKey: string }> {
  const name = input.name.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 80) {
    throw errors.badRequest(
      "INVALID_AGENT_NAME",
      "Agent name must be between 2 and 80 characters.",
    );
  }
  const walletAddress = normalizeAgentWallet(input.walletAddress);
  const apiKey = createAgentApiKey();
  const apiKeyHash = hashAgentApiKey(apiKey);

  try {
    const agent = await withTransaction(async (client) => {
      const result = await client.query<AgentRow>(
        `INSERT INTO agents (name, wallet_address, api_key_hash)
         VALUES ($1, $2, $3)
         RETURNING id, name, wallet_address, balance_luna, reserved_luna,
                   created_at, updated_at`,
        [name, walletAddress, apiKeyHash],
      );
      const row = result.rows[0];
      await recordAudit(client, {
        actorType: "AGENT",
        actorId: row.id,
        action: "agent_registered",
        resourceType: "agent",
        resourceId: row.id,
      });
      return row;
    });
    return { agent: toAgentView(agent), apiKey };
  } catch (error) {
    if (isPgUniqueViolation(error)) {
      throw errors.conflict(
        "AGENT_WALLET_EXISTS",
        "An agent is already registered with that wallet address.",
      );
    }
    throw error;
  }
}

export async function authenticateAgent(
  request: FastifyRequest,
): Promise<AgentRow> {
  const header = request.headers.authorization;
  if (typeof header !== "string") {
    throw errors.unauthorized("A valid agent API key is required.");
  }
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!match) {
    throw errors.unauthorized("A valid agent API key is required.");
  }
  const apiKey = match[1].trim();
  if (!AGENT_API_KEY_PATTERN.test(apiKey)) {
    throw errors.unauthorized("A valid agent API key is required.");
  }

  const result = await query<AgentRow>(
    `SELECT id, name, wallet_address, balance_luna, reserved_luna,
            created_at, updated_at
       FROM agents
      WHERE api_key_hash = $1`,
    [hashAgentApiKey(apiKey)],
  );
  const agent = result.rows[0];
  if (!agent) {
    throw errors.unauthorized("A valid agent API key is required.");
  }
  return agent;
}

async function readDepositTransaction(
  nimiq: NimiqService,
  txHash: string,
  logger?: LoggerLike,
): Promise<NimiqTransactionDetails> {
  for (let attempt = 0; attempt < DEPOSIT_LOOKUP_ATTEMPTS; attempt += 1) {
    try {
      return await nimiq.getTransaction(txHash);
    } catch {
      if (attempt < DEPOSIT_LOOKUP_ATTEMPTS - 1) {
        await sleep(DEPOSIT_LOOKUP_INTERVAL_MS);
      }
    }
  }

  logger?.warn(
    { event: "agent_deposit_lookup_failed", txHash },
    "Agent deposit transaction was not found on chain",
  );
  throw errors.unprocessable(
    "DEPOSIT_NOT_FOUND",
    "The deposit transaction was not found on Nimiq testnet. Retry after it propagates.",
  );
}

function assertAgentDeposit(
  transaction: NimiqTransactionDetails,
  agent: AgentRow,
): bigint {
  if (transaction.state !== "included" && transaction.state !== "confirmed") {
    throw errors.unprocessable(
      "DEPOSIT_NOT_CONFIRMED",
      "The deposit transaction is not included on Nimiq testnet yet.",
    );
  }
  if (!isTestnetNetwork(transaction.network)) {
    throw errors.unprocessable(
      "DEPOSIT_NETWORK_MISMATCH",
      "The deposit transaction is not on Nimiq testnet.",
    );
  }

  if (!addressesMatch(transaction.sender, agent.wallet_address)) {
    throw errors.unprocessable(
      "DEPOSIT_SENDER_MISMATCH",
      "The deposit sender does not match the registered agent wallet.",
    );
  }

  if (
    !addressesMatch(transaction.recipient, config.nimiqTreasuryAddress)
  ) {
    throw errors.unprocessable(
      "DEPOSIT_RECIPIENT_MISMATCH",
      "The deposit recipient is not the LevelBreak Arena treasury.",
    );
  }

  const amount = toLuna(transaction.valueLuna);
  if (amount < config.rewardPerAnswerLuna) {
    throw errors.unprocessable(
      "DEPOSIT_TOO_LOW",
      `The deposit must be at least ${config.rewardPerAnswerLuna} Luna to fund one consultation.`,
    );
  }
  return amount;
}

async function assertTransactionUnused(
  client: PoolClient,
  txHash: string,
): Promise<void> {
  const existing = await client.query<{ source: string }>(
    `SELECT 'AGENT_DEPOSIT' AS source FROM agent_deposits WHERE tx_hash = $1
     UNION ALL
     SELECT 'SESSION_FUNDING' AS source FROM funding_transactions WHERE tx_hash = $1
     LIMIT 1`,
    [txHash],
  );
  if (existing.rows[0]) {
    throw errors.conflict(
      "DEPOSIT_TX_REUSED",
      "This transaction has already been used by LevelBreak Arena.",
    );
  }
}

export async function depositAgentFunds(input: {
  agentId: string;
  txHash: string;
  nimiq: NimiqService;
  logger?: LoggerLike;
}): Promise<{
  deposit: {
    depositId: string;
    txHash: string;
    amountLuna: string;
    blockHeight: number | null;
  };
  agent: AgentView;
}> {
  const txHash = input.txHash.trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(txHash)) {
    throw errors.badRequest(
      "INVALID_TX_HASH",
      "A 64-character Nimiq testnet transaction hash is required.",
    );
  }

  const existing = await query<{ source: string }>(
    `SELECT 'AGENT_DEPOSIT' AS source FROM agent_deposits WHERE tx_hash = $1
     UNION ALL
     SELECT 'SESSION_FUNDING' AS source FROM funding_transactions WHERE tx_hash = $1
     LIMIT 1`,
    [txHash],
  );
  if (existing.rows[0]) {
    throw errors.conflict(
      "DEPOSIT_TX_REUSED",
      "This transaction has already been used by LevelBreak Arena.",
    );
  }

  const transaction = await readDepositTransaction(
    input.nimiq,
    txHash,
    input.logger,
  );

  return withTransaction(async (client) => {
    const locked = await client.query<AgentRow>(
      `SELECT id, name, wallet_address, balance_luna, reserved_luna,
              created_at, updated_at
         FROM agents
        WHERE id = $1
        FOR UPDATE`,
      [input.agentId],
    );
    const agent = locked.rows[0];
    if (!agent) {
      throw errors.unauthorized("A valid agent API key is required.");
    }

    const amount = assertAgentDeposit(transaction, agent);
    await assertTransactionUnused(client, txHash);

    const depositResult = await client.query<{
      id: string;
      tx_hash: string;
      amount_luna: string;
      block_height: string | null;
    }>(
      `INSERT INTO agent_deposits
         (agent_id, tx_hash, amount_luna, block_height, network_id)
       VALUES ($1, $2, $3, $4, 'testnet')
       RETURNING id, tx_hash, amount_luna, block_height`,
      [agent.id, txHash, lunaString(amount), transaction.blockHeight ?? null],
    );
    const deposit = depositResult.rows[0];

    const updatedResult = await client.query<AgentRow>(
      `UPDATE agents
          SET balance_luna = balance_luna + $2,
              updated_at = now()
        WHERE id = $1
        RETURNING id, name, wallet_address, balance_luna, reserved_luna,
                  created_at, updated_at`,
      [agent.id, lunaString(amount)],
    );
    const updated = updatedResult.rows[0];

    await recordAudit(client, {
      actorType: "AGENT",
      actorId: agent.id,
      action: "agent_deposit_credited",
      resourceType: "agent",
      resourceId: agent.id,
      details: {
        depositId: deposit.id,
        txHash,
        amountLuna: lunaString(amount),
        blockHeight: transaction.blockHeight ?? null,
      },
    });

    return {
      deposit: {
        depositId: deposit.id,
        txHash: deposit.tx_hash,
        amountLuna: lunaString(deposit.amount_luna),
        blockHeight: deposit.block_height
          ? Number(deposit.block_height)
          : null,
      },
      agent: toAgentView(updated),
    };
  });
}

export async function createAgentConsultation(input: {
  agentId: string;
  question: string;
  context: string;
  rewardLuna: bigint | string | number;
}): Promise<{
  consultation: {
    consultationId: string;
    sessionId: string;
    publicRef: string;
    question: string;
    context: string;
    rewardLuna: string;
    status: string;
    fundingDeadline: string;
  };
  agent: AgentView;
}> {
  const question = input.question.trim();
  const context = input.context.trim();
  const reward = toLuna(input.rewardLuna);
  if (reward !== config.rewardPerAnswerLuna) {
    throw errors.unprocessable(
      "INVALID_REWARD",
      `Agent consultations must fund exactly ${config.rewardPerAnswerLuna} Luna.`,
    );
  }
  if (question.length < 10 || question.length > 500) {
    throw errors.badRequest(
      "INVALID_QUESTION",
      "Question must be between 10 and 500 characters.",
    );
  }
  if (context.length < 10 || context.length > 2000) {
    throw errors.badRequest(
      "INVALID_CONTEXT",
      "Context must be between 10 and 2000 characters.",
    );
  }

  return withTransaction(async (client) => {
    const locked = await client.query<AgentRow>(
      `SELECT id, name, wallet_address, balance_luna, reserved_luna,
              created_at, updated_at
         FROM agents
        WHERE id = $1
        FOR UPDATE`,
      [input.agentId],
    );
    const agent = locked.rows[0];
    if (!agent) {
      throw errors.unauthorized("A valid agent API key is required.");
    }

    const available = toLuna(agent.balance_luna) - toLuna(agent.reserved_luna);
    if (available < reward) {
      throw errors.conflict(
        "INSUFFICIENT_AGENT_BALANCE",
        `Deposit at least ${reward} additional Luna before posting this consultation.`,
      );
    }

    const publicRef = randomBytes(8).toString("hex");
    const fundingDeadline = new Date(Date.now() + AGENT_CONSULTATION_TTL_MS);
    const sessionResult = await client.query<{
      id: string;
      public_ref: string;
    }>(
      `INSERT INTO requester_sessions
         (public_ref, requester_type, state, network_id, treasury_address,
          expected_funding_luna, reward_per_answer_luna, max_consultations,
          max_reward_liability_luna, reserved_liability_luna, unused_credit_luna,
          funding_deadline, agent_id)
       VALUES ($1, 'EXTERNAL_AGENT', 'AVAILABLE', 'testnet', $2,
               $3, $3, 1, $3, $3, 0, $4, $5)
       RETURNING id, public_ref`,
      [
        publicRef,
        config.nimiqTreasuryAddress,
        lunaString(reward),
        fundingDeadline,
        agent.id,
      ],
    );
    const session = sessionResult.rows[0];

    const consultationResult = await client.query<{
      id: string;
      question: string;
      context: string;
      reward_luna: string;
      status: string;
      created_at: Date;
    }>(
      `INSERT INTO agent_consultations
         (agent_id, requester_session_id, question, context, reward_luna, status)
       VALUES ($1, $2, $3, $4, $5, 'AVAILABLE')
       RETURNING id, question, context, reward_luna, status, created_at`,
      [agent.id, session.id, question, context, lunaString(reward)],
    );
    const consultation = consultationResult.rows[0];

    const updatedResult = await client.query<AgentRow>(
      `UPDATE agents
          SET reserved_luna = reserved_luna + $2,
              updated_at = now()
        WHERE id = $1
        RETURNING id, name, wallet_address, balance_luna, reserved_luna,
                  created_at, updated_at`,
      [agent.id, lunaString(reward)],
    );

    await recordAudit(client, {
      actorType: "AGENT",
      actorId: agent.id,
      action: "agent_consultation_created",
      resourceType: "agent_consultation",
      resourceId: consultation.id,
      details: {
        sessionId: session.id,
        rewardLuna: lunaString(reward),
        status: consultation.status,
      },
    });

    return {
      consultation: {
        consultationId: consultation.id,
        sessionId: session.id,
        publicRef: session.public_ref,
        question: consultation.question,
        context: consultation.context,
        rewardLuna: lunaString(consultation.reward_luna),
        status: consultation.status,
        fundingDeadline: fundingDeadline.toISOString(),
      },
      agent: toAgentView(updatedResult.rows[0]),
    };
  });
}

export async function getAgentOverview(agentId: string): Promise<AgentView> {
  const result = await query<AgentRow>(
    `SELECT id, name, wallet_address, balance_luna, reserved_luna,
            created_at, updated_at
       FROM agents
      WHERE id = $1`,
    [agentId],
  );
  const agent = result.rows[0];
  if (!agent) {
    throw errors.unauthorized("A valid agent API key is required.");
  }
  return toAgentView(agent);
}

export async function listAgentConsultations(
  agentId: string,
): Promise<AgentConsultationView[]> {
  const result = await query<{
    id: string;
    public_ref: string;
    question: string;
    context: string;
    reward_luna: string;
    status: string;
    session_state: string;
    run_state: string | null;
    created_at: Date;
    updated_at: Date;
  }>(
    `SELECT c.id, s.public_ref, c.question, c.context, c.reward_luna,
            c.status, s.state AS session_state, r.state AS run_state,
            c.created_at, c.updated_at
       FROM agent_consultations c
       JOIN requester_sessions s ON s.id = c.requester_session_id
       LEFT JOIN player_runs r ON r.requester_session_id = s.id
      WHERE c.agent_id = $1
      ORDER BY c.created_at DESC
      LIMIT 50`,
    [agentId],
  );

  return result.rows.map((row) => ({
    consultationId: row.id,
    publicRef: row.public_ref,
    question: row.question,
    context: row.context,
    rewardLuna: lunaString(row.reward_luna),
    status: row.status,
    sessionState: row.session_state,
    runState: row.run_state,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }));
}

export async function listPublicAgents(): Promise<
  Array<{
    id: string;
    name: string;
    questionsPosted: number;
    activeQuestions: number;
    rewardsPaidLuna: string;
    createdAt: string;
  }>
> {
  const result = await query<{
    id: string;
    name: string;
    questions_posted: number;
    active_questions: number;
    rewards_paid_luna: string;
    created_at: Date;
  }>(
    `SELECT a.id, a.name, a.created_at,
            COUNT(c.id)::int AS questions_posted,
            COUNT(c.id) FILTER (
              WHERE c.status IN ('AVAILABLE', 'IN_PROGRESS')
            )::int AS active_questions,
            COALESCE(
              SUM(c.reward_luna) FILTER (WHERE c.status = 'ANSWERED'),
              0
            )::text AS rewards_paid_luna
       FROM agents a
       LEFT JOIN agent_consultations c ON c.agent_id = a.id
      GROUP BY a.id
     HAVING COUNT(c.id) > 0
      ORDER BY a.created_at DESC
      LIMIT 50`,
  );

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    questionsPosted: row.questions_posted,
    activeQuestions: row.active_questions,
    rewardsPaidLuna: lunaString(row.rewards_paid_luna),
    createdAt: row.created_at.toISOString(),
  }));
}
