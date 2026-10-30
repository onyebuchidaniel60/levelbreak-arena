import { describe, expect, it } from "vitest";
import { appRoutePaths, primaryNav } from "./routes";

describe("route inventory", () => {
  it("contains the nine Phase 1 route entries", () => {
    expect(appRoutePaths).toHaveLength(9);
    expect(new Set(appRoutePaths).size).toBe(9);
  });

  it("contains the three primary navigation entries", () => {
    expect(primaryNav.map((item) => item.label)).toEqual(["Play", "History", "How it works"]);
  });
});
