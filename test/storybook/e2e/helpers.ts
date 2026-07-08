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

import { Page, expect, Frame } from "@playwright/test";

// ─── Types (inline to avoid importing browser-side code) ────────────────────

export type Persona = "instructor" | "learner" | "translator";

/** Minimal task shape needed by the helpers. Matches OnboardingTaskWithCriteria. */
export interface TaskSpec {
  id: string;
  title: string;
  completionCriteria?: {
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
  await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);
}

/**
 * Navigate to the Welcome story (auto-opens the Onboarding panel) and ensure
 * the "Onboarding" tab is selected in the bottom addon panel.
 */
export async function openOnboardingPanel(page: Page): Promise<void> {
  // The Welcome story triggers automatic panel open in the addon
  await page.goto("/?path=/story/🏠-getting-started-welcome--welcome");

  // If the bottom panel is not open, toggle it with Storybook's keyboard shortcut
  const tab = page.getByRole("tab", { name: "Onboarding" });
  const tabVisible = await tab.isVisible({ timeout: 3_000 }).catch(() => false);
  if (!tabVisible) {
    await page.keyboard.press("a"); // Storybook 'Show addons' shortcut
    await expect(tab).toBeVisible({ timeout: 10_000 });
  }

  await tab.click();

  // Confirm the panel content loaded (persona selection or task list).
  // Use .first() because "Select your role" appears in both the sidebar widget
  // and the panel subtitle — either match proves the panel is ready.
  await expect(
    page.getByText(/Select your role|tasks completed/).first(),
  ).toBeVisible({ timeout: 10_000 });
}

/**
 * Click the persona card in the Onboarding panel.
 * Waits until the task list appears before returning.
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

  // The persona selection shows cards with the label + "Click to start onboarding"
  await page
    .locator('[class*="MuiCard"]')
    .filter({ hasText: labels[persona] })
    .first()
    .click();

  // Task list replaces the persona selection
  await expect(page.getByText(/\d+ of \d+ tasks completed/)).toBeVisible({
    timeout: 8_000,
  });
}

// ─── Task Tour ───────────────────────────────────────────────────────────────

/**
 * Walk through the full lifecycle of a single onboarding task:
 *
 * 1. Click the task card  →  SpotlightOverlay opens
 * 2. Step-through the overlay (Start → Next… → Done)
 *    - Each click waits for the button to be enabled (auto-handles page loading)
 *    - Asserts the step counter increments each time
 * 3. The overlay closes; the bottom panel reopens automatically
 * 4. Trigger completion inside the preview iframe:
 *    - completionSequence: click each [data-tour="…"] element in order
 *    - customCheck only (no sequence): inject completion via localStorage
 * 5. Assert: task checkbox checked + title has line-through
 * 6. Assert: "N of M tasks completed" counter matches expectedCompleted
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

  // ── 2. SpotlightOverlay appears ────────────────────────────────────────────
  // Wait for "Step 1 of N" indicator
  const stepIndicator = page.locator("text=/Step 1 of \\d+/");
  await expect(stepIndicator).toBeVisible({ timeout: 10_000 });

  // Read total steps from the indicator text
  const indicatorText = await stepIndicator.textContent({ timeout: 5_000 });
  const totalSteps = parseInt(indicatorText?.match(/of (\d+)/)?.[1] ?? "3", 10);

  // ── 3. Navigate through steps ─────────────────────────────────────────────
  for (let i = 0; i < totalSteps; i++) {
    const isFirst = i === 0;
    const isLast = i === totalSteps - 1;

    // Assert step counter shows the right step number
    await expect(
      page.locator(`text=/Step ${i + 1} of ${totalSteps}/`),
    ).toBeVisible({ timeout: 8_000 });

    if (isLast) {
      // "Done" button — clicking this closes the overlay
      await page.getByRole("button", { name: "Done" }).click();
    } else if (isFirst) {
      // "Start" button — disabled until iframe is loaded
      await page.getByRole("button", { name: "Start" }).click();
    } else {
      // "Next" button — disabled while navigating
      await page.getByRole("button", { name: "Next" }).click();
    }

    await page.waitForTimeout(200); // brief UI settle
  }

  // ── 4. Panel reopens after overlay closes ─────────────────────────────────
  // togglePanel(true) is called automatically when spotlightOpen → false
  await expect(page.locator('[data-testid="task-item"]').first()).toBeVisible({
    timeout: 10_000,
  });

  // ── 5. Trigger task completion ─────────────────────────────────────────────
  const sequence = task.completionCriteria?.completionSequence;
  const hasCustomCheck = !!task.completionCriteria?.customCheck;

  if (sequence && sequence.length > 0) {
    await clickCompletionSequence(page, sequence);
  } else if (hasCustomCheck) {
    // No data-tour sequence: inject directly into localStorage from the iframe
    // so the manager frame's storage-event listener fires
    await injectCompletionViaIframe(page, task.id, persona);
  }

  // ── 6. Assert task crossed off ────────────────────────────────────────────
  // The Typography inside the task card gets text-decoration: line-through
  await expect(taskCard.locator(`text=${task.title}`)).toHaveCSS(
    "text-decoration",
    /line-through/,
    { timeout: 10_000 },
  );

  // Checkbox should be checked
  await expect(taskCard.locator('input[type="checkbox"]')).toBeChecked({
    timeout: 5_000,
  });

  // ── 7. Assert progress counter ────────────────────────────────────────────
  await expect(
    page.getByText(new RegExp(`${expectedCompleted} of \\d+ tasks completed`)),
  ).toBeVisible({ timeout: 8_000 });
}

// ─── Completion Helpers ──────────────────────────────────────────────────────

/**
 * Click each data-tour element in the completionSequence inside the preview
 * iframe in order.  The initializeDomActionListeners() function (in preview.jsx)
 * detects these clicks and emits task-completed → persists to localStorage →
 * manager storage-event fires → panel updates.
 */
async function clickCompletionSequence(
  page: Page,
  sequence: string[],
): Promise<void> {
  const preview = page.frameLocator("#storybook-preview-iframe");

  for (const tourId of sequence) {
    const target = preview.locator(`[data-tour="${tourId}"]`).first();
    // Scroll into view then click; use force to handle pointer-events:none wrappers
    await target.waitFor({ state: "attached", timeout: 10_000 });
    await target.scrollIntoViewIfNeeded();
    await target.click({ force: true, timeout: 10_000 });
    await page.waitForTimeout(300); // let DOM listener process the click
  }
}

/**
 * For customCheck-only tasks: write the task-completed entry directly into
 * storybook_onboarding_progress localStorage from the PREVIEW IFRAME context.
 *
 * Writing from the iframe triggers a `storage` event in the manager frame
 * (same-origin, different browsing context). The manager emitter's
 * ensureStorageListener() picks this up and emits task-completed to the panel.
 */
async function injectCompletionViaIframe(
  page: Page,
  taskId: string,
  persona: Persona,
): Promise<void> {
  const frames = page.frames();
  const previewFrame = frames.find(
    (f) => f.url().includes("iframe") || f.url().includes("?id="),
  ) as Frame | undefined;

  if (!previewFrame) {
    // Fallback: write from the main frame (no cross-frame storage event, but
    // the panel can still read it on next render)
    await page.evaluate(
      ({ taskId, persona, key }) => {
        const taskKey = `${persona}:${taskId}`;
        const event = {
          type: "task-completed",
          taskId,
          persona,
          timestamp: Date.now(),
          metadata: { injectedByE2ETest: true },
        };
        let data: { completedTasks?: [string, unknown][] };
        try {
          data = JSON.parse(localStorage.getItem(key) || "{}");
        } catch {
          data = {};
        }
        if (!Array.isArray(data.completedTasks)) data.completedTasks = [];
        data.completedTasks = data.completedTasks.filter(
          ([k]) => k !== taskKey,
        );
        data.completedTasks.push([taskKey, event]);
        localStorage.setItem(key, JSON.stringify(data));
      },
      { taskId, persona, key: STORAGE_KEY },
    );
    // Reload the panel so it picks up the new state
    await page.reload();
    await openOnboardingPanel(page);
    return;
  }

  await previewFrame.evaluate(
    ({ taskId, persona, key }) => {
      const taskKey = `${persona}:${taskId}`;
      const event = {
        type: "task-completed",
        taskId,
        persona,
        timestamp: Date.now(),
        metadata: { injectedByE2ETest: true },
      };
      let data: { completedTasks?: [string, unknown][] };
      try {
        data = JSON.parse(localStorage.getItem(key) || "{}");
      } catch {
        data = {};
      }
      if (!Array.isArray(data.completedTasks)) data.completedTasks = [];
      data.completedTasks = data.completedTasks.filter(([k]) => k !== taskKey);
      data.completedTasks.push([taskKey, event]);
      localStorage.setItem(key, JSON.stringify(data));
    },
    { taskId, persona, key: STORAGE_KEY },
  );

  // Allow storage event to propagate to manager frame
  await page.waitForTimeout(500);
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
  // Confirm mode indicator updated
  await expect(
    page.getByText(mode === "tutorial" ? "📖 Tutorial Mode" : "🎯 Quiz Mode"),
  ).toBeVisible({ timeout: 5_000 });
}

// ─── Quiz Mode Tour ──────────────────────────────────────────────────────────

/**
 * Walk through a single onboarding task in QUIZ mode:
 *
 * 1. Click the task card  →  SpotlightOverlay opens (single hint step)
 * 2. Dismiss the overlay (Done on the single step)
 * 3. The overlay closes; the panel reopens
 * 4. Trigger completion inside the preview iframe:
 *    - completionSequence: click each [data-tour="…"] element in order
 *    - customCheck only (no sequence): inject completion via localStorage
 * 5. Assert: task checkbox checked + title has line-through
 * 6. Assert: "N of M tasks completed" counter matches expectedCompleted
 *
 * Key differences from tutorial walkTaskTour:
 *   - Quiz spotlight has 1–2 steps max (normalizeQuizSteps strips verify steps)
 *   - No Start/Next multi-step flow — just Done
 *   - Story navigates to Sidebar Navigation first (not the task story)
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

  // ── 2. SpotlightOverlay appears (quiz: minimal steps) ─────────────────────
  const stepIndicator = page.locator("text=/Step 1 of \\d+/");
  await expect(stepIndicator).toBeVisible({ timeout: 10_000 });

  // Read total steps — quiz mode should be 1–2 steps max
  const indicatorText = await stepIndicator.textContent({ timeout: 5_000 });
  const totalSteps = parseInt(indicatorText?.match(/of (\d+)/)?.[1] ?? "1", 10);

  // ── 3. Navigate through steps (quiz: typically just Done) ─────────────────
  for (let i = 0; i < totalSteps; i++) {
    const isLast = i === totalSteps - 1;

    await expect(
      page.locator(`text=/Step ${i + 1} of ${totalSteps}/`),
    ).toBeVisible({ timeout: 8_000 });

    if (isLast) {
      await page.getByRole("button", { name: "Done" }).click();
    } else {
      // If there's more than 1 step, use Next (or Start for first)
      const btn =
        i === 0
          ? page.getByRole("button", { name: "Start" })
          : page.getByRole("button", { name: "Next" });
      await btn.click();
    }

    await page.waitForTimeout(200);
  }

  // ── 4. Panel reopens after overlay closes ─────────────────────────────────
  await expect(page.locator('[data-testid="task-item"]').first()).toBeVisible({
    timeout: 10_000,
  });

  // ── 5. Trigger task completion ─────────────────────────────────────────────
  const sequence = task.completionCriteria?.completionSequence;
  const hasCustomCheck = !!task.completionCriteria?.customCheck;

  if (sequence && sequence.length > 0) {
    await clickCompletionSequence(page, sequence);
  } else if (hasCustomCheck) {
    await injectCompletionViaIframe(page, task.id, persona);
  }

  // ── 6. Assert task crossed off ────────────────────────────────────────────
  await expect(taskCard.locator(`text=${task.title}`)).toHaveCSS(
    "text-decoration",
    /line-through/,
    { timeout: 10_000 },
  );

  await expect(taskCard.locator('input[type="checkbox"]')).toBeChecked({
    timeout: 5_000,
  });

  // ── 7. Assert progress counter ────────────────────────────────────────────
  await expect(
    page.getByText(new RegExp(`${expectedCompleted} of \\d+ tasks completed`)),
  ).toBeVisible({ timeout: 8_000 });
}

// ─── Final Assertion ─────────────────────────────────────────────────────────

/**
 * Assert the "All tasks completed!" banner is visible in the panel.
 */
export async function assertAllComplete(page: Page): Promise<void> {
  await expect(page.getByText("All tasks completed!")).toBeVisible({
    timeout: 10_000,
  });
}

/**
 * Assert the progress bar shows 100%.
 */
export async function assertFullProgress(page: Page): Promise<void> {
  const bar = page.getByRole("progressbar");
  await expect(bar).toHaveAttribute("aria-valuenow", "100", { timeout: 8_000 });
}
