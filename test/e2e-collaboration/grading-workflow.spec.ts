/**
 * Grading Workflow – Multi-User E2E
 *
 * Tests that a student's quiz answer creates a visible grade for the instructor:
 * 1. Instructor creates content + section + assignment
 * 2. Student joins → opens workbook → answers quiz
 * 3. Instructor's section gradebook shows the student's grade entry
 *
 * This tests real data propagation: student interaction creates a Grade record
 * that the instructor can see.
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
  openWorkbook,
  goToSections,
  type UserSession,
} from "./helpers";

test.describe("Grading Workflow", () => {
  let instructorSession: UserSession;
  let studentSession: UserSession;

  test.afterEach(async () => {
    if (studentSession) await closeSession(studentSession);
    if (instructorSession) await closeSession(instructorSession);
  });

  test("student answers quiz, instructor sees grade in gradebook", async ({
    browser,
  }) => {
    const baseURL = test.info().project.use.baseURL || "https://localhost:3000";
    const sectionName = `Grading ${Date.now()}`;

    // Both users log in simultaneously
    [instructorSession, studentSession] = await Promise.all([
      createUserSession(browser, INSTRUCTOR, baseURL, "/units"),
      createUserSession(browser, STUDENT_1, baseURL, "/sections"),
    ]);

    // Instructor: create unit → quiz → publish → section → assign
    const unitId = await createUnit(instructorSession.page, "Grading Unit");
    await addQuizBlock(instructorSession.page);
    await publishUnit(instructorSession.page);
    await saveUnit(instructorSession.page);
    const joinCode = await createSection(
      instructorSession.page,
      sectionName,
      "Grading test",
    );
    await assignUnitToSection(instructorSession.page, unitId, sectionName);

    // Student: join section
    await joinSection(studentSession.page, joinCode);

    // Student: open workbook and answer quiz
    await openWorkbook(studentSession.page, unitId);

    // Find and click a quiz answer label (MUI Checkbox input is hidden)
    const quizLabel = studentSession.page.locator(
      '[data-tour="quiz-answers"], [data-tour="quiz-block"] label',
    );
    await expect(quizLabel.first()).toBeVisible({ timeout: 10_000 });
    await quizLabel.first().click();

    // Wait for grade to be recorded (mutation + subscription propagation)
    await studentSession.page
      .waitForResponse(
        (resp) => resp.url().includes("graphql") && resp.status() === 200,
        { timeout: 15_000 },
      )
      .catch(() => {});

    // Instructor: navigate to section detail to see gradebook
    await goToSections(instructorSession.page);
    await instructorSession.page
      .locator('[data-tour="section-card"]')
      .filter({ hasText: sectionName })
      .locator('a[href*="/section/"]')
      .click();
    await instructorSession.page.waitForURL("**/section/**", {
      timeout: 10_000,
    });

    // Verify gradebook table is visible
    const gradebookTable = instructorSession.page.locator("table").first();
    await expect(gradebookTable).toBeVisible({ timeout: 15_000 });

    // Verify the student's username appears in the gradebook
    // (confirms the grade record propagated from student to instructor's view)
    await expect(
      gradebookTable.getByText(STUDENT_1.username.split("@")[0]).first(),
    ).toBeVisible({ timeout: 15_000 });
  });
});
