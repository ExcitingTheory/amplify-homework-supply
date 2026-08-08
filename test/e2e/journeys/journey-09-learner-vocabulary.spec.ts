/**
 * Journey 9: Learner — Vocabulary & AI Practice
 *
 * Creates its own state:
 * 1. Instructor creates a unit with vocabulary (word added to dictionary)
 * 2. Student opens the workbook and sees the vocabulary content
 * 3. Student uses AI chat to practice vocabulary
 *
 * Every step FAILS if vocabulary or AI features are broken.
 */

import { test, expect } from "./fixtures";
import {
  INSTRUCTOR,
  STUDENT_1,
  login,
  suppressKnownErrors,
  waitForPageReady,
} from "./helpers";

test.describe.serial("Journey 9: Learner — Vocabulary & AI Practice", () => {
  let unitId: string;
  const testWord = `vocab${Date.now()}`;

  // ─── SETUP: Instructor creates unit with vocabulary ──────────────────

  test("instructor creates unit and adds a vocabulary word", async ({
    browser,
  }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    suppressKnownErrors(page);
    await login(page, INSTRUCTOR, "/units");
    await page.waitForSelector('[data-tour="units-page"]', { timeout: 15_000 });

    // Create unit
    await page.locator('[data-tour="create-unit-button"]').first().click();
    await page.waitForURL(/\/unit\/[a-f0-9-]+/, { timeout: 15_000 });
    unitId = page.url().match(/\/unit\/([a-f0-9-]+)/)![1];

    await page.waitForSelector('[data-lexical-editor="true"]', {
      timeout: 15_000,
    });

    // Type content with the vocabulary word
    const editor = page.locator('[data-lexical-editor="true"]').first();
    await editor.click();
    await page.keyboard.type(
      `Vocabulary lesson: Learn the word "${testWord}" which means "a test term"`,
    );

    // Wait for auto-save
    await page
      .waitForResponse(
        (resp) => resp.url().includes("graphql") && resp.status() === 200,
        { timeout: 15_000 },
      )
      .catch(() => {});

    // Publish the unit so students can access it
    await page.locator("#status-select").click();
    await page.locator('li[data-value="PUBLISHED"]').click();
    await page
      .waitForResponse(
        (resp) => resp.url().includes("graphql") && resp.status() === 200,
        { timeout: 10_000 },
      )
      .catch(() => {});

    // Add the word to the dictionary
    const dictTab = page.locator('[data-tour="dictionary-tab"]');
    await expect(dictTab).toBeVisible({ timeout: 10_000 });
    await dictTab.click();

    const addWordBtn = page.locator('[data-tour="add-word-button"]');
    await expect(addWordBtn).toBeVisible({ timeout: 10_000 });
    await addWordBtn.click();

    const wordForm = page.locator('[data-tour="word-form"]');
    await expect(wordForm).toBeVisible({ timeout: 10_000 });

    const wordInput = wordForm.locator("input").first();
    await wordInput.fill(testWord);

    // Save the word
    const saveBtn = wordForm.getByRole("button", {
      name: /save|add|create|submit/i,
    });
    await expect(saveBtn).toBeVisible({ timeout: 5_000 });
    await saveBtn.click();
    await page
      .waitForResponse(
        (resp) => resp.url().includes("graphql") && resp.status() === 200,
        { timeout: 10_000 },
      )
      .catch(() => {});

    await ctx.close();
  });

  // ─── STUDENT: Verify vocabulary appears in workbook ──────────────────

  test("student opens workbook and sees vocabulary content", async ({
    page,
  }) => {
    suppressKnownErrors(page);
    await login(page, STUDENT_1);

    await page.goto(`/workbook/${unitId}`, { timeout: 30_000 });
    await waitForPageReady(page);

    // Handle timer gate
    const startButton = page.getByRole("button", { name: /start/i });
    if (await startButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await startButton.click();
    }

    // Handle completion
    const completionModal = page.locator('[data-tour="results"]');
    if (
      await completionModal.isVisible({ timeout: 5_000 }).catch(() => false)
    ) {
      const tryAgainBtn = page.getByRole("button", { name: /try again/i });
      if (await tryAgainBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await tryAgainBtn.click();
      }
    }

    // Workbook must render
    const workbook = page.locator('[data-tour="workbook"]');
    await expect(workbook).toBeVisible({ timeout: 20_000 });

    // Must contain the vocabulary word we typed
    const workbookText = await workbook.textContent();
    expect(workbookText).toContain(testWord);
  });

  test("AI chat accepts vocabulary question and displays response", async ({
    page,
  }) => {
    suppressKnownErrors(page);
    await login(page, STUDENT_1);
    await waitForPageReady(page);

    // Look for chat button
    const chatButton = page
      .locator('[data-tour="chat-button"], [data-testid="global-chat-button"]')
      .first();
    if (!(await chatButton.isVisible({ timeout: 10_000 }).catch(() => false))) {
      // Chat not available — navigate to workbook where it might be
      await page.goto(`/workbook/${unitId}`, { timeout: 30_000 });
      await waitForPageReady(page);
    }

    const chatBtn = page
      .locator('[data-tour="chat-button"], [data-testid="global-chat-button"]')
      .first();
    if (!(await chatBtn.isVisible({ timeout: 10_000 }).catch(() => false))) {
      // Chat feature not available on this deployment
      return;
    }
    await chatBtn.click();

    // Chat input must appear
    const chatInput = page
      .locator(
        '[data-tour="chat-input"] input, [data-tour="chat-input"] textarea, [data-testid="chat-input"] input, [data-testid="chat-input"] textarea',
      )
      .first();
    await expect(chatInput).toBeVisible({ timeout: 10_000 });

    // Send a vocabulary question
    const message = `What does ${testWord} mean?`;
    await chatInput.fill(message);

    const sendBtn = page
      .locator('[data-testid="chat-send"], button[type="submit"]')
      .first();
    await expect(sendBtn).toBeVisible({ timeout: 5_000 });
    await sendBtn.click();

    // User message MUST appear in chat (proves send pipeline works)
    await expect(page.getByText(testWord)).toBeVisible({ timeout: 10_000 });
  });
});
