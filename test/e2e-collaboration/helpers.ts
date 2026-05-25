import {
  type Page,
  type BrowserContext,
  type Browser,
  expect,
} from "@playwright/test";

// ---------------------------------------------------------------------------
// Test Users
// ---------------------------------------------------------------------------

export const INSTRUCTOR = {
  username: process.env.TEACHER_USERNAME || "instructor1@example.com",
  password: process.env.TEACHER_PASSWORD || "TestPassword123!",
};

export const STUDENT_1 = {
  username: process.env.LEARNER_USERNAME || "student1@example.com",
  password: process.env.LEARNER_PASSWORD || "TestPassword123!",
};

export const STUDENT_2 = {
  username: "student2@example.com",
  password: process.env.LEARNER_PASSWORD || "TestPassword123!",
};

export type TestUser = { username: string; password: string };

// ---------------------------------------------------------------------------
// Session Management — each user gets their own BrowserContext + Page
// ---------------------------------------------------------------------------

export interface UserSession {
  context: BrowserContext;
  page: Page;
  user: TestUser;
}

/**
 * Create an isolated browser context and page for a user, then log them in.
 * Navigate directly to the target URL — the Authenticator modal will appear,
 * and after login the user will already be on the right page.
 */
export async function createUserSession(
  browser: Browser,
  user: TestUser,
  baseURL: string,
  targetPath = "/",
): Promise<UserSession> {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();

  // Suppress known console errors that don't affect functionality
  page.on("pageerror", (err) => {
    const msg = err.message;
    if (
      msg.includes("Cannot read properties of null") ||
      msg.includes("i18next") ||
      msg.includes("useTranslation") ||
      msg.includes("Hydration failed") ||
      msg.includes("exceeds maximum value limit") ||
      msg.includes("Maximum update depth exceeded") ||
      msg.includes("No current user") ||
      msg.includes("not authenticated") ||
      msg.includes("DuplicatedOperationError")
    ) {
      return;
    }
    console.warn(`[${user.username}] Page error:`, msg);
  });

  await loginOnPage(page, user, `${baseURL}${targetPath}`);

  return { context, page, user };
}

/**
 * Close a user session (context + page).
 */
export async function closeSession(session: UserSession): Promise<void> {
  await session.page.close();
  await session.context.close();
}

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

/**
 * Navigate to a URL and log in via the Amplify Authenticator modal.
 * After login completes, the user is already on the target page.
 *
 * Selectors used:
 * - input[name="username"]  — Amplify Authenticator sign-in field
 * - input[name="password"]  — Amplify Authenticator password field
 * - button[type="submit"]   — Amplify Authenticator submit button
 * - #user-button            — MainToolbar.jsx:270 (post-login indicator)
 */
export async function loginOnPage(
  page: Page,
  user: TestUser,
  url: string,
): Promise<void> {
  await page.goto(url, { timeout: 30_000 });

  // Wait for the Amplify Authenticator form to appear
  await page.waitForSelector('input[name="username"]', { timeout: 20_000 });
  await page.locator('input[name="username"]').fill(user.username);
  await page.locator('input[name="password"]').fill(user.password);
  await page.locator('button[type="submit"]').first().click();

  // Wait for auth to complete — #user-button in MainToolbar confirms login
  await page.waitForSelector("#user-button", { timeout: 30_000 });

  // Brief wait to ensure Amplify has flushed tokens to storage
  await page.waitForTimeout(500);
}

// ---------------------------------------------------------------------------
// Navigation Helpers
// ---------------------------------------------------------------------------

/**
 * Navigate to /units. Waits for [data-tour="units-page"] (units/page.jsx:287).
 */
export async function goToUnits(page: Page): Promise<void> {
  await page.goto("/units");
  await page.waitForSelector('[data-tour="units-page"]', { timeout: 15_000 });
  // Wait for React hydration to complete before interacting
  await page
    .waitForLoadState("networkidle", { timeout: 10_000 })
    .catch(() => {});
}

/**
 * Navigate to /sections. Waits for [data-tour="sections-page"] (sections/page.jsx:258).
 */
export async function goToSections(page: Page): Promise<void> {
  await page.goto("/sections");
  await page.waitForSelector('[data-tour="sections-page"]', {
    timeout: 15_000,
  });
  // Wait for React hydration to complete before interacting
  await page
    .waitForLoadState("networkidle", { timeout: 10_000 })
    .catch(() => {});
}

// ---------------------------------------------------------------------------
// Unit Creation & Editing
// ---------------------------------------------------------------------------

/**
 * Create a new unit and return its ID. Stays on the editor page.
 *
 * Selectors used:
 * - [data-tour="create-unit-button"]  — units/page.jsx:316
 * - [data-tour="editor"]             — Editor3/index.tsx:605
 * - [data-lexical-editor="true"]     — Lexical editor root
 */
export async function createUnit(page: Page, name?: string): Promise<string> {
  await goToUnits(page);

  await page.locator('[data-tour="create-unit-button"]').first().click();
  await page.waitForURL(/\/unit\/[a-f0-9-]+/, { timeout: 15_000 });

  // Wait for the editor to load
  await page.waitForSelector('[data-tour="editor"]', { timeout: 30_000 });
  await page.waitForSelector('[data-lexical-editor="true"]', {
    timeout: 15_000,
  });
  await page.waitForTimeout(2000);

  // Extract unit ID from URL
  const url = page.url();
  const match = url.match(/\/unit\/([a-f0-9-]+)/);
  if (!match) throw new Error(`Could not extract unit ID from URL: ${url}`);
  const unitId = match[1];

  // Set name if provided — click the unit title and type
  if (name) {
    const titleEl = page.getByText("Untitled Unit");
    if (await titleEl.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await titleEl.click();
      await page.waitForTimeout(500);
      const nameInput = page.locator("input:visible").first();
      await nameInput.clear();
      await nameInput.fill(name);
      await nameInput.blur();
      await page.waitForTimeout(2000);
    }
  }

  return unitId;
}

/**
 * Publish the unit currently open in the editor.
 *
 * Selectors used:
 * - #status-select               — ToolBarPlugin.jsx:846 (MUI Select)
 * - li[data-value="PUBLISHED"]   — ToolBarPlugin.jsx:861 (MenuItem)
 */
export async function publishUnit(page: Page): Promise<void> {
  await page.locator("#status-select").click();
  await page.waitForTimeout(500);
  await page.locator('li[data-value="PUBLISHED"]').click();
  await page.waitForTimeout(2000);
}

/**
 * Save unit content — clicks the Save button in the toolbar.
 *
 * Selector: button[title="Save now (automatic save happens 2 seconds after you stop typing)"]
 * Source: Editor3/components/Save.jsx:87
 */
export async function saveUnit(page: Page): Promise<void> {
  const saveButton = page.locator(
    'button[title="Save now (automatic save happens 2 seconds after you stop typing)"]',
  );
  await saveButton.click({ force: true });
  await page.waitForTimeout(2000);
}

/**
 * Insert a quiz block via the toolbar Insert menu.
 *
 * Selectors used:
 * - button[aria-controls="insert-node-menu"]  — ToolBarPlugin.jsx:1103
 * - #insert-node-menu li (filtered by quiz text) — ToolBarPlugin.jsx:1268
 * - [data-tour="quiz-block"]                  — QuizComponent.jsx:174
 */
export async function addQuizBlock(page: Page): Promise<void> {
  // Open the Insert dropdown menu
  await page.locator('button[aria-controls="insert-node-menu"]').click();
  // MUI Menu renders as a Portal with role="menu" (no id attribute)
  await page
    .locator('ul[role="menu"]')
    .waitFor({ state: "visible", timeout: 5_000 });

  // Click the Multiple Choice Quiz menu item (match by text since label is translated)
  const quizItem = page
    .locator('ul[role="menu"] li')
    .filter({ hasText: /quiz|multiple choice/i });
  await quizItem.click();
  await page.waitForTimeout(1000);

  // Verify quiz block appeared
  await expect(page.locator('[data-tour="quiz-block"]').first()).toBeVisible({
    timeout: 5_000,
  });
}

// ---------------------------------------------------------------------------
// Section Helpers
// ---------------------------------------------------------------------------

/**
 * Create a section and return its join code.
 *
 * Selectors used:
 * - [data-tour="create-section-button"]  — sections/page.jsx:361
 * - [data-tour="section-form"]           — sections/page.jsx:264
 * - [data-tour="section-card"]           — sections/page.jsx:441
 * - [data-tour="join-code"]              — sections/page.jsx:500
 */
export async function createSection(
  page: Page,
  name: string,
  description?: string,
): Promise<string> {
  await goToSections(page);

  await page.locator('[data-tour="create-section-button"]').click();
  await page.waitForSelector('[data-tour="section-form"]', { timeout: 10_000 });
  // Brief pause to ensure dialog event handlers are attached after hydration
  await page.waitForTimeout(500);

  // Fill the section form
  await page
    .locator('[data-tour="section-form"] input[name="name"]')
    .fill(name);
  await page
    .locator('[data-tour="section-form"] textarea[name="description"]')
    .fill(description || "Playwright test section");

  // Submit the form
  const createBtn = page
    .locator('[data-tour="section-form"]')
    .getByRole("button", { name: /create/i });
  await createBtn.click();

  // If the dialog is still open after 5s, retry (hydration timing)
  const dialogStillOpen = await page
    .locator('[data-tour="section-form"]')
    .isVisible({ timeout: 5_000 })
    .catch(() => false);
  if (dialogStillOpen) {
    await createBtn.click();
  }

  // Wait for section to appear (mutation + subscription delivery)
  await expect(page.getByText(name)).toBeVisible({ timeout: 30_000 });

  // Extract join code from the section card's join-code chip
  const card = page
    .locator('[data-tour="section-card"]')
    .filter({ hasText: name });
  const codeEl = card.locator('[data-tour="join-code"]');
  let joinCode: string;

  if ((await codeEl.count()) > 0) {
    joinCode = (await codeEl.first().textContent()) || "";
  } else {
    const cardText = (await card.textContent()) || "";
    const match = cardText.match(/([A-Z0-9-]{4,})/i);
    joinCode = match?.[1] || "";
  }

  if (!joinCode) throw new Error("Could not extract join code");
  return joinCode.trim();
}

/**
 * Join a section using a join code.
 *
 * Selectors used:
 * - [data-tour="join-section-button"]     — MainToolbar.jsx:510
 * - [data-tour="join-section-dialog"]     — MainToolbar.jsx:772
 * - input[name="code"]                   — MainToolbar.jsx:801
 * - button[type="submit"]               — MainToolbar.jsx:831
 */
export async function joinSection(page: Page, joinCode: string): Promise<void> {
  await goToSections(page);

  await page.locator('[data-tour="join-section-button"]').click();
  await page.waitForSelector('[data-tour="join-section-dialog"]', {
    timeout: 10_000,
  });

  await page
    .locator('[data-tour="join-section-dialog"] input[name="code"]')
    .fill(joinCode);

  await page
    .locator('[data-tour="join-section-dialog"] button[type="submit"]')
    .click();

  // joinSection forces auth refresh + page reload
  await page.waitForTimeout(5000);
  await page.waitForSelector("#user-button", { timeout: 20_000 });
}

/**
 * Assign a unit to a section from the editor's assignments tab.
 *
 * Selectors used:
 * - [data-tour="editor"]                  — Editor3/index.tsx:605
 * - [data-tour="assignments-tab"]         — TabsVerticalLeft.jsx:198
 * - [data-tour="assignment-settings"]     — AssignmentConfiguration.jsx:227
 * - [data-tour="due-date-picker"] input   — AssignmentConfiguration.jsx:246
 * - [data-tour="unit-selector"]           — AssignmentConfiguration.jsx:263
 * Note: Assignment auto-saves when both due date and section are set (no submit button).
 */
export async function assignUnitToSection(
  page: Page,
  unitId: string,
  sectionName: string,
): Promise<void> {
  await page.goto(`/unit/${unitId}`);
  await page.waitForSelector('[data-tour="editor"]', { timeout: 30_000 });

  await page.locator('[data-tour="assignments-tab"]').click();
  await page.waitForSelector('[data-tour="assignment-settings"]', {
    timeout: 10_000,
  });

  // Set due date (7 days from now)
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7);
  const dueDateInput = page.locator('[data-tour="due-date-picker"] input');
  await dueDateInput.fill(futureDate.toISOString().slice(0, 16));

  // Select section from the dropdown
  await page.locator('[data-tour="unit-selector"]').click();
  await page.waitForSelector('[role="listbox"]', { timeout: 5_000 });
  await page
    .locator('[role="option"]')
    .filter({ hasText: sectionName })
    .first()
    .scrollIntoViewIfNeeded();
  await page
    .locator('[role="option"]')
    .filter({ hasText: sectionName })
    .first()
    .click();

  // Assignment auto-saves via useEffect when both due date and section are set.
  // Wait for the assignment to appear in the list below the form.
  await page
    .locator('[data-tour="assignment-settings"]')
    .locator("li")
    .filter({ hasText: sectionName })
    .waitFor({ timeout: 15_000 });
}

// ---------------------------------------------------------------------------
// Workbook Helpers
// ---------------------------------------------------------------------------

/**
 * Handle the timer gate if present (click Start button).
 * Source: WorkbookClient.tsx — Button variant="contained" with translated "workbook.start"
 */
export async function handleTimerGate(page: Page): Promise<void> {
  const startButton = page.getByRole("button", { name: /start/i });
  if (await startButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await startButton.click();
    await page.waitForTimeout(2000);
  }
}

/**
 * Open workbook for a unit ID, handling timer gate if present.
 *
 * Selectors used:
 * - [data-tour="workbook-content"]  — WorkbookClient.tsx:225
 * - [data-tour="workbook"]          — Workbook.tsx:218
 */
export async function openWorkbook(page: Page, unitId: string): Promise<void> {
  await page.goto(`/workbook/${unitId}`, { timeout: 30_000 });
  await page.waitForTimeout(3000);
  await handleTimerGate(page);
  await page.waitForSelector(
    '[data-tour="workbook-content"], [data-tour="workbook"]',
    { timeout: 30_000 },
  );
}

// ---------------------------------------------------------------------------
// Practice Drill Helpers
// ---------------------------------------------------------------------------

/**
 * Open the Join Study Group dialog from the AppBar button.
 *
 * Selectors used:
 * - [data-tour="join-study-group-button"]              — MainToolbar.jsx:502
 * - [aria-labelledby="join-practice-dialog-title"]     — JoinPracticeDialog.tsx
 */
export async function openJoinStudyGroupDialog(page: Page): Promise<void> {
  await page.locator('[data-tour="join-study-group-button"]').click();
  await page.waitForSelector('[aria-labelledby="join-practice-dialog-title"]', {
    timeout: 10_000,
  });
}

/**
 * Join a practice drill session via room code.
 */
export async function joinPracticeDrill(
  page: Page,
  roomCode: string,
): Promise<void> {
  await openJoinStudyGroupDialog(page);

  // Fill the room code input (monospace TextField with placeholder "ABC123")
  const dialog = page.locator('[aria-labelledby="join-practice-dialog-title"]');
  await dialog.locator("input").fill(roomCode.toUpperCase());

  // Click "Join Session" button
  await dialog.getByRole("button", { name: /join session/i }).click();
  await page.waitForTimeout(5000);
}

// ---------------------------------------------------------------------------
// Peer Review Helpers
// ---------------------------------------------------------------------------

/**
 * Open the Join Peer Review dialog from the nav drawer.
 * The drawer has a ListItemButton with primary text "Join Peer Review".
 */
export async function openJoinPeerReviewDialog(page: Page): Promise<void> {
  // Open nav drawer via hamburger menu
  const menuButton = page.locator('button[aria-label="menu"]').first();
  if (await menuButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await menuButton.click();
    await page.waitForTimeout(1000);
  }

  // Click "Join Peer Review" in the drawer
  await page.getByText("Join Peer Review").click();
  await page.waitForSelector(
    '[aria-labelledby="join-peer-review-dialog-title"]',
    { timeout: 10_000 },
  );
}

/**
 * Join a peer review room via room code.
 *
 * Selectors used:
 * - [aria-labelledby="join-peer-review-dialog-title"]  — JoinPeerReviewDialog.tsx
 * - TextField (no name/id) with placeholder "room-abc123"
 * - Button "Join Review"
 */
export async function joinPeerReview(
  page: Page,
  roomCode: string,
): Promise<void> {
  await openJoinPeerReviewDialog(page);

  // Fill the room code input
  const dialog = page.locator(
    '[aria-labelledby="join-peer-review-dialog-title"]',
  );
  await dialog.locator("input").fill(roomCode);

  // Click "Join Review" button
  await dialog.getByRole("button", { name: /join review/i }).click();

  // Should navigate to /review/{roomId}
  await page.waitForURL("**/review/**", { timeout: 15_000 });
}
