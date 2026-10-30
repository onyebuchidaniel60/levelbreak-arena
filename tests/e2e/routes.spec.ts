import { expect, test } from "@playwright/test";

const routes = [
  { path: "/", heading: /LevelBreak Arena/i },
  { path: "/play", heading: /Lobby/i },
  { path: "/play/example-run-id", heading: /Game session/i },
  { path: "/history", heading: /History/i },
  { path: "/how-it-works", heading: /How it works/i },
  { path: "/privacy", heading: /Privacy/i },
  { path: "/terms", heading: /Terms and risk disclosure/i },
  { path: "/docs", heading: /Documentation/i },
  { path: "/route-that-does-not-exist", heading: /Page not found/i },
] as const;

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
