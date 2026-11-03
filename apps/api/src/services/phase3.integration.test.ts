import { createHash, randomUUID } from "node:crypto";
import { KeyPair } from "@nimiq/core";
import Fastify from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { query, closeDatabase } from "../db";
import { AppError } from "../errors";
import { getQuestionForLevel } from "../domain/consultation-definitions";
import { getScenario } from "../domain/scenario-definitions";
import type {
  BasicTransferInput,
  BasicTransferResult,
  NimiqAccount,
  NimiqHealth,
  NimiqService,
  NimiqTransactionDetails,
  VerifiedFunding,
} from "../nimiq/types";
import { checkIncomingFunding } from "../nimiq/funding-verification";
import {
  claimSession,
  createDemoSession,
  type LoggerLike,
} from "./sessions";
import {
  finishRun,
  getRunDetail,
  submitConsultationResponse,
  submitDecision,
} from "./game";
import { processQueuedPayout } from "./payouts";

const integration = process.env.LBA_INTEGRATION_DATABASE_URL
  ? describe
  : describe.skip;

const logger: LoggerLike = {
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
};

class FakeNimiq implements NimiqService {
  verifyReason: VerifiedFunding["reason"] = "VERIFIED";
  fixedTxHash: string | null = null;
  balanceLuna = "100000000";
  private counter = 0;
  private transactions = new Map<string, NimiqTransactionDetails>();

  async start(): Promise<void> {}
  async waitForConsensus(): Promise<boolean> {
    return true;
  }
  async getNetworkId(): Promise<number> {
    return 5;
  }
  async getHeadHeight(): Promise<number> {
    return 1;
  }
  async getAccount(): Promise<NimiqAccount> {
    return { type: "basic", balanceLuna: this.balanceLuna };
  }
  async getTransaction(txHash: string): Promise<NimiqTransactionDetails> {
    const transaction = this.transactions.get(txHash);
    if (!transaction) throw new Error("transaction not found");
    return transaction;
  }
  async buildSignAndBroadcastBasicTransfer(
    input: BasicTransferInput,
  ): Promise<BasicTransferResult> {
    this.counter += 1;
    const txHash =
      this.fixedTxHash ??
      createHash("sha256")
        .update(
          `${input.fromAddress}|${input.toAddress}|${input.amountLuna}|${input.data}|${this.counter}`,
        )
        .digest("hex");
    const transaction: NimiqTransactionDetails = {
      transactionHash: txHash,
      state: "included",
      sender: input.fromAddress,
      recipient: input.toAddress,
      valueLuna: input.amountLuna.toString(),
      feeLuna: "0",
      network: "TestAlbatross",
      blockHeight: 1,
      dataHex: Buffer.from(input.data, "utf8").toString("hex"),
    };
    this.transactions.set(txHash, transaction);
    return { txHash, transaction };
  }
  async verifyIncomingFunding(input: {
    txHash: string;
    expectedSender: string;
    expectedRecipient: string;
    minimumAmountLuna: bigint;
    expectedReference: string;
  }): Promise<VerifiedFunding> {
    if (this.verifyReason !== "VERIFIED") {
      return {
        verified: false,
        reason: this.verifyReason,
        transaction: null,
        reference: null,
      };
    }
    const transaction = this.transactions.get(input.txHash);
    if (!transaction) {
      return {
        verified: false,
        reason: "NOT_INCLUDED",
        transaction: null,
        reference: null,
      };
    }
    return checkIncomingFunding(transaction, input);
  }
  async getTransactionStatus(): Promise<{
    status: "PENDING" | "INCLUDED" | "REJECTED" | "UNKNOWN";
    transaction: NimiqTransactionDetails | null;
  }> {
    return { status: "UNKNOWN", transaction: null };
  }
  async health(): Promise<NimiqHealth> {
    return { ready: true, networkId: 5, headHeight: 1, peers: 3 };
  }
  async close(): Promise<void> {}
}

const tracking = {
  players: new Set<string>(),
  sessions: new Set<string>(),
  runs: new Set<string>(),
  payouts: new Set<string>(),
};

function makePlayerAddress(): string {
  const keyPair = KeyPair.generate();
  try {
    return keyPair.toAddress().toUserFriendlyAddress();
  } finally {
    keyPair.free();
  }
}

async function makePlayer(): Promise<string> {
  const result = await query<{ id: string }>(
    `INSERT INTO players (nimiq_address, public_key_hex, last_authenticated_at)
     VALUES ($1, '00', now())
     RETURNING id`,
    [makePlayerAddress()],
  );
  const id = result.rows[0].id;
  tracking.players.add(id);
  return id;
}

async function trackSessionByKey(idempotencyKey: string): Promise<void> {
  const result = await query<{ id: string }>(
    `SELECT id FROM requester_sessions WHERE creation_idempotency_key = $1`,
    [idempotencyKey],
  );
  if (result.rows[0]) tracking.sessions.add(result.rows[0].id);
}

async function createAvailableSession(
  nimiq: FakeNimiq,
): Promise<{ sessionId: string; publicRef: string; fundingTxHash: string }> {
  const idempotencyKey = randomUUID();
  try {
    const result = await createDemoSession({
      idempotencyKey,
      nimiq,
      logger,
    });
    tracking.sessions.add(result.sessionId);
    expect(result.state).toBe("AVAILABLE");
    expect(result.fundingTxHash).toBeTruthy();
    return {
      sessionId: result.sessionId,
      publicRef: result.publicRef,
      fundingTxHash: result.fundingTxHash!,
    };
  } catch (error) {
    await trackSessionByKey(idempotencyKey);
    throw error;
  }
}

async function claim(
  playerId: string,
  sessionId: string,
  idempotencyKey = randomUUID(),
) {
  const result = await claimSession({
    playerId,
    sessionId,
    idempotencyKey,
  });
  tracking.runs.add(result.runId);
  return result;
}

async function decide(
  runId: string,
  playerId: string,
  levelIndex: number,
  expectedStateVersion: number,
) {
  return submitDecision({
    runId,
    playerId,
    levelIndex,
    decisionKey: getScenario(levelIndex).choices[0].key,
    expectedStateVersion,
    idempotencyKey: randomUUID(),
  });
}

async function respond(
  runId: string,
  playerId: string,
  levelIndex: number,
  expectedStateVersion: number,
  action: "ANSWER" | "SKIP",
) {
  const question = getQuestionForLevel(levelIndex);
  return submitConsultationResponse({
    runId,
    playerId,
    questionId: question.id,
    action,
    answerKey: action === "ANSWER" ? "CANT_TELL" : undefined,
    expectedStateVersion,
    idempotencyKey: randomUUID(),
  });
}

async function playRun(
  runId: string,
  playerId: string,
  actions: Array<"ANSWER" | "SKIP">,
): Promise<number> {
  let version = 0;
  for (let level = 1; level <= 3; level += 1) {
    const decision = await decide(runId, playerId, level, version);
    version = decision.stateVersion;
    const response = await respond(
      runId,
      playerId,
      level,
      version,
      actions[level - 1],
    );
    version = response.stateVersion;
  }
  return version;
}

async function rewardLedgerTotal(runId: string): Promise<string> {
  const result = await query<{ total: string; count: string }>(
    `SELECT COALESCE(SUM(amount_luna), 0)::text AS total, count(*)::text AS count
       FROM ledger_entries
      WHERE player_run_id = $1 AND entry_type = 'REWARD_RESERVED'`,
    [runId],
  );
  return result.rows[0].total;
}

async function payoutTotals(
  runId: string,
): Promise<{ count: number; total: string }> {
  const result = await query<{ count: string; total: string }>(
    `SELECT count(*)::text AS count, COALESCE(SUM(amount_luna), 0)::text AS total
       FROM payouts WHERE player_run_id = $1`,
    [runId],
  );
  return {
    count: Number(result.rows[0].count),
    total: result.rows[0].total,
  };
}

async function sessionState(sessionId: string): Promise<string> {
  const result = await query<{ state: string }>(
    `SELECT state FROM requester_sessions WHERE id = $1`,
    [sessionId],
  );
  return result.rows[0].state;
}

integration("Phase 3 domain integration", () => {
  beforeAll(async () => {
    const schema = await query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns
        WHERE table_name = 'payouts' AND column_name = 'attempted_at'`,
    );
    if (!schema.rows[0]) {
      throw new Error(
        "Phase 3 migration is not applied. Run pnpm db:migrate against the test database.",
      );
    }
  });

  afterAll(async () => {
    const sessions = [...tracking.sessions];
    const runs = [...tracking.runs];
    const players = [...tracking.players];
    const payouts = [...tracking.payouts];
    const resourceIds = [...sessions, ...runs, ...payouts];

    if (sessions.length > 0 || runs.length > 0) {
      await query(
        `DELETE FROM ledger_entries
          WHERE requester_session_id = ANY($1::uuid[])
             OR player_run_id = ANY($2::uuid[])`,
        [sessions, runs],
      );
      await query(`DELETE FROM payouts WHERE player_run_id = ANY($1::uuid[])`, [
        runs,
      ]);
      await query(
        `DELETE FROM consultation_responses WHERE player_run_id = ANY($1::uuid[])`,
        [runs],
      );
      await query(
        `DELETE FROM scenario_decisions WHERE player_run_id = ANY($1::uuid[])`,
        [runs],
      );
      await query(
        `DELETE FROM funding_transactions WHERE requester_session_id = ANY($1::uuid[])`,
        [sessions],
      );
      await query(`DELETE FROM player_runs WHERE id = ANY($1::uuid[])`, [runs]);
      await query(`DELETE FROM requester_sessions WHERE id = ANY($1::uuid[])`, [
        sessions,
      ]);
    }
    if (resourceIds.length > 0 || players.length > 0) {
      await query(
        `DELETE FROM audit_events
          WHERE resource_id = ANY($1::text[]) OR actor_id = ANY($2::text[])`,
        [resourceIds, players],
      );
    }
    if (players.length > 0) {
      await query(`DELETE FROM players WHERE id = ANY($1::uuid[])`, [players]);
    }
    await closeDatabase();
  });

  it("does not make a session available when chain verification fails", async () => {
    const nimiq = new FakeNimiq();
    nimiq.verifyReason = "RECIPIENT_MISMATCH";
    const idempotencyKey = randomUUID();
    const result = await createDemoSession({
      idempotencyKey,
      nimiq,
      logger,
    });
    tracking.sessions.add(result.sessionId);
    expect(result.state).toBe("FUNDING_FAILED");
    expect(await sessionState(result.sessionId)).toBe("FUNDING_FAILED");

    const funding = await query<{ status: string; verification_error: string }>(
      `SELECT status, verification_error FROM funding_transactions
        WHERE requester_session_id = $1`,
      [result.sessionId],
    );
    expect(funding.rows[0].status).toBe("REJECTED");
    expect(funding.rows[0].verification_error).toBe("RECIPIENT_MISMATCH");
  });

  it("refuses to fund a second session with the same transaction hash", async () => {
    const nimiq = new FakeNimiq();
    nimiq.fixedTxHash = "c".repeat(64);
    const first = await createAvailableSession(nimiq);
    expect(first.fundingTxHash).toBe("c".repeat(64));

    const secondKey = randomUUID();
    await expect(
      createDemoSession({ idempotencyKey: secondKey, nimiq, logger }),
    ).rejects.toMatchObject({ code: "FUNDING_TX_REUSED" });
    await trackSessionByKey(secondKey);

    const count = await query<{ count: string }>(
      `SELECT count(*)::text AS count FROM funding_transactions WHERE tx_hash = $1`,
      ["c".repeat(64)],
    );
    expect(count.rows[0].count).toBe("1");
  });

  it("lets exactly one of two simultaneous claims win", async () => {
    const nimiq = new FakeNimiq();
    const session = await createAvailableSession(nimiq);
    const playerA = await makePlayer();
    const playerB = await makePlayer();

    const results = await Promise.allSettled([
      claim(playerA, session.sessionId),
      claim(playerB, session.sessionId),
    ]);
    const fulfilled = results.filter((item) => item.status === "fulfilled");
    const rejected = results.filter(
      (item): item is PromiseRejectedResult => item.status === "rejected",
    );

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason).toBeInstanceOf(AppError);
    expect((rejected[0].reason as AppError).statusCode).toBe(409);
    expect((rejected[0].reason as AppError).code).toBe("SESSION_UNAVAILABLE");

    const runs = await query<{ count: string }>(
      `SELECT count(*)::text AS count FROM player_runs WHERE requester_session_id = $1`,
      [session.sessionId],
    );
    expect(runs.rows[0].count).toBe("1");
    expect(await sessionState(session.sessionId)).toBe("IN_PROGRESS");
  });

  it("returns the same run for a repeated claim idempotency key", async () => {
    const nimiq = new FakeNimiq();
    const session = await createAvailableSession(nimiq);
    const player = await makePlayer();
    const key = randomUUID();

    const first = await claim(player, session.sessionId, key);
    const second = await claim(player, session.sessionId, key);
    expect(second.runId).toBe(first.runId);

    const runs = await query<{ count: string }>(
      `SELECT count(*)::text AS count FROM player_runs WHERE requester_session_id = $1`,
      [session.sessionId],
    );
    expect(runs.rows[0].count).toBe("1");
  });

  it("allows only one row and one reward for two simultaneous answers", async () => {
    const nimiq = new FakeNimiq();
    const session = await createAvailableSession(nimiq);
    const player = await makePlayer();
    const run = await claim(player, session.sessionId);
    const decision = await decide(run.runId, player, 1, 0);
    const question = getQuestionForLevel(1);

    const results = await Promise.allSettled([
      submitConsultationResponse({
        runId: run.runId,
        playerId: player,
        questionId: question.id,
        action: "ANSWER",
        answerKey: "RISKY",
        expectedStateVersion: decision.stateVersion,
        idempotencyKey: randomUUID(),
      }),
      submitConsultationResponse({
        runId: run.runId,
        playerId: player,
        questionId: question.id,
        action: "ANSWER",
        answerKey: "SAFE",
        expectedStateVersion: decision.stateVersion,
        idempotencyKey: randomUUID(),
      }),
    ]);

    const fulfilled = results.filter((item) => item.status === "fulfilled");
    const rejected = results.filter(
      (item): item is PromiseRejectedResult => item.status === "rejected",
    );
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0].reason as AppError).statusCode).toBe(409);
    expect((rejected[0].reason as AppError).code).toBe(
      "QUESTION_ALREADY_RESOLVED",
    );

    const responses = await query<{ count: string; reward: string }>(
      `SELECT count(*)::text AS count, COALESCE(SUM(reward_luna), 0)::text AS reward
         FROM consultation_responses WHERE player_run_id = $1`,
      [run.runId],
    );
    expect(responses.rows[0].count).toBe("1");
    expect(responses.rows[0].reward).toBe("500");

    const ledger = await query<{ count: string; total: string }>(
      `SELECT count(*)::text AS count, COALESCE(SUM(amount_luna), 0)::text AS total
         FROM ledger_entries
        WHERE player_run_id = $1 AND entry_type = 'REWARD_RESERVED'`,
      [run.runId],
    );
    expect(ledger.rows[0].count).toBe("1");
    expect(ledger.rows[0].total).toBe("500");
  });

  it("creates exactly one payout for two simultaneous finishes", async () => {
    const nimiq = new FakeNimiq();
    const session = await createAvailableSession(nimiq);
    const player = await makePlayer();
    const run = await claim(player, session.sessionId);
    await playRun(run.runId, player, ["ANSWER", "ANSWER", "ANSWER"]);

    const results = await Promise.allSettled([
      finishRun({
        runId: run.runId,
        playerId: player,
        idempotencyKey: randomUUID(),
      }),
      finishRun({
        runId: run.runId,
        playerId: player,
        idempotencyKey: randomUUID(),
      }),
    ]);

    const fulfilled = results.filter(
      (item): item is PromiseFulfilledResult<Awaited<ReturnType<typeof finishRun>>> =>
        item.status === "fulfilled",
    );
    expect(fulfilled).toHaveLength(2);
    const payoutIds = new Set(fulfilled.map((item) => item.value.payoutId));
    expect(payoutIds.size).toBe(1);
    const payoutId = [...payoutIds][0];
    expect(payoutId).toBeTruthy();
    tracking.payouts.add(payoutId!);

    const totals = await payoutTotals(run.runId);
    expect(totals.count).toBe(1);
    expect(totals.total).toBe("1500");
    expect(await rewardLedgerTotal(run.runId)).toBe("1500");
  });

  it("computes the three required ledger cases", async () => {
    const cases = [
      {
        actions: ["ANSWER", "ANSWER", "ANSWER"] as const,
        expectedEarned: "1500",
        expectedPayout: "1500",
      },
      {
        actions: ["ANSWER", "SKIP", "ANSWER"] as const,
        expectedEarned: "1000",
        expectedPayout: "1000",
      },
      {
        actions: ["SKIP", "SKIP", "SKIP"] as const,
        expectedEarned: "0",
        expectedPayout: null,
      },
    ];

    for (const testCase of cases) {
      const nimiq = new FakeNimiq();
      const session = await createAvailableSession(nimiq);
      const player = await makePlayer();
      const run = await claim(player, session.sessionId);
      await playRun(run.runId, player, [...testCase.actions]);
      const finished = await finishRun({
        runId: run.runId,
        playerId: player,
        idempotencyKey: randomUUID(),
      });

      expect(finished.earnedLuna).toBe(testCase.expectedEarned);
      expect(await rewardLedgerTotal(run.runId)).toBe(testCase.expectedEarned);

      const totals = await payoutTotals(run.runId);
      if (testCase.expectedPayout === null) {
        expect(finished.state).toBe("COMPLETED_NO_REWARD");
        expect(finished.payoutId).toBeNull();
        expect(totals.count).toBe(0);
        expect(totals.total).toBe("0");

        const unused = await query<{ amount_luna: string }>(
          `SELECT amount_luna FROM ledger_entries
            WHERE requester_session_id = $1 AND entry_type = 'UNUSED_CREDIT'`,
          [session.sessionId],
        );
        expect(unused.rows[0].amount_luna).toBe("1500");
        expect(await sessionState(session.sessionId)).toBe("SETTLED");
      } else {
        expect(finished.state).toBe("PAYOUT_QUEUED");
        expect(totals.count).toBe(1);
        expect(totals.total).toBe(testCase.expectedPayout);
        tracking.payouts.add(finished.payoutId!);
      }
    }
  });

  it("confirms a payout through the disabled-by-default worker with a mocked adapter", async () => {
    const nimiq = new FakeNimiq();
    const session = await createAvailableSession(nimiq);
    const player = await makePlayer();
    const run = await claim(player, session.sessionId);
    await playRun(run.runId, player, ["ANSWER", "SKIP", "SKIP"]);
    const finished = await finishRun({
      runId: run.runId,
      playerId: player,
      idempotencyKey: randomUUID(),
    });
    expect(finished.payoutId).toBeTruthy();
    tracking.payouts.add(finished.payoutId!);

    // Isolate the worker test from payout rows queued by earlier cases.
    await query(
      `UPDATE payouts
          SET status = 'CANCELLED', updated_at = now()
        WHERE status = 'QUEUED' AND id <> $1`,
      [finished.payoutId],
    );

    const confirmed = await processQueuedPayout({ nimiq, logger });
    expect(confirmed?.status).toBe("CONFIRMED");
    expect(confirmed?.amount_luna).toBe("500");
    expect(confirmed?.tx_hash).toHaveLength(64);

    const state = await query<{
      run_state: string;
      session_state: string;
      payout_status: string;
    }>(
      `SELECT r.state AS run_state, s.state AS session_state, p.status AS payout_status
         FROM payouts p
         JOIN player_runs r ON r.id = p.player_run_id
         JOIN requester_sessions s ON s.id = r.requester_session_id
        WHERE p.id = $1`,
      [finished.payoutId],
    );
    expect(state.rows[0]).toMatchObject({
      run_state: "PAYOUT_CONFIRMED",
      session_state: "SETTLED",
      payout_status: "CONFIRMED",
    });

    const ledger = await query<{ count: string; total: string }>(
      `SELECT count(*)::text AS count, COALESCE(SUM(amount_luna), 0)::text AS total
         FROM ledger_entries
        WHERE player_run_id = $1 AND entry_type = 'PAYOUT_CONFIRMED'`,
      [run.runId],
    );
    expect(ledger.rows[0].count).toBe("1");
    expect(ledger.rows[0].total).toBe("500");
  });

  it("serializes run detail without BigInt and strips scenario outcomes", async () => {
    const nimiq = new FakeNimiq();
    const session = await createAvailableSession(nimiq);
    const player = await makePlayer();
    const run = await claim(player, session.sessionId);

    const detail = await getRunDetail(run.runId, player);
    const app = Fastify({ logger: false });
    app.get("/api/runs/:runId", async () => detail);
    const response = await app.inject({
      method: "GET",
      url: `/api/runs/${run.runId}`,
    });
    await app.close();

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.scenario).toBeTruthy();
    expect(Array.isArray(body.scenario.choices)).toBe(true);
    expect(body.scenario.choices.length).toBeGreaterThan(0);
    for (const choice of body.scenario.choices) {
      expect(Object.keys(choice).sort()).toEqual(["decisionKey", "label"]);
    }

    const serialized = JSON.stringify(body);
    expect(() => JSON.stringify(body)).not.toThrow();
    expect(serialized).not.toContain("outcomes");
    expect(serialized).not.toContain("resultingPortfolio");
    expect(serialized).not.toContain("explanation");
    expect(serialized).not.toContain("basisPoints");
  });
});
