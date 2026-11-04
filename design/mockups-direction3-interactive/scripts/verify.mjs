import { chromium } from "@playwright/test";

const baseUrl = process.env.CAPTURE_URL ?? "http://127.0.0.1:5173";
const launchArgs = ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"];
const errors = [];
const results = [];

function check(name, condition, detail = "") {
  results.push({ name, pass: Boolean(condition), detail });
  if (!condition) process.exitCode = 1;
}

function collect(page, label = "") {
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`${label}console: ${message.text()}`);
  });
  page.on("pageerror", (error) => errors.push(`${label}pageerror: ${error.message}`));
}

const browser = await chromium.launch({ args: launchArgs });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
});
const page = await context.newPage();
collect(page);

await page.goto(baseUrl, { waitUntil: "networkidle" });
await page.waitForTimeout(2000);

check(
  "galaxy contains 12 planets",
  (await page.getByTestId("galaxy-canvas").getAttribute("data-planet-count")) ===
    "12",
);
check(
  "eleven sealed planet labels are rendered",
  (await page.locator(".planet-label").count()) === 11,
);
check(
  "permanent testnet trust badge is visible",
  (await page.getByTestId("trust-badge").innerText()).includes("NOT REAL MONEY"),
);

await page.getByTestId("planet-label-2").click();
await page.getByTestId("toast").waitFor();
check(
  "sealed planet click is refused with a message",
  (await page.getByTestId("toast").innerText()).includes("SEALED"),
);

await page.getByTestId("open-planet-1").click();
await page.getByTestId("conquest-panel").waitFor();
await page.waitForTimeout(500);
check("planet dossier opens the conquest view", true);
check(
  "teacher tower contains 18 teachers",
  (await page.locator(".teacher-row").count()) === 18,
);

// Passing a teacher test grants XP; a wrong answer does not.
await page.getByTestId("teacher-row-1").click();
await page.getByTestId("teacher-test-modal").waitFor();
await page.getByTestId("teacher-option-0").click();
await page.getByTestId("teacher-test-feedback").waitFor();
check(
  "wrong teacher answer is rejected",
  (await page.getByTestId("teacher-test-feedback").innerText()).includes(
    "Not quite",
  ),
);
check(
  "wrong answer awards no XP",
  (await page.getByRole("progressbar").getAttribute("aria-valuenow")) === "0",
);
await page.getByTestId("teacher-retry").click();
await page.getByTestId("teacher-option-1").click();
await page.waitForTimeout(500);
check(
  "correct teacher answer grants XP",
  (await page.getByTestId("teacher-test-feedback").innerText()).includes(
    "Mastered",
  ) &&
    (await page.getByRole("progressbar").getAttribute("aria-valuenow")) === "4",
);
await page.getByTestId("teacher-test-finish").click();
await page.waitForTimeout(300);
check(
  "mastered teacher is marked in the roster",
  (await page.getByTestId("teacher-row-1").getAttribute("class"))?.includes(
    "is-mastered",
  ) === true,
);

// The operator shortcut reaches the threshold and triggers the asteroid strike.
await page.getByTestId("simulate-xp-max").click();
await page.getByTestId("impact-overlay").waitFor();
check(
  "XP max triggers the asteroid strike cinematic",
  (await page.getByTestId("impact-overlay").innerText()).includes("TESTNET"),
);
await page.waitForFunction(
  () =>
    Boolean(document.querySelector('[data-testid="open-agent-impact"]')) ||
    Boolean(document.querySelector('[data-testid="agent-modal"]')),
  { timeout: 30_000 },
);
if ((await page.getByTestId("open-agent-impact").count()) > 0) {
  await page.evaluate(() => {
    document.querySelector('[data-testid="open-agent-impact"]')?.click();
  });
}
await page.getByTestId("agent-modal").waitFor({ timeout: 15_000 });
check(
  "asteroid reveal opens the scripted Agent consultation",
  (await page.getByTestId("agent-modal").innerText()).includes(
    "SCRIPTED DEMO REQUESTER",
  ),
);
check(
  "Agent consultation shows evidence before the question",
  (await page.getByTestId("agent-modal").innerText()).includes(
    "Unsealed stablecoin telemetry",
  ),
);

await page.getByTestId("agent-answer-RISKY").click();
await page.waitForFunction(() => {
  const element = document.querySelector('[data-testid="payout-status"]');
  return element?.getAttribute("aria-label")?.includes("CONFIRMED");
}, { timeout: 15_000 });
const agentText = await page.getByTestId("agent-modal").innerText();
check(
  "accepted Agent response grants 500 Luna",
  agentText.includes("+500") && agentText.includes("LUNA"),
);
check(
  "Agent payout reaches simulated CONFIRMED",
  agentText.includes("SIMULATED PAYOUT CONFIRMED"),
);
check(
  "Phase 5 reference tx is the real testnet hash",
  (await page.getByTestId("phase5-tx").getAttribute("href")) ===
    "https://test.nimiq.watch/#139bfc81643ffb410c1f2a179d0d152ab7346f5205f31d99642a1e0e577421e4",
);
check(
  "operator treasury disclosure is present",
  agentText.includes("Operator Treasury"),
);
await page.getByTestId("agent-finish").click();
await page.waitForTimeout(900);
check(
  "returning to the galaxy marks Xylos conquered",
  (await page.getByTestId("planet-dossier").innerText()).includes("CONQUERED") &&
    (await page.getByTestId("agent-chip").innerText()).includes("RECEIPT"),
);

await page.getByTestId("reset-demo").click();
await page.waitForTimeout(600);
check(
  "reset restores the sealed starting state",
  (await page.getByTestId("agent-chip").innerText()).includes("SEALED") &&
    (await page.getByTestId("galaxy-canvas").getAttribute("data-planet-count")) ===
      "12",
);

await context.close();

// Mobile layout and overflow.
const mobileContext = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});
const mobile = await mobileContext.newPage();
collect(mobile, "mobile ");
await mobile.goto(baseUrl, { waitUntil: "networkidle" });
await mobile.waitForTimeout(1600);
const mobileMetrics = await mobile.evaluate(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  innerWidth: window.innerWidth,
}));
check(
  "390px galaxy has no horizontal overflow",
  mobileMetrics.scrollWidth <= mobileMetrics.innerWidth + 1,
  JSON.stringify(mobileMetrics),
);
await mobile.getByTestId("open-planet-1").click();
await mobile.getByTestId("conquest-panel").waitFor();
const mobilePanelMetrics = await mobile.evaluate(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  innerWidth: window.innerWidth,
}));
check(
  "390px teacher tower has no horizontal overflow",
  mobilePanelMetrics.scrollWidth <= mobilePanelMetrics.innerWidth + 1,
  JSON.stringify(mobilePanelMetrics),
);
await mobileContext.close();

// Reduced motion keeps the same controls available.
const reducedContext = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  reducedMotion: "reduce",
});
const reduced = await reducedContext.newPage();
collect(reduced, "reduced ");
await reduced.goto(baseUrl, { waitUntil: "networkidle" });
await reduced.waitForTimeout(1400);
check(
  "reduced-motion orbit renders the planet action",
  await reduced.getByTestId("open-planet-1").isVisible(),
);
await reduced.getByTestId("open-planet-1").click();
await reduced.getByTestId("teacher-row-1").waitFor();
check(
  "reduced-motion teacher tower is usable",
  await reduced.getByTestId("teacher-row-1").isVisible(),
);
await reducedContext.close();

await browser.close();

for (const result of results) {
  console.log(
    `${result.pass ? "PASS" : "FAIL"} — ${result.name}${result.detail ? ` (${result.detail})` : ""}`,
  );
}
console.log(JSON.stringify({ consoleErrors: errors }, null, 2));
if (errors.length > 0) process.exitCode = 1;
