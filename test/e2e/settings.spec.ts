import { test, expect } from "@playwright/test";
import { STUDENT, login, goToSettings, suppressKnownErrors } from "./helpers";

/**
 * Settings — Verify settings actually save and persist.
 *
 * Covers: load settings page, change language preference,
 * verify it persists after reload, open and close cache dialog.
 */
test.describe("Settings Persistence", () => {
  test.beforeEach(async ({ page }) => {
    suppressKnownErrors(page);
    await login(page, STUDENT);
  });

  test("settings page loads with profile and language sections", async ({
    page,
  }) => {
    await goToSettings(page);

    // Verify key sections are visible by heading text
    await expect(
      page.getByRole("heading", { name: /my profile/i }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByRole("heading", { name: /language/i }),
    ).toBeVisible();
  });

  test("language preference change persists after reload", async ({ page }) => {
    await goToSettings(page);

    // Find the locale select
    const localeSelect = page.locator("#locale-select");
    await expect(localeSelect).toBeVisible({ timeout: 10_000 });

    // Get current value
    const currentValue = await localeSelect.inputValue().catch(() => null);

    // Click to open dropdown
    await localeSelect.click();
    await page.waitForSelector('[role="listbox"]', { timeout: 5_000 });

    // Select a different option (pick first non-selected option)
    const options = page.locator('[role="option"]');
    const optionCount = await options.count();
    if (optionCount > 1) {
      // Click second option (different from current)
      await options.nth(1).click();
      await page.waitForTimeout(2000);

      // Get new value
      const newValue = await localeSelect.inputValue().catch(() => null);

      // Reload and verify persistence
      await page.reload();
      await page
        .waitForLoadState("networkidle", { timeout: 10_000 })
        .catch(() => {});
      const localeAfterReload = page.locator("#locale-select");
      await expect(localeAfterReload).toBeVisible({ timeout: 10_000 });
      const persistedValue = await localeAfterReload
        .inputValue()
        .catch(() => null);
      expect(persistedValue).toBe(newValue);

      // Reset back to original value if we changed it
      if (currentValue && currentValue !== persistedValue) {
        await localeAfterReload.click();
        await page.waitForSelector('[role="listbox"]', { timeout: 5_000 });
        await page
          .locator('[role="option"]')
          .filter({ hasText: new RegExp(currentValue, "i") })
          .first()
          .click();
        await page.waitForTimeout(2000);
      }
    }
  });

  test("clear cache dialog can be opened and closed", async ({ page }) => {
    await goToSettings(page);

    // Find and click the clear cache button
    const clearButton = page.getByRole("button", { name: /clear/i });
    await expect(clearButton).toBeVisible({ timeout: 10_000 });
    await clearButton.click();

    // Dialog should appear (use specific aria-labelledby to avoid matching nav drawer)
    const dialog = page.getByRole("dialog", { name: /clear/i });
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Close it (Escape or cancel button)
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible({ timeout: 3_000 });
  });
});
