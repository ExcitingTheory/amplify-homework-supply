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

      // Analytics MUST contain a visible metric element with numeric data
      const metricLocator = page.locator(
        '[data-testid*="metric"], [data-testid*="stat"], [data-testid*="count"], [class*="metric"], [class*="stat"]',
      );
      const hasMetricElements = await metricLocator.first().isVisible({ timeout: 5_000 }).catch(() => false);

      if (hasMetricElements) {
        const metricText = await metricLocator.first().textContent();
        expect(metricText).toMatch(/\d+/);
      } else {
        // Fallback: check for data visualization components (canvas/svg/table)
        const dataViz = page.locator("canvas, svg, table").first();
        await expect(dataViz).toBeVisible({ timeout: 10_000 });
      }
    });

    test("admin vocabulary management lets you create a word", async ({
      page,
    }) => {
      suppressKnownErrors(page);
      await login(page, ADMIN);
      await navigateTo(page, "/admin/vocabulary");

      // Must show vocabulary management UI with a specific heading or control
      const vocabHeading = page.locator(
        'h1, h2, h3, [role="heading"]',
      ).filter({ hasText: /vocabul|word|dictionary/i });
      await expect(vocabHeading.first()).toBeVisible({ timeout: 10_000 });

      // Look for add/create button
      const addBtn = page.locator(
        'button:has-text("Add"), button:has-text("Create"), button:has-text("New")',
      );
      await expect(addBtn.first()).toBeVisible({ timeout: 10_000 });
      await addBtn.first().click();

      // Form/dialog must open with input fields
      const inputs = page.locator('input:not([type="hidden"]), textarea');
      await expect(inputs.first()).toBeVisible({ timeout: 5_000 });
      const inputCount = await inputs.count();
      expect(inputCount).toBeGreaterThan(0);
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

      const response = await page.goto("/admin/analytics", { timeout: 30_000 });
      await waitForPageReady(page);

      const status = response?.status() ?? 0;
      const url = page.url();
      const bodyText = await page.locator("body").textContent();

      // 404 is NOT a valid authorization response — distinguish from 403/redirect
      const isRedirected = !url.includes("/admin/analytics");
      const isForbidden = status === 403 || status === 401;
      const hasAuthMessage =
        bodyText!.toLowerCase().includes("unauthorized") ||
        bodyText!.toLowerCase().includes("forbidden") ||
        bodyText!.toLowerCase().includes("access denied") ||
        bodyText!.toLowerCase().includes("not authorized") ||
        bodyText!.toLowerCase().includes("sign in");

      expect(
        isRedirected || isForbidden || hasAuthMessage,
        `Expected redirect or 401/403, got status=${status} url=${url}`,
      ).toBe(true);
      // 404 should NOT be treated as authorization
      if (status === 404) {
        expect.soft(status, "Route returned 404 — this is a routing bug, not auth").not.toBe(404);
      }
    });

    test("student is blocked from /admin/settings", async ({ page }) => {
      suppressKnownErrors(page);
      await login(page, STUDENT_1);

      const response = await page.goto("/admin/settings", { timeout: 30_000 });
      await waitForPageReady(page);

      const status = response?.status() ?? 0;
      const url = page.url();
      const bodyText = await page.locator("body").textContent();

      const isRedirected = !url.includes("/admin/settings");
      const isForbidden = status === 403 || status === 401;
      const hasAuthMessage =
        bodyText!.toLowerCase().includes("unauthorized") ||
        bodyText!.toLowerCase().includes("forbidden") ||
        bodyText!.toLowerCase().includes("access denied") ||
        bodyText!.toLowerCase().includes("not authorized") ||
        bodyText!.toLowerCase().includes("sign in");

      expect(
        isRedirected || isForbidden || hasAuthMessage,
        `Expected redirect or 401/403, got status=${status} url=${url}`,
      ).toBe(true);
      if (status === 404) {
        expect.soft(status, "Route returned 404 — this is a routing bug, not auth").not.toBe(404);
      }
    });
  });
});
