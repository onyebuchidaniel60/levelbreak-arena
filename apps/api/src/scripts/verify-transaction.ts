import { addressesEqual } from "../nimiq/address";
import { NimiqWebClientService } from "../nimiq/web-client";

async function main(): Promise<void> {
  const txHash =
    process.argv.slice(2).find((value) => value !== "--") ?? process.env.TX_HASH;
  const expectedSender =
    process.env.NIMIQ_DEMO_AGENT_ADDRESS ?? process.env.EXPECTED_SENDER;
  const expectedRecipient =
    process.env.NIMIQ_TREASURY_ADDRESS ?? process.env.EXPECTED_RECIPIENT;
  const expectedAmount = BigInt(process.env.EXPECTED_AMOUNT_LUNA ?? "1500");
  const expectedReference = process.env.EXPECTED_REFERENCE ?? null;

  if (!txHash) throw new Error("Pass the transaction hash as the first argument or TX_HASH");
  if (!expectedSender || !expectedRecipient) {
    throw new Error("NIMIQ_DEMO_AGENT_ADDRESS and NIMIQ_TREASURY_ADDRESS are required");
  }

  const service = new NimiqWebClientService();
  await service.start();
  try {
    const consensus = await service.waitForConsensus(60_000);
    if (!consensus) throw new Error("TestAlbatross consensus was not reached");
    const networkId = await service.getNetworkId();
    const transaction = await service.getTransaction(txHash);
    const reference =
      transaction.dataHex === null
        ? null
        : Buffer.from(transaction.dataHex, "hex").toString("utf8");

    const checks = {
      networkIdIs5: networkId === 5,
      senderMatches: addressesEqual(transaction.sender, expectedSender),
      recipientMatches: addressesEqual(transaction.recipient, expectedRecipient),
      valueMatches: BigInt(transaction.valueLuna) === expectedAmount,
      referenceMatches:
        expectedReference === null ? reference !== null : reference === expectedReference,
      included: transaction.state === "included" || transaction.state === "confirmed",
    };

    console.log(
      JSON.stringify(
        {
          event: "transaction_verified",
          transactionHash: transaction.transactionHash,
          networkId,
          network: transaction.network,
          sender: transaction.sender,
          recipient: transaction.recipient,
          valueLuna: transaction.valueLuna,
          feeLuna: transaction.feeLuna,
          state: transaction.state,
          blockHeight: transaction.blockHeight ?? null,
          reference,
          checks,
        },
        null,
        2,
      ),
    );

    if (Object.values(checks).some((value) => !value)) {
      console.error("proof=FAIL");
      process.exit(1);
    }
    console.log("proof=PASS");
    process.exit(0);
  } finally {
    await service.close();
  }
}

main().catch((error: unknown) => {
  console.error(
    JSON.stringify({
      event: "transaction_verify_error",
      message: error instanceof Error ? error.message : "unknown",
    }),
  );
  process.exit(1);
});
