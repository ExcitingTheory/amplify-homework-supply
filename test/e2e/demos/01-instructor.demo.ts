/**
 * Demo video 1: Instructor builds a lesson with an AI-graded exercise.
 *
 * Storyline: create a unit -> write intro text -> insert an AI-graded
 * exercise -> set grading criteria -> attach questions from the question bank
 * -> tour the dictionary, files and assignments tabs.
 *
 * Output: test-results/demos/01-instructor-builds-a-lesson.webm
 */

import { test, expect } from "@playwright/test";
import { INSTRUCTOR } from "../journeys/helpers";
import { recordDemo } from "./demoKit";

test("Demo 1: Instructor builds a lesson", async ({ browser }) => {
  await recordDemo(
    browser,
    {
      name: "01-instructor-builds-a-lesson",
      user: INSTRUCTOR,
      startPath: "/units",
    },
    async (page, demo) => {
      await demo.chapter(
        "Instructor: build a lesson",
        "Create a unit and add an AI-graded exercise",
      );

      // 1. Create a unit
      await page.waitForSelector('[data-tour="units-page"]');
      await demo.beat();
      await page.locator('[data-tour="create-unit-button"]').first().click();
      await page.waitForURL(/\/unit\/[a-f0-9-]+/, { timeout: 15_000 });
      const editor = page.locator('[data-lexical-editor="true"]').first();
      await expect(editor).toBeVisible({ timeout: 30_000 });
      await demo.beat();

      // 2. Write intro content
      await demo.type(editor, "Photosynthesis: How Plants Make Food");
      await page.keyboard.press("Enter");
      await demo.type(
        editor,
        "Read the passage, then explain what you learned in your own words.",
      );
      await page.keyboard.press("Enter");
      await demo.beat();

      // 3. Insert an AI-graded exercise
      await demo.chapter(
        "Add an AI-graded exercise",
        "Students answer in their own words and AI grades against your criteria",
        2800,
      );
      await page.locator('button[aria-controls="insert-node-menu"]').click();
      await page
        .getByRole("menuitem", { name: /AI-Graded Exercise/i })
        .click();

      const criteria = page.getByPlaceholder(/Describe how the AI should grade/i);
      await expect(criteria).toBeVisible({ timeout: 10_000 });
      await criteria.scrollIntoViewIfNeeded();
      await demo.beat();

      // 4. Grading criteria (hidden from students)
      await demo.type(
        criteria,
        "Grade on scientific accuracy. Award full marks for naming the reactants (water, carbon dioxide, light), the products (glucose, oxygen) and the chloroplast. Give partial credit for incomplete but correct answers.",
      );
      await criteria.blur();
      await demo.beat(2000);

      // 5. Attach questions from the question bank
      const search = page.getByPlaceholder(/Search and add questions/i);
      await search.scrollIntoViewIfNeeded();
      await search.click();
      await search.pressSequentially("photosynthesis", { delay: 70 });
      const option = page.getByRole("option").first();
      await expect(option).toBeVisible({ timeout: 10_000 });
      await demo.beat(1000);
      await option.click();
      await demo.beat(2000);

      // 6. Tour the side tabs
      await demo.chapter("Everything in one place", "Vocabulary, files and assignments");
      for (const tab of ["dictionary-tab", "files-tab", "assignments-tab"]) {
        const locator = page.locator(`[data-tour="${tab}"]`);
        if (await locator.isVisible().catch(() => false)) {
          await locator.click();
          await demo.beat(2500);
        }
      }
    },
  );
});
