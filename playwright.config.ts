import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for multi-user collaboration E2E tests.
 *
 * These tests use multiple BrowserContexts to simulate simultaneous users —
 * something Cypress fundamentally cannot do. Each test can have an instructor
 * and a student (or two students) interacting with the app at the same time,
 * verifying real-time collaboration features like Yjs sync, presence, and chat.
 *
 * Run:
 *   npx playwright test                           # all collaboration tests
 *   npx playwright test --grep "Section Join"      # specific suite
 *   npx playwright test --ui                       # interactive UI mode
 */
export default defineConfig({
  testDir: "./test/e2e-collaboration",
  fullyParallel: false, // Tests share state within a file — run sequentially
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1, // Multi-user tests must be sequential (shared backend state)
  reporter: [
    ["html", { open: "never", outputFolder: "test/e2e-collaboration-report" }],
    ["list"],
  ],
  timeout: 120_000, // 2 min per test — collaboration flows are slow
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
  /* Do not start the dev server — assume it's already running */
});
