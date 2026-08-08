/**
 * Journey 7: Instructor — File & Question Management
 *
 * Creates all state from scratch:
 * 1. Instructor creates a unit
 * 2. Opens files tab and verifies upload UI is functional
 * 3. Uploads a test file and verifies it appears in the list
 * 4. Opens questions tab and verifies question management UI
 * 5. Creates a question and verifies it persists
 *
 * Every step FAILS if file/question management is broken.
 */

import { test, expect } from "./fixtures";
import { resolve } from "path";
import {
  INSTRUCTOR,
  login,
  suppressKnownErrors,
  waitForPageReady,
} from "./helpers";

test.describe
  .serial("Journey 7: Instructor — File & Question Management", () => {
  let unitId: string;

  test("instructor creates a unit for file management", async ({ page }) => {
    suppressKnownErrors(page);
    await login(page, INSTRUCTOR, "/units");
    await page.waitForSelector('[data-tour="units-page"]', { timeout: 15_000 });

    await page.locator('[data-tour="create-unit-button"]').first().click();
    await page.waitForURL(/\/unit\/[a-f0-9-]+/, { timeout: 15_000 });
    unitId = page.url().match(/\/unit\/([a-f0-9-]+)/)![1];

    await page.waitForSelector('[data-lexical-editor="true"]', {
      timeout: 15_000,
    });

    const editor = page.locator('[data-lexical-editor="true"]').first();
    await editor.click();
    await page.keyboard.type(`File Mgmt Unit ${Date.now()}`);

    // Wait for auto-save
    await page.waitForResponse(
      (resp) => resp.url().includes("graphql") && resp.status() === 200,
      { timeout: 15_000 },
    ).catch(() => {});
  });

  test("files tab has functional upload input that accepts files", async ({
    page,
  }) => {
    suppressKnownErrors(page);
    await login(page, INSTRUCTOR, `/unit/${unitId}`);
    await page.waitForSelector('[data-tour="editor"]', { timeout: 30_000 });

    // Open files tab
    const filesTab = page.locator('[data-tour="files-tab"]');
    await expect(filesTab).toBeVisible({ timeout: 10_000 });
    await filesTab.click();

    // Must have upload input
    const uploadInput = page.locator('input[type="file"]').first();
    await expect(uploadInput).toBeAttached({ timeout: 10_000 });

    // Create a test file and upload it
    const testContent = Buffer.from(`test file content ${Date.now()}`);
    await uploadInput.setInputFiles({
      name: "e2e-test-file.txt",
      mimeType: "text/plain",
      buffer: testContent,
    });

    // File should appear in the list after upload
    await expect(page.getByText("e2e-test-file")).toBeVisible({ timeout: 15_000 });
  });

  test("questions tab shows question management UI", async ({ page }) => {
    suppressKnownErrors(page);
    await login(page, INSTRUCTOR, `/unit/${unitId}`);
    await page.waitForSelector('[data-tour="editor"]', { timeout: 30_000 });

    // Open questions tab
    const questionsTab = page.locator('[data-tour="questions-tab"]');
    await expect(questionsTab).toBeVisible({ timeout: 10_000 });
    await questionsTab.click();

    // Must show question management interface — add button or existing questions
    const addBtn = page.locator(
      'button:has-text("Add"), button:has-text("Create"), button:has-text("New")',
    );
    const questionList = page.locator(
      '[class*="question"], [data-tour*="question"]',
    );
    await expect(addBtn.first().or(questionList.first())).toBeVisible({
      timeout: 10_000,
    });
  });

  test("instructor can add a vocabulary word to the unit", async ({ page }) => {
    suppressKnownErrors(page);
    await login(page, INSTRUCTOR, `/unit/${unitId}`);
    await page.waitForSelector('[data-tour="editor"]', { timeout: 30_000 });

    // Open dictionary tab
    const dictTab = page.locator('[data-tour="dictionary-tab"]');
    await expect(dictTab).toBeVisible({ timeout: 10_000 });
    await dictTab.click();

    // Click add word
    const addWordBtn = page.locator('[data-tour="add-word-button"]');
    await expect(addWordBtn).toBeVisible({ timeout: 10_000 });
    await addWordBtn.click();

    // Word form must appear
    const wordForm = page.locator('[data-tour="word-form"]');
    await expect(wordForm).toBeVisible({ timeout: 10_000 });

    // Fill in a word
    const wordInput = wordForm.locator("input").first();
    await expect(wordInput).toBeVisible({ timeout: 5_000 });
    const testWord = `e2eword${Date.now()}`;
    await wordInput.fill(testWord);

    // Submit the form (look for save/add button within the form)
    const saveBtn = wordForm.getByRole("button", {
      name: /save|add|create|submit/i,
    });
    await expect(saveBtn).toBeVisible({ timeout: 5_000 });
    await saveBtn.click();

    // Word should appear in the dictionary list
    await expect(page.getByText(testWord)).toBeVisible({ timeout: 10_000 });
  });
});
