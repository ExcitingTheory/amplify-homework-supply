/**
 * Peer Review Room – Multi-User E2E
 *
 * Tests real-time chat between two students in a peer review room:
 * 1. Instructor sets up content + section + assignment
 * 2. Student 1 completes workbook → results appear → creates peer review room
 * 3. Student 2 joins the room via code
 * 4. Both exchange chat messages and see each other's messages in real time
 *
 * This is the strongest multi-user test — it verifies real-time message
 * propagation between two different browser sessions via WebSocket.
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

test.describe("Peer Review Room", () => {
  let instructorSession: UserSession;
  let student1Session: UserSession;
  let student2Session: UserSession;

  test.afterEach(async () => {
    if (student2Session) await closeSession(student2Session);
    if (student1Session) await closeSession(student1Session);
    if (instructorSession) await closeSession(instructorSession);
  });

  test("two students exchange messages in peer review chat", async ({
    browser,
  }) => {
    const baseURL = test.info().project.use.baseURL || "https://localhost:3000";
    const sectionName = `Peer Review ${Date.now()}`;

    // All three users log in simultaneously
    [instructorSession, student1Session, student2Session] = await Promise.all([
      createUserSession(browser, INSTRUCTOR, baseURL, "/units"),
      createUserSession(browser, STUDENT_1, baseURL, "/sections"),
      createUserSession(browser, STUDENT_2, baseURL, "/sections"),
    ]);

    // Instructor: create unit → quiz → publish → section → assign
    const unitId = await createUnit(instructorSession.page, "Peer Review Unit");
    await addQuizBlock(instructorSession.page);
    await publishUnit(instructorSession.page);
    await saveUnit(instructorSession.page);
    const joinCode = await createSection(
      instructorSession.page,
      sectionName,
      "Peer review test",
    );
    await assignUnitToSection(instructorSession.page, unitId, sectionName);

    // Both students join section
    await Promise.all([
      joinSection(student1Session.page, joinCode),
      joinSection(student2Session.page, joinCode),
    ]);

    // Student 1: complete workbook to trigger results
    await openWorkbook(student1Session.page, unitId);

    // Answer quiz to complete the workbook
    const quizAnswer = student1Session.page.locator(
      '[data-tour="quiz-answers"] input[type="checkbox"], [data-tour="quiz-block"] input[type="checkbox"]',
    );
    await expect(quizAnswer.first()).toBeVisible({ timeout: 10_000 });
    await quizAnswer.first().check({ force: true });

    // Wait for results to appear (workbook completion triggers results view)
    const resultsEl = student1Session.page.locator('[data-tour="results"]');
    await expect(resultsEl).toBeVisible({ timeout: 15_000 });

    // Click "Open for Peer Review" button
    const openReviewButton = student1Session.page.getByRole("button", {
      name: /open for peer review|peer review/i,
    });
    await expect(openReviewButton.first()).toBeVisible({ timeout: 5_000 });
    await openReviewButton.first().click();

    // Click "Create Room" button in the peer review dialog
    const createRoomButton = student1Session.page.getByRole("button", {
      name: /create room/i,
    });
    await expect(createRoomButton).toBeVisible({ timeout: 5_000 });
    await createRoomButton.click();

    // Student 1 should navigate to /review/{roomId}
    await student1Session.page.waitForURL("**/review/**", { timeout: 15_000 });
    const reviewUrl = student1Session.page.url();
    const reviewMatch = reviewUrl.match(/\/review\/([a-f0-9-]+)/);
    expect(reviewMatch).not.toBeNull();
    const roomId = reviewMatch![1];

    // Student 2: join the peer review room
    await joinPeerReview(student2Session.page, roomId);

    // Both should now be on the review page — verify chat input is visible
    const chatSelector =
      'input[placeholder*="Type a message"], textarea[placeholder*="Type a message"]';

    const student1Chat = student1Session.page.locator(chatSelector).first();
    const student2Chat = student2Session.page.locator(chatSelector).first();

    await expect(student1Chat).toBeVisible({ timeout: 10_000 });
    await expect(student2Chat).toBeVisible({ timeout: 10_000 });

    // Student 1 sends a message
    await student1Chat.fill("Hello from Student 1!");
    await student1Chat.press("Enter");

    // Student 2 should see the message (real-time propagation via WebSocket)
    await expect(
      student2Session.page.getByText("Hello from Student 1!"),
    ).toBeVisible({ timeout: 15_000 });

    // Student 2 replies
    await student2Chat.fill("Reply from Student 2!");
    await student2Chat.press("Enter");

    // Student 1 should see the reply
    await expect(
      student1Session.page.getByText("Reply from Student 2!"),
    ).toBeVisible({ timeout: 15_000 });
  });
});
