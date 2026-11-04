import { describe, expect, it } from "vitest";
import { buildExplorerUrl } from "./game";

describe("buildExplorerUrl", () => {
  const txHash = "0123456789abcdef";

  it("appends the hash to fragment-based explorers", () => {
    expect(buildExplorerUrl("https://test.nimiq.watch/#", txHash)).toBe(
      "https://test.nimiq.watch/#0123456789abcdef",
    );
    expect(buildExplorerUrl("https://test.nimiq.watch/#/tx/", txHash)).toBe(
      "https://test.nimiq.watch/#/tx/0123456789abcdef",
    );
  });

  it("resolves path-based explorers with and without a trailing slash", () => {
    expect(buildExplorerUrl("https://explorer.example/tx/", txHash)).toBe(
      "https://explorer.example/tx/0123456789abcdef",
    );
    expect(buildExplorerUrl("https://explorer.example/tx", txHash)).toBe(
      "https://explorer.example/tx/0123456789abcdef",
    );
  });
});
