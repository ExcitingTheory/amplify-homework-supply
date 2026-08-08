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
  type TaskSpec,
} from "./helpers";

// ─── Translator task catalogue ───────────────────────────────────────────────
// Mirrors ONBOARDING_TASKS for persona="translator" plus persona="all",
// sorted by order asc.

const TRANSLATOR_TASKS: TaskSpec[] = [
  // ── translator tasks (order 1–5, + extra credit 101–102) ─────────────────
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
  {
    id: "translator-test-rtl",
    title: "Test RTL Language Support",
    completionCriteria: {
      tutorialStoryId: "translation-mode-demo--default",
      completionSequence: ["translation-auth-buttons"],
    },
  },
  {
    id: "translator-pluralization",
    title: "Review Pluralization Rules",
    completionCriteria: {
      tutorialStoryId: "translation-mode-demo--default",
      completionSequence: ["translation-password-reset"],
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
