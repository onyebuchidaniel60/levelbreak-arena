import { randomBytes } from "node:crypto";
import { KeyPair, PrivateKey } from "@nimiq/core";
import { normalizeAddress } from "./nimiq/address";
import { NimiqWebClientService } from "./nimiq/web-client";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main(): Promise<void> {
  if (process.env.TESTNET_PROOF_ENABLED !== "true") {
    throw new Error("TESTNET_PROOF_ENABLED must be true to run the proof");
  }

  const demoAddress = process.env.NIMIQ_DEMO_AGENT_ADDRESS;
  const demoKey = process.env.NIMIQ_DEMO_AGENT_PRIVATE_KEY;
  const treasuryAddress = process.env.NIMIQ_TREASURY_ADDRESS;
  const amountLuna = BigInt(process.env.FUNDING_MINIMUM_LUNA || "1500");
  const explorerBase = process.env.NIMIQ_EXPLORER_BASE_URL || null;

  if (!demoAddress || !demoKey || !treasuryAddress) {
    throw new Error("Nimiq demo-agent/treasury environment is incomplete");
  }

  const privateKey = PrivateKey.fromHex(demoKey);
  const keyPair = KeyPair.derive(privateKey);
  const derivedAddress = normalizeAddress(keyPair.toAddress().toUserFriendlyAddress());
  if (derivedAddress !== normalizeAddress(demoAddress)) {
    throw new Error("Demo-agent private key does not match configured address");
  }
  keyPair.free();
  privateKey.free();

  const service = new NimiqWebClientService();
  await service.start();

  try {
    const consensus = await service.waitForConsensus(60_000);
    if (!consensus) {
      throw new Error("TestAlbatross consensus was not reached");
    }

    const networkId = await service.getNetworkId();
    const headHeight = await service.getHeadHeight();
    console.log(
      JSON.stringify({
        event: "proof_ready",
        networkId,
        headHeight,
        demoAddress: normalizeAddress(demoAddress),
        treasuryAddress: normalizeAddress(treasuryAddress),
      }),
    );

    const existingTxHash = process.env.TESTNET_PROOF_TX_HASH || null;
    const existingReference = process.env.TESTNET_PROOF_REFERENCE || null;
    const publicRef = randomBytes(8).toString("hex");
    const reference = existingReference || `LBA1:${publicRef}`;

    let txHash = existingTxHash;
    if (!txHash) {
      const sent = await service.buildSignAndBroadcastBasicTransfer({
        fromAddress: demoAddress,
        privateKeyHex: demoKey,
        toAddress: treasuryAddress,
        amountLuna,
        data: reference,
      });
      txHash = sent.txHash;

      console.log(
        JSON.stringify({
          event: "proof_broadcast",
          txHash,
          reference,
          explorerBaseUrl: explorerBase,
        }),
      );
    } else {
      console.log(
        JSON.stringify({
          event: "proof_resume_existing_transaction",
          txHash,
          reference,
          explorerBaseUrl: explorerBase,
        }),
      );
    }

    let verification = null;
    for (let attempt = 0; attempt < 40; attempt += 1) {
      try {
        verification = await service.verifyIncomingFunding({
          txHash,
          expectedSender: demoAddress,
          expectedRecipient: treasuryAddress,
          minimumAmountLuna: amountLuna,
          expectedReference: reference,
        });
      } catch (error) {
        console.log(
          JSON.stringify({
            event: "proof_waiting_for_transaction",
            txHash,
            attempt,
            message: error instanceof Error ? error.message : "unknown",
          }),
        );
        verification = null;
      }

      if (verification?.verified) break;
      await sleep(3_000);
    }

    if (!verification?.verified || !verification.transaction) {
      console.error(
        JSON.stringify({
          event: "proof_failed",
          txHash,
          reason: verification?.reason ?? "UNKNOWN",
          transaction: verification?.transaction ?? null,
        }),
      );
      process.exit(1);
    }

    console.log(
      JSON.stringify(
        {
          event: "proof_verified",
          txHash: verification.transaction.transactionHash,
          sender: verification.transaction.sender,
          recipient: verification.transaction.recipient,
          valueLuna: verification.transaction.valueLuna,
          feeLuna: verification.transaction.feeLuna,
          network: verification.transaction.network,
          state: verification.transaction.state,
          blockHeight: verification.transaction.blockHeight ?? null,
          reference: verification.reference,
          explorerBaseUrl: explorerBase,
        },
        null,
        2,
      ),
    );
    console.log("proof=PASS");
    process.exit(0);
  } finally {
    await service.close();
  }
}

main().catch((error: unknown) => {
  console.error(
    JSON.stringify({
      event: "proof_error",
      message: error instanceof Error ? error.message : "unknown",
    }),
  );
  process.exit(1);
});
