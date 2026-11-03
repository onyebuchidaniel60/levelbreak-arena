import { describe, expect, it } from "vitest";
import {
  evaluateScenario,
  getScenario,
  SCENARIOS,
  STARTING_PORTFOLIO_UNITS,
} from "./scenario-definitions";

const START = STARTING_PORTFOLIO_UNITS;

describe("scenario definitions", () => {
  it("defines exactly one scenario per level", () => {
    expect(SCENARIOS).toHaveLength(3);
    expect(SCENARIOS.map((scenario) => scenario.levelIndex)).toEqual([1, 2, 3]);
  });

  it("covers every authored decision branch", () => {
    expect(evaluateScenario(1, "STAY", START)).toMatchObject({
      portfolioBefore: "100000000",
      portfolioAfter: "100000000",
      delta: "0",
    });
    expect(evaluateScenario(1, "MOVE", START)).toMatchObject({
      portfolioBefore: "100000000",
      portfolioAfter: "80000000",
      delta: "-20000000",
    });
    expect(evaluateScenario(2, "STAY", START)).toMatchObject({
      portfolioAfter: "112000000",
      delta: "12000000",
    });
    expect(evaluateScenario(2, "EXIT", START)).toMatchObject({
      portfolioAfter: "115000000",
      delta: "15000000",
    });
    expect(evaluateScenario(3, "APE", START)).toMatchObject({
      portfolioAfter: "40000000",
      delta: "-60000000",
    });
    expect(evaluateScenario(3, "READ", START)).toMatchObject({
      portfolioAfter: "100000000",
      delta: "0",
    });
  });

  it("rejects unknown decisions and levels", () => {
    expect(() => evaluateScenario(1, "YOLO", START)).toThrow();
    expect(() => getScenario(4)).toThrow();
  });

  it("contains a consequence and lesson for every branch", () => {
    for (const scenario of SCENARIOS) {
      for (const choice of scenario.choices) {
        const outcome = scenario.outcomes[choice.key];
        expect(outcome).toBeDefined();
        expect(outcome.explanation.length).toBeGreaterThan(20);
        expect(outcome.lesson.length).toBeGreaterThan(10);
      }
    }
  });
});
