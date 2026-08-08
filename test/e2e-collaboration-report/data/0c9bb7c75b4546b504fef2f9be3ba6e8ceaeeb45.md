# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: collaborative-chat.spec.ts >> Collaborative Chat >> typing indicator shows when peer is typing
- Location: test/e2e-collaboration/collaborative-chat.spec.ts:293:7

# Error details

```
TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.
Call log:
  - waiting for locator('[data-tour="sections-page"]') to be visible

```

# Test source

```ts
  63  |  * and after login the user will already be on the right page.
  64  |  */
  65  | export async function createUserSession(
  66  |   browser: Browser,
  67  |   user: TestUser,
  68  |   baseURL: string,
  69  |   targetPath = "/",
  70  | ): Promise<UserSession> {
  71  |   const context = await browser.newContext({
  72  |     viewport: { width: 1280, height: 720 },
  73  |   });
  74  |   const page = await context.newPage();
  75  | 
  76  |   // Suppress known console errors that don't affect functionality
  77  |   page.on("pageerror", (err) => {
  78  |     const msg = err.message;
  79  |     if (
  80  |       msg.includes("Cannot read properties of null") ||
  81  |       msg.includes("i18next") ||
  82  |       msg.includes("useTranslation") ||
  83  |       msg.includes("Hydration failed") ||
  84  |       msg.includes("exceeds maximum value limit") ||
  85  |       msg.includes("Maximum update depth exceeded") ||
  86  |       msg.includes("No current user") ||
  87  |       msg.includes("not authenticated") ||
  88  |       msg.includes("DuplicatedOperationError")
  89  |     ) {
  90  |       return;
  91  |     }
  92  |     console.warn("[user-session] Page error:", msg);
  93  |   });
  94  | 
  95  |   await loginOnPage(page, user, `${baseURL}${targetPath}`);
  96  | 
  97  |   return { context, page, user };
  98  | }
  99  | 
  100 | /**
  101 |  * Close a user session (context + page).
  102 |  */
  103 | export async function closeSession(session: UserSession): Promise<void> {
  104 |   await session.page.close();
  105 |   await session.context.close();
  106 | }
  107 | 
  108 | // ---------------------------------------------------------------------------
  109 | // Authentication
  110 | // ---------------------------------------------------------------------------
  111 | 
  112 | /**
  113 |  * Navigate to a URL and log in via the Amplify Authenticator modal.
  114 |  * After login completes, the user is already on the target page.
  115 |  *
  116 |  * Selectors used:
  117 |  * - input[name="username"]  — Amplify Authenticator sign-in field
  118 |  * - input[name="password"]  — Amplify Authenticator password field
  119 |  * - button[type="submit"]   — Amplify Authenticator submit button
  120 |  * - #user-button            — MainToolbar.jsx:270 (post-login indicator)
  121 |  */
  122 | export async function loginOnPage(
  123 |   page: Page,
  124 |   user: TestUser,
  125 |   url: string,
  126 | ): Promise<void> {
  127 |   await page.goto(url, { timeout: 30_000 });
  128 | 
  129 |   // Wait for the Amplify Authenticator form to appear
  130 |   await page.waitForSelector('input[name="username"]', { timeout: 20_000 });
  131 |   await page.locator('input[name="username"]').fill(user.username);
  132 |   await page.locator('input[name="password"]').fill(user.password);
  133 |   await page.locator('button[type="submit"]').first().click();
  134 | 
  135 |   // Wait for auth to complete — #user-button in MainToolbar confirms login
  136 |   await page.waitForSelector("#user-button", { timeout: 30_000 });
  137 | 
  138 |   // Brief wait to ensure Amplify has flushed tokens to storage
  139 |   await page.waitForTimeout(500);
  140 | }
  141 | 
  142 | // ---------------------------------------------------------------------------
  143 | // Navigation Helpers
  144 | // ---------------------------------------------------------------------------
  145 | 
  146 | /**
  147 |  * Navigate to /units. Waits for [data-tour="units-page"] (units/page.jsx:287).
  148 |  */
  149 | export async function goToUnits(page: Page): Promise<void> {
  150 |   await page.goto("/units");
  151 |   await page.waitForSelector('[data-tour="units-page"]', { timeout: 15_000 });
  152 |   // Wait for React hydration to complete before interacting
  153 |   await page
  154 |     .waitForLoadState("networkidle", { timeout: 10_000 })
  155 |     .catch(() => {});
  156 | }
  157 | 
  158 | /**
  159 |  * Navigate to /sections. Waits for [data-tour="sections-page"] (sections/page.jsx:258).
  160 |  */
  161 | export async function goToSections(page: Page): Promise<void> {
  162 |   await page.goto("/sections");
> 163 |   await page.waitForSelector('[data-tour="sections-page"]', {
      |              ^ TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.
  164 |     timeout: 15_000,
  165 |   });
  166 |   // Wait for React hydration to complete before interacting
  167 |   await page
  168 |     .waitForLoadState("networkidle", { timeout: 10_000 })
  169 |     .catch(() => {});
  170 | }
  171 | 
  172 | // ---------------------------------------------------------------------------
  173 | // Unit Creation & Editing
  174 | // ---------------------------------------------------------------------------
  175 | 
  176 | /**
  177 |  * Create a new unit and return its ID. Stays on the editor page.
  178 |  *
  179 |  * Selectors used:
  180 |  * - [data-tour="create-unit-button"]  — units/page.jsx:316
  181 |  * - [data-tour="editor"]             — Editor3/index.tsx:605
  182 |  * - [data-lexical-editor="true"]     — Lexical editor root
  183 |  */
  184 | export async function createUnit(page: Page, name?: string): Promise<string> {
  185 |   await goToUnits(page);
  186 | 
  187 |   await page.locator('[data-tour="create-unit-button"]').first().click();
  188 |   await page.waitForURL(/\/unit\/[a-f0-9-]+/, { timeout: 15_000 });
  189 | 
  190 |   // Wait for the editor to load
  191 |   await page.waitForSelector('[data-tour="editor"]', { timeout: 30_000 });
  192 |   await page.waitForSelector('[data-lexical-editor="true"]', {
  193 |     timeout: 15_000,
  194 |   });
  195 |   await page.waitForTimeout(2000);
  196 | 
  197 |   // Extract unit ID from URL
  198 |   const url = page.url();
  199 |   const match = url.match(/\/unit\/([a-f0-9-]+)/);
  200 |   if (!match) throw new Error(`Could not extract unit ID from URL: ${url}`);
  201 |   const unitId = match[1];
  202 | 
  203 |   // Set name if provided — click the unit title and type
  204 |   if (name) {
  205 |     const titleEl = page.getByText("Untitled Unit");
  206 |     if (await titleEl.isVisible({ timeout: 3_000 }).catch(() => false)) {
  207 |       await titleEl.click();
  208 |       await page.waitForTimeout(500);
  209 |       const nameInput = page.locator("input:visible").first();
  210 |       await nameInput.clear();
  211 |       await nameInput.fill(name);
  212 |       await nameInput.blur();
  213 |       await page.waitForTimeout(2000);
  214 |     }
  215 |   }
  216 | 
  217 |   return unitId;
  218 | }
  219 | 
  220 | /**
  221 |  * Publish the unit currently open in the editor.
  222 |  *
  223 |  * Selectors used:
  224 |  * - #status-select               — ToolBarPlugin.jsx:846 (MUI Select)
  225 |  * - li[data-value="PUBLISHED"]   — ToolBarPlugin.jsx:861 (MenuItem)
  226 |  */
  227 | export async function publishUnit(page: Page): Promise<void> {
  228 |   await page.locator("#status-select").click();
  229 |   await page.waitForTimeout(500);
  230 |   await page.locator('li[data-value="PUBLISHED"]').click();
  231 |   await page.waitForTimeout(2000);
  232 | }
  233 | 
  234 | /**
  235 |  * Save unit content — clicks the Save button in the toolbar.
  236 |  *
  237 |  * Selector: button[title="Save now (automatic save happens 2 seconds after you stop typing)"]
  238 |  * Source: Editor3/components/Save.jsx:87
  239 |  */
  240 | export async function saveUnit(page: Page): Promise<void> {
  241 |   const saveButton = page.locator(
  242 |     'button[title="Save now (automatic save happens 2 seconds after you stop typing)"]',
  243 |   );
  244 |   await saveButton.click({ force: true });
  245 |   await page.waitForTimeout(2000);
  246 | }
  247 | 
  248 | /**
  249 |  * Insert a quiz block via the toolbar Insert menu.
  250 |  *
  251 |  * Selectors used:
  252 |  * - button[aria-controls="insert-node-menu"]  — ToolBarPlugin.jsx:1103
  253 |  * - #insert-node-menu li (filtered by quiz text) — ToolBarPlugin.jsx:1268
  254 |  * - [data-tour="quiz-block"]                  — QuizComponent.jsx:174
  255 |  */
  256 | export async function addQuizBlock(page: Page): Promise<void> {
  257 |   // Open the Insert dropdown menu
  258 |   await page.locator('button[aria-controls="insert-node-menu"]').click();
  259 |   // MUI Menu renders as a Portal with role="menu" (no id attribute)
  260 |   await page
  261 |     .locator('ul[role="menu"]')
  262 |     .waitFor({ state: "visible", timeout: 5_000 });
  263 | 
```