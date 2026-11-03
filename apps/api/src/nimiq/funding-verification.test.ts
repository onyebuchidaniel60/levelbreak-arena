import { describe, expect, it } from "vitest";
import { checkIncomingFunding } from "./funding-verification";
import type { NimiqTransactionDetails } from "./types";

const DEMO = "NQ23 RSJF DP1Q 894D Q346 V1HK C8F5 GM4F 0J9T";
const TREASURY = "NQ83 S85U 0B01 BVY2 RR74 C23E 845S NAKE 1YM3";
const REFERENCE = "LBA1:1bfa7f2473dd7fb9";

function transaction(
  overrides: Partial<NimiqTransactionDetails> = {},
): NimiqTransactionDetails {
  return {
    transactionHash: "a".repeat(64),
    state: "included",
    sender: DEMO,
    recipient: TREASURY,
    valueLuna: "1500",
    feeLuna: "0",
    network: "TestAlbatross",
    blockHeight: 15762500,
    dataHex: Buffer.from(REFERENCE, "utf8").toString("hex"),
    ...overrides,
  };
}

const expected = {
  expectedSender: DEMO,
  expectedRecipient: TREASURY,
  minimumAmountLuna: 1500n,
  expectedReference: REFERENCE,
};

describe("incoming funding verification", () => {
  it("accepts a matching, included testnet transaction", () => {
    const result = checkIncomingFunding(transaction(), expected);
    expect(result.verified).toBe(true);
    expect(result.reason).toBe("VERIFIED");
    expect(result.reference).toBe(REFERENCE);
  });

  it("rejects a transaction that is not included", () => {
    expect(checkIncomingFunding(transaction({ state: "pending" }), expected).reason).toBe(
      "NOT_INCLUDED",
    );
    expect(
      checkIncomingFunding(transaction({ state: "invalidated" }), expected).reason,
    ).toBe("NOT_INCLUDED");
  });

  it("rejects a non-testnet network", () => {
    expect(
      checkIncomingFunding(transaction({ network: "MainAlbatross" }), expected).reason,
    ).toBe("NETWORK_MISMATCH");
  });

  it("rejects the wrong sender", () => {
    expect(
      checkIncomingFunding(transaction({ sender: TREASURY }), expected).reason,
    ).toBe("SENDER_MISMATCH");
  });

  it("rejects the wrong recipient", () => {
    expect(
      checkIncomingFunding(transaction({ recipient: DEMO }), expected).reason,
    ).toBe("RECIPIENT_MISMATCH");
  });

  it("rejects an insufficient amount", () => {
    expect(
      checkIncomingFunding(transaction({ valueLuna: "1499" }), expected).reason,
    ).toBe("AMOUNT_TOO_LOW");
  });

  it("rejects a missing or wrong LBA1 reference", () => {
    expect(
      checkIncomingFunding(transaction({ dataHex: null }), expected).reason,
    ).toBe("REFERENCE_MISMATCH");
    expect(
      checkIncomingFunding(
        transaction({
          dataHex: Buffer.from("LBA1:ffffffffffffffff", "utf8").toString("hex"),
        }),
        expected,
      ).reason,
    ).toBe("REFERENCE_MISMATCH");
  });
});
