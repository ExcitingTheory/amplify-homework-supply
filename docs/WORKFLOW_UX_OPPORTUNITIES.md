# Workflow UX Opportunities

Date: 2026-09-05

## Purpose

This document reviews the core instructor and learner workflows with a specific lens: where can Homework Supply reduce clicks, route changes, waiting, or repeated context rebuilding for the fundamental jobs users come here to do?

Primary jobs reviewed:

- Instructor: create learning content, publish it, assign it to sections, monitor completion, and guide review/discussion.
- Learner: find the next assignment, complete it, review results, request help, participate in peer review, and join class discussion.

The first research pass used the Playwright E2E journeys and collaboration specs as the map of real user paths, then traced those paths into the app routes and components.

## Evidence Reviewed

Playwright workflow anchors:

- `test/e2e-collaboration/assignment-workflow.spec.ts`: instructor creates content, publishes, creates section, assigns, learner joins section, opens workbook.
- `test/e2e-collaboration/grading-workflow.spec.ts`: learner completes quiz, instructor navigates to section gradebook.
- `test/e2e-collaboration/peer-review-room.spec.ts`: learner completes workbook, opens peer review, second learner joins by room code.
- `test/e2e-collaboration/collaborative-chat.spec.ts`: learners join a section, open chat, create a topic, exchange messages.
- `test/e2e/journeys/journey-01-learner-homework.spec.ts`: dashboard-driven learner homework flow.
- `test/e2e/journeys/journey-03-instructor-create-unit.spec.ts`: unit authoring, dictionary, files, and assignments tab.
- `test/e2e/journeys/journey-04-instructor-grading.spec.ts`: instructor grade review from section detail.
- `test/e2e/journeys/journey-06-learner-peer-review.spec.ts`: post-completion peer review, guidance, memory, notifications.

Implementation surfaces traced:

- `app/[locale]/units/UnitsClient.jsx`: unit list and create-unit entry point.
- `app/[locale]/unit/[id]/page.tsx`: editor route with SSR preview fallback.
- `src/components/Editor3/components/AssignmentConfiguration.jsx`: assignment creation from the editor side panel.
- `src/components/SectionAssigner.jsx`: older assignment dialog surface.
- `app/[locale]/sections/SectionsClient.jsx`: section list and create-section dialog.
- `app/[locale]/section/[id]/SectionDetailClient.jsx`: section detail, workbook links, gradebook, collaboration rooms.
- `app/[locale]/DashboardClient.jsx`: learner dashboard aggregation and next-assignment actions.
- `src/components/Dashboard/SectionPanel.tsx`: learner section accordion, Up Next, completed work, section link.
- `src/components/Dashboard/AssignmentCard.tsx`: Start Workbook, Practice, Open Peer Review, Request Guidance actions.
- `src/components/PeerReview/OpenPeerReviewButton.tsx`: post-completion room creation dialog.
- `src/components/PeerReview/JoinPeerReviewDialog.tsx`: code/invitation join dialog.
- `app/[locale]/review/[id]/PeerReviewClient.jsx`: split-pane workbook plus review chat.
- `src/components/Chat/ChatPanel.tsx`: floating discussion drawer with topic list and thread composer.

A quick Playwright browser check reached the local app at `https://localhost:3000`, but the shared snapshot only exposed the shell/alert state, likely before authenticated content was available. The recommendations below are therefore grounded primarily in the Playwright specs and source code.

## Current Workflow Shape

### Instructor: Create and Publish an Assignment

The tested happy path is:

1. Open `/units`.
2. Click Create Unit.
3. Wait for `/unit/:id` editor.
4. Add content in Lexical.
5. Open Insert menu.
6. Choose a quiz block.
7. Configure quiz answers.
8. Change status to Published in the editor toolbar.
9. Save.
10. Open `/sections`.
11. Create a section in a dialog if needed.
12. Copy or capture the join code.
13. Return to `/unit/:id`.
14. Open the Assignments tab.
15. Pick due date.
16. Pick one or more sections.
17. Wait for assignment auto-save.

The app already has most primitives needed for a fast authoring workflow: autosave, a publish status selector, multi-section assignment selection, a section context, and a section dashboard. The friction comes from the workflow being distributed across list pages, editor tabs, dialogs, and route transitions.

### Instructor: Monitor and Act on Student Work

The tested grading path is:

1. Open `/sections`.
2. Find the section card.
3. Open `/section/:id`.
4. Scroll or use drawer anchors to gradebook/completion/collaboration rooms.
5. Open a grade drawer or join collaboration room.

This route is powerful, but it asks instructors to inspect a section detail page to discover what needs attention. The gradebook and collaboration rooms are present after navigation, while the higher-level instructor dashboard appears on `/sections` and likely summarizes only after the user is already on the section management page.

### Learner: Complete Assignments

The dashboard path is stronger:

1. Open `/`.
2. See a hero/Up Next area.
3. Click Start Workbook or Start practice.
4. Load `/workbook/:id`.
5. Click Start if the timer gate appears.
6. Complete interactive blocks.
7. See results.
8. Return to dashboard or use post-completion actions.

The dashboard already reduces searching by grouping section assignments and surfacing Up Next. There is still some unnecessary splitting between the most important action and adjacent actions: the hero currently prioritizes practice for the urgent assignment, while the assignment card has Start Workbook. That can be confusing when the fundamental job is completing assigned work.

### Learner: Peer Review and Discussion

Peer review currently has two entry modes:

- After completion: click Open for Peer Review, open a dialog, optionally invite classmates, click Create Room, navigate to `/review/:roomId`.
- From nav: open drawer, click Join Peer Review, enter room code or switch to invitations tab, join, navigate to `/review/:roomId`.

Discussion currently uses a floating chat button:

1. Click the chat FAB.
2. Create or select a topic.
3. Send message.

The review page itself is a good interaction shape: it keeps workbook context and chat in one split-pane route. The friction is getting into the room and getting peers there. Code-based joining and hidden invitations make sense as fallbacks, but they should not be the primary path when the app already knows classmates, sections, assignments, and completion state.

## Highest-Leverage Opportunities

### 1. Add an Instructor Assignment Launchpad

Problem: Creating a real assignment crosses `/units`, `/unit/:id`, `/sections`, then `/unit/:id` again. That route churn is visible in both the E2E helpers and journey specs.

Proposal: Add a persistent “Assign” launchpad in the editor that combines publish status, section selection, due date, and missing-section creation into one flow.

Suggested behavior:

- From any unit editor, show a primary “Assign” action when the unit has publishable content.
- If the unit is still draft, the flow offers “Publish and assign” as the primary action.
- Let instructors choose existing sections or create a new section inline without leaving the editor.
- After assignment creation, show a shareable section join code and “View section” secondary action.
- Support assigning to multiple sections at once, using the existing multi-select behavior in `AssignmentConfiguration.jsx`.

Why this reduces friction:

- Removes at least two full page navigations for the common “new content to assigned homework” path.
- Removes the need to know that section creation lives elsewhere.
- Makes the assignment state explicit instead of relying on auto-save after two fields are set.

Implementation anchors:

- Extend `src/components/Editor3/components/AssignmentConfiguration.jsx` rather than reviving `src/components/SectionAssigner.jsx`.
- Reuse section creation logic from `app/[locale]/sections/SectionsClient.jsx` as a shared action/helper if possible.
- Preserve the current SectionContext data source so this does not add duplicate subscriptions.

Validation path:

- Update `test/e2e-collaboration/assignment-workflow.spec.ts` so assignment setup does not need to call `goToSections` between creating the unit and assigning it.
- Add a journey assertion that a newly created section can be created from the assignment launchpad and immediately selected.

### 2. Replace Assignment Auto-Save Ambiguity with an Explicit Review Step

Problem: `AssignmentConfiguration.jsx` creates assignments from a `useEffect` once `selectedSections` and `dueDate` are both set. This saves a click, but it makes the state transition easy to miss and hard to recover from if the user picked the wrong date or section.

Proposal: Keep the fast path, but make it explicit: “Assign to 3 sections” appears as soon as due date and sections are valid, with a preview list of what will be created.

Suggested behavior:

- Default due date to a sensible value, such as next class meeting or seven days from now, so instructors can accept rather than type.
- Provide due-date chips: Tomorrow, Next class, Friday, Custom.
- Show selected sections as rows with due dates before commit.
- After commit, show an undo snackbar if the created assignments can be deleted safely.

Why this reduces friction:

- Date entry becomes one click for common cases.
- Instructors get confidence without hunting the “assigned sections” list afterward.
- Accidental assignment is less likely than with silent auto-create.

Implementation anchors:

- `src/components/Editor3/components/AssignmentConfiguration.jsx` already has `selectedSections`, `dueDate`, `assignedSectionIds`, and `createAssignments`.
- The current effect-based auto-create can be replaced with an explicit button without changing the model contract.

Validation path:

- Add Playwright coverage for selecting a quick due date chip, selecting two sections, clicking assign, and seeing both sections in the assigned list.

### 3. Put “Create From Existing” and “Assign Existing” on the Sections Page

Problem: Instructors think in class sections as often as they think in units. The current section page can create sections, show cards, and host instructor dashboards, but assignment creation is centered in the unit editor.

Proposal: Add a section-first assignment flow on `/sections` and `/section/:id`.

Suggested behavior:

- On a section card, add “Assign unit” for instructors.
- In section detail, add a compact assignment composer above the assignments/gradebook area: Unit, due date, publish check, assign.
- If the selected unit is draft, allow “Publish first” from the same flow.
- After assignment, keep the instructor on the section page and update the assignment list via existing subscriptions.

Why this reduces friction:

- Instructors can prepare a class from the class page without detouring into the editor.
- It complements, rather than replaces, the unit-first launchpad.
- It supports common classroom planning: “What does this section need next?”

Implementation anchors:

- `app/[locale]/sections/SectionsClient.jsx` owns section cards and create-section UX.
- `app/[locale]/section/[id]/SectionDetailClient.jsx` already has section assignments, gradebook, completion, and room data.
- Shared assignment creation should use the same helper as `AssignmentConfiguration.jsx` to avoid two diverging implementations.

Validation path:

- Add a section-first Playwright path: instructor opens `/section/:id`, assigns an existing published unit, learner sees it on dashboard without another instructor route change.

### 4. Make the Learner Hero Start the Assignment, Not Practice

Problem: `DashboardClient.jsx` computes `urgentNextAssignment`, but the hero action calls `openDrill(...)` and labels the button “Start practice.” The assignment cards below use “Start Workbook.” For a learner trying to finish required work, the hero should send them to the workbook.

Proposal: Change the hero primary action for `urgentNextAssignment` to open `/workbook/:unitID`. Keep practice as a secondary action on assignment cards or after completion.

Why this reduces friction:

- The first screen’s strongest call to action matches the fundamental objective: complete the assignment.
- Reduces the chance a learner starts optional practice when they intended to submit homework.

Implementation anchors:

- `app/[locale]/DashboardClient.jsx` has `urgentNextAssignment` and the hero button.
- `src/components/Dashboard/AssignmentCard.tsx` already has the correct Start Workbook link.

Validation path:

- Update `test/e2e/journeys/journey-01-learner-homework.spec.ts` to assert the hero next-assignment CTA links to `/workbook/:id` or navigates there.

### 5. Keep Results, Retry, Peer Review, and Guidance in One Post-Completion Flow

Problem: After completion, learners may see results, return to dashboard, open completed assignments, click Open for Peer Review, create a room, then share or invite. The pieces exist but are spread between `UnitCompletedPlugin.jsx`, `AssignmentCard.tsx`, and `OpenPeerReviewButton.tsx`.

Proposal: Treat completion as a handoff moment with one ordered action strip.

Suggested behavior after a workbook is complete:

- Primary: Review answers.
- Secondary: Open peer review.
- Secondary: Request guidance.
- Secondary: Practice mistakes.
- If peer review room creation succeeds, immediately show “Copy invite,” “Invite classmates,” and “Go to room.”

Why this reduces friction:

- Learners do not need to return to dashboard to discover next social/help actions.
- The review flow starts while the learner still has context about what they just submitted.
- Fewer modal transitions for room creation.

Implementation anchors:

- `src/components/Editor3/plugins/UnitCompletedPlugin.jsx` already owns completion/results UI.
- `src/components/Dashboard/AssignmentCard.tsx` and `src/components/PeerReview/OpenPeerReviewButton.tsx` already define the same post-completion actions.

Validation path:

- Strengthen `test/e2e-collaboration/peer-review-room.spec.ts` so it creates a room directly from the completion surface and verifies the invite/code appears without returning to dashboard.

### 6. Prefer Invitation-Based Peer Review Joining Over Manual Codes

Problem: `JoinPeerReviewDialog.tsx` supports both room codes and invitations, but the tested flow still has a learner manually joining with a room id/code. Codes are useful in live classrooms, but they add transcription friction and fail poorly.

Proposal: Make invitations the first tab when a learner has pending peer review invitations, and show a notification-backed “Join review” action wherever the learner sees the related assignment.

Suggested behavior:

- If pending invitations exist, open the dialog directly on Invitations.
- On completed assignment cards, show “Join review” when the learner has been invited to review that unit.
- Keep code entry as a secondary tab or toolbar action.
- When a room is created with invited classmates, send them a direct notification/link rather than requiring the owner to share a code manually.

Why this reduces friction:

- Removes the copy/share/type loop for known classmates.
- Connects review invitations to the assignment they are about.
- Reduces page loads because the invitation link can navigate directly to `/review/:roomId`.

Implementation anchors:

- `src/components/PeerReview/JoinPeerReviewDialog.tsx` already has tabs and `NotificationInvitations`.
- `src/components/Dashboard/AssignmentCard.tsx` can render an invitation-specific action when data is available.
- `src/components/PeerReview/OpenPeerReviewButton.tsx` already accepts invited user IDs.

Validation path:

- Add E2E coverage where Student 1 invites Student 2, Student 2 sees a dashboard or notification action, clicks once, and lands on `/review/:roomId`.

### 7. Surface Discussions in Section and Assignment Context

Problem: Section chat is available through a floating button. That keeps it accessible, but discoverability depends on recognizing the icon. Topic creation is also a separate step before messaging.

Proposal: Add context-aware discussion entry points while keeping the FAB.

Suggested behavior:

- On section panels and section detail, show an inline “Discuss” action with unread count.
- From an assignment card, open chat scoped to that assignment/unit and preselect or create the assignment topic.
- When no topic exists, let the first message create a default topic instead of requiring an explicit plus-topic step.

Why this reduces friction:

- Learners can ask about the assignment from the card they are already reading.
- Reduces the create-topic ceremony for quick classroom questions.
- Makes discussion feel attached to the work, not a separate global utility.

Implementation anchors:

- `src/components/Chat/ChatPanel.tsx` already accepts `scope` and creates topics via `createTopic(name, defaultScope)`.
- `app/[locale]/DashboardClient.jsx` calls `useChatPageContext({ sections: mySections })`.
- `src/components/Dashboard/SectionPanel.tsx` and `AssignmentCard.tsx` are natural locations for visible discussion entry points.

Validation path:

- Update `test/e2e-collaboration/collaborative-chat.spec.ts` to open chat from a section or assignment action and send the first message without manually pressing the topic add button.

### 8. Turn Section Detail Into an Action Queue for Instructors

Problem: The section detail page contains many valuable sections: students, gradebook, completion grid, leaderboard, assignments, collaboration rooms. Navigation anchors help, but instructors still need to know where to look.

Proposal: Add a “Needs attention” strip near the top of section detail.

Suggested cards:

- Unreviewed submissions.
- Students missing current assignment.
- Open guidance rooms.
- Peer review rooms waiting for reviewers.
- Assign next unit.

Why this reduces friction:

- Moves instructors from scanning dashboards to acting on the next issue.
- Gives a single landing zone after opening a class.
- Can link to in-page anchors/drawers instead of new routes.

Implementation anchors:

- `app/[locale]/section/[id]/SectionDetailClient.jsx` already computes or renders gradebook, assignments, collaboration rooms, and drawer state.
- `src/components/PeerReview/OpenCollaborationRooms.tsx` already separates peer review and tutoring rooms.

Validation path:

- Add Playwright assertions that after a learner submission, opening the section detail shows a “Needs review” or “New submission” action that opens the grade drawer or scrolls to the row.

### 9. Use Prefetch and SSR Previews More Aggressively on Known Next Routes

Problem: The app already prefetches the first few workbook routes from `DashboardClient.jsx`, and workbook/unit routes have SSR skeleton previews. The tested workflows still rely on multiple route loads.

Proposal: Prefetch the next likely route at the moment the user expresses intent.

Suggested behavior:

- When an instructor opens the assignment tab, prefetch likely `/section/:id` targets for selected sections.
- When a learner completes a workbook, prefetch `/review/:roomId` immediately after room creation and prefetch `/` for dashboard return.
- When a section card becomes visible for a learner, prefetch its first incomplete workbook route.
- When an instructor opens a section detail page, prefetch grade drawer data for rows with recent submissions.

Why this reduces friction:

- Some page loads are unavoidable, but they can feel instant when the next route is predictable.
- This reinforces existing architecture rather than introducing a large navigation redesign.

Implementation anchors:

- `app/[locale]/DashboardClient.jsx` already uses `router.prefetch` for workbook routes.
- `app/[locale]/unit/[id]/page.tsx` and `app/[locale]/workbook/[id]/page.tsx` already render SSR previews/skeletons.

Validation path:

- Measure route transition timing before/after with Playwright traces for assignment launch, workbook open, and review open.

## Suggested Roadmap

### Quick Wins

1. Change learner dashboard hero CTA from “Start practice” to “Start Workbook” for urgent assignments.
2. Make peer review invitations the default tab when invitations exist.
3. Add direct “Discuss” actions to section panels/cards that open the existing chat drawer.
4. Add due-date shortcut chips to assignment configuration.

### Medium Work

1. Add a unit-editor assignment launchpad that can publish and assign in one explicit flow.
2. Add section-first “Assign unit” from section cards and section detail.
3. Add post-completion action strip in the results surface.
4. Add “Needs attention” cards to section detail.

### Larger Product Bets

1. Create an instructor command center that combines sections, ungraded work, pending review rooms, and draft units into one action queue.
2. Introduce assignment templates or recurring due-date rules for instructors who repeatedly assign similar work.
3. Let AI-assisted authoring generate a draft assignment package: unit title, starter blocks, due date recommendation, target sections, and publish checklist.

## Open Questions

- Should publishing and assignment be a single atomic action, or should instructors always be able to assign drafts that auto-publish at a scheduled time?
- Are sections created frequently enough during assignment creation to justify inline creation, or is this mainly a first-time setup problem?
- Should peer review be section-wide by default, instructor-assigned by default, or learner-initiated by default?
- Is “Request Guidance” meant for instructor tutoring only, AI guidance only, or both? The current label could hide a more direct “Ask instructor” or “Ask Kai” split.
- Should discussion topics be scoped to section, unit, assignment, or all three depending on where the learner opens chat?

## Recommended First Implementation Slice

Start with the learner dashboard hero CTA change and one Playwright assertion. It is small, easy to validate, and directly affects the most frequent learner objective.

Then build the instructor assignment launchpad behind the existing `AssignmentConfiguration.jsx` surface. That is the largest click/page-load reduction for instructors, and it can reuse current SectionContext and Assignment model behavior without changing schema.
