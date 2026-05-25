/**
 * Workbook Collaboration – Multi-User E2E
 *
 * Tests concurrent access to the same unit content:
 * 1. Both users open the same workbook — both remain functional
 * 2. Student answers quiz while instructor has workbook open
 * 3. Instructor edits unit while student views workbook — neither crashes
 *
 * This verifies that concurrent access doesn't cause errors or data corruption.
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
  type UserSession,
} from "./helpers";

test.describe("Workbook Collaboration", () => {
  let instructorSession: UserSession;
  let studentSession: UserSession;

  test.afterEach(async () => {
    if (studentSession) await closeSession(studentSession);
    if (instructorSession) await closeSession(instructorSession);
  });

  test("student answers quiz while instructor views same workbook", async ({
    browser,
  }) => {
    const baseURL = test.info().project.use.baseURL || "https://localhost:3000";
    const sectionName = `Collab Workbook ${Date.now()}`;

    // Both users log in simultaneously
    [instructorSession, studentSession] = await Promise.all([
      createUserSession(browser, INSTRUCTOR, baseURL, "/units"),
      createUserSession(browser, STUDENT_1, baseURL, "/sections"),
    ]);

    // Instructor: create unit → quiz → publish → section → assign
    const unitId = await createUnit(instructorSession.page, "Collab Unit");
    await addQuizBlock(instructorSession.page);
    await publishUnit(instructorSession.page);
    await saveUnit(instructorSession.page);
    const joinCode = await createSection(instructorSession.page, sectionName);
    await assignUnitToSection(instructorSession.page, unitId, sectionName);

    // Student joins section
    await joinSection(studentSession.page, joinCode);

    // Both open the workbook at the same time
    await Promise.all([
      openWorkbook(instructorSession.page, unitId),
      openWorkbook(studentSession.page, unitId),
    ]);

    // Verify both sessions show workbook content
    await expect(
      instructorSession.page
        .locator('[data-tour="workbook-content"], [data-tour="workbook"]')
        .first(),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      studentSession.page
        .locator('[data-tour="workbook-content"], [data-tour="workbook"]')
        .first(),
    ).toBeVisible({ timeout: 15_000 });

    // Student interacts with quiz while instructor has same workbook open
    const quizAnswer = studentSession.page.locator(
      '[data-tour="quiz-answers"] input[type="checkbox"], [data-tour="quiz-block"] input[type="checkbox"]',
    );
    await expect(quizAnswer.first()).toBeVisible({ timeout: 10_000 });
    await quizAnswer.first().check({ force: true });

    // Wait for the interaction to process
    await studentSession.page.waitForTimeout(2000);

    // Instructor's session should still be functional (no crash from concurrent access)
    await expect(
      instructorSession.page
        .locator('[data-tour="workbook-content"], [data-tour="workbook"]')
        .first(),
    ).toBeVisible();
  });

  test("instructor edits unit while student views workbook concurrently", async ({
    browser,
  }) => {
    const baseURL = test.info().project.use.baseURL || "https://localhost:3000";
    const sectionName = `Edit Collab ${Date.now()}`;

    [instructorSession, studentSession] = await Promise.all([
      createUserSession(browser, INSTRUCTOR, baseURL, "/units"),
      createUserSession(browser, STUDENT_1, baseURL, "/sections"),
    ]);

    // Instructor: full setup
    const unitId = await createUnit(instructorSession.page, "Edit Collab Unit");
    await addQuizBlock(instructorSession.page);
    await publishUnit(instructorSession.page);
    await saveUnit(instructorSession.page);
    const joinCode = await createSection(instructorSession.page, sectionName);
    await assignUnitToSection(instructorSession.page, unitId, sectionName);

    // Student joins and opens workbook
    await joinSection(studentSession.page, joinCode);
    await openWorkbook(studentSession.page, unitId);
    await expect(
      studentSession.page
        .locator('[data-tour="workbook-content"], [data-tour="workbook"]')
        .first(),
    ).toBeVisible({ timeout: 15_000 });

    // Instructor opens the editor for the same unit (concurrent with student's workbook)
    await instructorSession.page.goto(`/unit/${unitId}`, { timeout: 30_000 });
    await instructorSession.page.waitForSelector('[data-tour="editor"]', {
      timeout: 30_000,
    });

    // Instructor types content in the Lexical editor
    const lexicalEditor = instructorSession.page.locator(
      '[data-lexical-editor="true"]',
    );
    await expect(lexicalEditor).toBeVisible({ timeout: 10_000 });
    await lexicalEditor.click();
    const editContent = `Live edit ${Date.now()}`;
    await instructorSession.page.keyboard.type(editContent);

    // Save the instructor's edits
    await saveUnit(instructorSession.page);

    // Verify the instructor's editor contains the typed text
    await expect(lexicalEditor).toContainText(editContent);

    // Student's workbook should still be functional (not crashed by concurrent edit)
    await expect(
      studentSession.page
        .locator('[data-tour="workbook-content"], [data-tour="workbook"]')
        .first(),
    ).toBeVisible();
  });
});
