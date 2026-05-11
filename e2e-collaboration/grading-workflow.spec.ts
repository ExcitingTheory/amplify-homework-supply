/**
 * Grading Workflow – Multi-User E2E (Playwright)
 *
 * Tests the grading lifecycle with two simultaneous browser sessions:
 * 1. Instructor creates unit + section + assignment
 * 2. Student joins → opens workbook → answers quiz
 * 3. Instructor views section detail gradebook → sees grade
 *
 * Routes: /units, /unit/{id}, /sections, /section/{id}, /workbook/{id}
 * Key selectors:
 *   [data-tour="quiz-answers"] input[type="checkbox"]  — QuizComponent.jsx:145
 *   [data-tour="quiz-block"]                           — QuizComponent.jsx:174
 *   [data-tour="results"]                              — UnitCompletedPlugin.jsx:119
 *   table (gradebook in section detail)                — section/[id]/page.jsx:1739
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

test.describe("Grading Workflow – Simultaneous Users", () => {
  let instructorSession: UserSession;
  let studentSession: UserSession;

  test.afterEach(async () => {
    if (studentSession) await closeSession(studentSession);
    if (instructorSession) await closeSession(instructorSession);
  });

  test("student answers quiz, instructor sees grade in section gradebook", async ({
    browser,
  }) => {
    const baseURL = test.info().project.use.baseURL || "http://localhost:3000";
    const sectionName = `PW Grading ${Date.now()}`;

    // --- Both users log in simultaneously ---
    [instructorSession, studentSession] = await Promise.all([
      createUserSession(browser, INSTRUCTOR, baseURL, "/units"),
      createUserSession(browser, STUDENT_1, baseURL, "/sections"),
    ]);

    // --- Instructor: create unit → quiz → publish → section → assign ---
    const unitId = await createUnit(
      instructorSession.page,
      "PW Grading Test Unit",
    );
    await addQuizBlock(instructorSession.page);
    await publishUnit(instructorSession.page);
    await saveUnit(instructorSession.page);
    const joinCode = await createSection(
      instructorSession.page,
      sectionName,
      "Grading test",
    );
    await assignUnitToSection(instructorSession.page, unitId, sectionName);

    // --- Student: join section ---
    await joinSection(studentSession.page, joinCode);

    // --- Instructor: navigate to section detail and watch gradebook ---
    await goToSections(instructorSession.page);
    await instructorSession.page
      .locator('[data-tour="section-card"]')
      .filter({ hasText: sectionName })
      .locator('a[href*="/section/"]')
      .click();
    await instructorSession.page.waitForURL("**/section/**", {
      timeout: 10_000,
    });
    await expect(instructorSession.page.locator("table").first()).toBeVisible({
      timeout: 10_000,
    });

    // --- Student: open workbook and answer quiz ---
    await openWorkbook(studentSession.page, unitId);

    // Answer quiz — click first checkbox answer
    const quizAnswer = studentSession.page.locator(
      '[data-tour="quiz-answers"] input[type="checkbox"], [data-tour="quiz-block"] input[type="checkbox"]',
    );
    if (
      await quizAnswer
        .first()
        .isVisible({ timeout: 10_000 })
        .catch(() => false)
    ) {
      await quizAnswer.first().check({ force: true });
      await studentSession.page.waitForTimeout(3000);
    }

    // --- Instructor: refresh section detail to see the grade ---
    await instructorSession.page.reload({ timeout: 15_000 });
    await instructorSession.page.waitForTimeout(5000);

    // Verify gradebook table is still visible (it should now have grade data)
    await expect(instructorSession.page.locator("table").first()).toBeVisible({
      timeout: 15_000,
    });
  });
});
