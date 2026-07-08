# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: instructor-tour.spec.ts >> Instructor onboarding tour >> persona selection shows instructor task list
- Location: test/storybook/e2e/instructor-tour.spec.ts:103:7

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator: getByRole('progressbar')
Expected: "0"
Error: strict mode violation: getByRole('progressbar') resolved to 2 elements:
    1) <div aria-live="polite" role="progressbar" class="css-cfvyep" id="preview-loader" aria-label="Content is loading..."></div> aka getByRole('progressbar', { name: 'Content is loading...' })
    2) <span aria-valuenow="0" aria-valuemin="0" role="progressbar" aria-valuemax="100" class="MuiLinearProgress-root MuiLinearProgress-colorPrimary MuiLinearProgress-determinate css-1lpakrp">…</span> aka getByTestId('onboarding-panel').getByRole('progressbar')

Call log:
  - Expect "toHaveAttribute" with timeout 15000ms
  - waiting for getByRole('progressbar')

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
                  - button "📄 Pages" [ref=e242] [cursor=pointer]:
                    - generic [ref=e243]:
                      - img [ref=e245]
                      - img [ref=e247]
                    - text: 📄 Pages
                  - button "🛠️ Admin" [ref=e250] [cursor=pointer]:
                    - generic [ref=e251]:
                      - img [ref=e253]
                      - img [ref=e255]
                    - text: 🛠️ Admin
                  - button "💬 Collaborative Chat" [ref=e258] [cursor=pointer]:
                    - generic [ref=e259]:
                      - img [ref=e261]
                      - img [ref=e263]
                    - text: 💬 Collaborative Chat
                  - button "� Instructor Tools" [ref=e266] [cursor=pointer]:
                    - generic [ref=e267]:
                      - img [ref=e269]
                      - img [ref=e271]
                    - text: � Instructor Tools
                  - button "📬 Notifications" [ref=e274] [cursor=pointer]:
                    - generic [ref=e275]:
                      - img [ref=e277]
                      - img [ref=e279]
                    - text: 📬 Notifications
                  - button "� Gamification" [ref=e282] [cursor=pointer]:
                    - generic [ref=e283]:
                      - img [ref=e285]
                      - img [ref=e287]
                    - text: � Gamification
                  - button "Translation Mode" [ref=e290] [cursor=pointer]:
                    - generic [ref=e291]:
                      - img [ref=e293]
                      - img [ref=e295]
                    - text: Translation Mode
          - generic [ref=e297]:
            - link "Storybook 10.4 Learn what's new in Storybook Dismiss notification" [ref=e299] [cursor=pointer]:
              - /url: /?path=/settings/whats-new
              - img [ref=e301]
              - generic [ref=e303]:
                - generic "Storybook 10.4" [ref=e304]
                - generic [ref=e305]: Learn what's new in Storybook
              - button "Dismiss notification" [ref=e306]:
                - img [ref=e307]
            - region "Component tests" [ref=e309]:
              - generic [ref=e310]:
                - heading "Component tests" [level=2] [ref=e311]
                - generic [ref=e312] [cursor=pointer]:
                  - button "Run tests" [ref=e316]:
                    - img [ref=e318]
                    - text: Run tests
                  - generic [ref=e321]:
                    - button "Expand testing module" [ref=e322]:
                      - img [ref=e323]
                    - button "Clear all statuses" [ref=e325]:
                      - img [ref=e326]
                - generic [ref=e329]:
                  - generic [ref=e332]:
                    - generic [ref=e333]: Visual tests
                    - button "Login required" [ref=e335]
                  - generic [ref=e337]:
                    - generic [ref=e338]:
                      - generic [ref=e339]:
                        - generic [ref=e340]: Run component tests
                        - generic [ref=e341]: Not run
                      - generic [ref=e342]:
                        - switch "Watch mode" [ref=e343] [cursor=pointer]:
                          - img [ref=e344]
                        - button "Start test run" [ref=e347] [cursor=pointer]:
                          - img [ref=e348]
                    - list [ref=e350]:
                      - listitem [ref=e351]:
                        - generic [ref=e352]:
                          - checkbox "Interactions" [checked] [disabled] [ref=e354]
                          - generic [ref=e355]: Interactions
                        - button "Run tests to see results" [disabled] [ref=e356]
                      - listitem [ref=e358]:
                        - generic [ref=e359] [cursor=pointer]:
                          - checkbox "Coverage" [ref=e361]
                          - generic [ref=e362]: Coverage
                        - button "Coverage unavailable, run tests first" [disabled] [ref=e363]
                      - listitem [ref=e365]:
                        - generic [ref=e366] [cursor=pointer]:
                          - checkbox "Accessibility" [ref=e368]
                          - generic [ref=e369]: Accessibility
                        - button "Run tests to see accessibility results" [disabled] [ref=e370]
      - separator "Sidebar resize handle" [ref=e372]
    - generic [ref=e374]:
      - region "Toolbar" [ref=e375]:
        - heading "Toolbar" [level=2] [ref=e376]
        - toolbar [ref=e377]:
          - generic [ref=e378]:
            - button "Reload story" [ref=e379] [cursor=pointer]:
              - img [ref=e380]
            - switch "Measure tool" [ref=e382] [cursor=pointer]:
              - img [ref=e383]
            - switch "Outline tool" [ref=e386] [cursor=pointer]:
              - img [ref=e387]
            - button "Viewport size" [ref=e389] [cursor=pointer]:
              - img [ref=e390]
              - text: Small mobile
            - button "Vision filter" [ref=e394] [cursor=pointer]:
              - img [ref=e395]
            - button "Translation editing mode Off" [ref=e400] [cursor=pointer]:
              - img [ref=e401]
              - text: "Off"
            - button "Override display language for translations English" [ref=e403] [cursor=pointer]:
              - img [ref=e404]
              - text: English
            - button "Color scheme Light" [ref=e406] [cursor=pointer]:
              - img [ref=e407]
              - text: Light
          - generic [ref=e412]:
            - button "Open in isolation mode" [ref=e413] [cursor=pointer]:
              - img [ref=e414]
            - switch "Change zoom level" [ref=e419] [cursor=pointer]: 100%
            - button "Enter full screen" [ref=e420] [cursor=pointer]:
              - img [ref=e421]
            - button "Share" [ref=e423] [cursor=pointer]
      - main "Main preview area" [ref=e424]:
        - heading "Main preview area" [level=2] [ref=e425]
        - generic [ref=e427]:
          - link "Skip to sidebar" [ref=e428] [cursor=pointer]:
            - /url: "#getting-started-welcome--welcome"
          - generic [ref=e429]:
            - generic [ref=e431]:
              - generic [ref=e432]:
                - button [disabled] [ref=e434]: W
                - generic [ref=e435]: Viewport width
                - textbox "Viewport width" [ref=e437]: 320px
              - button "Rotate viewport" [ref=e438] [cursor=pointer]:
                - img [ref=e439]
              - generic [ref=e441]:
                - button [disabled] [ref=e443]: H
                - generic [ref=e444]: Viewport height
                - textbox "Viewport height" [ref=e446]: 568px
            - generic [ref=e447]:
              - iframe [ref=e449]:
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
              - generic [ref=e450]: "320"
              - generic [ref=e451]: "568"
    - generic [ref=e453]:
      - separator "Addon panel resize handle" [ref=e454]
      - region "Addon panel" [ref=e456]:
        - heading "Addon panel" [level=2] [ref=e457]
        - generic [ref=e458]:
          - generic [ref=e459]:
            - generic [ref=e460]:
              - button "Move addon panel to right" [ref=e461] [cursor=pointer]:
                - img [ref=e462]
              - button "Hide addon panel" [ref=e465] [cursor=pointer]:
                - img [ref=e466]
            - tablist "Available addons" [ref=e471]:
              - tab "Controls" [ref=e472] [cursor=pointer]:
                - generic [ref=e474]: Controls
              - tab "Actions" [ref=e475] [cursor=pointer]:
                - generic [ref=e477]: Actions
              - tab "Interactions" [ref=e478] [cursor=pointer]:
                - generic [ref=e480]: Interactions
              - tab "Visual tests" [ref=e481] [cursor=pointer]
              - tab "Accessibility" [ref=e482] [cursor=pointer]:
                - generic [ref=e484]: Accessibility
              - tab "Code" [ref=e485] [cursor=pointer]
              - tab "Translations" [ref=e486] [cursor=pointer]
              - tab "Onboarding" [selected] [ref=e487] [cursor=pointer]
          - tabpanel "Onboarding" [ref=e488]:
            - generic [ref=e490]:
              - generic [ref=e491]:
                - img [ref=e493]
                - generic [ref=e495]:
                  - heading "Instructor Onboarding" [level=6] [ref=e496]
                  - generic [ref=e497]: 0 of 12 tasks completed
                - generic "Learning mode" [ref=e498]:
                  - button "Tutorial" [ref=e499] [cursor=pointer]:
                    - generic [ref=e500]: Tutorial
                  - button "Quiz" [ref=e501] [cursor=pointer]:
                    - generic [ref=e502]: Quiz
                - button "Change role" [ref=e503] [cursor=pointer]: Change
              - progressbar [ref=e504]
              - generic [ref=e506]: 0% Complete · 📖 Tutorial Mode
              - generic [ref=e507]:
                - generic [ref=e508]:
                  - img [ref=e509]
                  - generic [ref=e511]: 0 Completed
                - generic [ref=e512]:
                  - img [ref=e513]
                  - generic [ref=e515]: 12 Remaining
              - list [ref=e516]:
                - generic [ref=e519] [cursor=pointer]:
                  - generic:
                    - checkbox [disabled]
                    - img
                  - generic:
                    - generic:
                      - generic:
                        - heading "Set Up Your First Class" [level=6]
                        - generic: Create a new class section for your students
                        - generic:
                          - generic:
                            - generic: ~5 min
                          - generic:
                            - generic: Example Available
                          - generic:
                            - generic: Click to start
                      - button [ref=e520]:
                        - img [ref=e521]
                - generic [ref=e525] [cursor=pointer]:
                  - generic:
                    - checkbox [disabled]
                    - img
                  - generic:
                    - generic:
                      - generic:
                        - heading "Create Your First Unit" [level=6]
                        - generic: Build interactive learning content
                        - generic:
                          - generic:
                            - generic: ~10 min
                          - generic:
                            - generic: Example Available
                          - generic:
                            - generic: Click to start
                      - button [ref=e526]:
                        - img [ref=e527]
                - generic [ref=e531] [cursor=pointer]:
                  - generic:
                    - checkbox [disabled]
                    - img
                  - generic:
                    - generic:
                      - generic:
                        - heading "Add a Quiz Block" [level=6]
                        - generic: Create assessment questions in your unit
                        - generic:
                          - generic:
                            - generic: ~5 min
                          - generic:
                            - generic: Example Available
                          - generic:
                            - generic: Click to start
                      - button [ref=e532]:
                        - img [ref=e533]
                - generic [ref=e537] [cursor=pointer]:
                  - generic:
                    - checkbox [disabled]
                    - img
                  - generic:
                    - generic:
                      - generic:
                        - heading "Add Vocabulary Words" [level=6]
                        - generic: Build your class dictionary
                        - generic:
                          - generic:
                            - generic: ~6 min
                          - generic:
                            - generic: Example Available
                          - generic:
                            - generic: Click to start
                      - button [ref=e538]:
                        - img [ref=e539]
                - generic [ref=e543] [cursor=pointer]:
                  - generic:
                    - checkbox [disabled]
                    - img
                  - generic:
                    - generic:
                      - generic:
                        - heading "Assign Work to Students" [level=6]
                        - generic: Set up assignments with due dates
                        - generic:
                          - generic:
                            - generic: ~4 min
                          - generic:
                            - generic: Example Available
                          - generic:
                            - generic: Click to start
                      - button [ref=e544]:
                        - img [ref=e545]
                - generic [ref=e549] [cursor=pointer]:
                  - generic:
                    - checkbox [disabled]
                    - img
                  - generic:
                    - generic:
                      - generic:
                        - heading "View Student Grades" [level=6]
                        - generic: Review student submissions and performance
                        - generic:
                          - generic:
                            - generic: ~4 min
                          - generic:
                            - generic: Example Available
                          - generic:
                            - generic: Click to start
                      - button [ref=e550]:
                        - img [ref=e551]
                - generic [ref=e555] [cursor=pointer]:
                  - generic:
                    - checkbox [disabled]
                    - img
                  - generic:
                    - generic:
                      - generic:
                        - heading "Use AI to Generate Content" [level=6]
                        - generic: Let AI help create your lessons
                        - generic:
                          - generic:
                            - generic: ~8 min
                          - generic:
                            - generic: Example Available
                          - generic:
                            - generic: Click to start
                      - button [ref=e556]:
                        - img [ref=e557]
                - generic [ref=e561] [cursor=pointer]:
                  - generic:
                    - checkbox [disabled]
                    - img
                  - generic:
                    - generic:
                      - generic:
                        - heading "Master Editor Shortcuts" [level=6]
                        - generic: Learn keyboard shortcuts for faster content creation
                        - generic:
                          - generic:
                            - generic: ~5 min
                          - generic:
                            - generic: Example Available
                          - generic:
                            - generic: Click to start
                      - button [ref=e562]:
                        - img [ref=e563]
                - generic [ref=e567] [cursor=pointer]:
                  - generic:
                    - checkbox [disabled]
                    - img
                  - generic:
                    - generic:
                      - generic:
                        - 'heading "👑 SECRET: Keyboard Master Challenge" [level=6]'
                        - generic: 🏆 Complete the interactive keyboard shortcut training to unlock this achievement!
                        - generic:
                          - generic:
                            - generic: ~10 min
                          - generic:
                            - generic: Example Available
                          - generic:
                            - generic: Click to start
                      - button [ref=e568]:
                        - img [ref=e569]
                - generic [ref=e573] [cursor=pointer]:
                  - generic:
                    - checkbox [disabled]
                    - img
                  - generic:
                    - generic:
                      - generic:
                        - 'heading "⚡ SECRET: Speed Demon" [level=6]'
                        - generic: Complete the keyboard training in under 5 minutes
                        - generic:
                          - generic:
                            - generic: ~5 min
                          - generic:
                            - generic: Example Available
                          - generic:
                            - generic: Click to start
                      - button [ref=e574]:
                        - img [ref=e575]
                - generic [ref=e579] [cursor=pointer]:
                  - generic:
                    - checkbox [disabled]
                    - img
                  - generic:
                    - generic:
                      - generic:
                        - 'heading "🏅 SECRET: Achievement Hunter" [level=6]'
                        - generic: Unlock all individual shortcut achievements
                        - generic:
                          - generic:
                            - generic: ~7 min
                          - generic:
                            - generic: Example Available
                          - generic:
                            - generic: Click to start
                      - button [ref=e580]:
                        - img [ref=e581]
                - generic [ref=e585] [cursor=pointer]:
                  - generic:
                    - checkbox [disabled]
                    - img
                  - generic:
                    - generic:
                      - generic:
                        - 'heading "📢 SECRET: Shortcut Evangelist" [level=6]'
                        - generic: Use shortcuts in your daily workflow
                        - generic:
                          - generic:
                            - generic: ~30 min
                          - generic:
                            - generic: Example Available
                          - generic:
                            - generic: Click to start
                      - button [ref=e586]:
                        - img [ref=e587]
              - separator [ref=e589]
              - button "Reset Progress" [ref=e591] [cursor=pointer]
```

# Test source

```ts
  19  |   walkTaskTour,
  20  |   assertAllComplete,
  21  |   assertFullProgress,
  22  |   type TaskSpec,
  23  | } from "./helpers";
  24  | 
  25  | // ─── Instructor task catalogue ───────────────────────────────────────────────
  26  | // Mirrors ONBOARDING_TASKS for persona="instructor" plus persona="all",
  27  | // sorted by order asc. Kept inline to avoid importing browser-side modules.
  28  | 
  29  | const INSTRUCTOR_TASKS: TaskSpec[] = [
  30  |   // ── instructor tasks (order 1–8) ──────────────────────────────────────────
  31  |   {
  32  |     id: "instructor-setup-class",
  33  |     title: "Set Up Your First Class",
  34  |     completionCriteria: { completionSequence: ["create-section-button"] },
  35  |   },
  36  |   {
  37  |     id: "instructor-create-unit",
  38  |     title: "Create Your First Unit",
  39  |     completionCriteria: { completionSequence: ["create-unit-button"] },
  40  |   },
  41  |   {
  42  |     id: "instructor-add-quiz",
  43  |     title: "Add a Quiz Block",
  44  |     completionCriteria: { completionSequence: ["insert-button", "quiz-block"] },
  45  |   },
  46  |   {
  47  |     id: "instructor-create-vocabulary",
  48  |     title: "Add Vocabulary Words",
  49  |     completionCriteria: { completionSequence: ["add-word-button", "word-form"] },
  50  |   },
  51  |   {
  52  |     id: "instructor-create-assignment",
  53  |     title: "Assign Work to Students",
  54  |     completionCriteria: {
  55  |       completionSequence: ["unit-selector", "create-assignment-button"],
  56  |     },
  57  |   },
  58  |   {
  59  |     id: "instructor-view-grades",
  60  |     title: "View Student Grades",
  61  |     completionCriteria: { completionSequence: ["grades-tab"] },
  62  |   },
  63  |   {
  64  |     id: "instructor-use-ai-assistant",
  65  |     title: "Use AI to Generate Content",
  66  |     completionCriteria: { completionSequence: ["chat-input"] },
  67  |   },
  68  |   {
  69  |     id: "instructor-learn-shortcuts",
  70  |     title: "Master Editor Shortcuts",
  71  |     completionCriteria: { completionSequence: ["shortcuts-demo"] },
  72  |   },
  73  |   // ── "all" persona tasks (order 100–103) ───────────────────────────────────
  74  |   {
  75  |     id: "secret-keyboard-master",
  76  |     title: "👑 SECRET: Keyboard Master Challenge",
  77  |     completionCriteria: { customCheck: () => false }, // customCheck only — injected
  78  |   },
  79  |   {
  80  |     id: "secret-speed-demon",
  81  |     title: "⚡ SECRET: Speed Demon",
  82  |     completionCriteria: { customCheck: () => false },
  83  |   },
  84  |   {
  85  |     id: "secret-achievement-hunter",
  86  |     title: "🏅 SECRET: Achievement Hunter",
  87  |     completionCriteria: { customCheck: () => false },
  88  |   },
  89  |   {
  90  |     id: "secret-shortcut-evangelist",
  91  |     title: "📢 SECRET: Shortcut Evangelist",
  92  |     completionCriteria: { completionSequence: ["editor-toolbar"] },
  93  |   },
  94  | ];
  95  | 
  96  | // ─── Tests ────────────────────────────────────────────────────────────────────
  97  | 
  98  | test.describe("Instructor onboarding tour", () => {
  99  |   test.beforeEach(async ({ page }) => {
  100 |     await resetOnboarding(page);
  101 |   });
  102 | 
  103 |   test("persona selection shows instructor task list", async ({ page }) => {
  104 |     await openOnboardingPanel(page);
  105 |     await selectPersona(page, "instructor");
  106 | 
  107 |     // Should show 0 completed out of the full task count
  108 |     await expect(page.getByText(/0 of \d+ tasks completed/)).toBeVisible();
  109 | 
  110 |     // All task cards should be visible (at least the first few)
  111 |     for (const task of INSTRUCTOR_TASKS.slice(0, 4)) {
  112 |       await expect(
  113 |         page.locator('[data-testid="task-item"]').filter({ hasText: task.title })
  114 |       ).toBeVisible();
  115 |     }
  116 | 
  117 |     // Progress bar should start at 0
  118 |     const bar = page.getByRole("progressbar");
> 119 |     await expect(bar).toHaveAttribute("aria-valuenow", "0");
      |                       ^ Error: expect(locator).toHaveAttribute(expected) failed
  120 |   });
  121 | 
  122 |   test("completes full instructor tour — step by step", async ({ page }) => {
  123 |     await openOnboardingPanel(page);
  124 |     await selectPersona(page, "instructor");
  125 | 
  126 |     // Walk through every task in order, asserting progress after each one
  127 |     for (let i = 0; i < INSTRUCTOR_TASKS.length; i++) {
  128 |       await walkTaskTour(page, INSTRUCTOR_TASKS[i], "instructor", i + 1);
  129 |     }
  130 | 
  131 |     // Final state: all done
  132 |     await assertAllComplete(page);
  133 |     await assertFullProgress(page);
  134 |   });
  135 | });
  136 | 
```