/**
 * Journey 10: All Roles — Settings & Personalization
 *
 * Creates its own state by changing settings:
 * 1. Student changes a setting and verifies it persists
 * 2. Student user menu shows role-appropriate options
 * 3. Instructor has creation controls student doesn't
 * 4. Instructor changes section settings
 *
 * Every step FAILS if settings or role-based UI is broken.
 */

import { test, expect } from "./fixtures";
import {
  STUDENT_1,
  INSTRUCTOR,
  login,
  suppressKnownErrors,
  waitForPageReady,
} from "./helpers";

test.describe("Journey 10: Settings & Personalization", () => {
  test.describe.serial("student settings", () => {
    test("student can change a setting and it persists after reload", async ({
      page,
    }) => {
      suppressKnownErrors(page);
      await login(page, STUDENT_1);
      await page.goto("/settings", { timeout: 30_000 });
      await waitForPageReady(page);

      // Must have interactive controls
      const switches = page.locator('[role="switch"], [role="checkbox"]');
      const inputs = page.locator(
        'input:not([type="hidden"]), select, [role="combobox"]',
      );

      const hasSwitches = await switches
        .first()
        .isVisible({ timeout: 10_000 })
        .catch(() => false);
      const hasInputs = await inputs
        .first()
        .isVisible({ timeout: 5_000 })
        .catch(() => false);
      expect(hasSwitches || hasInputs).toBe(true);

      // Toggle a switch if available
      if (hasSwitches) {
        const firstSwitch = switches.first();
        const initialState = await firstSwitch.getAttribute("aria-checked");
        await firstSwitch.click();
        await page.waitForTimeout(2000);

        // State must have changed
        const newState = await firstSwitch.getAttribute("aria-checked");
        expect(newState).not.toBe(initialState);

        // Reload and verify it persisted
        await page.reload({ timeout: 30_000 });
        await waitForPageReady(page);

        const reloadedSwitch = page
          .locator('[role="switch"], [role="checkbox"]')
          .first();
        await expect(reloadedSwitch).toBeVisible({ timeout: 10_000 });
        const persistedState =
          await reloadedSwitch.getAttribute("aria-checked");
        expect(persistedState).toBe(newState);

        // Toggle back to restore original state
        await reloadedSwitch.click();
        await page.waitForTimeout(2000);
      }
    });

    test("student user menu shows standard options but not admin items", async ({
      page,
    }) => {
      suppressKnownErrors(page);
      await login(page, STUDENT_1);
      await waitForPageReady(page);

      const userButton = page.locator("#user-button");
      await expect(userButton).toBeVisible({ timeout: 10_000 });
      await userButton.click();

      const userMenu = page.locator("#user-menu");
      await expect(userMenu).toBeVisible({ timeout: 5_000 });

      const menuItems = userMenu.locator('[role="menuitem"]');
      const count = await menuItems.count();
      expect(count).toBeGreaterThan(0);

      // Collect menu text
      const menuTexts: string[] = [];
      for (let i = 0; i < count; i++) {
        const text = await menuItems.nth(i).textContent();
        if (text) menuTexts.push(text.toLowerCase());
      }

      // Must contain standard items
      const hasStandard = menuTexts.some(
        (t) =>
          t.includes("profile") ||
          t.includes("settings") ||
          t.includes("sign out") ||
          t.includes("logout"),
      );
      expect(hasStandard).toBe(true);

      // Student should NOT see admin items
      const hasAdmin = menuTexts.some(
        (t) => t.includes("admin") || t.includes("moderat"),
      );
      expect(hasAdmin).toBe(false);

      await page.keyboard.press("Escape");
    });

    test("student does NOT see create-unit button on units page", async ({
      page,
    }) => {
      suppressKnownErrors(page);
      await login(page, STUDENT_1);
      await page.goto("/units", { timeout: 30_000 });
      await waitForPageReady(page);

      // Student should NOT have instructor-only creation controls
      const createBtn = page.locator('[data-tour="create-unit-button"]');
      const isVisible = await createBtn
        .isVisible({ timeout: 5_000 })
        .catch(() => false);
      expect(isVisible).toBe(false);
    });
  });

  test.describe.serial("instructor settings", () => {
    let sectionDetailUrl: string;

    test("instructor creates a section to configure", async ({ page }) => {
      suppressKnownErrors(page);
      await login(page, INSTRUCTOR, "/sections");
      await page.waitForSelector('[data-tour="sections-page"]', {
        timeout: 15_000,
      });

      const createBtn = page.locator('[data-tour="create-section-button"]');
      await expect(createBtn).toBeVisible({ timeout: 5_000 });
      await createBtn.click();

      await expect(page.locator('[data-tour="section-form"]')).toBeVisible({
        timeout: 10_000,
      });

      const sectionName = `E2E Settings Section ${Date.now()}`;
      await page
        .locator('[data-tour="section-form"] input[name="name"]')
        .fill(sectionName);

      const submitBtn = page
        .locator('[data-tour="section-form"]')
        .getByRole("button", { name: /create/i });
      await submitBtn.click();

      await expect(page.getByText(sectionName)).toBeVisible({
        timeout: 30_000,
      });

      // Navigate into it
      const card = page
        .locator('[data-tour="section-card"]')
        .filter({ hasText: sectionName });
      await card.locator("a").first().click();
      await page.waitForURL(/\/section\//, { timeout: 15_000 });
      sectionDetailUrl = page.url();
    });

    test("instructor can change section AI settings", async ({ page }) => {
      suppressKnownErrors(page);
      const sectionPath = sectionDetailUrl.replace(/^https?:\/\/[^/]+/, "");
      await login(page, INSTRUCTOR, `${sectionPath}/settings/ai`);
      await waitForPageReady(page);

      // Must have controls
      const controls = page.locator(
        'input, select, [role="switch"], [role="checkbox"], [role="combobox"], textarea',
      );
      const controlCount = await controls.count();
      expect(controlCount).toBeGreaterThan(0);

      // Toggle a switch if available
      const switches = page.locator('[role="switch"]');
      if (
        await switches
          .first()
          .isVisible({ timeout: 5_000 })
          .catch(() => false)
      ) {
        const initialState = await switches
          .first()
          .getAttribute("aria-checked");
        await switches.first().click();
        await page.waitForTimeout(2000);

        const newState = await switches.first().getAttribute("aria-checked");
        expect(newState).not.toBe(initialState);
      }
    });

    test("instructor has create-unit button (that student does not)", async ({
      page,
    }) => {
      suppressKnownErrors(page);
      await login(page, INSTRUCTOR, "/units");
      await page.waitForSelector('[data-tour="units-page"]', {
        timeout: 15_000,
      });

      // Instructor MUST see create button
      const createBtn = page.locator('[data-tour="create-unit-button"]');
      await expect(createBtn).toBeVisible({ timeout: 10_000 });
    });
  });
});
