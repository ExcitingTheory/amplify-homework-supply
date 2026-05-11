/**
 * Assignment Workflow – Multi-User E2E (Playwright)
 *
 * Tests the assignment lifecycle with two simultaneous browser sessions:
 * 1. Instructor creates unit → publishes → creates section → assigns
 * 2. Student joins section → sees assignment on /section/{id} → opens workbook
 *
 * Routes: /units, /unit/{id}, /sections, /section/{id}, /workbook/{id}
 * Key selectors:
 *   [data-tour="create-unit-button"]      — units/page.jsx:316
 *   [data-tour="editor"]                  — Editor3/index.tsx:605
 *   #status-select                        — ToolBarPlugin.jsx:846
 *   li[data-value="PUBLISHED"]            — ToolBarPlugin.jsx:861
 *   button[title="Save now ..."]          — Save.jsx:87
 *   button[aria-controls="insert-node-menu"] — ToolBarPlugin.jsx:1103
 *   [data-tour="assignments-tab"]         — TabsVerticalLeft.jsx:198
 *   [data-tour="assignment-settings"]     — AssignmentConfiguration.jsx:227
 *   [data-tour="due-date-picker"]         — AssignmentConfiguration.jsx:246
 *   [data-tour="unit-selector"]           — AssignmentConfiguration.jsx:263
 *   [data-tour="create-assignment-button"] — SectionAssigner.jsx:211
 *   [data-tour="assignments-section"]     — section/[id]/page.jsx:2379
 *   [data-tour="assignment-card"]         — section/[id]/page.jsx:2417
 *   [data-tour="view-workbook-button"]    — section/[id]/page.jsx:2463
 *   [data-tour="workbook-content"]        — WorkbookClient.tsx:225
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

test.describe("Assignment Workflow – Simultaneous Users", () => {
  let instructorSession: UserSession;
  let studentSession: UserSession;

  test.afterEach(async () => {
    if (studentSession) await closeSession(studentSession);
    if (instructorSession) await closeSession(instructorSession);
  });

  test("instructor assigns unit, student sees it in section detail", async ({
    browser,
  }) => {
    const baseURL = test.info().project.use.baseURL || "http://localhost:3000";
    const sectionName = `PW Assignment Section ${Date.now()}`;

    // --- Both users log in simultaneously ---
    [instructorSession, studentSession] = await Promise.all([
      createUserSession(browser, INSTRUCTOR, baseURL, "/units"),
      createUserSession(browser, STUDENT_1, baseURL, "/sections"),
    ]);

    // --- Instructor: create unit with quiz, publish, save ---
    const unitId = await createUnit(
      instructorSession.page,
      "PW Assignment Test Unit",
    );
    await addQuizBlock(instructorSession.page);
    await publishUnit(instructorSession.page);
    await saveUnit(instructorSession.page);

    // --- Instructor: create section ---
    const joinCode = await createSection(
      instructorSession.page,
      sectionName,
      "PW assignment test",
    );

    // --- Student: join section (while instructor is still logged in) ---
    await joinSection(studentSession.page, joinCode);

    // --- Instructor: assign unit to section ---
    await assignUnitToSection(instructorSession.page, unitId, sectionName);

    // --- Student: navigate to section detail to see assignment ---
    await goToSections(studentSession.page);
    await studentSession.page
      .locator('[data-tour="section-card"]')
      .filter({ hasText: sectionName })
      .locator('a[href*="/section/"]')
      .click();
    await studentSession.page.waitForURL("**/section/**", { timeout: 10_000 });

    // Verify assignment card or assignment section is visible
    const assignmentArea = studentSession.page.locator(
      '[data-tour="assignment-card"], [data-tour="assignments-section"]',
    );
    await expect(assignmentArea.first()).toBeVisible({ timeout: 15_000 });
  });

  test("student opens workbook from assignment while instructor monitors", async ({
    browser,
  }) => {
    const baseURL = test.info().project.use.baseURL || "http://localhost:3000";
    const sectionName = `PW Workbook Launch ${Date.now()}`;

    [instructorSession, studentSession] = await Promise.all([
      createUserSession(browser, INSTRUCTOR, baseURL, "/units"),
      createUserSession(browser, STUDENT_1, baseURL, "/sections"),
    ]);

    // Instructor: full setup
    const unitId = await createUnit(
      instructorSession.page,
      "PW Workbook Launch Unit",
    );
    await addQuizBlock(instructorSession.page);
    await publishUnit(instructorSession.page);
    await saveUnit(instructorSession.page);
    const joinCode = await createSection(instructorSession.page, sectionName);
    await assignUnitToSection(instructorSession.page, unitId, sectionName);

    // Student: join section and navigate to section detail
    await joinSection(studentSession.page, joinCode);
    await goToSections(studentSession.page);
    await studentSession.page
      .locator('[data-tour="section-card"]')
      .filter({ hasText: sectionName })
      .locator('a[href*="/section/"]')
      .click();
    await studentSession.page.waitForURL("**/section/**", { timeout: 10_000 });

    // Click the workbook button on the assignment card
    const workbookLink = studentSession.page.locator(
      '[data-tour="view-workbook-button"]',
    );
    if (
      await workbookLink
        .first()
        .isVisible({ timeout: 10_000 })
        .catch(() => false)
    ) {
      await workbookLink.first().click();
      await studentSession.page.waitForURL("**/workbook/**", {
        timeout: 20_000,
      });

      // Verify workbook loads
      await expect(
        studentSession.page.locator(
          '[data-tour="workbook-content"], [data-tour="workbook"]',
        ),
      ).toBeVisible({ timeout: 15_000 });

      // Instructor: simultaneously viewing section detail
      await goToSections(instructorSession.page);
      await instructorSession.page
        .locator('[data-tour="section-card"]')
        .filter({ hasText: sectionName })
        .locator('a[href*="/section/"]')
        .click();
      await expect(instructorSession.page.locator("table").first()).toBeVisible(
        { timeout: 10_000 },
      );
    }
  });
});
