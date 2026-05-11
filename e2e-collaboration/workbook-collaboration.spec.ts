/**
 * Workbook Collaboration – Multi-User E2E (Playwright)
 *
 * Tests that instructor and student can view the same unit content
 * simultaneously. Uses two BrowserContexts so both are active at once.
 *
 * Scenario 1: Both open the same workbook at the same time.
 * Scenario 2: Student views workbook while instructor edits unit in editor.
 *
 * Routes: /units, /unit/{id}, /workbook/{id}
 * Key selectors:
 *   [data-tour="workbook-content"]         — WorkbookClient.tsx:225
 *   [data-tour="workbook"]                 — Workbook.tsx:218
 *   [data-tour="editor"]                   — Editor3/index.tsx:605
 *   [data-lexical-editor="true"]           — Lexical root
 *   [data-tour="quiz-answers"]             — QuizComponent.jsx:145
 *   [data-tour="quiz-block"]               — QuizComponent.jsx:174
 *
 * NOTE: Yjs provider is NOT exposed on `window` — we cannot test awareness
 * indicators directly. Instead we verify both pages remain functional and
 * display content simultaneously.
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

test.describe("Workbook Collaboration – Simultaneous Users", () => {
  let instructorSession: UserSession;
  let studentSession: UserSession;

  test.afterEach(async () => {
    if (studentSession) await closeSession(studentSession);
    if (instructorSession) await closeSession(instructorSession);
  });

  test("both users can view the same workbook simultaneously", async ({
    browser,
  }) => {
    const baseURL = test.info().project.use.baseURL || "http://localhost:3000";
    const sectionName = `PW Collab Workbook ${Date.now()}`;

    // --- Both users log in simultaneously ---
    [instructorSession, studentSession] = await Promise.all([
      createUserSession(browser, INSTRUCTOR, baseURL, "/units"),
      createUserSession(browser, STUDENT_1, baseURL, "/sections"),
    ]);

    // --- Instructor: create unit → quiz → publish → section → assign ---
    const unitId = await createUnit(
      instructorSession.page,
      "PW Collab Test Unit",
    );
    await addQuizBlock(instructorSession.page);
    await publishUnit(instructorSession.page);
    await saveUnit(instructorSession.page);
    const joinCode = await createSection(instructorSession.page, sectionName);
    await assignUnitToSection(instructorSession.page, unitId, sectionName);

    // --- Student: join section ---
    await joinSection(studentSession.page, joinCode);

    // --- Both open the workbook at the same time ---
    await Promise.all([
      openWorkbook(instructorSession.page, unitId),
      openWorkbook(studentSession.page, unitId),
    ]);

    // Verify both sessions show workbook content
    await expect(
      instructorSession.page.locator(
        '[data-tour="workbook-content"], [data-tour="workbook"]',
      ),
    ).toBeVisible({ timeout: 15_000 });

    await expect(
      studentSession.page.locator(
        '[data-tour="workbook-content"], [data-tour="workbook"]',
      ),
    ).toBeVisible({ timeout: 15_000 });

    // --- Student interacts with quiz while instructor has workbook open ---
    const quizAnswer = studentSession.page.locator(
      '[data-tour="quiz-answers"] input[type="checkbox"], [data-tour="quiz-block"] input[type="checkbox"]',
    );
    if (
      await quizAnswer
        .first()
        .isVisible({ timeout: 5_000 })
        .catch(() => false)
    ) {
      await quizAnswer.first().check({ force: true });
      await studentSession.page.waitForTimeout(2000);
    }

    // Instructor's session should still be functional
    await expect(
      instructorSession.page.locator(
        '[data-tour="workbook-content"], [data-tour="workbook"]',
      ),
    ).toBeVisible();
  });

  test("student views workbook while instructor edits the unit in editor", async ({
    browser,
  }) => {
    const baseURL = test.info().project.use.baseURL || "http://localhost:3000";
    const sectionName = `PW Edit Collab ${Date.now()}`;

    [instructorSession, studentSession] = await Promise.all([
      createUserSession(browser, INSTRUCTOR, baseURL, "/units"),
      createUserSession(browser, STUDENT_1, baseURL, "/sections"),
    ]);

    // Instructor: create + publish + assign
    const unitId = await createUnit(
      instructorSession.page,
      "PW Edit Collab Unit",
    );
    await addQuizBlock(instructorSession.page);
    await publishUnit(instructorSession.page);
    await saveUnit(instructorSession.page);
    const joinCode = await createSection(instructorSession.page, sectionName);
    await assignUnitToSection(instructorSession.page, unitId, sectionName);

    // Student joins section
    await joinSection(studentSession.page, joinCode);

    // Student opens workbook
    await openWorkbook(studentSession.page, unitId);
    await expect(
      studentSession.page.locator(
        '[data-tour="workbook-content"], [data-tour="workbook"]',
      ),
    ).toBeVisible({ timeout: 15_000 });

    // Instructor navigates to the editor for this same unit
    await instructorSession.page.goto(`/unit/${unitId}`, { timeout: 30_000 });
    await instructorSession.page.waitForSelector('[data-tour="editor"]', {
      timeout: 30_000,
    });

    // Instructor types into the Lexical editor
    const lexicalEditor = instructorSession.page.locator(
      '[data-lexical-editor="true"]',
    );
    await expect(lexicalEditor).toBeVisible({ timeout: 10_000 });
    await lexicalEditor.click();
    await instructorSession.page.keyboard.type("Live edit from instructor");
    await instructorSession.page.waitForTimeout(3000);

    // Save the instructor's edits
    await saveUnit(instructorSession.page);

    // Student's workbook should still be functional
    await expect(
      studentSession.page.locator(
        '[data-tour="workbook-content"], [data-tour="workbook"]',
      ),
    ).toBeVisible();

    // Student reloads to pick up new content
    await studentSession.page.reload({ timeout: 15_000 });
    await studentSession.page.waitForTimeout(5000);
    const pageText =
      (await studentSession.page.locator("body").textContent()) || "";
    expect(pageText).toContain("Live edit from instructor");
  });
});
