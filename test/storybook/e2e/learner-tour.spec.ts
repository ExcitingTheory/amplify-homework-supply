/**
 * E2E tour test — Learner persona
 *
 * Walks through the complete learner onboarding in Storybook:
 *  - 7 learner tasks + 4 shared "all" tasks = 11 total
 *
 * Prerequisites:
 *   npm run storybook     (Storybook running at localhost:6006)
 *
 * Run:
 *   npx playwright test --config playwright.storybook.config.ts learner-tour
 */

import { test, expect } from "@playwright/test";
import {
  resetOnboarding,
  openOnboardingPanel,
  selectPersona,
  walkTaskTour,
  assertAllComplete,
  assertFullProgress,
} from "./helpers";
import { getTasksForPersona } from "../../../.storybook/code/onboarding-tasks";

// Imported directly from the real source (not hand-duplicated) so this test
// can never silently drift from the actual app's onboarding config.
const LEARNER_TASKS = getTasksForPersona("learner");

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe("Learner onboarding tour", () => {
  test.beforeEach(async ({ page }) => {
    await resetOnboarding(page);
  });

  test("persona selection shows learner task list", async ({ page }) => {
    await openOnboardingPanel(page);
    await selectPersona(page, "learner");

    await expect(page.getByText(/0 of \d+ tasks completed/)).toBeVisible();

    for (const task of LEARNER_TASKS.slice(0, 4)) {
      await expect(
        page
          .locator('[data-testid="task-item"]')
          .filter({ hasText: task.title }),
      ).toBeVisible();
    }

    const panel = page.locator('[data-testid="onboarding-panel"]');
    const bar = panel.getByRole("progressbar");
    await expect(bar).toHaveAttribute("aria-valuenow", "0");
  });

  test("completes full learner tour — step by step", async ({ page }) => {
    await openOnboardingPanel(page);
    await selectPersona(page, "learner");

    // Secret tasks render as data-testid="secret-task-item" (not clickable) —
    // only walk regular tasks which use data-testid="task-item"
    const regularTasks = LEARNER_TASKS.filter(
      (t) => !t.id.startsWith("secret-"),
    );

    for (let i = 0; i < regularTasks.length; i++) {
      await walkTaskTour(page, regularTasks[i], "learner", i + 1);
    }

    await assertAllComplete(page);
    await assertFullProgress(page);
  });
});
