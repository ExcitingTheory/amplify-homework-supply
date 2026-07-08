import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for Storybook onboarding E2E tests.
 *
 * These tests open a running Storybook instance and walk through the full
 * onboarding tour for each persona (instructor, learner, translator).
 * They verify that:
 *  - Selecting a persona shows the correct task list
 *  - Clicking a task opens the SpotlightOverlay tour
 *  - Navigating through tour steps (Start → Next… → Done) works
 *  - The story page navigation happens inside the preview iframe
 *  - Clicking the required data-tour element(s) marks the task complete
 *  - The task title gets a strikethrough and the checkbox is checked
 *  - The progress bar and counter advance after each task
 *  - After all tasks: "All tasks completed!" is shown
 *
 * Run:
 *   npx playwright test --config playwright.storybook.config.ts
 *   npx playwright test --config playwright.storybook.config.ts --ui
 *
 * Prerequisite: Storybook must be running at http://localhost:6006
 *   npm run storybook
 */
export default defineConfig({
  testDir: "./test/storybook/e2e",
  fullyParallel: false, // tests share localStorage state — run sequentially
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ["html", { open: "never", outputFolder: "test/storybook/e2e-report" }],
    ["list"],
  ],
  timeout: 180_000, // 3 min per test — full tour can be slow
  expect: {
    timeout: 15_000,
  },
  use: {
    baseURL: process.env.STORYBOOK_URL || "http://localhost:6006",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 20_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
