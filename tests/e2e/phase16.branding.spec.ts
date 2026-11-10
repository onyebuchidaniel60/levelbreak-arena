import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

const SCREENSHOT_DIR = "test-results/phase16";
const EMPTY_MESSAGE =
  "We are preparing a new funded session for you. Please refresh in 30 seconds.";

mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function mockApi(page: Page, options: { authenticated?: boolean } = {}) {
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
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
              requestId: "phase16",
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
      return json({ agents: [] });
    }
    if (path === "/api/sessions/available") {
      return json({ sessions: [], message: EMPTY_MESSAGE });
    }
    return json(
      {
        error: {
          code: "NOT_FOUND",
          message: "Not found.",
          requestId: "phase16",
        },
      },
      404,
    );
  });
}

test.describe("Phase 16 branding and empty lobby", () => {
  test("header logo and favicon at 1440 and 390", async ({ page }) => {
    await mockApi(page);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);

    const logo = page.getByTestId("brand-logo");
    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute("src", "/logo.svg");
    const logoSize = await logo.evaluate((image) => {
      const element = image as HTMLImageElement;
      return { width: element.naturalWidth, height: element.naturalHeight };
    });
    expect(logoSize).toEqual({ width: 64, height: 64 });

    const faviconHref = await page
      .locator('link[rel="icon"]')
      .getAttribute("href");
    expect(faviconHref).toBe("/favicon.svg");

    const favicon = await page.request.get("/favicon.svg");
    expect(favicon.status()).toBe(200);
    expect(favicon.headers()["content-type"]).toContain("image/svg+xml");
    expect(await favicon.text()).toContain("#ff5734");

    const logoResponse = await page.request.get("/logo.svg");
    expect(logoResponse.status()).toBe(200);
    expect(logoResponse.headers()["content-type"]).toContain("image/svg+xml");

    const header = page.locator("header");
    await header.screenshot({ path: `${SCREENSHOT_DIR}/header-1440.png` });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(200);
    await header.screenshot({ path: `${SCREENSHOT_DIR}/header-390.png` });

    for (const width of [320, 375, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await page.waitForTimeout(80);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      );
      expect(overflow, `branding overflow at ${width}px`).toBe(false);
      await expect(logo).toBeVisible();
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(100);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/landing-branded-390.png`,
      fullPage: false,
    });
  });

  test("empty lobby shows the replenisher message at 390", async ({ page }) => {
    await mockApi(page, { authenticated: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/play");

    await expect(
      page.getByRole("heading", { level: 1, name: /Funded sessions/i }),
    ).toBeVisible();
    await expect(
      page.getByText("Preparing a new funded session."),
    ).toBeVisible();
    await expect(page.getByTestId("empty-lobby-message")).toHaveText(
      EMPTY_MESSAGE,
    );
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/empty-lobby-390.png`,
      fullPage: true,
    });
  });
});
