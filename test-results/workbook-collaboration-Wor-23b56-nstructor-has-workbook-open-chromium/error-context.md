# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workbook-collaboration.spec.ts >> Workbook Collaboration – Simultaneous Users >> student answers quiz while instructor has workbook open
- Location: e2e-collaboration/workbook-collaboration.spec.ts:104:7

# Error details

```
TimeoutError: page.waitForSelector: Timeout 20000ms exceeded.
Call log:
  - waiting for locator('#user-button, [id="user-button"]') to be visible
    - waiting for" http://localhost:3000/" navigation to finish...
    - navigated to "http://localhost:3000/"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e6]:
    - tablist [ref=e7]:
      - tab "Sign In" [selected] [ref=e8]
      - tab "Create Account" [ref=e9]
    - tabpanel "Sign In" [ref=e10]:
      - generic [ref=e13]:
        - group [ref=e14]:
          - generic [ref=e16]: Sign in
          - generic [ref=e17]:
            - generic [ref=e18]: Email
            - textbox "Email" [ref=e21]:
              - /placeholder: Enter your Email
          - generic [ref=e22]:
            - generic [ref=e23]: Password
            - generic [ref=e24]:
              - textbox "Password" [ref=e26]:
                - /placeholder: Enter your Password
              - switch "Show password" [ref=e28] [cursor=pointer]:
                - generic [ref=e29]: Password is hidden
                - img [ref=e31]
        - button "Sign in" [ref=e33] [cursor=pointer]
        - button "Forgot your password?" [ref=e35] [cursor=pointer]
  - button "Open AI Assistant" [ref=e36] [cursor=pointer]:
    - img [ref=e38]
  - alert [ref=e40]
```

# Test source

```ts
  13  |   username: process.env.TEACHER_USERNAME || "instructor1@example.com",
  14  |   password: process.env.TEACHER_PASSWORD || "TestPassword123!",
  15  | };
  16  | 
  17  | export const STUDENT_1 = {
  18  |   username: process.env.LEARNER_USERNAME || "student1@example.com",
  19  |   password: process.env.LEARNER_PASSWORD || "TestPassword123!",
  20  | };
  21  | 
  22  | export const STUDENT_2 = {
  23  |   username: "student2@example.com",
  24  |   password: process.env.LEARNER_PASSWORD || "TestPassword123!",
  25  | };
  26  | 
  27  | export type TestUser = { username: string; password: string };
  28  | 
  29  | // ---------------------------------------------------------------------------
  30  | // Session Management — each user gets their own BrowserContext + Page
  31  | // ---------------------------------------------------------------------------
  32  | 
  33  | export interface UserSession {
  34  |   context: BrowserContext;
  35  |   page: Page;
  36  |   user: TestUser;
  37  | }
  38  | 
  39  | /**
  40  |  * Create an isolated browser context and page for a user, then log them in.
  41  |  * Each context has its own cookies/storage — both sessions are live simultaneously.
  42  |  */
  43  | export async function createUserSession(
  44  |   browser: Browser,
  45  |   user: TestUser,
  46  |   baseURL: string,
  47  | ): Promise<UserSession> {
  48  |   const context = await browser.newContext({
  49  |     viewport: { width: 1280, height: 720 },
  50  |   });
  51  |   const page = await context.newPage();
  52  | 
  53  |   // Suppress known console errors that don't affect functionality
  54  |   page.on("pageerror", (err) => {
  55  |     const msg = err.message;
  56  |     if (
  57  |       msg.includes("Cannot read properties of null (reading 'id')") ||
  58  |       msg.includes("i18next") ||
  59  |       msg.includes("useTranslation") ||
  60  |       msg.includes("Hydration failed") ||
  61  |       msg.includes("exceeds maximum value limit") ||
  62  |       msg.includes("Maximum update depth exceeded") ||
  63  |       msg.includes("No current user") ||
  64  |       msg.includes("not authenticated") ||
  65  |       msg.includes("DuplicatedOperationError")
  66  |     ) {
  67  |       // Known transient errors — swallow
  68  |       return;
  69  |     }
  70  |     console.warn(`[${user.username}] Page error:`, msg);
  71  |   });
  72  | 
  73  |   await login(page, user, baseURL);
  74  | 
  75  |   return { context, page, user };
  76  | }
  77  | 
  78  | /**
  79  |  * Close a user session (context + page).
  80  |  */
  81  | export async function closeSession(session: UserSession): Promise<void> {
  82  |   await session.page.close();
  83  |   await session.context.close();
  84  | }
  85  | 
  86  | // ---------------------------------------------------------------------------
  87  | // Authentication
  88  | // ---------------------------------------------------------------------------
  89  | 
  90  | /**
  91  |  * Login via the Amplify Authenticator UI.
  92  |  * Works regardless of which page the user lands on.
  93  |  */
  94  | export async function login(
  95  |   page: Page,
  96  |   user: TestUser,
  97  |   baseURL: string,
  98  | ): Promise<void> {
  99  |   await page.goto(baseURL);
  100 | 
  101 |   // Wait for the auth form
  102 |   await page.waitForSelector("form", { timeout: 15_000 });
  103 |   await page.locator('input[name="username"]').fill(user.username);
  104 |   await page.locator('input[name="password"]').fill(user.password);
  105 |   await page
  106 |     .locator("form")
  107 |     .first()
  108 |     .evaluate((form) => {
  109 |       (form as HTMLFormElement).submit();
  110 |     });
  111 | 
  112 |   // Wait for auth to complete — user button appears
> 113 |   await page.waitForSelector('#user-button, [id="user-button"]', {
      |              ^ TimeoutError: page.waitForSelector: Timeout 20000ms exceeded.
  114 |     timeout: 20_000,
  115 |   });
  116 | }
  117 | 
  118 | /**
  119 |  * Login on a specific page URL (e.g. /workbook/:id shows auth form when not logged in).
  120 |  */
  121 | export async function loginOnPage(
  122 |   page: Page,
  123 |   user: TestUser,
  124 |   url: string,
  125 | ): Promise<void> {
  126 |   await page.goto(url, { timeout: 30_000 });
  127 | 
  128 |   // Wait for the auth form to appear
  129 |   await page.waitForSelector('input[name="username"]', { timeout: 15_000 });
  130 |   await page.locator('input[name="username"]').fill(user.username);
  131 |   await page.locator('input[name="password"]').fill(user.password);
  132 |   await page
  133 |     .locator("form")
  134 |     .first()
  135 |     .evaluate((form) => {
  136 |       (form as HTMLFormElement).submit();
  137 |     });
  138 | 
  139 |   // Wait for redirect away from login
  140 |   await page.waitForURL((url) => !url.href.includes("/login"), {
  141 |     timeout: 20_000,
  142 |   });
  143 | }
  144 | 
  145 | // ---------------------------------------------------------------------------
  146 | // Navigation Helpers
  147 | // ---------------------------------------------------------------------------
  148 | 
  149 | /**
  150 |  * Navigate to the units page and wait for it to load.
  151 |  */
  152 | export async function goToUnits(page: Page): Promise<void> {
  153 |   await page.goto("/units");
  154 |   await page.waitForURL("**/units**", { timeout: 15_000 });
  155 |   await page.waitForSelector('[data-tour="units-page"], body', {
  156 |     timeout: 15_000,
  157 |   });
  158 | }
  159 | 
  160 | /**
  161 |  * Navigate to the sections page and wait for it to load.
  162 |  */
  163 | export async function goToSections(page: Page): Promise<void> {
  164 |   await page.goto("/sections");
  165 |   await page.waitForURL("**/sections**", { timeout: 15_000 });
  166 | }
  167 | 
  168 | // ---------------------------------------------------------------------------
  169 | // Unit Creation
  170 | // ---------------------------------------------------------------------------
  171 | 
  172 | /**
  173 |  * Create a new unit and return its ID. Stays on the editor page.
  174 |  */
  175 | export async function createUnit(page: Page, name?: string): Promise<string> {
  176 |   await goToUnits(page);
  177 | 
  178 |   await page.locator('[data-tour="create-unit-button"]').first().click();
  179 |   await page.waitForURL(/\/unit\/[a-f0-9-]+/, { timeout: 15_000 });
  180 | 
  181 |   // Wait for the editor to load
  182 |   await page.waitForSelector(".editor-container", { timeout: 30_000 });
  183 |   await page.waitForSelector('.editor-container [data-lexical-editor="true"]', {
  184 |     timeout: 15_000,
  185 |   });
  186 | 
  187 |   // Give Lexical time to fully initialise
  188 |   await page.waitForTimeout(2000);
  189 | 
  190 |   // Extract unit ID from URL
  191 |   const url = page.url();
  192 |   const match = url.match(/\/unit\/([a-f0-9-]+)/);
  193 |   if (!match) throw new Error(`Could not extract unit ID from URL: ${url}`);
  194 |   const unitId = match[1];
  195 | 
  196 |   // Set name if provided
  197 |   if (name) {
  198 |     await page.getByText("Untitled Unit").click();
  199 |     await page.waitForTimeout(500);
  200 |     const nameInput = page
  201 |       .locator("input")
  202 |       .filter({ has: page.locator(":visible") })
  203 |       .first();
  204 |     await nameInput.clear();
  205 |     await nameInput.fill(name);
  206 |     await nameInput.blur();
  207 |     await page.waitForTimeout(2000);
  208 |   }
  209 | 
  210 |   return unitId;
  211 | }
  212 | 
  213 | /**
```