import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "phase5.deployed.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  timeout: 480_000,
  use: {
    baseURL: process.env.PHASE5_E2E_BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "deployed-chromium",
      use: {
        viewport: { width: 1280, height: 900 },
      },
    },
  ],
});
