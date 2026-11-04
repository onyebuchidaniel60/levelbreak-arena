export interface NimiqAccount {
  type: "basic" | "vesting" | "htlc" | "staking";
  /** Decimal integer Luna string. */
  balanceLuna: string;
}

export interface NimiqTransactionDetails {
  transactionHash: string;
  state: "new" | "pending" | "included" | "confirmed" | "invalidated" | "expired";
  sender: string;
  recipient: string;
  /** Decimal integer Luna string. */
  valueLuna: string;
  /** Decimal integer Luna string. */
  feeLuna: string;
  network: string;
  blockHeight?: number;
  dataHex: string | null;
}

export interface VerifiedFunding {
  verified: boolean;
  reason:
    | "VERIFIED"
    | "NOT_INCLUDED"
    | "NETWORK_MISMATCH"
    | "SENDER_MISMATCH"
    | "RECIPIENT_MISMATCH"
    | "AMOUNT_TOO_LOW"
    | "REFERENCE_MISMATCH";
  transaction: NimiqTransactionDetails | null;
  reference: string | null;
}

export interface BasicTransferInput {
  fromAddress: string;
  privateKeyHex: string;
  toAddress: string;
  amountLuna: bigint;
  data: string;
}

export interface BasicTransferOptions {
  /**
   * Invoked after the transaction is signed and before it is broadcast.
   * The worker uses this to persist the transaction hash so an ambiguous
   * broadcast can always be reconciled without sending a second transfer.
   */
  onSigned?: (txHash: string) => Promise<void>;
}

export interface BasicTransferResult {
  txHash: string;
  transaction: NimiqTransactionDetails;
}

export interface NimiqHealth {
  ready: boolean;
  networkId: number | null;
  headHeight: number | null;
  peers: number;
}

export interface NimiqService {
  start(): Promise<void>;
  waitForConsensus(timeoutMs?: number): Promise<boolean>;
  getNetworkId(): Promise<number>;
  getHeadHeight(): Promise<number>;
  getAccount(address: string): Promise<NimiqAccount>;
  getTransaction(txHash: string): Promise<NimiqTransactionDetails>;
  buildSignAndBroadcastBasicTransfer(
    input: BasicTransferInput,
    options?: BasicTransferOptions,
  ): Promise<BasicTransferResult>;
  verifyIncomingFunding(input: {
    txHash: string;
    expectedSender: string;
    expectedRecipient: string;
    minimumAmountLuna: bigint;
    expectedReference: string;
  }): Promise<VerifiedFunding>;
  getTransactionStatus(txHash: string): Promise<{
    status: "PENDING" | "INCLUDED" | "REJECTED" | "UNKNOWN";
    transaction: NimiqTransactionDetails | null;
  }>;
  health(): Promise<NimiqHealth>;
  close(): Promise<void>;
}
