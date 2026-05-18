import { test, expect } from "@playwright/test";
import {
  INSTRUCTOR,
  STUDENT,
  login,
  logout,
  suppressKnownErrors,
} from "./helpers";

test.describe("Authentication Flows", () => {
  test.beforeEach(async ({ page }) => {
    suppressKnownErrors(page);
  });

  test("instructor can sign in and see authenticated content", async ({
    page,
  }) => {
    await login(page, INSTRUCTOR);

    // Should see the user button (avatar/menu)
    await expect(page.locator("#user-button")).toBeVisible();

    // Should be on an authenticated page (not the login screen)
    await expect(page.locator('input[name="username"]')).not.toBeVisible();
  });

  test("student can sign in and see authenticated content", async ({
    page,
  }) => {
    await login(page, STUDENT);

    await expect(page.locator("#user-button")).toBeVisible();
    await expect(page.locator('input[name="username"]')).not.toBeVisible();
  });

  test("user can sign out", async ({ page }) => {
    await login(page, STUDENT);
    await expect(page.locator("#user-button")).toBeVisible();

    await logout(page);

    // Should be back at login
    await expect(page.locator('input[name="username"]')).toBeVisible();
  });

  test("unauthenticated user sees login form", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('input[name="username"]')).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test("invalid credentials show error message", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('input[name="username"]', { timeout: 20_000 });

    await page.locator('input[name="username"]').fill("invalid@example.com");
    await page.locator('input[name="password"]').fill("WrongPassword1!");
    await page.locator('button[type="submit"]').first().click();

    // Amplify Authenticator shows error text
    await expect(
      page.locator('[class*="amplify-alert"], [data-amplify-error]').first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("protected routes redirect to login", async ({ page }) => {
    // Try accessing a protected route without auth
    await page.goto("/units");

    // Should see the authenticator form (modal or page)
    await expect(page.locator('input[name="username"]')).toBeVisible({
      timeout: 20_000,
    });
  });

  test("session persists across page reload", async ({ page }) => {
    await login(page, INSTRUCTOR);
    await expect(page.locator("#user-button")).toBeVisible();

    // Reload the page
    await page.reload();

    // Should still be authenticated
    await expect(page.locator("#user-button")).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('input[name="username"]')).not.toBeVisible();
  });
});
