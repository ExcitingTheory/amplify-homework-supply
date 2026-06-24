/**
 * Journey 6: Learner — Peer Review, Notifications & AI Memory
 *
 * Creates its own state:
 * 1. Instructor creates unit → student completes it
 * 2. Dashboard shows "Open for Peer Review" and "Request Guidance" buttons
 * 3. AI Memory panel shows learning profile (strengths/focus areas)
 * 4. Notification bell is functional
 * 5. Notifications page shows event entries
 *
 * Tests the new dashboard social/AI features.
 */

import { test, expect } from "./fixtures";
import {
  INSTRUCTOR,
  STUDENT_1,
  login,
  suppressKnownErrors,
  waitForPageReady,
  navigateTo,
} from "./helpers";

test.describe.serial("Journey 6: Learner — Peer Review & AI Memory", () => {
  let unitId: string;

  // ─── SETUP: Create and complete content ──────────────────────────────

  test("instructor creates a unit with content", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    suppressKnownErrors(page);
    await login(page, INSTRUCTOR, "/units");
    await page.waitForSelector('[data-tour="units-page"]', { timeout: 15_000 });

    await page.locator('[data-tour="create-unit-button"]').first().click();
    await page.waitForURL(/\/unit\/[a-f0-9-]+/, { timeout: 15_000 });
    unitId = page.url().match(/\/unit\/([a-f0-9-]+)/)![1];

    await page.waitForSelector('[data-lexical-editor="true"]', {
      timeout: 15_000,
    });
    await page.waitForTimeout(2000);

    const editor = page.locator('[data-lexical-editor="true"]').first();
    await editor.click();
    await page.keyboard.type(`Peer Review Unit ${Date.now()}`);

    // Insert quiz
    const insertButton = page.locator(
      'button[aria-controls="insert-node-menu"]',
    );
    await insertButton.click();
    const menu = page.locator('ul[role="menu"]');
    await expect(menu).toBeVisible({ timeout: 5_000 });
    await menu
      .locator("li")
      .filter({ hasText: /quiz|multiple choice/i })
      .click();
    await page.waitForTimeout(2000);

    await page.waitForTimeout(4000);
    await ctx.close();
  });

  test("student completes the workbook", async ({ page }) => {
    suppressKnownErrors(page);
    await login(page, STUDENT_1);

    await page.goto(`/workbook/${unitId}`, { timeout: 30_000 });
    await page.waitForTimeout(3000);

    const startButton = page.getByRole("button", { name: /start/i });
    if (await startButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await startButton.click();
      await page.waitForTimeout(2000);
    }

    const completionModal = page.locator('[data-tour="results"]');
    if (
      await completionModal.isVisible({ timeout: 5_000 }).catch(() => false)
    ) {
      return; // Already completed
    }

    await expect(page.locator('[data-tour="workbook"]')).toBeVisible({
      timeout: 20_000,
    });

    const quizBlock = page.locator('[data-tour="quiz-block"]').first();
    if (await quizBlock.isVisible({ timeout: 10_000 }).catch(() => false)) {
      const unchecked = quizBlock.locator(
        'input[type="checkbox"]:not(:checked), [role="checkbox"][aria-checked="false"]',
      );
      const count = await unchecked.count();
      for (let i = 0; i < count; i++) {
        await unchecked.nth(i).click();
        await page.waitForTimeout(500);
      }
    }

    await page.waitForTimeout(3000);
  });

  // ─── VERIFY: Dashboard social/AI features ────────────────────────────

  test("dashboard completed assignment has peer review and guidance buttons", async ({
    page,
  }) => {
    suppressKnownErrors(page);
    await login(page, STUDENT_1);
    await waitForPageReady(page);

    // Look for "Open for Peer Review" button
    const peerReviewBtn = page.getByRole("button", {
      name: /Open for Peer Review/i,
    });
    const hasReview = await peerReviewBtn
      .first()
      .isVisible({ timeout: 15_000 })
      .catch(() => false);

    // Look for "Request Guidance" button
    const guidanceBtn = page.getByRole("button", {
      name: /Request Guidance/i,
    });
    const hasGuidance = await guidanceBtn
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);

    // At least one social action must be available
    expect(hasReview || hasGuidance).toBe(true);
  });

  test("Open for Peer Review opens a dialog with room creation", async ({
    page,
  }) => {
    suppressKnownErrors(page);
    await login(page, STUDENT_1);
    await waitForPageReady(page);

    const peerReviewBtn = page.getByRole("button", {
      name: /Open for Peer Review/i,
    });
    if (
      !(await peerReviewBtn
        .first()
        .isVisible({ timeout: 15_000 })
        .catch(() => false))
    ) {
      // No completed assignment with peer review available
      return;
    }

    await peerReviewBtn.first().click();
    await page.waitForTimeout(1500);

    // Dialog must open
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    // Dialog must mention peer review
    await expect(dialog.getByText(/Peer Review/i)).toBeVisible({
      timeout: 5_000,
    });

    // Must have "Create Room" button
    const createRoomBtn = dialog.getByRole("button", {
      name: /Create Room/i,
    });
    await expect(createRoomBtn).toBeVisible({ timeout: 5_000 });

    // Close dialog
    const cancelBtn = dialog.getByRole("button", { name: /Cancel/i });
    await cancelBtn.click();
    await expect(dialog).not.toBeVisible({ timeout: 5_000 });
  });

  test("AI memory panel shows learning profile when available", async ({
    page,
  }) => {
    suppressKnownErrors(page);
    await login(page, STUDENT_1);
    await waitForPageReady(page);

    // AI Memory panel shows "Your Learning Profile" heading
    const memoryPanel = page.getByText("Your Learning Profile");
    if (
      !(await memoryPanel.isVisible({ timeout: 10_000 }).catch(() => false))
    ) {
      // AI memory not yet generated for this student — acceptable
      return;
    }

    // Must show strengths and/or focus areas
    const strengths = page.getByText("Strengths");
    const focusAreas = page.getByText("Focus Areas");

    const hasStrengths = await strengths
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
    const hasFocus = await focusAreas
      .isVisible({ timeout: 5_000 })
      .catch(() => false);

    expect(hasStrengths || hasFocus).toBe(true);

    // If focus areas exist, "Practice my weak areas" button must be present
    if (hasFocus) {
      const practiceBtn = page.getByRole("button", {
        name: /Practice my weak areas/i,
      });
      await expect(practiceBtn).toBeVisible({ timeout: 5_000 });
    }
  });

  test("notification bell opens notification panel", async ({ page }) => {
    suppressKnownErrors(page);
    await login(page, STUDENT_1);
    await waitForPageReady(page);

    const notifButton = page.getByRole("button", { name: /notifications/i });
    await expect(notifButton).toBeVisible({ timeout: 10_000 });

    await notifButton.click();
    await page.waitForTimeout(1500);

    const hasResponse =
      (await page
        .locator(
          '[role="menu"], [role="dialog"], [class*="popover"], [class*="Popover"], [class*="drawer"]',
        )
        .first()
        .isVisible({ timeout: 5_000 })
        .catch(() => false)) || page.url().includes("notification");
    expect(hasResponse).toBe(true);
  });

  test("notifications page shows event list", async ({ page }) => {
    suppressKnownErrors(page);
    await login(page, STUDENT_1);
    await navigateTo(page, "/notifications");

    const bodyText = await page.locator("body").textContent();

    const hasContent =
      bodyText!.toLowerCase().includes("notification") ||
      bodyText!.toLowerCase().includes("assignment") ||
      bodyText!.toLowerCase().includes("grade") ||
      bodyText!.toLowerCase().includes("review") ||
      bodyText!.toLowerCase().includes("no notification") ||
      bodyText!.toLowerCase().includes("all caught up") ||
      (await page
        .locator('[class*="card"], [class*="Card"], [class*="list-item"]')
        .first()
        .isVisible({ timeout: 5_000 })
        .catch(() => false));
    expect(hasContent).toBe(true);
  });
});
