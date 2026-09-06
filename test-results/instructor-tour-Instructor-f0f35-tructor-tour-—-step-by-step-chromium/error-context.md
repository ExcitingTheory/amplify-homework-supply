# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: instructor-tour.spec.ts >> Instructor onboarding tour >> completes full instructor tour — step by step
- Location: test/storybook/e2e/instructor-tour.spec.ts:147:7

# Error details

```
Error: expect(locator).toBeAttached() failed

Locator: locator('#storybook-preview-iframe').contentFrame().locator('[data-tour="create-section-button"]').first()
Expected: attached
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeAttached" with timeout 15000ms
  - waiting for locator('#storybook-preview-iframe').contentFrame().locator('[data-tour="create-section-button"]').first()

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - log
    - log
  - generic [ref=e4]:
    - generic [ref=e5]:
      - banner "Storybook" [ref=e7]:
        - heading "Storybook" [level=1] [ref=e8]
        - img
        - generic [ref=e11]:
          - generic [ref=e12]:
            - generic [ref=e14]:
              - link "Skip to content" [ref=e15] [cursor=pointer]:
                - /url: "#storybook-preview-wrapper"
              - link "Storybook" [ref=e17] [cursor=pointer]:
                - /url: ./
                - img "Storybook" [ref=e18]
              - switch "Settings" [ref=e23] [cursor=pointer]:
                - img [ref=e24]
            - generic [ref=e27]: Search for components
            - search [ref=e28]:
              - combobox "Search for components" [ref=e29]:
                - generic:
                  - img
                - searchbox "Search for components" [ref=e30]
                - code:
                  - generic: ⌘
                  - text: K
                - button "Tag filters" [ref=e32] [cursor=pointer]:
                  - img [ref=e33]
              - button "Create a new story" [ref=e35] [cursor=pointer]:
                - img [ref=e36]
            - generic [ref=e38]:
              - generic [ref=e41]:
                - generic [ref=e42]:
                  - img [ref=e44]
                  - generic [ref=e49]:
                    - generic [ref=e50]: Instructor
                    - generic [ref=e51]: 0/13 completed · 0%
                - generic [ref=e52]:
                  - generic [ref=e55]:
                    - generic [ref=e56]: Next Tasks
                    - generic [ref=e57] [cursor=pointer]:
                      - generic [ref=e58]: ○
                      - generic [ref=e60]: Set Up Your First Class
                    - generic [ref=e61] [cursor=pointer]:
                      - generic [ref=e62]: ○
                      - generic [ref=e64]: Create Your First Unit
                    - generic [ref=e65] [cursor=pointer]:
                      - generic [ref=e66]: ○
                      - generic [ref=e68]: Add a Quiz Block
                  - generic [ref=e69] [cursor=pointer]: View All Tasks →
              - navigation "Stories" [ref=e70]:
                - heading "Stories" [level=2] [ref=e71]
                - generic [ref=e73]:
                  - button "🏠 Getting Started" [ref=e75] [cursor=pointer]:
                    - generic [ref=e76]:
                      - img [ref=e78]
                      - img [ref=e80]
                    - text: 🏠 Getting Started
                  - button "✏️ Lesson Editor" [ref=e83] [cursor=pointer]:
                    - generic [ref=e84]:
                      - img [ref=e86]
                      - img [ref=e88]
                    - text: ✏️ Lesson Editor
                  - button "📁 Content Management" [ref=e91] [cursor=pointer]:
                    - generic [ref=e92]:
                      - img [ref=e94]
                      - img [ref=e96]
                    - text: 📁 Content Management
                  - button "💬 AI Assistant" [ref=e99] [cursor=pointer]:
                    - generic [ref=e100]:
                      - img [ref=e102]
                      - img [ref=e104]
                    - text: 💬 AI Assistant
                  - button "🎙️ Recording Studio" [ref=e107] [cursor=pointer]:
                    - generic [ref=e108]:
                      - img [ref=e110]
                      - img [ref=e112]
                    - text: 🎙️ Recording Studio
                  - button "📓 Workbook" [ref=e115] [cursor=pointer]:
                    - generic [ref=e116]:
                      - img [ref=e118]
                      - img [ref=e120]
                    - text: 📓 Workbook
                  - button "🏆 Gamification" [ref=e123] [cursor=pointer]:
                    - generic [ref=e124]:
                      - img [ref=e126]
                      - img [ref=e128]
                    - text: 🏆 Gamification
                  - button "🤝 Peer Review" [ref=e131] [cursor=pointer]:
                    - generic [ref=e132]:
                      - img [ref=e134]
                      - img [ref=e136]
                    - text: 🤝 Peer Review
                  - button "🎯 Practice Drills" [ref=e139] [cursor=pointer]:
                    - generic [ref=e140]:
                      - img [ref=e142]
                      - img [ref=e144]
                    - text: 🎯 Practice Drills
                  - button "📊 Instructor Tools" [ref=e147] [cursor=pointer]:
                    - generic [ref=e148]:
                      - img [ref=e150]
                      - img [ref=e152]
                    - text: 📊 Instructor Tools
                  - button "🔌 Offline & Sync" [ref=e155] [cursor=pointer]:
                    - generic [ref=e156]:
                      - img [ref=e158]
                      - img [ref=e160]
                    - text: 🔌 Offline & Sync
                  - button "🧩 UI Components" [ref=e163] [cursor=pointer]:
                    - generic [ref=e164]:
                      - img [ref=e166]
                      - img [ref=e168]
                    - text: 🧩 UI Components
                  - button "🛠️ Developer Tools" [ref=e171] [cursor=pointer]:
                    - generic [ref=e172]:
                      - img [ref=e174]
                      - img [ref=e176]
                    - text: 🛠️ Developer Tools
                  - button "Example" [ref=e179] [cursor=pointer]:
                    - generic [ref=e180]:
                      - img [ref=e182]
                      - img [ref=e184]
                    - text: Example
                  - button "📄 Pages" [expanded] [ref=e187] [cursor=pointer]:
                    - generic [ref=e188]:
                      - img [ref=e190]
                      - img [ref=e192]
                    - text: 📄 Pages
                  - button "Application Pages" [expanded] [ref=e195] [cursor=pointer]:
                    - generic [ref=e196]:
                      - img [ref=e198]
                      - img [ref=e200]
                    - text: Application Pages
                  - link "Settings" [ref=e203] [cursor=pointer]:
                    - /url: /?path=/story/📄-pages-application-pages--settings
                    - img [ref=e205]
                    - text: Settings
                  - link "Recycle Bin" [ref=e208] [cursor=pointer]:
                    - /url: /?path=/story/📄-pages-application-pages--recycle-bin
                    - img [ref=e210]
                    - text: Recycle Bin
                  - link "Squads" [ref=e213] [cursor=pointer]:
                    - /url: /?path=/story/📄-pages-application-pages--squads
                    - img [ref=e215]
                    - text: Squads
                  - link "Squad Detail" [ref=e218] [cursor=pointer]:
                    - /url: /?path=/story/📄-pages-application-pages--squad-detail
                    - img [ref=e220]
                    - text: Squad Detail
                  - link "XP History" [ref=e223] [cursor=pointer]:
                    - /url: /?path=/story/📄-pages-application-pages--xp-history
                    - img [ref=e225]
                    - text: XP History
                  - link "Leaderboard" [ref=e228] [cursor=pointer]:
                    - /url: /?path=/story/📄-pages-application-pages--leaderboard
                    - img [ref=e230]
                    - text: Leaderboard
                  - link "Notifications" [ref=e233] [cursor=pointer]:
                    - /url: /?path=/story/📄-pages-application-pages--notifications
                    - img [ref=e235]
                    - text: Notifications
                  - link "Admin Analytics" [ref=e238] [cursor=pointer]:
                    - /url: /?path=/story/📄-pages-application-pages--admin-analytics
                    - img [ref=e240]
                    - text: Admin Analytics
                  - link "Admin Archives" [ref=e243] [cursor=pointer]:
                    - /url: /?path=/story/📄-pages-application-pages--admin-archives
                    - img [ref=e245]
                    - text: Admin Archives
                  - link "Admin Moderation" [ref=e248] [cursor=pointer]:
                    - /url: /?path=/story/📄-pages-application-pages--admin-moderation
                    - img [ref=e250]
                    - text: Admin Moderation
                  - link "Admin Settings" [ref=e253] [cursor=pointer]:
                    - /url: /?path=/story/📄-pages-application-pages--admin-settings
                    - img [ref=e255]
                    - text: Admin Settings
                  - link "Admin Words" [ref=e258] [cursor=pointer]:
                    - /url: /?path=/story/📄-pages-application-pages--admin-words
                    - img [ref=e260]
                    - text: Admin Words
                  - link "Instructor Grade" [ref=e263] [cursor=pointer]:
                    - /url: /?path=/story/📄-pages-application-pages--instructor-grade
                    - img [ref=e265]
                    - text: Instructor Grade
                  - link "Drill" [ref=e268] [cursor=pointer]:
                    - /url: /?path=/story/📄-pages-application-pages--drill
                    - img [ref=e270]
                    - text: Drill
                  - link "Offline" [ref=e273] [cursor=pointer]:
                    - /url: /?path=/story/📄-pages-application-pages--offline
                    - img [ref=e275]
                    - text: Offline
                  - link "Privacy" [ref=e278] [cursor=pointer]:
                    - /url: /?path=/story/📄-pages-application-pages--privacy
                    - img [ref=e280]
                    - text: Privacy
                  - link "Profile Public" [ref=e283] [cursor=pointer]:
                    - /url: /?path=/story/📄-pages-application-pages--profile-public
                    - img [ref=e285]
                    - text: Profile Public
                  - link "Section AI Settings" [ref=e288] [cursor=pointer]:
                    - /url: /?path=/story/📄-pages-application-pages--section-ai-settings
                    - img [ref=e290]
                    - text: Section AI Settings
                  - link "Section Gamification Settings" [ref=e293] [cursor=pointer]:
                    - /url: /?path=/story/📄-pages-application-pages--section-gamification-settings
                    - img [ref=e295]
                    - text: Section Gamification Settings
                  - link "Index" [ref=e298] [cursor=pointer]:
                    - /url: /?path=/story/📄-pages-application-pages--index
                    - img [ref=e300]
                    - text: Index
                  - link "Index No Sections" [ref=e303] [cursor=pointer]:
                    - /url: /?path=/story/📄-pages-application-pages--index-no-sections
                    - img [ref=e305]
                    - text: Index No Sections
                  - link "Index Assignments" [ref=e308] [cursor=pointer]:
                    - /url: /?path=/story/📄-pages-application-pages--index-assignments
                    - img [ref=e310]
                    - text: Index Assignments
                  - link "Units" [ref=e313] [cursor=pointer]:
                    - /url: /?path=/story/📄-pages-application-pages--units
                    - img [ref=e315]
                    - text: Units
                  - link "Units Empty State" [ref=e318] [cursor=pointer]:
                    - /url: /?path=/story/📄-pages-application-pages--units-empty-state
                    - img [ref=e320]
                    - text: Units Empty State
                  - generic [ref=e322]:
                    - link "Sections" [ref=e323] [cursor=pointer]:
                      - /url: /?path=/story/📄-pages-application-pages--sections
                      - img [ref=e325]
                      - text: Sections
                    - link "Skip to content" [ref=e327] [cursor=pointer]:
                      - /url: "#storybook-preview-wrapper"
                  - link "Sections Empty State" [ref=e329] [cursor=pointer]:
                    - /url: /?path=/story/📄-pages-application-pages--sections-empty-state
                    - img [ref=e331]
                    - text: Sections Empty State
                  - link "Section Detail" [ref=e334] [cursor=pointer]:
                    - /url: /?path=/story/📄-pages-application-pages--section-detail
                    - img [ref=e336]
                    - text: Section Detail
                  - link "Section Detail Student" [ref=e339] [cursor=pointer]:
                    - /url: /?path=/story/📄-pages-application-pages--section-detail-student
                    - img [ref=e341]
                    - text: Section Detail Student
                  - link "Unit Detail" [ref=e344] [cursor=pointer]:
                    - /url: /?path=/story/📄-pages-application-pages--unit-detail
                    - img [ref=e346]
                    - text: Unit Detail
                  - link "Workbook" [ref=e349] [cursor=pointer]:
                    - /url: /?path=/story/📄-pages-application-pages--workbook
                    - img [ref=e351]
                    - text: Workbook
                  - link "Workbook Timed Exercise" [ref=e354] [cursor=pointer]:
                    - /url: /?path=/story/📄-pages-application-pages--workbook-timed-exercise
                    - img [ref=e356]
                    - text: Workbook Timed Exercise
                  - link "Peer Review" [ref=e359] [cursor=pointer]:
                    - /url: /?path=/story/📄-pages-application-pages--peer-review
                    - img [ref=e361]
                    - text: Peer Review
                  - button "Index" [ref=e364] [cursor=pointer]:
                    - generic [ref=e365]:
                      - img [ref=e367]
                      - img [ref=e369]
                    - text: Index
                  - button "Section Settings" [ref=e372] [cursor=pointer]:
                    - generic [ref=e373]:
                      - img [ref=e375]
                      - img [ref=e377]
                    - text: Section Settings
                  - button "🛠️ Admin" [ref=e380] [cursor=pointer]:
                    - generic [ref=e381]:
                      - img [ref=e383]
                      - img [ref=e385]
                    - text: 🛠️ Admin
                  - button "💬 Collaborative Chat" [ref=e388] [cursor=pointer]:
                    - generic [ref=e389]:
                      - img [ref=e391]
                      - img [ref=e393]
                    - text: 💬 Collaborative Chat
                  - button "� Instructor Tools" [ref=e396] [cursor=pointer]:
                    - generic [ref=e397]:
                      - img [ref=e399]
                      - img [ref=e401]
                    - text: � Instructor Tools
                  - button "📬 Notifications" [ref=e404] [cursor=pointer]:
                    - generic [ref=e405]:
                      - img [ref=e407]
                      - img [ref=e409]
                    - text: 📬 Notifications
                  - button "� Gamification" [ref=e412] [cursor=pointer]:
                    - generic [ref=e413]:
                      - img [ref=e415]
                      - img [ref=e417]
                    - text: � Gamification
                  - button "Translation Mode" [ref=e420] [cursor=pointer]:
                    - generic [ref=e421]:
                      - img [ref=e423]
                      - img [ref=e425]
                    - text: Translation Mode
          - generic [ref=e427]:
            - link "Storybook 10.6 Learn what's new in Storybook Dismiss notification" [ref=e429] [cursor=pointer]:
              - /url: /?path=/settings/whats-new
              - img [ref=e431]
              - generic [ref=e433]:
                - generic "Storybook 10.6" [ref=e434]
                - generic [ref=e435]: Learn what's new in Storybook
              - button "Dismiss notification" [ref=e436]:
                - img [ref=e437]
            - region "Component tests" [ref=e439]:
              - generic [ref=e440]:
                - heading "Component tests" [level=2] [ref=e441]
                - generic [ref=e442] [cursor=pointer]:
                  - button "Run tests" [ref=e446]:
                    - img [ref=e448]
                    - text: Run tests
                  - button "Expand testing module" [ref=e452]:
                    - img [ref=e453]
                - generic [ref=e455]:
                  - generic [ref=e458]:
                    - generic [ref=e459]: Visual tests
                    - button "Login required" [ref=e461]
                  - generic [ref=e463]:
                    - generic [ref=e464]:
                      - generic [ref=e465]:
                        - generic [ref=e466]: Run component tests
                        - generic [ref=e467]: Not run
                      - generic [ref=e468]:
                        - switch "Watch mode" [ref=e469] [cursor=pointer]:
                          - img [ref=e470]
                        - button "Start test run" [ref=e473] [cursor=pointer]:
                          - img [ref=e474]
                    - list [ref=e476]:
                      - listitem [ref=e477]:
                        - generic [ref=e478]:
                          - checkbox "Interactions" [checked] [disabled] [ref=e480]
                          - generic [ref=e481]: Interactions
                        - button "Run tests to see results" [disabled] [ref=e482]
                      - listitem [ref=e484]:
                        - generic [ref=e485] [cursor=pointer]:
                          - checkbox "Coverage" [ref=e487]
                          - generic [ref=e488]: Coverage
                        - button "Coverage unavailable, run tests first" [disabled] [ref=e489]
                      - listitem [ref=e491]:
                        - generic [ref=e492] [cursor=pointer]:
                          - checkbox "Accessibility" [ref=e494]
                          - generic [ref=e495]: Accessibility
                        - button "Run tests to see accessibility results" [disabled] [ref=e496]
      - separator "Sidebar resize handle" [ref=e498]
    - generic [ref=e500]:
      - region "Toolbar" [ref=e501]:
        - heading "Toolbar" [level=2] [ref=e502]
        - toolbar [ref=e503]:
          - generic [ref=e504]:
            - button "Reload story" [ref=e505] [cursor=pointer]:
              - img [ref=e506]
            - switch "Grid visibility" [ref=e508] [cursor=pointer]:
              - img [ref=e509]
            - button "Preview background" [ref=e511] [cursor=pointer]:
              - img [ref=e512]
            - switch "Measure tool" [ref=e515] [cursor=pointer]:
              - img [ref=e516]
            - switch "Outline tool" [ref=e519] [cursor=pointer]:
              - img [ref=e520]
            - button "Viewport size" [ref=e522] [cursor=pointer]:
              - img [ref=e523]
            - button "Vision filter" [ref=e527] [cursor=pointer]:
              - img [ref=e528]
            - button "Translation editing mode Off" [ref=e533] [cursor=pointer]:
              - img [ref=e534]
              - text: "Off"
            - button "Override display language for translations English" [ref=e536] [cursor=pointer]:
              - img [ref=e537]
              - text: English
            - button "Color scheme Light" [ref=e539] [cursor=pointer]:
              - img [ref=e540]
              - text: Light
          - generic [ref=e545]:
            - button "Open in isolation mode" [ref=e546] [cursor=pointer]:
              - img [ref=e547]
            - switch "Change zoom level" [ref=e552] [cursor=pointer]: 100%
            - button "Enter full screen" [ref=e553] [cursor=pointer]:
              - img [ref=e554]
            - button "Open in editor" [ref=e556] [cursor=pointer]:
              - img [ref=e557]
            - button "Share" [ref=e560] [cursor=pointer]
      - main "Main preview area" [ref=e561]:
        - heading "Main preview area" [level=2] [ref=e562]
        - generic [ref=e564]:
          - link "Skip to sidebar" [ref=e565] [cursor=pointer]:
            - /url: "#📄-pages-application-pages--sections"
          - iframe [ref=e569]:
            - generic [ref=f4e5]:
              - generic [ref=f4e7]:
                - generic [ref=f4e8]:
                  - generic [ref=f4e9]: Sections
                  - button "Create New" [ref=f4e11] [cursor=pointer]:
                    - img [ref=f4e12]
                    - text: Create New
                - generic [ref=f4e15]:
                  - generic [ref=f4e16]:
                    - generic [ref=f4e18]: Japanese 101 - Spring 2024
                    - generic [ref=f4e19]: Beginner Japanese language course
                    - generic [ref=f4e20]:
                      - paragraph [ref=f4e21]: "Join Code:"
                      - generic [ref=f4e23]: JPN101SPRING
                  - link "View Section" [ref=f4e25] [cursor=pointer]:
                    - /url: /section/section-jpn-101
                    - img [ref=f4e27]
                    - text: View Section
                - generic [ref=f4e30]:
                  - generic [ref=f4e31]:
                    - generic [ref=f4e33]: Japanese 102 - Advanced
                    - generic [ref=f4e34]: Advanced Japanese with kanji focus
                    - generic [ref=f4e35]:
                      - paragraph [ref=f4e36]: "Join Code:"
                      - generic [ref=f4e38]: JPN102ADV
                  - link "View Section" [ref=f4e40] [cursor=pointer]:
                    - /url: /section/section-jpn-102
                    - img [ref=f4e42]
                    - text: View Section
              - button [ref=f4e44] [cursor=pointer]:
                - img [ref=f4e46]
    - generic [ref=e570]:
      - separator "Addon panel resize handle" [ref=e571]
      - region "Addon panel" [ref=e573]:
        - heading "Addon panel" [level=2] [ref=e574]
        - generic [ref=e575]:
          - generic [ref=e576]:
            - generic [ref=e577]:
              - button "Move addon panel to right" [ref=e578] [cursor=pointer]:
                - img [ref=e579]
              - button "Hide addon panel" [ref=e582] [cursor=pointer]:
                - img [ref=e583]
            - tablist "Available addons" [ref=e588]:
              - tab "Controls" [ref=e589] [cursor=pointer]:
                - generic [ref=e591]: Controls
              - tab "Actions" [ref=e592] [cursor=pointer]:
                - generic [ref=e594]: Actions
              - tab "Interactions" [ref=e595] [cursor=pointer]:
                - generic [ref=e597]: Interactions
              - tab "Visual tests" [ref=e598] [cursor=pointer]
              - tab "Accessibility" [ref=e599] [cursor=pointer]:
                - generic [ref=e601]: Accessibility
              - tab "Translations" [ref=e602] [cursor=pointer]
              - tab "Onboarding" [selected] [ref=e603] [cursor=pointer]
          - tabpanel "Onboarding" [ref=e604]:
            - generic [ref=e606]:
              - generic [ref=e607]:
                - img [ref=e609]
                - generic [ref=e611]:
                  - heading "Instructor Onboarding" [level=6] [ref=e612]
                  - generic [ref=e613]: 0 of 8 tasks completed
                - generic "Learning mode" [ref=e614]:
                  - button "Tutorial" [ref=e615] [cursor=pointer]:
                    - generic [ref=e616]: Tutorial
                  - button "Quiz" [ref=e617] [cursor=pointer]:
                    - generic [ref=e618]: Quiz
                - button "Change role" [ref=e619] [cursor=pointer]: Change
              - progressbar [ref=e620]
              - generic [ref=e622]: 0% Complete · 📖 Tutorial Mode
              - generic [ref=e623]:
                - generic [ref=e624]:
                  - img [ref=e625]
                  - generic [ref=e627]: 0 Completed
                - generic [ref=e628]:
                  - img [ref=e629]
                  - generic [ref=e631]: 8 Remaining
              - list [ref=e632]:
                - generic [ref=e635] [cursor=pointer]:
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
                      - button [ref=e636]:
                        - img [ref=e637]
                - generic [ref=e641] [cursor=pointer]:
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
                      - button [ref=e642]:
                        - img [ref=e643]
                - generic [ref=e647] [cursor=pointer]:
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
                      - button [ref=e648]:
                        - img [ref=e649]
                - generic [ref=e653] [cursor=pointer]:
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
                      - button [ref=e654]:
                        - img [ref=e655]
                - generic [ref=e659] [cursor=pointer]:
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
                      - button [ref=e660]:
                        - img [ref=e661]
                - generic [ref=e665] [cursor=pointer]:
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
                      - button [ref=e666]:
                        - img [ref=e667]
                - generic [ref=e671] [cursor=pointer]:
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
                      - button [ref=e672]:
                        - img [ref=e673]
                - generic [ref=e677] [cursor=pointer]:
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
                      - button [ref=e678]:
                        - img [ref=e679]
              - separator [ref=e681]:
                - generic [ref=e683]: 🎁 Secret Achievements (0/5 discovered)
              - list [ref=e684]:
                - generic [ref=e687]:
                  - generic:
                    - checkbox [disabled]
                    - img
                  - generic [ref=e688]:
                    - heading "🔒 Secret Achievement" [level=6] [ref=e689]
                    - generic [ref=e690]: Discover this achievement through exploration
                - generic [ref=e693]:
                  - generic:
                    - checkbox [disabled]
                    - img
                  - generic [ref=e694]:
                    - heading "🔒 Secret Achievement" [level=6] [ref=e695]
                    - generic [ref=e696]: Discover this achievement through exploration
                - generic [ref=e699]:
                  - generic:
                    - checkbox [disabled]
                    - img
                  - generic [ref=e700]:
                    - heading "🔒 Secret Achievement" [level=6] [ref=e701]
                    - generic [ref=e702]: Discover this achievement through exploration
                - generic [ref=e705]:
                  - generic:
                    - checkbox [disabled]
                    - img
                  - generic [ref=e706]:
                    - heading "🔒 Secret Achievement" [level=6] [ref=e707]
                    - generic [ref=e708]: Discover this achievement through exploration
                - generic [ref=e711]:
                  - generic:
                    - checkbox [disabled]
                    - img
                  - generic [ref=e712]:
                    - heading "🔒 Secret Achievement" [level=6] [ref=e713]
                    - generic [ref=e714]: Discover this achievement through exploration
              - separator [ref=e715]
              - button "Reset Progress" [ref=e717] [cursor=pointer]
```

# Test source

```ts
  83  | /**
  84  |  * Click the persona card in the Onboarding panel.
  85  |  * If a persona is already selected (task list visible), clicks "Change" first
  86  |  * to return to persona selection. Waits until the task list appears before returning.
  87  |  */
  88  | export async function selectPersona(
  89  |   page: Page,
  90  |   persona: Persona,
  91  | ): Promise<void> {
  92  |   const labels: Record<Persona, string> = {
  93  |     instructor: "Instructor",
  94  |     learner: "Learner",
  95  |     translator: "Translator",
  96  |   };
  97  | 
  98  |   // If a persona is already selected, click "Change" to go back to selection
  99  |   const changeBtn = page
  100 |     .locator('[data-testid="onboarding-panel"]')
  101 |     .getByRole("button", { name: "Change" });
  102 |   if (await changeBtn.isVisible({ timeout: 1_000 }).catch(() => false)) {
  103 |     await changeBtn.click();
  104 |     await expect(
  105 |       page.getByText(/Select your role/).first(),
  106 |     ).toBeVisible({ timeout: 5_000 });
  107 |   }
  108 | 
  109 |   // The persona selection shows cards with the label + "Click to start onboarding"
  110 |   const card = page
  111 |     .locator('[class*="MuiCard"]')
  112 |     .filter({ hasText: labels[persona] })
  113 |     .first();
  114 |   await card.scrollIntoViewIfNeeded();
  115 |   await card.click();
  116 | 
  117 |   // Task list replaces the persona selection
  118 |   await expect(page.getByText(/\d+ of \d+ tasks completed/)).toBeVisible({
  119 |     timeout: 8_000,
  120 |   });
  121 | }
  122 | 
  123 | // ─── Task Tour ───────────────────────────────────────────────────────────────
  124 | 
  125 | /**
  126 |  * Walk through the full lifecycle of a single onboarding task:
  127 |  *
  128 |  * 1. Click the task card → SpotlightOverlay opens
  129 |  * 2. Walk through ALL spotlight steps (Start → Next → … → Done)
  130 |  * 3. Navigate to the correct story to find data-tour elements
  131 |  * 4. Click each data-tour element with real Playwright clicks
  132 |  * 5. Return to onboarding panel and verify task completion
  133 |  */
  134 | export async function walkTaskTour(
  135 |   page: Page,
  136 |   task: TaskSpec,
  137 |   persona: Persona,
  138 |   expectedCompleted: number,
  139 | ): Promise<void> {
  140 |   // ── 1. Click the task card ─────────────────────────────────────────────────
  141 |   const taskCard = page
  142 |     .locator('[data-testid="task-item"]')
  143 |     .filter({ hasText: task.title });
  144 | 
  145 |   await taskCard.click();
  146 | 
  147 |   // ── 2. Walk through every spotlight step ───────────────────────────────────
  148 |   await walkAllSpotlightSteps(page);
  149 | 
  150 |   // ── 3. Navigate to the task's story and trigger completion ─────────────────
  151 |   const sequence = task.completionCriteria?.completionSequence;
  152 |   const storyId = task.completionCriteria?.tutorialStoryId;
  153 | 
  154 |   if (sequence && sequence.length > 0) {
  155 |     // Ensure persona is persisted to localStorage before navigating
  156 |     await page.evaluate(
  157 |       ({ persona: p, key }) => {
  158 |         const data = JSON.parse(localStorage.getItem(key) || "{}");
  159 |         if (!data.currentPersona) {
  160 |           data.currentPersona = p;
  161 |           data.currentMode = data.currentMode || "tutorial";
  162 |           data.completedTasks = data.completedTasks || [];
  163 |           localStorage.setItem(key, JSON.stringify(data));
  164 |         }
  165 |       },
  166 |       { persona, key: STORAGE_KEY },
  167 |     );
  168 | 
  169 |     if (storyId) {
  170 |       await page.goto(`/?path=/story/${storyId}`, {
  171 |         waitUntil: "domcontentloaded",
  172 |         timeout: 60_000,
  173 |       });
  174 |       await page.waitForSelector("#storybook-preview-iframe", {
  175 |         timeout: 15_000,
  176 |       });
  177 |       // Wait for story render + task-completion listener init (requestIdleCallback)
  178 |       await expect(
  179 |         page
  180 |           .frameLocator("#storybook-preview-iframe")
  181 |           .locator(`[data-tour="${sequence[0]}"]`)
  182 |           .first(),
> 183 |       ).toBeAttached({ timeout: 15_000 });
      |         ^ Error: expect(locator).toBeAttached() failed
  184 |     }
  185 | 
  186 |     await clickCompletionSequence(page, sequence);
  187 |   }
  188 | 
  189 |   // ── 4. Return to onboarding panel and verify ──────────────────────────────
  190 |   await openOnboardingPanel(page);
  191 | 
  192 |   const updatedTaskCard = page
  193 |     .locator('[data-testid="task-item"]')
  194 |     .filter({ hasText: task.title });
  195 | 
  196 |   await expect(updatedTaskCard.locator(`text=${task.title}`)).toHaveCSS(
  197 |     "text-decoration",
  198 |     /line-through/,
  199 |     { timeout: 10_000 },
  200 |   );
  201 | 
  202 |   await expect(updatedTaskCard.locator('input[type="checkbox"]')).toBeChecked({
  203 |     timeout: 5_000,
  204 |   });
  205 | 
  206 |   await expect(
  207 |     page.getByText(new RegExp(`${expectedCompleted} of \\d+ tasks completed`)),
  208 |   ).toBeVisible({ timeout: 8_000 });
  209 | }
  210 | 
  211 | // ─── Completion Helpers ──────────────────────────────────────────────────────
  212 | 
  213 | /**
  214 |  * Walk through ALL spotlight steps by clicking the primary action button:
  215 |  * "Start" on step 1, "Next" on middle steps, "Done" on the last step.
  216 |  * Verifies each step renders before advancing.
  217 |  */
  218 | async function walkAllSpotlightSteps(page: Page): Promise<void> {
  219 |   const tooltip = page.locator('[data-testid="spotlight-tooltip"]');
  220 |   await expect(tooltip.locator("text=/Step \\d+ of \\d+/")).toBeVisible({
  221 |     timeout: 10_000,
  222 |   });
  223 | 
  224 |   // Extract total step count from "Step 1 of N"
  225 |   const stepText = await tooltip
  226 |     .locator("text=/Step \\d+ of \\d+/")
  227 |     .textContent();
  228 |   const totalSteps = parseInt(stepText?.match(/of (\d+)/)?.[1] ?? "1", 10);
  229 | 
  230 |   for (let step = 1; step <= totalSteps; step++) {
  231 |     // Verify current step indicator
  232 |     await expect(
  233 |       tooltip.getByText(`Step ${step} of ${totalSteps}`),
  234 |     ).toBeVisible({ timeout: 5_000 });
  235 | 
  236 |     // Click the primary button (Start / Next / Done)
  237 |     const primaryBtn = tooltip.locator(
  238 |       'button:has-text("Start"), button:has-text("Next"), button:has-text("Done")',
  239 |     );
  240 |     await expect(primaryBtn).toBeEnabled({ timeout: 10_000 });
  241 |     await primaryBtn.click();
  242 |   }
  243 | 
  244 |   // Spotlight should be dismissed after clicking Done on the last step
  245 |   await expect(tooltip).not.toBeVisible({ timeout: 5_000 });
  246 | }
  247 | 
  248 | /**
  249 |  * Click each data-tour element in the completionSequence inside the preview
  250 |  * iframe using real Playwright clicks (scrolls into view, fires all event phases).
  251 |  */
  252 | async function clickCompletionSequence(
  253 |   page: Page,
  254 |   sequence: string[],
  255 | ): Promise<void> {
  256 |   const preview = page.frameLocator("#storybook-preview-iframe");
  257 | 
  258 |   for (const tourId of sequence) {
  259 |     const target = preview.locator(`[data-tour="${tourId}"]`).first();
  260 |     await expect(target).toBeAttached({ timeout: 15_000 });
  261 |     await target.scrollIntoViewIfNeeded();
  262 |     await target.click();
  263 |   }
  264 | }
  265 | 
  266 | // ─── Mode Switching ──────────────────────────────────────────────────────────
  267 | 
  268 | export type OnboardingMode = "tutorial" | "quiz";
  269 | 
  270 | /**
  271 |  * Switch onboarding mode using the chip buttons in the panel header.
  272 |  * Waits until the mode indicator text confirms the switch.
  273 |  */
  274 | export async function switchMode(
  275 |   page: Page,
  276 |   mode: OnboardingMode,
  277 | ): Promise<void> {
  278 |   const label = mode === "tutorial" ? "Tutorial" : "Quiz";
  279 |   // The chips are MUI Chip elements rendered as clickable spans
  280 |   const chip = page
  281 |     .locator("span")
  282 |     .filter({ hasText: new RegExp(`^${label}$`) })
  283 |     .first();
```