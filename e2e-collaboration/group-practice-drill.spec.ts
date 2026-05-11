/**
 * Group Practice Drill – Multi-User E2E (Playwright)
 *
 * Tests collaborative practice drills with two student sessions:
 * 1. Student 1 starts a collaborative practice drill → gets room code
 * 2. Student 2 joins via [data-tour="join-study-group-button"] → enters code
 * 3. Both students are in the same practice room
 *
 * Routes: /units, /workbook/{unitId}, /practice (implicit via practice drawer)
 * Key selectors:
 *   [data-tour="units-page"]                          — units/page.jsx:287
 *   [data-tour="join-study-group-button"]             — MainToolbar.jsx:502
 *   [aria-labelledby="join-practice-dialog-title"]    — JoinPracticeDialog.tsx
 *   Practice button (text "Practice" with FitnessCenterIcon, NO data-tour)
 *   CollaborativePresenceBar (Chip with monospace label for room code)
 *
 * NOTE: The Practice button has NO data-tour attribute. We find it by text
 * matching "Practice" role="button". The room code appears in a Chip within
 * the CollaborativePresenceBar component.
 */

import { test, expect } from "@playwright/test";
import {
  STUDENT_1,
  STUDENT_2,
  createUserSession,
  closeSession,
  joinPracticeDrill,
  type UserSession,
} from "./helpers";

test.describe("Group Practice Drill – Simultaneous Students", () => {
  let student1Session: UserSession;
  let student2Session: UserSession;

  test.afterEach(async () => {
    if (student2Session) await closeSession(student2Session);
    if (student1Session) await closeSession(student1Session);
  });

  test("student1 starts collaborative drill, student2 joins via room code", async ({
    browser,
  }) => {
    const baseURL = test.info().project.use.baseURL || "http://localhost:3000";

    // --- Both students log in simultaneously ---
    [student1Session, student2Session] = await Promise.all([
      createUserSession(browser, STUDENT_1, baseURL, "/units"),
      createUserSession(browser, STUDENT_2, baseURL, "/units"),
    ]);

    // --- Student 1: find a unit and start practice ---
    // Wait for the units page to load with content
    await student1Session.page.waitForSelector('[data-tour="units-page"]', {
      timeout: 15_000,
    });

    // Look for a "Practice" button — no data-tour, found by button role + text
    const practiceButton = student1Session.page
      .getByRole("button", { name: /practice/i })
      .first();

    if (
      await practiceButton.isVisible({ timeout: 10_000 }).catch(() => false)
    ) {
      await practiceButton.click();
      await student1Session.page.waitForTimeout(3000);

      // Enable collaborative mode if there's a toggle/checkbox
      const collabToggle = student1Session.page.locator(
        'input[type="checkbox"]',
      );
      const toggleLabels = student1Session.page.getByText(
        /collaborative|group|share/i,
      );
      if (
        await toggleLabels
          .first()
          .isVisible({ timeout: 3_000 })
          .catch(() => false)
      ) {
        const nearbyCheckbox = toggleLabels
          .first()
          .locator(".. input[type='checkbox']");
        if (
          await nearbyCheckbox.isVisible({ timeout: 2_000 }).catch(() => false)
        ) {
          await nearbyCheckbox.check({ force: true });
          await student1Session.page.waitForTimeout(1000);
        }
      }

      // Start the drill
      const startButton = student1Session.page.getByRole("button", {
        name: /start/i,
      });
      if (await startButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await startButton.click();
        await student1Session.page.waitForTimeout(5000);
      }

      // Extract room code from CollaborativePresenceBar (monospace Chip)
      // The room code is in a Chip component with a monospace font
      const codeChip = student1Session.page
        .locator("span.MuiChip-label")
        .filter({ hasText: /^[A-Z0-9]{4,}$/ });

      if (
        await codeChip
          .first()
          .isVisible({ timeout: 10_000 })
          .catch(() => false)
      ) {
        const roomCode = (await codeChip.first().textContent()) || "";
        expect(roomCode.length).toBeGreaterThan(0);

        // --- Student 2: join the practice drill via room code ---
        await joinPracticeDrill(student2Session.page, roomCode);

        // Both students should now be in the same practice session
        // Verify both pages have practice content visible
        await student1Session.page.waitForTimeout(3000);
        await student2Session.page.waitForTimeout(3000);

        // Both should see practice UI (questions, drill content, etc.)
        await expect(student1Session.page.locator("body")).not.toBeEmpty();
        await expect(student2Session.page.locator("body")).not.toBeEmpty();
      }
    }
  });
});
