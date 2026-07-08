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
  type TaskSpec,
} from "./helpers";

// ─── Instructor task catalogue ───────────────────────────────────────────────
// Mirrors ONBOARDING_TASKS for persona="instructor" plus persona="all",
// sorted by order asc. Kept inline to avoid importing browser-side modules.

const INSTRUCTOR_TASKS: TaskSpec[] = [
  // ── instructor tasks (order 1–8) ──────────────────────────────────────────
  {
    id: "instructor-setup-class",
    title: "Set Up Your First Class",
    completionCriteria: { completionSequence: ["create-section-button"] },
  },
  {
    id: "instructor-create-unit",
    title: "Create Your First Unit",
    completionCriteria: { completionSequence: ["create-unit-button"] },
  },
  {
    id: "instructor-add-quiz",
    title: "Add a Quiz Block",
    completionCriteria: { completionSequence: ["insert-button", "quiz-block"] },
  },
  {
    id: "instructor-create-vocabulary",
    title: "Add Vocabulary Words",
    completionCriteria: { completionSequence: ["add-word-button", "word-form"] },
  },
  {
    id: "instructor-create-assignment",
    title: "Assign Work to Students",
    completionCriteria: {
      completionSequence: ["unit-selector", "create-assignment-button"],
    },
  },
  {
    id: "instructor-view-grades",
    title: "View Student Grades",
    completionCriteria: { completionSequence: ["grades-tab"] },
  },
  {
    id: "instructor-use-ai-assistant",
    title: "Use AI to Generate Content",
    completionCriteria: { completionSequence: ["chat-input"] },
  },
  {
    id: "instructor-learn-shortcuts",
    title: "Master Editor Shortcuts",
    completionCriteria: { completionSequence: ["shortcuts-demo"] },
  },
  // ── "all" persona tasks (order 100–103) ───────────────────────────────────
  {
    id: "secret-keyboard-master",
    title: "👑 SECRET: Keyboard Master Challenge",
    completionCriteria: { customCheck: () => false }, // customCheck only — injected
  },
  {
    id: "secret-speed-demon",
    title: "⚡ SECRET: Speed Demon",
    completionCriteria: { customCheck: () => false },
  },
  {
    id: "secret-achievement-hunter",
    title: "🏅 SECRET: Achievement Hunter",
    completionCriteria: { customCheck: () => false },
  },
  {
    id: "secret-shortcut-evangelist",
    title: "📢 SECRET: Shortcut Evangelist",
    completionCriteria: { completionSequence: ["editor-toolbar"] },
  },
];

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
        page.locator('[data-testid="task-item"]').filter({ hasText: task.title })
      ).toBeVisible();
    }

    // Progress bar should start at 0
    const bar = page.getByRole("progressbar");
    await expect(bar).toHaveAttribute("aria-valuenow", "0");
  });

  test("completes full instructor tour — step by step", async ({ page }) => {
    await openOnboardingPanel(page);
    await selectPersona(page, "instructor");

    // Walk through every task in order, asserting progress after each one
    for (let i = 0; i < INSTRUCTOR_TASKS.length; i++) {
      await walkTaskTour(page, INSTRUCTOR_TASKS[i], "instructor", i + 1);
    }

    // Final state: all done
    await assertAllComplete(page);
    await assertFullProgress(page);
  });
});
