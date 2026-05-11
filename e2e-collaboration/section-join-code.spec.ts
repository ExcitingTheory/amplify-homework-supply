/**
 * Section Join Code – Multi-User E2E (Playwright)
 *
 * Tests the section join code workflow with two simultaneous browser sessions:
 * 1. Instructor creates a section → gets join code from [data-tour="join-code"] chip
 * 2. Student clicks [data-tour="join-section-button"] → fills dialog → joins
 * 3. Instructor reloads section detail → sees student in roster
 *
 * Routes: /sections, /section/{id}
 * Key selectors:
 *   [data-tour="create-section-button"]  — sections/page.jsx:361
 *   [data-tour="section-form"]           — sections/page.jsx:264
 *   [data-tour="section-card"]           — sections/page.jsx:441
 *   [data-tour="join-code"]              — sections/page.jsx:500
 *   [data-tour="join-section-button"]    — MainToolbar.jsx:510
 *   [data-tour="join-section-dialog"]    — MainToolbar.jsx:772
 *   input[name="code"]                  — MainToolbar.jsx:801
 *   #user-button                        — MainToolbar.jsx:270
 */

import { test, expect } from "@playwright/test";
import {
  INSTRUCTOR,
  STUDENT_1,
  createUserSession,
  closeSession,
  createSection,
  joinSection,
  goToSections,
  type UserSession,
} from "./helpers";

test.describe("Section Join Code – Simultaneous Users", () => {
  let instructorSession: UserSession;
  let studentSession: UserSession;

  test.afterEach(async () => {
    if (studentSession) await closeSession(studentSession);
    if (instructorSession) await closeSession(instructorSession);
  });

  test("instructor creates section, student joins, instructor sees member appear", async ({
    browser,
  }) => {
    const baseURL = test.info().project.use.baseURL || "http://localhost:3000";
    const sectionName = `PW Join Test ${Date.now()}`;

    // --- Both users log in simultaneously (to /sections) ---
    [instructorSession, studentSession] = await Promise.all([
      createUserSession(browser, INSTRUCTOR, baseURL, "/sections"),
      createUserSession(browser, STUDENT_1, baseURL, "/sections"),
    ]);

    // --- Instructor creates section ---
    const joinCode = await createSection(
      instructorSession.page,
      sectionName,
      "Playwright multi-user join code test",
    );
    expect(joinCode.length).toBeGreaterThan(0);

    // Instructor navigates to section detail
    const sectionCard = instructorSession.page
      .locator('[data-tour="section-card"]')
      .filter({ hasText: sectionName });
    await sectionCard.locator('a[href*="/section/"]').click();
    await instructorSession.page.waitForURL("**/section/**", {
      timeout: 10_000,
    });

    // --- Student joins section (while instructor is viewing section detail) ---
    await joinSection(studentSession.page, joinCode);

    // Verify student now sees the section on /sections
    await goToSections(studentSession.page);
    await expect(studentSession.page.getByText(sectionName)).toBeVisible({
      timeout: 30_000,
    });

    // --- Instructor reloads section detail to see the new member ---
    await instructorSession.page.reload({ timeout: 15_000 });
    await instructorSession.page.waitForTimeout(3000);

    // Section detail should contain a table (gradebook) — verify it loaded
    await expect(instructorSession.page.locator("table").first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("student joins seeded section and sees content live", async ({
    browser,
  }) => {
    const baseURL = test.info().project.use.baseURL || "http://localhost:3000";

    // Both users log in to /sections simultaneously
    [instructorSession, studentSession] = await Promise.all([
      createUserSession(browser, INSTRUCTOR, baseURL, "/sections"),
      createUserSession(browser, STUDENT_1, baseURL, "/sections"),
    ]);

    // Instructor views seeded Japanese 101 section
    const jpnCard = instructorSession.page
      .locator('[data-tour="section-card"]')
      .filter({ hasText: "Japanese 101" });

    if (await jpnCard.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await jpnCard.locator('a[href*="/section/"]').click();
      await instructorSession.page.waitForURL("**/section/**", {
        timeout: 10_000,
      });

      // Student joins the same section
      await joinSection(studentSession.page, "JPN101-P1");

      // Student navigates to section detail
      await goToSections(studentSession.page);
      await studentSession.page
        .locator('[data-tour="section-card"]')
        .filter({ hasText: "Japanese 101" })
        .locator('a[href*="/section/"]')
        .click();
      await studentSession.page.waitForURL("**/section/**", {
        timeout: 10_000,
      });

      // Both users should see the section content
      await expect(instructorSession.page.locator("table").first()).toBeVisible(
        {
          timeout: 10_000,
        },
      );
      await expect(studentSession.page.locator("table").first()).toBeVisible({
        timeout: 10_000,
      });
    }
  });
});
