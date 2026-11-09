import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../config", () => ({
  config: {
    llmApiKey: "test-key",
    llmBaseUrl: "https://llm.example/v1",
    llmModel: "test-model",
    llmTimeoutMs: 1_000,
  },
}));

vi.mock("../db", () => ({
  query: vi.fn().mockResolvedValue({
    rows: [
      {
        id: "run-1",
        player_id: "player-1",
        state: "CONSULTATION_PENDING",
        level_index: 1,
        reward_earned_luna: "500",
        max_consultations: 5,
        max_reward_liability_luna: "2500",
      },
    ],
  }),
}));

import { generateAgentPrompt, generateLevelScenario } from "./llm";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("LLM agent prompt generation", () => {
  it("uses a sanitized LLM response when the provider succeeds", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content:
                "```text\n  You have earned 500 Luna.  \n\n  Here is the next question.  \n```",
            },
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateAgentPrompt({
      runId: "run-1",
      playerId: "player-1",
      questionId: "l1-stablecoin-peg",
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/chat/completions"),
      expect.objectContaining({
        headers: expect.objectContaining({
          "user-agent": "LevelBreakArena/1.0",
        }),
      }),
    );
    const requestInit = fetchMock.mock.calls[0][1] as RequestInit;
    const requestBody = JSON.parse(String(requestInit.body));
    expect(requestBody.messages[0].content).toContain(
      "You are an AI Agent evaluating a new DeFi protocol.",
    );
    expect(requestBody.messages[0].content).toContain(
      "Do not ask trivia questions.",
    );
    expect(requestBody.messages[0].content).toContain(
      "Ask for their judgment and reasoning.",
    );
    expect(result.source).toBe("llm");
    expect(result.prompt).toBe(
      "You have earned 500 Luna. Here is the next question.",
    );
  });

  it("falls back to the scripted message on a provider error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({}) }),
    );

    const result = await generateAgentPrompt({
      runId: "run-2",
      playerId: "player-1",
      questionId: "l1-stablecoin-peg",
    });

    expect(result.source).toBe("scripted");
    expect(result.prompt.length).toBeGreaterThan(20);
  });
});

describe("AI level generation", () => {
  const context = {
    runId: "run-1",
    levelIndex: 1,
    portfolioUnits: "100000000",
    portfolioUnit: "vUSDT",
    earnedLuna: "0",
    maxRewardLuna: "2500",
    maxConsultations: 5,
  };

  it("validates and normalizes strict JSON level content", async () => {
    const content = {
      title: "The Peg That Slips",
      situation:
        "A new stablecoin advertises 12% APY while its reserve attestations are missing.",
      decisions: [
        {
          decisionKey: "SAFE",
          label: "Keep the established stablecoin",
          resultingPortfolio: 1050,
          explanation:
            "The simulated established stablecoin holds its peg while the new token depegs.",
        },
        {
          decisionKey: "RISKY",
          label: "Move into the new stablecoin",
          resultingPortfolio: 800,
          explanation:
            "The simulated new token depegs by 20%, reducing the virtual portfolio.",
        },
      ],
      consultation: {
        question: "How would you classify the new stablecoin?",
        evidence: {
          type: "text_snippet",
          payload:
            "New token: 12% APY. Reserve attestations: none shown. Established token: long operating history.",
        },
        options: ["SAFE", "RISKY", "CANT_TELL"],
      },
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(content) } }],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateLevelScenario(1, context);

    expect(result.source).toBe("llm");
    expect(result.scenario.title).toBe("The Peg That Slips");
    expect(result.scenario.choices.map((choice) => choice.decisionKey)).toEqual([
      "SAFE",
      "RISKY",
    ]);
    expect(result.consultation.evidence.type).toBe("text_snippet");
    expect(result.decisions[0].resultingPortfolioUnits).toBe("105000000");
    expect(result.decisions[1].resultingPortfolioUnits).toBe("80000000");
  });

  it("falls back to the static level content on a provider error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({}) }),
    );

    const result = await generateLevelScenario(1, context);

    expect(result.source).toBe("scripted");
    expect(result.scenario.title).toMatch(/Stablecoin peg risk/i);
    expect(result.decisions).toHaveLength(2);
    expect(result.consultation.options).toHaveLength(3);
  });
});
