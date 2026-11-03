import { describe, expect, it } from "vitest";
import { apiUrl, resolveApiBaseUrl } from "./api";

describe("same-origin API client", () => {
  it("uses a relative path when the base URL is empty or unset", () => {
    expect(resolveApiBaseUrl(undefined)).toBe("");
    expect(resolveApiBaseUrl("")).toBe("");
    expect(resolveApiBaseUrl("   ")).toBe("");
    expect(apiUrl("/api/me", resolveApiBaseUrl(""))).toBe("/api/me");
    expect(apiUrl("api/me", resolveApiBaseUrl(undefined))).toBe("/api/me");
  });

  it("uses a configured base URL in local development", () => {
    expect(resolveApiBaseUrl("http://127.0.0.1:3001/")).toBe(
      "http://127.0.0.1:3001",
    );
    expect(
      apiUrl("/api/config/public", resolveApiBaseUrl("http://127.0.0.1:3001")),
    ).toBe("http://127.0.0.1:3001/api/config/public");
  });
});
