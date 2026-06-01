import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for single-user E2E tests.
 *
 * These tests cover individual user journeys (auth, editor, settings, etc.)
 * that don't require multiple simultaneous browser contexts.
 *
 * Run:
 *   npx playwright test --config=e2e/playwright.config.ts
 *   npx playwright test --config=e2e/playwright.config.ts --grep "Auth"
 *   npx playwright test --config=e2e/playwright.config.ts --ui
 */
export default defineConfig({
  testDir: ".",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 4,
  outputDir: "../test-results/e2e-output",
  reporter: [
    ["html", { open: "never", outputFolder: "../e2e-report" }],
    ["list"],
  ],
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: process.env.BASE_URL || "https://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
