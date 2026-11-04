import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import {
  Client,
  ClientConfiguration,
  KeyPair,
  type PlainTransactionDetails,
} from "@nimiq/core";

const baseURL = process.env.PHASE5_E2E_BASE_URL;
const sessionRef = process.env.PHASE5_SESSION_REF;
const expectedLuna = process.env.PHASE5_EXPECTED_LUNA;
const pattern = (process.env.PHASE5_PATTERN ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean) as Array<"ANSWER" | "SKIP">;
const treasuryAddress =
  process.env.PHASE5_TREASURY_ADDRESS ??
  "NQ83 S85U 0B01 BVY2 RR74 C23E 845S NAKE 1YM3";

test.describe.configure({ mode: "serial" });
test.skip(!baseURL || !sessionRef || !expectedLuna, "Phase 5 E2E env is not set");

type Auth = { keyPair: KeyPair; address: string };

type ApiResult<T> = { status: number; body: T };

async function authenticate(page: Page): Promise<Auth> {
  const keyPair = KeyPair.generate();
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

  const signature = keyPair
    .sign(Buffer.from(nonce.body.challenge, "utf8"))
    .toHex();
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

async function csrfFetch<T>(
  page: Page,
  path: string,
  init: { method?: string; body?: string } = {},
): Promise<ApiResult<T>> {
  return page.evaluate(
    async ({ path, init }) => {
      const csrf = document.cookie.match(/(?:^|; )lba_csrf=([^;]+)/)?.[1];
      const response = await fetch(path, {
        method: init.method ?? "GET",
        body: init.body,
        credentials: "include",
        headers: {
          "content-type": "application/json",
          ...(csrf ? { "x-csrf-token": decodeURIComponent(csrf) } : {}),
        },
      });
      return { status: response.status, body: await response.json() };
    },
    { path, init },
  );
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
        contentType: response.headers.get("content-type"),
        body,
        prefix: text.slice(0, 80),
      };
    }, path);
    lastStatus = result.status;
    lastPrefix = result.prefix;
    if (result.status === 200 && result.body) {
      return { status: result.status, body: result.body as T };
    }
    // Vercel can return a Security Checkpoint HTML page for a burst of API
    // requests. Wait and retry rather than treating it as an API response.
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
        const transaction: PlainTransactionDetails = await client.getTransaction(
          input.txHash,
        );
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

test("Phase 5 funded-session play-through and confirmed treasury payout", async ({
  browser,
}) => {
  test.setTimeout(480_000);
  const expected = BigInt(expectedLuna as string);
  const expectedNim =
    expected === 1_000n ? "0.01" : expected === 1_500n ? "0.015" : null;
  expect(expectedNim).not.toBeNull();
  expect(pattern).toHaveLength(3);

  const contextA: BrowserContext = await browser.newContext({ baseURL });
  const contextB: BrowserContext = await browser.newContext({ baseURL });
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();
  let authA: Auth | null = null;
  let authB: Auth | null = null;
  let gamePage: Page | null = null;

  try {
    authA = await authenticate(pageA);
    authB = await authenticate(pageB);

    const available = await getJson<{
      sessions: Array<{ id: string; publicRef: string }>;
    }>(pageA, "/api/sessions/available");
    expect(available.status).toBe(200);
    const session = available.body.sessions.find(
      (item) => item.publicRef === sessionRef,
    );
    expect(
      session,
      `Funded session ${sessionRef} was not listed as available`,
    ).toBeTruthy();

    // Task 5: concurrent claim by two authenticated players.
    const [claimA, claimB] = await Promise.all([
      claim(pageA, session!.id),
      claim(pageB, session!.id),
    ]);
    const results = [claimA, claimB];
    const winners = results.filter((result) => result.status === 200);
    const losers = results.filter((result) => result.status === 409);
    expect(winners).toHaveLength(1);
    expect(losers).toHaveLength(1);
    expect(losers[0].body.error?.code).toBe("SESSION_UNAVAILABLE");

    const winnerIndex = results.findIndex((result) => result.status === 200);
    const winnerPage = winnerIndex === 0 ? pageA : pageB;
    const winnerAuth = winnerIndex === 0 ? authA : authB;
    const loserAuth = winnerIndex === 0 ? authB : authA;
    gamePage = winnerPage;
    const runId = winners[0].body.runId as string;
    expect(runId).toMatch(/^[0-9a-f-]{36}$/);
    const loserAddress = loserAuth.address;
    expect(winnerAuth.address).not.toBe(loserAddress);

    console.log(
      `STEP 1 PASS: concurrent claim produced one run ${runId}; loser ${loserAddress} received 409 SESSION_UNAVAILABLE`,
    );

    await winnerPage.goto(`/play/${runId}`, { waitUntil: "networkidle" });
    await expect(
      winnerPage.getByRole("heading", { name: /Level 1 — Stablecoin peg risk/i }),
    ).toBeVisible({ timeout: 20_000 });
    console.log(`STEP 2 PASS: winner ${winnerAuth.address} resumed run ${runId}`);

    const decisions = ["Stay", "Stay in the pool", "Ape in"];
    const answerLabels = ["Risky", "Impermanent loss", "Risky"];
    const levelHeadings = [
      /Level 1 — Stablecoin peg risk/i,
      /Level 2 — Liquidity pool/i,
      /Level 3 — Yield-farming/i,
    ];
    const pollTrace: Array<{
      at: string;
      status: string;
      txHash: string | null;
    }> = [];
    let finishBody: {
      payoutId: string | null;
      state: string;
      payoutStatus: string;
    } | null = null;

    for (let level = 0; level < 3; level += 1) {
      await expect(
        winnerPage.getByRole("heading", { name: levelHeadings[level] }),
      ).toBeVisible({ timeout: 20_000 });
      await winnerPage
        .getByRole("button", { name: decisions[level], exact: true })
        .click();
      await expect(
        winnerPage.getByRole("heading", {
          name: /Consultation from the scripted requester/i,
        }),
      ).toBeVisible({ timeout: 20_000 });

      const action = pattern[level];
      const responsePromise = winnerPage.waitForResponse(
        (response) =>
          response.url().includes("/consultations/") &&
          response.request().method() === "POST" &&
          response.status() === 200,
        { timeout: 20_000 },
      );

      if (action === "ANSWER") {
        await winnerPage
          .getByRole("button", { name: answerLabels[level] })
          .click();
      } else {
        await winnerPage
          .getByRole("button", { name: /Skip — no reward/i })
          .click();
      }

      const response = await responsePromise;
      const responseBody = await response.json();
      const requestBody = response.request().postDataJSON();

      // Task 5: replay the exact same idempotency key. The server must return
      // the same responseId and must not add a second reward.
      const duplicate = await csrfFetch<{ responseId: string }>(
        winnerPage,
        response.url().replace(baseURL as string, ""),
        {
          method: "POST",
          body: JSON.stringify(requestBody),
        },
      );
      expect(duplicate.status).toBe(200);
      expect(duplicate.body.responseId).toBe(responseBody.responseId);

      if (action === "ANSWER") {
        await expect(
          winnerPage.getByText("+0.005 NIM earned"),
        ).toBeVisible({ timeout: 15_000 });
      } else {
        await expect(
          winnerPage.getByText("Skipped — no reward"),
        ).toBeVisible({ timeout: 15_000 });
      }

      console.log(
        `STEP 3.${level + 1} PASS: level ${level + 1} ${action}; duplicate key returned responseId ${responseBody.responseId}`,
      );
    }

    await expect(
      winnerPage.getByRole("heading", { name: /Session complete/i }),
    ).toBeVisible({ timeout: 20_000 });

    const finishPromise = winnerPage.waitForResponse(
      (response) =>
        response.url().endsWith(`/api/runs/${runId}/finish`) &&
        response.request().method() === "POST" &&
        response.status() === 200,
      { timeout: 20_000 },
    );
    await winnerPage
      .getByRole("button", { name: /Finish and claim payout/i })
      .click();
    const finishResponse = await finishPromise;
    finishBody = await finishResponse.json();
    const finishRequest = finishResponse.request().postDataJSON();
    expect(finishBody?.payoutId).toBeTruthy();

    // Task 5: replay the same finish key. It must return the same payoutId.
    const duplicateFinish = await csrfFetch<{
      payoutId: string;
      payoutStatus: string;
    }>(winnerPage, `/api/runs/${runId}/finish`, {
      method: "POST",
      body: JSON.stringify(finishRequest),
    });
    expect(duplicateFinish.status).toBe(200);
    expect(duplicateFinish.body.payoutId).toBe(finishBody!.payoutId);
    expect(duplicateFinish.body.payoutStatus).toBe(finishBody!.payoutStatus);

    await expect(winnerPage.getByText("Payout status:")).toBeVisible({
      timeout: 20_000,
    });
    console.log(
      `STEP 4 PASS: finish created payout ${finishBody!.payoutId}; duplicate finish returned the same payout`,
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
      const result = await getJson<{
        payoutId: string;
        status: string;
        amountLuna: string;
        txHash: string | null;
        explorerUrl: string | null;
      }>(winnerPage, `/api/runs/${runId}/payout`);
      expect(result.status).toBe(200);
      pollTrace.push({
        at: new Date().toISOString(),
        status: result.body.status,
        txHash: result.body.txHash,
      });
      payout = result.body;
      if (result.body.status === "CONFIRMED") break;
      if (result.body.status === "FAILED") {
        throw new Error(
          `Payout ${result.body.payoutId} reached FAILED during the play-through`,
        );
      }
      await winnerPage.waitForTimeout(5_000);
    }

    expect(payout).toBeTruthy();
    expect(payout!.status).toBe("CONFIRMED");
    expect(payout!.amountLuna).toBe(expectedLuna);
    expect(payout!.txHash).toMatch(/^[0-9a-f]{64}$/);
    expect(payout!.explorerUrl).toBe(
      `https://test.nimiq.watch/#${payout!.txHash}`,
    );

    await expect(
      winnerPage.getByText(/paid \(payout confirmed\)/i),
    ).toBeVisible({ timeout: 20_000 });

    const chain = await verifyOnChain({
      txHash: payout!.txHash as string,
      recipient: winnerAuth.address,
      expectedLuna: expectedLuna as string,
    });

    const screenshotSuffix = process.env.PHASE5_LABEL ?? "run";
    await winnerPage.screenshot({
      path: `/tmp/opencode/phase5-playthrough-${screenshotSuffix}-confirmed.png`,
      fullPage: true,
    });

    await winnerPage.goto("/history", { waitUntil: "networkidle" });
    await expect(
      winnerPage.getByText(`Session ${sessionRef}`),
    ).toBeVisible({ timeout: 20_000 });
    await expect(
      winnerPage.getByText(
        new RegExp(
          `${expectedNim!.replace(".", "\\.")} NIM earned \\(${Number(expectedLuna).toLocaleString("en-US")} Luna\\)`,
        ),
      ),
    ).toBeVisible({ timeout: 20_000 });
    await winnerPage.screenshot({
      path: `/tmp/opencode/phase5-playthrough-${screenshotSuffix}-history.png`,
      fullPage: true,
    });

    console.log(
      `STEP 5 PASS: payout CONFIRMED, tx ${payout!.txHash}, block ${chain.blockHeight}, sender ${chain.sender}, recipient ${chain.recipient}, value ${chain.valueLuna} Luna, network ${chain.networkId}`,
    );
    console.log(
      `PHASE5_E2E_RESULT=${JSON.stringify({
        label: process.env.PHASE5_LABEL ?? "run",
        sessionRef,
        runId,
        playerAddress: winnerAuth.address,
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
        pollTrace,
      })}`,
    );
    console.log("PHASE5_DEPLOYED_E2E_PASS");
  } finally {
    if (gamePage) {
      // The context is closed below; this is only a marker for readability.
    }
    await contextA.close();
    await contextB.close();
    authA?.keyPair.free();
    authB?.keyPair.free();
  }
});
