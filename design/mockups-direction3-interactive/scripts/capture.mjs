import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

const baseUrl = process.env.CAPTURE_URL ?? "http://127.0.0.1:5173";
const outDir =
  process.env.CAPTURE_DIR ?? path.resolve(import.meta.dirname, "../screenshots");
const launchArgs = ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"];

await mkdir(outDir, { recursive: true });

const errors = [];

function collect(page, label = "") {
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(`${label}console: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => {
    errors.push(`${label}pageerror: ${error.message}`);
  });
}

const browser = await chromium.launch({ args: launchArgs });
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});
collect(page);

async function wait(ms = 600) {
  await page.waitForTimeout(ms);
}

async function shot(name, selector) {
  await wait(300);
  if (selector) {
    await page.locator(selector).screenshot({
      path: path.join(outDir, name),
      timeout: 60_000,
    });
  } else {
    await page.screenshot({
      path: path.join(outDir, name),
      timeout: 60_000,
    });
  }
  console.log(`captured ${name}`);
}

await page.goto(baseUrl, { waitUntil: "networkidle" });
await page.getByTestId("galaxy-canvas").waitFor();
await wait(2600);
await shot("01-orbit-map.png");

await page.getByTestId("open-planet-1").click();
await wait(1100);
await shot("02-teacher-list.png");

await page.getByTestId("teacher-list").evaluate((element) => {
  element.scrollTop = element.scrollHeight;
});
await wait(450);
await shot("03-teacher-tiers.png");
await page.getByTestId("teacher-list").evaluate((element) => {
  element.scrollTop = 0;
});
await wait(400);

await page.getByTestId("simulate-xp-max").evaluate((element) => element.click());
await page.getByTestId("impact-overlay").waitFor({ timeout: 20_000 });
await wait(650);
await shot("04-asteroid-strike.png");

await page.waitForFunction(
  () =>
    Boolean(document.querySelector('[data-testid="open-agent-impact"]')) ||
    Boolean(document.querySelector('[data-testid="agent-modal"]')),
  { timeout: 20_000 },
);
if ((await page.getByTestId("open-agent-impact").count()) > 0) {
  await page.evaluate(() => {
    document.querySelector('[data-testid="open-agent-impact"]')?.click();
  });
}
await page.getByTestId("agent-modal").waitFor({ timeout: 20_000 });
await wait(450);
await shot("05-agent-consultation.png");

await page.getByTestId("agent-answer-RISKY").click();
await page.waitForFunction(() => {
  const element = document.querySelector('[data-testid="payout-status"]');
  return element?.getAttribute("aria-label")?.includes("CONFIRMED");
}, { timeout: 15_000 });
await wait(300);
await shot("06-agent-payout.png");

const payoutStatus = await page
  .getByTestId("payout-status")
  .getAttribute("aria-label");
const referenceTx = await page.getByTestId("phase5-tx").getAttribute("href");

await page.getByTestId("agent-finish").click();
await wait(2600);
await shot("07-galaxy-conquered.png");

await page.close();

const mobileBrowser = await chromium.launch({ args: launchArgs });
const mobile = await mobileBrowser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
});
collect(mobile, "mobile ");
await mobile.goto(baseUrl, { waitUntil: "networkidle" });
await mobile.waitForTimeout(2400);
await mobile.screenshot({
  path: path.join(outDir, "08-mobile-orbit.png"),
  timeout: 60_000,
});
console.log("captured 08-mobile-orbit.png");
await mobileBrowser.close();
await browser.close();

console.log(
  JSON.stringify(
    {
      consoleErrors: errors,
      payoutStatus,
      referenceTx,
      screenshots: outDir,
    },
    null,
    2,
  ),
);

if (errors.length > 0) process.exitCode = 1;
