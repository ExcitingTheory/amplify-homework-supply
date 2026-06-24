/**
 * Journey 5: Instructor — Create & Manage Sections
 *
 * Creates all state from scratch:
 * 1. Creates a section — verifies join code generation
 * 2. Verifies section appears in list
 * 3. Navigates into section detail — verifies roster structure
 * 4. Verifies AI settings page renders interactive controls
 * 5. Verifies gamification settings page renders controls
 *
 * Every step FAILS if section management is broken.
 */

import { test, expect } from "./fixtures";
import {
  INSTRUCTOR,
  login,
  suppressKnownErrors,
  waitForPageReady,
} from "./helpers";

test.describe.serial("Journey 5: Instructor — Create & Manage Sections", () => {
  let sectionName: string;
  let sectionCode: string;
  let sectionDetailUrl: string;

  test("creating a section generates a join code and appears in the list", async ({
    page,
  }) => {
    suppressKnownErrors(page);
    await login(page, INSTRUCTOR, "/sections");
    await page.waitForSelector('[data-tour="sections-page"]', {
      timeout: 15_000,
    });

    // Create section
    const createBtn = page.locator('[data-tour="create-section-button"]');
    await expect(createBtn).toBeVisible({ timeout: 5_000 });
    await createBtn.click();

    await expect(page.locator('[data-tour="section-form"]')).toBeVisible({
      timeout: 10_000,
    });

    sectionName = `E2E Manage Section ${Date.now()}`;
    await page
      .locator('[data-tour="section-form"] input[name="name"]')
      .fill(sectionName);

    const submitBtn = page
      .locator('[data-tour="section-form"]')
      .getByRole("button", { name: /create/i });
    await submitBtn.click();

    // Section must appear in the list (DB write + subscription)
    await expect(page.getByText(sectionName)).toBeVisible({ timeout: 30_000 });

    // Must have auto-generated join code
    const card = page
      .locator('[data-tour="section-card"]')
      .filter({ hasText: sectionName });
    const joinCodeEl = card.locator('[data-tour="join-code"]');
    await expect(joinCodeEl).toBeVisible({ timeout: 10_000 });
    sectionCode = (await joinCodeEl.textContent())!.trim();
    expect(sectionCode.length).toBeGreaterThanOrEqual(4);
  });

  test("section detail page shows roster table structure", async ({ page }) => {
    suppressKnownErrors(page);
    await login(page, INSTRUCTOR, "/sections");
    await page.waitForSelector('[data-tour="sections-page"]', {
      timeout: 15_000,
    });

    // Navigate into the created section
    const card = page
      .locator('[data-tour="section-card"]')
      .filter({ hasText: sectionName });
    await expect(card).toBeVisible({ timeout: 15_000 });
    await card.locator("a").first().click();
    await page.waitForURL(/\/section\//, { timeout: 15_000 });
    sectionDetailUrl = page.url();
    await waitForPageReady(page);

    // Section card must render
    await expect(page.locator('[data-tour="section-card"]')).toBeVisible({
      timeout: 15_000,
    });

    // Join code must be visible on detail page too
    const joinCode = page.locator('[data-tour="join-code"]');
    await expect(joinCode).toBeVisible({ timeout: 10_000 });
    const displayedCode = (await joinCode.textContent())!.trim();
    expect(displayedCode).toBe(sectionCode);

    // Table must exist (roster/gradebook)
    const table = page.locator("table").first();
    await expect(table).toBeVisible({ timeout: 15_000 });

    // Table must have header columns
    const headers = table.locator("th, thead td");
    const headerCount = await headers.count();
    expect(headerCount).toBeGreaterThan(0);
  });

  test("section AI settings page has interactive controls", async ({
    page,
  }) => {
    suppressKnownErrors(page);
    const sectionPath = sectionDetailUrl.replace(/^https?:\/\/[^/]+/, "");
    await login(page, INSTRUCTOR, `${sectionPath}/settings/ai`);
    await waitForPageReady(page);

    // Must have heading
    const heading = page.getByRole("heading");
    await expect(heading.first()).toBeVisible({ timeout: 10_000 });

    // Must have interactive controls (not just text)
    const controls = page.locator(
      'input, select, [role="switch"], [role="checkbox"], [role="combobox"], textarea',
    );
    const controlCount = await controls.count();
    expect(controlCount).toBeGreaterThan(0);
  });

  test("section gamification settings page has interactive controls", async ({
    page,
  }) => {
    suppressKnownErrors(page);
    const sectionPath = sectionDetailUrl.replace(/^https?:\/\/[^/]+/, "");
    await login(page, INSTRUCTOR, `${sectionPath}/settings/gamification`);
    await waitForPageReady(page);

    const heading = page.getByRole("heading");
    await expect(heading.first()).toBeVisible({ timeout: 10_000 });

    const controls = page.locator(
      'input, select, [role="switch"], [role="checkbox"], [role="slider"], button',
    );
    const controlCount = await controls.count();
    expect(controlCount).toBeGreaterThan(1);
  });
});
