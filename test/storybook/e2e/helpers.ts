/**
 * Shared helpers for Storybook onboarding E2E tests.
 *
 * Covers:
 *  - Opening/resetting the onboarding panel
 *  - Selecting a persona
 *  - Walking through a task's SpotlightOverlay tour
 *  - Triggering task completion through real browser interactions
 *  - Asserting per-task and overall progress state
 */

import { Page, expect } from "@playwright/test";
import type { OnboardingTaskWithCriteria } from "../../../.storybook/code/onboarding-tasks";
import { SPOTLIGHT_CONFIGURATIONS } from "../../../.storybook/code/spotlight-configs";

// ─── Types ────────────────────────────────────────────────────────────────

export type Persona = "instructor" | "learner" | "translator";

/** Re-export the real task shape so specs can't drift from onboarding-tasks.ts. */
export type TaskSpec = OnboardingTaskWithCriteria;

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
    await expect(page.getByText(/Select your role/).first()).toBeVisible({
      timeout: 5_000,
    });
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

  // "getting-started-storybook-basics" steps target real manager-frame elements
  // with no manual Next button (advancement === completion action itself), so
  // it can't go through the generic spotlight-walk-then-navigate flow below.
  if (task.id === "getting-started-storybook-basics") {
    await performStorybookBasicsAction(page);
    await openOnboardingPanel(page);
    const updatedTaskCard = page
      .locator('[data-testid="task-item"]')
      .filter({ hasText: task.title });
    await expect(updatedTaskCard.locator(`text=${task.title}`)).toHaveCSS(
      "text-decoration",
      /line-through/,
      { timeout: 10_000 },
    );
    await expect(updatedTaskCard.locator('input[type="checkbox"]')).toBeChecked(
      { timeout: 5_000 },
    );
    await expect(
      page.getByText(
        new RegExp(`${expectedCompleted} of \\d+ tasks completed`),
      ),
    ).toBeVisible({ timeout: 8_000 });
    return;
  }

  // ── 2. Interleave manual "Next" clicks with real completion clicks ─────────
  // Steps with a real target (per SpotlightOverlay's own design) advance ONLY
  // by clicking that real element in the app — they render no manual button.
  // The previous version of this helper walked every step via a manual
  // button first and only clicked completionSequence elements afterward,
  // which meant it never actually worked for any task with a targeted step
  // (i.e. almost all of them) — it just silently timed out looking for a
  // button that was never there by design.
  await walkSpotlightInterleaved(page, task);

  // ── 3. Return to onboarding panel and verify ──────────────────────────────
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
 * Click the given [data-tour] element in a way that's safe for large
 * container elements (Dialogs, forms). Clicking the center of a MUI Dialog's
 * root can land on the backdrop (which sits behind/around the visible Paper)
 * and silently close the dialog via onClose instead of registering a real
 * interaction. If the element itself isn't a native interactive control,
 * click its first interactive descendant instead (a real user would click
 * into the first field, not the dialog's empty backdrop).
 */
async function clickTourTarget(
  preview: ReturnType<Page["frameLocator"]>,
  selector: string,
): Promise<void> {
  // Retry the whole locate-and-click a few times — a mock-data list re-render
  // (e.g. a newly created section being inserted) can detach the exact node
  // between locating it and the scroll/click actions.
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const target = preview.locator(selector).first();
      await expect(target).toBeAttached({ timeout: 15_000 });

      const tag = await target.evaluate((el) => el.tagName.toLowerCase());
      const isNativelyInteractive = [
        "input",
        "textarea",
        "select",
        "button",
        "a",
      ].includes(tag);

      const clickable = isNativelyInteractive
        ? target
        : target
            .locator(
              'input, textarea, button, [role="combobox"], [role="button"]',
            )
            .first();

      const finalTarget = (await clickable
        .isVisible({ timeout: 2_000 })
        .catch(() => false))
        ? clickable
        : target;

      await finalTarget.scrollIntoViewIfNeeded();
      // The spotlight tooltip overlay can visually sit above a modal Dialog
      // that just opened (z-index race), intercepting pointer events even
      // though the target is otherwise visible/enabled — force the click
      // since we've already confirmed this is the correct interactive
      // descendant of the real data-tour target.
      await finalTarget
        .click({ force: true, timeout: 5_000 })
        .catch(async () => {
          await finalTarget.click({ timeout: 15_000 });
        });
      return;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

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
      'button:has-text("Start"), button:has-text("Continue"), button:has-text("Next"), button:has-text("Done")',
    );
    await expect(primaryBtn).toBeEnabled({ timeout: 10_000 });
    await primaryBtn.click();
  }

  // Spotlight should be dismissed after clicking Done on the last step
  await expect(tooltip).not.toBeVisible({ timeout: 5_000 });
}

/**
 * Extract the data-tour value from a targetSelector like
 * '[data-tour="join-code"], form' or '[data-tour="x"]'.
 */
function extractDataTourValue(selector?: string): string | null {
  if (!selector) return null;
  const match = selector.match(/\[data-tour="([^"]+)"\]/);
  return match ? match[1] : null;
}

/**
 * Walk a tutorial-mode spotlight tour to real completion, one step at a time,
 * driven directly by the REAL spotlight step definitions (not a separately
 * tracked completionSequence index, which can desync from what's actually
 * on screen at any given step):
 *  - info-only steps (no real target): click the manual Start/Next/Done button
 *  - target-based steps: click the REAL element in the app (the click both
 *    advances the tour, per SpotlightOverlay's design, and satisfies the
 *    task's completionCriteria)
 *
 * Clicking the task card already auto-navigates the preview iframe to the
 * task's tutorialStoryId (see OnboardingPanel.handleTaskClick), so this never
 * needs to `page.goto()` itself.
 */
async function walkSpotlightInterleaved(
  page: Page,
  task: TaskSpec,
): Promise<void> {
  const tooltip = page.locator('[data-testid="spotlight-tooltip"]');
  const preview = page.frameLocator("#storybook-preview-iframe");
  const requiredSequence = task.completionCriteria?.requiredSequence ?? [];

  const config = SPOTLIGHT_CONFIGURATIONS.find((c) => c.taskId === task.id);
  const steps = config?.tutorialSteps ?? [];

  await expect(tooltip.locator("text=/Step \\d+ of \\d+/")).toBeVisible({
    timeout: 10_000,
  });

  for (const step of steps) {
    if (!(await tooltip.isVisible().catch(() => false))) break;

    if (!step.targetSelector) {
      // Info-only step (or a manager-frame target we don't drive here) —
      // advance via the manual button.
      const manualBtn = tooltip.locator(
        'button:has-text("Start"), button:has-text("Continue"), button:has-text("Next"), button:has-text("Done")',
      );
      await expect(manualBtn).toBeEnabled({ timeout: 10_000 });
      await manualBtn.click();
      continue;
    }

    if (
      step.targetSelector.includes('[data-tour="shortcuts-demo"]') &&
      requiredSequence.includes("shortcut-performed")
    ) {
      // Clicking the demo area alone only advances the tour — the task also
      // requires actually performing a real shortcut.
      await performKeyboardShortcut(page);
      continue;
    }

    // Only auto-fill/submit a dialog if it was ALREADY open before this
    // click — otherwise the click itself is what OPENS the dialog (e.g. a
    // "Create Section" button), and the dialog's own form deserves its own
    // step/click before being filled and submitted.
    const dialogWasOpen = await preview
      .locator('[role="dialog"]')
      .first()
      .isVisible()
      .catch(() => false);
    if (step.targetFrame === "manager") {
      await expect(page.locator(step.targetSelector).first()).toBeVisible({
        timeout: 15_000,
      });
      await page.locator(step.targetSelector).first().click();
    } else {
      await clickTourTarget(preview, step.targetSelector);
    }
    if (dialogWasOpen) {
      await fillAnyOpenDialogFields(page);
    }
  }

  await expect(tooltip).not.toBeVisible({ timeout: 5_000 });
}

/**
 * Click each data-tour element in the completionSequence inside the preview
 * iframe using real Playwright clicks (scrolls into view, fires all event phases).
 * After each click, fills any newly-visible required dialog fields so a step
 * later in the sequence (e.g. a chip revealed only after real form submission)
 * isn't blocked by a modal that never closes.
 */
async function clickCompletionSequence(
  page: Page,
  sequence: string[],
): Promise<void> {
  const preview = page.frameLocator("#storybook-preview-iframe");

  for (const tourId of sequence) {
    await clickTourTarget(preview, `[data-tour="${tourId}"]`);
    await fillAnyOpenDialogFields(page);
  }
}

/**
 * Fill any visible, empty, required inputs/selects in the preview iframe with
 * placeholder values and submit the enclosing form. Generic on purpose — new
 * dialogs added to completionSequence flows shouldn't need bespoke test code.
 */
async function fillAnyOpenDialogFields(page: Page): Promise<void> {
  const preview = page.frameLocator("#storybook-preview-iframe");

  const inputs = preview.locator("input[required], textarea[required]");
  const inputCount = await inputs.count().catch(() => 0);
  for (let i = 0; i < inputCount; i++) {
    const input = inputs.nth(i);
    if (!(await input.isVisible().catch(() => false))) continue;
    const value = await input.inputValue().catch(() => "");
    if (value) continue;
    const type = (await input.getAttribute("type")) || "text";
    if (type === "datetime-local") await input.fill("2026-12-31T23:59");
    else if (type === "date") await input.fill("2026-12-31");
    else await input.fill("Automated test value");
  }

  // MUI <Select> renders a clickable div[role="combobox"] rather than a native
  // <select> — open it and pick the first option if nothing is selected yet.
  const selects = preview.locator('[role="combobox"]');
  const selectCount = await selects.count().catch(() => 0);
  for (let i = 0; i < selectCount; i++) {
    const select = selects.nth(i);
    if (!(await select.isVisible().catch(() => false))) continue;
    const text = (await select.textContent())?.trim();
    if (text) continue;
    await select.click();
    const option = page.locator('li[role="option"]').first();
    await option.waitFor({ state: "visible", timeout: 3_000 }).catch(() => {});
    if (await option.isVisible().catch(() => false)) await option.click();
  }

  const submit = preview.locator('button[type="submit"]:visible').first();
  if (await submit.isVisible().catch(() => false)) {
    await submit.click();
    // Let the resulting mock-data update (e.g. a new section/list item)
    // settle before the caller clicks the next target — otherwise a
    // React re-render can detach an element between locating and clicking it.
    const dialog = preview.locator('[role="dialog"]').first();
    await dialog.waitFor({ state: "hidden", timeout: 5_000 }).catch(() => {});
    await preview
      .locator("body")
      .waitFor({ state: "attached" })
      .catch(() => {});
  }
}

/**
 * Perform a real keyboard shortcut (Bold: Ctrl/Cmd+B) inside the
 * KeyboardShortcutTrainer demo to satisfy `requiredSequence: ["shortcut-performed"]`.
 * Clicking the demo area alone deliberately does NOT complete these tasks —
 * a real key combo must be pressed (see KeyboardShortcutTrainer.tsx).
 */
async function performKeyboardShortcut(page: Page): Promise<void> {
  const preview = page.frameLocator("#storybook-preview-iframe");
  const demo = preview.locator('[data-tour="shortcuts-demo"]').first();
  await expect(demo).toBeAttached({ timeout: 15_000 });
  await demo.click();
  await page.keyboard.press("Control+b");
}

/**
 * Click the sidebar story tree and the toolbar in the manager frame to
 * satisfy the "getting-started-storybook-basics" task's completion listener
 * (registered in manager.tsx, not the preview-iframe DOM listener).
 *
 * Clicks the toolbar's top-left corner (padding, not a control) — clicking
 * its center previously landed on the viewport-size control and silently
 * switched the preview to a 320px mobile viewport for the rest of the test.
 */
async function performStorybookBasicsAction(page: Page): Promise<void> {
  await page.locator("#storybook-explorer-tree").click();
  await page
    .locator('[role="toolbar"]')
    .first()
    .click({ position: { x: 4, y: 4 } });
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

  if (task.id === "getting-started-storybook-basics") {
    await performStorybookBasicsAction(page);
  }

  // ── 3. Navigate to task story and trigger completion via real clicks ────────
  const sequence = task.completionCriteria?.completionSequence ?? [];
  const requiredSequence = task.completionCriteria?.requiredSequence ?? [];
  const preview = page.frameLocator("#storybook-preview-iframe");

  // Clicking the task card already performs the app's real mode-aware story
  // navigation. Do not write onboarding state or call page.goto here: the
  // browser must exercise the same route selected by a human user.
  if (sequence.length > 0) {
    const firstTarget = preview.locator(`[data-tour="${sequence[0]}"]`).first();
    await expect(firstTarget).toBeAttached({ timeout: 15_000 });
    await clickCompletionSequence(page, sequence);
  } else if (requiredSequence.includes("shortcut-performed")) {
    await performKeyboardShortcut(page);
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
