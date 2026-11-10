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
const SCREENSHOT_DIR = "test-results/phase14";

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
      id: "ai-phase14-test",
      version: "ai-1",
      levelIndex: 1,
      title: "The Peg That Slipped",
      setting: "AI-generated simulated scenario · Level 1",
      situation:
        "A simulated stablecoin advertises a high yield while its reserve attestations are missing.",
      prompt: "Choose the response that best reflects your risk judgment.",
      choices: [
        { decisionKey: "SAFE", label: "Hold the established stablecoin" },
        { decisionKey: "RISKY", label: "Move into the new high-yield stablecoin" },
      ],
    },
    consultation: null as unknown,
  };

  if (state === "CONSULTATION_PENDING") {
    return {
      ...base,
      state: "CONSULTATION_PENDING",
      stateVersion: 1,
      earnedLuna: "500",
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
            description: "The submitted context is not sufficient to classify it.",
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
      return json({ usd: 0.02818854, eur: 0.02511467, ngn: 37.97 });
    }

    if (path === "/api/me") {
      if (!options.authenticated) {
        return json(
          {
            error: {
              code: "UNAUTHORIZED",
              message: "Authentication is required.",
              requestId: "phase14",
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
          {
            id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
            name: "Liquidity Sentinel",
            questionsPosted: 4,
            activeQuestions: 2,
            rewardsPaidLuna: "2000",
            createdAt: "2026-11-08T18:00:00.000Z",
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
              requestId: "phase14",
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
          requestId: "phase14",
        },
      },
      404,
    );
  });
}

async function settle(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
}

async function screenshot(page: Page, name: string, fullPage = true) {
  await page.screenshot({
    path: `${SCREENSHOT_DIR}/${name}.png`,
    fullPage,
  });
}

async function expectNoHorizontalOverflow(page: Page, label: string) {
  for (const width of [320, 375, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.waitForTimeout(100);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow, `${label}: horizontal overflow at ${width}px`).toBe(false);
  }
}

test.describe("Phase 14 visual overhaul", () => {
  test("landing at 1440 and 390", async ({ page }) => {
    await mockApi(page);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/");
    await settle(page);

    await expect(
      page.getByRole("heading", { level: 1, name: /The AI Agent Economy Needs Your Judgment/i }),
    ).toBeVisible();
    await expect(
      page.getByText(/DeFi training ground and micro-task marketplace/i),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: /How it works/i }),
    ).toBeVisible();
    await expect(page.getByText("Learn DeFi concepts")).toBeVisible();
    await expect(page.getByText("Prove your skill")).toBeVisible();
    await expect(page.getByText("Agents pay you for your human judgment")).toBeVisible();
    await expect(page.getByText("Proof-of-Learning")).toBeVisible();
    await expect(page.getByText("MCP Server", { exact: true })).toBeVisible();
    await screenshot(page, "landing-1440");

    await expectNoHorizontalOverflow(page, "landing");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(150);
    await screenshot(page, "landing-390");
  });

  test("game decision at 1440 and 390", async ({ page }) => {
    await mockApi(page, { authenticated: true, runState: "IN_PROGRESS" });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`/play/${RUN_ID}`);
    await settle(page);

    await expect(
      page.getByRole("heading", { name: /Level 1 of 5/i }),
    ).toBeVisible();
    await expect(page.getByText("The Peg That Slipped")).toBeVisible();
    const decision = page.getByRole("button", {
      name: /Hold the established stablecoin/i,
    });
    const box = await decision.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    await screenshot(page, "game-decision-1440");

    await expectNoHorizontalOverflow(page, "game decision");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(150);
    await screenshot(page, "game-decision-390");
  });

  test("agent request and typewriter at 1440 and 390", async ({ page }) => {
    await mockApi(page, {
      authenticated: true,
      runState: "CONSULTATION_PENDING",
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`/play/${RUN_ID}`);
    await settle(page);

    await expect(page.getByText("Agent Request / Level 01")).toBeVisible();
    await expect(
      page.getByText("Verified MCP", { exact: true }).first(),
    ).toBeVisible();
    await expect(page.getByText(QUESTION)).toBeVisible();
    await expect(page.getByText(CONTEXT)).toBeVisible();
    await expect(
      page.getByText(
        `${AGENT_NAME} is requesting your human risk assessment from LevelBreak Arena.`,
      ),
    ).toBeVisible({ timeout: 5_000 });
    const typedMessage = page.locator(
      'section[aria-labelledby="agent-message-heading"] p[aria-hidden="true"]',
    );
    await expect(typedMessage).toBeVisible();
    const partial = await typedMessage.innerText();
    expect(partial.length).toBeLessThan(
      `${AGENT_NAME} is requesting your human risk assessment from LevelBreak Arena.`.length,
    );
    await page.waitForTimeout(600);
    await expect(page.locator(".cursor-blink")).toHaveCount(0, {
      timeout: 5_000,
    });
    await expect(typedMessage).toContainText("LevelBreak Arena.");

    const option = page.getByRole("button", { name: /Safe enough/i });
    const optionBox = await option.boundingBox();
    expect(optionBox?.height ?? 0).toBeGreaterThanOrEqual(44);
    await screenshot(page, "agent-request-1440");

    await expectNoHorizontalOverflow(page, "agent request");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(150);
    await screenshot(page, "agent-request-390");
  });

  test("payout and fiat modal at 1440 and 390", async ({ page }) => {
    await mockApi(page, {
      authenticated: true,
      runState: "PAYOUT_CONFIRMED",
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`/play/${RUN_ID}`);
    await settle(page);

    await expect(page.getByText("Reward Confirmed.")).toBeVisible();
    await expect(
      page.getByText("Your testnet NIM is in your wallet."),
    ).toBeVisible();
    const earned = page.getByText("Earned", { exact: true }).first();
    await expect(earned).toBeVisible();
    await screenshot(page, "payout-1440");

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
    await page.waitForTimeout(150);
    await screenshot(page, "fiat-modal-1440", false);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(200);
    const button = dialog.getByRole("button", { name: /Send to Nimiq Pay/i });
    const buttonBox = await button.boundingBox();
    expect(buttonBox?.height ?? 0).toBeGreaterThanOrEqual(44);
    await expect(button).toBeInViewport();
    await screenshot(page, "fiat-modal-390", false);

    await expectNoHorizontalOverflow(page, "fiat modal");
    await page.setViewportSize({ width: 390, height: 844 });
    await dialog.getByRole("button", { name: /Cancel/i }).click();
    await expect(dialog).toBeHidden();
    await page.waitForTimeout(150);
    await screenshot(page, "payout-390");
  });

  test("agents directory at 1440 and 390", async ({ page }) => {
    await mockApi(page);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/agents");
    await settle(page);

    await expect(
      page.getByRole("heading", { level: 1, name: /The agent directory/i }),
    ).toBeVisible();
    await expect(page.getByText("Who is posting questions")).toBeVisible();
    await expect(
      page.getByText("Verified MCP", { exact: true }).first(),
    ).toBeVisible();
    await expect(page.getByText("post_defi_consultation")).toBeVisible();
    await screenshot(page, "agents-1440");

    await expectNoHorizontalOverflow(page, "agents directory");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(150);
    await screenshot(page, "agents-390");
  });

  test("lobby at 1440 and 390", async ({ page }) => {
    await mockApi(page, { authenticated: true });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/play");
    await settle(page);

    await expect(
      page.getByRole("heading", { level: 1, name: /Active Missions/i }),
    ).toBeVisible();
    await expect(page.getByText(`Request from ${AGENT_NAME}`)).toBeVisible();
    await expect(page.getByText(QUESTION)).toBeVisible();
    await screenshot(page, "lobby-1440");

    await expectNoHorizontalOverflow(page, "lobby");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(150);
    await screenshot(page, "lobby-390");
  });

  test("support pages, 404 and error states stay on-brand", async ({ page }) => {
    await mockApi(page);
    await page.setViewportSize({ width: 1440, height: 1000 });

    await page.goto("/how-it-works");
    await settle(page);
    await expect(
      page.getByRole("heading", { level: 1, name: /A five-level DeFi judgment game/i }),
    ).toBeVisible();
    await screenshot(page, "support-how-it-works-1440");

    await page.goto("/docs");
    await settle(page);
    await expect(
      page.getByRole("heading", { level: 1, name: /The Agent Economy, documented/i }),
    ).toBeVisible();
    await expect(page.locator("pre").first()).toContainText("mcpServers");
    const anchorLinks = await page
      .locator('a[href^="#"]')
      .evaluateAll((links) =>
        links.map((link) => link.getAttribute("href") ?? ""),
      );
    expect(anchorLinks.length).toBeGreaterThanOrEqual(5);
    for (const href of anchorLinks) {
      await expect(page.locator(href)).toHaveCount(1);
    }
    const allLinks = await page
      .locator("a")
      .evaluateAll((links) =>
        links.map((link) => link.getAttribute("href") ?? ""),
      );
    expect(allLinks.every((href) => href.length > 0 && href !== "#")).toBe(true);
    await screenshot(page, "support-docs-1440");

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(150);
    await expectNoHorizontalOverflow(page, "docs");
    await screenshot(page, "support-docs-390");
    await page.setViewportSize({ width: 1440, height: 1000 });

    await page.goto("/route-that-does-not-exist");
    await settle(page);
    await expect(
      page.getByRole("heading", { level: 1, name: /This route is not in the arena/i }),
    ).toBeVisible();
    await screenshot(page, "not-found-1440");

    await page.route("**/api/me", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          player: { address: "NQ42 J2YJ 6Y5J EKE9 P8XY Y1GX L811 11F7 E0DB" },
          activeRunId: null,
        }),
      }),
    );
    await page.route("**/api/sessions/available", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          error: {
            code: "INTERNAL",
            message: "The session list could not be loaded.",
            requestId: "phase14-error",
          },
        }),
      }),
    );
    await page.goto("/play");
    await expect(
      page.getByText("Could not load funded sessions"),
    ).toBeVisible();
    await screenshot(page, "error-state-1440");
  });

  test("loading state at 390", async ({ page }) => {
    await mockApi(page, { authenticated: true });
    await page.route("**/api/me", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 3_000));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          player: { address: "NQ42 J2YJ 6Y5J EKE9 P8XY Y1GX L811 11F7 E0DB" },
          activeRunId: null,
        }),
      });
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/play");
    await expect(
      page.getByText("Checking your wallet session…"),
    ).toBeVisible();
    await screenshot(page, "loading-state-390", false);
  });
});
