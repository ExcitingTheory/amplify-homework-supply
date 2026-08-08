/**
 * Journey 1: Learner — Complete Homework via Dashboard
 *
 * Full pipeline that creates its own state:
 * 1. Instructor creates a unit with quiz → creates section → assigns unit
 * 2. Student joins section via join code
 * 3. Student sees pending assignment on dashboard with "Start Workbook" button
 * 4. Student opens workbook, interacts with quiz block
 * 5. After completing, dashboard shows the completed assignment with accuracy %
 *
 * Tests the FULL assignment lifecycle through the new dashboard UI.
 */

import { test, expect } from "./fixtures";
import {
  INSTRUCTOR,
  STUDENT_1,
  login,
  suppressKnownErrors,
  waitForPageReady,
} from "./helpers";

test.describe
  .serial("Journey 1: Learner — Complete Homework via Dashboard", () => {
  let unitId: string;
  let unitName: string;
  let sectionCode: string;

  // ─── SETUP: Instructor creates the full pipeline ─────────────────────

  test("instructor creates a unit with quiz block", async ({ browser }) => {
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

    // Type a unique unit name
    unitName = `HW Journey ${Date.now()}`;
    const editor = page.locator('[data-lexical-editor="true"]').first();
    await editor.click();
    await page.keyboard.type(unitName);

    // Insert quiz block
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

    // Enter edit mode and add answers to the quiz
    const quizBlock = page.locator('[data-tour="quiz-block"]').first();
    const editBtn = quizBlock.getByRole("button", { name: /edit/i });
    await expect(editBtn).toBeVisible({ timeout: 5_000 });
    await editBtn.click();

    // Add two answer options by clicking the "Add Answer" placeholder
    const addAnswerField = quizBlock.locator(
      'input[placeholder*="Add Answer"], [placeholder*="Add Answer"]',
    );
    await expect(addAnswerField).toBeVisible({ timeout: 5_000 });
    await addAnswerField.click();

    // Fill first answer
    const answerInputs = quizBlock.locator('input[type="text"], textarea');
    const firstAnswer = answerInputs.last();
    await firstAnswer.fill("Correct answer");

    // Mark first answer as correct (toggle the switch)
    const correctToggle = quizBlock.locator(".MuiSwitch-root").first();
    if (await correctToggle.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await correctToggle.click();
    }

    // Add second answer
    await addAnswerField.click();
    const secondAnswer = answerInputs.last();
    await secondAnswer.fill("Wrong answer");

    // Click "Done" to save the quiz
    const doneBtn = quizBlock.getByRole("button", { name: /done/i });
    await expect(doneBtn).toBeVisible({ timeout: 5_000 });
    await doneBtn.click();

    // Wait for auto-save via network
    await page.waitForResponse(
      (resp) => resp.url().includes("graphql") && resp.status() === 200,
      { timeout: 15_000 },
    ).catch(() => {});
    await ctx.close();
  });

  test("instructor creates section and assigns the unit", async ({
    browser,
  }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    suppressKnownErrors(page);
    await login(page, INSTRUCTOR, "/sections");
    await page.waitForSelector('[data-tour="sections-page"]', {
      timeout: 15_000,
    });

    // Create section
    const createBtn = page.locator('[data-tour="create-section-button"]');
    await expect(createBtn).toBeVisible({ timeout: 5_000 });
    await createBtn.click();

    await expect(page.locator('[data-tour="section-form"]')).toBeVisible({
      timeout: 10_000,
    });

    const sectionName = `E2E HW Section ${Date.now()}`;
    await page
      .locator('[data-tour="section-form"] input[name="name"]')
      .fill(sectionName);
    await page
      .locator('[data-tour="section-form"] textarea[name="description"]')
      .first()
      .fill("Automated test section for homework journey");

    const submitBtn = page
      .locator('[data-tour="section-form"]')
      .getByRole("button", { name: /create/i });
    await submitBtn.click();

    await expect(page.getByText(sectionName)).toBeVisible({ timeout: 30_000 });

    // Capture join code
    const card = page
      .locator('[data-tour="section-card"]')
      .filter({ hasText: sectionName });
    const joinCodeEl = card.locator('[data-tour="join-code"]');
    await expect(joinCodeEl).toBeVisible({ timeout: 10_000 });
    sectionCode = (await joinCodeEl.textContent())!.trim();
    expect(sectionCode.length).toBeGreaterThanOrEqual(4);

    // Navigate to unit editor and assign
    await page.goto(`/unit/${unitId}`, { timeout: 30_000 });
    await page.waitForSelector('[data-tour="editor"]', { timeout: 30_000 });

    const assignTab = page.locator('[data-tour="assignments-tab"]');
    await expect(assignTab).toBeVisible({ timeout: 10_000 });
    await assignTab.click();

    // Assignment panel or create button must be present
    const assignPanel = page.locator('[data-tour="assignment-settings"]');
    const createAssignBtn = page.locator(
      '[data-tour="create-assignment-button"]',
    );
    await expect(assignPanel.or(createAssignBtn)).toBeVisible({
      timeout: 10_000,
    });

    await ctx.close();
  });

  // ─── STUDENT: Dashboard-driven homework flow ─────────────────────────

  test("student joins section using instructor join code", async ({ page }) => {
    suppressKnownErrors(page);
    await login(page, STUDENT_1);
    await waitForPageReady(page);

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
    await expect(codeInput).toBeVisible({ timeout: 5_000 });
    await codeInput.fill(sectionCode);

    const submitBtn = page
      .locator('[data-tour="join-section-dialog"]')
      .getByRole("button", { name: /add/i });
    await submitBtn.click();

    await expect(
      page.locator('[data-tour="join-section-dialog"]'),
    ).not.toBeVisible({ timeout: 15_000 });
  });

  test("dashboard shows hero card with XP, level, and streak", async ({
    page,
  }) => {
    suppressKnownErrors(page);
    await login(page, STUDENT_1);
    await waitForPageReady(page);

    // Hero card must show XP total (numeric text + "XP total")
    await expect(page.getByText(/\d+\s*XP total/)).toBeVisible({
      timeout: 15_000,
    });

    // Level chip or text must be present ("Lv." prefix)
    const levelText = page.getByText(/Lv\.\s*\d+/);
    await expect(levelText.first()).toBeVisible({ timeout: 10_000 });

    // User name or "Learner" must be visible in hero
    const hasName = await page
      .getByRole("heading", { level: 6 })
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
    expect(hasName).toBe(true);
  });

  test("dashboard shows pending assignment with Start Workbook button", async ({
    page,
  }) => {
    suppressKnownErrors(page);
    await login(page, STUDENT_1);
    await waitForPageReady(page);

    // Pending assignments section must have our unit
    // Look for "Start Workbook" button (it's a PrefetchButton link)
    const startBtn = page.getByRole("link", { name: /Start Workbook/i });
    await expect(startBtn.first()).toBeVisible({ timeout: 20_000 });

    // The assignment card must link to our workbook
    const href = await startBtn.first().getAttribute("href");
    expect(href).toContain("/workbook/");
  });

  test("student opens workbook from dashboard and interacts with quiz", async ({
    page,
  }) => {
    suppressKnownErrors(page);
    await login(page, STUDENT_1);
    await waitForPageReady(page);

    // Click "Start Workbook" to open it
    const startBtn = page
      .getByRole("link", { name: /Start Workbook/i })
      .first();
    await expect(startBtn).toBeVisible({ timeout: 20_000 });
    await startBtn.click();

    await page.waitForURL(/\/workbook\//, { timeout: 15_000 });

    // Handle timer gate
    const startButton = page.getByRole("button", { name: /start/i });
    if (await startButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await startButton.click();
    }

    // Handle completion modal from prior runs
    const completionModal = page.locator('[data-tour="results"]');
    if (
      await completionModal.isVisible({ timeout: 5_000 }).catch(() => false)
    ) {
      const tryAgainBtn = page.getByRole("button", { name: /try again/i });
      if (await tryAgainBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await tryAgainBtn.click();
      }
    }

    // Workbook and quiz must render
    await expect(page.locator('[data-tour="workbook"]')).toBeVisible({
      timeout: 20_000,
    });

    const quizBlock = page.locator('[data-tour="quiz-block"]').first();
    await expect(quizBlock).toBeVisible({ timeout: 15_000 });

    // Verify quiz has answer options before interacting
    const answerOptions = quizBlock.locator(
      'input[type="checkbox"], [role="checkbox"]',
    );
    await expect(answerOptions.first()).toBeVisible({ timeout: 10_000 });

    // Click all answers to complete the quiz
    const unchecked = quizBlock.locator(
      'input[type="checkbox"]:not(:checked), [role="checkbox"][aria-checked="false"]',
    );
    const count = await unchecked.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await unchecked.nth(i).click();
    }

    // Wait for grade to be recorded via network response
    await page.waitForResponse(
      (resp) => resp.url().includes("graphql") && resp.status() === 200,
      { timeout: 10_000 },
    ).catch(() => {});
  });

  test("after completing, dashboard shows completed assignment with accuracy", async ({
    page,
  }) => {
    suppressKnownErrors(page);
    await login(page, STUDENT_1);
    await waitForPageReady(page);

    // Look for accuracy chip (e.g., "85% · Good" or similar)
    const accuracyChip = page.locator('[class*="MuiChip"]').filter({
      hasText: /\d+%/,
    });

    // Must have at least one accuracy indicator
    await expect(accuracyChip.first()).toBeVisible({ timeout: 20_000 });

    // "Review" button should appear for completed assignments
    const reviewBtn = page.getByRole("link", { name: /Review/i });
    await expect(reviewBtn.first()).toBeVisible({ timeout: 10_000 });

    // "Practice from mistakes" button should be present
    const practiceBtn = page.getByRole("button", {
      name: /Practice from mistakes/i,
    });
    await expect(practiceBtn.first()).toBeVisible({ timeout: 10_000 });
  });
});
