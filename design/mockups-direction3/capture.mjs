/**
 * Direction 3 — Gamified / Risk Orbit mockup capture + validation.
 * Static HTML only. Not part of the application.
 *
 * Run: node design/mockups-direction3/capture.mjs
 */
import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const desktopDir = join(root, "screenshots", "desktop");
const mobileDir = join(root, "screenshots", "mobile");

const screens = [
  "01-landing.html",
  "02-wallet-connect.html",
  "03-lobby-available.html",
  "04-lobby-empty.html",
  "05-game-level1.html",
  "06-game-consequence.html",
  "07-consultation.html",
  "08-consultation-answered.html",
  "09-payout-states.html",
  "10-zero-reward.html",
  "11-history.html",
  "12-states-composite.html",
  "13-level-complete.html",
  "14-session-summary.html",
];

const stressScreens = new Set([
  "05-game-level1.html",
  "07-consultation.html",
  "09-payout-states.html",
  "13-level-complete.html",
  "14-session-summary.html",
]);

await mkdir(desktopDir, { recursive: true });
await mkdir(mobileDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const report = {
  screenshots: [],
  consoleErrors: [],
  pageErrors: [],
  overflow: [],
  offscreen: [],
  checks: [],
};

async function render(file, width, height, outputDir, stem, options = {}) {
  const { fullPage = false, suffix = "", capture = true } = options;
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(`file://${join(root, file)}`, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);

  const metrics = await page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const offscreen = [...document.querySelectorAll("body *")]
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        const decorative = Boolean(element.closest('[aria-hidden="true"]'));
        return {
          tag: element.tagName,
          className:
            typeof element.className === "string"
              ? element.className.slice(0, 50)
              : "",
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
          display: style.display,
          visibility: style.visibility,
          decorative,
        };
      })
      .filter(
        (item) =>
          !item.decorative &&
          item.display !== "none" &&
          item.visibility !== "hidden" &&
          item.width > 0 &&
          (item.right > width + 1 || item.left < -1),
      );

    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: width,
      scrollHeight: document.documentElement.scrollHeight,
      innerHeight: window.innerHeight,
      offscreen,
      images: Array.from(document.images).map((image) => ({
        src: image.getAttribute("src"),
        ok: image.complete && image.naturalWidth > 0,
      })),
      scripts: document.querySelectorAll("script").length,
      title: document.title,
      watermark: Boolean(document.querySelector(".watermark")),
    };
  });

  if (metrics.scrollWidth > metrics.clientWidth + 1) {
    report.overflow.push({
      file,
      width,
      scrollWidth: metrics.scrollWidth,
      clientWidth: metrics.clientWidth,
    });
  }
  if (metrics.offscreen.length > 0) {
    report.offscreen.push({ file, width, elements: metrics.offscreen });
  }
  for (const error of consoleErrors) report.consoleErrors.push({ file, width, error });
  for (const error of pageErrors) report.pageErrors.push({ file, width, error });
  report.checks.push({
    file,
    width,
    scripts: metrics.scripts,
    imagesOk: metrics.images.every((image) => image.ok),
    watermark: metrics.watermark,
    title: metrics.title,
  });

  if (capture) {
    const path = join(outputDir, `${stem}${suffix}.png`);
    await page.screenshot({ path, fullPage });
    report.screenshots.push({
      file,
      width,
      height,
      capture: fullPage ? "full-page" : "viewport",
      path: path.replace(root + "/", ""),
      imageWidth: width,
      pageHeight: metrics.scrollHeight,
      viewportHeight: metrics.innerHeight,
    });
  }

  await context.close();
}

for (const file of screens) {
  const stem = file.replace(/\.html$/, "");
  await render(file, 1440, 900, desktopDir, stem);
  await render(file, 1440, 900, desktopDir, stem, { fullPage: true, suffix: "-full" });
  await render(file, 375, 812, mobileDir, stem);
  await render(file, 375, 812, mobileDir, stem, { fullPage: true, suffix: "-full" });
  if (stressScreens.has(file)) {
    await render(file, 320, 568, mobileDir, stem, { suffix: "-320" });
    await render(file, 320, 568, mobileDir, stem, {
      fullPage: true,
      suffix: "-320-full",
    });
  } else {
    await render(file, 320, 568, mobileDir, stem, { capture: false });
  }
}

await browser.close();

const requiredCopy = {
  "01-landing.html": ["Testnet · not real money", "Scripted Guide", "Operator treasury"],
  "02-wallet-connect.html": ["Testnet · not real money", "Operator treasury", "not a transaction"],
  "03-lobby-available.html": ["Testnet · not real money", "Operator treasury", "Scripted", "0f566d59"],
  "04-lobby-empty.html": ["Testnet", "Operator treasury", "funding"],
  "05-game-level1.html": ["Testnet · not real money", "1,000 vUSDT", "12% APY", "no outcome preview"],
  "06-game-consequence.html": ["Testnet · not real money", "800 vUSDT", "peg failure", "Operator treasury"],
  "07-consultation.html": ["Scripted requester", "Testnet · not real money", "Operator treasury", "12% advertised APY", "none shown"],
  "08-consultation-answered.html": ["Testnet · not real money", "Operator treasury", "Not paid yet", "500 Luna"],
  "09-payout-states.html": ["Testnet · not real money", "Operator treasury", "15839460", "b693acd3"],
  "10-zero-reward.html": ["Testnet · not real money", "Operator treasury", "No payout"],
  "11-history.html": ["Testnet · not real money", "139bfc81", "b693acd3", "Operator treasury"],
  "12-states-composite.html": ["Testnet · not real money", "No financial state"],
  "13-level-complete.html": ["Testnet · not real money", "Operator treasury", "Scripted", "500 Luna"],
  "14-session-summary.html": ["Testnet · not real money", "Operator treasury", "15839460", "b693acd3", "Scripted"],
};

const staticChecks = [];
for (const file of screens) {
  const html = await readFile(join(root, file), "utf8");
  const normalized = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .toLowerCase();
  const missing = requiredCopy[file].filter(
    (term) => !normalized.includes(term.toLowerCase()),
  );
  staticChecks.push({
    file,
    scriptTags: (html.match(/<script\b/gi) || []).length,
    externalImages: (html.match(/<img\b/gi) || []).length,
    hasWatermark: html.includes("Mockup — not implemented"),
    trustCopyMissing: missing,
  });
}
report.staticChecks = staticChecks;

await writeFile(
  join(root, "screenshots", "validation.json"),
  JSON.stringify(report, null, 2) + "\n",
  "utf8",
);

const failures =
  report.consoleErrors.length +
  report.pageErrors.length +
  report.overflow.length +
  report.offscreen.length +
  report.checks.filter(
    (check) => check.scripts > 0 || !check.imagesOk || !check.watermark,
  ).length +
  staticChecks.filter(
    (check) =>
      check.scriptTags > 0 ||
      !check.hasWatermark ||
      check.trustCopyMissing.length > 0,
  ).length;

console.log(
  JSON.stringify(
    {
      screenshots: report.screenshots.length,
      consoleErrors: report.consoleErrors.length,
      pageErrors: report.pageErrors.length,
      overflowAtTestedWidths: report.overflow.length,
      offscreenElements: report.offscreen.length,
      widthsChecked: [...new Set(report.checks.map((check) => check.width))].sort(
        (a, b) => a - b,
      ),
      trustCopyMissing: staticChecks.filter((c) => c.trustCopyMissing.length).map((c) => ({
        file: c.file,
        missing: c.trustCopyMissing,
      })),
      failures,
    },
    null,
    2,
  ),
);

if (failures > 0) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}
