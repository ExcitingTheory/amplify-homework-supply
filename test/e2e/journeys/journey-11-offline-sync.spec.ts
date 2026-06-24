/**
 * Journey 11: Offline Readiness & Sync Recovery
 *
 * Creates its own state:
 * 1. Instructor creates a unit with content
 * 2. Student navigates to the workbook (primes SW cache)
 * 3. Verifies service worker is active
 * 4. Goes offline — verifies fallback page renders
 * 5. Verifies cached resources exist
 * 6. Reconnects — verifies app recovers
 *
 * Every step FAILS if offline/PWA features are broken.
 */

import { test, expect } from "./fixtures";
import {
  INSTRUCTOR,
  STUDENT_1,
  login,
  suppressKnownErrors,
  waitForPageReady,
} from "./helpers";

test.describe.serial("Journey 11: Offline Readiness & Sync Recovery", () => {
  let unitId: string;

  // ─── SETUP: Create content to cache ──────────────────────────────────

  test("instructor creates a unit with content for caching", async ({
    browser,
  }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    suppressKnownErrors(page);
    await login(page, INSTRUCTOR, "/units");
    await page.waitForSelector('[data-tour="units-page"]', { timeout: 15_000 });

    await page.locator('[data-tour="create-unit-button"]').first().click();
    await page.waitForURL(/\/unit\/[a-f0-9-]+/, { timeout: 15_000 });
    unitId = page.url().match(/\/unit\/([a-f0-9-]+)/)![1];

    await page.waitForSelector('[data-lexical-editor="true"]', {
      timeout: 15_000,
    });
    await page.waitForTimeout(2000);

    const editor = page.locator('[data-lexical-editor="true"]').first();
    await editor.click();
    await page.keyboard.type(
      `Offline test content - This should be cached by the service worker ${Date.now()}`,
    );

    await page.waitForTimeout(4000);
    await ctx.close();
  });

  // ─── STUDENT: Test offline behavior ──────────────────────────────────

  test("service worker is active and controls the page", async ({
    page,
    context,
  }) => {
    suppressKnownErrors(page);
    await context.setOffline(false);
    await login(page, STUDENT_1);
    await waitForPageReady(page);

    // SW must be registered and controlling
    const isControlled = await page.evaluate(async () => {
      if (!("serviceWorker" in navigator)) return false;
      await navigator.serviceWorker.ready;
      return !!navigator.serviceWorker.controller;
    });
    expect(isControlled).toBe(true);

    // Playwright must see the SW
    let workers = context.serviceWorkers();
    if (workers.length === 0) {
      await context.waitForEvent("serviceworker", { timeout: 15_000 });
      workers = context.serviceWorkers();
    }
    expect(workers.length).toBeGreaterThan(0);
  });

  test("student visits workbook to prime the cache", async ({
    page,
    context,
  }) => {
    suppressKnownErrors(page);
    await context.setOffline(false);
    await login(page, STUDENT_1);

    await page.goto(`/workbook/${unitId}`, { timeout: 30_000 });
    await page.waitForTimeout(5000); // Let SW cache resources

    // Handle timer gate
    const startButton = page.getByRole("button", { name: /start/i });
    if (await startButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await startButton.click();
      await page.waitForTimeout(2000);
    }

    // Content must have loaded online (confirms URL is valid)
    const bodyText = await page.locator("body").textContent();
    expect(bodyText!.length).toBeGreaterThan(100);
  });

  test("offline fallback page renders with user guidance", async ({
    page,
    context,
  }) => {
    suppressKnownErrors(page);
    await context.setOffline(false);
    await login(page, STUDENT_1);
    await waitForPageReady(page);

    // Go offline
    await context.setOffline(true);

    await page.goto("/offline", {
      timeout: 30_000,
      waitUntil: "domcontentloaded",
    });

    // Must show offline heading
    await expect(page.getByRole("heading", { name: /offline/i })).toBeVisible({
      timeout: 10_000,
    });

    // Must reassure user
    await expect(page.getByText(/saved work is safe/i)).toBeVisible({
      timeout: 10_000,
    });

    // Must provide a retry/refresh action
    const hasAction =
      (await page
        .getByRole("button", { name: /retry|refresh|try again/i })
        .isVisible({ timeout: 5_000 })
        .catch(() => false)) ||
      (await page
        .getByText(/reconnect|try again|refresh/i)
        .isVisible({ timeout: 3_000 })
        .catch(() => false));
    expect(hasAction).toBe(true);

    await context.setOffline(false);
  });

  test("service worker has cached app shell resources", async ({
    page,
    context,
  }) => {
    suppressKnownErrors(page);
    await context.setOffline(false);
    await login(page, STUDENT_1);
    await waitForPageReady(page);

    const cacheInfo = await page.evaluate(async () => {
      const cacheNames = await caches.keys();
      if (cacheNames.length === 0) return { hasCaches: false, totalEntries: 0 };

      let totalEntries = 0;
      for (const name of cacheNames) {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        totalEntries += keys.length;
      }
      return {
        hasCaches: true,
        totalEntries,
        cacheCount: cacheNames.length,
      };
    });

    // Must have active caches
    expect(cacheInfo.hasCaches).toBe(true);
    // Must have cached multiple resources
    expect(cacheInfo.totalEntries).toBeGreaterThan(5);
  });

  test("app recovers after going offline and back online", async ({
    page,
    context,
  }) => {
    suppressKnownErrors(page);
    await context.setOffline(false);
    await login(page, STUDENT_1);
    await waitForPageReady(page);

    // Go offline
    await context.setOffline(true);
    await page.waitForTimeout(3000);

    // Come back online
    await context.setOffline(false);
    await page.waitForTimeout(2000);

    // Navigate to verify app works
    await page.goto("/", { timeout: 30_000 });
    await waitForPageReady(page);

    // User button confirms auth is still valid
    await expect(page.locator("#user-button")).toBeVisible({ timeout: 15_000 });
  });
});
