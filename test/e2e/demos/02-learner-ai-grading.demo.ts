/**
 * Demo video 2: Learner completes an AI-graded exercise.
 *
 * Storyline: dashboard -> open the "AI Biology Exercise" workbook -> answer
 * each question in free text -> AI grades with a score and feedback.
 *
 * Needs seed data (student1 is enrolled in Biology 101 with the
 * "AI Biology Exercise" assignment) and a working grading backend (OpenAI key
 * configured for `app/api/grade-ai`). Set DEMO_AI_UNIT_ID to jump straight to
 * a specific workbook instead of finding it on the dashboard.
 *
 * Output: test-results/demos/02-learner-ai-graded-exercise.webm
 */

import { test, expect } from "@playwright/test";
import { STUDENT_1 } from "../journeys/helpers";
import { recordDemo } from "./demoKit";

const ANSWERS = [
  "Photosynthesis turns carbon dioxide and water into glucose and oxygen, using light energy captured by chlorophyll.",
  "It happens in the chloroplasts of plant cells, where chlorophyll absorbs sunlight.",
  "The Calvin cycle uses the energy from the light reactions to build sugar from carbon dioxide.",
];

test("Demo 2: Learner completes an AI-graded exercise", async ({ browser }) => {
  await recordDemo(
    browser,
    {
      name: "02-learner-ai-graded-exercise",
      user: STUDENT_1,
      startPath: "/",
    },
    async (page, demo) => {
      await demo.chapter(
        "Learner: AI-graded homework",
        "Answer in your own words and get instant, personalised feedback",
      );

      // 1. Find the assignment on the dashboard
      const directUnitId = process.env.DEMO_AI_UNIT_ID;
      if (directUnitId) {
        await page.goto(`/workbook/${directUnitId}`);
      } else {
        const card = page
          .locator('li, [class*="MuiCard-root"], [class*="MuiPaper-root"]')
          .filter({ hasText: /AI Biology Exercise/i })
          .filter({ has: page.getByRole("link", { name: /Start Workbook|Review|Continue/i }) })
          .last();
        await expect(card).toBeVisible({ timeout: 20_000 });
        await card.scrollIntoViewIfNeeded();
        await demo.beat(1800);
        await card.getByRole("link", { name: /Start Workbook|Review|Continue/i }).first().click();
      }
      await page.waitForURL(/\/workbook\//, { timeout: 20_000 });

      // 2. Timer gate / previous results from earlier takes
      const startButton = page.getByRole("button", { name: /^start/i });
      if (await startButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await demo.beat(1000);
        await startButton.click();
      }
      const tryAgain = page.getByRole("button", { name: /try again/i });
      if (await tryAgain.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await tryAgain.click();
      }

      await expect(page.locator('[data-tour="workbook"]')).toBeVisible({
        timeout: 20_000,
      });
      const inputs = page.locator('[data-testid="custom-ai-input"]');
      await expect(inputs.first()).toBeVisible({ timeout: 20_000 });
      await demo.beat(2500);

      // 3. Answer each question and wait for the AI to grade it
      const questionCount = await inputs.count();
      for (let i = 0; i < questionCount; i++) {
        const input = page
          .locator('[data-testid="custom-ai-input"][contenteditable="true"]')
          .first();
        await input.scrollIntoViewIfNeeded();
        await demo.type(input, ANSWERS[i % ANSWERS.length]);
        await demo.beat(1000);

        const panel = input.locator("xpath=ancestor::li[1]");
        await panel.getByRole("button", { name: /submit/i }).click();

        await expect(panel.getByText(/AI is grading/i)).toBeVisible({
          timeout: 10_000,
        });
        await demo.beat(1500);
        await expect(panel.getByText(/Score:\s*\d+\/100/)).toBeVisible({
          timeout: 90_000,
        });
        await panel.scrollIntoViewIfNeeded();
        await demo.beat(4500); // time to read the feedback
      }

      // 4. Show overall progress and accuracy
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
      await demo.beat(3500);
    },
  );
});
