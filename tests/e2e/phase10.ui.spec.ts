import { expect, test, type Page } from "@playwright/test";

const RUN_ID = "44444444-4444-4444-8444-444444444444";
const SESSION_ID = "55555555-5555-4555-8555-555555555555";
const QUESTION_ID = "66666666-6666-4666-8666-666666666666";
const AGENT_NAME = "Alpha Research Bot";
const QUESTION =
  "Would you classify this simulated stablecoin as safe or risky?";
const CONTEXT =
  "Reserve attestations are missing, redemptions are delayed, and the peg is under pressure.";

async function mockBase(page: Page, input: { authenticated: boolean }) {
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
    if (path === "/api/me") {
      if (!input.authenticated) {
        return json(
          {
            error: {
              code: "UNAUTHORIZED",
              message: "Authentication is required.",
              requestId: "phase10-ui",
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
            id: "77777777-7777-4777-8777-777777777777",
            name: AGENT_NAME,
            questionsPosted: 3,
            activeQuestions: 1,
            rewardsPaidLuna: "1000",
            createdAt: "2026-11-09T06:00:00.000Z",
          },
        ],
      });
    }
    if (path === "/api/sessions/available") {
      return json({
        sessions: [
          {
            id: SESSION_ID,
            publicRef: "a1b2c3d4e5f60718",
            maxConsultations: 1,
            rewardPerAnswerLuna: "500",
            maxRewardLuna: "500",
            funded: true,
            state: "AVAILABLE",
            agentName: AGENT_NAME,
            questionPreview: QUESTION,
          },
        ],
      });
    }
    if (path === `/api/runs/${RUN_ID}`) {
      return json({
        runId: RUN_ID,
        state: "CONSULTATION_PENDING",
        levelIndex: 1,
        maxConsultations: 1,
        stateVersion: 2,
        portfolio: { unit: "vUSDT", value: "100000000", version: "1" },
        earnedLuna: "0",
        maxRewardLuna: "500",
        payoutStatus: "NONE",
        scenario: {
          id: "ai-live-agent",
          version: "ai-1",
          levelIndex: 1,
          title: "The Agent-Submitted Risk Review",
          setting: "AI-generated simulated scenario · Level 1",
          situation:
            "An external agent submitted a simulated stablecoin risk review to the arena.",
          prompt: "Choose the response that best reflects your risk judgment.",
          choices: [
            { decisionKey: "SAFE", label: "Treat the peg as stable" },
            { decisionKey: "RISKY", label: "Treat the peg as at risk" },
          ],
        },
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
        decisions: [],
        responses: [],
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
          requestId: "phase10-ui",
        },
      },
      404,
    );
  });
}

test.describe("Phase 10 agent marketplace surfaces", () => {
  test("shows an external agent consultation in the player lobby", async ({
    page,
  }) => {
    await mockBase(page, { authenticated: true });
    await page.goto("/play");

    await expect(
      page.getByRole("heading", { level: 1, name: /Active Missions/i }),
    ).toBeVisible();
    await expect(page.getByText(`Request from ${AGENT_NAME}`)).toBeVisible();
    await expect(
      page.getByText("External agent", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Question preview")).toBeVisible();
    await expect(page.getByText(QUESTION)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Answer question/i }),
    ).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow).toBe(false);
  });

  test("shows the external agent name and submission source in the game", async ({
    page,
  }) => {
    await mockBase(page, { authenticated: true });
    await page.goto(`/play/${RUN_ID}`);

    await expect(
      page.getByRole("heading", { name: /Level 1 of 1/i }),
    ).toBeVisible();
    await expect(
      page.getByText(`Request from ${AGENT_NAME} · External agent`).first(),
    ).toBeVisible();
    await expect(
      page.getByText("Agent submission", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Verified MCP", { exact: true }).first(),
    ).toBeVisible();
    await expect(page.getByText(QUESTION)).toBeVisible();
    await expect(page.getByText(CONTEXT)).toBeVisible();
    await expect(
      page.getByText("Agent Zeta (Simulated) needs your assessment on this scenario."),
    ).toHaveCount(0);

    const risky = page.getByRole("button", { name: /Risky/i });
    await expect(risky).toBeVisible();
    await risky.click();
    await expect(
      page.getByRole("button", { name: /Provide Assessment & Earn 500 Luna/i }),
    ).toBeEnabled();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow).toBe(false);
  });

  test("lists active external agents on the landing page", async ({ page }) => {
    await mockBase(page, { authenticated: false });
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: /Active external agents/i }),
    ).toBeVisible();
    await expect(page.getByText(AGENT_NAME)).toBeVisible();
    await expect(page.getByText("Agent API docs")).toBeVisible();
    await expect(page.getByText("0.01 NIM")).toBeVisible();
    await expect(
      page.getByText("MCP server", { exact: true }).first(),
    ).toBeVisible();
    await expect(page.getByText("post_defi_consultation")).toBeVisible();
    await expect(
      page.getByRole("link", { name: /MCP setup/i }),
    ).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow).toBe(false);
  });
});
