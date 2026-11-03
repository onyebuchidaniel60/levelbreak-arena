import { addressesEqual } from "./address";
import type { NimiqTransactionDetails, VerifiedFunding } from "./types";

export type FundingVerificationInput = {
  expectedSender: string;
  expectedRecipient: string;
  minimumAmountLuna: bigint;
  expectedReference: string;
};

export function checkIncomingFunding(
  transaction: NimiqTransactionDetails,
  input: FundingVerificationInput,
): VerifiedFunding {
  if (transaction.state !== "included" && transaction.state !== "confirmed") {
    return {
      verified: false,
      reason: "NOT_INCLUDED",
      transaction,
      reference: null,
    };
  }

  const network = transaction.network.toLowerCase();
  if (
    !network.includes("testalbatross") &&
    network !== "testnet" &&
    network !== "5"
  ) {
    return {
      verified: false,
      reason: "NETWORK_MISMATCH",
      transaction,
      reference: null,
    };
  }

  if (!addressesEqual(transaction.sender, input.expectedSender)) {
    return {
      verified: false,
      reason: "SENDER_MISMATCH",
      transaction,
      reference: null,
    };
  }

  if (!addressesEqual(transaction.recipient, input.expectedRecipient)) {
    return {
      verified: false,
      reason: "RECIPIENT_MISMATCH",
      transaction,
      reference: null,
    };
  }

  if (BigInt(transaction.valueLuna) < input.minimumAmountLuna) {
    return {
      verified: false,
      reason: "AMOUNT_TOO_LOW",
      transaction,
      reference: null,
    };
  }

  const dataHex = transaction.dataHex ?? "";
  const reference = Buffer.from(dataHex, "hex").toString("utf8");
  if (reference !== input.expectedReference) {
    return {
      verified: false,
      reason: "REFERENCE_MISMATCH",
      transaction,
      reference,
    };
  }

  return {
    verified: true,
    reason: "VERIFIED",
    transaction,
    reference,
  };
}
