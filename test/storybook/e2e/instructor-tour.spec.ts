/**
 * E2E tour test — Instructor persona
 *
 * Walks through the complete instructor onboarding in Storybook:
 *  - 8 instructor tasks + 4 shared "all" tasks = 12 total
 *
 * Prerequisites:
 *   npm run storybook     (Storybook running at localhost:6006)
 *
 * Run:
 *   npx playwright test --config playwright.storybook.config.ts instructor-tour
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
const INSTRUCTOR_TASKS = getTasksForPersona("instructor");

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe("Instructor onboarding tour", () => {
  test.beforeEach(async ({ page }) => {
    await resetOnboarding(page);
  });

  test("persona selection shows instructor task list", async ({ page }) => {
    await openOnboardingPanel(page);
    await selectPersona(page, "instructor");

    // Should show 0 completed out of the full task count
    await expect(page.getByText(/0 of \d+ tasks completed/)).toBeVisible();

    // All task cards should be visible (at least the first few)
    for (const task of INSTRUCTOR_TASKS.slice(0, 4)) {
      await expect(
        page
          .locator('[data-testid="task-item"]')
          .filter({ hasText: task.title }),
      ).toBeVisible();
    }

    // Progress bar should start at 0
    const panel = page.locator('[data-testid="onboarding-panel"]');
    const bar = panel.getByRole("progressbar");
    await expect(bar).toHaveAttribute("aria-valuenow", "0");
  });

  test("completes full instructor tour — step by step", async ({ page }) => {
    await openOnboardingPanel(page);
    await selectPersona(page, "instructor");

    // Secret tasks render as data-testid="secret-task-item" (not clickable) —
    // only walk regular tasks which use data-testid="task-item"
    const regularTasks = INSTRUCTOR_TASKS.filter(
      (t) => !t.id.startsWith("secret-"),
    );

    for (let i = 0; i < regularTasks.length; i++) {
      await walkTaskTour(page, regularTasks[i], "instructor", i + 1);
    }

    // Final state: all regular tasks done
    await assertAllComplete(page);
    await assertFullProgress(page);
  });
});
