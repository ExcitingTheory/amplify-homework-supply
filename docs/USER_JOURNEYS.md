# User Journeys & Test Selectors

## Complete Test Selector Reference

### `data-testid` Selectors (Production Components)

| Selector | Description | Component |
|----------|-------------|-----------|
| `data-testid="global-chat-button"` | Floating action button to open AI chat | `GlobalChatButton.jsx` |
| `data-testid="global-chat-drawer"` | The sliding drawer that contains the chat sidebar | `GlobalChatDrawer.jsx` |
| `data-testid="chat-close-button"` | Close button inside the chat sidebar header | `ChatSidebar.jsx` |
| `data-testid="chat-messages"` | Container for the chat message list | `ChatSidebar.jsx` |
| `data-testid="chat-input"` | Text input field for typing messages to AI | `ChatSidebar.jsx` |
| `data-testid="chat-send"` | Send button for submitting chat messages | `ChatSidebar.jsx` |
| `data-testid="collaborative-chat-button"` | Button to open collaborative/peer chat | `Chat/ChatPanel.tsx` |
| `data-testid="navigation-prompt"` | Navigation suggestion prompt card in chat | `ChatSidebar/NavigationPrompt.jsx` |
| `data-testid="editor-chat-tab"` | Tab for switching to chat panel in the editor | `Editor3/components/TabsVerticalRight.jsx` |
| `data-testid="block-suggestion-hint"` | AI block suggestion hint overlay in editor | `Editor3/plugins/BlockSuggestionPlugin.jsx` |
| `data-testid="waveform-overlay"` | Audio waveform visualizer overlay | `Editor3/components/AudioWaveformPlayer.jsx` |
| `data-testid={testId}` (dynamic) | Answer text input (testId passed as prop) | `Editor3/components/PlainTextAnswerInput.jsx` |
| `data-testid="drag-box"` | Draggable vocabulary card in matching exercise | `MeaningAssociationExercise/DragBox.jsx` |
| `data-testid="result-card"` | Results card after completing matching exercise | `MeaningAssociationExercise/index.jsx` |
| `data-testid="result-drop-learn"` | Drop zone results area (learning mode) | `MeaningAssociationExercise/index.jsx` |
| `data-testid="drop-target-learn"` | Drop target zone during learning mode | `MeaningAssociationExercise/index.jsx` |
| `data-testid="drop-target"` | Drop target zone during quiz mode | `MeaningAssociationExercise/index.jsx` |

### `data-tour` Selectors (Production Components)

| Selector | Description | Component |
|----------|-------------|-----------|
| `data-tour="chat-button"` | Global chat FAB (onboarding target) | `GlobalChatButton.jsx` |
| `data-tour="chat-sidebar"` | Chat sidebar container | `GlobalChatDrawer.jsx` |
| `data-tour="chat-input"` | Chat text input (onboarding target) | `ChatSidebar.jsx` |
| `data-tour="ai-message"` | Individual AI assistant message | `ChatSidebar.jsx` |
| `data-tour="insert-button"` | Content preview insert button in chat | `ChatSidebar/ContentPreview.tsx` |
| `data-tour="help-menu"` | Help dropdown menu | `MainToolbar.jsx` |
| `data-tour="join-study-group-button"` | Button to join a study group/squad | `MainToolbar.jsx` |
| `data-tour="join-section-button"` | Button to join a class section | `MainToolbar.jsx` |
| `data-tour="join-section-dialog"` | Join section dialog container | `MainToolbar.jsx` |
| `data-tour="join-code-input"` | Text input for entering a section join code | `MainToolbar.jsx` |
| `data-tour="editor"` | Main Lexical editor container (instructor) | `Editor3/index.tsx` |
| `data-tour="editor-toolbar"` | Editor formatting toolbar | `Editor3/plugins/ToolBarPlugin.jsx` |
| `data-tour="workbook"` | Main Lexical workbook container (learner) | `Editor3/Workbook.tsx` |
| `data-tour="workbook-content"` | Workbook content wrapper (page-level) | `app/[locale]/workbook/[id]/WorkbookClient.tsx` |
| `data-tour="assignments-tab"` | Assignments panel tab (editor left sidebar) | `Editor3/components/TabsVerticalLeft.jsx` |
| `data-tour="table-of-contents-tab"` | Table of contents panel tab | `Editor3/components/TabsVerticalLeft.jsx` |
| `data-tour="dictionary-tab"` | Dictionary/vocabulary panel tab | `Editor3/components/TabsVerticalLeft.jsx` |
| `data-tour="questions-tab"` | Questions panel tab | `Editor3/components/TabsVerticalLeft.jsx` |
| `data-tour="files-tab"` | File manager panel tab | `Editor3/components/TabsVerticalLeft.jsx` |
| `data-tour="configuration-tab"` | Unit configuration panel tab | `Editor3/components/TabsVerticalLeft.jsx` |
| `data-tour="grades-tab"` | Grades panel tab (editor right sidebar) | `Editor3/components/TabsVerticalRight.jsx` |
| `data-tour="assignment-settings"` | Assignment configuration panel | `Editor3/components/AssignmentConfiguration.jsx` |
| `data-tour="due-date-picker"` | Due date input in assignment dialog | `Editor3/components/AssignmentConfiguration.jsx`, `SectionAssigner.jsx` |
| `data-tour="unit-selector"` | Section/unit dropdown selector | `Editor3/components/AssignmentConfiguration.jsx`, `SectionAssigner.jsx` |
| `data-tour="create-assignment-button"` | Submit button to assign a unit | `SectionAssigner.jsx` |
| `data-tour="grades-list"` | Grade history list container | `Editor3/components/GradeHistory.jsx` |
| `data-tour="correct-answers"` | Correct answers ordered list | `Editor3/components/GradeHistory.jsx` |
| `data-tour="grade-detail"` | Individual grade detail entry | `Editor3/components/GradeHistory.jsx` |
| `data-tour="quiz-block"` | Quiz/multiple-choice block container | `Editor3/components/QuizComponent.jsx`, `QuizEditor.jsx` |
| `data-tour="quiz-answers"` | Quiz answer choices list | `Editor3/components/QuizComponent.jsx` |
| `data-tour="correct-checkbox"` | Checkbox to mark correct answer (editor) | `SortableAnswers.jsx` |
| `data-tour="results"` | Unit completion results screen | `Editor3/plugins/UnitCompletedPlugin.jsx` |
| `data-tour="dictionary"` | Dictionary editor container | `DictionaryEditor2.jsx` |
| `data-tour="add-word-button"` | Button to add a new vocabulary word | `DictionaryEditor2.jsx` |
| `data-tour="word-form"` | New word entry form | `DictionaryEditor2.jsx` |
| `data-tour="audio-upload"` | Audio upload area in dictionary | `DictionaryEditor2.jsx` |
| `data-tour="word-card"` | Individual vocabulary word card (review) | `VocabularyReview2.tsx` |
| `data-tour="play-audio"` | Play audio button on vocab card | `VocabularyReview2.tsx` |
| `data-tour="dashboard"` | Root dashboard container | `app/[locale]/page.jsx` |
| `data-tour="dashboard-hero"` | Hero card (XP total, level, streak, progress bar) | `app/[locale]/page.jsx` |
| `data-tour="dashboard-ai-memory"` | AI Memory panel (learning profile, strengths) | `app/[locale]/page.jsx` |
| `data-tour="dashboard-pending-assignments"` | Pending assignments section | `app/[locale]/page.jsx` |
| `data-tour="assignment-card-pending"` | Individual pending assignment card | `app/[locale]/page.jsx` |
| `data-tour="start-workbook-button"` | "Start Workbook" button on pending card | `app/[locale]/page.jsx` |
| `data-tour="dashboard-completed-assignments"` | Completed assignments section | `app/[locale]/page.jsx` |
| `data-tour="assignment-card-completed"` | Individual completed assignment card | `app/[locale]/page.jsx` |
| `data-tour="dashboard-enrolled-sections"` | Enrolled sections grid | `app/[locale]/page.jsx` |
| `data-tour="enrolled-section-card"` | Individual enrolled section card | `app/[locale]/page.jsx` |
| `data-tour="dashboard-my-sections"` | Instructor's "My Sections" area | `app/[locale]/page.jsx` |
| `data-tour="dashboard-gamification"` | Gamification widgets section | `app/[locale]/page.jsx` |
| `data-tour="dashboard-empty-state"` | Empty state when no enrollments | `app/[locale]/page.jsx` |
| `data-tour="my-grades"` | Grades section on the home dashboard (legacy) | `app/[locale]/page.jsx` |
| `data-tour="sections-page"` | Sections list page container | `app/[locale]/sections/page.jsx` |
| `data-tour="section-form"` | Create section form | `app/[locale]/sections/page.jsx` |
| `data-tour="create-section-button"` | Submit button for creating a section | `app/[locale]/sections/page.jsx` |
| `data-tour="section-card"` | Individual section card | `app/[locale]/sections/page.jsx`, `section/[id]/page.jsx` |
| `data-tour="join-code"` | Section join code display | `app/[locale]/sections/page.jsx`, `section/[id]/page.jsx` |
| `data-tour="units-page"` | Units list page container | `app/[locale]/units/page.jsx` |
| `data-tour="create-unit-button"` | Button to create a new unit | `app/[locale]/units/page.jsx` |
| `data-tour="units-list"` | Unit cards grid/list container | `app/[locale]/units/page.jsx` |
| `data-tour="assignments-section"` | Assignments area in section detail | `app/[locale]/section/[id]/page.jsx` |
| `data-tour="assignment-card"` | Individual assignment card | `app/[locale]/section/[id]/page.jsx` |
| `data-tour="view-workbook-button"` | Button to open a workbook from assignment | `app/[locale]/section/[id]/page.jsx` |

### `id` Selectors

| Selector | Description | Component |
|----------|-------------|-----------|
| `#settings-button` | Settings gear icon button | `MainToolbar.jsx` |
| `#settings-menu` | Settings dropdown menu | `MainToolbar.jsx` |
| `#help-button` | Help question mark icon button | `MainToolbar.jsx` |
| `#help-menu` | Help dropdown menu | `MainToolbar.jsx` |
| `#user-button` | User avatar/profile button | `MainToolbar.jsx` |
| `#user-menu` | User dropdown menu (logout, profile) | `MainToolbar.jsx` |
| `#code` | Join code text input field | `MainToolbar.jsx` |
| `#section-select-helper` | Section dropdown in assigner | `SectionAssigner.jsx` |
| `#datetime-local` | Due date/time picker input | `SectionAssigner.jsx` |
| `#file-upload-input` | Hidden file upload input | `Editor3/components/FileManager2.jsx` |
| `#import-json-input` | JSON import file input (Recording Studio) | `RecordingStudio3.jsx` |

### `aria-label` Selectors (Key Interactive Elements)

| aria-label Value | Description | Component |
|------------------|-------------|-----------|
| `t("common.settings")` → "Settings" | Settings button | `MainToolbar.jsx` |
| `t("common.help")` → "Help" | Help button | `MainToolbar.jsx` |
| `t("navigation.profile")` → "Profile" | Profile/user button | `MainToolbar.jsx` |
| `"Notifications"` | Notifications bell button | `MainToolbar.jsx` |
| `t("darkMode.light")` → "Light" | Light theme toggle | `MainToolbar.jsx` |
| `t("darkMode.system")` → "System" | System theme toggle | `MainToolbar.jsx` |
| `t("darkMode.dark")` → "Dark" | Dark theme toggle | `MainToolbar.jsx` |
| `"collapse units"` / `"expand units"` | Unit list expand/collapse | `MainToolbar.jsx` |
| `t("mainToolbar.joinStudyGroup")` | Join study group button | `MainToolbar.jsx` |
| `t("mainToolbar.addToSection.title")` | Join section button | `MainToolbar.jsx` |
| `t("chat.openAssistant")` | Open AI chat FAB | `GlobalChatButton.jsx` |
| `t("chatSidebar.close")` | Close chat button | `ChatSidebar.jsx` |
| `t("actions.send")` | Send chat message button | `ChatSidebar.jsx` |
| `t("dictionaryEditor.newWordButton")` | Add word button | `DictionaryEditor2.jsx` |
| `t("dictionaryEditor.actionsButton")` | Dictionary actions menu | `DictionaryEditor2.jsx` |
| `t("actions.delete")` | Delete item button | `QuestionBlock.jsx`, `SortableAnswers.jsx` |
| `t("actions.edit")` | Edit button | `Editor3/index.tsx` |
| `t("fileManager2.toolbar.uploadTooltip")` | File upload button | `Editor3/components/FileManager2.jsx` |
| `t("fileManager2.fileDetails.downloadTooltip")` | File download button | `Editor3/components/FileManager2.jsx` |
| `t("fileManager2.fileDetails.deleteTooltip")` | File delete button | `Editor3/components/FileManager2.jsx` |
| `t("common.playAudio")` | Play audio button (exercises) | `MeaningAssociationExercise/index.jsx` |
| `t("recordingStudio3.play")` / `t("recordingStudio3.stop")` | Play/stop recording | `RecordingStudio3/HorizontalTimeline.tsx` |
| `"Recording cleanup strength"` | Noise reduction slider | `RecordingStudio3/RecordingSettings.jsx` |
| `t("screenplayEditor.send")` | Send screenplay prompt | `RecordingStudio3/ScreenplayEditor.jsx` |
| `t("navigation.workbook")` | Workbook container | `Editor3/Workbook.tsx` |
| `"Insert block"` | Block inserter button (mini editor) | `MiniEditor/BlockInserterPlugin.tsx` |
| `"Send message"` | Send collaborative chat message | `CollaborativeChat/MessageInput.tsx` |
| `"Create topic"` | Create new topic button | `CollaborativeChat/TopicList.tsx` |
| `"Delete post"` | Delete squad post button | `Gamification/SquadPostFeed.tsx` |
| `"Grade override"` | Grade override input field | `InlineGradeCell.tsx` |
| `t("peerReview.helpful")` | Mark peer review as helpful | `PeerReview/PeerReviewFeedbackPrompt.tsx` |
| `t("peerReview.notHelpful")` | Mark peer review as not helpful | `PeerReview/PeerReviewFeedbackPrompt.tsx` |
| `t("practiceDrill.dialog.close")` | Close practice drill dialog | `PracticeDrill/PracticeDrillDialog.tsx` |
| `t("workbook.invite.shareTooltip")` | Share workbook button | `Workbook/WorkbookInviteShare.tsx` |
| `t("workbook.invite.copy")` | Copy workbook invite link | `Workbook/WorkbookInviteShare.tsx` |
| `t("leaderboard.xpMode")` → "XP" | Leaderboard XP mode toggle | `app/[locale]/leaderboard/LiveLeaderboard.tsx` |
| `t("leaderboard.completionMode")` → "Completion" | Leaderboard completion mode | `app/[locale]/leaderboard/LiveLeaderboard.tsx` |
| `t("leaderboard.squadsMode")` → "Squads" | Leaderboard squads mode | `app/[locale]/leaderboard/LiveLeaderboard.tsx` |
| `t("sectionDetail.students")` | Student roster table | `app/[locale]/section/[id]/page.jsx` |
| `t("sectionDetail.gradebook")` | Gradebook table | `app/[locale]/section/[id]/page.jsx` |
| `t("sectionDetail.assignments")` | Assignments table | `app/[locale]/section/[id]/page.jsx` |

---

## User Journeys

> **Architecture**: All E2E journey tests live in `test/e2e/journeys/` and are **self-contained** — each test creates its own state (units, sections, assignments) rather than relying on seed data. Tests use `test.describe.serial()` where earlier tests create state that later tests consume.

### Journey 1: Learner — Complete Homework via Dashboard

**Spec**: `journey-01-learner-homework.spec.ts`  
**Persona**: A student receiving and completing an assignment through the dashboard.

**Flow** (creates own state):
1. **Instructor creates unit with quiz** → `[data-tour="create-unit-button"]` → insert quiz via toolbar menu → `[data-tour="quiz-block"]` appears
2. **Instructor creates section + assigns** → `[data-tour="section-form"]` → captures join code from `[data-tour="join-code"]` → opens `[data-tour="assignments-tab"]` → `[data-tour="assignment-settings"]`
3. **Student joins section** → `[data-tour="join-section-button"]` → `[data-tour="join-section-dialog"]` → enters code in `[data-tour="join-code-input"]`
4. **Dashboard shows hero card** → Verifies XP total (`/\d+\s*XP total/`), level chip (`/Lv\.\s*\d+/`), user heading
5. **Dashboard shows pending assignment** → `[data-tour="dashboard-pending-assignments"]` → "Start Workbook" link visible with `/workbook/` href
6. **Student opens workbook, completes quiz** → `[data-tour="workbook"]` + `[data-tour="quiz-block"]` → clicks all answer checkboxes
7. **Dashboard shows completed assignment** → Accuracy chip (`/\d+%/`), "Review" link, "Practice from mistakes" button

**What this tests**: Full assignment lifecycle — unit creation, section creation, assignment binding, section enrollment, dashboard pending/completed states, workbook rendering, quiz interaction, grade recording, post-completion dashboard UI.

---

### Journey 2: Learner — Gamification Dashboard Features

**Spec**: `journey-02-learner-gamification.spec.ts`  
**Persona**: A returning student engaging with gamification widgets on the dashboard.

**Flow** (creates own state):
1. **Instructor creates unit with quiz** → same pattern as Journey 1
2. **Student completes workbook** → answers all quiz checkboxes to generate XP
3. **Dashboard hero card** → XP total, level chip (`/Lv\.\s*\d+/`), `[role="progressbar"]` for level progress
4. **Dashboard stat pills** → "Assignments" text + numeric stat values
5. **Enrolled sections** → Completion ratio (`/\d+\/\d+\s*assignments/`), "View Class" link with `/section/` href
6. **Practice button** → Opens `[role="dialog"]` with "Practice" title + close button
7. **Leaderboard** → `/leaderboard` → table with `tbody tr` rows containing numeric scores
8. **XP History** → `/xp-history` → numeric amounts + XP-related terminology
9. **Squads** → `/squads` → squad/team/join content or card UI

**What this tests**: Gamification data pipeline (XP earning → display), dashboard hero widget, stat aggregation, section enrollment stats, practice drill dialog, leaderboard ranking, XP event logging.

---

### Journey 3: Instructor — Create Unit & Build Content

**Spec**: `journey-03-instructor-create-unit.spec.ts`  
**Persona**: A teacher creating educational content with the Lexical editor.

**Flow** (creates own state):
1. **Create unit** → `[data-tour="create-unit-button"]` → URL becomes `/unit/{uuid}` (36 chars) → `[data-tour="editor"]` + `[data-lexical-editor="true"]`
2. **Type content + reload** → Type unique text → wait 4s auto-save → reload → verify text persists
3. **Insert quiz block** → `button[aria-controls="insert-node-menu"]` → `ul[role="menu"]` → quiz item → `[data-tour="quiz-block"]` with editable inputs
4. **Dictionary tab** → `[data-tour="dictionary-tab"]` → `[data-tour="add-word-button"]` → `[data-tour="word-form"]` opens
5. **Files tab** → `[data-tour="files-tab"]` → `input[type="file"]` or dropzone visible
6. **Assignments tab** → `[data-tour="assignments-tab"]` → `[data-tour="assignment-settings"]` or `[data-tour="create-assignment-button"]` + `[data-tour="unit-selector"]`

**What this tests**: Unit CRUD, Lexical editor initialization and auto-save to DynamoDB, quiz block insertion, dictionary vocabulary management, file upload UI, assignment configuration panel.

---

### Journey 4: Instructor — Grade Student Work

**Spec**: `journey-04-instructor-grading.spec.ts`  
**Persona**: A teacher verifying grades appear after a student completes homework.

**Flow** (creates own state):
1. **Instructor creates unit with quiz** → same creation pattern
2. **Instructor creates section** → `[data-tour="section-form"]` → captures join code + section URL
3. **Student joins + completes** → joins via code → opens `/workbook/{id}` → answers all quiz checkboxes
4. **Instructor views gradebook** → navigates to section URL → `[data-tour="section-card"]` → `table` with `tbody tr` rows containing data
5. **Instructor views grades tab** → `/unit/{id}` → `[data-tour="grades-tab"]` → `[data-tour="grades-list"]` or grade/submission text visible

**What this tests**: Full grading pipeline — unit creation, assignment, student completion, grade record creation, gradebook table rendering, grade history in editor.

---

### Journey 5: Instructor — Create & Manage Sections

**Spec**: `journey-05-instructor-sections.spec.ts`  
**Persona**: A teacher creating and configuring class sections.

**Flow** (creates own state):
1. **Create section** → `[data-tour="sections-page"]` → `[data-tour="create-section-button"]` → `[data-tour="section-form"]` → submit → section appears with `[data-tour="join-code"]` (≥4 chars)
2. **Section detail** → navigate into section → `[data-tour="section-card"]` → `[data-tour="join-code"]` matches → `table` with `th` headers
3. **AI settings** → `/section/[id]/settings/ai` → heading + interactive controls (`input, select, [role="switch"]`)
4. **Gamification settings** → `/section/[id]/settings/gamification` → heading + interactive controls (`[role="slider"], button`)

**What this tests**: Section CRUD, join code auto-generation, section detail rendering, roster table structure, AI and gamification sub-route settings pages.

---

### Journey 6: Learner — Peer Review, Notifications & AI Memory

**Spec**: `journey-06-learner-peer-review.spec.ts`  
**Persona**: A student accessing peer review and AI features after completing homework.

**Flow** (creates own state):
1. **Instructor creates unit** → standard creation pattern
2. **Student completes workbook** → answers quiz to generate a completed grade
3. **Dashboard peer review button** → "Open for Peer Review" button visible on completed assignment card
4. **Peer review dialog** → clicking opens `[role="dialog"]` with room creation or join code
5. **AI Memory panel** → `[data-tour="dashboard-ai-memory"]` → strengths/focus areas text or learning profile content
6. **Notification bell** → `aria-label="Notifications"` button → opens panel/popover or navigates
7. **Notifications page** → `/notifications` → notification/assignment/review content visible

**What this tests**: Post-completion social features (peer review room creation), AI memory/learning profile on dashboard, notification system functionality.

---

### Journey 7: Instructor — File & Question Management

**Spec**: `journey-07-instructor-recording.spec.ts`  
**Persona**: An instructor managing files and vocabulary for a unit.

**Flow** (creates own state):
1. **Create unit** → `[data-tour="create-unit-button"]` → type content → auto-save
2. **Files tab upload** → `[data-tour="files-tab"]` → `input[type="file"]` → upload a test `.txt` file via `setInputFiles()` → verify file name or upload progress appears
3. **Questions tab** → `[data-tour="questions-tab"]` → Add/Create/New button or existing question list visible
4. **Dictionary tab add word** → `[data-tour="dictionary-tab"]` → `[data-tour="add-word-button"]` → `[data-tour="word-form"]` → fill input → save → word appears in list

**What this tests**: S3 file upload pipeline (via `input[type="file"]`), file manager UI, question management interface, vocabulary word CRUD with form submission.

---

### Journey 8: Admin — Platform Management & Authorization

**Spec**: `journey-08-admin-management.spec.ts`  
**Persona**: An administrator managing platform content + verifying role boundaries.

**Flow** (creates own state where possible):
1. **Analytics** → `/admin/analytics` → heading + numeric data + `canvas, svg, table` or `%` symbol
2. **Vocabulary management** → `/admin/vocabulary` → vocab/word/dictionary text → Add/Create button → form with inputs
3. **Settings** → `/admin/settings` → heading + form controls
4. **Recycle bin** → `/recycle-bin` → recycle/deleted/trash/restore content
5. **Authorization boundary** → Student logs in → navigates to `/admin/analytics` → must be redirected or see unauthorized/forbidden/404
6. **Authorization boundary** → Student navigates to `/admin/settings` → same blocking behavior

**What this tests**: Admin route access, analytics data rendering, vocabulary management CRUD, platform settings, soft-delete/restore system, **role-based authorization boundaries** (students blocked from admin routes).

---

### Journey 11: Offline Readiness & Sync Recovery

**Spec**: `journey-11-offline-sync.spec.ts`  
**Persona**: A user on unstable connectivity who needs PWA features.

**Flow** (creates own state):
1. **Instructor creates unit** → standard creation pattern for cacheable content
2. **Student visits workbook** → primes service worker cache (5s wait for caching)
3. **Service worker active** → `navigator.serviceWorker.controller` exists + `context.serviceWorkers().length > 0`
4. **Offline fallback** → `context.setOffline(true)` → navigate to `/offline` → heading matches `/offline/i` + "saved work is safe" text + retry/refresh action
5. **Cached resources** → `caches.keys()` has entries + `totalEntries > 5`
6. **Recovery** → `context.setOffline(true)` → wait → `context.setOffline(false)` → navigate to `/` → `#user-button` visible (auth still valid)

**What this tests**: Service worker activation/control, navigation fallback, cache-first behavior, offline UX messaging, reconnection recovery.

---

### Journeys 9 & 10: Not Currently Implemented

Journeys 9 (Vocabulary & Practice) and 10 (Settings & Personalization) spec files have been removed pending redesign. Their coverage is partially handled by:
- Journey 2 (practice drill dialog)
- Journey 3 (dictionary tab vocabulary)
- Journey 7 (file/question management, word creation)
- Journey 6 (AI features)

---

## Dashboard `data-tour` Selectors

| Selector | Description |
|----------|-------------|
| `data-tour="dashboard"` | Root dashboard container |
| `data-tour="dashboard-hero"` | Hero card (XP total, level, streak, progress bar) |
| `data-tour="dashboard-ai-memory"` | AI Memory panel (learning profile, strengths, focus areas) |
| `data-tour="dashboard-pending-assignments"` | Pending assignments section |
| `data-tour="assignment-card-pending"` | Individual pending assignment card |
| `data-tour="start-workbook-button"` | "Start Workbook" PrefetchButton on pending card |
| `data-tour="dashboard-completed-assignments"` | Completed assignments section |
| `data-tour="assignment-card-completed"` | Individual completed assignment card |
| `data-tour="dashboard-enrolled-sections"` | Enrolled sections grid |
| `data-tour="enrolled-section-card"` | Individual enrolled section card |
| `data-tour="dashboard-my-sections"` | Instructor's "My Sections" area |
| `data-tour="dashboard-gamification"` | Gamification widgets section |
| `data-tour="dashboard-empty-state"` | Empty state when no enrollments exist |

---

## Route Coverage Summary

| Route | Roles | Key Journeys |
|-------|-------|--------------|
| `/` | All | 1, 2, 6 |
| `/units` | Admin, Instructor | 3 |
| `/unit/[id]` | Admin, Instructor | 3, 4, 7 |
| `/workbook/[id]` | All | 1, 2, 4, 6, 11 |
| `/sections` | Admin, Instructor | 5 |
| `/section/[id]` | Admin, Instructor | 4, 5 |
| `/section/[id]/settings/ai` | Admin, Instructor | 5 |
| `/section/[id]/settings/gamification` | Admin, Instructor | 5 |
| `/leaderboard` | All | 2 |
| `/squads` | All | 2 |
| `/xp-history` | All | 2 |
| `/notifications` | All | 6 |
| `/offline` | All (service worker fallback) | 11 |
| `/admin/analytics` | Admin | 8 |
| `/admin/vocabulary` | Admin | 8 |
| `/admin/settings` | Admin | 8 |
| `/recycle-bin` | Admin | 8 |

---

## Storybook Coverage Notes

Key stories that validate these journeys in isolation:

- **Editor3/Editor.stories.jsx** — Full editor with toolbar, quiz insertion, block interactions
- **ChatSidebar.stories.jsx** — AI chat streaming with mock messages, tool calls
- **RecordingStudio3.stories.jsx** — Full recording studio with timeline, screenplay
- **DictionaryEditor2.stories.jsx** — Vocabulary CRUD, audio upload
- **MainToolbar.stories.jsx** — Navigation, join section dialog interaction test
- **VocabularyReview2.stories.tsx** — Flashcard and audio review
- **QuestionsReview2.stories.tsx** — Question bank management
- **MeaningAssociationExercise** — DnD matching exercise
- **CampaignProgress.stories.tsx** — Campaign/boss battle UI
- **SkillTreeEditor.stories.tsx** — Skill tree DAG visualization
- **BadgeClaimPanel.stories.tsx** — Badge unlock animation
- **Workbook/Workbook.stories.tsx** — Learner workbook interactions
- **OnboardingExamples.stories.tsx** — Onboarding flow walkthrough
- **TranslationMode.stories.tsx** — i18n string overlay/editing system
