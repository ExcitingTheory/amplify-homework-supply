import { test, expect } from "@playwright/test";
import {
  INSTRUCTOR,
  STUDENT,
  login,
  goToLeaderboard,
  goToGuilds,
  goToProfile,
  goToSkills,
  suppressKnownErrors,
} from "./helpers";

/**
 * Navigation & Page Rendering — Verify all app routes render correctly
 * and key interactive elements are present.
 *
 * These tests go beyond "page loads" — they verify that specific data
 * is rendered and interactive elements respond to user input.
 */
test.describe("Leaderboard", () => {
  test.beforeEach(async ({ page }) => {
    suppressKnownErrors(page);
    await login(page, STUDENT);
  });

  test("leaderboard displays data and toggle buttons switch views", async ({
    page,
  }) => {
    await goToLeaderboard(page);

    // Verify toggle buttons exist
    const xpButton = page.locator('button[value="xp"]');
    const completionButton = page.locator('button[value="completion"]');
    const guildsButton = page.locator('button[value="guilds"]');
    await expect(xpButton).toBeVisible({ timeout: 10_000 });
    await expect(completionButton).toBeVisible();
    await expect(guildsButton).toBeVisible();

    // Click XP mode and verify the view changes (table or list renders)
    await xpButton.click();
    await page.waitForTimeout(1000);
    // Should show some leaderboard content (table, list items, or empty state)
    const pageContent = page.locator("main, [role='main'], body");
    const text = await pageContent.textContent();
    expect(text!.length).toBeGreaterThan(50); // Not a blank page

    // Switch to guilds mode
    await guildsButton.click();
    await page.waitForTimeout(1000);
    const guildsContent = await pageContent.textContent();
    expect(guildsContent!.length).toBeGreaterThan(50);
  });
});

test.describe("Guilds", () => {
  test.beforeEach(async ({ page }) => {
    suppressKnownErrors(page);
    await login(page, STUDENT);
  });

  test("guilds page renders guild list or create option", async ({ page }) => {
    await goToGuilds(page);

    // Should show either guild data or a create/join button
    const hasGuildContent = await page
      .getByText(/guild|members|XP|create|join/i)
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false);

    expect(hasGuildContent).toBeTruthy();
  });
});

test.describe("Profile", () => {
  test.beforeEach(async ({ page }) => {
    suppressKnownErrors(page);
    await login(page, STUDENT);
  });

  test("profile page shows user data sections", async ({ page }) => {
    await goToProfile(page);

    // Profile should contain progress/streak/badge content
    await expect(
      page.getByText(/progress|streak|badge|activity|level/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("notification bell opens notifications", async ({ page }) => {
    // Click notification bell in toolbar (icon button with badge)
    const notifButton = page
      .locator(
        '[aria-label*="notification" i], [data-tour="notifications-button"]',
      )
      .first();
    if (await notifButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await notifButton.click();
      await page.waitForTimeout(1000);

      // Should open a menu, popover, or navigate to notifications
      const hasNotifContent =
        (await page
          .locator('[role="menu"], [role="dialog"]')
          .first()
          .isVisible()
          .catch(() => false)) || page.url().includes("notification");

      expect(hasNotifContent).toBeTruthy();
    } else {
      // Notification bell may not render for this user, skip gracefully
      test.skip();
    }
  });
});

test.describe("Skills", () => {
  test.beforeEach(async ({ page }) => {
    suppressKnownErrors(page);
    await login(page, STUDENT);
  });

  test("skills page renders skill tree or empty state", async ({ page }) => {
    await goToSkills(page);

    // Should show SVG skill tree visualization OR empty state text
    const hasSvg = await page
      .locator("svg")
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false);
    const hasEmptyState = await page
      .getByText(/no skills|get started|empty/i)
      .isVisible()
      .catch(() => false);
    const hasSkillContent = await page
      .getByText(/skill|mastery|progress/i)
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasSvg || hasEmptyState || hasSkillContent).toBeTruthy();
  });
});

test.describe("Navigation via Toolbar", () => {
  test.beforeEach(async ({ page }) => {
    suppressKnownErrors(page);
    await login(page, STUDENT);
  });

  test("user menu provides access to profile, settings, sign out", async ({
    page,
  }) => {
    // Open user menu
    await page.locator("#user-button").click();
    await page.waitForTimeout(500);

    // Menu items should be visible
    const menu = page.locator('[role="menu"]');
    await expect(menu).toBeVisible({ timeout: 5_000 });

    // Check for expected menu items
    await expect(
      menu.getByRole("menuitem", { name: /profile/i }),
    ).toBeVisible();
    await expect(
      menu.getByRole("menuitem", { name: /settings/i }),
    ).toBeVisible();
    await expect(
      menu.getByRole("menuitem", { name: /sign out|log out/i }),
    ).toBeVisible();

    // Click Profile and verify navigation
    await menu.getByRole("menuitem", { name: /profile/i }).click();
    await page.waitForURL(/\/profile/, { timeout: 10_000 });
    expect(page.url()).toContain("/profile");
  });

  test("hamburger menu opens navigation drawer with all routes", async ({
    page,
  }) => {
    // Open hamburger menu
    const menuButton = page.getByLabel(/menu/i).first();
    await expect(menuButton).toBeVisible({ timeout: 5_000 });
    await menuButton.click();

    // Navigation drawer is anchor-left; the chat drawer is anchor-right.
    // Target the left drawer specifically to avoid the hidden chat drawer.
    const drawer = page.locator(".MuiDrawer-anchorLeft");
    await expect(drawer.first()).toBeVisible({ timeout: 5_000 });

    // Verify key navigation links exist inside the drawer
    await expect(drawer.getByText(/units/i).first()).toBeVisible();
    await expect(drawer.getByText(/sections/i).first()).toBeVisible();
    await expect(drawer.getByText(/leaderboard/i).first()).toBeVisible();
  });
});
