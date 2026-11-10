import { expect, test, type Page } from "@playwright/test";

const RUN_ID = "11111111-1111-4111-8111-111111111111";
const QUESTION_ID = "l3-yield-sustainability";

const runBase = {
  runId: RUN_ID,
  levelIndex: 3,
  maxConsultations: 5,
  stateVersion: 4,
  portfolio: { unit: "vUSDT", value: "112000000", version: "1" },
  earnedLuna: "1000",
  maxRewardLuna: "2500",
  payoutStatus: "NONE",
  decisions: [],
  responses: [],
};

const consultation = {
  id: QUESTION_ID,
  levelIndex: 3,
  evidenceVersion: "evidence-2026-11-01",
  agentContext: "LLM-assisted demo requester · simulated yield review",
  agentConfidence: "medium",
  agentMessage: "Scripted fallback message for the yield review.",
  evidence: {
    type: "scenario_card",
    title: "Simulated farm disclosure",
    lines: [
      "Advertised yield: 400% APY",
      "Contract: unaudited fork deployed recently",
      "Rewards: emitted by a new token with thin liquidity",
    ],
  },
  question: "How would you classify the 400% APY farm?",
  options: [
    { key: "SAFE", label: "Safe enough", description: "The yield is sustainable." },
    { key: "RISKY", label: "Risky", description: "The fork and liquidity are risks." },
    { key: "CANT_TELL", label: "Can't tell", description: "Not enough evidence." },
  ],
  rewardLuna: "500",
};

async function mockBase(page: Page, run: Record<string, unknown>, payout?: Record<string, unknown>) {
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;

    if (path === "/api/config/public") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          productName: "LevelBreak Arena",
          networkLabel: "Nimiq Testnet",
          rewardPerAnswerLuna: "500",
          maxConsultations: 5,
          demoMode: true,
        }),
      });
      return;
    }

    if (path === "/api/config/exchange-rates") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          usd: 0.0282,
          eur: 0.0251,
          ngn: 37.97,
        }),
      });
      return;
    }

    if (path === "/api/me") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          player: { address: "NQ23 RSJF DP1Q 894D Q346 V1HK C8F5 GM4F 0J9T" },
          activeRunId: RUN_ID,
        }),
      });
      return;
    }

    if (path === `/api/runs/${RUN_ID}`) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(run),
      });
      return;
    }

    if (path === `/api/runs/${RUN_ID}/payout` && payout) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(payout),
      });
      return;
    }

    if (path === `/api/consultations/${QUESTION_ID}/generate-agent-prompt`) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          prompt:
            "I see you have earned 1,000 Luna. Would you put this into a stablecoin or a liquidity pool, and why?",
          source: "llm",
        }),
      });
      return;
    }

    await route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({
        error: { code: "NOT_FOUND", message: "Not found.", requestId: "phase7-ui" },
      }),
    });
  });
}

test.describe("Phase 7 game surfaces", () => {
  test("renders five-level progress, the LLM agent message, and evidence", async ({
    page,
  }) => {
    await mockBase(page, {
      ...runBase,
      state: "CONSULTATION_PENDING",
      scenario: {
        id: "level-3-yield-sustainability",
        version: "1",
        levelIndex: 3,
        title: "Level 3 — Yield-farming sustainability",
        setting: "A simulated farm advertises 400% APY.",
        situation: "The contract is unaudited and the rewards token is new.",
        prompt: "Do you ape into the farm or read the risk disclosures first?",
        choices: [
          { decisionKey: "APE", label: "Ape in" },
          { decisionKey: "READ", label: "Read first" },
        ],
      },
      consultation,
    });

    await page.goto(`/play/${RUN_ID}`);

    await expect(
      page.getByRole("heading", { name: /Level 3 of 5/i }),
    ).toBeVisible();
    await expect(page.getByText("03 / 05")).toBeVisible();
    await expect(page.getByText("How would you classify the 400% APY farm?")).toBeVisible();
    await expect(page.getByText("I see you have earned 1,000 Luna.")).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.getByText("LLM draft")).toBeVisible();
    await expect(page.getByText("Simulated farm disclosure")).toBeVisible();
    await expect(page.getByText("Bundled evidence")).toBeVisible();
    await expect(page.getByText("Agent Request / Level 03")).toBeVisible();
    await expect(
      page.getByText(
        "Agent Zeta (Simulated) is requesting human risk assessment.",
      ),
    ).toBeVisible();
    const submitJudgment = page.getByRole("button", {
      name: /Submit Judgment & Earn 500 Luna/i,
    });
    await expect(submitJudgment).toBeDisabled();
    const risky = page.getByRole("button", { name: /Risky/i });
    await expect(risky).toBeVisible();
    await risky.click();
    await expect(submitJudgment).toBeEnabled();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow).toBe(false);
  });

  test("confirmed payout opens the labelled fiat off-ramp demo", async ({ page }) => {
    const txHash =
      "139bfc81643ffb410c1f2a179d0d152ab7346f5205f31d99642a1e0e577421e4";
    await mockBase(
      page,
      {
        ...runBase,
        state: "PAYOUT_CONFIRMED",
        levelIndex: 5,
        earnedLuna: "2500",
        payoutStatus: "CONFIRMED",
        scenario: null,
        consultation: null,
        responses: [1, 2, 3, 4, 5].map((level) => ({
          responseId: `2222222${level}-2222-4222-8222-22222222222${level}`,
          questionId: `q-${level}`,
          levelIndex: level,
          responseKey: "RISKY",
          result: "ANSWERED",
          rewardLuna: "500",
          createdAt: "2026-11-04T12:00:00.000Z",
        })),
      },
      {
        payoutId: "33333333-3333-4333-8333-333333333333",
        status: "CONFIRMED",
        amountLuna: "2500",
        txHash,
        explorerUrl: `https://test.nimiq.watch/#${txHash}`,
      },
    );

    await page.goto(`/play/${RUN_ID}`);

    await expect(
      page.getByRole("heading", { name: /Paid on-chain/i }),
    ).toBeVisible();
    await expect(page.getByText("2,500 Luna · treasury → your wallet")).toBeVisible();

    await page.getByRole("button", { name: /Withdraw to Fiat/i }).click();

    const dialog = page.getByRole("dialog", { name: /Fiat Off-Ramp/i });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("1 NIM = ₦37.97")).toBeVisible();
    await expect(dialog.getByText("₦0.95", { exact: true })).toBeVisible();
    await expect(
      dialog.getByText("Live rate from CoinGecko. Demo only."),
    ).toBeVisible();
    await expect(
      dialog.getByText(/Demo only — no fiat transfer/i),
    ).toBeVisible();
    await expect(dialog.getByText(/No exchange API is called/i)).toBeVisible();

    await dialog.getByRole("button", { name: /Send to Nimiq Pay/i }).click();
    await expect(
      dialog.getByRole("heading", { name: /Off-ramp request simulated/i }),
    ).toBeVisible({ timeout: 3_000 });
    await expect(dialog.getByText(/No fiat currency was transferred/i)).toBeVisible();

    await dialog.getByRole("button", { name: /Done/i }).click();
    await expect(dialog).not.toBeVisible();
  });
});
