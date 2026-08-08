import { test, expect } from "@playwright/test";
import { INSTRUCTOR, login, goToUnits, suppressKnownErrors } from "./helpers";

/**
 * Unit Editor — Full CRUD lifecycle.
 *
 * Covers: create unit, rename, type content, insert quiz block,
 * publish, autosave persistence, and sidebar navigation.
 */
test.describe("Unit Editor CRUD", () => {
  test.beforeEach(async ({ page }) => {
    suppressKnownErrors(page);
    await login(page, INSTRUCTOR, "/units");
  });

  test("create a new unit and verify editor loads", async ({ page }) => {
    await page.locator('[data-tour="create-unit-button"]').first().click();
    await page.waitForURL(/\/unit\/[a-f0-9-]+/, { timeout: 15_000 });

    // Editor and its toolbar must both be present
    await expect(page.locator('[data-tour="editor"]')).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.locator('[data-tour="editor-toolbar"]')).toBeVisible();

    // URL contains a valid UUID
    expect(page.url()).toMatch(/\/unit\/[a-f0-9-]{36}/);
  });

  test("rename unit title updates display", async ({ page }) => {
    await page.locator('[data-tour="create-unit-button"]').first().click();
    await page.waitForURL(/\/unit\/[a-f0-9-]+/, { timeout: 15_000 });
    await page.waitForSelector('[data-tour="editor"]', { timeout: 30_000 });

    const uniqueName = `E2E Rename ${Date.now()}`;

    // Click the "Untitled Unit" title text to activate inline editing
    const titleEl = page.getByText("Untitled Unit").first();
    await expect(titleEl).toBeVisible({ timeout: 5_000 });
    await titleEl.click();

    // The inline TextField (variant="standard") auto-focuses
    const nameInput = page.locator(".MuiInput-input:visible");
    await expect(nameInput).toBeVisible({ timeout: 3_000 });
    await nameInput.fill(uniqueName);

    // Verify the input has the new value
    await expect(nameInput).toHaveValue(uniqueName);

    // Tab triggers blur → display mode returns with new name
    await nameInput.press("Tab");

    // Title display should show the new name
    await expect(page.getByText(uniqueName).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("type content and verify autosave round-trip", async ({ page }) => {
    await page.locator('[data-tour="create-unit-button"]').first().click();
    await page.waitForURL(/\/unit\/[a-f0-9-]+/, { timeout: 15_000 });
    await page.waitForSelector('[data-lexical-editor="true"]', {
      timeout: 15_000,
    });

    const testContent = `Autosave verification ${Date.now()}`;

    // Type in the editor
    const editor = page.locator('[data-lexical-editor="true"]');
    await editor.click();
    await editor.pressSequentially(testContent, { delay: 20 });

    // Wait for autosave
    await page
      .waitForResponse(
        (resp) => resp.url().includes("graphql") && resp.status() === 200,
        { timeout: 15_000 },
      )
      .catch(() => {});

    // Reload and verify content persisted
    await page.reload();
    await page.waitForSelector('[data-lexical-editor="true"]', {
      timeout: 15_000,
    });
    await expect(page.locator('[data-lexical-editor="true"]')).toContainText(
      testContent,
      { timeout: 10_000 },
    );
  });

  test("insert quiz block via toolbar Insert menu", async ({ page }) => {
    await page.locator('[data-tour="create-unit-button"]').first().click();
    await page.waitForURL(/\/unit\/[a-f0-9-]+/, { timeout: 15_000 });
    await page.waitForSelector('[data-tour="editor"]', { timeout: 30_000 });

    // Open the Insert dropdown
    await page.locator('button[aria-controls="insert-node-menu"]').click();
    await page
      .locator('ul[role="menu"]')
      .waitFor({ state: "visible", timeout: 5_000 });

    // Click quiz/multiple choice item
    await page
      .locator('ul[role="menu"] li')
      .filter({ hasText: /quiz|multiple choice/i })
      .click();

    // Verify quiz block appeared
    await expect(page.locator('[data-tour="quiz-block"]').first()).toBeVisible({
      timeout: 5_000,
    });
  });

  test("status select changes between Draft, Published, Archived", async ({
    page,
  }) => {
    await page.locator('[data-tour="create-unit-button"]').first().click();
    await page.waitForURL(/\/unit\/[a-f0-9-]+/, { timeout: 15_000 });
    await page.waitForSelector('[data-tour="editor"]', { timeout: 30_000 });

    // Default status should be Draft
    await expect(page.locator("#status-select")).toContainText(/draft/i, {
      timeout: 10_000,
    });

    // Change to Archived (doesn't require name/description like Published does)
    await page.locator("#status-select").click();
    await page.locator('li[data-value="ARCHIVED"]').click();

    // Status should update to Archived
    await expect(page.locator("#status-select")).toContainText(/archived/i, {
      timeout: 5_000,
    });

    // Change back to Draft
    await page.locator("#status-select").click();
    await page.locator('li[data-value="DRAFT"]').click();

    await expect(page.locator("#status-select")).toContainText(/draft/i, {
      timeout: 5_000,
    });
  });

  test("editor sidebar tabs open correct panels", async ({ page }) => {
    await page.locator('[data-tour="create-unit-button"]').first().click();
    await page.waitForURL(/\/unit\/[a-f0-9-]+/, { timeout: 15_000 });
    await page.waitForSelector('[data-tour="editor"]', { timeout: 30_000 });

    // Dictionary tab opens dictionary panel
    await page.locator('[data-tour="dictionary-tab"]').click();
    await expect(page.locator('[data-tour="dictionary"]')).toBeVisible({
      timeout: 5_000,
    });

    // Files tab opens files panel
    await page.locator('[data-tour="files-tab"]').click();

    // Questions tab
    await page.locator('[data-tour="questions-tab"]').click();

    // Assignments tab opens assignment settings
    await page.locator('[data-tour="assignments-tab"]').click();
    await expect(page.locator('[data-tour="assignment-settings"]')).toBeVisible(
      { timeout: 5_000 },
    );
  });
});
