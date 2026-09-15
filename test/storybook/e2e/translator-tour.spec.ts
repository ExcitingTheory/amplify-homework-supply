/**
 * E2E tour test — Translator persona
 *
 * Walks through the complete translator onboarding in Storybook:
 *  - 6 translator tasks + 4 shared "all" tasks = 10 total
 *
 * Prerequisites:
 *   npm run storybook     (Storybook running at localhost:6006)
 *
 * Run:
 *   npx playwright test --config playwright.storybook.config.ts translator-tour
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

// Imported directly from the real source so this journey follows current
// story IDs and completion criteria.
const TRANSLATOR_TASKS = getTasksForPersona("translator");

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe("Translator onboarding tour", () => {
  test.beforeEach(async ({ page }) => {
    await resetOnboarding(page);
  });

  test("persona selection shows translator task list", async ({ page }) => {
    await openOnboardingPanel(page);
    await selectPersona(page, "translator");

    await expect(page.getByText(/0 of \d+ tasks completed/)).toBeVisible();

    for (const task of TRANSLATOR_TASKS.slice(0, 4)) {
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

  test("completes full translator tour — step by step", async ({ page }) => {
    await openOnboardingPanel(page);
    await selectPersona(page, "translator");

    const regularTasks = TRANSLATOR_TASKS.filter(
      (t) =>
        !t.id.startsWith("secret-") &&
        !t.id.startsWith("translator-test-rtl") &&
        !t.id.startsWith("translator-pluralization"),
    );

    for (let i = 0; i < regularTasks.length; i++) {
      await walkTaskTour(page, regularTasks[i], "translator", i + 1);
    }

    await assertAllComplete(page);
    await assertFullProgress(page);
  });
});
