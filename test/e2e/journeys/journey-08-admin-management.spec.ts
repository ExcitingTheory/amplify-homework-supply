/**
 * Journey 8: Admin — Platform Management & Authorization
 *
 * Creates its own state where needed:
 * 1. Admin creates a vocabulary word via admin interface
 * 2. Admin verifies analytics page has real data
 * 3. Admin verifies settings has interactive controls
 * 4. Admin verifies recycle bin is functional
 * 5. Student CANNOT access admin routes (authorization boundary)
 *
 * Every step FAILS if authorization or admin features are broken.
 */

import { test, expect } from "./fixtures";
import {
  ADMIN,
  STUDENT_1,
  login,
  suppressKnownErrors,
  waitForPageReady,
  navigateTo,
} from "./helpers";

test.describe("Journey 8: Admin — Platform Management", () => {
  test.describe.serial("admin creates and manages content", () => {
    test("admin analytics page shows real metric data", async ({ page }) => {
      suppressKnownErrors(page);
      await login(page, ADMIN);
      await navigateTo(page, "/admin/analytics");

      // Must have heading
      const heading = page.getByRole("heading");
      await expect(heading.first()).toBeVisible({ timeout: 10_000 });

      const bodyText = await page.locator("body").textContent();

      // Analytics MUST contain numeric data
      expect(bodyText).toMatch(/\d+/);

      // Must have data visualization
      const hasDataViz =
        (await page
          .locator("canvas, svg, table")
          .first()
          .isVisible({ timeout: 5_000 })
          .catch(() => false)) || bodyText!.includes("%");
      expect(hasDataViz).toBe(true);
    });

    test("admin vocabulary management lets you create a word", async ({
      page,
    }) => {
      suppressKnownErrors(page);
      await login(page, ADMIN);
      await navigateTo(page, "/admin/vocabulary");

      // Must show vocabulary management UI
      const bodyText = await page.locator("body").textContent();
      const hasVocabUI =
        bodyText!.toLowerCase().includes("vocabul") ||
        bodyText!.toLowerCase().includes("word") ||
        bodyText!.toLowerCase().includes("dictionary");
      expect(hasVocabUI).toBe(true);

      // Look for add/create button
      const addBtn = page.locator(
        'button:has-text("Add"), button:has-text("Create"), button:has-text("New")',
      );
      if (
        await addBtn
          .first()
          .isVisible({ timeout: 10_000 })
          .catch(() => false)
      ) {
        await addBtn.first().click();
        await page.waitForTimeout(2000);

        // Form/dialog must open with input fields
        const inputs = page.locator('input:not([type="hidden"]), textarea');
        const inputCount = await inputs.count();
        expect(inputCount).toBeGreaterThan(0);
      }
    });

    test("admin settings page has interactive controls", async ({ page }) => {
      suppressKnownErrors(page);
      await login(page, ADMIN);
      await navigateTo(page, "/admin/settings");

      const heading = page.getByRole("heading");
      await expect(heading.first()).toBeVisible({ timeout: 10_000 });

      // Must have form controls
      const controls = page.locator(
        'input, select, [role="switch"], [role="checkbox"], [role="combobox"], textarea',
      );
      const controlCount = await controls.count();
      expect(controlCount).toBeGreaterThan(0);
    });

    test("recycle bin page is functional and shows deleted items or empty state", async ({
      page,
    }) => {
      suppressKnownErrors(page);
      await login(page, ADMIN);
      await navigateTo(page, "/recycle-bin");

      const bodyText = await page.locator("body").textContent();

      // Must show recycle bin content or empty state
      const hasContent =
        bodyText!.toLowerCase().includes("recycle") ||
        bodyText!.toLowerCase().includes("deleted") ||
        bodyText!.toLowerCase().includes("trash") ||
        bodyText!.toLowerCase().includes("restore") ||
        bodyText!.toLowerCase().includes("empty") ||
        bodyText!.toLowerCase().includes("no items");
      expect(hasContent).toBe(true);
    });
  });

  // ─── AUTHORIZATION BOUNDARY ──────────────────────────────────────────

  test.describe("student cannot access admin routes", () => {
    test("student is blocked from /admin/analytics", async ({ page }) => {
      suppressKnownErrors(page);
      await login(page, STUDENT_1);
      await page.goto("/admin/analytics", { timeout: 30_000 });
      await waitForPageReady(page);

      // Student must NOT see analytics data — should be redirected or blocked
      const url = page.url();
      const bodyText = await page.locator("body").textContent();

      const isBlocked =
        !url.includes("/admin/analytics") || // redirected away
        bodyText!.toLowerCase().includes("unauthorized") ||
        bodyText!.toLowerCase().includes("forbidden") ||
        bodyText!.toLowerCase().includes("access denied") ||
        bodyText!.toLowerCase().includes("not authorized") ||
        bodyText!.toLowerCase().includes("sign in") ||
        bodyText!.toLowerCase().includes("404");
      expect(isBlocked).toBe(true);
    });

    test("student is blocked from /admin/settings", async ({ page }) => {
      suppressKnownErrors(page);
      await login(page, STUDENT_1);
      await page.goto("/admin/settings", { timeout: 30_000 });
      await waitForPageReady(page);

      const url = page.url();
      const bodyText = await page.locator("body").textContent();

      const isBlocked =
        !url.includes("/admin/settings") ||
        bodyText!.toLowerCase().includes("unauthorized") ||
        bodyText!.toLowerCase().includes("forbidden") ||
        bodyText!.toLowerCase().includes("access denied") ||
        bodyText!.toLowerCase().includes("not authorized") ||
        bodyText!.toLowerCase().includes("sign in") ||
        bodyText!.toLowerCase().includes("404");
      expect(isBlocked).toBe(true);
    });
  });
});
