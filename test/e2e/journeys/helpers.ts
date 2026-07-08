import { type Page, expect } from "@playwright/test";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// ---------------------------------------------------------------------------
// Test Users
// ---------------------------------------------------------------------------

function requirePassword(envVar: string): string {
  const value = process.env[envVar] || process.env.TEST_USER_PASSWORD;
  if (!value)
    throw new Error(
      `${envVar} or TEST_USER_PASSWORD env var is required for E2E tests`,
    );
  return value;
}

export const ADMIN = {
  username:
    process.env.ADMIN_USERNAME ||
    process.env.CRAWL_ADMIN_USERNAME ||
    "admin@example.com",
  password: requirePassword("TEST_USER_PASSWORD"),
};

export const INSTRUCTOR = {
  username:
    process.env.TEACHER_USERNAME ||
    process.env.CRAWL_INSTRUCTOR_USERNAME ||
    "instructor1@example.com",
  password: requirePassword("TEST_USER_PASSWORD"),
};

export const STUDENT_1 = {
  username:
    process.env.LEARNER_USERNAME ||
    process.env.CRAWL_LEARNER_USERNAME ||
    "student1@example.com",
  password: requirePassword("TEST_USER_PASSWORD"),
};

export const STUDENT_2 = {
  username: "student2@example.com",
  password: requirePassword("TEST_USER_PASSWORD"),
};

export type TestUser = { username: string; password: string };

// ---------------------------------------------------------------------------
// Seed Data Fixture
// ---------------------------------------------------------------------------

export interface SeedData {
  users: {
    admin: { username: string; sub: string };
    instructor1: { username: string; sub: string; identityId: string };
    student1: { username: string; sub: string; identityId: string };
    student2: { username: string };
  };
  units: Array<{ id: string; name: string; status: string }>;
  sections: Array<{ id: string; name: string; code: string }>;
  assignments: Array<{ id: string; sectionID: string; unitID: string }>;
  grades: Array<{
    id: string;
    unitID: string;
    sectionID: string;
    complete: boolean;
  }>;
  squads: Array<{ id: string; name: string }>;
  skills: Array<{ id: string; title: string }>;
  badges: Array<{ id: string; title: string; category: string }>;
  xpLogs: Array<{
    id: string;
    studentId: string;
    xpAmount: number;
    reason: string;
  }>;
  challenges: Array<{
    id: string;
    title: string;
    chapterOrder: number;
    active: boolean;
  }>;
  notifications: Array<{
    id: string;
    type: string;
    category: string;
    title: string;
  }>;
  easterEggs: Array<{ id: string; trigger: string; triggerValue: string }>;
  practiceSessions: Array<{
    id: string;
    unitID: string;
    drillType: string;
    complete: boolean;
  }>;
  homeworkRoom: { id: string; code: string } | null;
}

let _seedData: SeedData | null = null;

export function loadSeedData(): SeedData {
  if (_seedData) return _seedData;

  const fixturePath = resolve(__dirname, "../../integration/seed-data.json");
  if (!existsSync(fixturePath)) {
    throw new Error(
      `Seed data not found at ${fixturePath}. Run \`npx ampx sandbox seed\` first.`,
    );
  }
  _seedData = JSON.parse(readFileSync(fixturePath, "utf8"));
  return _seedData!;
}

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

/**
 * Log in via the Amplify Authenticator modal.
 */
export async function login(
  page: Page,
  user: TestUser,
  targetPath = "/",
): Promise<void> {
  const loginPath =
    targetPath && targetPath !== "/"
      ? `/?returnUrl=${encodeURIComponent(targetPath)}`
      : "/";

  await page.goto(loginPath, {
    timeout: 30_000,
    waitUntil: "domcontentloaded",
  });

  await page.waitForSelector('input[name="username"]', { timeout: 20_000 });
  await page.locator('input[name="username"]').fill(user.username);
  await page.locator('input[name="password"]').fill(user.password);
  await page.locator('button[type="submit"]').first().click();

  // #user-button in MainToolbar confirms login
  await page.waitForSelector("#user-button", { timeout: 30_000 });

  // Amplify Authenticator should honor ?returnUrl, but keep a deterministic
  // fallback for environments where this session key is not applied.
  const currentPath = new URL(page.url()).pathname;
  const wantsRoot = targetPath === "/";
  const onTarget = wantsRoot
    ? currentPath === "/" || currentPath.endsWith("/")
    : currentPath.includes(targetPath);

  if (!onTarget) {
    await page.goto(targetPath, {
      timeout: 30_000,
      waitUntil: "domcontentloaded",
    });
  }

  await page.waitForTimeout(500);
}

// ---------------------------------------------------------------------------
// Known Error Suppression
// ---------------------------------------------------------------------------

export function suppressKnownErrors(page: Page): void {
  page.on("pageerror", (err) => {
    const msg = err.message;
    if (
      msg.includes("Cannot read properties of null") ||
      msg.includes("i18next") ||
      msg.includes("useTranslation") ||
      msg.includes("MISSING_MESSAGE") ||
      msg.includes("Hydration failed") ||
      msg.includes("exceeds maximum value limit") ||
      msg.includes("Maximum update depth exceeded") ||
      msg.includes("No current user") ||
      msg.includes("not authenticated") ||
      msg.includes("DuplicatedOperationError") ||
      msg.includes("Invalid access: Add Yjs type") ||
      msg.includes("S3 save partially failed") ||
      msg.includes("connection error")
    ) {
      return;
    }
    console.warn(`[Journey] Page error:`, msg);
  });
}

// ---------------------------------------------------------------------------
// Navigation Helpers
// ---------------------------------------------------------------------------

export async function waitForPageReady(page: Page): Promise<void> {
  await page
    .waitForLoadState("networkidle", { timeout: 10_000 })
    .catch(() => {});
  await page.waitForTimeout(1000);
}

export async function navigateTo(page: Page, path: string): Promise<void> {
  await page.goto(path, { timeout: 30_000 });
  await waitForPageReady(page);
}
