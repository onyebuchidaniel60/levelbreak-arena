import { chromium } from "@playwright/test";

const baseUrl = process.env.CAPTURE_URL ?? "http://127.0.0.1:5173";
const args = ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"];
const results = [];
const errors = [];

function check(name, condition, detail = "") {
  results.push({ name, pass: Boolean(condition), detail });
  if (!condition) process.exitCode = 1;
}

const browser = await chromium.launch({ args });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
});
const page = await context.newPage();
page.on("console", (message) => {
  if (message.type() === "error") errors.push(`console: ${message.text()}`);
});
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));

await page.goto(baseUrl, { waitUntil: "networkidle" });
await page.waitForTimeout(1900);

check(
  "testnet trust badge is permanent on orbit",
  (await page.getByTestId("trust-badge").innerText()).includes("NOT REAL MONEY"),
);

await page.getByTestId("planet-label-2").click({ force: true });
await page.getByTestId("toast").waitFor();
check(
  "locked sector click is refuse-with-toast",
  (await page.getByTestId("toast").innerText()).includes("LOCKED"),
);
check(
  "locked sector does not open an overlay",
  (await page.getByTestId("sector-overlay").count()) === 0,
);

await page.getByTestId("planet-label-1").click({ force: true });
await page.getByTestId("sector-overlay").waitFor();
check("clicking the active 3D planet opens sector detail", true);
await page.keyboard.press("Escape");
await page.waitForTimeout(450);
check(
  "Escape closes the sector detail",
  (await page.getByTestId("sector-overlay").count()) === 0,
);

// Skip path: one sector skipped should earn zero and unlock the next sector.
await page.getByTestId("open-sector").click();
await page.getByTestId("decision-STAY").click();
await page.getByTestId("open-consultation").click();
await page.getByTestId("skip-consultation").click();
await page.getByTestId("level-complete-banner").waitFor();
const skipBanner = await page.getByTestId("level-complete-banner").innerText();
check("skip earns zero in the level banner", skipBanner.includes("0 Luna — skipped"));
const hudText = await page.locator(".hud-top").innerText();
check("skip does not add XP or Luna", hudText.includes("000 / 300") && hudText.includes("0 LUNA"));

// Reset the demo.
await page.getByTestId("reset-demo").click();
await page.waitForTimeout(600);
check(
  "reset returns to a fresh orbit",
  (await page.getByTestId("level-complete-banner").count()) === 0 &&
    (await page.locator(".hud-top").innerText()).includes("000 / 300"),
);

// Full zero-reward run: reload for a clean run, then skip all three sectors
// and verify no payout is implied.
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(1200);
await page.getByTestId("orbit-canvas").waitFor();
await page.waitForSelector('[data-testid="open-sector"]', { timeout: 15_000 });
for (let index = 1; index <= 3; index += 1) {
  if (index === 1) {
    await page.evaluate(() => {
      const button = document.querySelector('[data-testid="open-sector"]');
      if (!(button instanceof HTMLElement)) {
        throw new Error("Open sector button is missing");
      }
      button.click();
    });
    await page.getByTestId("sector-overlay").waitFor();
  }
  await page.locator('[data-testid^="decision-"]').first().click();
  await page.getByTestId("open-consultation").click();
  await page.getByTestId("skip-consultation").click();
  await page.getByTestId("level-complete-banner").waitFor();
  if (index < 3) {
    await page.getByTestId("next-sector").click();
    await page.getByTestId("sector-overlay").waitFor();
  } else {
    await page.getByTestId("level-summary").click();
  }
}
await page.getByTestId("summary-overlay").waitFor();
await page.waitForTimeout(400);
check(
  "all-skipped run reports zero payout",
  (await page.getByTestId("zero-payout").count()) === 1,
);
check(
  "all-skipped run does not show a payout lifecycle",
  (await page.getByTestId("payout-status").count()) === 0,
);
check(
  "summary keeps the operator-treasury disclosure",
  (await page.getByTestId("summary-overlay").innerText()).includes("Operator Treasury"),
);
await page.getByTestId("summary-replay").click();
await page.waitForTimeout(600);
check(
  "summary replay resets the run",
  (await page.getByTestId("summary-overlay").count()) === 0 &&
    (await page.getByTestId("trust-badge").isVisible()),
);

await context.close();

// Mobile layout and overflow.
const mobileContext = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});
const mobile = await mobileContext.newPage();
mobile.on("console", (message) => {
  if (message.type() === "error") errors.push(`mobile console: ${message.text()}`);
});
mobile.on("pageerror", (error) => errors.push(`mobile pageerror: ${error.message}`));
await mobile.goto(baseUrl, { waitUntil: "networkidle" });
await mobile.waitForTimeout(1600);
const mobileMetrics = await mobile.evaluate(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  innerWidth: window.innerWidth,
  scrollHeight: document.documentElement.scrollHeight,
  innerHeight: window.innerHeight,
}));
check(
  "390px viewport has no horizontal overflow",
  mobileMetrics.scrollWidth <= mobileMetrics.innerWidth + 1,
  JSON.stringify(mobileMetrics),
);
await mobile.getByTestId("planet-label-1").click({ force: true });
await mobile.getByTestId("sector-overlay").waitFor();
await mobile.waitForTimeout(500);
const mobileOverlayMetrics = await mobile.evaluate(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  innerWidth: window.innerWidth,
}));
check(
  "390px sector overlay has no horizontal overflow",
  mobileOverlayMetrics.scrollWidth <= mobileOverlayMetrics.innerWidth + 1,
  JSON.stringify(mobileOverlayMetrics),
);
await mobileContext.close();

// Reduced motion still exposes the complete static state.
const reducedContext = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  reducedMotion: "reduce",
});
const reduced = await reducedContext.newPage();
reduced.on("console", (message) => {
  if (message.type() === "error") errors.push(`reduced console: ${message.text()}`);
});
reduced.on("pageerror", (error) => errors.push(`reduced pageerror: ${error.message}`));
await reduced.goto(baseUrl, { waitUntil: "networkidle" });
await reduced.waitForTimeout(1200);
check(
  "reduced-motion orbit renders controls",
  await reduced.getByTestId("open-sector").isVisible(),
);
await reduced.getByTestId("open-sector").click();
await reduced.getByTestId("sector-overlay").waitFor();
check(
  "reduced-motion sector overlay is usable",
  await reduced.getByTestId("decision-STAY").isVisible(),
);
await reducedContext.close();

await browser.close();

for (const result of results) {
  console.log(`${result.pass ? "PASS" : "FAIL"} — ${result.name}${result.detail ? ` (${result.detail})` : ""}`);
}
console.log(JSON.stringify({ consoleErrors: errors }, null, 2));
if (errors.length > 0) process.exitCode = 1;
