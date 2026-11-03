import {
  Address,
  Client,
  ClientConfiguration,
  KeyPair,
  PrivateKey,
  TransactionBuilder,
} from "@nimiq/core";
import type { PlainTransactionDetails } from "@nimiq/core";
import { addressesEqual, normalizeAddress } from "./address";
import type {
  BasicTransferInput,
  BasicTransferResult,
  NimiqAccount,
  NimiqHealth,
  NimiqService,
  NimiqTransactionDetails,
  VerifiedFunding,
} from "./types";

export const TESTNET_NETWORK_ID = 5;
export const TESTNET_SEED_NODES = [
  "/dns4/seed1.pos.nimiq-testnet.com/tcp/8443/wss",
];

function mapTransaction(details: PlainTransactionDetails): NimiqTransactionDetails {
  return {
    transactionHash: details.transactionHash,
    state: details.state,
    sender: normalizeAddress(details.sender),
    recipient: normalizeAddress(details.recipient),
    valueLuna: Number(details.value),
    feeLuna: Number(details.fee),
    network: details.network,
    blockHeight: details.blockHeight,
    dataHex: details.data?.raw ?? null,
  };
}

export class NimiqWebClientService implements NimiqService {
  private client: Client | null = null;
  private starting: Promise<void> | null = null;

  async start(): Promise<void> {
    if (this.client) return;
    if (this.starting) return this.starting;

    this.starting = (async () => {
      if (process.env.NIMIQ_NETWORK !== "testnet") {
        throw new Error("NIMIQ_NETWORK must be testnet");
      }

      const config = new ClientConfiguration();
      config.network("TestAlbatross");
      config.seedNodes(TESTNET_SEED_NODES);
      config.desiredPeerCount(3);
      config.onlySecureWsConnections(true);
      config.logLevel("warn");

      this.client = await Client.create(config.build());
    })();

    try {
      await this.starting;
    } finally {
      this.starting = null;
    }
  }

  private requireClient(): Client {
    if (!this.client) {
      throw new Error("Nimiq client is not started");
    }
    return this.client;
  }

  async waitForConsensus(timeoutMs = 60_000): Promise<boolean> {
    await this.start();
    const client = this.requireClient();
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
      try {
        const [consensus, addressBook] = await Promise.all([
          client.isConsensusEstablished(),
          client.getAddressBook(),
        ]);
        if (consensus && addressBook.length > 0) {
          return true;
        }
      } catch {
        // The client may not be connected yet.
      }
      await new Promise((resolve) => setTimeout(resolve, 2_000));
    }

    return false;
  }

  async getNetworkId(): Promise<number> {
    await this.start();
    return this.requireClient().getNetworkId();
  }

  async getHeadHeight(): Promise<number> {
    await this.start();
    return this.requireClient().getHeadHeight();
  }

  async getAccount(address: string): Promise<NimiqAccount> {
    await this.start();
    const account = await this.requireClient().getAccount(address);
    return {
      type: account.type,
      balanceLuna: Number(account.balance),
    };
  }

  async getTransaction(txHash: string): Promise<NimiqTransactionDetails> {
    await this.start();
    const details = await this.requireClient().getTransaction(txHash);
    return mapTransaction(details);
  }

  async buildSignAndBroadcastBasicTransfer(
    input: BasicTransferInput,
  ): Promise<BasicTransferResult> {
    await this.start();
    const client = this.requireClient();
    const networkId = await client.getNetworkId();
    if (networkId !== TESTNET_NETWORK_ID) {
      throw new Error("Refusing to sign outside TestAlbatross");
    }

    const data = Buffer.from(input.data, "utf8");
    if (data.length > 64) {
      throw new Error("Transaction data exceeds the 64-byte basic-transfer limit");
    }

    const privateKey = PrivateKey.fromHex(input.privateKeyHex);
    const keyPair = KeyPair.derive(privateKey);
    let transaction = null;

    try {
      const sender = keyPair.toAddress().toUserFriendlyAddress();
      if (!addressesEqual(sender, input.fromAddress)) {
        throw new Error("Demo-agent private key does not match configured address");
      }

      const headHeight = await client.getHeadHeight();
      transaction = TransactionBuilder.newBasicWithData(
        Address.fromUserFriendlyAddress(input.fromAddress),
        Address.fromUserFriendlyAddress(input.toAddress),
        data,
        input.amountLuna,
        0n,
        headHeight + 1,
        networkId,
      );

      transaction.sign(keyPair, undefined);
      const details = await client.sendTransaction(transaction);
      return {
        txHash: details.transactionHash,
        transaction: mapTransaction(details),
      };
    } finally {
      try {
        transaction?.free();
      } catch {
        // Ignore WASM cleanup errors.
      }
      try {
        keyPair.free();
      } catch {
        // Ignore WASM cleanup errors.
      }
      try {
        privateKey.free();
      } catch {
        // Ignore WASM cleanup errors.
      }
    }
  }

  async verifyIncomingFunding(input: {
    txHash: string;
    expectedSender: string;
    expectedRecipient: string;
    minimumAmountLuna: bigint;
    expectedReference: string;
  }): Promise<VerifiedFunding> {
    const transaction = await this.getTransaction(input.txHash);

    if (transaction.state !== "included" && transaction.state !== "confirmed") {
      return { verified: false, reason: "NOT_INCLUDED", transaction, reference: null };
    }

    const network = transaction.network.toLowerCase();
    if (!network.includes("testalbatross") && network !== "testnet" && network !== "5") {
      return { verified: false, reason: "NETWORK_MISMATCH", transaction, reference: null };
    }

    if (!addressesEqual(transaction.sender, input.expectedSender)) {
      return { verified: false, reason: "SENDER_MISMATCH", transaction, reference: null };
    }

    if (!addressesEqual(transaction.recipient, input.expectedRecipient)) {
      return { verified: false, reason: "RECIPIENT_MISMATCH", transaction, reference: null };
    }

    if (BigInt(transaction.valueLuna) < input.minimumAmountLuna) {
      return { verified: false, reason: "AMOUNT_TOO_LOW", transaction, reference: null };
    }

    const dataHex = transaction.dataHex ?? "";
    const reference = Buffer.from(dataHex, "hex").toString("utf8");
    if (reference !== input.expectedReference) {
      return { verified: false, reason: "REFERENCE_MISMATCH", transaction, reference };
    }

    return { verified: true, reason: "VERIFIED", transaction, reference };
  }

  async getTransactionStatus(txHash: string): Promise<{
    status: "PENDING" | "INCLUDED" | "REJECTED" | "UNKNOWN";
    transaction: NimiqTransactionDetails | null;
  }> {
    try {
      const transaction = await this.getTransaction(txHash);
      if (transaction.state === "included" || transaction.state === "confirmed") {
        return { status: "INCLUDED", transaction };
      }
      if (transaction.state === "invalidated" || transaction.state === "expired") {
        return { status: "REJECTED", transaction };
      }
      return { status: "PENDING", transaction };
    } catch {
      return { status: "UNKNOWN", transaction: null };
    }
  }

  async health(): Promise<NimiqHealth> {
    if (!this.client) {
      return { ready: false, networkId: null, headHeight: null, peers: 0 };
    }

    try {
      const [consensus, addressBook] = await Promise.all([
        this.client.isConsensusEstablished(),
        this.client.getAddressBook(),
      ]);
      const [networkId, headHeight] = await Promise.all([
        this.client.getNetworkId(),
        consensus ? this.client.getHeadHeight() : Promise.resolve(null),
      ]);
      return {
        ready: consensus && addressBook.length > 0,
        networkId,
        headHeight,
        peers: addressBook.length,
      };
    } catch {
      return { ready: false, networkId: null, headHeight: null, peers: 0 };
    }
  }

  async close(): Promise<void> {
    const client = this.client;
    this.client = null;
    if (!client) return;
    try {
      await client.disconnectNetwork();
    } catch {
      // Ignore disconnect errors.
    }
    try {
      client.free();
    } catch {
      // The WASM client may already be torn down.
    }
  }
}
