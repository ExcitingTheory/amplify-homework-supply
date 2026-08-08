import { test, expect } from "@playwright/test";
import {
  INSTRUCTOR,
  STUDENT,
  login,
  goToSections,
  suppressKnownErrors,
} from "./helpers";

/**
 * Sections — Create, join via code, and verify membership.
 *
 * Covers: instructor creates section with form, verifies it appears,
 * student joins via join code, section membership verified.
 */
test.describe("Section Management", () => {
  test.beforeEach(async ({ page }) => {
    suppressKnownErrors(page);
  });

  test("instructor creates a section with name and description", async ({
    page,
  }) => {
    await login(page, INSTRUCTOR, "/sections");

    const sectionName = `E2E Section ${Date.now()}`;

    // Click create section button
    await page.locator('[data-tour="create-section-button"]').click();
    await page.waitForSelector('[data-tour="section-form"]', {
      timeout: 10_000,
    });

    // Fill in section details
    await page
      .locator('[data-tour="section-form"] input[name="name"]')
      .fill(sectionName);
    await page
      .locator('[data-tour="section-form"] textarea[name="description"]')
      .fill("Created by Playwright E2E test");

    // Submit
    await page
      .locator('[data-tour="section-form"]')
      .getByRole("button", { name: /create/i })
      .click();

    // Verify section appears in the list (subscription delivers it)
    await expect(page.getByText(sectionName)).toBeVisible({ timeout: 30_000 });

    // Verify join code is displayed on the section card
    const sectionCard = page
      .locator('[data-tour="section-card"]')
      .filter({ hasText: sectionName });
    await expect(sectionCard).toBeVisible();
    const joinCodeEl = sectionCard.locator('[data-tour="join-code"]');
    await expect(joinCodeEl).toBeVisible({ timeout: 5_000 });
    const joinCode = await joinCodeEl.textContent();
    expect(joinCode!.trim().length).toBeGreaterThan(3);
  });

  test("student joins section using join code", async ({ page }) => {
    // First: instructor creates a section to get a join code
    await login(page, INSTRUCTOR, "/sections");

    const sectionName = `E2E Join Test ${Date.now()}`;
    await page.locator('[data-tour="create-section-button"]').click();
    await page.waitForSelector('[data-tour="section-form"]', {
      timeout: 10_000,
    });
    await page
      .locator('[data-tour="section-form"] input[name="name"]')
      .fill(sectionName);
    await page
      .locator('[data-tour="section-form"] textarea[name="description"]')
      .fill("Join code test");
    await page
      .locator('[data-tour="section-form"]')
      .getByRole("button", { name: /create/i })
      .click();
    await expect(page.getByText(sectionName)).toBeVisible({ timeout: 30_000 });

    // Extract join code
    const sectionCard = page
      .locator('[data-tour="section-card"]')
      .filter({ hasText: sectionName });
    const joinCode = (await sectionCard
      .locator('[data-tour="join-code"]')
      .textContent())!.trim();

    // Log out instructor, log in as student
    await page.locator("#user-button").click();
    const signOutBtn = page.getByRole("menuitem", { name: /sign out|log out/i });
    await expect(signOutBtn).toBeVisible({ timeout: 5_000 });
    await signOutBtn.click();
    await page.waitForSelector('input[name="username"]', { timeout: 15_000 });

    await login(page, STUDENT, "/sections");

    // Student uses join code via toolbar button
    await page.locator('[data-tour="join-section-button"]').click();
    await page.waitForSelector('[data-tour="join-section-dialog"]', {
      timeout: 10_000,
    });
    await page
      .locator('[data-tour="join-section-dialog"] input[name="code"]')
      .fill(joinCode);
    await page
      .locator('[data-tour="join-section-dialog"] button[type="submit"]')
      .click();

    // Wait for join to complete (auth refresh + page reload)
    await page
      .waitForResponse(
        (resp) => resp.url().includes("graphql") && resp.status() === 200,
        { timeout: 15_000 },
      )
      .catch(() => {});
    await page.waitForSelector("#user-button", { timeout: 20_000 });

    // Navigate to sections and verify the section appears
    await goToSections(page);
    await expect(page.getByText(sectionName)).toBeVisible({ timeout: 15_000 });
  });

  test("section card links to section detail page", async ({ page }) => {
    await login(page, INSTRUCTOR, "/sections");

    // Click first section card link
    const sectionCard = page.locator('[data-tour="section-card"]').first();
    await expect(sectionCard).toBeVisible({ timeout: 15_000 });

    const sectionLink = sectionCard.locator('a[href*="/section/"]');
    await expect(sectionLink).toBeVisible();
    await sectionLink.click();

    // Should navigate to section detail page
    await page.waitForURL(/\/section\/[a-f0-9-]+/, { timeout: 15_000 });
    expect(page.url()).toMatch(/\/section\/[a-f0-9-]+/);
  });
});
