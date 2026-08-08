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
  type TaskSpec,
} from "./helpers";

// ─── Learner task catalogue ──────────────────────────────────────────────────
// Mirrors ONBOARDING_TASKS for persona="learner" plus persona="all",
// sorted by order asc.

const LEARNER_TASKS: TaskSpec[] = [
  // ── learner tasks (order 1–7) ─────────────────────────────────────────────
  {
    id: "learner-join-class",
    title: "Join Your First Class",
    completionCriteria: {
      tutorialStoryId: "📄-pages-application-pages--sections",
      completionSequence: ["sections-page", "section-card"],
    },
  },
  {
    id: "learner-view-assignments",
    title: "View Your Assignments",
    completionCriteria: {
      tutorialStoryId: "📄-pages-application-pages--section-detail",
      completionSequence: ["assignment-card", "view-workbook-button"],
    },
  },
  {
    id: "learner-complete-assignment",
    title: "Complete an Assignment",
    completionCriteria: {
      tutorialStoryId: "✏️-lesson-editor-workbook--kitchen-sink",
      completionSequence: ["quiz-block", "quiz-answers"],
    },
  },
  {
    id: "learner-review-feedback",
    title: "Review Your Feedback",
    completionCriteria: {
      tutorialStoryId: "📄-pages-application-pages--section-detail",
      completionSequence: ["assignments-section", "assignment-card"],
    },
  },
  {
    id: "learner-practice-vocabulary",
    title: "Practice Vocabulary",
    completionCriteria: {
      tutorialStoryId: "📁-content-management-vocabulary-review--default",
      completionSequence: ["word-card"],
    },
  },
  {
    id: "learner-use-chat-help",
    title: "Get Help from AI Assistant",
    completionCriteria: {
      tutorialStoryId: "💬-ai-assistant-chat-sidebar--getting-started",
      completionSequence: ["chat-input"],
    },
  },
  {
    id: "learner-learn-shortcuts",
    title: "Learn Helpful Shortcuts",
    completionCriteria: {
      tutorialStoryId: "🏠-getting-started-keyboard-shortcuts--default",
      completionSequence: ["shortcuts-demo"],
    },
  },
  // ── "all" persona tasks (order 100–103) ───────────────────────────────────
  {
    id: "secret-keyboard-master",
    title: "👑 SECRET: Keyboard Master Challenge",
    completionCriteria: { customCheck: () => false },
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
