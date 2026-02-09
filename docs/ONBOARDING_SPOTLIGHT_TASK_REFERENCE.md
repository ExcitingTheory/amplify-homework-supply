# Complete Onboarding Task Reference

This document lists every onboarding task across all personas with their spotlight configurations.

## Table of Contents

- [Instructor Tasks (8)](#instructor-tasks)
- [Learner Tasks (7)](#learner-tasks)
- [Developer Tasks (9)](#developer-tasks)
- [Secret Tasks (4)](#secret-tasks)

---

## Instructor Tasks

### 1. Set Up Your First Class
**ID**: `instructor-setup-class`  
**Category**: Getting Started  
**Time**: ~5 minutes  
**Story**: `pages-sections--default`

**Tutorial Steps**:
1. Introduction to class sections
2. Navigate to Sections page → `[data-tour="sections-page"]`
3. Click Create Section button → `[data-tour="create-section-button"]`
4. Fill in form → `[data-tour="section-form"]`
5. Get join code → `[data-tour="join-code"]`
6. Complete

**Quiz Steps**:
1. Challenge: Create a class on your own
2. Verify completion

**data-tour Requirements**:
- `sections-page` - Page container
- `create-section-button` - Create button
- `section-form` - Section creation form
- `join-code` - Join code display

---

### 2. Create Your First Unit
**ID**: `instructor-create-unit`  
**Category**: Content Creation  
**Time**: ~10 minutes  
**Story**: `pages-units--default`

**Tutorial Steps**:
1. Introduction to units
2. Navigate to Units page → `[data-tour="units-page"]`
3. Click Create Unit → `[data-tour="create-unit-button"]`
4. Use the editor → `[data-tour="editor"]`
5. Learn toolbar → `[data-tour="editor-toolbar"]`
6. Save unit → `[data-tour="save-button"]`
7. Complete

**Quiz Steps**:
1. Challenge: Build a unit
2. Verify completion

**data-tour Requirements**:
- `units-page` - Units library page
- `create-unit-button` - Create button
- `editor` - Main editor area
- `editor-toolbar` - Toolbar
- `save-button` - Save button

---

### 3. Add a Quiz Block
**ID**: `instructor-add-quiz`  
**Category**: Content Creation  
**Time**: ~5 minutes  
**Story**: `creating-lessons-editor--default`

**Tutorial Steps**:
1. Introduction to quiz blocks
2. Type "/" in editor → `[data-tour="editor"]`
3. Select quiz block → `[data-tour="quiz-block"]`
4. Add answers → `[data-tour="quiz-answers"]`
5. Mark correct answer → `[data-tour="correct-checkbox"]`
6. Complete

**Quiz Steps**:
1. Challenge: Add quiz with 2+ answers
2. Verify completion

**data-tour Requirements**:
- `editor` - Editor (for typing "/")
- `quiz-block` - Quiz node container
- `quiz-answers` - Answer choices area
- `correct-checkbox` - Correct answer checkbox

---

### 4. Add Vocabulary Words
**ID**: `instructor-create-vocabulary`  
**Category**: Content Management  
**Time**: ~6 minutes

**Tutorial Steps**:
1. Introduction to dictionary
2. Dictionary editor → `[data-tour="dictionary-editor"]`
3. Click Add Word → `[data-tour="add-word-button"]`
4. Fill in word form → `[data-tour="word-form"]`
5. Upload audio → `[data-tour="audio-upload"]`
6. Complete

**Quiz Steps**:
1. Challenge: Add vocabulary entry
2. Verify completion

**data-tour Requirements**:
- `dictionary-editor` - Dictionary page
- `add-word-button` - Add word button
- `word-form` - Word entry form
- `audio-upload` - Audio file input

---

### 5. Assign Work to Students
**ID**: `instructor-create-assignment`  
**Category**: Assignments  
**Time**: ~4 minutes

**Tutorial Steps**:
1. Introduction to assignments
2. Section view → `[data-tour="section-view"]`
3. Create assignment → `[data-tour="create-assignment-button"]`
4. Select unit → `[data-tour="unit-selector"]`
5. Set due date → `[data-tour="due-date-picker"]`
6. Configure settings → `[data-tour="assignment-settings"]`
7. Complete

**Quiz Steps**:
1. Challenge: Create assignment with due date
2. Verify completion

**data-tour Requirements**:
- `section-view` - Section detail page
- `create-assignment-button` - Create assignment button
- `unit-selector` - Unit selection dropdown
- `due-date-picker` - Date/time picker
- `assignment-settings` - Settings panel

---

### 6. View Student Grades
**ID**: `instructor-view-grades`  
**Category**: Assessment  
**Time**: ~4 minutes

**Tutorial Steps**:
1. Introduction to grading
2. Grades tab → `[data-tour="grades-tab"]`
3. Submissions list → `[data-tour="grades-list"]`
4. Grade details → `[data-tour="grade-detail"]`
5. Complete

**Quiz Steps**:
1. Challenge: View grades and submissions
2. Verify completion

**data-tour Requirements**:
- `grades-tab` - Grades tab button
- `grades-list` - List of submissions
- `grade-detail` - Individual grade view

---

### 7. Use AI to Generate Content
**ID**: `instructor-use-ai-assistant`  
**Category**: AI Tools  
**Time**: ~8 minutes

**Tutorial Steps**:
1. Introduction to AI assistant
2. Open chat → `[data-tour="chat-button"]`
3. Chat sidebar → `[data-tour="chat-sidebar"]`
4. View AI response → `[data-tour="ai-message"]`
5. Insert content → `[data-tour="insert-button"]`
6. Complete

**Quiz Steps**:
1. Challenge: Generate content with AI
2. Verify completion

**data-tour Requirements**:
- `chat-button` - Chat toggle button
- `chat-sidebar` - Chat panel
- `ai-message` - AI message container
- `insert-button` - Insert button in messages

---

### 8. Master Editor Shortcuts
**ID**: `instructor-learn-shortcuts`  
**Category**: Skills  
**Time**: ~5 minutes

**Tutorial Steps**:
1. Introduction to shortcuts
2. Help menu → `[data-tour="help-menu"]`
3. Shortcuts page → `[data-tour="shortcuts-page"]`
4. Watch demo → `[data-tour="shortcuts-demo"]`
5. Practice common shortcuts
6. Complete

**Quiz Steps**:
1. Challenge: Learn 5 shortcuts
2. Verify completion

**data-tour Requirements**:
- `help-menu` - Help menu item
- `shortcuts-page` - Shortcuts reference page
- `shortcuts-demo` - Automated demo

---

## Learner Tasks

### 1. Join Your First Class
**ID**: `learner-join-class`  
**Category**: Getting Started  
**Time**: ~2 minutes

**Tutorial Steps**:
1. Introduction to joining classes
2. Sections page → `[data-tour="sections-page"]`
3. Join button → `[data-tour="join-section-button"]`
4. Enter join code → `[data-tour="join-code-input"]`
5. Confirm → `[data-tour="join-confirm"]`
6. Complete

**Quiz Steps**:
1. Challenge: Join a class
2. Verify completion

**data-tour Requirements**:
- `sections-page` - Sections page
- `join-section-button` - Join button
- `join-code-input` - Join code input field
- `join-confirm` - Confirm button

---

### 2. View Your Assignments
**ID**: `learner-view-assignments`  
**Category**: Coursework  
**Time**: ~2 minutes  
**Story**: `pages-section--default`

**Tutorial Steps**:
1. Introduction to assignments
2. Section card → `[data-tour="section-card"]`
3. Assignments tab → `[data-tour="assignments-tab"]`
4. Assignment list → `[data-tour="assignments-list"]`
5. Complete

**Quiz Steps**:
1. Challenge: Find assignments
2. Verify completion

**data-tour Requirements**:
- `section-card` - Section card
- `assignments-tab` - Assignments tab
- `assignments-list` - List of assignments

---

### 3. Complete an Assignment
**ID**: `learner-complete-assignment`  
**Category**: Coursework  
**Time**: ~10 minutes  
**Story**: `pages-application-pages--workbook`

**Tutorial Steps**:
1. Introduction to workbook
2. Workbook page → `[data-tour="workbook"]`
3. Answer question → `[data-tour="quiz-question"]`
4. Submit work → `[data-tour="submit-button"]`
5. View results → `[data-tour="results"]`
6. Complete

**Quiz Steps**:
1. Challenge: Complete and submit work
2. Verify completion

**data-tour Requirements**:
- `workbook` - Workbook page
- `quiz-question` - Question container
- `submit-button` - Submit button
- `results` - Results/score display

---

### 4. Review Your Feedback
**ID**: `learner-review-feedback`  
**Category**: Progress  
**Time**: ~4 minutes

**Tutorial Steps**:
1. Introduction to feedback
2. Grades section → `[data-tour="my-grades"]`
3. Grade card → `[data-tour="grade-card"]`
4. Correct answers → `[data-tour="correct-answers"]`
5. Complete

**Quiz Steps**:
1. Challenge: Review feedback
2. Verify completion

**data-tour Requirements**:
- `my-grades` - Grades/work section
- `grade-card` - Individual grade card
- `correct-answers` - Answer key display

---

### 5. Practice Vocabulary
**ID**: `learner-practice-vocabulary`  
**Category**: Practice  
**Time**: ~5 minutes

**Tutorial Steps**:
1. Introduction to dictionary
2. Dictionary → `[data-tour="dictionary"]`
3. Word card → `[data-tour="word-card"]`
4. Play audio → `[data-tour="play-audio"]`
5. Complete

**Quiz Steps**:
1. Challenge: Study 5 words
2. Verify completion

**data-tour Requirements**:
- `dictionary` - Dictionary page
- `word-card` - Vocabulary card
- `play-audio` - Audio play button

---

### 6. Get Help from AI Assistant
**ID**: `learner-use-chat-help`  
**Category**: Learning Support  
**Time**: ~5 minutes

**Tutorial Steps**:
1. Introduction to AI help
2. Open chat → `[data-tour="chat-button"]`
3. Chat input → `[data-tour="chat-input"]`
4. AI response → `[data-tour="ai-message"]`
5. Complete

**Quiz Steps**:
1. Challenge: Ask AI a question
2. Verify completion

**data-tour Requirements**:
- `chat-button` - Chat toggle
- `chat-input` - Message input
- `ai-message` - AI response

---

### 7. Learn Helpful Shortcuts
**ID**: `learner-learn-shortcuts`  
**Category**: Skills  
**Time**: ~3 minutes

**Tutorial Steps**:
1. Introduction to shortcuts
2. Practice essential shortcuts
3. Complete

**Quiz Steps**:
1. Challenge: Use 3 shortcuts
2. Verify completion

**data-tour Requirements**: None (concept-based)

---

## Developer Tasks

### 1. Explore Component Documentation
**ID**: `developer-explore-components`  
**Category**: Onboarding  
**Time**: ~10 minutes

**Tutorial Steps**:
1. Introduction to component library
2. Storybook sidebar → `[data-tour="storybook-sidebar"]`
3. Technical overview → `[data-tour="tech-overview"]`
4. Docs tab → `[data-tour="docs-tab"]`
5. Canvas tab → `[data-tour="canvas-tab"]`
6. Complete

**Quiz Steps**:
1. Challenge: Browse 5 components
2. Verify completion

**data-tour Requirements**:
- `storybook-sidebar` - Sidebar navigation
- `tech-overview` - Technical overview page
- `docs-tab` - Docs tab button  
- `canvas-tab` - Canvas tab button

---

### 2. Understand the Editor System
**ID**: `developer-understand-editor`  
**Category**: Architecture  
**Time**: ~15 minutes

**Tutorial Steps**:
1. Introduction to editor
2. Editor stories → `[data-tour="editor-stories"]`
3. Custom nodes explanation
4. Plugins explanation
5. Complete

**Quiz Steps**:
1. Challenge: Study editor docs
2. Verify completion

**data-tour Requirements**:
- `editor-stories` - Editor stories section

---

### 3. Learn DataStore Patterns
**ID**: `developer-explore-datastore`  
**Category**: Architecture  
**Time**: ~15 minutes

**Tutorial Steps**:
1. Introduction to DataStore
2. Key documentation
3. Important patterns
4. Complete

**Quiz Steps**:
1. Challenge: Study DataStore docs
2. Verify completion

**data-tour Requirements**: None (documentation-based)

---

### 4. Review AI Integration
**ID**: `developer-understand-ai-integration`  
**Category**: AI Features  
**Time**: ~15 minutes

**Tutorial Steps**:
1. Introduction to AI integration
2. Key files to study
3. Core concepts
4. Complete

**Quiz Steps**:
1. Challenge: Study AI docs
2. Verify completion

**data-tour Requirements**: None (documentation-based)

---

### 5. Set Up Development Environment
**ID**: `developer-setup-dev-environment`  
**Category**: Onboarding  
**Time**: ~15 minutes

**Tutorial Steps**:
1. Introduction to setup
2. Clone repository
3. Install dependencies
4. Configure Amplify
5. Start dev servers
6. Complete

**Quiz Steps**:
1. Challenge: Get project running
2. Verify completion

**data-tour Requirements**: None (terminal-based)

---

### 6. Explore File Structure
**ID**: `developer-explore-file-structure`  
**Category**: Codebase  
**Time**: ~10 minutes

**Tutorial Steps**:
1. Introduction to structure
2. Key directories
3. Naming conventions
4. Complete

**Quiz Steps**:
1. Challenge: Navigate codebase
2. Verify completion

**data-tour Requirements**: None (file system-based)

---

### 7. Run Tests and Linting
**ID**: `developer-run-tests`  
**Category**: Development  
**Time**: ~10 minutes

**Tutorial Steps**:
1. Introduction to testing
2. Run linter
3. Run unit tests
4. Run E2E tests
5. Complete

**Quiz Steps**:
1. Challenge: Run all tests
2. Verify completion

**data-tour Requirements**: None (terminal-based)

---

### 8. Customize Storybook Setup
**ID**: `developer-customize-storybook`  
**Category**: Development  
**Time**: ~8 minutes

**Tutorial Steps**:
1. Introduction to Storybook config
2. main.ts configuration
3. preview.jsx setup
4. Mocks directory
5. Complete

**Quiz Steps**:
1. Challenge: Study Storybook config
2. Verify completion

**data-tour Requirements**: None (configuration-based)

---

### 9. Learn Keyboard Shortcuts
**ID**: `developer-keyboard-shortcuts-demo`  
**Category**: Learning  
**Time**: ~6 minutes  
**Story**: `📚 Creating Lessons/Editor`

**Tutorial Steps**:
1. Introduction to shortcuts
2. Shortcuts reference → `[data-tour="help-shortcuts"]`
3. Automated demo → `[data-tour="shortcuts-demo"]`
4. Shortcut categories
5. Complete

**Quiz Steps**:
1. Challenge: Watch demo
2. Verify completion

**data-tour Requirements**:
- `help-shortcuts` - Shortcuts help page
- `shortcuts-demo` - Demo story

---

## Secret Tasks

### 1. 👑 Keyboard Master Challenge
**ID**: `secret-keyboard-master`  
**Category**: 🎁 Extra Credit  
**Time**: ~10 minutes

**Tutorial Steps**:
1. Secret challenge unlocked!
2. Interactive training → `[data-tour="interactive-training"]`
3. Earn achievements
4. Complete - Master status achieved!

**Quiz Steps**:
1. Ultimate challenge: Complete all 20 shortcuts
2. Verify master status

**data-tour Requirements**:
- `interactive-training` - Interactive training mode

---

### 2. ⚡ Speed Demon
**ID**: `secret-speed-demon`  
**Category**: 🎁 Extra Credit  
**Time**: ~5 minutes (target)

**Tutorial Steps**:
1. Speed demon challenge!
2. Race against time (5-minute timer)
3. Complete - Speed demon unlocked!

**Quiz Steps**:
1. Speed challenge: Finish under 5 minutes
2. Verify completion time

**data-tour Requirements**: None (uses keyboard training UI)

---

### 3. 🏅 Achievement Hunter
**ID**: `secret-achievement-hunter`  
**Category**: 🎁 Extra Credit  
**Time**: ~7 minutes

**Tutorial Steps**:
1. Achievement hunter challenge!
2. Badge collection list
3. Complete - All achievements unlocked!

**Quiz Steps**:
1. Collect all badges
2. Verify collection

**data-tour Requirements**: None (uses achievement system)

---

### 4. 📢 Shortcut Evangelist
**ID**: `secret-shortcut-evangelist`  
**Category**: 🎁 Extra Credit  
**Time**: ~30 minutes

**Tutorial Steps**:
1. Shortcut evangelist challenge!
2. Share your knowledge
3. Complete - Evangelist achieved!

**Quiz Steps**:
1. Spread the word
2. Verify knowledge shared

**data-tour Requirements**: None (social/teaching activity)

---

## Summary Statistics

| Persona | Total Tasks | Tutorial Time | Quiz Time |
|---------|-------------|---------------|-----------|
| Instructor | 8 | ~47 min | ~24 min |
| Learner | 7 | ~36 min | ~18 min |
| Developer | 9 | ~104 min | ~52 min |
| Secret | 4 | ~52 min | ~26 min |
| **Total** | **28** | **~239 min** | **~120 min** |

## data-tour Coverage Matrix

| Component/Page | Required Attributes | Implementation Status |
|----------------|---------------------|----------------------|
| Sections | `sections-page`, `create-section-button`, `section-form`, `join-code`, `join-section-button`, `join-code-input`, `join-confirm`, `section-card`, `assignments-tab`, `grades-tab` | ⚠️ To Implement |
| Units | `units-page`, `create-unit-button` | ⚠️ To Implement |
| Editor | `editor`, `editor-toolbar`, `save-button`, `quiz-block`, `quiz-answers`, `correct-checkbox` | ⚠️ To Implement |
| Dictionary | `dictionary-editor`, `add-word-button`, `word-form`, `audio-upload`, `dictionary`, `word-card`, `play-audio` | ⚠️ To Implement |
| Chat | `chat-button`, `chat-sidebar`, `ai-message`, `insert-button`, `chat-input` | ⚠️ To Implement |
| Workbook | `workbook`, `quiz-question`, `submit-button`, `results` | ⚠️ To Implement |
| Grades | `grades-tab`, `grades-list`, `grade-detail`, `my-grades`, `grade-card`, `correct-answers` | ⚠️ To Implement |
| Assignments | `section-view`, `create-assignment-button`, `unit-selector`, `due-date-picker`, `assignment-settings`, `assignments-list` | ⚠️ To Implement |
| Help/Shortcuts | `help-menu`, `shortcuts-page`, `shortcuts-demo`, `help-shortcuts` | ⚠️ To Implement |
| Storybook | `storybook-sidebar`, `tech-overview`, `docs-tab`, `canvas-tab`, `editor-stories` | ⚠️ To Implement |
| Interactive Training | `interactive-training` | ⚠️ To Implement |

## Implementation Priority

### Phase 1: Core Instructor Flow (High Priority)
1. Sections page (setup class, view assignments/grades)
2. Units page (create unit)
3. Editor (create content, add quiz blocks)
4. Assignments (create and assign)

### Phase 2: Learner Flow (High Priority)
1. Sections (join class, view assignments)
2. Workbook (complete assignments)
3. Grades (review feedback)

### Phase 3: Enhanced Features (Medium Priority)
1. Dictionary (vocabulary management)
2. Chat/AI (AI assistance)
3. Keyboard shortcuts

### Phase 4: Developer Onboarding (Medium Priority)
1. Storybook navigation
2. Help documentation

### Phase 5: Secret/Gamification (Low Priority)
1. Interactive keyboard training
2. Achievement system

---

## Quick Reference Commands

```bash
# Run Storybook to test onboarding
npm run storybook

# View OnboardingPanel
# Navigate to: Storybook → OnboardingPanel

# Test a specific task
# 1. Select persona (Instructor/Learner/Developer)
# 2. Click on task
# 3. Follow spotlight tour
# 4. Verify highlighting and navigation
# 5. Complete or skip task

# Check task completion
# localStorage key: 'storybook_onboarding_progress'
```

## Related Files

- **Task Definitions**: `.storybook/code/onboarding-tasks.ts`
- **Spotlight Configs**: `.storybook/code/spotlight-configs.ts`
- **OnboardingPanel**: `.storybook/components/OnboardingPanel.tsx`
- **SpotlightOverlay**: `.storybook/components/SpotlightOverlay.tsx`
- **Implementation Guide**: `docs/ONBOARDING_SPOTLIGHT_IMPLEMENTATION.md`
- **Event System**: `.storybook/code/onboarding-events.ts`

---

**Last Updated**: February 6, 2026  
**Version**: 1.0.0
