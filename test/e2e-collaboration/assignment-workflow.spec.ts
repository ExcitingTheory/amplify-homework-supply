/**
 * Assignment Workflow – Multi-User E2E
 *
 * Tests the full assignment lifecycle with two simultaneous sessions:
 * Instructor creates content → assigns → Student joins → sees assignment → opens workbook
 *
 * This verifies real cross-user data propagation: content created by
 * the instructor becomes visible and interactive for the student.
 */

import { test, expect } from "@playwright/test";
import {
  INSTRUCTOR,
  STUDENT_1,
  createUserSession,
  closeSession,
  createUnit,
  publishUnit,
  saveUnit,
  addQuizBlock,
  createSection,
  joinSection,
  assignUnitToSection,
  goToSections,
  type UserSession,
} from "./helpers";

test.describe("Assignment Workflow", () => {
  let instructorSession: UserSession;
  let studentSession: UserSession;

  test.afterEach(async () => {
    if (studentSession) await closeSession(studentSession);
    if (instructorSession) await closeSession(instructorSession);
  });

  test("instructor assigns unit, student sees it and opens workbook", async ({
    browser,
  }) => {
    const baseURL = test.info().project.use.baseURL || "https://localhost:3000";
    const sectionName = `Assignment ${Date.now()}`;

    // Both users log in simultaneously
    [instructorSession, studentSession] = await Promise.all([
      createUserSession(browser, INSTRUCTOR, baseURL, "/units"),
      createUserSession(browser, STUDENT_1, baseURL, "/sections"),
    ]);

    // Instructor: create unit with quiz, publish, save
    const unitId = await createUnit(instructorSession.page, "Assignment Unit");
    await addQuizBlock(instructorSession.page);
    await publishUnit(instructorSession.page);
    await saveUnit(instructorSession.page);

    // Instructor: create section and assign unit
    const joinCode = await createSection(
      instructorSession.page,
      sectionName,
      "Assignment test section",
    );
    await assignUnitToSection(instructorSession.page, unitId, sectionName);

    // Student: join section using the code
    await joinSection(studentSession.page, joinCode);

    // Student: navigate to section detail
    await goToSections(studentSession.page);
    const sectionCard = studentSession.page
      .locator('[data-tour="section-card"]')
      .filter({ hasText: sectionName });
    await expect(sectionCard.first()).toBeVisible({ timeout: 15_000 });
    await sectionCard.locator('a[href*="/section/"]').click();
    await studentSession.page.waitForURL("**/section/**", { timeout: 10_000 });

    // Student: verify assignment is visible
    const assignmentArea = studentSession.page.locator(
      '[data-tour="assignment-card"], [data-tour="assignments-section"]',
    );
    await expect(assignmentArea.first()).toBeVisible({ timeout: 15_000 });

    // Student: click workbook button and verify it opens
    const workbookButton = studentSession.page.locator(
      '[data-tour="view-workbook-button"]',
    );
    await expect(workbookButton.first()).toBeVisible({ timeout: 10_000 });
    await workbookButton.first().click();
    await studentSession.page.waitForURL("**/workbook/**", {
      timeout: 20_000,
    });

    // Verify workbook loads with quiz content (content propagated from instructor)
    await expect(
      studentSession.page
        .locator('[data-tour="workbook-content"], [data-tour="workbook"]')
        .first(),
    ).toBeVisible({ timeout: 15_000 });

    await expect(
      studentSession.page.locator('[data-tour="quiz-block"]').first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("instructor creates a section inline while assigning a unit", async ({
    browser,
  }) => {
    const baseURL = test.info().project.use.baseURL || "https://localhost:3000";
    instructorSession = await createUserSession(
      browser,
      INSTRUCTOR,
      baseURL,
      "/units",
    );

    const unitId = await createUnit(
      instructorSession.page,
      `Inline Assignment ${Date.now()}`,
    );
    await publishUnit(instructorSession.page);
    await saveUnit(instructorSession.page);

    await instructorSession.page.goto(`/unit/${unitId}`);
    await instructorSession.page
      .locator('[data-tour="editor"]')
      .waitFor({ timeout: 30_000 });
    await instructorSession.page
      .locator('[data-tour="assignments-tab"]')
      .click();
    await instructorSession.page
      .locator('[data-tour="assignment-settings"]')
      .waitFor({ timeout: 10_000 });

    const sectionName = `Inline Section ${Date.now()}`;
    await instructorSession.page
      .getByLabel("New section name")
      .fill(sectionName);
    await instructorSession.page
      .getByRole("button", { name: "Create section" })
      .click();

    await expect(
      instructorSession.page.getByText("Section created.", { exact: false }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      instructorSession.page
        .locator('[data-tour="unit-selector"]')
        .getByText(sectionName),
    ).toBeVisible({ timeout: 10_000 });

    const assignButton = instructorSession.page.getByRole("button", {
      name: /Assign to 1 section/i,
    });
    await expect(assignButton).toBeVisible({ timeout: 5_000 });
    await assignButton.click();
    await expect(
      instructorSession.page
        .locator('[data-tour="assignment-settings"] li')
        .filter({ hasText: sectionName }),
    ).toBeVisible({ timeout: 15_000 });
  });
});
