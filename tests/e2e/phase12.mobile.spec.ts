import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

const RUN_ID = "88888888-8888-4888-8888-888888888888";
const SESSION_ID = "99999999-9999-4999-8999-999999999999";
const QUESTION_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const AGENT_NAME = "MCP Server Agent";
const QUESTION =
  "Would you trust this simulated MCP-posted stablecoin peg under stress?";
const CONTEXT =
  "The issuer reports 40% of reserves in a high-yield volatile venue, redemption delays of 24 hours, and no published attestation.";

const SCREENSHOT_DIR = "test-results/phase12";

mkdirSync(SCREENSHOT_DIR, { recursive: true });

type RunState = "IN_PROGRESS" | "CONSULTATION_PENDING" | "PAYOUT_CONFIRMED";

function runDetail(state: RunState) {
  const base = {
    runId: RUN_ID,
    levelIndex: 1,
    maxConsultations: 5,
    stateVersion: 0,
    portfolio: { unit: "vUSDT", value: "100000000", version: "1" },
    earnedLuna: "0",
    maxRewardLuna: "2500",
    payoutStatus: "NONE",
    decisions: [],
    responses: [],
    scenario: {
      id: "ai-mobile-test",
      version: "ai-1",
      levelIndex: 1,
      title: "The Peg That Slipped",
      setting: "AI-generated simulated scenario · Level 1",
      situation:
        "A simulated stablecoin advertises a high yield while its reserve attestations are missing.",
      prompt: "Choose the response that best reflects your risk judgment.",
      choices: [
        {
          decisionKey: "SAFE",
          label: "Hold the established stablecoin",
        },
        {
          decisionKey: "RISKY",
          label: "Move into the new high-yield stablecoin",
        },
      ],
    },
    consultation: null as unknown,
  };

  if (state === "CONSULTATION_PENDING") {
    return {
      ...base,
      state: "CONSULTATION_PENDING",
      stateVersion: 1,
      scenario: null,
      consultation: {
        id: QUESTION_ID,
        levelIndex: 1,
        evidenceVersion: `agent-${QUESTION_ID}`,
        agentContext: `Request from ${AGENT_NAME} · External agent`,
        agentConfidence: "medium",
        agentMessage: `${AGENT_NAME} is requesting your human risk assessment from LevelBreak Arena.`,
        agentName: AGENT_NAME,
        evidence: {
          type: "text_snippet",
          title: `${AGENT_NAME} context`,
          text: CONTEXT,
          sourceLabel: "External agent submission · simulated",
        },
        question: QUESTION,
        options: [
          {
            key: "SAFE",
            label: "Safe enough",
            description: "The submitted context supports a lower-risk read.",
          },
          {
            key: "RISKY",
            label: "Risky",
            description: "The submitted context shows material risk.",
          },
          {
            key: "CANT_TELL",
            label: "Can't tell",
            description:
              "The submitted context is not sufficient to classify it.",
          },
        ],
        rewardLuna: "500",
      },
    };
  }

  if (state === "PAYOUT_CONFIRMED") {
    return {
      ...base,
      state: "PAYOUT_CONFIRMED",
      levelIndex: 5,
      stateVersion: 10,
      earnedLuna: "2500",
      payoutStatus: "CONFIRMED",
      scenario: null,
      portfolio: { unit: "vUSDT", value: "112000000", version: "1" },
      responses: Array.from({ length: 5 }, (_, index) => ({
        responseId: `bbbbbbb${index}-bbbb-4bbb-8bbb-bbbbbbbbbbb${index}`,
        questionId: `question-${index + 1}`,
        levelIndex: index + 1,
        responseKey: "CANT_TELL",
        result: "ANSWERED",
        rewardLuna: "500",
        createdAt: "2026-11-10T00:00:00.000Z",
      })),
    };
  }

  return { ...base, state: "IN_PROGRESS" };
}

async function mockApi(
  page: Page,
  options: { authenticated: boolean; runState?: RunState } = {
    authenticated: false,
  },
) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const json = (body: unknown, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(body),
      });

    if (path === "/api/config/public") {
      return json({
        productName: "LevelBreak Arena",
        networkLabel: "Nimiq Testnet",
        rewardPerAnswerLuna: "500",
        maxConsultations: 5,
        demoMode: true,
      });
    }

    if (path === "/api/config/exchange-rates") {
      await new Promise((resolve) => setTimeout(resolve, 2_000));
      return json({ usd: 0.02818854, eur: 0.02511467, ngn: 37.97 });
    }

    if (path === "/api/me") {
      if (!options.authenticated) {
        return json(
          {
            error: {
              code: "UNAUTHORIZED",
              message: "Authentication is required.",
              requestId: "phase12-mobile",
            },
          },
          401,
        );
      }
      return json({
        player: { address: "NQ42 J2YJ 6Y5J EKE9 P8XY Y1GX L811 11F7 E0DB" },
        activeRunId: null,
      });
    }

    if (path === "/api/agents") {
      return json({
        agents: [
          {
            id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
            name: AGENT_NAME,
            questionsPosted: 1,
            activeQuestions: 1,
            rewardsPaidLuna: "0",
            createdAt: "2026-11-10T00:00:00.000Z",
          },
          {
            id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
            name: "MCP Research Agent",
            questionsPosted: 2,
            activeQuestions: 0,
            rewardsPaidLuna: "1000",
            createdAt: "2026-11-09T23:54:53.570Z",
          },
        ],
      });
    }

    if (path === "/api/sessions/available") {
      return json({
        sessions: [
          {
            id: SESSION_ID,
            publicRef: "5fde4fd45d4b3f32",
            maxConsultations: 1,
            rewardPerAnswerLuna: "500",
            maxRewardLuna: "500",
            funded: true,
            state: "AVAILABLE",
            agentName: AGENT_NAME,
            questionPreview: QUESTION,
          },
          {
            id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
            publicRef: "a1b2c3d4e5f60718",
            maxConsultations: 5,
            rewardPerAnswerLuna: "500",
            maxRewardLuna: "2500",
            funded: true,
            state: "AVAILABLE",
            agentName: null,
            questionPreview: null,
          },
        ],
      });
    }

    if (path === `/api/runs/${RUN_ID}`) {
      if (!options.runState) {
        return json(
          {
            error: {
              code: "NOT_FOUND",
              message: "Run not found.",
              requestId: "phase12-mobile",
            },
          },
          404,
        );
      }
      return json(runDetail(options.runState));
    }

    if (path === `/api/runs/${RUN_ID}/payout`) {
      return json({
        payoutId: "ffffffff-ffff-4fff-8fff-ffffffffffff",
        status: "CONFIRMED",
        amountLuna: "2500",
        txHash:
          "fc8cc06317b3f4d5cc8843017215263cd74b71aee06281b159f2ebd53887ec9f",
        explorerUrl:
          "https://test.nimiq.watch/#fc8cc06317b3f4d5cc8843017215263cd74b71aee06281b159f2ebd53887ec9f",
      });
    }

    if (path === "/api/history") {
      return json({
        items: [
          {
            runId: RUN_ID,
            publicRef: "b88d21098b76a471",
            state: "PAYOUT_CONFIRMED",
            levelIndex: 5,
            earnedLuna: "2500",
            payoutId: "ffffffff-ffff-4fff-8fff-ffffffffffff",
            payoutStatus: "CONFIRMED",
            payoutAmountLuna: "2500",
            txHash:
              "fc8cc06317b3f4d5cc8843017215263cd74b71aee06281b159f2ebd53887ec9f",
            createdAt: "2026-11-10T00:00:00.000Z",
            completedAt: "2026-11-10T00:10:00.000Z",
          },
        ],
        nextCursor: null,
      });
    }

    if (path === `/api/consultations/${QUESTION_ID}/generate-agent-prompt`) {
      return json({
        prompt: `${AGENT_NAME} is requesting your human risk assessment from LevelBreak Arena.`,
        source: "external",
      });
    }

    return json(
      {
        error: {
          code: "NOT_FOUND",
          message: "Not found.",
          requestId: "phase12-mobile",
        },
      },
      404,
    );
  });
}

async function expectNoHorizontalOverflow(page: Page) {
  for (const width of [375, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.waitForTimeout(120);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow, `horizontal overflow at ${width}px`).toBe(false);
  }
  await page.setViewportSize({ width: 390, height: 844 });
}

async function screenshot(page: Page, name: string) {
  await page.screenshot({
    path: `${SCREENSHOT_DIR}/${name}-390.png`,
    fullPage: true,
  });
}

test.describe("Phase 12 mobile readiness", () => {
  test("landing page at 375 and 390", async ({ page }) => {
    await mockApi(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    await expect(
      page.getByRole("heading", { level: 1, name: /Learn DeFi by breaking it/i }),
    ).toBeVisible();
    await expect(page.getByText("Active external agents")).toBeVisible();
    await expect(page.getByText(AGENT_NAME)).toBeVisible();
    await expect(page.getByText("MCP Research Agent")).toBeVisible();
    await expect(page.getByText("MCP server", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /View directory/i })).toBeVisible();

    await expectNoHorizontalOverflow(page);
    await screenshot(page, "landing");
  });

  test("agents directory at 375 and 390", async ({ page }) => {
    await mockApi(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/agents");

    await expect(
      page.getByRole("heading", { level: 1, name: /The agent directory/i }),
    ).toBeVisible();
    await expect(page.getByText("Who is posting questions")).toBeVisible();
    await expect(page.getByText(AGENT_NAME)).toBeVisible();
    await expect(page.getByText("MCP Research Agent")).toBeVisible();
    await expect(
      page.getByText("Verified MCP", { exact: true }).first(),
    ).toBeVisible();
    await expect(page.getByText("post_defi_consultation")).toBeVisible();
    await expect(page.getByText("From wallet to answered question")).toBeVisible();

    await expectNoHorizontalOverflow(page);
    await screenshot(page, "agents");
  });

  test("lobby with an external agent question at 375 and 390", async ({ page }) => {
    await mockApi(page, { authenticated: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/play");

    await expect(
      page.getByRole("heading", { level: 1, name: /Funded sessions/i }),
    ).toBeVisible();
    await expect(page.getByText(`Request from ${AGENT_NAME}`)).toBeVisible();
    await expect(page.getByText(QUESTION)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Answer question/i }),
    ).toBeVisible();

    await expectNoHorizontalOverflow(page);
    await screenshot(page, "lobby");
  });

  test("game decision with 44px tap targets at 375 and 390", async ({ page }) => {
    await mockApi(page, { authenticated: true, runState: "IN_PROGRESS" });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/play/${RUN_ID}`);

    await expect(
      page.getByRole("heading", { name: /Level 1 of 5/i }),
    ).toBeVisible();
    await expect(page.getByText("The Peg That Slipped")).toBeVisible();

    const decision = page.getByRole("button", {
      name: /Hold the established stablecoin/i,
    });
    const box = await decision.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);

    await expectNoHorizontalOverflow(page);
    await screenshot(page, "game-decision");
  });

  test("agent request with Verified MCP and 44px options at 375 and 390", async ({
    page,
  }) => {
    await mockApi(page, {
      authenticated: true,
      runState: "CONSULTATION_PENDING",
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/play/${RUN_ID}`);

    await expect(page.getByText("Agent Request / Level 01")).toBeVisible();
    await expect(page.getByText(AGENT_NAME).first()).toBeVisible();
    await expect(
      page.getByText("Verified MCP", { exact: true }).first(),
    ).toBeVisible();
    await expect(page.getByText(QUESTION)).toBeVisible();
    await expect(page.getByText(CONTEXT)).toBeVisible();

    const option = page.getByRole("button", { name: /Safe enough/i });
    const box = await option.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);

    await page.setViewportSize({ width: 375, height: 844 });
    const card375 = await page.getByTestId("agent-request-card").boundingBox();
    expect(card375?.x ?? 0).toBeGreaterThanOrEqual(15);
    expect((card375?.x ?? 0) + (card375?.width ?? 0)).toBeLessThanOrEqual(375 - 15);

    await expectNoHorizontalOverflow(page);
    await screenshot(page, "game-agent-request");
  });

  test("confirmed payout and full-width fiat modal at 375 and 390", async ({
    page,
  }) => {
    await mockApi(page, {
      authenticated: true,
      runState: "PAYOUT_CONFIRMED",
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/play/${RUN_ID}`);

    await expect(page.getByText("Paid on-chain.")).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await page.getByRole("button", { name: /Withdraw to Fiat/i }).click();

    const dialog = page.getByRole("dialog", { name: /Fiat Off-Ramp/i });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Loading rate", { exact: true })).toBeVisible();
    await expect(
      dialog.getByText("Fetching live rate…", { exact: true }),
    ).toBeVisible();
    await page.setViewportSize({ width: 375, height: 844 });
    const box375 = await dialog.boundingBox();
    expect(box375?.x ?? 0).toBeGreaterThanOrEqual(15);
    expect((box375?.x ?? 0) + (box375?.width ?? 0)).toBeLessThanOrEqual(375 - 15);
    await page.setViewportSize({ width: 390, height: 844 });
    const box390 = await dialog.boundingBox();
    expect(box390?.x ?? 0).toBeGreaterThanOrEqual(15);
    expect((box390?.x ?? 0) + (box390?.width ?? 0)).toBeLessThanOrEqual(390 - 15);

    const ngnButton = dialog.getByRole("button", { name: /NGN/i });
    await expect(ngnButton).toHaveAttribute("aria-pressed", "true");
    await expect(dialog.getByText("1 NIM = ₦37.97")).toBeVisible({
      timeout: 5_000,
    });
    await expect(dialog.getByText("₦0.95", { exact: true })).toBeVisible();
    await expect(
      dialog.getByText("Live rate from CoinGecko. Demo only."),
    ).toBeVisible();
    await expect(
      dialog.getByText(/Demo only — no fiat transfer/i),
    ).toBeVisible();
    await screenshot(page, "fiat-modal-ngn");

    await page.setViewportSize({ width: 320, height: 800 });
    const overflow320 = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow320).toBe(false);
    const groupBox = await dialog
      .getByRole("group", { name: /Fiat currency/i })
      .boundingBox();
    expect(groupBox?.x ?? 0).toBeGreaterThanOrEqual(15);
    expect((groupBox?.x ?? 0) + (groupBox?.width ?? 0)).toBeLessThanOrEqual(
      320 - 15,
    );
    await page.setViewportSize({ width: 390, height: 844 });

    const eurButton = dialog.getByRole("button", { name: /EUR/i });
    await eurButton.click();
    await expect(eurButton).toHaveAttribute("aria-pressed", "true");
    await expect(dialog.getByText("1 NIM = €0.025115")).toBeVisible();
    await expect(dialog.getByText(/Less than 0\.01/)).toBeVisible();
    await screenshot(page, "fiat-modal-eur");

    const usdButton = dialog.getByRole("button", { name: /USD/i });
    await usdButton.click();
    await expect(usdButton).toHaveAttribute("aria-pressed", "true");
    await expect(dialog.getByText("1 NIM = $0.028189")).toBeVisible();
    await expect(dialog.getByText(/Less than 0\.01/)).toBeVisible();
    await screenshot(page, "fiat-modal-usd");

    await dialog.getByRole("button", { name: /Send to Nimiq Pay/i }).click();
    await expect(
      dialog.getByText(/Simulated USD handoff/i),
    ).toBeVisible({ timeout: 3_000 });
    await expect(
      dialog.getByText(/0\.025 NIM → Less than 0\.01/),
    ).toBeVisible();

    const decisionOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(decisionOverflow).toBe(false);
  });

  test("history at 375 and 390", async ({ page }) => {
    await mockApi(page, { authenticated: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/history");

    await expect(
      page.getByRole("heading", { level: 1, name: /Your runs/i }),
    ).toBeVisible();
    await expect(page.getByText("b88d21098b76a471")).toBeVisible();
    await expect(page.getByText("0.025 NIM").first()).toBeVisible();

    await expectNoHorizontalOverflow(page);
    await screenshot(page, "history");
  });
});
