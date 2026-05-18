import {
  type Page,
  type BrowserContext,
  type Browser,
  expect,
} from "@playwright/test";

// ---------------------------------------------------------------------------
// Test Users
// ---------------------------------------------------------------------------

export const INSTRUCTOR = {
  username: process.env.TEACHER_USERNAME || "instructor1@example.com",
  password: process.env.TEACHER_PASSWORD || "TestPassword123!",
};

export const STUDENT = {
  username: process.env.LEARNER_USERNAME || "student1@example.com",
  password: process.env.LEARNER_PASSWORD || "TestPassword123!",
};

export type TestUser = { username: string; password: string };

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

/**
 * Log in via the Amplify Authenticator modal.
 * After login completes, the user sees the authenticated page.
 */
export async function login(
  page: Page,
  user: TestUser,
  targetPath = "/",
): Promise<void> {
  const baseURL = page.context()._options?.baseURL || "https://localhost:3000";
  await page.goto(targetPath, { timeout: 30_000 });

  await page.waitForSelector('input[name="username"]', { timeout: 20_000 });
  await page.locator('input[name="username"]').fill(user.username);
  await page.locator('input[name="password"]').fill(user.password);
  await page.locator('button[type="submit"]').first().click();

  // #user-button in MainToolbar confirms login
  await page.waitForSelector("#user-button", { timeout: 30_000 });
  await page.waitForTimeout(500);
}

/**
 * Log out the current user via the user menu.
 */
export async function logout(page: Page): Promise<void> {
  await page.locator("#user-button").click();
  await page.waitForTimeout(300);

  const signOutBtn = page.getByRole("menuitem", { name: /sign out|log out/i });
  await signOutBtn.click();

  // Verify we're back at the login screen
  await page.waitForSelector('input[name="username"]', { timeout: 15_000 });
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

export async function goToUnits(page: Page): Promise<void> {
  await page.goto("/units");
  await page.waitForSelector('[data-tour="units-page"]', { timeout: 15_000 });
  await page
    .waitForLoadState("networkidle", { timeout: 10_000 })
    .catch(() => {});
}

export async function goToSections(page: Page): Promise<void> {
  await page.goto("/sections");
  await page.waitForSelector('[data-tour="sections-page"]', {
    timeout: 15_000,
  });
  await page
    .waitForLoadState("networkidle", { timeout: 10_000 })
    .catch(() => {});
}

export async function goToSettings(page: Page): Promise<void> {
  await page.goto("/settings");
  await page
    .waitForLoadState("networkidle", { timeout: 10_000 })
    .catch(() => {});
}

export async function goToLeaderboard(page: Page): Promise<void> {
  await page.goto("/leaderboard");
  await page
    .waitForLoadState("networkidle", { timeout: 10_000 })
    .catch(() => {});
}

export async function goToGuilds(page: Page): Promise<void> {
  await page.goto("/guilds");
  await page
    .waitForLoadState("networkidle", { timeout: 10_000 })
    .catch(() => {});
}

export async function goToProfile(page: Page): Promise<void> {
  await page.goto("/profile");
  await page
    .waitForLoadState("networkidle", { timeout: 10_000 })
    .catch(() => {});
}

export async function goToSkills(page: Page): Promise<void> {
  await page.goto("/skills");
  await page
    .waitForLoadState("networkidle", { timeout: 10_000 })
    .catch(() => {});
}

export async function goToXpHistory(page: Page): Promise<void> {
  await page.goto("/xp-history");
  await page
    .waitForLoadState("networkidle", { timeout: 10_000 })
    .catch(() => {});
}

// ---------------------------------------------------------------------------
// Common Assertions
// ---------------------------------------------------------------------------

/**
 * Suppress known benign console errors.
 */
export function suppressKnownErrors(page: Page): void {
  page.on("pageerror", (err) => {
    const msg = err.message;
    if (
      msg.includes("Cannot read properties of null") ||
      msg.includes("i18next") ||
      msg.includes("useTranslation") ||
      msg.includes("Hydration failed") ||
      msg.includes("exceeds maximum value limit") ||
      msg.includes("Maximum update depth exceeded") ||
      msg.includes("No current user") ||
      msg.includes("not authenticated") ||
      msg.includes("DuplicatedOperationError")
    ) {
      return;
    }
    console.warn(`[E2E] Page error:`, msg);
  });
}
