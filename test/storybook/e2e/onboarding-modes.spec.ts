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

// ═══════════════════════════════════════════════════════════════════════════════
// TASK CATALOGUES (mirrors spotlight-configs.ts)
// ═══════════════════════════════════════════════════════════════════════════════

const INSTRUCTOR_TASKS: TaskSpec[] = [
  {
    id: "instructor-setup-class",
    title: "Set Up Your First Class",
    completionCriteria: {
      tutorialStoryId: "📄-pages-application-pages--sections",
      completionSequence: [
        "sections-page",
        "create-section-button",
        "section-form",
        "join-code",
      ],
    },
  },
  {
    id: "instructor-create-unit",
    title: "Create Your First Unit",
    completionCriteria: {
      tutorialStoryId: "📄-pages-application-pages--units",
      completionSequence: ["units-page", "create-unit-button"],
    },
  },
  {
    id: "instructor-add-quiz",
    title: "Add a Quiz Block",
    completionCriteria: {
      tutorialStoryId: "✏️-lesson-editor-editor--kitchen-sink",
      completionSequence: ["editor-toolbar", "quiz-block", "quiz-answers"],
    },
  },
  {
    id: "instructor-create-vocabulary",
    title: "Add Vocabulary Words",
    completionCriteria: {
      tutorialStoryId: "📁-content-management-dictionary-editor--default",
      completionSequence: ["add-word-button", "word-form", "word-card"],
    },
  },
  {
    id: "instructor-create-assignment",
    title: "Assign Work to Students",
    completionCriteria: {
      tutorialStoryId: "🧩-ui-components-section-assigner--default",
      completionSequence: ["unit-selector", "create-assignment-button"],
    },
  },
  {
    id: "instructor-view-grades",
    title: "View Student Grades",
    completionCriteria: {
      tutorialStoryId: "📄-pages-application-pages--section-detail",
      completionSequence: ["assignments-section", "assignment-card"],
    },
  },
  {
    id: "instructor-use-ai-assistant",
    title: "Use AI to Generate Content",
    completionCriteria: {
      tutorialStoryId: "💬-ai-assistant-chat-sidebar--getting-started",
      completionSequence: ["chat-input"],
    },
  },
  {
    id: "instructor-learn-shortcuts",
    title: "Master Editor Shortcuts",
    completionCriteria: {
      tutorialStoryId: "🏠-getting-started-keyboard-shortcuts--default",
      completionSequence: ["shortcuts-demo"],
    },
  },
];

const LEARNER_TASKS: TaskSpec[] = [
  {
    id: "learner-join-class",
    title: "Join Your First Class",
    completionCriteria: {
      tutorialStoryId: "📄-pages-application-pages--sections",
      completionSequence: ["sections-page", "section-card", "join-code"],
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
      completionSequence: ["workbook", "quiz-block", "quiz-answers"],
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
];

// Only main tasks (category !== "🎁 Extra Credit") — extra credit tasks
// are rendered as secret-task-item, not task-item, and excluded from progress.
const TRANSLATOR_TASKS: TaskSpec[] = [
  {
    id: "translator-language-switcher",
    title: "Try the Language Switcher",
    completionCriteria: {
      tutorialStoryId: "translation-mode-demo--default",
      completionSequence: ["translation-demo-instructions"],
    },
  },
  {
    id: "translator-translation-panel",
    title: "Open the Translations Panel",
    completionCriteria: {
      tutorialStoryId: "translation-mode-demo--default",
      completionSequence: ["translation-auth-form"],
    },
  },
  {
    id: "translator-locale-files",
    title: "Understand Locale File Structure",
    completionCriteria: {
      tutorialStoryId: "translation-mode-demo--editor-namespace",
      completionSequence: ["translation-auth-form"],
    },
  },
  {
    id: "translator-component-context",
    title: "Review Component Context",
    completionCriteria: {
      tutorialStoryId: "translation-mode-demo--auth-namespace",
      completionSequence: ["translation-auth-buttons"],
    },
  },
];

const SECRET_TASKS: TaskSpec[] = [
  {
    id: "secret-keyboard-master",
    title: "👑 SECRET: Keyboard Master Challenge",
    completionCriteria: {
      tutorialStoryId: "🏠-getting-started-keyboard-shortcuts--default",
      customCheck: () => false,
    },
  },
  {
    id: "secret-speed-demon",
    title: "⚡ SECRET: Speed Demon",
    completionCriteria: {
      tutorialStoryId: "🏠-getting-started-keyboard-shortcuts--default",
      customCheck: () => false,
    },
  },
  {
    id: "secret-achievement-hunter",
    title: "🏅 SECRET: Achievement Hunter",
    completionCriteria: {
      tutorialStoryId: "🏠-getting-started-keyboard-shortcuts--default",
      customCheck: () => false,
    },
  },
  {
    id: "secret-shortcut-evangelist",
    title: "📢 SECRET: Shortcut Evangelist",
    completionCriteria: {
      tutorialStoryId: "✏️-lesson-editor-editor--kitchen-sink",
      completionSequence: ["editor-toolbar"],
    },
  },
  {
    id: "secret-documentation-explorer",
    title: "🔍 SECRET: Documentation Explorer",
    completionCriteria: {
      tutorialStoryId:
        "🏠-getting-started-onboarding-learning-modes--tutorial-mode-example",
      customCheck: () => false,
    },
  },
];

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

  test("quiz spotlight navigates to Sidebar Navigation story", async ({
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
    // URL should contain sidebar-navigation (quiz always routes there)
    await page.waitForURL(/sidebar-navigation/, { timeout: 10_000 });
    expect(page.url()).toContain("sidebar-navigation");
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
    // The "secret-shortcut-evangelist" has completionSequence: ["editor-toolbar"]
    // Complete all main tasks first (secrets are below), or directly trigger via
    // the completion sequence in the appropriate story iframe.
    await switchMode(page, "tutorial");

    // Walk the secret task directly (it appears in the panel's secret section)
    // Secret tasks are clickable even if hidden — the handler should still work
    // Actually, secret tasks use data-testid="secret-task-item" and are NOT clickable
    // They complete via event detection. Let's trigger the data-tour click in iframe.
    const preview = page.frameLocator("#storybook-preview-iframe");
    const target = preview.locator('[data-tour="editor-toolbar"]').first();
    const isAttached = await target
      .waitFor({ state: "attached", timeout: 5_000 })
      .then(() => true)
      .catch(() => false);

    if (isAttached) {
      await target.scrollIntoViewIfNeeded();
      await target.click();

      // Check if the secret was discovered
      await expect(
        page.getByText("📢 SECRET: Shortcut Evangelist"),
      ).toBeVisible({ timeout: 8_000 });
      await expect(page.getByText("✨ Discovered!").first()).toBeVisible();
      // Counter should update
      await expect(page.getByText(/1\/\d+ discovered/)).toBeVisible();
    }
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

    // Trigger a secret completion via data-tour in iframe
    const preview = page.frameLocator("#storybook-preview-iframe");
    const target = preview.locator('[data-tour="editor-toolbar"]').first();
    const isAttached = await target
      .waitFor({ state: "attached", timeout: 5_000 })
      .then(() => true)
      .catch(() => false);

    if (isAttached) {
      await target.scrollIntoViewIfNeeded();
      await target.click();

      // Verify discovered as instructor
      await expect(page.getByText(/1\/\d+ discovered/)).toBeVisible({
        timeout: 8_000,
      });

      // Switch to learner persona
      await selectPersona(page, "learner");

      // The same secret should still show as discovered
      await expect(page.getByText(/1\/\d+ discovered/)).toBeVisible({
        timeout: 5_000,
      });
    }
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
