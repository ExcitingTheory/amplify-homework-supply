import { defineConfig } from "@playwright/test";

/**
 * Playwright configuration for scripted 1080p product demo recordings.
 *
 * These are not assertions-first tests: each `*.demo.ts` file drives the app
 * through a scripted walkthrough while `demoKit.ts` records a 1920x1080
 * screencast to `test-results/demos/`.
 *
 * Prerequisites: dev server running (`npm run dev`) and seeded sandbox data
 * (`npx ampx sandbox seed`), plus the credentials in `.env.test`.
 *
 * Run:
 *   export $(cat .env.test | xargs) && npx playwright test --config=test/e2e/demos/playwright.demo.config.ts
 *   ... --grep "Instructor"   # a single video
 *   ... --headed              # watch while recording
 */
export default defineConfig({
  testDir: ".",
  testMatch: "**/*.demo.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: !!process.env.CI,
  outputDir: "../../../test-results/demos-output",
  reporter: [["list"]],
  timeout: 10 * 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: process.env.BASE_URL || "https://localhost:3000",
    ignoreHTTPSErrors: true,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    // Context options for the recorded session are set explicitly in demoKit.ts.
    video: "off",
    trace: "off",
    screenshot: "off",
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
