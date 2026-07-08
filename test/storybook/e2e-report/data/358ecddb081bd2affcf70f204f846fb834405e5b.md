# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: translator-tour.spec.ts >> Translator onboarding tour >> persona selection shows translator task list
- Location: test/storybook/e2e/translator-tour.spec.ts:93:7

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
                  - generic [ref=e102]:
                    - generic [ref=e103]: Translator
                    - generic [ref=e104]: 0/10 completed · 0%
                - generic [ref=e105]:
                  - generic [ref=e108]:
                    - generic [ref=e109]: Next Tasks
                    - generic [ref=e110] [cursor=pointer]:
                      - generic [ref=e111]: ○
                      - generic [ref=e113]: Try the Language Switcher
                    - generic [ref=e114] [cursor=pointer]:
                      - generic [ref=e115]: ○
                      - generic [ref=e117]: Open the Translations Panel
                    - generic [ref=e118] [cursor=pointer]:
                      - generic [ref=e119]: ○
                      - generic [ref=e121]: Understand Locale File Structure
                  - generic [ref=e122] [cursor=pointer]: View All Tasks →
              - navigation "Stories" [ref=e123]:
                - heading "Stories" [level=2] [ref=e124]
                - generic [ref=e126]:
                  - button "🏠 Getting Started" [ref=e128] [cursor=pointer]:
                    - generic [ref=e129]:
                      - img [ref=e131]
                      - img [ref=e133]
                    - text: 🏠 Getting Started
                  - button "✏️ Lesson Editor" [ref=e136] [cursor=pointer]:
                    - generic [ref=e137]:
                      - img [ref=e139]
                      - img [ref=e141]
                    - text: ✏️ Lesson Editor
                  - button "📁 Content Management" [ref=e144] [cursor=pointer]:
                    - generic [ref=e145]:
                      - img [ref=e147]
                      - img [ref=e149]
                    - text: 📁 Content Management
                  - button "💬 AI Assistant" [ref=e152] [cursor=pointer]:
                    - generic [ref=e153]:
                      - img [ref=e155]
                      - img [ref=e157]
                    - text: 💬 AI Assistant
                  - button "🎙️ Recording Studio" [ref=e160] [cursor=pointer]:
                    - generic [ref=e161]:
                      - img [ref=e163]
                      - img [ref=e165]
                    - text: 🎙️ Recording Studio
                  - button "📓 Workbook" [ref=e168] [cursor=pointer]:
                    - generic [ref=e169]:
                      - img [ref=e171]
                      - img [ref=e173]
                    - text: 📓 Workbook
                  - button "🏆 Gamification" [ref=e176] [cursor=pointer]:
                    - generic [ref=e177]:
                      - img [ref=e179]
                      - img [ref=e181]
                    - text: 🏆 Gamification
                  - button "🤝 Peer Review" [ref=e184] [cursor=pointer]:
                    - generic [ref=e185]:
                      - img [ref=e187]
                      - img [ref=e189]
                    - text: 🤝 Peer Review
                  - button "🎯 Practice Drills" [ref=e192] [cursor=pointer]:
                    - generic [ref=e193]:
                      - img [ref=e195]
                      - img [ref=e197]
                    - text: 🎯 Practice Drills
                  - button "📊 Instructor Tools" [ref=e200] [cursor=pointer]:
                    - generic [ref=e201]:
                      - img [ref=e203]
                      - img [ref=e205]
                    - text: 📊 Instructor Tools
                  - button "🔌 Offline & Sync" [ref=e208] [cursor=pointer]:
                    - generic [ref=e209]:
                      - img [ref=e211]
                      - img [ref=e213]
                    - text: 🔌 Offline & Sync
                  - button "🧩 UI Components" [ref=e216] [cursor=pointer]:
                    - generic [ref=e217]:
                      - img [ref=e219]
                      - img [ref=e221]
                    - text: 🧩 UI Components
                  - button "🛠️ Developer Tools" [ref=e224] [cursor=pointer]:
                    - generic [ref=e225]:
                      - img [ref=e227]
                      - img [ref=e229]
                    - text: 🛠️ Developer Tools
                  - button "Example" [ref=e232] [cursor=pointer]:
                    - generic [ref=e233]:
                      - img [ref=e235]
                      - img [ref=e237]
                    - text: Example
                  - button "📄 Pages" [ref=e240] [cursor=pointer]:
                    - generic [ref=e241]:
                      - img [ref=e243]
                      - img [ref=e245]
                    - text: 📄 Pages
                  - button "🛠️ Admin" [ref=e248] [cursor=pointer]:
                    - generic [ref=e249]:
                      - img [ref=e251]
                      - img [ref=e253]
                    - text: 🛠️ Admin
                  - button "💬 Collaborative Chat" [ref=e256] [cursor=pointer]:
                    - generic [ref=e257]:
                      - img [ref=e259]
                      - img [ref=e261]
                    - text: 💬 Collaborative Chat
                  - button "� Instructor Tools" [ref=e264] [cursor=pointer]:
                    - generic [ref=e265]:
                      - img [ref=e267]
                      - img [ref=e269]
                    - text: � Instructor Tools
                  - button "📬 Notifications" [ref=e272] [cursor=pointer]:
                    - generic [ref=e273]:
                      - img [ref=e275]
                      - img [ref=e277]
                    - text: 📬 Notifications
                  - button "� Gamification" [ref=e280] [cursor=pointer]:
                    - generic [ref=e281]:
                      - img [ref=e283]
                      - img [ref=e285]
                    - text: � Gamification
                  - button "Translation Mode" [ref=e288] [cursor=pointer]:
                    - generic [ref=e289]:
                      - img [ref=e291]
                      - img [ref=e293]
                    - text: Translation Mode
          - generic [ref=e295]:
            - link "Storybook 10.4 Learn what's new in Storybook Dismiss notification" [ref=e297] [cursor=pointer]:
              - /url: /?path=/settings/whats-new
              - img [ref=e299]
              - generic [ref=e301]:
                - generic "Storybook 10.4" [ref=e302]
                - generic [ref=e303]: Learn what's new in Storybook
              - button "Dismiss notification" [ref=e304]:
                - img [ref=e305]
            - region "Component tests" [ref=e307]:
              - generic [ref=e308]:
                - heading "Component tests" [level=2] [ref=e309]
                - generic [ref=e310] [cursor=pointer]:
                  - button "Run tests" [ref=e314]:
                    - img [ref=e316]
                    - text: Run tests
                  - generic [ref=e319]:
                    - button "Expand testing module" [ref=e320]:
                      - img [ref=e321]
                    - button "Clear all statuses" [ref=e323]:
                      - img [ref=e324]
                - generic [ref=e327]:
                  - generic [ref=e330]:
                    - generic [ref=e331]: Visual tests
                    - button "Login required" [ref=e333]
                  - generic [ref=e335]:
                    - generic [ref=e336]:
                      - generic [ref=e337]:
                        - generic [ref=e338]: Run component tests
                        - generic [ref=e339]: Not run
                      - generic [ref=e340]:
                        - switch "Watch mode" [ref=e341] [cursor=pointer]:
                          - img [ref=e342]
                        - button "Start test run" [ref=e345] [cursor=pointer]:
                          - img [ref=e346]
                    - list [ref=e348]:
                      - listitem [ref=e349]:
                        - generic [ref=e350]:
                          - checkbox "Interactions" [checked] [disabled] [ref=e352]
                          - generic [ref=e353]: Interactions
                        - button "Run tests to see results" [disabled] [ref=e354]
                      - listitem [ref=e356]:
                        - generic [ref=e357] [cursor=pointer]:
                          - checkbox "Coverage" [ref=e359]
                          - generic [ref=e360]: Coverage
                        - button "Coverage unavailable, run tests first" [disabled] [ref=e361]
                      - listitem [ref=e363]:
                        - generic [ref=e364] [cursor=pointer]:
                          - checkbox "Accessibility" [ref=e366]
                          - generic [ref=e367]: Accessibility
                        - button "Run tests to see accessibility results" [disabled] [ref=e368]
      - separator "Sidebar resize handle" [ref=e370]
    - generic [ref=e372]:
      - region "Toolbar" [ref=e373]:
        - heading "Toolbar" [level=2] [ref=e374]
        - toolbar [ref=e375]:
          - generic [ref=e376]:
            - button "Reload story" [ref=e377] [cursor=pointer]:
              - img [ref=e378]
            - switch "Measure tool" [ref=e380] [cursor=pointer]:
              - img [ref=e381]
            - switch "Outline tool" [ref=e384] [cursor=pointer]:
              - img [ref=e385]
            - button "Viewport size" [ref=e387] [cursor=pointer]:
              - img [ref=e388]
              - text: Small mobile
            - button "Vision filter" [ref=e392] [cursor=pointer]:
              - img [ref=e393]
            - button "Translation editing mode Off" [ref=e398] [cursor=pointer]:
              - img [ref=e399]
              - text: "Off"
            - button "Override display language for translations English" [ref=e401] [cursor=pointer]:
              - img [ref=e402]
              - text: English
            - button "Color scheme Light" [ref=e404] [cursor=pointer]:
              - img [ref=e405]
              - text: Light
          - generic [ref=e410]:
            - button "Open in isolation mode" [ref=e411] [cursor=pointer]:
              - img [ref=e412]
            - switch "Change zoom level" [ref=e417] [cursor=pointer]: 100%
            - button "Enter full screen" [ref=e418] [cursor=pointer]:
              - img [ref=e419]
            - button "Share" [ref=e421] [cursor=pointer]
      - main "Main preview area" [ref=e422]:
        - heading "Main preview area" [level=2] [ref=e423]
        - generic [ref=e425]:
          - link "Skip to sidebar" [ref=e426] [cursor=pointer]:
            - /url: "#getting-started-welcome--welcome"
          - generic [ref=e427]:
            - generic [ref=e429]:
              - generic [ref=e430]:
                - button [disabled] [ref=e432]: W
                - generic [ref=e433]: Viewport width
                - textbox "Viewport width" [ref=e435]: 320px
              - button "Rotate viewport" [ref=e436] [cursor=pointer]:
                - img [ref=e437]
              - generic [ref=e439]:
                - button [disabled] [ref=e441]: H
                - generic [ref=e442]: Viewport height
                - textbox "Viewport height" [ref=e444]: 568px
            - generic [ref=e445]:
              - iframe [ref=e447]:
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
              - generic [ref=e448]: "320"
              - generic [ref=e449]: "568"
    - generic [ref=e451]:
      - separator "Addon panel resize handle" [ref=e452]
      - region "Addon panel" [ref=e454]:
        - heading "Addon panel" [level=2] [ref=e455]
        - generic [ref=e456]:
          - generic [ref=e457]:
            - generic [ref=e458]:
              - button "Move addon panel to right" [ref=e459] [cursor=pointer]:
                - img [ref=e460]
              - button "Hide addon panel" [ref=e463] [cursor=pointer]:
                - img [ref=e464]
            - tablist "Available addons" [ref=e469]:
              - tab "Controls" [ref=e470] [cursor=pointer]:
                - generic [ref=e472]: Controls
              - tab "Actions" [ref=e473] [cursor=pointer]:
                - generic [ref=e475]: Actions
              - tab "Interactions" [ref=e476] [cursor=pointer]:
                - generic [ref=e478]: Interactions
              - tab "Visual tests" [ref=e479] [cursor=pointer]
              - tab "Accessibility" [ref=e480] [cursor=pointer]:
                - generic [ref=e482]: Accessibility
              - tab "Code" [ref=e483] [cursor=pointer]
              - tab "Translations" [ref=e484] [cursor=pointer]
              - tab "Onboarding" [selected] [ref=e485] [cursor=pointer]
          - tabpanel "Onboarding" [ref=e486]:
            - generic [ref=e488]:
              - generic [ref=e489]:
                - img [ref=e491]
                - generic [ref=e493]:
                  - heading "Translator Onboarding" [level=6] [ref=e494]
                  - generic [ref=e495]: 0 of 10 tasks completed
                - generic "Learning mode" [ref=e496]:
                  - button "Tutorial" [ref=e497] [cursor=pointer]:
                    - generic [ref=e498]: Tutorial
                  - button "Quiz" [ref=e499] [cursor=pointer]:
                    - generic [ref=e500]: Quiz
                - button "Change role" [ref=e501] [cursor=pointer]: Change
              - progressbar [ref=e502]
              - generic [ref=e504]: 0% Complete · 📖 Tutorial Mode
              - generic [ref=e505]:
                - generic [ref=e506]:
                  - img [ref=e507]
                  - generic [ref=e509]: 0 Completed
                - generic [ref=e510]:
                  - img [ref=e511]
                  - generic [ref=e513]: 10 Remaining
              - list [ref=e514]:
                - generic [ref=e517] [cursor=pointer]:
                  - generic:
                    - checkbox [disabled]
                    - img
                  - generic:
                    - generic:
                      - generic:
                        - heading "Try the Language Switcher" [level=6]
                        - generic: Preview how UI text appears in each supported language
                        - generic:
                          - generic:
                            - generic: ~2 min
                          - generic:
                            - generic: Example Available
                          - generic:
                            - generic: Click to start
                      - button [ref=e518]:
                        - img [ref=e519]
                - generic [ref=e523] [cursor=pointer]:
                  - generic:
                    - checkbox [disabled]
                    - img
                  - generic:
                    - generic:
                      - generic:
                        - heading "Open the Translations Panel" [level=6]
                        - generic: Use the addon panel to browse, edit, and export translation keys
                        - generic:
                          - generic:
                            - generic: ~3 min
                          - generic:
                            - generic: Example Available
                          - generic:
                            - generic: Click to start
                      - button [ref=e524]:
                        - img [ref=e525]
                - generic [ref=e529] [cursor=pointer]:
                  - generic:
                    - checkbox [disabled]
                    - img
                  - generic:
                    - generic:
                      - generic:
                        - heading "Understand Locale File Structure" [level=6]
                        - generic: Learn where JSON locale files live and how namespaces map to components
                        - generic:
                          - generic:
                            - generic: ~5 min
                          - generic:
                            - generic: Example Available
                          - generic:
                            - generic: Click to start
                      - button [ref=e530]:
                        - img [ref=e531]
                - generic [ref=e535] [cursor=pointer]:
                  - generic:
                    - checkbox [disabled]
                    - img
                  - generic:
                    - generic:
                      - generic:
                        - heading "Review Component Context" [level=6]
                        - generic: See exactly which components use each translation key and why
                        - generic:
                          - generic:
                            - generic: ~4 min
                          - generic:
                            - generic: Example Available
                          - generic:
                            - generic: Click to start
                      - button [ref=e536]:
                        - img [ref=e537]
                - generic [ref=e541] [cursor=pointer]:
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
                      - button [ref=e542]:
                        - img [ref=e543]
                - generic [ref=e547] [cursor=pointer]:
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
                      - button [ref=e548]:
                        - img [ref=e549]
                - generic [ref=e553] [cursor=pointer]:
                  - generic:
                    - checkbox [disabled]
                    - img
                  - generic:
                    - generic:
                      - generic:
                        - heading "Test RTL Language Support" [level=6]
                        - generic: Verify that right-to-left languages render correctly across components
                        - generic:
                          - generic:
                            - generic: ~5 min
                          - generic:
                            - generic: Example Available
                          - generic:
                            - generic: Click to start
                      - button [ref=e554]:
                        - img [ref=e555]
                - generic [ref=e559] [cursor=pointer]:
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
                      - button [ref=e560]:
                        - img [ref=e561]
                - generic [ref=e565] [cursor=pointer]:
                  - generic:
                    - checkbox [disabled]
                    - img
                  - generic:
                    - generic:
                      - generic:
                        - heading "Review Pluralization Rules" [level=6]
                        - generic: Verify that count-dependent translations handle plural forms correctly per locale
                        - generic:
                          - generic:
                            - generic: ~10 min
                          - generic:
                            - generic: Example Available
                          - generic:
                            - generic: Click to start
                      - button [ref=e566]:
                        - img [ref=e567]
                - generic [ref=e571] [cursor=pointer]:
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
                      - button [ref=e572]:
                        - img [ref=e573]
              - separator [ref=e575]
              - button "Reset Progress" [ref=e577] [cursor=pointer]
```

# Test source

```ts
  6   |  *
  7   |  * Prerequisites:
  8   |  *   npm run storybook     (Storybook running at localhost:6006)
  9   |  *
  10  |  * Run:
  11  |  *   npx playwright test --config playwright.storybook.config.ts translator-tour
  12  |  */
  13  | 
  14  | import { test, expect } from "@playwright/test";
  15  | import {
  16  |   resetOnboarding,
  17  |   openOnboardingPanel,
  18  |   selectPersona,
  19  |   walkTaskTour,
  20  |   assertAllComplete,
  21  |   assertFullProgress,
  22  |   type TaskSpec,
  23  | } from "./helpers";
  24  | 
  25  | // ─── Translator task catalogue ───────────────────────────────────────────────
  26  | // Mirrors ONBOARDING_TASKS for persona="translator" plus persona="all",
  27  | // sorted by order asc.
  28  | 
  29  | const TRANSLATOR_TASKS: TaskSpec[] = [
  30  |   // ── translator tasks (order 1–5, + extra credit 101–102) ─────────────────
  31  |   {
  32  |     id: "translator-language-switcher",
  33  |     title: "Try the Language Switcher",
  34  |     completionCriteria: {
  35  |       completionSequence: ["translation-demo-instructions"],
  36  |     },
  37  |   },
  38  |   {
  39  |     id: "translator-translation-panel",
  40  |     title: "Open the Translations Panel",
  41  |     completionCriteria: { completionSequence: ["translation-auth-form"] },
  42  |   },
  43  |   {
  44  |     id: "translator-locale-files",
  45  |     title: "Understand Locale File Structure",
  46  |     completionCriteria: { completionSequence: ["translation-auth-form"] },
  47  |   },
  48  |   {
  49  |     id: "translator-component-context",
  50  |     title: "Review Component Context",
  51  |     completionCriteria: { completionSequence: ["translation-auth-buttons"] },
  52  |   },
  53  |   {
  54  |     id: "translator-test-rtl",
  55  |     title: "Test RTL Language Support",
  56  |     completionCriteria: { completionSequence: ["translation-auth-buttons"] },
  57  |   },
  58  |   {
  59  |     id: "translator-pluralization",
  60  |     title: "Review Pluralization Rules",
  61  |     completionCriteria: { completionSequence: ["translation-password-reset"] },
  62  |   },
  63  |   // ── "all" persona tasks (order 100–103) ───────────────────────────────────
  64  |   {
  65  |     id: "secret-keyboard-master",
  66  |     title: "👑 SECRET: Keyboard Master Challenge",
  67  |     completionCriteria: { customCheck: () => false },
  68  |   },
  69  |   {
  70  |     id: "secret-speed-demon",
  71  |     title: "⚡ SECRET: Speed Demon",
  72  |     completionCriteria: { customCheck: () => false },
  73  |   },
  74  |   {
  75  |     id: "secret-achievement-hunter",
  76  |     title: "🏅 SECRET: Achievement Hunter",
  77  |     completionCriteria: { customCheck: () => false },
  78  |   },
  79  |   {
  80  |     id: "secret-shortcut-evangelist",
  81  |     title: "📢 SECRET: Shortcut Evangelist",
  82  |     completionCriteria: { completionSequence: ["editor-toolbar"] },
  83  |   },
  84  | ];
  85  | 
  86  | // ─── Tests ────────────────────────────────────────────────────────────────────
  87  | 
  88  | test.describe("Translator onboarding tour", () => {
  89  |   test.beforeEach(async ({ page }) => {
  90  |     await resetOnboarding(page);
  91  |   });
  92  | 
  93  |   test("persona selection shows translator task list", async ({ page }) => {
  94  |     await openOnboardingPanel(page);
  95  |     await selectPersona(page, "translator");
  96  | 
  97  |     await expect(page.getByText(/0 of \d+ tasks completed/)).toBeVisible();
  98  | 
  99  |     for (const task of TRANSLATOR_TASKS.slice(0, 4)) {
  100 |       await expect(
  101 |         page.locator('[data-testid="task-item"]').filter({ hasText: task.title })
  102 |       ).toBeVisible();
  103 |     }
  104 | 
  105 |     const bar = page.getByRole("progressbar");
> 106 |     await expect(bar).toHaveAttribute("aria-valuenow", "0");
      |                       ^ Error: expect(locator).toHaveAttribute(expected) failed
  107 |   });
  108 | 
  109 |   test("completes full translator tour — step by step", async ({ page }) => {
  110 |     await openOnboardingPanel(page);
  111 |     await selectPersona(page, "translator");
  112 | 
  113 |     for (let i = 0; i < TRANSLATOR_TASKS.length; i++) {
  114 |       await walkTaskTour(page, TRANSLATOR_TASKS[i], "translator", i + 1);
  115 |     }
  116 | 
  117 |     await assertAllComplete(page);
  118 |     await assertFullProgress(page);
  119 |   });
  120 | });
  121 | 
```