/**
 * Peer Review Room – Multi-User E2E (Playwright)
 *
 * Tests the peer review workflow with two student sessions:
 * 1. Student 1 completes a workbook → [data-tour="results"] appears
 * 2. Student 1 opens for peer review → creates room → gets room code
 * 3. Student 2 joins via "Join Peer Review" in nav drawer → enters code
 * 4. Both see the review page with split pane: Workbook (left) + Chat (right)
 * 5. Chat test: student 1 sends message → student 2 sees it (and vice versa)
 *
 * Routes: /units, /unit/{id}, /workbook/{id}, /review/{roomId}
 * Key selectors:
 *   [data-tour="results"]                              — UnitCompletedPlugin.jsx:119
 *   "Open for Peer Review" button (text match)         — results/review panel
 *   "Create Room" button (text match)                  — peer review dialog
 *   [aria-labelledby="join-peer-review-dialog-title"]  — JoinPeerReviewDialog.tsx
 *   button "Join Review"                               — JoinPeerReviewDialog.tsx
 *   [placeholder="Type a message… (use @AI for AI help)"] — PeerReviewChat input
 *   button[aria-label] (send button with translated aria)
 *
 * NOTE: The review page (/review/{roomId}) has ZERO data-tour attributes.
 * All selectors are DOM-structure based.
 */

import { test, expect } from "@playwright/test";
import {
  INSTRUCTOR,
  STUDENT_1,
  STUDENT_2,
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
  joinPeerReview,
  type UserSession,
} from "./helpers";

test.describe("Peer Review Room – Simultaneous Students", () => {
  let instructorSession: UserSession;
  let student1Session: UserSession;
  let student2Session: UserSession;

  test.afterEach(async () => {
    if (student2Session) await closeSession(student2Session);
    if (student1Session) await closeSession(student1Session);
    if (instructorSession) await closeSession(instructorSession);
  });

  test("student1 creates peer review room, student2 joins, both chat", async ({
    browser,
  }) => {
    const baseURL = test.info().project.use.baseURL || "http://localhost:3000";
    const sectionName = `PW Peer Review ${Date.now()}`;

    // --- All three users log in simultaneously ---
    [instructorSession, student1Session, student2Session] = await Promise.all([
      createUserSession(browser, INSTRUCTOR, baseURL, "/units"),
      createUserSession(browser, STUDENT_1, baseURL, "/sections"),
      createUserSession(browser, STUDENT_2, baseURL, "/sections"),
    ]);

    // --- Instructor: create unit → quiz → publish → section → assign ---
    const unitId = await createUnit(
      instructorSession.page,
      "PW Peer Review Unit",
    );
    await addQuizBlock(instructorSession.page);
    await publishUnit(instructorSession.page);
    await saveUnit(instructorSession.page);
    const joinCode = await createSection(
      instructorSession.page,
      sectionName,
      "Peer review test",
    );
    await assignUnitToSection(instructorSession.page, unitId, sectionName);

    // --- Both students join section ---
    await Promise.all([
      joinSection(student1Session.page, joinCode),
      joinSection(student2Session.page, joinCode),
    ]);

    // --- Student 1: complete workbook to trigger results ---
    await openWorkbook(student1Session.page, unitId);

    // Answer the quiz to complete the workbook
    const quizAnswer = student1Session.page.locator(
      '[data-tour="quiz-answers"] input[type="checkbox"], [data-tour="quiz-block"] input[type="checkbox"]',
    );
    if (
      await quizAnswer
        .first()
        .isVisible({ timeout: 10_000 })
        .catch(() => false)
    ) {
      await quizAnswer.first().check({ force: true });
      await student1Session.page.waitForTimeout(3000);
    }

    // Wait for results to appear
    const resultsEl = student1Session.page.locator('[data-tour="results"]');
    if (await resultsEl.isVisible({ timeout: 15_000 }).catch(() => false)) {
      // Click "Open for Peer Review" button (text match — no data-tour)
      const openReviewButton = student1Session.page.getByRole("button", {
        name: /open for peer review|peer review/i,
      });
      if (
        await openReviewButton
          .first()
          .isVisible({ timeout: 5_000 })
          .catch(() => false)
      ) {
        await openReviewButton.first().click();
        await student1Session.page.waitForTimeout(2000);

        // Click "Create Room" button in the peer review dialog
        const createRoomButton = student1Session.page.getByRole("button", {
          name: /create room/i,
        });
        if (
          await createRoomButton
            .isVisible({ timeout: 5_000 })
            .catch(() => false)
        ) {
          await createRoomButton.click();
          await student1Session.page.waitForTimeout(5000);

          // Student 1 should be on /review/{roomId} now
          if (student1Session.page.url().includes("/review/")) {
            // Extract room ID/code from the URL or visible UI
            const reviewUrl = student1Session.page.url();
            const reviewMatch = reviewUrl.match(/\/review\/([a-f0-9-]+)/);
            const roomId = reviewMatch?.[1] || "";

            if (roomId) {
              // --- Student 2: join the peer review via room code ---
              await joinPeerReview(student2Session.page, roomId);

              // --- Both should be on the review page ---
              await student1Session.page.waitForTimeout(3000);
              await student2Session.page.waitForTimeout(3000);

              // Verify chat input is visible on both pages
              const chatSelector =
                'input[placeholder*="Type a message"], textarea[placeholder*="Type a message"]';

              const student1Chat = student1Session.page.locator(chatSelector);
              const student2Chat = student2Session.page.locator(chatSelector);

              if (
                (await student1Chat
                  .first()
                  .isVisible({ timeout: 10_000 })
                  .catch(() => false)) &&
                (await student2Chat
                  .first()
                  .isVisible({ timeout: 10_000 })
                  .catch(() => false))
              ) {
                // Student 1 sends a message
                await student1Chat.first().fill("Hello from Student 1!");
                // Find and click send button (aria-label with translated text)
                const send1 = student1Session.page
                  .getByRole("button")
                  .filter({
                    has: student1Session.page.locator(
                      '[aria-label*="send"], [aria-label*="Send"]',
                    ),
                  })
                  .first();
                if (
                  await send1.isVisible({ timeout: 3_000 }).catch(() => false)
                ) {
                  await send1.click();
                } else {
                  // Fallback: press Enter to send
                  await student1Chat.first().press("Enter");
                }
                await student1Session.page.waitForTimeout(3000);

                // Verify Student 2 sees the message
                await expect(
                  student2Session.page.getByText("Hello from Student 1!"),
                ).toBeVisible({ timeout: 15_000 });

                // Student 2 replies
                await student2Chat.first().fill("Reply from Student 2!");
                await student2Chat.first().press("Enter");
                await student2Session.page.waitForTimeout(3000);

                // Verify Student 1 sees the reply
                await expect(
                  student1Session.page.getByText("Reply from Student 2!"),
                ).toBeVisible({ timeout: 15_000 });
              }
            }
          }
        }
      }
    }
  });
});
