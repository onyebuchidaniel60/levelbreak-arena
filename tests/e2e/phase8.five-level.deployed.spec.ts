import { createHash } from "node:crypto";
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import {
  Client,
  ClientConfiguration,
  KeyPair,
  PrivateKey,
  type PlainTransactionDetails,
} from "@nimiq/core";

const baseURL = process.env.PHASE8_E2E_BASE_URL;
const sessionRef = process.env.PHASE8_SESSION_REF;
const expectedLuna = process.env.PHASE8_EXPECTED_LUNA ?? "2000";
const playerPrivateKey = process.env.PHASE8_PLAYER_PRIVATE_KEY;
const treasuryAddress =
  process.env.PHASE8_TREASURY_ADDRESS ??
  "NQ83 S85U 0B01 BVY2 RR74 C23E 845S NAKE 1YM3";

function signNimiqMessage(keyPair: KeyPair, message: string): string {
  const framed = `\x16Nimiq Signed Message:\n${message.length}${message}`;
  const hash = createHash("sha256").update(Buffer.from(framed, "utf8")).digest();
  return keyPair.sign(hash).toHex();
}

test.describe.configure({ mode: "serial" });
test.skip(!baseURL || !sessionRef, "Phase 8 E2E env is not set");

type Auth = { keyPair: KeyPair; address: string };
type ApiResult<T> = { status: number; body: T };

async function authenticate(page: Page): Promise<Auth> {
  const keyPair = playerPrivateKey
    ? KeyPair.derive(PrivateKey.fromHex(playerPrivateKey))
    : KeyPair.generate();
  const address = keyPair.toAddress().toUserFriendlyAddress();
  const publicKey = keyPair.publicKey.toHex();

  await page.goto("/", { waitUntil: "domcontentloaded" });
  const nonce = await page.evaluate(async ({ address }) => {
    const response = await fetch("/api/auth/nonce", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ address, origin: window.location.origin }),
    });
    return { status: response.status, body: await response.json() };
  }, { address });
  expect(nonce.status).toBe(200);
  expect(nonce.body.challenge).toContain(
    `Origin: ${new URL(baseURL as string).origin}`,
  );

  const signature = signNimiqMessage(keyPair, nonce.body.challenge);
  const verify = await page.evaluate(async ({ input }) => {
    const response = await fetch("/api/auth/verify", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    return { status: response.status, body: await response.json() };
  }, {
    input: {
      nonceId: nonce.body.nonceId,
      address,
      publicKey,
      signature,
      challenge: nonce.body.challenge,
    },
  });
  expect(verify.status).toBe(200);
  expect(verify.body.player.address).toBe(address);
  return { keyPair, address };
}

async function getJson<T>(page: Page, path: string): Promise<ApiResult<T>> {
  let lastStatus = 0;
  let lastPrefix = "";
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const result = await page.evaluate(async (path) => {
      const response = await fetch(path, {
        credentials: "include",
        headers: { accept: "application/json" },
      });
      const text = await response.text();
      let body: unknown;
      try {
        body = JSON.parse(text);
      } catch {
        body = null;
      }
      return {
        status: response.status,
        body,
        prefix: text.slice(0, 80),
      };
    }, path);
    lastStatus = result.status;
    lastPrefix = result.prefix;
    if (result.status === 200 && result.body) {
      return { status: result.status, body: result.body as T };
    }
    await page.waitForTimeout(5_000);
  }
  throw new Error(
    `Expected JSON from ${path}, last status ${lastStatus}, body starts with ${JSON.stringify(lastPrefix)}`,
  );
}

async function claim(
  page: Page,
  sessionId: string,
): Promise<ApiResult<{ runId?: string; error?: { code?: string } }>> {
  return page.evaluate(async ({ sessionId, idempotencyKey }) => {
    const csrf = document.cookie.match(/(?:^|; )lba_csrf=([^;]+)/)?.[1];
    const response = await fetch(`/api/sessions/${sessionId}/claim`, {
      method: "POST",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        ...(csrf ? { "x-csrf-token": decodeURIComponent(csrf) } : {}),
      },
      body: JSON.stringify({ idempotencyKey }),
    });
    return { status: response.status, body: await response.json() };
  }, { sessionId, idempotencyKey: crypto.randomUUID() });
}

async function verifyOnChain(input: {
  txHash: string;
  recipient: string;
  expectedLuna: string;
}): Promise<{
  blockHeight: number | null;
  sender: string;
  recipient: string;
  valueLuna: string;
  state: string;
  networkId: number;
}> {
  const cfg = new ClientConfiguration();
  cfg.network("TestAlbatross");
  cfg.seedNodes(["/dns4/seed1.pos.nimiq-testnet.com/tcp/8443/wss"]);
  cfg.desiredPeerCount(3);
  cfg.onlySecureWsConnections(true);
  cfg.logLevel("warn");
  const client = await Client.create(cfg.build());
  try {
    const networkId = await client.getNetworkId();
    expect(networkId).toBe(5);
    for (let i = 0; i < 20; i += 1) {
      try {
        const transaction: PlainTransactionDetails =
          await client.getTransaction(input.txHash);
        const sender = String(transaction.sender);
        const recipient = String(transaction.recipient);
        expect(transaction.state).toMatch(/included|confirmed/);
        expect(sender).toBe(treasuryAddress);
        expect(recipient).toBe(input.recipient);
        expect(transaction.value.toString()).toBe(input.expectedLuna);
        return {
          blockHeight: transaction.blockHeight ?? null,
          sender,
          recipient,
          valueLuna: transaction.value.toString(),
          state: transaction.state,
          networkId,
        };
      } catch (error) {
        if (i === 19) throw error;
        await new Promise((resolve) => setTimeout(resolve, 5_000));
      }
    }
    throw new Error("Unreachable");
  } finally {
    try {
      await Promise.race([
        client.disconnectNetwork(),
        new Promise((resolve) => setTimeout(resolve, 5_000)),
      ]);
    } catch {
      /* ignore disconnect errors */
    }
    try {
      client.free();
    } catch {
      /* ignore wasm cleanup errors */
    }
  }
}

const levels = [
  {
    heading: /Level 1 — Stablecoin peg risk/i,
    decision: /Stay/i,
    answer: /Risky/i,
    question: /How would you classify the new 12% APY stablecoin\?/i,
    action: "ANSWER" as const,
  },
  {
    heading: /Level 2 — Liquidity pool/i,
    decision: /Stay in the pool/i,
    answer: /Impermanent loss/i,
    question: /What is the main risk of staying in the pool/i,
    action: "ANSWER" as const,
  },
  {
    heading: /Level 3 — Yield-farming/i,
    decision: /Ape in/i,
    answer: null,
    question: /How would you classify the 400% APY farm\?/i,
    action: "SKIP" as const,
  },
  {
    heading: /Level 4 — Oracle manipulation/i,
    decision: /Verify the oracle/i,
    answer: /Risky/i,
    question: /How would you classify a lending market/i,
    action: "ANSWER" as const,
  },
  {
    heading: /Level 5 — Liquidation cascades/i,
    decision: /Deleverage/i,
    answer: /Risky/i,
    question: /How would you classify holding this leveraged position/i,
    action: "ANSWER" as const,
  },
];

test("Phase 8 five-level play-through and confirmed 2,000 Luna payout", async ({
  browser,
}) => {
  test.setTimeout(600_000);
  const expected = BigInt(expectedLuna);
  expect(expected).toBe(2_000n);

  const context: BrowserContext = await browser.newContext({ baseURL });
  const page = await context.newPage();
  let auth: Auth | null = null;

  try {
    auth = await authenticate(page);
    const available = await getJson<{
      sessions: Array<{ id: string; publicRef: string }>;
    }>(page, "/api/sessions/available");
    expect(available.status).toBe(200);
    const session = available.body.sessions.find(
      (item) => item.publicRef === sessionRef,
    );
    expect(
      session,
      `Funded session ${sessionRef} was not listed as available`,
    ).toBeTruthy();

    const claimed = await claim(page, session!.id);
    expect(claimed.status).toBe(200);
    const runId = claimed.body.runId as string;
    expect(runId).toMatch(/^[0-9a-f-]{36}$/);
    console.log(
      `PHASE8 STEP 1 PASS: ${auth.address} claimed ${sessionRef}; run ${runId}`,
    );

    await page.goto(`/play/${runId}`, { waitUntil: "networkidle" });
    let llmEvidence: { badge: string | null; message: string } | null = null;

    for (let index = 0; index < levels.length; index += 1) {
      const level = levels[index];
      await expect(
        page.getByRole("heading", { name: level.heading }),
      ).toBeVisible({ timeout: 20_000 });
      await expect(
        page.getByRole("heading", {
          name: new RegExp(`Level ${index + 1} of 5`, "i"),
        }),
      ).toBeVisible();

      await page
        .getByRole("button", { name: level.decision })
        .first()
        .click();

      await expect(
        page.getByText(new RegExp(`Agent Request / Level 0${index + 1}`, "i")),
      ).toBeVisible({ timeout: 20_000 });
      await expect(
        page.getByRole("heading", { name: level.question }),
      ).toBeVisible({ timeout: 20_000 });

      if (index === 0) {
        await expect(page.getByText("LLM draft")).toBeVisible({
          timeout: 30_000,
        });
        const agentHeading = page.getByRole("heading", {
          name: /Agent message/i,
        });
        const agentSection = agentHeading.locator("xpath=ancestor::section[1]");
        await page.waitForTimeout(2_000);
        llmEvidence = {
          badge: "LLM draft",
          message: await agentSection.innerText(),
        };
        expect(llmEvidence.message.length).toBeGreaterThan(40);
        console.log(`PHASE8 LLM EVIDENCE: ${llmEvidence.message.slice(0, 240)}`);
      }

      if (index === 0) {
        await expect(
          page.getByText(
            "Agent Zeta (Simulated) is requesting human risk assessment.",
          ),
        ).toBeVisible();
      }

      if (level.action === "ANSWER") {
        await page
          .getByRole("button", { name: level.answer as RegExp })
          .click();
      }

      const responsePromise = page.waitForResponse(
        (response) =>
          response.url().includes("/consultations/") &&
          response.request().method() === "POST" &&
          response.status() === 200,
        { timeout: 20_000 },
      );

      if (level.action === "ANSWER") {
        await page
          .getByRole("button", { name: /Submit Judgment & Earn 500 Luna/i })
          .click();
      } else {
        await page.getByRole("button", { name: /Skip/i }).click();
      }

      const response = await responsePromise;
      const body = (await response.json()) as {
        result: string;
        rewardLuna: string;
      };
      expect(body.result).toBe(
        level.action === "ANSWER" ? "ANSWERED" : "SKIPPED",
      );
      expect(body.rewardLuna).toBe(level.action === "ANSWER" ? "500" : "0");

      await expect(
        page.getByText(
          level.action === "ANSWER"
            ? "+0.005 NIM earned"
            : "Skipped — no reward",
        ),
      ).toBeVisible({ timeout: 20_000 });

      console.log(
        `PHASE8 STEP 2.${index + 1} PASS: level ${index + 1} ${level.action}`,
      );
    }

    await expect(page.getByText("Session complete")).toBeVisible({
      timeout: 20_000,
    });

    const finishPromise = page.waitForResponse(
      (response) =>
        response.url().endsWith(`/api/runs/${runId}/finish`) &&
        response.request().method() === "POST" &&
        response.status() === 200,
      { timeout: 20_000 },
    );
    await page
      .getByRole("button", { name: /Finish and claim payout/i })
      .click();
    const finishResponse = await finishPromise;
    const finishBody = (await finishResponse.json()) as {
      payoutId: string;
      payoutStatus: string;
      earnedLuna: string;
    };
    expect(finishBody.payoutId).toBeTruthy();
    expect(finishBody.earnedLuna).toBe("2000");
    console.log(
      `PHASE8 STEP 3 PASS: finish created payout ${finishBody.payoutId}, earned ${finishBody.earnedLuna}`,
    );

    let payout: {
      payoutId: string;
      status: string;
      amountLuna: string;
      txHash: string | null;
      explorerUrl: string | null;
    } | null = null;
    const deadline = Date.now() + 5 * 60_000;
    while (Date.now() < deadline) {
      const result = await getJson<NonNullable<typeof payout>>(
        page,
        `/api/runs/${runId}/payout`,
      );
      expect(result.status).toBe(200);
      payout = result.body;
      if (payout?.status === "CONFIRMED") break;
      if (payout?.status === "FAILED") {
        throw new Error(
          `Payout ${payout.payoutId} reached FAILED during the play-through`,
        );
      }
      await page.waitForTimeout(5_000);
    }

    expect(payout).toBeTruthy();
    expect(payout!.status).toBe("CONFIRMED");
    expect(payout!.amountLuna).toBe("2000");
    expect(payout!.txHash).toMatch(/^[0-9a-f]{64}$/);

    await expect(
      page.getByRole("heading", { name: /Paid on-chain/i }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      page.getByRole("button", { name: /Withdraw to Fiat/i }),
    ).toBeVisible();

    await page.getByRole("button", { name: /Withdraw to Fiat/i }).click();
    const dialog = page.getByRole("dialog", { name: /Fiat Off-Ramp/i });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/1 NIM =/)).toBeVisible();
    await expect(
      dialog.getByText("Live rate from CoinGecko. Demo only."),
    ).toBeVisible();
    await dialog.getByRole("button", { name: /Send to Nimiq Pay/i }).click();
    await expect(
      dialog.getByRole("heading", { name: /Off-ramp request simulated/i }),
    ).toBeVisible({ timeout: 5_000 });
    await expect(
      dialog.getByText(/No fiat currency was transferred/i),
    ).toBeVisible();
    await dialog.getByRole("button", { name: /Done/i }).click();
    await expect(dialog).not.toBeVisible();
    console.log("PHASE8 STEP 4 PASS: fiat off-ramp demo opened and simulated");

    const chain = await verifyOnChain({
      txHash: payout!.txHash as string,
      recipient: auth.address,
      expectedLuna: "2000",
    });

    await page.goto("/history", { waitUntil: "networkidle" });
    await expect(page.getByText(sessionRef as string)).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText("2,000 Luna")).toBeVisible({
      timeout: 20_000,
    });

    console.log(
      `PHASE8 STEP 5 PASS: payout CONFIRMED, tx ${payout!.txHash}, block ${chain.blockHeight}, sender ${chain.sender}, recipient ${chain.recipient}, value ${chain.valueLuna} Luna, network ${chain.networkId}`,
    );
    console.log(
      `PHASE8_E2E_RESULT=${JSON.stringify({
        sessionRef,
        sessionId: session!.id,
        runId,
        playerAddress: auth.address,
        payoutId: payout!.payoutId,
        amountLuna: payout!.amountLuna,
        txHash: payout!.txHash,
        explorerUrl: payout!.explorerUrl,
        blockHeight: chain.blockHeight,
        sender: chain.sender,
        recipient: chain.recipient,
        valueLuna: chain.valueLuna,
        state: chain.state,
        networkId: chain.networkId,
        llmEvidence,
      })}`,
    );
    console.log("PHASE8_DEPLOYED_E2E_PASS");
  } finally {
    await context.close();
    auth?.keyPair.free();
  }
});
