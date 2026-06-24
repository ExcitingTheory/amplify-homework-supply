import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for User Journey E2E tests.
 *
 * These are end-to-end happy-path tests that trace complete user flows
 * through the application. They require seed data (run `npx ampx sandbox seed`
 * first) and a running dev server.
 *
 * Run:
 *   npx playwright test --config=test/e2e/journeys/playwright.config.ts
 *   npx playwright test --config=test/e2e/journeys/playwright.config.ts --grep "Learner"
 *   npx playwright test --config=test/e2e/journeys/playwright.config.ts --ui
 */
export default defineConfig({
  testDir: ".",
  fullyParallel: false, // Journeys may share seed data state
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  outputDir: "../../test-results/journeys-output",
  reporter: [
    ["html", { open: "never", outputFolder: "../../journeys-report" }],
    ["list"],
  ],
  timeout: 120_000, // 2 min per test — journeys cover multiple steps
  expect: {
    timeout: 15_000,
  },
  use: {
    baseURL: process.env.BASE_URL || "https://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
