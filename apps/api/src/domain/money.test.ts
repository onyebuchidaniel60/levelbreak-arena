import { describe, expect, it } from "vitest";
import {
  applyBasisPoints,
  lunaString,
  lunaToNimString,
  toLuna,
} from "../domain/money";

describe("Luna money helpers", () => {
  it("keeps large integer Luna values exact", () => {
    const huge = "9007199254740993000";
    expect(toLuna(huge)).toBe(9007199254740993000n);
    expect(lunaString(huge)).toBe(huge);
  });

  it("formats 500 Luna as 0.00500 NIM", () => {
    expect(lunaToNimString(500n)).toBe("0.00500");
    expect(lunaToNimString(1500n)).toBe("0.01500");
  });

  it("applies basis points with integer arithmetic", () => {
    expect(applyBasisPoints(100_000_000n, 8_000n)).toBe(80_000_000n);
    expect(applyBasisPoints(100_000_000n, 11_500n)).toBe(115_000_000n);
  });

  it("rejects floating-point or malformed Luna strings", () => {
    expect(() => toLuna("0.005")).toThrow();
    expect(() => toLuna("500.0")).toThrow();
  });
});
