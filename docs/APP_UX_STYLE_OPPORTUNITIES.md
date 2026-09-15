# Application UX and Style Opportunities

Date: 2026-09-07

## Purpose

This review covers the application outside the dashboard-focused workflow review in [WORKFLOW_UX_OPPORTUNITIES.md](./WORKFLOW_UX_OPPORTUNITIES.md). It looks for improvements to usability, visual consistency, responsiveness, accessibility, feedback, and recovery across the main learner and instructor surfaces.

The recommendations are grounded in current implementation evidence. They are opportunities for product and design work, not a claim that every issue is currently reported by users.

## Review Scope

- Workbook and timed assignment entry
- Recording Studio
- AI assistant and chat
- Settings and account management
- Units and content management
- Practice drills
- Authentication and onboarding
- Offline and sync expectations
- Cross-cutting responsive, accessible, and feedback patterns

## Priority Summary

| Priority | Opportunity | Primary users | Main outcome |
| --- | --- | --- | --- |
| P0 | Fix high-risk responsive and contrast failures | Learners, all users | Core content remains usable on small screens and in both themes |
| P1 | Make asynchronous states and errors visible and recoverable | All users | Users understand whether work loaded, saved, failed, or is still processing |
| P1 | Improve recording and practice controls | Learners, instructors | Media-heavy tasks become easier to operate and recover |
| P1 | Add accessible names and consistent feedback | All users | Keyboard, screen-reader, and assistive-technology users get equivalent task cues |
| P2 | Connect chat, peer review, and assignment context | Learners | Help and collaboration are available where the question arises |
| P2 | Set clearer offline expectations and sync state | Learners | Users know what works offline and whether submissions are safe |
| P2 | Improve first-run orientation and return intent | New users | Sign-up and onboarding lead naturally into the next useful action |

## Highest-Leverage Opportunities

### 1. Make Timed Workbook Entry Responsive and State-Safe

**Evidence:** `app/[locale]/workbook/[id]/WorkbookClient.tsx`

The timer gate uses `97vw` for the first card and `70vw` plus absolute centering for the recent-grades card. The recent-grades layout also assumes enough horizontal room for a date, divider, and percentage on one row. Long unit names or descriptions can make the start experience cramped on phones, and absolute centering can push a tall dialog outside the viewport.

**Recommendation:**

- Use a viewport-safe container with `width: min(100% - 2rem, 48rem)` and a bounded `maxHeight`.
- Let recent-grade rows stack or wrap at narrow widths.
- Keep the start action visible while content scrolls.
- Add a pending/disabled state while `createGrade()` runs so repeated taps cannot create ambiguous starts.
- Use an explicit dialog or landmark structure for the prior-attempt gate and ensure focus moves into it.

**Validation:** Test 320px, 375px, tablet, and desktop widths with long titles/descriptions and multiple prior grades. Assert that the start action is visible, reachable by keyboard, and does not create duplicate grades during a slow response.

### 2. Remove Theme-Dependent Chat Contrast Risk

**Evidence:** `src/components/ChatSidebar/VirtualizedMessageList.module.css`

`.messageWrapper.user * { color: #ffffff !important; }` forces every descendant of a user message to white, regardless of the actual message background, nested markup, links, or active MUI color scheme. This can produce low contrast or unreadable content when the user-message background is light or when a nested component supplies its own accessible color.

**Recommendation:**

- Replace the global descendant override with theme-backed foreground and background tokens.
- Set colors on the message content root rather than every descendant.
- Define link, code, tool result, and secondary-text states explicitly for light and dark themes.
- Add automated contrast checks for representative user and assistant messages.
- Render tool outputs as a compact, collapsible summary with formatted fields instead of raw JSON where possible.

**Validation:** Run the chat stories in both MUI color schemes and test long links, code, tool output, and markdown inside user messages. Add an accessibility assertion for text contrast and keyboard access to expandable tool results.

### 3. Make Recording Studio Fit Its Container

**Evidence:** `src/components/RecordingStudio3.jsx`, `src/components/RecordingStudio3Modal.jsx`, and the recording-studio audio player components.

The studio combines a screenplay editor, timeline, waveform players, take history, filters, and a properties panel. The reviewed implementation uses fixed panel and waveform widths in a surface that can be narrower than those controls. This makes horizontal overflow likely, especially inside a modal or on a laptop viewport. Several visible labels in the inspected surface are also literal strings rather than translated UI copy.

**Recommendation:**

- Make waveform and timeline widths container-relative, with a minimum usable width and horizontal scrolling only where the timeline genuinely requires it.
- Collapse the properties/take panel into a drawer or accordion below a defined breakpoint.
- Keep transport controls in a stable toolbar that remains reachable while the timeline scrolls.
- Route visible labels, status text, and voice names through the translation system.
- Show a compact “selected take” summary when the detail panel is collapsed.

**Validation:** Exercise the studio at 320px, 768px, and desktop widths with long speaker names, multiple takes, and a narrow modal. Verify no primary control is clipped and that the active take remains obvious after panel collapse.

### 4. Give Recording Controls Explicit Accessible State

**Evidence:** `src/components/RecordingStudio3.jsx` and its imported recording controls.

The studio relies heavily on icon buttons for playback, take management, selection, and track actions. In a dense audio workflow, icon meaning and selection state cannot be inferred reliably by every user. Locked tracks are also represented partly through visual badges, which is not sufficient as the only status cue.

**Recommendation:**

- Add localized `aria-label` and tooltip text to every icon-only action.
- Expose active take, selected dialogue, recording mode, and locked-track state through semantics, not color or emoji alone.
- Use `aria-pressed` or an equivalent selected state for toggles and take selection.
- Announce recording, upload, processing, and save completion through a live region.
- Confirm destructive take deletion with an undo path where feasible.

**Validation:** Complete a representative recording flow using keyboard navigation and a screen reader. Confirm that each control has a unique accessible name and that state changes are announced.

### 5. Standardize Settings Forms and Error Feedback

**Evidence:** `app/[locale]/settings/page.jsx`

Settings uses browser `alert()` for update failures while success uses a timed Snackbar. That creates inconsistent interruption and makes errors difficult to associate with a field. The page also has a `name` state value that is populated but not exposed in the visible profile form, and a bare label for the user ID is not consistently associated with its control.

**Recommendation:**

- Replace browser alerts with inline form errors or a consistent error Snackbar that preserves the message until dismissed.
- Keep `isWorking` accurate across every success and failure path, including email confirmation and password changes.
- Decide whether name is an editable profile field; either expose it with a proper label or remove the unused state and update path.
- Use MUI labels and explicit IDs for every visible input, including read-only account identifiers.
- Add password requirements and confirm-password validation before submitting.
- Preserve unsaved changes when locale navigation fails and show a clear retry action.

**Validation:** Add tests for failed email update, failed password update, confirmation-code failure, and locale navigation failure. Verify no browser alert appears and that the relevant form remains usable after each error.

### 6. Distinguish Empty, Loading, and Failed Content States

**Evidence:** `app/[locale]/units/UnitsClient.jsx`

The units page lazily loads “Shared With Me” and “Community” data. The inspected flow sets loaded state after the request, but failures are logged to the console without a user-facing retry or clear distinction from a legitimate empty result. Fork failures similarly provide no visible recovery path.

**Recommendation:**

- Track `idle`, `loading`, `success-empty`, `success-with-data`, and `error` states per lazy tab.
- Show a concise empty-state explanation and primary next action for each tab.
- Show a retry action with the failed request context instead of leaving a blank area.
- Give fork actions a pending state, then show success or failure inline without losing the current tab or scroll position.
- Replace repeated wide `90vw`/`80vw` layout constraints with a shared responsive content container.

**Validation:** Mock slow, empty, and failed responses for each tab. Verify the state is visually distinct, retry works, and fork failure does not silently leave the user uncertain about whether a copy was created.

### 7. Make Practice Drill Recovery More Deliberate

**Evidence:** `app/[locale]/drill/[id]/page.tsx` and the practice-drill components used by `UnitsClient.jsx`.

Practice is a focused task, but recovery currently risks losing context: the back action is icon-only, and error handling can return the learner to the drill library rather than preserving the current configuration. Completion needs a stronger next action than simply displaying results.

**Recommendation:**

- Give back, retry, and close controls accessible names and predictable destinations.
- Preserve the selected unit, difficulty, question count, and mode when retrying after an error.
- Add completion actions for review mistakes, retry missed items, practice again, and return to the related workbook.
- Show progress and save status in a stable location that does not move as question content changes.

**Validation:** Interrupt a drill during loading, answer incorrectly, refresh after completion, and retry from an error. Confirm the learner can recover without reconstructing the drill configuration.

### 8. Attach Discussion and Help to the Work in Front of the Learner

**Evidence:** `src/components/Chat/ChatPanel.tsx`, `src/components/Dashboard/SectionPanel.tsx`, `src/components/Dashboard/AssignmentCard.tsx`, and `app/[locale]/DashboardClient.jsx`.

The floating chat entry point is available globally, but it asks users to recognize an icon, open a drawer, and potentially create a topic before sending a question. The chat context already supports scoped content, so the main opportunity is discoverability and reducing setup steps.

**Recommendation:**

- Keep the floating entry point, but add inline “Discuss” or “Ask for help” actions on section and assignment surfaces.
- Open chat with the current unit, assignment, or section already selected.
- Allow the first message to create a default scoped topic when no topic exists.
- Show unread counts and pending guidance/review invitations beside the related assignment rather than only in global navigation.
- Use different labels when the destination is instructor guidance versus AI help.

**Validation:** From an assignment card, open scoped chat and send the first message without manually creating a topic. Confirm the conversation retains its assignment context after navigation.

### 9. Make Offline Capability Legible Before Users Need It

**Evidence:** `docs/OFFLINE_EXPERIENCE.md` and `app/[locale]/offline/page.tsx`.

The project documents app-shell and media caching, while offline unit data, grade submission queuing, and offline AI remain limited or planned. Learners may reasonably infer that an installed application can complete and submit work offline, so the UI should make capability boundaries explicit.

**Recommendation:**

- Mark content as available offline, partially available, or online-only before the learner opens it.
- Show last-synced time and sync status near workbook progress.
- Queue eligible grade submissions with a visible pending state and retry action.
- Preserve answers locally when connectivity drops, with clear copy about what is and is not saved.
- Avoid presenting unavailable AI or collaboration controls as if they will work offline.

**Validation:** Use browser offline mode during workbook editing, submission, media playback, and chat. Verify answers are not lost, pending work is visible, and the learner can identify the next recovery step.

### 10. Improve First-Run Orientation and Return Intent

**Evidence:** `src/components/AmplifyAuthenticator.jsx`, `app/providers.tsx`, and `docs/ONBOARDING_TOUR_AUDIT.md`.

Authentication and return-URL handling are important gates, but the first authenticated moment does not appear to offer a compact role-based orientation in the reviewed surface. The onboarding audit also identifies coupling between tour tasks and live component selectors, which creates maintenance risk.

**Recommendation:**

- After sign-up, ask for the user’s primary role or intent only when needed to tailor the first route.
- Preserve and visibly confirm the destination the user was trying to reach before authentication.
- Offer a short first-run checklist tied to real next actions, such as joining a section, creating a unit, or opening assigned work.
- Keep tour selectors based on stable semantic attributes and add an automated check that every onboarding target exists.
- Make tour progress recoverable if a target is hidden inside a dialog or route transition.

**Validation:** Test new instructor and learner journeys from a deep link through sign-up, redirect, and first action. Test a tour step whose target is initially hidden and confirm the user can continue or skip it.

## Cross-Cutting Style System Opportunities

1. **Use shared responsive containers.** Replace page-specific viewport widths with a small set of layout primitives that define readable max widths, mobile padding, and overflow behavior.
2. **Define semantic feedback tokens.** Standardize success, warning, error, pending, offline, and locked states across MUI components, CSS modules, snackbars, and inline alerts.
3. **Prefer visible state over decoration.** Active, selected, locked, saving, and unsynced states should be communicated through text or semantics in addition to color, icon, or emoji.
4. **Treat translation as part of layout.** Test German, French, Japanese, and Chinese labels in buttons, dialogs, tables, and narrow panels; avoid fixed widths that only fit English.
5. **Keep action hierarchy consistent.** Primary actions should complete the current job, while recovery and optional exploration should remain secondary and predictable across cards, dialogs, and completion screens.
6. **Make asynchronous work observable.** Every mutation that changes user data should have a pending state, success confirmation, failure message, and a retry or undo path where it is safe.
7. **Respect reduced motion and keyboard use.** Preserve the existing reduced-motion patterns and extend them to dialogs, drawers, recording feedback, loading transitions, and chat autoscroll.

## Suggested Roadmap

### Immediate Fixes

1. Replace the chat user-message color override with theme-aware message tokens.
2. Make timed workbook entry responsive and protect the start action from duplicate submissions.
3. Replace settings browser alerts with consistent inline or Snackbar errors.
4. Add visible loading, empty, error, and retry states to lazy units tabs.
5. Add accessible names and selected/locked semantics to recording and practice controls.

### Next Iteration

1. Rework Recording Studio panels for narrow containers and translated labels.
2. Add scoped discussion actions to assignment and section surfaces.
3. Improve practice-drill completion and recovery actions.
4. Add cross-route feedback primitives for save, upload, processing, and sync states.

### Larger Product Work

1. Deliver an offline submission queue with explicit sync status.
2. Add a role-aware first-run checklist and stable onboarding target validation.
3. Establish a shared responsive layout and semantic status-token layer across the application.

## Recommended First Implementation Slice

Start with the timed workbook entry and chat contrast fixes. They affect core learner work, are isolated to existing UI surfaces, and can be validated at multiple viewport sizes and color schemes without changing data models. Follow with settings feedback and units-tab error states to establish a consistent pattern for asynchronous failure recovery.

## Open Questions

- Which workbook actions must remain available offline, and what submission guarantees can the product make?
- Should recording be optimized primarily for laptop classrooms, mobile capture, or both?
- Is chat intended to be one global conversation space, or should assignment-scoped threads become the default?
- Which role and course information is required before choosing a first-run route?
- Should the shared visual language continue to be MUI-first, or should responsive containers and status tokens become a small application-level design layer?
