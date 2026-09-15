/**
 * E2E tests — Onboarding quiz / tutorial / extra-credit full tours
 *
 * Exercises every configured onboarding task in both quiz and tutorial modes
 * for all personas (instructor, learner, translator). Completion is event-driven
 * in BOTH modes — clicking data-tour attributes in the correct order.
 *
 * Also covers:
 * - Mode switching UI
 * - Extra Credit / Secret Achievements discovery
 * - Quiz-specific routing (Sidebar Navigation)
 * - Tutorial-specific overlay (scrim + multi-step)
 *
 * Prerequisites:
 *   npm run storybook     (Storybook running at localhost:6006)
 *
 * Run:
 *   npx playwright test --config playwright.storybook.config.ts onboarding-modes
 */

import { test, expect } from "@playwright/test";
import {
  resetOnboarding,
  openOnboardingPanel,
  selectPersona,
  switchMode,
  walkTaskTour,
  walkQuizTaskTour,
  assertAllComplete,
  assertFullProgress,
  type TaskSpec,
  type Persona,
  type OnboardingMode,
} from "./helpers";
import { getTasksForPersona } from "../../../.storybook/code/onboarding-tasks";

const INSTRUCTOR_TASKS = getTasksForPersona("instructor").filter(
  (task) => !task.id.startsWith("secret-"),
);
const LEARNER_TASKS = getTasksForPersona("learner").filter(
  (task) => !task.id.startsWith("secret-"),
);
const TRANSLATOR_TASKS = getTasksForPersona("translator").filter(
  (task) => !task.id.startsWith("secret-"),
);
const SECRET_TASKS = getTasksForPersona("instructor").filter((task) =>
  task.id.startsWith("secret-"),
);

// ═══════════════════════════════════════════════════════════════════════════════
// MODE SWITCHING
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("Mode switching", () => {
  test.beforeEach(async ({ page }) => {
    await resetOnboarding(page);
    await openOnboardingPanel(page);
    await selectPersona(page, "instructor");
  });

  test("defaults to tutorial mode", async ({ page }) => {
    await expect(page.getByText("📖 Tutorial Mode")).toBeVisible();
  });

  test("can switch to quiz mode", async ({ page }) => {
    await switchMode(page, "quiz");
    await expect(page.getByText("🎯 Quiz Mode Active")).toBeVisible();
  });

  test("can switch back to tutorial mode from quiz", async ({ page }) => {
    await switchMode(page, "quiz");
    await switchMode(page, "tutorial");
    await expect(page.getByText("📖 Tutorial Mode")).toBeVisible();
    await expect(page.getByText("🎯 Quiz Mode Active")).not.toBeVisible();
  });

  test("mode persists after task spotlight dismissal", async ({ page }) => {
    await switchMode(page, "quiz");
    // Click a task to open spotlight
    const taskCard = page
      .locator('[data-testid="task-item"]')
      .filter({ hasText: INSTRUCTOR_TASKS[0].title });
    await taskCard.click();
    const overlay = page.locator('[data-testid="spotlight-tooltip"]');
    await expect(overlay.locator("text=/Step 1 of \\d+/")).toBeVisible({
      timeout: 10_000,
    });
    // Dismiss
    await overlay.getByRole("button", { name: "Done" }).click();
    // Mode should still be quiz
    await expect(page.getByText("🎯 Quiz Mode Active")).toBeVisible({
      timeout: 8_000,
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TUTORIAL MODE — FULL TOURS (event-driven completion via data-tour clicks)
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("Tutorial mode — Instructor full tour", () => {
  test.beforeEach(async ({ page }) => {
    await resetOnboarding(page);
    await openOnboardingPanel(page);
    await selectPersona(page, "instructor");
    await switchMode(page, "tutorial");
  });

  test("completes all instructor tasks in tutorial mode", async ({ page }) => {
    for (let i = 0; i < INSTRUCTOR_TASKS.length; i++) {
      await walkTaskTour(page, INSTRUCTOR_TASKS[i], "instructor", i + 1);
    }
    // Secret tasks use data-testid="secret-task-item" (not clickable cards)
    // and don't count in the main progress counter — skip them here
    await assertAllComplete(page);
    await assertFullProgress(page);
  });
});

test.describe("Tutorial mode — Learner full tour", () => {
  test.beforeEach(async ({ page }) => {
    await resetOnboarding(page);
    await openOnboardingPanel(page);
    await selectPersona(page, "learner");
    await switchMode(page, "tutorial");
  });

  test("completes all learner tasks in tutorial mode", async ({ page }) => {
    for (let i = 0; i < LEARNER_TASKS.length; i++) {
      await walkTaskTour(page, LEARNER_TASKS[i], "learner", i + 1);
    }
    await assertAllComplete(page);
    await assertFullProgress(page);
  });
});

test.describe("Tutorial mode — Translator full tour", () => {
  test.beforeEach(async ({ page }) => {
    await resetOnboarding(page);
    await openOnboardingPanel(page);
    await selectPersona(page, "translator");
    await switchMode(page, "tutorial");
  });

  test("completes all translator tasks in tutorial mode", async ({ page }) => {
    for (let i = 0; i < TRANSLATOR_TASKS.length; i++) {
      await walkTaskTour(page, TRANSLATOR_TASKS[i], "translator", i + 1);
    }
    await assertAllComplete(page);
    await assertFullProgress(page);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// QUIZ MODE — FULL TOURS (event-driven completion via data-tour clicks)
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("Quiz mode — Instructor full tour", () => {
  test.beforeEach(async ({ page }) => {
    await resetOnboarding(page);
    await openOnboardingPanel(page);
    await selectPersona(page, "instructor");
    await switchMode(page, "quiz");
  });

  test("quiz banner is visible", async ({ page }) => {
    await expect(page.getByText("🎯 Quiz Mode Active")).toBeVisible();
    await expect(
      page.getByText(/Click a task to open Sidebar Navigation/),
    ).toBeVisible();
  });

  test("completes all instructor tasks in quiz mode", async ({ page }) => {
    for (let i = 0; i < INSTRUCTOR_TASKS.length; i++) {
      await walkQuizTaskTour(page, INSTRUCTOR_TASKS[i], "instructor", i + 1);
    }
    await assertAllComplete(page);
    await assertFullProgress(page);
  });

  test("quiz spotlight navigates to the task's configured story", async ({
    page,
  }) => {
    const taskCard = page
      .locator('[data-testid="task-item"]')
      .filter({ hasText: INSTRUCTOR_TASKS[0].title });
    await taskCard.click();
    const overlay = page.locator('[data-testid="spotlight-tooltip"]');
    await expect(overlay.locator("text=/Step 1 of \\d+/")).toBeVisible({
      timeout: 10_000,
    });
    const storyId = INSTRUCTOR_TASKS[0].completionCriteria?.quizStoryId;
    expect(storyId).toBeTruthy();
    await expect(page).toHaveURL(new RegExp(encodeURIComponent(storyId!)));
  });

  test("quiz spotlight shows quiz badge", async ({ page }) => {
    const taskCard = page
      .locator('[data-testid="task-item"]')
      .filter({ hasText: INSTRUCTOR_TASKS[0].title });
    await taskCard.click();
    const overlay = page.locator('[data-testid="spotlight-tooltip"]');
    await expect(overlay.locator("text=/Step 1 of \\d+/")).toBeVisible({
      timeout: 10_000,
    });
    // The quiz badge shows "🎯 Quiz • Step X of Y" inside the spotlight
    await expect(overlay.getByText(/🎯 Quiz/)).toBeVisible();
  });

  test("quiz mode has no self-report verify step", async ({ page }) => {
    const taskCard = page
      .locator('[data-testid="task-item"]')
      .filter({ hasText: INSTRUCTOR_TASKS[0].title });
    await taskCard.click();
    const overlay = page.locator('[data-testid="spotlight-tooltip"]');
    await expect(overlay.locator("text=/Step 1 of \\d+/")).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      page.getByText(/did you complete|mark as done|self-report/i),
    ).not.toBeVisible();
  });

  test("completed task is skipped when clicked in quiz mode", async ({
    page,
  }) => {
    // Complete the first task
    await walkQuizTaskTour(page, INSTRUCTOR_TASKS[0], "instructor", 1);
    // Try clicking it again
    const taskCard = page
      .locator('[data-testid="task-item"]')
      .filter({ hasText: INSTRUCTOR_TASKS[0].title });
    await taskCard.click();
    // Spotlight should NOT re-open
    const overlay = page.locator('[data-testid="spotlight-tooltip"]');
    await expect(overlay.locator("text=/Step 1 of \\d+/")).not.toBeVisible({
      timeout: 3_000,
    });
  });
});

test.describe("Quiz mode — Learner full tour", () => {
  test.beforeEach(async ({ page }) => {
    await resetOnboarding(page);
    await openOnboardingPanel(page);
    await selectPersona(page, "learner");
    await switchMode(page, "quiz");
  });

  test("completes all learner tasks in quiz mode", async ({ page }) => {
    for (let i = 0; i < LEARNER_TASKS.length; i++) {
      await walkQuizTaskTour(page, LEARNER_TASKS[i], "learner", i + 1);
    }
    await assertAllComplete(page);
    await assertFullProgress(page);
  });
});

test.describe("Quiz mode — Translator full tour", () => {
  test.beforeEach(async ({ page }) => {
    await resetOnboarding(page);
    await openOnboardingPanel(page);
    await selectPersona(page, "translator");
    await switchMode(page, "quiz");
  });

  test("completes all translator tasks in quiz mode", async ({ page }) => {
    for (let i = 0; i < TRANSLATOR_TASKS.length; i++) {
      await walkQuizTaskTour(page, TRANSLATOR_TASKS[i], "translator", i + 1);
    }
    await assertAllComplete(page);
    await assertFullProgress(page);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXTRA CREDIT / SECRET ACHIEVEMENTS
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("Extra Credit / Secret Achievements", () => {
  test.beforeEach(async ({ page }) => {
    await resetOnboarding(page);
    await openOnboardingPanel(page);
    await selectPersona(page, "instructor");
  });

  test("secret achievements section is visible", async ({ page }) => {
    await expect(page.getByText(/🎁 Secret Achievements/)).toBeVisible();
  });

  test("undiscovered secrets show locked placeholder", async ({ page }) => {
    await expect(page.getByText("🔒 Secret Achievement").first()).toBeVisible();
    // Actual titles should NOT be visible before discovery
    for (const task of SECRET_TASKS) {
      await expect(page.getByText(task.title)).not.toBeVisible();
    }
  });

  test("secret tasks have distinct data-testid", async ({ page }) => {
    const secretItems = page.locator('[data-testid="secret-task-item"]');
    const count = await secretItems.count();
    expect(count).toBe(SECRET_TASKS.length);
  });

  test("secret discovery counter starts at 0", async ({ page }) => {
    await expect(page.getByText(/0\/\d+ discovered/)).toBeVisible();
  });

  test("secrets are not counted in main progress bar", async ({ page }) => {
    // Progress bar starts at 0 with N main tasks
    const panel = page.locator('[data-testid="onboarding-panel"]');
    const bar = panel.getByRole("progressbar");
    await expect(bar).toHaveAttribute("aria-valuenow", "0");

    // Complete one main task via quiz mode (fast — single step)
    await switchMode(page, "quiz");
    await walkQuizTaskTour(page, INSTRUCTOR_TASKS[0], "instructor", 1);

    // Progress should reflect 1 / (main task count) — not including secrets
    const value = await bar.getAttribute("aria-valuenow");
    const pct = parseInt(value ?? "0", 10);
    // With 8 instructor tasks, 1 complete = ~12-13%
    expect(pct).toBeGreaterThan(0);
    expect(pct).toBeLessThan(20);
  });

  test("completing a secret via data-tour reveals title and chip", async ({
    page,
  }) => {
    // The secret's configured completion target lives in the editor story.
    // Navigate there in the real browser, then perform the actual toolbar click.
    await switchMode(page, "tutorial");
    await page.goto("/?path=/story/✏️-lesson-editor-editor--kitchen-sink", {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await page.waitForSelector("#storybook-preview-iframe", {
      timeout: 15_000,
    });
    const preview = page.frameLocator("#storybook-preview-iframe");
    const target = preview.locator('[data-tour="editor-toolbar"]').first();
    await expect(target).toBeAttached({ timeout: 15_000 });
    await target.scrollIntoViewIfNeeded();
    await target.click();

    await expect(page.getByText("📢 SECRET: Shortcut Evangelist")).toBeVisible({
      timeout: 8_000,
    });
    await expect(page.getByText("✨ Discovered!").first()).toBeVisible();
    await expect(page.getByText(/1\/\d+ discovered/)).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// CROSS-MODE: completion persists, both modes are event-driven
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("Cross-mode event-driven completion", () => {
  test.beforeEach(async ({ page }) => {
    await resetOnboarding(page);
    await openOnboardingPanel(page);
    await selectPersona(page, "learner");
  });

  test("task completed in tutorial mode stays completed in quiz mode", async ({
    page,
  }) => {
    await switchMode(page, "tutorial");
    await walkTaskTour(page, LEARNER_TASKS[0], "learner", 1);

    // Switch to quiz mode
    await switchMode(page, "quiz");

    // Task should still be checked
    const taskCard = page
      .locator('[data-testid="task-item"]')
      .filter({ hasText: LEARNER_TASKS[0].title });
    await expect(taskCard.locator('input[type="checkbox"]')).toBeChecked();
  });

  test("task completed in quiz mode stays completed in tutorial mode", async ({
    page,
  }) => {
    await switchMode(page, "quiz");
    await walkQuizTaskTour(page, LEARNER_TASKS[0], "learner", 1);

    // Switch to tutorial mode
    await switchMode(page, "tutorial");

    // Task should still be checked
    const taskCard = page
      .locator('[data-testid="task-item"]')
      .filter({ hasText: LEARNER_TASKS[0].title });
    await expect(taskCard.locator('input[type="checkbox"]')).toBeChecked();
  });

  test("closing spotlight does NOT mark task complete in either mode", async ({
    page,
  }) => {
    // Tutorial mode — open spotlight and dismiss via Skip (no data-tour clicks)
    await switchMode(page, "tutorial");
    const taskCard = page
      .locator('[data-testid="task-item"]')
      .filter({ hasText: LEARNER_TASKS[1].title });
    await taskCard.click();
    const overlay = page.locator('[data-testid="spotlight-tooltip"]');
    await expect(overlay.locator("text=/Step 1 of \\d+/")).toBeVisible({
      timeout: 10_000,
    });
    // Dismiss via Skip — task should NOT be marked complete
    await overlay.getByRole("button", { name: "Skip" }).click();
    // Panel reopens — task should NOT be checked (no data-tour clicks happened)
    await expect(page.locator('[data-testid="task-item"]').first()).toBeVisible(
      { timeout: 10_000 },
    );
    await expect(taskCard.locator('input[type="checkbox"]')).not.toBeChecked();

    // Quiz mode — same task, dismiss via Skip
    await switchMode(page, "quiz");
    await taskCard.click();
    const overlay2 = page.locator('[data-testid="spotlight-tooltip"]');
    await expect(overlay2.locator("text=/Step 1 of \\d+/")).toBeVisible({
      timeout: 10_000,
    });
    await overlay2.getByRole("button", { name: "Skip" }).click();
    await expect(page.locator('[data-testid="task-item"]').first()).toBeVisible(
      { timeout: 10_000 },
    );
    await expect(taskCard.locator('input[type="checkbox"]')).not.toBeChecked();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// CROSS-PERSONA: secrets persist across persona switches
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("Cross-persona secret persistence", () => {
  test.beforeEach(async ({ page }) => {
    await resetOnboarding(page);
    await openOnboardingPanel(page);
  });

  test("secret discovered as instructor appears when switching to learner", async ({
    page,
  }) => {
    await selectPersona(page, "instructor");
    await switchMode(page, "tutorial");

    // Trigger a secret completion via a real click in its configured story.
    await page.goto("/?path=/story/✏️-lesson-editor-editor--kitchen-sink", {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await page.waitForSelector("#storybook-preview-iframe", {
      timeout: 15_000,
    });
    const preview = page.frameLocator("#storybook-preview-iframe");
    const target = preview.locator('[data-tour="editor-toolbar"]').first();
    await expect(target).toBeAttached({ timeout: 15_000 });
    await target.scrollIntoViewIfNeeded();
    await target.click();

    await expect(page.getByText(/1\/\d+ discovered/)).toBeVisible({
      timeout: 8_000,
    });

    await selectPersona(page, "learner");
    await expect(page.getByText(/1\/\d+ discovered/)).toBeVisible({
      timeout: 5_000,
    });
  });

  test("persona-specific completions do NOT leak across personas", async ({
    page,
  }) => {
    await selectPersona(page, "instructor");
    await switchMode(page, "quiz");

    // Complete one instructor task
    await walkQuizTaskTour(page, INSTRUCTOR_TASKS[0], "instructor", 1);

    // Verify progress for instructor
    const panel = page.locator('[data-testid="onboarding-panel"]');
    const bar = panel.getByRole("progressbar");
    const instructorValue = await bar.getAttribute("aria-valuenow");
    expect(parseInt(instructorValue ?? "0", 10)).toBeGreaterThan(0);

    // Switch to learner — progress should be 0 (no learner tasks completed)
    await selectPersona(page, "learner");
    await expect(bar).toHaveAttribute("aria-valuenow", "0");
  });
});
