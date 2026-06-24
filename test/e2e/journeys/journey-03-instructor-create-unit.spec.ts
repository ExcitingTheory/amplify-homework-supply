/**
 * Journey 3: Instructor — Create Unit & Build Content
 *
 * Creates all state from scratch:
 * 1. Creates a new unit — verifies UUID in URL
 * 2. Types content — verifies persistence after reload
 * 3. Inserts quiz block — verifies it's interactive
 * 4. Opens dictionary tab — verifies add-word UI
 * 5. Opens files tab — verifies upload UI
 * 6. Opens assignments tab — verifies assignment creation UI
 *
 * Every step FAILS if the content creation pipeline is broken.
 */

import { test, expect } from "./fixtures";
import {
  INSTRUCTOR,
  login,
  suppressKnownErrors,
  waitForPageReady,
} from "./helpers";

test.describe
  .serial("Journey 3: Instructor — Create Unit & Build Content", () => {
  let unitId: string;
  let uniqueContent: string;

  test("creating a unit produces a new editor page with UUID", async ({
    page,
  }) => {
    suppressKnownErrors(page);
    await login(page, INSTRUCTOR, "/units");
    await page.waitForSelector('[data-tour="units-page"]', { timeout: 15_000 });

    // Click create
    await page.locator('[data-tour="create-unit-button"]').first().click();

    // Must navigate to /unit/{uuid}
    await page.waitForURL(/\/unit\/[a-f0-9-]+/, { timeout: 15_000 });
    unitId = page.url().match(/\/unit\/([a-f0-9-]+)/)![1];

    // ID must be a proper UUID
    expect(unitId).toBeTruthy();
    expect(unitId.length).toBe(36);

    // Editor must load
    await expect(page.locator('[data-tour="editor"]')).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.locator('[data-lexical-editor="true"]')).toBeVisible({
      timeout: 15_000,
    });
  });

  test("typed content persists across page reload", async ({ page }) => {
    suppressKnownErrors(page);
    await login(page, INSTRUCTOR, `/unit/${unitId}`);
    await page.waitForSelector('[data-lexical-editor="true"]', {
      timeout: 15_000,
    });
    await page.waitForTimeout(2000);

    // Type unique content
    const editor = page.locator('[data-lexical-editor="true"]').first();
    await editor.click();
    uniqueContent = `Persistence test ${Date.now()}`;
    await page.keyboard.type(uniqueContent);

    // Wait for auto-save
    await page.waitForTimeout(4000);

    // Verify content is present
    let editorText = await editor.textContent();
    expect(editorText).toContain(uniqueContent);

    // Reload
    await page.reload({ timeout: 30_000 });
    await page.waitForSelector('[data-lexical-editor="true"]', {
      timeout: 15_000,
    });
    await page.waitForTimeout(3000);

    // Content MUST survive reload (DB save worked)
    const reloadedEditor = page.locator('[data-lexical-editor="true"]').first();
    const reloadedText = await reloadedEditor.textContent();
    expect(reloadedText).toContain(uniqueContent);
  });

  test("inserting a quiz block creates an interactive graded element", async ({
    page,
  }) => {
    suppressKnownErrors(page);
    await login(page, INSTRUCTOR, `/unit/${unitId}`);
    await page.waitForSelector('[data-lexical-editor="true"]', {
      timeout: 15_000,
    });
    await page.waitForTimeout(2000);

    // Open insert menu
    const insertButton = page.locator(
      'button[aria-controls="insert-node-menu"]',
    );
    await expect(insertButton).toBeVisible({ timeout: 10_000 });
    await insertButton.click();

    const menu = page.locator('ul[role="menu"]');
    await expect(menu).toBeVisible({ timeout: 5_000 });

    // Insert quiz
    const quizItem = menu
      .locator("li")
      .filter({ hasText: /quiz|multiple choice/i });
    await expect(quizItem).toBeVisible({ timeout: 5_000 });
    await quizItem.click();
    await page.waitForTimeout(2000);

    // Quiz block MUST appear
    const quizBlock = page.locator('[data-tour="quiz-block"]').first();
    await expect(quizBlock).toBeVisible({ timeout: 10_000 });

    // Must have editable answer inputs
    const editableElements = quizBlock.locator(
      'input, textarea, [contenteditable="true"]',
    );
    const count = await editableElements.count();
    expect(count).toBeGreaterThan(0);
  });

  test("dictionary tab shows vocabulary management UI", async ({ page }) => {
    suppressKnownErrors(page);
    await login(page, INSTRUCTOR, `/unit/${unitId}`);
    await page.waitForSelector('[data-tour="editor"]', { timeout: 30_000 });
    await page.waitForTimeout(2000);

    // Click dictionary tab
    const dictTab = page.locator('[data-tour="dictionary-tab"]');
    await expect(dictTab).toBeVisible({ timeout: 10_000 });
    await dictTab.click();
    await page.waitForTimeout(2000);

    // Dictionary panel must render with add-word button
    const addWordBtn = page.locator('[data-tour="add-word-button"]');
    await expect(addWordBtn).toBeVisible({ timeout: 10_000 });

    // Click it to verify the form opens
    await addWordBtn.click();
    await page.waitForTimeout(1000);

    const wordForm = page.locator('[data-tour="word-form"]');
    await expect(wordForm).toBeVisible({ timeout: 10_000 });
  });

  test("files tab shows upload UI", async ({ page }) => {
    suppressKnownErrors(page);
    await login(page, INSTRUCTOR, `/unit/${unitId}`);
    await page.waitForSelector('[data-tour="editor"]', { timeout: 30_000 });
    await page.waitForTimeout(2000);

    // Click files tab
    const filesTab = page.locator('[data-tour="files-tab"]');
    await expect(filesTab).toBeVisible({ timeout: 10_000 });
    await filesTab.click();
    await page.waitForTimeout(2000);

    // Must have file upload capability (input[type=file] or drop zone)
    const uploadInput = page.locator('input[type="file"]');
    const dropZone = page.locator('[class*="dropzone"], [class*="upload"]');

    const hasUpload = await uploadInput
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false);
    const hasDropZone = await dropZone
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);

    expect(hasUpload || hasDropZone).toBe(true);
  });

  test("assignments tab shows assignment creation interface", async ({
    page,
  }) => {
    suppressKnownErrors(page);
    await login(page, INSTRUCTOR, `/unit/${unitId}`);
    await page.waitForSelector('[data-tour="editor"]', { timeout: 30_000 });
    await page.waitForTimeout(2000);

    // Click assignments tab
    const assignTab = page.locator('[data-tour="assignments-tab"]');
    await expect(assignTab).toBeVisible({ timeout: 10_000 });
    await assignTab.click();
    await page.waitForTimeout(2000);

    // Must show assignment configuration
    const assignPanel = page.locator('[data-tour="assignment-settings"]');
    const createBtn = page.locator('[data-tour="create-assignment-button"]');

    const hasPanel = await assignPanel
      .isVisible({ timeout: 10_000 })
      .catch(() => false);
    const hasBtn = await createBtn
      .isVisible({ timeout: 5_000 })
      .catch(() => false);

    expect(hasPanel || hasBtn).toBe(true);

    if (hasPanel) {
      // Must have section selector and due date
      await expect(page.locator('[data-tour="unit-selector"]')).toBeVisible({
        timeout: 10_000,
      });
    }
  });
});
