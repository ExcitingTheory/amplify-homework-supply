# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: instructor-tour.spec.ts >> Instructor onboarding tour >> completes full instructor tour — step by step
- Location: test/storybook/e2e/instructor-tour.spec.ts:122:7

# Error details

```
Error: locator.click: Error: strict mode violation: getByRole('button', { name: 'Start' }) resolved to 2 elements:
    1) <button tabindex="-1" class="css-tmtx6q" aria-expanded="false" id="🏠-getting-started" aria-controls="🏠-getting-started-welcome 🏠-getting-started-introduction 🏠-getting-started-why-homework-supply--why-homework-supply 🏠-getting-started-quick-tour 🏠-getting-started-core-concepts 🏠-getting-started-for-developers 🏠-getting-started-onboarding 🏠-getting-started-keyboard-shortcuts">…</button> aka getByRole('button', { name: '🏠 Getting Started' })
    2) <button tabindex="0" class="css-3u9pei" aria-label="Start test run">…</button> aka getByRole('button', { name: 'Start test run' })

Call log:
  - waiting for getByRole('button', { name: 'Start' })

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - log
    - log [ref=e3]:
      - generic [ref=e4]: Component test is rendering.
  - generic [ref=e6]:
    - generic [ref=e7]:
      - banner "Storybook" [ref=e9]:
        - heading "Storybook" [level=1] [ref=e10]
        - img
        - generic [ref=e13]:
          - generic [ref=e14]:
            - generic [ref=e15]:
              - generic [ref=e16]:
                - link "Skip to content" [ref=e17] [cursor=pointer]:
                  - /url: "#storybook-preview-wrapper"
                - link "Storybook" [ref=e19] [cursor=pointer]:
                  - /url: ./
                  - img "Storybook" [ref=e20]
                - switch "Settings" [ref=e25] [cursor=pointer]:
                  - img [ref=e26]
              - generic [ref=e31]:
                - generic [ref=e33] [cursor=pointer]:
                  - button "Open onboarding guide" [ref=e37]:
                    - img [ref=e39]
                    - strong [ref=e41]: Level up
                  - generic [ref=e42]:
                    - button "Collapse onboarding guide" [expanded] [ref=e43]:
                      - img [ref=e44]
                    - button "56% completed" [ref=e46]:
                      - generic [ref=e47]:
                        - img [ref=e48]
                        - img [ref=e50]
                      - generic [ref=e53]: 56%
                - list [ref=e55]:
                  - listitem [ref=e56]:
                    - button "Open onboarding guide for Set up with AI" [ref=e57] [cursor=pointer]:
                      - img [ref=e59]
                      - generic [ref=e63]: Set up with AI
                    - button "Copy prompt"
                  - listitem [ref=e64]:
                    - button "Open onboarding guide for Change a story with Controls" [ref=e65] [cursor=pointer]:
                      - img [ref=e67]
                      - generic [ref=e70]: Change a story with Controls
                  - listitem [ref=e71]:
                    - button "Open onboarding guide for Share your Storybook for feedback" [ref=e72] [cursor=pointer]:
                      - img [ref=e74]
                      - generic [ref=e77]: Share your Storybook for feedback
                    - button "Share"
            - generic [ref=e78]: Search for components
            - search [ref=e79]:
              - combobox "Search for components" [ref=e80]:
                - generic:
                  - img
                - searchbox "Search for components" [ref=e81]
                - code: ⌃ K
                - button "Tag filters" [ref=e83] [cursor=pointer]:
                  - img [ref=e84]
              - button "Create a new story" [ref=e86] [cursor=pointer]:
                - img [ref=e87]
            - switch "Review modified stories" [ref=e90] [cursor=pointer]:
              - img [ref=e91]
              - text: Review modified stories
            - generic [ref=e93]:
              - generic [ref=e96]:
                - generic [ref=e97]:
                  - img [ref=e99]
                  - generic [ref=e104]:
                    - generic [ref=e105]: Instructor
                    - generic [ref=e106]: 0/12 completed · 0%
                - generic [ref=e107]:
                  - generic [ref=e110]:
                    - generic [ref=e111]: Next Tasks
                    - generic [ref=e112] [cursor=pointer]:
                      - generic [ref=e113]: ○
                      - generic [ref=e115]: Set Up Your First Class
                    - generic [ref=e116] [cursor=pointer]:
                      - generic [ref=e117]: ○
                      - generic [ref=e119]: Create Your First Unit
                    - generic [ref=e120] [cursor=pointer]:
                      - generic [ref=e121]: ○
                      - generic [ref=e123]: Add a Quiz Block
                  - generic [ref=e124] [cursor=pointer]: View All Tasks →
              - navigation "Stories" [ref=e125]:
                - heading "Stories" [level=2] [ref=e126]
                - generic [ref=e128]:
                  - button "🏠 Getting Started" [ref=e130] [cursor=pointer]:
                    - generic [ref=e131]:
                      - img [ref=e133]
                      - img [ref=e135]
                    - text: 🏠 Getting Started
                  - button "✏️ Lesson Editor" [ref=e138] [cursor=pointer]:
                    - generic [ref=e139]:
                      - img [ref=e141]
                      - img [ref=e143]
                    - text: ✏️ Lesson Editor
                  - button "📁 Content Management" [ref=e146] [cursor=pointer]:
                    - generic [ref=e147]:
                      - img [ref=e149]
                      - img [ref=e151]
                    - text: 📁 Content Management
                  - button "💬 AI Assistant" [ref=e154] [cursor=pointer]:
                    - generic [ref=e155]:
                      - img [ref=e157]
                      - img [ref=e159]
                    - text: 💬 AI Assistant
                  - button "🎙️ Recording Studio" [ref=e162] [cursor=pointer]:
                    - generic [ref=e163]:
                      - img [ref=e165]
                      - img [ref=e167]
                    - text: 🎙️ Recording Studio
                  - button "📓 Workbook" [ref=e170] [cursor=pointer]:
                    - generic [ref=e171]:
                      - img [ref=e173]
                      - img [ref=e175]
                    - text: 📓 Workbook
                  - button "🏆 Gamification" [ref=e178] [cursor=pointer]:
                    - generic [ref=e179]:
                      - img [ref=e181]
                      - img [ref=e183]
                    - text: 🏆 Gamification
                  - button "🤝 Peer Review" [ref=e186] [cursor=pointer]:
                    - generic [ref=e187]:
                      - img [ref=e189]
                      - img [ref=e191]
                    - text: 🤝 Peer Review
                  - button "🎯 Practice Drills" [ref=e194] [cursor=pointer]:
                    - generic [ref=e195]:
                      - img [ref=e197]
                      - img [ref=e199]
                    - text: 🎯 Practice Drills
                  - button "📊 Instructor Tools" [ref=e202] [cursor=pointer]:
                    - generic [ref=e203]:
                      - img [ref=e205]
                      - img [ref=e207]
                    - text: 📊 Instructor Tools
                  - button "🔌 Offline & Sync" [ref=e210] [cursor=pointer]:
                    - generic [ref=e211]:
                      - img [ref=e213]
                      - img [ref=e215]
                    - text: 🔌 Offline & Sync
                  - button "🧩 UI Components" [ref=e218] [cursor=pointer]:
                    - generic [ref=e219]:
                      - img [ref=e221]
                      - img [ref=e223]
                    - text: 🧩 UI Components
                  - button "🛠️ Developer Tools" [ref=e226] [cursor=pointer]:
                    - generic [ref=e227]:
                      - img [ref=e229]
                      - img [ref=e231]
                    - text: 🛠️ Developer Tools
                  - button "Example" [ref=e234] [cursor=pointer]:
                    - generic [ref=e235]:
                      - img [ref=e237]
                      - img [ref=e239]
                    - text: Example
                  - button "📄 Pages" [expanded] [ref=e242] [cursor=pointer]:
                    - generic [ref=e243]:
                      - img [ref=e245]
                      - img [ref=e247]
                    - text: 📄 Pages
                  - button "Application Pages" [expanded] [ref=e250] [cursor=pointer]:
                    - generic [ref=e251]:
                      - img [ref=e253]
                      - img [ref=e255]
                    - text: Application Pages
                  - link "Index" [ref=e258] [cursor=pointer]:
                    - /url: /?path=/story/📄-pages-application-pages--index
                    - img [ref=e260]
                    - text: Index
                  - link "Index No Sections" [ref=e263] [cursor=pointer]:
                    - /url: /?path=/story/📄-pages-application-pages--index-no-sections
                    - img [ref=e265]
                    - text: Index No Sections
                  - link "Index Assignments" [ref=e268] [cursor=pointer]:
                    - /url: /?path=/story/📄-pages-application-pages--index-assignments
                    - img [ref=e270]
                    - text: Index Assignments
                  - link "Units" [ref=e273] [cursor=pointer]:
                    - /url: /?path=/story/📄-pages-application-pages--units
                    - img [ref=e275]
                    - text: Units
                  - link "Units Empty State" [ref=e278] [cursor=pointer]:
                    - /url: /?path=/story/📄-pages-application-pages--units-empty-state
                    - img [ref=e280]
                    - text: Units Empty State
                  - generic [ref=e282]:
                    - link "Sections" [ref=e283] [cursor=pointer]:
                      - /url: /?path=/story/📄-pages-application-pages--sections
                      - img [ref=e285]
                      - text: Sections
                    - link "Skip to content" [ref=e287] [cursor=pointer]:
                      - /url: "#storybook-preview-wrapper"
                  - link "Sections Empty State" [ref=e289] [cursor=pointer]:
                    - /url: /?path=/story/📄-pages-application-pages--sections-empty-state
                    - img [ref=e291]
                    - text: Sections Empty State
                  - link "Section Detail" [ref=e294] [cursor=pointer]:
                    - /url: /?path=/story/📄-pages-application-pages--section-detail
                    - img [ref=e296]
                    - text: Section Detail
                  - link "Section Detail Student" [ref=e299] [cursor=pointer]:
                    - /url: /?path=/story/📄-pages-application-pages--section-detail-student
                    - img [ref=e301]
                    - text: Section Detail Student
                  - link "Unit Detail" [ref=e304] [cursor=pointer]:
                    - /url: /?path=/story/📄-pages-application-pages--unit-detail
                    - img [ref=e306]
                    - text: Unit Detail
                  - link "Workbook" [ref=e309] [cursor=pointer]:
                    - /url: /?path=/story/📄-pages-application-pages--workbook
                    - img [ref=e311]
                    - text: Workbook
                  - link "Workbook Timed Exercise" [ref=e314] [cursor=pointer]:
                    - /url: /?path=/story/📄-pages-application-pages--workbook-timed-exercise
                    - img [ref=e316]
                    - text: Workbook Timed Exercise
                  - link "Peer Review" [ref=e319] [cursor=pointer]:
                    - /url: /?path=/story/📄-pages-application-pages--peer-review
                    - img [ref=e321]
                    - text: Peer Review
                  - button "Index" [ref=e324] [cursor=pointer]:
                    - generic [ref=e325]:
                      - img [ref=e327]
                      - img [ref=e329]
                    - text: Index
                  - button "Gamification & Admin Pages" [ref=e332] [cursor=pointer]:
                    - generic [ref=e333]:
                      - img [ref=e335]
                      - img [ref=e337]
                    - text: Gamification & Admin Pages
                  - button "Section Settings" [ref=e340] [cursor=pointer]:
                    - generic [ref=e341]:
                      - img [ref=e343]
                      - img [ref=e345]
                    - text: Section Settings
                  - button "🛠️ Admin" [ref=e348] [cursor=pointer]:
                    - generic [ref=e349]:
                      - img [ref=e351]
                      - img [ref=e353]
                    - text: 🛠️ Admin
                  - button "💬 Collaborative Chat" [ref=e356] [cursor=pointer]:
                    - generic [ref=e357]:
                      - img [ref=e359]
                      - img [ref=e361]
                    - text: 💬 Collaborative Chat
                  - button "� Instructor Tools" [ref=e364] [cursor=pointer]:
                    - generic [ref=e365]:
                      - img [ref=e367]
                      - img [ref=e369]
                    - text: � Instructor Tools
                  - button "📬 Notifications" [ref=e372] [cursor=pointer]:
                    - generic [ref=e373]:
                      - img [ref=e375]
                      - img [ref=e377]
                    - text: 📬 Notifications
                  - button "� Gamification" [ref=e380] [cursor=pointer]:
                    - generic [ref=e381]:
                      - img [ref=e383]
                      - img [ref=e385]
                    - text: � Gamification
                  - button "Translation Mode" [ref=e388] [cursor=pointer]:
                    - generic [ref=e389]:
                      - img [ref=e391]
                      - img [ref=e393]
                    - text: Translation Mode
          - generic [ref=e395]:
            - link "Storybook 10.4 Learn what's new in Storybook Dismiss notification" [ref=e397] [cursor=pointer]:
              - /url: /?path=/settings/whats-new
              - img [ref=e399]
              - generic [ref=e401]:
                - generic "Storybook 10.4" [ref=e402]
                - generic [ref=e403]: Learn what's new in Storybook
              - button "Dismiss notification" [ref=e404]:
                - img [ref=e405]
            - region "Component tests" [ref=e407]:
              - generic [ref=e408]:
                - heading "Component tests" [level=2] [ref=e409]
                - generic [ref=e410] [cursor=pointer]:
                  - button "Run tests" [ref=e414]:
                    - img [ref=e416]
                    - text: Run tests
                  - generic [ref=e419]:
                    - button "Expand testing module" [ref=e420]:
                      - img [ref=e421]
                    - button "Clear all statuses" [ref=e423]:
                      - img [ref=e424]
                - generic [ref=e427]:
                  - generic [ref=e430]:
                    - generic [ref=e431]: Visual tests
                    - button "Login required" [ref=e433]
                  - generic [ref=e435]:
                    - generic [ref=e436]:
                      - generic [ref=e437]:
                        - generic [ref=e438]: Run component tests
                        - generic [ref=e439]: Not run
                      - generic [ref=e440]:
                        - switch "Watch mode" [ref=e441] [cursor=pointer]:
                          - img [ref=e442]
                        - button "Start test run" [ref=e445] [cursor=pointer]:
                          - img [ref=e446]
                    - list [ref=e448]:
                      - listitem [ref=e449]:
                        - generic [ref=e450]:
                          - checkbox "Interactions" [checked] [disabled] [ref=e452]
                          - generic [ref=e453]: Interactions
                        - button "Run tests to see results" [disabled] [ref=e454]
                      - listitem [ref=e456]:
                        - generic [ref=e457] [cursor=pointer]:
                          - checkbox "Coverage" [ref=e459]
                          - generic [ref=e460]: Coverage
                        - button "Coverage unavailable, run tests first" [disabled] [ref=e461]
                      - listitem [ref=e463]:
                        - generic [ref=e464] [cursor=pointer]:
                          - checkbox "Accessibility" [ref=e466]
                          - generic [ref=e467]: Accessibility
                        - button "Run tests to see accessibility results" [disabled] [ref=e468]
      - separator "Sidebar resize handle" [ref=e470]
    - generic [ref=e472]:
      - region "Toolbar" [ref=e473]:
        - heading "Toolbar" [level=2] [ref=e474]
        - toolbar [ref=e475]:
          - generic [ref=e476]:
            - button "Reload story" [ref=e477] [cursor=pointer]:
              - img [ref=e478]
            - switch "Measure tool" [ref=e480] [cursor=pointer]:
              - img [ref=e481]
            - switch "Outline tool" [ref=e484] [cursor=pointer]:
              - img [ref=e485]
            - button "Viewport size" [ref=e487] [cursor=pointer]:
              - img [ref=e488]
              - text: Small mobile
            - button "Vision filter" [ref=e492] [cursor=pointer]:
              - img [ref=e493]
            - button "Translation editing mode Off" [ref=e498] [cursor=pointer]:
              - img [ref=e499]
              - text: "Off"
            - button "Override display language for translations English" [ref=e501] [cursor=pointer]:
              - img [ref=e502]
              - text: English
            - button "Color scheme Light" [ref=e504] [cursor=pointer]:
              - img [ref=e505]
              - text: Light
          - generic [ref=e510]:
            - button "Open in isolation mode" [ref=e511] [cursor=pointer]:
              - img [ref=e512]
            - switch "Change zoom level" [ref=e517] [cursor=pointer]: 100%
            - button "Show addon panel" [ref=e518] [cursor=pointer]:
              - img [ref=e519]
            - button "Enter full screen" [ref=e522] [cursor=pointer]:
              - img [ref=e523]
            - button "Open in editor" [ref=e525] [cursor=pointer]:
              - img [ref=e526]
            - button "Share" [ref=e529] [cursor=pointer]
      - main "Main preview area" [ref=e530]:
        - heading "Main preview area" [level=2] [ref=e531]
        - generic [ref=e533]:
          - link "Skip to sidebar" [ref=e534] [cursor=pointer]:
            - /url: "#📄-pages-application-pages--sections"
          - generic [ref=e535]:
            - generic [ref=e537]:
              - generic [ref=e538]:
                - button [disabled] [ref=e540]: W
                - generic [ref=e541]: Viewport width
                - textbox "Viewport width" [ref=e543]: 320px
              - button "Rotate viewport" [ref=e544] [cursor=pointer]:
                - img [ref=e545]
              - generic [ref=e547]:
                - button [disabled] [ref=e549]: H
                - generic [ref=e550]: Viewport height
                - textbox "Viewport height" [ref=e552]: 568px
            - generic [ref=e553]:
              - iframe [ref=e555]:
                - generic [ref=f2e2]:
                  - heading "Couldn't find story matching 'getting-started-welcome--welcome'." [level=1] [ref=f2e3]
                  - paragraph [ref=f2e4]: "The component failed to render properly, likely due to a configuration issue in Storybook. Here are some common causes and how you can address them:"
                  - list [ref=f2e5]:
                    - listitem [ref=f2e6]:
                      - strong [ref=f2e7]: Missing Context/Providers
                      - text: ": You can use decorators to supply specific contexts or providers, which are sometimes necessary for components to render correctly. For detailed instructions on using decorators, please visit the"
                      - link "Decorators documentation" [ref=f2e8] [cursor=pointer]:
                        - /url: https://storybook.js.org/docs/writing-stories/decorators
                      - text: .
                    - listitem [ref=f2e9]:
                      - strong [ref=f2e10]: Misconfigured Webpack or Vite
                      - text: ": Verify that Storybook picks up all necessary settings for loaders, plugins, and other relevant parameters. You can find step-by-step guides for configuring"
                      - link "Webpack" [ref=f2e11] [cursor=pointer]:
                        - /url: https://storybook.js.org/docs/builders/webpack
                      - text: or
                      - link "Vite" [ref=f2e12] [cursor=pointer]:
                        - /url: https://storybook.js.org/docs/builders/vite
                      - text: with Storybook.
                    - listitem [ref=f2e13]:
                      - strong [ref=f2e14]: Missing Environment Variables
                      - text: ": Your Storybook may require specific environment variables to function as intended. You can set up custom environment variables as outlined in the"
                      - link "Environment Variables documentation" [ref=f2e15] [cursor=pointer]:
                        - /url: https://storybook.js.org/docs/configure/environment-variables
                      - text: .
                  - code [ref=f2e17]: "- Are you sure a story with that id exists? - Please check your stories field of your main.js config. - Also check the browser console and terminal for error messages."
              - generic [ref=e556]: "320"
              - generic [ref=e557]: "568"
    - separator "Addon panel resize handle" [ref=e560]
  - generic:
    - img
  - generic [ref=e562]:
    - generic [ref=e563]:
      - generic [ref=e564]:
        - generic [ref=e565]: 📖 Tutorial • Step 1 of 8
        - heading "Welcome to Storybook" [level=6] [ref=e566]
      - button "Close spotlight guide" [ref=e567] [cursor=pointer]:
        - img [ref=e568]
    - paragraph [ref=e570]: This is your interactive training environment. The sidebar on the left organizes all the features you'll learn. Each story shows a working preview of a feature.
    - generic [ref=e571]:
      - generic [ref=e572]: "Follow these steps:"
      - list [ref=e573]:
        - listitem [ref=e574]: Browse stories by category in the sidebar
        - listitem [ref=e575]: Click a story to see it in the Canvas
        - listitem [ref=e576]: Use the Docs tab for detailed instructions
    - generic [ref=e577]:
      - button "Go to previous step" [disabled]:
        - generic:
          - img
        - text: Back
      - button "Skip" [ref=e578] [cursor=pointer]:
        - img [ref=e580]
        - text: Skip
      - button "Start" [ref=e582] [cursor=pointer]:
        - text: Start
        - img [ref=e584]
```

# Test source

```ts
  47  |  */
  48  | export async function openOnboardingPanel(page: Page): Promise<void> {
  49  |   // The Welcome story triggers automatic panel open in the addon
  50  |   await page.goto("/?path=/story/getting-started-welcome--welcome");
  51  | 
  52  |   // If the bottom panel is not open, toggle it with Storybook's keyboard shortcut
  53  |   const tab = page.getByRole("tab", { name: "Onboarding" });
  54  |   const tabVisible = await tab.isVisible({ timeout: 3_000 }).catch(() => false);
  55  |   if (!tabVisible) {
  56  |     await page.keyboard.press("a"); // Storybook 'Show addons' shortcut
  57  |     await expect(tab).toBeVisible({ timeout: 10_000 });
  58  |   }
  59  | 
  60  |   await tab.click();
  61  | 
  62  |   // Confirm the panel content loaded (persona selection or task list).
  63  |   // Use .first() because "Select your role" appears in both the sidebar widget
  64  |   // and the panel subtitle — either match proves the panel is ready.
  65  |   await expect(
  66  |     page.getByText(/Select your role|tasks completed/).first()
  67  |   ).toBeVisible({ timeout: 10_000 });
  68  | }
  69  | 
  70  | /**
  71  |  * Click the persona card in the Onboarding panel.
  72  |  * Waits until the task list appears before returning.
  73  |  */
  74  | export async function selectPersona(page: Page, persona: Persona): Promise<void> {
  75  |   const labels: Record<Persona, string> = {
  76  |     instructor: "Instructor",
  77  |     learner: "Learner",
  78  |     translator: "Translator",
  79  |   };
  80  | 
  81  |   // The persona selection shows cards with the label + "Click to start onboarding"
  82  |   await page
  83  |     .locator('[class*="MuiCard"]')
  84  |     .filter({ hasText: labels[persona] })
  85  |     .first()
  86  |     .click();
  87  | 
  88  |   // Task list replaces the persona selection
  89  |   await expect(page.getByText(/\d+ of \d+ tasks completed/)).toBeVisible({
  90  |     timeout: 8_000,
  91  |   });
  92  | }
  93  | 
  94  | // ─── Task Tour ───────────────────────────────────────────────────────────────
  95  | 
  96  | /**
  97  |  * Walk through the full lifecycle of a single onboarding task:
  98  |  *
  99  |  * 1. Click the task card  →  SpotlightOverlay opens
  100 |  * 2. Step-through the overlay (Start → Next… → Done)
  101 |  *    - Each click waits for the button to be enabled (auto-handles page loading)
  102 |  *    - Asserts the step counter increments each time
  103 |  * 3. The overlay closes; the bottom panel reopens automatically
  104 |  * 4. Trigger completion inside the preview iframe:
  105 |  *    - completionSequence: click each [data-tour="…"] element in order
  106 |  *    - customCheck only (no sequence): inject completion via localStorage
  107 |  * 5. Assert: task checkbox checked + title has line-through
  108 |  * 6. Assert: "N of M tasks completed" counter matches expectedCompleted
  109 |  */
  110 | export async function walkTaskTour(
  111 |   page: Page,
  112 |   task: TaskSpec,
  113 |   persona: Persona,
  114 |   expectedCompleted: number
  115 | ): Promise<void> {
  116 |   // ── 1. Click the task card ─────────────────────────────────────────────────
  117 |   const taskCard = page
  118 |     .locator('[data-testid="task-item"]')
  119 |     .filter({ hasText: task.title });
  120 | 
  121 |   await taskCard.click();
  122 | 
  123 |   // ── 2. SpotlightOverlay appears ────────────────────────────────────────────
  124 |   // Wait for "Step 1 of N" indicator
  125 |   const stepIndicator = page.locator("text=/Step 1 of \\d+/");
  126 |   await expect(stepIndicator).toBeVisible({ timeout: 10_000 });
  127 | 
  128 |   // Read total steps from the indicator text
  129 |   const indicatorText = await stepIndicator.textContent({ timeout: 5_000 });
  130 |   const totalSteps = parseInt(indicatorText?.match(/of (\d+)/)?.[1] ?? "3", 10);
  131 | 
  132 |   // ── 3. Navigate through steps ─────────────────────────────────────────────
  133 |   for (let i = 0; i < totalSteps; i++) {
  134 |     const isFirst = i === 0;
  135 |     const isLast = i === totalSteps - 1;
  136 | 
  137 |     // Assert step counter shows the right step number
  138 |     await expect(
  139 |       page.locator(`text=/Step ${i + 1} of ${totalSteps}/`)
  140 |     ).toBeVisible({ timeout: 8_000 });
  141 | 
  142 |     if (isLast) {
  143 |       // "Done" button — clicking this closes the overlay
  144 |       await page.getByRole("button", { name: "Done" }).click();
  145 |     } else if (isFirst) {
  146 |       // "Start" button — disabled until iframe is loaded
> 147 |       await page.getByRole("button", { name: "Start" }).click();
      |                                                         ^ Error: locator.click: Error: strict mode violation: getByRole('button', { name: 'Start' }) resolved to 2 elements:
  148 |     } else {
  149 |       // "Next" button — disabled while navigating
  150 |       await page.getByRole("button", { name: "Next" }).click();
  151 |     }
  152 | 
  153 |     await page.waitForTimeout(200); // brief UI settle
  154 |   }
  155 | 
  156 |   // ── 4. Panel reopens after overlay closes ─────────────────────────────────
  157 |   // togglePanel(true) is called automatically when spotlightOpen → false
  158 |   await expect(
  159 |     page.locator('[data-testid="task-item"]').first()
  160 |   ).toBeVisible({ timeout: 10_000 });
  161 | 
  162 |   // ── 5. Trigger task completion ─────────────────────────────────────────────
  163 |   const sequence = task.completionCriteria?.completionSequence;
  164 |   const hasCustomCheck = !!task.completionCriteria?.customCheck;
  165 | 
  166 |   if (sequence && sequence.length > 0) {
  167 |     await clickCompletionSequence(page, sequence);
  168 |   } else if (hasCustomCheck) {
  169 |     // No data-tour sequence: inject directly into localStorage from the iframe
  170 |     // so the manager frame's storage-event listener fires
  171 |     await injectCompletionViaIframe(page, task.id, persona);
  172 |   }
  173 | 
  174 |   // ── 6. Assert task crossed off ────────────────────────────────────────────
  175 |   // The Typography inside the task card gets text-decoration: line-through
  176 |   await expect(taskCard.locator(`text=${task.title}`)).toHaveCSS(
  177 |     "text-decoration",
  178 |     /line-through/,
  179 |     { timeout: 10_000 }
  180 |   );
  181 | 
  182 |   // Checkbox should be checked
  183 |   await expect(taskCard.locator('input[type="checkbox"]')).toBeChecked({
  184 |     timeout: 5_000,
  185 |   });
  186 | 
  187 |   // ── 7. Assert progress counter ────────────────────────────────────────────
  188 |   await expect(
  189 |     page.getByText(new RegExp(`${expectedCompleted} of \\d+ tasks completed`))
  190 |   ).toBeVisible({ timeout: 8_000 });
  191 | }
  192 | 
  193 | // ─── Completion Helpers ──────────────────────────────────────────────────────
  194 | 
  195 | /**
  196 |  * Click each data-tour element in the completionSequence inside the preview
  197 |  * iframe in order.  The initializeDomActionListeners() function (in preview.jsx)
  198 |  * detects these clicks and emits task-completed → persists to localStorage →
  199 |  * manager storage-event fires → panel updates.
  200 |  */
  201 | async function clickCompletionSequence(
  202 |   page: Page,
  203 |   sequence: string[]
  204 | ): Promise<void> {
  205 |   const preview = page.frameLocator("#storybook-preview-iframe");
  206 | 
  207 |   for (const tourId of sequence) {
  208 |     const target = preview.locator(`[data-tour="${tourId}"]`).first();
  209 |     // Scroll into view then click; use force to handle pointer-events:none wrappers
  210 |     await target.waitFor({ state: "attached", timeout: 10_000 });
  211 |     await target.scrollIntoViewIfNeeded();
  212 |     await target.click({ force: true, timeout: 10_000 });
  213 |     await page.waitForTimeout(300); // let DOM listener process the click
  214 |   }
  215 | }
  216 | 
  217 | /**
  218 |  * For customCheck-only tasks: write the task-completed entry directly into
  219 |  * storybook_onboarding_progress localStorage from the PREVIEW IFRAME context.
  220 |  *
  221 |  * Writing from the iframe triggers a `storage` event in the manager frame
  222 |  * (same-origin, different browsing context). The manager emitter's
  223 |  * ensureStorageListener() picks this up and emits task-completed to the panel.
  224 |  */
  225 | async function injectCompletionViaIframe(
  226 |   page: Page,
  227 |   taskId: string,
  228 |   persona: Persona
  229 | ): Promise<void> {
  230 |   const frames = page.frames();
  231 |   const previewFrame = frames.find(
  232 |     (f) => f.url().includes("iframe") || f.url().includes("?id=")
  233 |   ) as Frame | undefined;
  234 | 
  235 |   if (!previewFrame) {
  236 |     // Fallback: write from the main frame (no cross-frame storage event, but
  237 |     // the panel can still read it on next render)
  238 |     await page.evaluate(
  239 |       ({ taskId, persona, key }) => {
  240 |         const taskKey = `${persona}:${taskId}`;
  241 |         const event = {
  242 |           type: "task-completed",
  243 |           taskId,
  244 |           persona,
  245 |           timestamp: Date.now(),
  246 |           metadata: { injectedByE2ETest: true },
  247 |         };
```