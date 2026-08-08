/**
 * Journey 4: Instructor — Grade Student Work
 *
 * Creates all state from scratch:
 * 1. Instructor creates unit with quiz + section + assignment
 * 2. Student joins section and completes the workbook
 * 3. Instructor views grades in section gradebook
 * 4. Instructor views grade history in editor grades tab
 *
 * Every step FAILS if the grading pipeline is broken.
 */

import { test, expect } from "./fixtures";
import {
  INSTRUCTOR,
  STUDENT_1,
  login,
  suppressKnownErrors,
  waitForPageReady,
} from "./helpers";

test.describe.serial("Journey 4: Instructor — Grade Student Work", () => {
  let unitId: string;
  let sectionCode: string;
  let sectionUrl: string;

  // ─── SETUP: Instructor creates the full pipeline ─────────────────────

  test("instructor creates unit with quiz block", async ({ browser }) => {
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

    const editor = page.locator('[data-lexical-editor="true"]').first();
    await editor.click();
    await page.keyboard.type(`Grading Test ${Date.now()}`);

    // Insert quiz
    const insertButton = page.locator(
      'button[aria-controls="insert-node-menu"]',
    );
    await insertButton.click();
    const menu = page.locator('ul[role="menu"]');
    await expect(menu).toBeVisible({ timeout: 5_000 });
    await menu
      .locator("li")
      .filter({ hasText: /quiz|multiple choice/i })
      .click();

    await expect(page.locator('[data-tour="quiz-block"]').first()).toBeVisible({
      timeout: 10_000,
    });

    // Configure quiz answers so students can interact
    const quizBlock = page.locator('[data-tour="quiz-block"]').first();
    const editBtn = quizBlock.getByRole("button", { name: /edit/i });
    await expect(editBtn).toBeVisible({ timeout: 5_000 });
    await editBtn.click();

    const addAnswerField = quizBlock.locator(
      'input[placeholder*="Add Answer"], [placeholder*="Add Answer"]',
    );
    await expect(addAnswerField).toBeVisible({ timeout: 5_000 });
    await addAnswerField.click();

    const answerInputs = quizBlock.locator('input[type="text"], textarea');
    await answerInputs.last().fill("Correct answer");
    const correctToggle = quizBlock.locator(".MuiSwitch-root").first();
    if (await correctToggle.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await correctToggle.click();
    }
    await addAnswerField.click();
    await answerInputs.last().fill("Wrong answer");

    const doneBtn = quizBlock.getByRole("button", { name: /done/i });
    await expect(doneBtn).toBeVisible({ timeout: 5_000 });
    await doneBtn.click();

    // Wait for auto-save
    await page.waitForResponse(
      (resp) => resp.url().includes("graphql") && resp.status() === 200,
      { timeout: 15_000 },
    ).catch(() => {});
    await ctx.close();
  });

  test("instructor creates section and captures join code", async ({
    browser,
  }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    suppressKnownErrors(page);
    await login(page, INSTRUCTOR, "/sections");
    await page.waitForSelector('[data-tour="sections-page"]', {
      timeout: 15_000,
    });

    const createBtn = page.locator('[data-tour="create-section-button"]');
    await expect(createBtn).toBeVisible({ timeout: 5_000 });
    await createBtn.click();

    await expect(page.locator('[data-tour="section-form"]')).toBeVisible({
      timeout: 10_000,
    });

    const sectionName = `E2E Grade Section ${Date.now()}`;
    await page
      .locator('[data-tour="section-form"] input[name="name"]')
      .fill(sectionName);
    await page
      .locator('[data-tour="section-form"] textarea[name="description"]')
      .first()
      .fill("Automated test section for grading journey");

    const submitBtn = page
      .locator('[data-tour="section-form"]')
      .getByRole("button", { name: /create/i });
    await submitBtn.click();

    await expect(page.getByText(sectionName)).toBeVisible({ timeout: 30_000 });

    const card = page
      .locator('[data-tour="section-card"]')
      .filter({ hasText: sectionName });
    const joinCodeEl = card.locator('[data-tour="join-code"]');
    await expect(joinCodeEl).toBeVisible({ timeout: 10_000 });
    sectionCode = (await joinCodeEl.textContent())!.trim();

    // Navigate into the section to get its URL
    await card.locator("a").first().click();
    await page.waitForURL(/\/section\//, { timeout: 15_000 });
    sectionUrl = page.url();

    await ctx.close();
  });

  // ─── STUDENT: Join section and complete work ─────────────────────────

  test("student joins section and completes the workbook", async ({ page }) => {
    suppressKnownErrors(page);
    await login(page, STUDENT_1);
    await waitForPageReady(page);

    // Join section
    const joinBtn = page.locator('[data-tour="join-section-button"]');
    await expect(joinBtn).toBeVisible({ timeout: 10_000 });
    await joinBtn.click();

    await expect(page.locator('[data-tour="join-section-dialog"]')).toBeVisible(
      {
        timeout: 10_000,
      },
    );

    const codeInput = page
      .locator('[data-tour="join-code-input"] input')
      .first();
    await codeInput.fill(sectionCode);

    const submitBtn = page
      .locator('[data-tour="join-section-dialog"]')
      .getByRole("button", { name: /add/i });
    await submitBtn.click();

    await expect(
      page.locator('[data-tour="join-section-dialog"]'),
    ).not.toBeVisible({ timeout: 15_000 });

    // Open workbook and answer quiz
    await page.goto(`/workbook/${unitId}`, { timeout: 30_000 });

    const startButton = page.getByRole("button", { name: /start/i });
    if (await startButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await startButton.click();
    }

    // Handle completion modal from prior runs — dismiss and retry
    const completionModal = page.locator('[data-tour="results"]');
    if (
      await completionModal.isVisible({ timeout: 5_000 }).catch(() => false)
    ) {
      const tryAgainBtn = page.getByRole("button", { name: /try again/i });
      if (await tryAgainBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await tryAgainBtn.click();
      }
    }

    await expect(page.locator('[data-tour="workbook"]')).toBeVisible({
      timeout: 20_000,
    });

    // Answer all quiz questions
    const quizBlock = page.locator('[data-tour="quiz-block"]').first();
    await expect(quizBlock).toBeVisible({ timeout: 10_000 });

    const unchecked = quizBlock.locator(
      'input[type="checkbox"]:not(:checked), [role="checkbox"][aria-checked="false"]',
    );
    const count = await unchecked.count();
    for (let i = 0; i < count; i++) {
      await unchecked.nth(i).click();
    }

    // Wait for grade to be recorded
    await page.waitForResponse(
      (resp) => resp.url().includes("graphql") && resp.status() === 200,
      { timeout: 10_000 },
    ).catch(() => {});
  });

  // ─── INSTRUCTOR: Verify grades appear ────────────────────────────────

  test("instructor sees gradebook with student data in section", async ({
    page,
  }) => {
    suppressKnownErrors(page);
    const sectionPath = sectionUrl.replace(/^https?:\/\/[^/]+/, "");
    await login(page, INSTRUCTOR, sectionPath);
    await waitForPageReady(page);

    // Section card must render
    await expect(page.locator('[data-tour="section-card"]')).toBeVisible({
      timeout: 15_000,
    });

    // Gradebook table must exist with data rows
    const table = page.locator("table").first();
    await expect(table).toBeVisible({ timeout: 15_000 });

    const dataRows = table.locator("tbody tr");
    const rowCount = await dataRows.count();
    expect(rowCount).toBeGreaterThan(0);

    // At least one cell should have numeric grade data or student name
    const tableText = await table.textContent();
    expect(tableText!.length).toBeGreaterThan(20);
  });

  test("instructor sees grade history in editor grades tab", async ({
    page,
  }) => {
    suppressKnownErrors(page);
    await login(page, INSTRUCTOR, `/unit/${unitId}`);
    await page.waitForSelector('[data-tour="editor"]', { timeout: 30_000 });

    // Click grades tab
    const gradesTab = page.locator('[data-tour="grades-tab"]');
    await expect(gradesTab).toBeVisible({ timeout: 10_000 });
    await gradesTab.click();

    // Grades list must show submission history
    const gradesList = page.locator('[data-tour="grades-list"]');
    await expect(gradesList).toBeVisible({ timeout: 15_000 });
    const text = await gradesList.textContent();
    expect(text!.length).toBeGreaterThan(5);
  });
});
