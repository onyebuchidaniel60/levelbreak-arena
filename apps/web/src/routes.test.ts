import { describe, expect, it } from "vitest";
import { appRoutePaths, primaryNav } from "./routes";

describe("route inventory", () => {
  it("contains the ten application route entries", () => {
    expect(appRoutePaths).toHaveLength(10);
    expect(new Set(appRoutePaths).size).toBe(10);
  });

  it("contains the four primary navigation entries", () => {
    expect(primaryNav.map((item) => item.label)).toEqual([
      "Play",
      "Agents",
      "History",
      "How it works",
    ]);
  });
});
