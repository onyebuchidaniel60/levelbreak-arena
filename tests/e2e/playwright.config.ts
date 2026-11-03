import { defineConfig } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 4310);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: ".",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL,
  },
  projects: [
    {
      name: "mobile-320",
      use: {
        viewport: { width: 320, height: 800 },
      },
    },
    {
      name: "desktop-1280",
      use: {
        viewport: { width: 1280, height: 800 },
      },
    },
  ],
  webServer: {
    command: `pnpm --filter @levelbreak-arena/web exec vite --host 127.0.0.1 --port ${port} --strictPort`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
