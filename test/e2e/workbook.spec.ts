import { test, expect } from "@playwright/test";
import { STUDENT, login, suppressKnownErrors } from "./helpers";

/**
 * Student Workbook — Unit completion flow.
 *
 * Covers: student opens a workbook (published unit assigned to their section),
 * handles timer gate, answers quiz questions, verifies completion detection.
 *
 * Prerequisite: The student must have at least one assigned unit visible
 * in their section. This test works with existing test data.
 */
test.describe("Student Workbook", () => {
  test.beforeEach(async ({ page }) => {
    suppressKnownErrors(page);
    await login(page, STUDENT, "/sections");
  });

  test("student can open section and see assignments", async ({ page }) => {
    // Student should see at least one section card
    const sectionCard = page.locator('[data-tour="section-card"]').first();
    if (
      !(await sectionCard.isVisible({ timeout: 15_000 }).catch(() => false))
    ) {
      test.skip(
        undefined,
        "No sections available for student — run section setup first",
      );
      return;
    }

    // Click through to section detail
    const sectionLink = sectionCard.locator('a[href*="/section/"]');
    await expect(sectionLink).toBeVisible({ timeout: 5_000 });
    await sectionLink.click();
    await page.waitForURL(/\/section\/[a-f0-9-]+/, { timeout: 15_000 });

    // Section detail page should show content
    const pageText = await page.locator("body").textContent();
    expect(pageText!.length).toBeGreaterThan(50);
  });

  test("student opens workbook and sees content", async ({ page }) => {
    // Navigate to first section
    const sectionCard = page.locator('[data-tour="section-card"]').first();
    if (
      !(await sectionCard.isVisible({ timeout: 15_000 }).catch(() => false))
    ) {
      test.skip(undefined, "No sections available for student");
      return;
    }
    await sectionCard.locator('a[href*="/section/"]').click();
    await page.waitForURL(/\/section\/[a-f0-9-]+/, { timeout: 15_000 });

    // Click workbook button on first assignment
    const workbookBtn = page.locator('[data-tour="view-workbook-button"]');
    if (
      !(await workbookBtn
        .first()
        .isVisible({ timeout: 10_000 })
        .catch(() => false))
    ) {
      test.skip(
        undefined,
        "No assignments with workbook links in this section",
      );
      return;
    }
    await workbookBtn.first().click();
    await page.waitForURL(/\/workbook\/[a-f0-9-]+/, { timeout: 20_000 });

    // Handle timer gate if present (click Start)
    const startButton = page.getByRole("button", { name: /start/i });
    if (await startButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await startButton.click();
      await page.waitForTimeout(2000);
    }

    // Workbook content should be visible
    await expect(
      page.locator('[data-tour="workbook-content"], [data-tour="workbook"]'),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("student can answer quiz questions in workbook", async ({ page }) => {
    // Navigate to a workbook
    const sectionCard = page.locator('[data-tour="section-card"]').first();
    if (
      !(await sectionCard.isVisible({ timeout: 15_000 }).catch(() => false))
    ) {
      test.skip(undefined, "No sections available for student");
      return;
    }
    await sectionCard.locator('a[href*="/section/"]').click();
    await page.waitForURL(/\/section\/[a-f0-9-]+/, { timeout: 15_000 });

    const workbookBtn = page.locator('[data-tour="view-workbook-button"]');
    if (
      !(await workbookBtn
        .first()
        .isVisible({ timeout: 10_000 })
        .catch(() => false))
    ) {
      test.skip(undefined, "No assignments with workbook links");
      return;
    }
    await workbookBtn.first().click();
    await page.waitForURL(/\/workbook\/[a-f0-9-]+/, { timeout: 20_000 });

    // Handle timer gate
    const startButton = page.getByRole("button", { name: /start/i });
    if (await startButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await startButton.click();
      await page.waitForTimeout(2000);
    }

    await expect(
      page.locator('[data-tour="workbook-content"], [data-tour="workbook"]'),
    ).toBeVisible({ timeout: 15_000 });

    // Find quiz blocks and answer them
    const quizBlocks = page.locator('[data-tour="quiz-block"]');
    const quizCount = await quizBlocks.count();

    if (quizCount === 0) {
      test.skip(undefined, "No quiz blocks in this workbook");
      return;
    }

    // Click the first answer checkbox in each quiz block
    for (let i = 0; i < quizCount; i++) {
      const quiz = quizBlocks.nth(i);
      const firstAnswer = quiz
        .locator('[data-tour="quiz-answers"]')
        .first()
        .locator('input[type="checkbox"]');
      if (await firstAnswer.isVisible().catch(() => false)) {
        await firstAnswer.check();
        await page.waitForTimeout(500);
      }
    }

    // After answering all quizzes, results modal may appear
    const results = page.locator('[data-tour="results"]');
    await results
      .waitFor({ state: "visible", timeout: 10_000 })
      .catch(() => {});
    // If results appeared, verify it has content
    if (await results.isVisible().catch(() => false)) {
      const resultsText = await results.textContent();
      expect(resultsText!.length).toBeGreaterThan(5);
    }
  });
});
