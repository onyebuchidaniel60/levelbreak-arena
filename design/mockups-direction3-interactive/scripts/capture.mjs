import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

const baseUrl = process.env.CAPTURE_URL ?? "http://127.0.0.1:5173";
const outDir =
  process.env.CAPTURE_DIR ?? path.resolve(import.meta.dirname, "../screenshots");
const launchArgs = ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"];

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ args: launchArgs });
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});
const consoleErrors = [];
page.on("console", (message) => {
  if (message.type() === "error") {
    consoleErrors.push(`console: ${message.text()}`);
  }
});
page.on("pageerror", (error) => {
  consoleErrors.push(`pageerror: ${error.message}`);
});

async function wait(ms = 650) {
  await page.waitForTimeout(ms);
}

async function shot(name) {
  await page.mouse.move(1380, 44);
  await wait(420);
  await page.screenshot({ path: path.join(outDir, name) });
  console.log(`captured ${name}`);
}

await page.goto(baseUrl, { waitUntil: "networkidle" });
await page.getByTestId("orbit-canvas").waitFor();
await page.waitForTimeout(2400);
await page.mouse.move(760, 480);
await shot("01-orbit.png");

await page.getByTestId("open-sector").click();
await wait(1000);
await shot("02-sector-briefing.png");

await page.getByTestId("decision-STAY").click();
await wait(650);
await shot("03-sector-consequence.png");

await page.getByTestId("open-consultation").click();
await wait(850);
await shot("04-consultation.png");

await page.getByTestId("answer-RISKY").click();
await wait(650);
await shot("05-reward.png");

await page.getByTestId("finish-sector").click();
await wait(1800);
await shot("06-sector-cleared.png");

await page.getByTestId("next-sector").click();
await wait(750);
await page.getByTestId("decision-EXIT").click();
await wait(450);
await page.getByTestId("open-consultation").click();
await wait(500);
await page.getByTestId("answer-SAFE").click();
await wait(500);
await page.getByTestId("finish-sector").click();
await wait(700);
await page.getByTestId("next-sector").click();
await wait(750);
await page.getByTestId("decision-READ").click();
await wait(450);
await page.getByTestId("open-consultation").click();
await wait(500);
await page.getByTestId("answer-RISKY").click();
await wait(500);
await page.getByTestId("finish-sector").click();
await wait(1900);
await shot("07-run-complete.png");

await page.getByTestId("level-summary").click();
await wait(250);
await page.getByTestId("summary-overlay").waitFor();
await page.waitForTimeout(2600);
await shot("08-summary.png");

const payoutStatus = await page
  .getByTestId("payout-status")
  .getAttribute("aria-label");
const referenceTx = await page.getByTestId("phase5-tx").getAttribute("href");

await page.close();

const mobileBrowser = await chromium.launch({ args: launchArgs });
const mobile = await mobileBrowser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
});
mobile.on("console", (message) => {
  if (message.type() === "error") {
    consoleErrors.push(`mobile console: ${message.text()}`);
  }
});
mobile.on("pageerror", (error) => {
  consoleErrors.push(`mobile pageerror: ${error.message}`);
});
await mobile.goto(baseUrl, { waitUntil: "networkidle" });
await mobile.waitForTimeout(2600);
await mobile.screenshot({
  path: path.join(outDir, "09-mobile-orbit.png"),
  timeout: 60_000,
});
console.log("captured 09-mobile-orbit.png");
await mobileBrowser.close();

await browser.close();

console.log(
  JSON.stringify(
    {
      consoleErrors,
      payoutStatus,
      referenceTx,
    },
    null,
    2,
  ),
);

if (consoleErrors.length > 0) {
  process.exitCode = 1;
}
