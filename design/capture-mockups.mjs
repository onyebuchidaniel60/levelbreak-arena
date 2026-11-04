/**
 * Phase 6 mockup capture + validation.
 * Static HTML files only. This script is not part of the application.
 *
 * Run: node design/capture-mockups.mjs
 *
 * Outputs:
 *   screenshots/desktop/<screen>.png        exact 1440x900 viewport
 *   screenshots/desktop/<screen>-full.png   full-page capture at 1440px
 *   screenshots/mobile/<screen>.png         exact 375x812 viewport
 *   screenshots/mobile/<screen>-full.png    full-page capture at 375px
 *   screenshots/mobile/<screen>-320.png     exact 320x568 viewport (05, 07)
 *   screenshots/mobile/<screen>-320-full.png full-page at 320px (05, 07)
 */
import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "mockups");
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
];

const stressScreens = new Set(["05-game-level1.html", "07-consultation.html"]);

await mkdir(desktopDir, { recursive: true });
await mkdir(mobileDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const report = { screenshots: [], consoleErrors: [], pageErrors: [], overflow: [], checks: [] };

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

  const url = `file://${join(root, file)}`;
  await page.goto(url, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);

  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    scrollHeight: document.documentElement.scrollHeight,
    innerHeight: window.innerHeight,
    images: Array.from(document.images).map((image) => ({
      src: image.getAttribute("src"),
      ok: image.complete && image.naturalWidth > 0,
    })),
    scripts: document.querySelectorAll("script").length,
    title: document.title,
  }));

  if (metrics.scrollWidth > metrics.clientWidth + 1) {
    report.overflow.push({
      file,
      width,
      scrollWidth: metrics.scrollWidth,
      clientWidth: metrics.clientWidth,
    });
  }
  for (const error of consoleErrors) report.consoleErrors.push({ file, width, error });
  for (const error of pageErrors) report.pageErrors.push({ file, width, error });
  report.checks.push({
    file,
    width,
    scripts: metrics.scripts,
    imagesOk: metrics.images.every((image) => image.ok),
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
    // Required verification: every screen must avoid horizontal scroll at 320px too.
    await render(file, 320, 568, mobileDir, stem, { capture: false });
  }
}

await browser.close();

const allHtml = screens.map(async (file) => {
  const html = await readFile(join(root, file), "utf8");
  return {
    file,
    scriptTags: (html.match(/<script\b/gi) || []).length,
    externalImages: (html.match(/<img\b/gi) || []).length,
    hasWatermark: html.includes("Mockup — not implemented"),
  };
});
report.staticChecks = await Promise.all(allHtml);

await writeFile(
  join(root, "screenshots", "validation.json"),
  JSON.stringify(report, null, 2) + "\n",
  "utf8",
);

const failures =
  report.consoleErrors.length +
  report.pageErrors.length +
  report.overflow.length +
  report.checks.filter((check) => check.scripts > 0 || !check.imagesOk).length +
  report.staticChecks.filter((check) => check.scriptTags > 0 || !check.hasWatermark).length;

console.log(
  JSON.stringify(
    {
      screenshots: report.screenshots.length,
      consoleErrors: report.consoleErrors.length,
      pageErrors: report.pageErrors.length,
      overflowAtTestedWidths: report.overflow.length,
      widthsChecked: [...new Set(report.checks.map((check) => check.width))].sort((a, b) => a - b),
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
