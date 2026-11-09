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

import { generateAgentPrompt } from "./llm";

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
