/**
 * Shared helpers for Storybook onboarding E2E tests.
 *
 * Covers:
 *  - Opening/resetting the onboarding panel
 *  - Selecting a persona
 *  - Walking through a task's SpotlightOverlay tour
 *  - Triggering task completion (data-tour click or localStorage injection)
 *  - Asserting per-task and overall progress state
 */

import { Page, expect } from "@playwright/test";

// ─── Types (inline to avoid importing browser-side code) ────────────────────

export type Persona = "instructor" | "learner" | "translator";

/** Minimal task shape needed by the helpers. Matches OnboardingTaskWithCriteria. */
export interface TaskSpec {
  id: string;
  title: string;
  completionCriteria?: {
    tutorialStoryId?: string;
    quizStoryId?: string;
    completionSequence?: string[];
    customCheck?: () => boolean;
  };
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = "storybook_onboarding_progress";

// ─── Setup ───────────────────────────────────────────────────────────────────

/**
 * Navigate to Storybook and clear all onboarding progress.
 * Always call this in beforeEach.
 */
export async function resetOnboarding(page: Page): Promise<void> {
  await page.goto("/");
  await page.waitForSelector("#storybook-explorer-tree", { timeout: 20_000 });
  // Clear all localStorage to reset onboarding state and any stale Storybook settings
  await page.evaluate(() => localStorage.clear());
  // Reload to apply clean state with initialGlobals (viewport: responsive)
  await page.reload();
  await page.waitForSelector("#storybook-explorer-tree", { timeout: 20_000 });
}

/**
 * Navigate to the Welcome story (auto-opens the Onboarding panel) and ensure
 * the "Onboarding" tab is selected in the bottom addon panel.
 */
export async function openOnboardingPanel(page: Page): Promise<void> {
  // Navigate to the Welcome story (auto-opens the Onboarding panel)
  await page.goto("/?path=/story/🏠-getting-started-welcome--welcome", {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await page.waitForSelector("#storybook-preview-iframe", { timeout: 15_000 });

  // Ensure addon panel is open via Storybook channel API
  await page.evaluate(() => {
    const ch = (window as any).__STORYBOOK_ADDONS_CHANNEL__;
    if (ch) {
      ch.emit("storybook/layout/set-layout", {
        panelPosition: "bottom",
        showPanel: true,
      });
    }
  });

  const tab = page.getByRole("tab", { name: "Onboarding" });
  await expect(tab).toBeVisible({ timeout: 10_000 });
  await tab.click();

  // Confirm the panel content loaded (persona selection or task list).
  await expect(
    page.getByText(/Select your role|tasks completed/).first(),
  ).toBeVisible({ timeout: 10_000 });
}

/**
 * Click the persona card in the Onboarding panel.
 * If a persona is already selected (task list visible), clicks "Change" first
 * to return to persona selection. Waits until the task list appears before returning.
 */
export async function selectPersona(
  page: Page,
  persona: Persona,
): Promise<void> {
  const labels: Record<Persona, string> = {
    instructor: "Instructor",
    learner: "Learner",
    translator: "Translator",
  };

  // If a persona is already selected, click "Change" to go back to selection
  const changeBtn = page
    .locator('[data-testid="onboarding-panel"]')
    .getByRole("button", { name: "Change" });
  if (await changeBtn.isVisible({ timeout: 1_000 }).catch(() => false)) {
    await changeBtn.click();
    await expect(
      page.getByText(/Select your role/).first(),
    ).toBeVisible({ timeout: 5_000 });
  }

  // The persona selection shows cards with the label + "Click to start onboarding"
  const card = page
    .locator('[class*="MuiCard"]')
    .filter({ hasText: labels[persona] })
    .first();
  await card.scrollIntoViewIfNeeded();
  await card.click();

  // Task list replaces the persona selection
  await expect(page.getByText(/\d+ of \d+ tasks completed/)).toBeVisible({
    timeout: 8_000,
  });
}

// ─── Task Tour ───────────────────────────────────────────────────────────────

/**
 * Walk through the full lifecycle of a single onboarding task:
 *
 * 1. Click the task card → SpotlightOverlay opens
 * 2. Walk through ALL spotlight steps (Start → Next → … → Done)
 * 3. Navigate to the correct story to find data-tour elements
 * 4. Click each data-tour element with real Playwright clicks
 * 5. Return to onboarding panel and verify task completion
 */
export async function walkTaskTour(
  page: Page,
  task: TaskSpec,
  persona: Persona,
  expectedCompleted: number,
): Promise<void> {
  // ── 1. Click the task card ─────────────────────────────────────────────────
  const taskCard = page
    .locator('[data-testid="task-item"]')
    .filter({ hasText: task.title });

  await taskCard.click();

  // ── 2. Walk through every spotlight step ───────────────────────────────────
  await walkAllSpotlightSteps(page);

  // ── 3. Navigate to the task's story and trigger completion ─────────────────
  const sequence = task.completionCriteria?.completionSequence;
  const storyId = task.completionCriteria?.tutorialStoryId;

  if (sequence && sequence.length > 0) {
    // Ensure persona is persisted to localStorage before navigating
    await page.evaluate(
      ({ persona: p, key }) => {
        const data = JSON.parse(localStorage.getItem(key) || "{}");
        if (!data.currentPersona) {
          data.currentPersona = p;
          data.currentMode = data.currentMode || "tutorial";
          data.completedTasks = data.completedTasks || [];
          localStorage.setItem(key, JSON.stringify(data));
        }
      },
      { persona, key: STORAGE_KEY },
    );

    if (storyId) {
      await page.goto(`/?path=/story/${storyId}`, {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      });
      await page.waitForSelector("#storybook-preview-iframe", {
        timeout: 15_000,
      });
      // Wait for story render + task-completion listener init (requestIdleCallback)
      await expect(
        page
          .frameLocator("#storybook-preview-iframe")
          .locator(`[data-tour="${sequence[0]}"]`)
          .first(),
      ).toBeAttached({ timeout: 15_000 });
    }

    await clickCompletionSequence(page, sequence);
  }

  // ── 4. Return to onboarding panel and verify ──────────────────────────────
  await openOnboardingPanel(page);

  const updatedTaskCard = page
    .locator('[data-testid="task-item"]')
    .filter({ hasText: task.title });

  await expect(updatedTaskCard.locator(`text=${task.title}`)).toHaveCSS(
    "text-decoration",
    /line-through/,
    { timeout: 10_000 },
  );

  await expect(updatedTaskCard.locator('input[type="checkbox"]')).toBeChecked({
    timeout: 5_000,
  });

  await expect(
    page.getByText(new RegExp(`${expectedCompleted} of \\d+ tasks completed`)),
  ).toBeVisible({ timeout: 8_000 });
}

// ─── Completion Helpers ──────────────────────────────────────────────────────

/**
 * Walk through ALL spotlight steps by clicking the primary action button:
 * "Start" on step 1, "Next" on middle steps, "Done" on the last step.
 * Verifies each step renders before advancing.
 */
async function walkAllSpotlightSteps(page: Page): Promise<void> {
  const tooltip = page.locator('[data-testid="spotlight-tooltip"]');
  await expect(tooltip.locator("text=/Step \\d+ of \\d+/")).toBeVisible({
    timeout: 10_000,
  });

  // Extract total step count from "Step 1 of N"
  const stepText = await tooltip
    .locator("text=/Step \\d+ of \\d+/")
    .textContent();
  const totalSteps = parseInt(stepText?.match(/of (\d+)/)?.[1] ?? "1", 10);

  for (let step = 1; step <= totalSteps; step++) {
    // Verify current step indicator
    await expect(
      tooltip.getByText(`Step ${step} of ${totalSteps}`),
    ).toBeVisible({ timeout: 5_000 });

    // Click the primary button (Start / Next / Done)
    const primaryBtn = tooltip.locator(
      'button:has-text("Start"), button:has-text("Next"), button:has-text("Done")',
    );
    await expect(primaryBtn).toBeEnabled({ timeout: 10_000 });
    await primaryBtn.click();
  }

  // Spotlight should be dismissed after clicking Done on the last step
  await expect(tooltip).not.toBeVisible({ timeout: 5_000 });
}

/**
 * Click each data-tour element in the completionSequence inside the preview
 * iframe using real Playwright clicks (scrolls into view, fires all event phases).
 */
async function clickCompletionSequence(
  page: Page,
  sequence: string[],
): Promise<void> {
  const preview = page.frameLocator("#storybook-preview-iframe");

  for (const tourId of sequence) {
    const target = preview.locator(`[data-tour="${tourId}"]`).first();
    await expect(target).toBeAttached({ timeout: 15_000 });
    await target.scrollIntoViewIfNeeded();
    await target.click();
  }
}

// ─── Mode Switching ──────────────────────────────────────────────────────────

export type OnboardingMode = "tutorial" | "quiz";

/**
 * Switch onboarding mode using the chip buttons in the panel header.
 * Waits until the mode indicator text confirms the switch.
 */
export async function switchMode(
  page: Page,
  mode: OnboardingMode,
): Promise<void> {
  const label = mode === "tutorial" ? "Tutorial" : "Quiz";
  // The chips are MUI Chip elements rendered as clickable spans
  const chip = page
    .locator("span")
    .filter({ hasText: new RegExp(`^${label}$`) })
    .first();
  await chip.click();
  // Confirm mode indicator updated — use specific text to avoid strict mode violations
  // Quiz mode has two elements containing "🎯 Quiz Mode" so we use the more specific "Active" text
  if (mode === "quiz") {
    await expect(page.getByText("🎯 Quiz Mode Active")).toBeVisible({
      timeout: 5_000,
    });
  } else {
    await expect(page.getByText("📖 Tutorial Mode")).toBeVisible({
      timeout: 5_000,
    });
  }
}

// ─── Quiz Mode Tour ──────────────────────────────────────────────────────────

/**
 * Walk through a single onboarding task in QUIZ mode:
 *
 * 1. Click the task card → SpotlightOverlay opens (1–2 hint steps)
 * 2. Walk through ALL spotlight steps (Start/Done)
 * 3. Navigate to the task's story and click data-tour elements
 * 4. Return to onboarding panel and verify completion
 *
 * Quiz mode differs from tutorial only in that the spotlight has fewer steps
 * and provides hints rather than guided walkthroughs. Completion is still
 * event-driven via real data-tour clicks.
 */
export async function walkQuizTaskTour(
  page: Page,
  task: TaskSpec,
  persona: Persona,
  expectedCompleted: number,
): Promise<void> {
  // ── 1. Click the task card ─────────────────────────────────────────────────
  const taskCard = page
    .locator('[data-testid="task-item"]')
    .filter({ hasText: task.title });

  await taskCard.click();

  // ── 2. Walk through quiz spotlight steps (typically 1 step) ────────────────
  await walkAllSpotlightSteps(page);

  // ── 3. Navigate to task story and trigger completion via real clicks ────────
  const sequence = task.completionCriteria?.completionSequence;
  const storyId =
    task.completionCriteria?.quizStoryId ||
    task.completionCriteria?.tutorialStoryId;

  if (sequence && sequence.length > 0 && storyId) {
    // Ensure persona is persisted before navigating
    await page.evaluate(
      ({ persona: p, key }) => {
        const data = JSON.parse(localStorage.getItem(key) || "{}");
        if (!data.currentPersona) {
          data.currentPersona = p;
          data.currentMode = "quiz";
          data.completedTasks = data.completedTasks || [];
          localStorage.setItem(key, JSON.stringify(data));
        }
      },
      { persona, key: STORAGE_KEY },
    );

    await page.goto(`/?path=/story/${storyId}`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await page.waitForSelector("#storybook-preview-iframe", {
      timeout: 15_000,
    });
    await expect(
      page
        .frameLocator("#storybook-preview-iframe")
        .locator(`[data-tour="${sequence[0]}"]`)
        .first(),
    ).toBeAttached({ timeout: 15_000 });

    await clickCompletionSequence(page, sequence);
  }

  // ── 4. Return to onboarding panel and verify ──────────────────────────────
  await openOnboardingPanel(page);

  const updatedTaskCard = page
    .locator('[data-testid="task-item"]')
    .filter({ hasText: task.title });

  await expect(updatedTaskCard.locator(`text=${task.title}`)).toHaveCSS(
    "text-decoration",
    /line-through/,
    { timeout: 10_000 },
  );

  await expect(updatedTaskCard.locator('input[type="checkbox"]')).toBeChecked({
    timeout: 5_000,
  });

  await expect(
    page.getByText(new RegExp(`${expectedCompleted} of \\d+ tasks completed`)),
  ).toBeVisible({ timeout: 8_000 });
}

// ─── Final Assertion ─────────────────────────────────────────────────────────

/**
 * Assert the "All tasks completed!" banner is visible in the panel.
 */
export async function assertAllComplete(page: Page): Promise<void> {
  await expect(page.getByText("0 Remaining")).toBeVisible({
    timeout: 10_000,
  });
}

/**
 * Assert the progress bar shows 100%.
 */
export async function assertFullProgress(page: Page): Promise<void> {
  const panel = page.locator('[data-testid="onboarding-panel"]');
  const bar = panel.getByRole("progressbar");
  await expect(bar).toHaveAttribute("aria-valuenow", "100", { timeout: 8_000 });
}
