import { describe, expect, it } from "vitest";
import { buildVerifyRequest, friendlyAuthError } from "./nimiq";
import { ApiError } from "./api";

describe("Nimiq wallet auth payload", () => {
  it("sends the challenge returned by the backend unchanged", () => {
    const nonce = {
      nonceId: "11111111-1111-4111-8111-111111111111",
      challenge:
        "LevelBreak Arena login\nOrigin: https://levelbreak-arena.vercel.app\nNonce: abc",
    };
    const signed = {
      publicKey: "a".repeat(64),
      signature: "b".repeat(128),
    };

    const request = buildVerifyRequest(
      nonce,
      signed,
      "NQ23 RSJF DP1Q 894D Q346 V1HK C8F5 GM4F 0J9T",
    );

    expect(request.challenge).toBe(nonce.challenge);
    expect(request.publicKey).toBe(signed.publicKey);
    expect(request.signature).toBe(signed.signature);
    expect(request.address).toBe(
      "NQ23 RSJF DP1Q 894D Q346 V1HK C8F5 GM4F 0J9T",
    );
  });

  it("maps INVALID_SIGNATURE to a wallet-facing message", () => {
    expect(
      friendlyAuthError(
        new ApiError(401, "INVALID_SIGNATURE", "Signature verification failed."),
      ),
    ).toMatch(/signature could not be verified/i);
  });
});
