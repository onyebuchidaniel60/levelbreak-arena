import { expect, test, type Page } from "@playwright/test";

const RUN_ID = "11111111-1111-4111-8111-111111111111";
const TX_HASH =
  "da6464fcd931429249bcafa89ebc0dbebcf098c29e43de40fb6b3b9f95d99575";
const REPO = "https://github.com/onyebuchidaniel60/levelbreak-arena";

async function mockApi(page: Page) {
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const json = (body: unknown) =>
      route.fulfill({
        status: 200,
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
    if (path === "/api/me") {
      return json({
        player: { address: "NQ34 5NGM LJFD RFMN 5H4R 7AMX SU7L KA68 BXPV" },
        activeRunId: null,
      });
    }
    if (path === "/api/history") {
      return json({
        items: [
          {
            runId: RUN_ID,
            publicRef: "b88d21098b76a471",
            state: "PAYOUT_CONFIRMED",
            levelIndex: 5,
            earnedLuna: "2000",
            payoutId: "22222222-2222-4222-8222-222222222222",
            payoutStatus: "CONFIRMED",
            payoutAmountLuna: "2000",
            txHash: TX_HASH,
            createdAt: "2026-11-08T18:52:00.000Z",
            completedAt: "2026-11-08T18:52:00.000Z",
          },
        ],
        nextCursor: null,
      });
    }
    if (path === `/api/runs/${RUN_ID}/payout`) {
      return json({
        payoutId: "22222222-2222-4222-8222-222222222222",
        status: "CONFIRMED",
        amountLuna: "2000",
        txHash: TX_HASH,
        explorerUrl: `https://test.nimiq.watch/#${TX_HASH}`,
      });
    }
    return route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({
        error: { code: "NOT_FOUND", message: "Not found.", requestId: "phase8-polish" },
      }),
    });
  });
}

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

test("history shows the confirmed 2,000 Luna run without 320px overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/history", { waitUntil: "networkidle" });

  await expect(page.getByRole("heading", { name: /Your runs/i })).toBeVisible();
  await expect(page.getByText("b88d21098b76a471")).toBeVisible();
  await expect(page.getByText("2,000 Luna")).toBeVisible();
  await expect(page.getByText("Payout confirmed")).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);
});

test("footer has the real documentation and public GitHub links", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });

  const docs = page.getByRole("link", { name: "Documentation" });
  await expect(docs).toHaveAttribute("href", "/docs");

  const github = page.getByRole("link", { name: "GitHub" });
  await expect(github).toHaveAttribute("href", REPO);
  await expect(github).toHaveAttribute("target", "_blank");
  await expect(github).toHaveAttribute("rel", "noreferrer");
});

test("docs, privacy and terms state the five-level / LLM / agent / demo off-ramp model", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });

  await page.goto("/docs", { waitUntil: "networkidle" });
  await expect(
    page.getByText("Phase 10 — External Agent marketplace."),
  ).toBeVisible();
  await expect(
    page.getByText(/External agents can now register/i),
  ).toBeVisible();
  await expect(
    page.getByText(/verified funding or a reserved agent balance/i),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /GitHub repository/i }),
  ).toHaveAttribute("href", REPO);

  await page.goto("/privacy", { waitUntil: "networkidle" });
  await expect(
    page.getByText(/What may be sent to the LLM provider/i),
  ).toBeVisible();
  await expect(page.getByText(/fiat off-ramp modal is a local demonstration/i)).toBeVisible();

  await page.goto("/terms", { waitUntil: "networkidle" });
  await expect(
    page.getByRole("heading", { name: /Five accepted responses, 2,500 Luna maximum/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /No fiat transfer occurs/i }),
  ).toBeVisible();
  await expect(
    page.getByText(/LLM-assisted with a scripted fallback/i),
  ).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);
});
