import { describe, expect, it } from "vitest";
import { buildAgentPromptContext, sanitizeAgentPrompt } from "./llm";

describe("LLM agent prompt helpers", () => {
  it("strips markdown fences and collapses whitespace", () => {
    expect(
      sanitizeAgentPrompt(
        "```text\n  You have earned 1,500 Luna.\n\n  Here is the next question.  \n```",
      ),
    ).toBe("You have earned 1,500 Luna. Here is the next question.");
  });

  it("caps long output without cutting a word in half", () => {
    const prompt = sanitizeAgentPrompt("word ".repeat(300));
    expect(prompt.length).toBeLessThanOrEqual(601);
    expect(prompt.endsWith("…")).toBe(true);
  });

  it("builds a context with no wallet identity", () => {
    const context = buildAgentPromptContext({
      questionId: "l5-liquidation-cascade",
      questionLevel: 5,
      questionText: "How would you classify the position?",
      evidenceSummary: "Thin collateral buffer",
      earnedLuna: "2000",
      maxRewardLuna: "2500",
      maxConsultations: 5,
    });
    expect(context).toContain('"level":5');
    expect(context).toContain('"playerEarnedLuna":"2000"');
    expect(context).toContain("Liquidation cascades");
    expect(context).not.toMatch(/NQ[0-9A-Z]/);
    expect(context).not.toContain("private");
  });
});
