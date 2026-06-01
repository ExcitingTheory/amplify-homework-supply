/**
 * Section Join Code – Multi-User E2E
 *
 * Tests the section join flow with two simultaneous sessions:
 * 1. Instructor creates section → gets join code
 * 2. Student joins using the code
 * 3. Instructor sees the student appear in the section roster
 *
 * This tests real-time membership propagation between users.
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

test.describe("Section Join Code", () => {
  let instructorSession: UserSession;
  let studentSession: UserSession;

  test.afterEach(async () => {
    if (studentSession) await closeSession(studentSession);
    if (instructorSession) await closeSession(instructorSession);
  });

  test("instructor creates section, student joins, both see membership", async ({
    browser,
  }) => {
    const baseURL = test.info().project.use.baseURL || "https://localhost:3000";
    const sectionName = `Join Test ${Date.now()}`;

    // Both users log in to /sections simultaneously
    [instructorSession, studentSession] = await Promise.all([
      createUserSession(browser, INSTRUCTOR, baseURL, "/sections"),
      createUserSession(browser, STUDENT_1, baseURL, "/sections"),
    ]);

    // Instructor creates section
    const joinCode = await createSection(
      instructorSession.page,
      sectionName,
      "Multi-user join code test",
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

    // Student joins section using the code
    await joinSection(studentSession.page, joinCode);

    // Student: verify section appears in their sections list
    await goToSections(studentSession.page);
    await expect(
      studentSession.page.getByText(sectionName).first(),
    ).toBeVisible({ timeout: 30_000 });

    // Student: navigate into the section detail
    await studentSession.page
      .locator('[data-tour="section-card"]')
      .filter({ hasText: sectionName })
      .locator('a[href*="/section/"]')
      .click();
    await studentSession.page.waitForURL("**/section/**", { timeout: 10_000 });

    // Verify the section page loaded for the student (not an error page)
    const studentPageContent = await studentSession.page.textContent("body");
    expect(studentPageContent).toContain(sectionName);

    // Instructor: reload to pick up new membership
    await instructorSession.page.reload({ timeout: 15_000 });

    // Instructor's section detail should show gradebook with student
    const gradebookTable = instructorSession.page.locator("table").first();
    await expect(gradebookTable).toBeVisible({ timeout: 15_000 });

    // Verify the student's name appears in the roster/gradebook
    await expect(
      instructorSession.page
        .getByText(STUDENT_1.username.split("@")[0])
        .first(),
    ).toBeVisible({ timeout: 15_000 });
  });
});
