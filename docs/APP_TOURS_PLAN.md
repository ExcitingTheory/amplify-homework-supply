# App Tours Plan

## Purpose

Expand the application tour system beyond the current ChatSidebar assignment tour so instructors and learners can discover real workflows in the application. Tours should guide users through existing controls, verify meaningful actions, and preview planned capabilities without claiming that unimplemented features already exist.

The app currently exposes ten tours through `src/context/tourContext.tsx`: seven instructor tours and three learner tours. Storybook has a larger onboarding catalog. The app should reuse portable tour steps from shared definitions while excluding Storybook-manager targets.

## Tour Contract

Portable tour steps should use the shared adapter in `src/tours/tourAdapters.ts`:

```ts
{
  id: "create-assignment",
  title: "Create the Assignment",
  description: "Click Assign to save and publish it to your students.",
  targetSelector: '[data-tour="create-assignment-button"]',
  targetFrame: "preview",
  targetIndex: 0,
  tooltipPosition: "bottom",
  interactable: true,
  actions: ["Choose a unit", "Set a due date", "Click Assign"]
}
```

Rules:

- `targetFrame: "manager"` is Storybook-only and must be filtered from app tours.
- `targetFrame: "preview"` or no frame is portable when the selector exists in the app.
- `targetIndex: -1` means the last matching element; non-negative values select the Nth match.
- Interactive steps advance from the qualifying user action or an observed target appearance, not a static Next button.
- Read-only steps may show Next.
- Every navigation step must identify both a Storybook story target and an app route when both environments support the workflow.
- A tour must never claim completion from a tool response alone; it should observe the resulting UI state or record.
- Missing targets must be visible as a recoverable state, not silently treated as success.

## Current Tours

### Instructor

- **Set Up Your First Class**: Create a section, save it, and share the join code.
- **Create Your First Unit**: Create a unit, add editor content, and save it.
- **Add a Quiz Block**: Insert and configure a multiple-choice quiz.
- **Add Vocabulary Words**: Create a dictionary entry with definition and audio.
- **Assign Work to Students**: Select a unit, set a due date, and publish an assignment.
- **Manage Section Assignments**: Use the ChatSidebar to review assignment guidance and submit a follow-up.
- **Use AI to Generate Content**: Ask Sage for content, review the result, and insert it.

### Learner

- **Join Your First Class**: Enter a section join code and confirm enrollment.
- **Complete an Assignment**: Open an assignment, complete content, and submit.
- **Get Help from AI Assistant**: Ask Kai for an explanation or practice help.

## Phase 1: Existing App Features

These tours cover capabilities already present in the application but not currently represented by a dedicated app tour.

### Instructor

1. **Review Student Grades**
   - Navigate to the grades tab.
   - Filter or sort submissions.
   - Open grade details.
   - Review answers and provide feedback.
   - Selectors: `grades-tab`, `grades-list`, `grade-detail`, `correct-answers`.

2. **Build a Complete Lesson**
   - Create a heading hierarchy.
   - Add explanatory paragraphs and media.
   - Insert quiz, answer, and meaning-association blocks.
   - Preview and insert AI-generated content.
   - Selectors: `insert-button`, `quiz-block`, editor block selectors.

3. **Create a Listening Exercise**
   - Open the question bank.
   - Create or select an audio question.
   - Configure custom-answer input and prompt modes.
   - Verify the learner-facing exercise.

4. **Manage Dictionary Audio**
   - Open Dictionary Editor.
   - Add a word, definition, phonetic spelling, and audio.
   - Link the word to a unit.
   - Selectors: `dictionary`, `add-word-button`, `word-form`, `audio-upload`.

5. **Configure Assignment Availability**
   - Select a unit and section.
   - Set due date and availability window.
   - Review late-completion behavior.
   - Selectors: `assignment-settings`, `due-date-picker`, `unit-selector`, `create-assignment-button`.

6. **Find and Link Existing Content**
   - Search for a unit, section, assignment, word, or question.
   - Open the result.
   - Link or insert the result into the current workflow.
   - Verify the resulting record in Search Results.

### Learner

7. **Practice Mistakes**
   - Review completed work.
   - Open the practice-mistakes flow.
   - Complete a generated drill.
   - Review accuracy and next steps.

8. **Review Assignment Completion**
   - Open completion status.
   - Review attempt history and accuracy.
   - Retry or review answers.
   - Request guidance when available.

9. **Use Workbook Learning Modes**
   - Complete a quiz.
   - Use meaning-association Learn, Easy, and Hard modes.
   - Submit an audio or written answer.

## Phase 2: Dashboard and Operations

These tours should accompany the dashboard-to-chat tool backlog documented in `docs/ADMIN_BOT_PLAN.md`.

1. **Understand Section Analytics**
   - View aggregate accuracy, completion, and active-student counts.
   - Open section analytics.
   - Identify trends and follow-up actions.
   - Future tools: `get_aggregate_stats`, `get_section_analytics`.

2. **Find At-Risk Students**
   - Filter learners below an accuracy or completion threshold.
   - Open a student progress summary.
   - Assign targeted practice.
   - Future tools: `get_at_risk_students`, `list_section_students`.

3. **Review and Resolve Flagged Grades**
   - Open the needs-attention queue.
   - Inspect a grade detail.
   - Flag, clear, or resolve the item with a reason.
   - Future tools: `get_grade`, `update_grade_moderation_status`.

4. **Reschedule Assignment Work**
   - Search for an assignment.
   - Review its section and unit links.
   - Update the due date and notify learners.
   - Verify the changed assignment in Search Results.
   - Future tool: `update_assignment_due_date`.

5. **Export Section Grades**
   - Select a section and date range.
   - Choose CSV or XLSX.
   - Confirm included details.
   - Download the generated report.
   - Future tool: `export_section_grades`.

6. **Resolve Draft Unit Warnings**
   - Open the dashboard warning.
   - Identify incomplete or draft units.
   - Navigate to the unit editor and resolve the issue.
   - Future tool: `get_draft_unit_issues`.

## Phase 3: Planned Product Features

These tours should be added only as the underlying feature reaches a usable Storybook or application state.

### Assignment and Scheduling

- **Timing Patterns**: Choose a saved timing pattern, preview availability, and apply it to an assignment.
- **Late Submission Review**: Find pending late submissions, keep or drop them, and verify grade aggregation.
- **Direct-to-Student Assignment**: Select a learner within a section and confirm the targeted assignment.
- **Bulk Assignment Copy**: Copy an assignment or cadence to multiple sections with a preview and confirmation.

Source planning: `docs/ASSIGNMENT_MANAGEMENT_PLAN.md`.

### Content and AI

- **AI Content Review**: Search source material, generate content, review an editable block, and insert it.
- **Record Verification**: Search before creation, create only when needed, search by returned ID, and display the created record.
- **Document Analysis**: Upload a document, monitor extraction and analysis status, review generated vocabulary, and cancel or retry analysis.
- **Collaborative Editing**: Join a shared editing session, observe collaborator presence, and resolve a synchronized change.

### Learner Experience

- **Offline Assignment Work**: Enter offline mode, complete available work, inspect queued changes, and recover after reconnecting.
- **Timed Exercise**: Start, pause/resume, complete, and review a timed attempt.
- **Request Guidance**: Ask for guidance, receive a hint, and return to the exercise without exposing the answer.
- **Practice Plan**: Use progress data to start an adaptive drill and review mistakes.

### Gamification and Community

- **Skill Tree Progress**: Open a skill tree, inspect progress, and connect a completed unit to a skill.
- **XP and Badge Progress**: Review XP, streaks, and badge progress from the learner dashboard.
- **Section Gamification Settings**: Review or copy section gamification settings with confirmation.
- **Peer Review**: Open a peer-review task, submit feedback, and inspect completion state.

## Mock and Story Requirements

Every tour story should include:

- The actual page or a clearly labeled page-context surface, not an unrelated fake page.
- Representative records for every selector target.
- Search results for linked units, sections, assignments, files, words, and questions.
- Create workflows in the order `search -> create/update -> search again -> display result`.
- A visible success state that proves the action happened.
- A Storybook play test for the first target, an interaction step, and completion.
- A tour-specific failure state for missing records, unavailable pages, and rejected operations.

## Rollout Order

1. Add shared step normalization and host navigation metadata.
2. Complete Phase 1 instructor and learner tours using existing selectors.
3. Add dashboard analytics, at-risk, moderation, and assignment-rescheduling mocks.
4. Add tools and tours together for Phase 2 workflows.
5. Add planned-feature tours only after the feature has a stable interactive implementation.
6. Audit every tour for manager-frame leakage, missing targets, static advancement controls, and inaccessible controls.
