/**
 * Records the 390x844 LevelBreak Arena demo flow for the hackathon video.
 *
 * Run with:
 *   pnpm exec tsx scripts/record-demo.ts
 *
 * The script starts a local Vite server unless DEMO_BASE_URL is provided. It
 * mocks the API deterministically so the recording is repeatable and contains
 * no real wallet or treasury state. The final WebM is written to
 * test-results/video/demo-flow.webm.
 */

import { spawn, type ChildProcess } from "node:child_process";
import { mkdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  chromium,
  type Locator,
  type Page,
} from "@playwright/test";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const BASE_URL = process.env.DEMO_BASE_URL ?? "http://127.0.0.1:4325";
const VIDEO_DIR = join(ROOT, "test-results/video");
const OUTPUT = join(VIDEO_DIR, "demo-flow.webm");
const AUDIO_DURATION_SECONDS = 72.144;
// The final video starts at the first fully loaded hero frame, which is the
// moment the timeline anchor (t0) is captured below.
const VIDEO_STARTUP_OFFSET_SECONDS = 0;

const RUN_ID = "77777777-7777-4777-8777-777777777777";
const SESSION_ID = "88888888-8888-4888-8888-888888888888";
const QUESTION_ID = "99999999-9999-4999-8999-999999999999";
const PAYOUT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const AGENT_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const AGENT_NAME = "Nova Risk Agent";
const QUESTION =
  "Would you trust this simulated stablecoin peg under stress?";
const AGENT_CONTEXT =
  "The issuer reports 40% of reserves in a high-yield volatile venue, 24-hour redemption delays, and no published attestation.";
const TX_HASH =
  "fc8cc06317b3f4d5cc8843017215263cd74b71aee06281b159f2ebd53887ec9f";

const state = {
  runState: "IN_PROGRESS" as
    | "IN_PROGRESS"
    | "CONSULTATION_PENDING"
    | "COMPLETED"
    | "PAYOUT_QUEUED",
  stateVersion: 0,
  decisionDone: false,
  responseDone: false,
  finished: false,
};

const scenario = {
  id: "demo-stablecoin-peg",
  version: "demo-1",
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
};

const consultation = {
  id: QUESTION_ID,
  levelIndex: 1,
  evidenceVersion: `agent-${QUESTION_ID}`,
  agentContext: `Request from ${AGENT_NAME} · External agent`,
  agentConfidence: "medium" as const,
  agentMessage: `${AGENT_NAME} needs your assessment of this stablecoin peg under stress.`,
  agentName: AGENT_NAME,
  evidence: {
    type: "text_snippet" as const,
    title: `${AGENT_NAME} context`,
    text: AGENT_CONTEXT,
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
};

const decisionResult = {
  scenarioId: scenario.id,
  scenarioVersion: scenario.version,
  levelIndex: 1,
  decisionKey: "SAFE",
  decisionLabel: "Hold the established stablecoin",
  portfolioBefore: "100000000",
  portfolioAfter: "100000000",
  delta: "0",
  explanation:
    "The simulated peg held. The portfolio stayed stable, but the missing attestations remain an open risk.",
  lesson:
    "A peg is only as strong as the transparency behind its reserves.",
};

const decisionRecord = {
  decisionId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  levelIndex: 1,
  decisionKey: "SAFE",
  result: decisionResult,
  stateVersionBefore: 0,
  createdAt: "2026-11-10T06:00:00.000Z",
};

const responseRecord = {
  responseId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  questionId: QUESTION_ID,
  levelIndex: 1,
  responseKey: "RISKY",
  result: "ANSWERED" as const,
  rewardLuna: "500",
  createdAt: "2026-11-10T06:01:00.000Z",
};

const agents = [
  {
    id: AGENT_ID,
    name: AGENT_NAME,
    questionsPosted: 3,
    activeQuestions: 1,
    rewardsPaidLuna: "1000",
    createdAt: "2026-11-09T18:00:00.000Z",
  },
  {
    id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
    name: "MCP Research Agent",
    questionsPosted: 2,
    activeQuestions: 0,
    rewardsPaidLuna: "1000",
    createdAt: "2026-11-09T17:30:00.000Z",
  },
  {
    id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
    name: "Liquidity Sentinel",
    questionsPosted: 4,
    activeQuestions: 2,
    rewardsPaidLuna: "2000",
    createdAt: "2026-11-09T17:00:00.000Z",
  },
];

function runDetail() {
  return {
    runId: RUN_ID,
    state: state.runState,
    levelIndex: 1,
    maxConsultations: 1,
    stateVersion: state.stateVersion,
    portfolio: {
      unit: "vUSDT",
      value: state.responseDone ? "100000000" : "100000000",
      version: "1",
    },
    earnedLuna: state.responseDone ? "500" : "0",
    maxRewardLuna: "500",
    payoutStatus: state.finished ? "QUEUED" : "NONE",
    scenario: state.runState === "IN_PROGRESS" ? scenario : null,
    consultation:
      state.runState === "CONSULTATION_PENDING" ? consultation : null,
    decisions: state.decisionDone ? [decisionRecord] : [],
    responses: state.responseDone ? [responseRecord] : [],
  };
}

function json(
  route: {
    fulfill: (options: {
      status: number;
      contentType: string;
      body: string;
    }) => Promise<void>;
  },
  body: unknown,
  status = 200,
): Promise<void> {
  return route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function waitForServer(url: string): Promise<void> {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(url, { method: "GET" });
      if (response.ok) return;
    } catch {
      // Vite is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Vite did not start at ${url}`);
}

async function installCursor(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      #demo-cursor {
        position: fixed;
        z-index: 99999;
        width: 14px;
        height: 14px;
        border-radius: 9999px;
        border: 2px solid #151313;
        background: #ff5734;
        box-shadow: 0 4px 14px rgba(21, 19, 19, 0.28);
        pointer-events: none;
        transform: translate(-50%, -50%);
        transition: left 60ms linear, top 60ms linear;
      }
    `,
  });
  await page.evaluate(() => {
    if (document.getElementById("demo-cursor")) return;
    const cursor = document.createElement("div");
    cursor.id = "demo-cursor";
    cursor.style.left = "50%";
    cursor.style.top = "50%";
    document.body.appendChild(cursor);
    window.addEventListener("mousemove", (event) => {
      cursor.style.left = `${event.clientX}px`;
      cursor.style.top = `${event.clientY}px`;
    });
  });
}

async function main(): Promise<void> {
  await rm(VIDEO_DIR, { recursive: true, force: true });
  await mkdir(VIDEO_DIR, { recursive: true });

  let server: ChildProcess | null = null;
  if (!process.env.DEMO_BASE_URL) {
    server = spawn(
      "pnpm",
      [
        "--filter",
        "@levelbreak-arena/web",
        "exec",
        "vite",
        "--host",
        "127.0.0.1",
        "--port",
        "4325",
        "--strictPort",
      ],
      { cwd: ROOT, stdio: "ignore" },
    );
    await waitForServer(BASE_URL);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    screen: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    colorScheme: "light",
    locale: "en-US",
    recordVideo: {
      dir: VIDEO_DIR,
      size: { width: 390, height: 844 },
    },
  });
  const page = await context.newPage();
  const recordingStartedAt = Date.now();

  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();

    if (path === "/api/config/public") {
      return json(route, {
        productName: "LevelBreak Arena",
        networkLabel: "Nimiq Testnet",
        rewardPerAnswerLuna: "500",
        maxConsultations: 5,
        demoMode: true,
      });
    }
    if (path === "/api/config/exchange-rates") {
      return json(route, {
        usd: 0.02818854,
        eur: 0.02511467,
        ngn: 37.97,
      });
    }
    if (path === "/api/me") {
      return json(route, {
        player: {
          address: "NQ42 J2YJ 6Y5J EKE9 P8XY Y1GX L811 11F7 E0DB",
        },
        activeRunId: null,
      });
    }
    if (path === "/api/agents") {
      return json(route, { agents });
    }
    if (path === "/api/sessions/available") {
      return json(route, {
        sessions: [
          {
            id: SESSION_ID,
            publicRef: "8f3a9c1d2e4b6a70",
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
    if (path === `/api/sessions/${SESSION_ID}/claim` && method === "POST") {
      state.runState = "IN_PROGRESS";
      state.stateVersion = 0;
      return json(route, {
        runId: RUN_ID,
        state: "IN_PROGRESS",
        levelIndex: 1,
        stateVersion: 0,
      });
    }
    if (path === `/api/runs/${RUN_ID}`) {
      return json(route, runDetail());
    }
    if (path === `/api/runs/${RUN_ID}/decision` && method === "POST") {
      state.decisionDone = true;
      state.stateVersion = 1;
      state.runState = "CONSULTATION_PENDING";
      return json(route, {
        decisionId: decisionRecord.decisionId,
        levelIndex: 1,
        result: decisionResult,
        nextState: "CONSULTATION_PENDING",
        stateVersion: 1,
      });
    }
    if (
      path === `/api/runs/${RUN_ID}/consultations/${QUESTION_ID}/respond` &&
      method === "POST"
    ) {
      state.responseDone = true;
      state.stateVersion = 2;
      state.runState = "COMPLETED";
      return json(route, {
        responseId: responseRecord.responseId,
        result: "ANSWERED",
        rewardLuna: "500",
        earnedLunaTotal: "500",
        nextState: "COMPLETED",
        stateVersion: 2,
      });
    }
    if (path === `/api/runs/${RUN_ID}/finish` && method === "POST") {
      state.finished = true;
      state.runState = "PAYOUT_QUEUED";
      return json(route, {
        runId: RUN_ID,
        state: "PAYOUT_QUEUED",
        earnedLuna: "500",
        payoutId: PAYOUT_ID,
        payoutStatus: "QUEUED",
      });
    }
    if (path === `/api/runs/${RUN_ID}/payout`) {
      return json(route, {
        payoutId: PAYOUT_ID,
        status: "CONFIRMED",
        amountLuna: "500",
        txHash: TX_HASH,
        explorerUrl: `https://test.nimiq.watch/#${TX_HASH}`,
      });
    }
    if (
      path === `/api/consultations/${QUESTION_ID}/generate-agent-prompt`
    ) {
      return json(route, {
        prompt: `${AGENT_NAME} has reviewed the reserve data and needs your human assessment of this stablecoin peg under stress.`,
        source: "external",
      });
    }
    return json(
      route,
      {
        error: {
          code: "NOT_FOUND",
          message: "Demo route not found.",
          requestId: "demo-video",
        },
      },
      404,
    );
  });

  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.getByRole("heading", { level: 1 }).waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
  await installCursor(page);

  const t0 = Date.now();
  const at = async (seconds: number): Promise<void> => {
    const waitMs = t0 + seconds * 1000 - Date.now();
    if (waitMs > 0) await page.waitForTimeout(waitMs);
  };

  const scrollTo = async (locator: Locator): Promise<void> => {
    await locator.evaluate((element) =>
      element.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
    await page.waitForTimeout(550);
  };

  const click = async (locator: Locator): Promise<void> => {
    await scrollTo(locator);
    const box = await locator.boundingBox();
    if (box) {
      await page.mouse.move(
        box.x + box.width / 2,
        box.y + box.height / 2,
        { steps: 12 },
      );
      await page.waitForTimeout(120);
    }
    await locator.click();
  };

  await at(2);
  // 0:00–0:15 — problem framing on the landing page.
  await at(15.2);
  const enterArena = page
    .getByRole("link", { name: /Enter the Arena/i })
    .first();
  await click(enterArena);
  await page
    .getByRole("heading", { level: 1, name: /Active Missions/i })
    .waitFor();

  await at(22.5);
  const sessionHeading = page
    .getByText(`Request from ${AGENT_NAME}`, { exact: true })
    .first();
  await scrollTo(sessionHeading);

  await at(32.9);
  const claim = page.getByRole("button", { name: /Answer question/i });
  await click(claim);
  await page.getByRole("heading", { name: /Level 1 of 1/i }).waitFor();

  await at(34.5);
  const scenarioHeading = page.getByText("The Peg That Slipped", {
    exact: true,
  });
  await scrollTo(scenarioHeading);

  await at(35.3);
  const choice = page.getByRole("button", {
    name: /Hold the established stablecoin/i,
  });
  await click(choice);
  await page.getByText("Agent Request / Level 01").waitFor();

  await at(36.7);
  const agentMessage = page.locator(
    'section[aria-labelledby="agent-message-heading"]',
  );
  await scrollTo(agentMessage);
  await page
    .locator(".cursor-blink")
    .waitFor({ state: "visible", timeout: 5_000 })
    .catch(() => undefined);
  await page.waitForFunction(
    () => !document.querySelector(".cursor-blink"),
    null,
    { timeout: 8_000 },
  );

  await at(39.8);
  await scrollTo(page.getByText("Agent Request / Level 01"));
  await at(43.8);
  const risky = page.getByRole("button", { name: /Risky/i }).first();
  await click(risky);
  await at(45.1);
  const provide = page.getByRole("button", {
    name: /Provide Assessment & Earn 500 Luna/i,
  });
  await click(provide);
  const finish = page.getByRole("button", {
    name: /Finish and claim payout/i,
  });
  await finish.waitFor();
  await scrollTo(finish);

  await at(48.4);
  await click(finish);
  await page.getByText("Reward Confirmed.").waitFor({ timeout: 8_000 });
  await page.getByText("Your testnet NIM is in your wallet.").waitFor({
    timeout: 8_000,
  });
  await scrollTo(page.getByText("Reward Confirmed."));

  await at(52.8);
  const withdraw = page.getByRole("button", { name: /Withdraw to Fiat/i });
  await click(withdraw);
  const dialog = page.getByRole("dialog", { name: /Fiat Off-Ramp/i });
  await dialog.waitFor();
  await dialog.getByText(/1 NIM = ₦/).waitFor({ timeout: 5_000 });

  await at(54.8);
  await click(dialog.getByRole("button", { name: /EUR/i }));
  await dialog.getByText(/1 NIM = €/).waitFor({ timeout: 5_000 });
  await at(56.5);
  await click(dialog.getByRole("button", { name: /USD/i }));
  await dialog.getByText(/1 NIM = \$/).waitFor({ timeout: 5_000 });
  await at(58.0);
  await click(dialog.getByRole("button", { name: /NGN/i }));
  await dialog.getByText(/1 NIM = ₦/).waitFor({ timeout: 5_000 });

  await at(63.5);
  await click(dialog.getByRole("button", { name: /Cancel/i }));
  await dialog.waitFor({ state: "hidden" });

  await at(64.2);
  await click(
    page.getByRole("link", { name: /LevelBreak Arena/i }).first(),
  );
  await page
    .getByRole("heading", {
      level: 1,
      name: /The AI Agent Economy Needs Your Judgment/i,
    })
    .waitFor();
  await page.evaluate(() =>
    window.scrollTo({ top: 0, behavior: "smooth" }),
  );
  await page.waitForTimeout(900);
  await at(72.0);
  await page.waitForTimeout(350);

  const video = page.video();
  const trimStartSeconds = Math.max(
    0,
    (t0 - recordingStartedAt) / 1000 - VIDEO_STARTUP_OFFSET_SECONDS,
  );
  await page.close();
  if (video) {
    await video.saveAs(OUTPUT);
  }
  await context.close();
  await browser.close();
  if (server) {
    server.kill("SIGTERM");
  }

  if (!video) throw new Error("Playwright did not produce a video.");
  console.log(
    JSON.stringify(
      {
        video: OUTPUT,
        audioDurationSeconds: AUDIO_DURATION_SECONDS,
        trimStartSeconds,
        viewport: "390x844",
      },
      null,
      2,
    ),
  );
}

void main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.stack ?? error.message : String(error),
  );
  process.exitCode = 1;
});
