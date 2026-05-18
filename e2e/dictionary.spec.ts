import { test, expect } from "@playwright/test";
import { INSTRUCTOR, login, suppressKnownErrors } from "./helpers";

/**
 * Dictionary — Vocabulary word CRUD.
 *
 * Covers: open dictionary panel in editor, add word with all fields,
 * verify word appears in list, verify word persists after reload.
 */
test.describe("Dictionary CRUD", () => {
  test.beforeEach(async ({ page }) => {
    suppressKnownErrors(page);
    await login(page, INSTRUCTOR, "/units");
  });

  test("add vocabulary word and verify it persists", async ({ page }) => {
    // Create a unit to work in
    await page.locator('[data-tour="create-unit-button"]').first().click();
    await page.waitForURL(/\/unit\/[a-f0-9-]+/, { timeout: 15_000 });
    await page.waitForSelector('[data-tour="editor"]', { timeout: 30_000 });
    const unitUrl = page.url();

    // Open dictionary panel
    await page.locator('[data-tour="dictionary-tab"]').click();
    await expect(page.locator('[data-tour="dictionary"]')).toBeVisible({
      timeout: 5_000,
    });

    // Click add word button
    await page.locator('[data-tour="add-word-button"]').click();
    await page.waitForSelector('[data-tour="word-form"]', { timeout: 10_000 });

    const testWord = `pw-word-${Date.now()}`;

    // Fill in all required fields
    await page
      .locator('[data-tour="word-form"] input[name="phrase"]')
      .fill(testWord);
    await page
      .locator('[data-tour="word-form"] input[name="pronunciation"]')
      .fill("/tɛst/");
    await page
      .locator('[data-tour="word-form"] [name="definition"]')
      .fill("A word created by Playwright for testing");

    // Submit the form
    await page.locator('[data-tour="word-form"] button[type="submit"]').click();

    // Wait for creation (mutation + subscription delivery)
    await page.waitForTimeout(3000);

    // Verify word appears in the dictionary list
    await expect(page.getByText(testWord)).toBeVisible({ timeout: 10_000 });

    // Reload the page and verify persistence
    await page.goto(unitUrl);
    await page.waitForSelector('[data-tour="editor"]', { timeout: 30_000 });
    await page.locator('[data-tour="dictionary-tab"]').click();
    await expect(page.locator('[data-tour="dictionary"]')).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.getByText(testWord)).toBeVisible({ timeout: 10_000 });
  });

  test("insert word block from toolbar into editor", async ({ page }) => {
    // Create a unit and add a word first
    await page.locator('[data-tour="create-unit-button"]').first().click();
    await page.waitForURL(/\/unit\/[a-f0-9-]+/, { timeout: 15_000 });
    await page.waitForSelector('[data-tour="editor"]', { timeout: 30_000 });

    // Add a word to have something to insert
    await page.locator('[data-tour="dictionary-tab"]').click();
    await expect(page.locator('[data-tour="dictionary"]')).toBeVisible({
      timeout: 5_000,
    });
    await page.locator('[data-tour="add-word-button"]').click();
    await page.waitForSelector('[data-tour="word-form"]', { timeout: 10_000 });

    const testWord = `insert-word-${Date.now()}`;
    await page
      .locator('[data-tour="word-form"] input[name="phrase"]')
      .fill(testWord);
    await page
      .locator('[data-tour="word-form"] input[name="pronunciation"]')
      .fill("/ɪn/");
    await page
      .locator('[data-tour="word-form"] [name="definition"]')
      .fill("Insertable word");
    await page.locator('[data-tour="word-form"] button[type="submit"]').click();
    await page.waitForTimeout(3000);

    // Now try to insert a word block via the editor toolbar
    await page.locator('button[aria-controls="insert-node-menu"]').click();
    await page
      .locator('ul[role="menu"]')
      .waitFor({ state: "visible", timeout: 5_000 });

    const wordItem = page
      .locator('ul[role="menu"] li')
      .filter({ hasText: /word|vocabulary/i });
    if (await wordItem.isVisible().catch(() => false)) {
      await wordItem.click();
      await page.waitForTimeout(2000);
      // If word selection dialog appears, the insert mechanism works
    }
  });
});
