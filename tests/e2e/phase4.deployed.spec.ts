import { expect, test } from "@playwright/test";
import { KeyPair } from "@nimiq/core";

const baseURL = process.env.PHASE4_E2E_BASE_URL;
const expectedPublicRef =
  process.env.PHASE4_EXPECTED_PUBLIC_REF ?? "fa4f30a2d178b6da";

test.describe.configure({ mode: "serial" });

test.skip(!baseURL, "PHASE4_E2E_BASE_URL is not set");

test("Phase 4 real-auth play-through on the deployed preview", async ({
  page,
  context,
}) => {
  test.setTimeout(180_000);
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  const keyPair = KeyPair.generate();
  const address = keyPair.toAddress().toUserFriendlyAddress();
  const publicKey = keyPair.publicKey.toHex();

  try {
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(
      page.getByText("Open this app in Nimiq Pay to connect your wallet.").first(),
    ).toBeVisible({ timeout: 10_000 });
    console.log("STEP 1 PASS: unauthenticated prompt shown");

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
    expect(nonce.body.nonceId).toBeTruthy();
    expect(nonce.body.challenge).toContain(
      `Origin: ${new URL(baseURL as string).origin}`,
    );

    const signature = keyPair.sign(Buffer.from(nonce.body.challenge, "utf8")).toHex();
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
    const cookies = await context.cookies(baseURL);
    const sessionCookie = cookies.find((cookie) => cookie.name === "lba_session");
    expect(sessionCookie?.httpOnly).toBe(true);
    expect(sessionCookie?.secure).toBe(true);
    expect(sessionCookie?.sameSite).toBe("Lax");

    await page.goto("/play", { waitUntil: "networkidle" });
    await expect(page.getByText(`Signed in as`)).toBeVisible();
    console.log("STEP 2 PASS: real auth and session cookie established");

    const sessionCard = page
      .locator("li")
      .filter({ hasText: `Funded session ${expectedPublicRef}` });
    await expect(sessionCard).toBeVisible({ timeout: 15_000 });
    await sessionCard.getByRole("button", { name: "Start" }).click();
    await page.waitForURL(/\/play\/[0-9a-f-]+$/, { timeout: 15_000 });
    const runId = page.url().split("/").pop() as string;
    expect(runId).toMatch(/^[0-9a-f-]{36}$/);
    await expect(
      page.getByRole("heading", { name: /Level 1 — Stablecoin peg risk/i }),
    ).toBeVisible({ timeout: 15_000 });
    console.log(`STEP 3 PASS: claimed ${expectedPublicRef}, run ${runId}`);

    await page.getByRole("button", { name: "Stay", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: /Consultation from the scripted requester/i }),
    ).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: /Risky/ }).click();
    await expect(page.getByText("+0.005 NIM earned")).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByRole("heading", { name: /Level 2 — Liquidity pool/i }),
    ).toBeVisible({ timeout: 15_000 });
    console.log("STEP 4 PASS: level 1 decision and answer");

    await page.reload({ waitUntil: "networkidle" });
    await expect(
      page.getByRole("heading", { name: /Level 2 — Liquidity pool/i }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("0.005 NIM earned (pending payout)")).toBeVisible();
    console.log("STEP 9 PASS: refresh resumed level 2 unchanged");

    await page.getByRole("button", { name: "Stay in the pool" }).click();
    await expect(
      page.getByRole("heading", { name: /Consultation from the scripted requester/i }),
    ).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: /Skip — no reward/i }).click();
    await expect(page.getByText("Skipped — no reward")).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByRole("heading", { name: /Level 3 — Yield-farming/i }),
    ).toBeVisible({ timeout: 15_000 });
    console.log("STEP 5 PASS: level 2 decision and skip");

    await page.getByRole("button", { name: "Ape in" }).click();
    await expect(
      page.getByRole("heading", { name: /Consultation from the scripted requester/i }),
    ).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: /Risky/ }).click();
    await expect(page.getByText("+0.005 NIM earned")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("heading", { name: /Session complete/i })).toBeVisible({
      timeout: 15_000,
    });
    console.log("STEP 6 PASS: level 3 decision and answer");

    await page.getByRole("button", { name: /Finish and claim payout/i }).click();
    await expect(page.getByText("Payout status:")).toBeVisible({ timeout: 15_000 });
    const payoutText = await page.getByText(/Payout (queued|submitted|confirmed|failed|reconciling)/i).first().textContent();
    console.log(`Payout status observed: ${payoutText ?? "unknown"}`);
    expect(payoutText).toMatch(/queued|submitted|confirmed|failed|reconciling/i);
    console.log("STEP 7 PASS: finish created or reused a payout record");

    await page.goto("/history", { waitUntil: "networkidle" });
    await expect(page.getByText(`Session ${expectedPublicRef}`)).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/0\.01 NIM earned \(1,000 Luna\)/)).toBeVisible({
      timeout: 15_000,
    });
    console.log("STEP 8 PASS: history shows 1,000 Luna earned");

    const routes = [
      "/",
      "/play",
      `/play/${runId}`,
      "/history",
      "/how-it-works",
      "/privacy",
      "/terms",
      "/docs",
      "/route-that-does-not-exist",
    ];
    for (const width of [320, 375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of routes) {
        await page.goto(route, { waitUntil: "networkidle" });
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth,
        );
        expect(overflow, `horizontal overflow at ${width}px on ${route}`).toBe(false);
      }
    }
    console.log("STEP 10 PASS: no horizontal overflow at 320–1440px");

    expect(pageErrors).toEqual([]);
    console.log("PHASE4_DEPLOYED_E2E_PASS");
  } finally {
    keyPair.free();
  }
});
