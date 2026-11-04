import { describe, expect, it } from "vitest";
import {
  evidenceSchema,
  historyResponseSchema,
  payoutResponseSchema,
  runDetailSchema,
} from "@levelbreak-arena/contracts";

const runDetailFixture = {
  runId: "11111111-1111-4111-8111-111111111111",
  state: "IN_PROGRESS",
  levelIndex: 1,
  maxConsultations: 5,
  stateVersion: 0,
  portfolio: { unit: "vUSDT", value: "100000000", version: "1" },
  earnedLuna: "0",
  maxRewardLuna: "2500",
  payoutStatus: "NONE",
  scenario: {
    id: "level-1-stablecoin-peg",
    version: "1",
    levelIndex: 1,
    title: "Level 1 — Stablecoin peg risk",
    setting: "A simulated wallet holds 1,000 vUSDT.",
    situation: "A new stablecoin advertises 12% APY.",
    prompt: "Stay or move?",
    choices: [
      { decisionKey: "STAY", label: "Stay" },
      { decisionKey: "MOVE", label: "Move" },
    ],
  },
  consultation: {
    id: "l1-stablecoin-peg",
    levelIndex: 1,
    evidenceVersion: "evidence-2026-11-01",
    agentContext: "LLM-assisted demo requester",
    agentConfidence: "medium",
    agentMessage: "Review the evidence.",
    evidence: {
      type: "data_card",
      title: "Facts",
      lines: ["New token: 12% APY"],
    },
    question: "How would you classify it?",
    options: [
      { key: "SAFE", label: "Safe", description: "Safe." },
      { key: "RISKY", label: "Risky", description: "Risky." },
      { key: "CANT_TELL", label: "Can't tell", description: "Unknown." },
    ],
    rewardLuna: "500",
  },
  decisions: [],
  responses: [],
};

describe("shared API contracts", () => {
  it("parses a run-detail response with the Phase 4 scenario projection", () => {
    const parsed = runDetailSchema.parse(runDetailFixture);
    expect(parsed.scenario?.choices).toEqual([
      { decisionKey: "STAY", label: "Stay" },
      { decisionKey: "MOVE", label: "Move" },
    ]);
    expect(parsed.consultation?.rewardLuna).toBe("500");
  });

  it("keeps unsupported evidence parseable for a clear UI fallback", () => {
    const parsed = evidenceSchema.parse({
      type: "future_evidence",
      title: "New evidence",
      payload: { anything: true },
    });
    expect(parsed.type).toBe("future_evidence");
  });

  it("parses payout and history envelopes", () => {
    expect(
      payoutResponseSchema.parse({
        payoutId: null,
        status: "NONE",
        amountLuna: "0",
        txHash: null,
        explorerUrl: null,
      }).status,
    ).toBe("NONE");

    expect(
      historyResponseSchema.parse({ items: [], nextCursor: null }).items,
    ).toEqual([]);
  });
});
