import { describe, expect, it } from "vitest";
import {
  CONSULTATION_QUESTIONS,
  getQuestionById,
  getQuestionForLevel,
  isAllowedAnswer,
} from "./consultation-definitions";

describe("consultation definitions", () => {
  it("has one question per level with the fixed reward", () => {
    expect(CONSULTATION_QUESTIONS).toHaveLength(3);
    expect(CONSULTATION_QUESTIONS.map((item) => item.levelIndex)).toEqual([
      1, 2, 3,
    ]);
    for (const question of CONSULTATION_QUESTIONS) {
      expect(question.rewardLuna).toBe(500n);
      expect(question.evidenceVersion).toMatch(/^evidence-/);
    }
  });

  it("renders evidence before the question in object order", () => {
    for (const question of CONSULTATION_QUESTIONS) {
      const keys = Object.keys(question);
      expect(keys.indexOf("evidence")).toBeLessThan(keys.indexOf("question"));
    }
  });

  it("always offers Can't tell as a valid option", () => {
    for (const question of CONSULTATION_QUESTIONS) {
      expect(question.options.some((option) => option.key === "CANT_TELL")).toBe(
        true,
      );
      expect(isAllowedAnswer(question, "CANT_TELL")).toBe(true);
      expect(isAllowedAnswer(question, "NOT_AN_OPTION")).toBe(false);
    }
  });

  it("looks up questions by level and id", () => {
    const levelTwo = getQuestionForLevel(2);
    expect(levelTwo.id).toBe("l2-impermanent-loss");
    expect(getQuestionById(levelTwo.id)).toBe(levelTwo);
    expect(getQuestionById("missing")).toBeNull();
  });

  it("has no hidden correct-answer field", () => {
    for (const question of CONSULTATION_QUESTIONS) {
      expect(question).not.toHaveProperty("correctAnswer");
      expect(question).not.toHaveProperty("answerKey");
    }
  });
});
