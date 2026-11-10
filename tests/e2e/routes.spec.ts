import { expect, test } from "@playwright/test";

const routes = [
  { path: "/", heading: /The AI Agent Economy Needs Your Judgment/i },
  { path: "/play", heading: /Sign in to see active missions/i },
  { path: "/play/example-run-id", heading: /Run not found/i },
  { path: "/agents", heading: /The agent directory/i },
  { path: "/history", heading: /Your runs/i },
  { path: "/how-it-works", heading: /A five-level DeFi judgment game/i },
  { path: "/privacy", heading: /A short privacy notice/i },
  { path: "/terms", heading: /Testnet demo terms/i },
  { path: "/docs", heading: /The Agent Economy, documented/i },
  { path: "/route-that-does-not-exist", heading: /This route is not in the arena/i },
] as const;

test.beforeEach(async ({ page }) => {
  await page.route("**/api/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === "/api/config/public") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          productName: "LevelBreak Arena",
          networkLabel: "Nimiq Testnet",
          rewardPerAnswerLuna: "500",
          maxConsultations: 5,
          demoMode: true,
        }),
      });
      return;
    }
    if (pathname === "/api/me" || pathname === "/api/history") {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication is required.",
            requestId: "route-smoke",
          },
        }),
      });
      return;
    }
    if (pathname.startsWith("/api/runs/")) {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({
          error: {
            code: "NOT_FOUND",
            message: "Run not found.",
            requestId: "route-smoke",
          },
        }),
      });
      return;
    }
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication is required.",
          requestId: "route-smoke",
        },
      }),
    });
  });
});

for (const route of routes) {
  test(`${route.path} renders with a page heading and no horizontal overflow`, async ({ page }) => {
    const response = await page.goto(route.path);

    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1, name: route.heading })).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );

    expect(hasHorizontalOverflow).toBe(false);
  });
}
