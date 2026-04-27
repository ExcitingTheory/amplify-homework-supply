# Test Coverage Audit: Collaboration & AI Practice Features

**Date**: April 23, 2026

---

## Feature Inventory

### Yjs Collaboration

| Type | Files |
|------|-------|
| **Providers** | `src/yjs/YjsProvider.ts`, `SyncAdapter.ts`, `WorkbookCollaborationProvider.ts`, `PeerReviewRoomProvider.ts` |
| **Hooks** | `src/yjs/hooks.ts` (useYjsProvider, useYMap, useYArray, useYText, useAwareness), `workbookHooks.ts` (useWorkbookCollaboration, useWorkbookBlock, useTutorPresence, useWorkbookFeedback, useWorkbookStats, usePresenceUsers, useWorkbookComments, useBlockHistory), `peerReviewHooks.ts` (usePeerReviewRoom, useRoomMessages, useRoomPeers) |
| **Model Hooks** | `src/hooks/useYjsUnit.ts`, `useYjsWord.ts`, `useYjsFile.ts`, `useYjsQuestion.ts` |
| **Components** | `Editor3/plugins/CollaborationPlugin.tsx`, `Workbook/WorkbookPresenceBar.tsx`, `Workbook/BlockHistoryTimeline.tsx`, `Workbook/TutorPresenceBanner.tsx`, `Workbook/TutorCursorOverlay.tsx`, `Workbook/ConnectionStatus.tsx`, `Workbook/AIFeedbackSnackbar.tsx`, `Workbook/WorkbookProgress.tsx`, `Examples/CollaborativeWorkbook.tsx` |

### Peer Review

| Type | Files |
|------|-------|
| **Provider** | `src/yjs/PeerReviewRoomProvider.ts` |
| **Hooks** | `src/yjs/peerReviewHooks.ts` |
| **Components** | `PeerReview/OpenPeerReviewButton.tsx`, `PeerReviewChat.tsx`, `PeerReviewFeedbackPrompt.tsx`, `PeerReviewInvitations.tsx` |

### AI Practice Drills

| Type | Files |
|------|-------|
| **Components** | `PracticeDrill/PracticeDrillDialog.tsx`, `PracticeDrillWorkbook.tsx`, `PracticeDrillProgress.tsx`, `PracticeDrillConfigPopup.tsx`, `PracticeDrillDocRef.tsx`, `DrillAudioButton.tsx`, `DrillRecordButton.tsx` |
| **Hooks** | `usePracticeDrill.ts`, `useDrillAudio.ts`, `useDrillRecording.ts`, `useDrillCoverage.ts` |
| **Utils** | `buildDrillEditorState.ts`, `buildPracticeDrillFeedback.ts`, `src/utils/practiceXPCalculator.ts` |
| **Backend** | `generatePracticeDrill` Lambda — **not yet implemented** |

---

## Unit Tests (~185 test cases)

| File | Tests | Coverage Summary | Critical Gaps |
|------|-------|-----------------|---------------|
| `src/yjs/__tests__/YjsProvider.test.ts` | ~22 | Core CRUD, awareness, state sync | No WebSocket/reconnection, no corrupt data handling, timer-based tests silently skip assertions |
| `src/yjs/__tests__/WorkbookCollaboration.test.ts` | ~28 | Block CRUD, feedback, permissions, statistics | No CRDT cross-doc sync, `waitFor` missing `await` in hook tests |
| `src/yjs/__tests__/WorkbookPresenceBar.test.ts` | 11 | Idle detection, debounce, multi-user | No disconnect event, no awareness `removed` handling |
| `src/yjs/__tests__/WorkbookComments.test.ts` | 12 | Add/reply/resolve, concurrent CRDT merge | **No delete/edit comment**, no unmount cleanup |
| `src/yjs/__tests__/BlockHistory.test.ts` | 9 | Record, trim-to-50, hook reactivity | No multi-user history sync |
| `src/yjs/__tests__/PeerReviewRoomProvider.test.ts` | 16 | Room lifecycle, messages, CRDT ordering | Double-init, close-before-init edge cases |
| `src/yjs/__tests__/peerReviewHooks.test.ts` | 8 | Messages + peers happy path | **`usePeerReviewRoom` hook has zero tests** |
| `src/hooks/useYjsUnit.test.ts` | ~26 | Load, save, version conflict, cleanup | Auto-save debounce, corrupt snapshot |
| `src/components/PracticeDrill/buildPracticeDrillFeedback.test.ts` | 9 | Accuracy, weak/strong areas, markdown | **Boundary values (70%, 90%) untested** |
| **`src/utils/practiceXPCalculator.ts`** | **0** | **Nothing** | **Zero tests on shared Lambda+UI XP logic** |
| `usePracticeDrill.ts` | 0 | Nothing | Core drill hook untested |
| `useDrillAudio.ts` | 0 | Nothing | Base64/S3 resolution untested |
| `useDrillRecording.ts` | 0 | Nothing | MediaRecorder lifecycle untested |
| `useDrillCoverage.ts` | 0 | Nothing | Coverage computation untested |
| `buildDrillEditorState.ts` | 0 | Nothing | Lexical state builder untested |

---

## Integration Tests (~33 test cases)

| File | Tests | Coverage Summary | Gaps |
|------|-------|-----------------|------|
| `test/integration/multi-user-collaboration.test.ts` | ~15 | **Excellent** — 2/3-user CRDT convergence, rapid concurrent edits, role permissions, resume from Grade.data | Network partition, 3+ user Y.Text editing |
| `test/performance/yjs-collaboration.test.ts` | 11 | Performance benchmarks, random-ops fuzzing, undo/redo sync | Uses raw Y.Doc (no provider class), no memory pressure tests |
| `test/integration/question-editor.test.tsx` | ~18 | UI rendering, selection, import callback | **Mutations never verified** — no `Question.create/update` assertions, uploads never triggered |

### Missing integration test suites entirely

- **Practice drill end-to-end flow** (generate → answer → submit → XP)
- **Peer review room flow** (create room → invite → chat → close)
- **SyncAdapter** DynamoDB round-trip (save snapshot → reload → verify)
- **Workbook → Grade persistence** (exportToGradeData → Grade.update → reload)

---

## Storybook Stories

### PracticeDrill

| Component | Stories | Variants | Gaps |
|-----------|---------|----------|------|
| `PracticeDrillWorkbook` | ✅ | Default, PartiallyAnswered, AllAnswered, Empty, WithDocumentRefs | No loading/error state, no `custom-answer` block, no review mode |
| `PracticeDrillProgress` | ✅ | Default, HalfComplete, AllComplete, DiminishedXP, WithStreak | No streak+diminished combined, no single-block edge |
| `PracticeDrillConfigPopup` | ✅ | Default, WithCoverage, FullCoverage, VocabularyOnly, NoContent, Loading, PreConfiguredFromChat | No error state, no non-vocabulary `initialDrillType` |
| `PracticeDrillDocRef` | ✅ | Default, LongFilename, StringPage | No undefined filename/page |
| `DrillAudioButton` | ✅ | WithBase64Audio, WithS3Path, SmallSize | No loading/error/disabled state; AudioPlayerContext mock is a no-op |
| **`PracticeDrillDialog`** | ❌ | — | **No stories — this is the user's primary entry point** |
| **`DrillRecordButton`** | ❌ | — | **No stories** |

### Workbook / Collaboration

| Component | Stories | Gaps |
|-----------|---------|------|
| `WorkbookPresenceBar` | ✅ (5 variants) | Uses a **mock visual component**, not the real one — won't catch prop regressions |
| `CommentGutterIcon` | ✅ (3 variants) | No large count (99+) |
| `CommentThreadDrawer` | ✅ (2 variants) | No multiple threads, no reply-in-progress, no instructor role |
| `BlockHistoryTimeline` | ✅ (2 variants) | No multi-user interleaved, no many-entries scroll |
| **`TutorPresenceBanner`** | ❌ | — |
| **`TutorCursorOverlay`** | ❌ | — |
| **`ConnectionStatus`** | ❌ | — |
| **`AIFeedbackSnackbar`** | ❌ | — |
| **`WorkbookProgress`** | ❌ | — |

### Peer Review

| Component | Stories | Gaps |
|-----------|---------|------|
| `JoinByCode` | ✅ (2 variants) | No loading state |
| `RoomInvite` | ✅ (1 variant) | No empty/overflow states |
| `PeerReviewInvitations` | ✅ (2 variants) | No status filtering |
| `PeerReviewChat` | ✅ (1 variant) | No empty, no AI response message, no loading state |
| **`OpenPeerReviewButton`** | ❌ | — |
| **`PeerReviewFeedbackPrompt`** | ❌ | — |

---

## E2E Tests (Cypress)

| File | Tests | Coverage |
|------|-------|----------|
| `cypress/e2e/yjs-collaboration.cy.ts` | 4 | Provider init, cross-user session switching, connection lifecycle |
| `cypress/e2e/workbook-spec.cy.ts` | 1 | Block creation + basic interaction |
| `cypress/e2e/complete-workflow.cy.ts` | 6 | Unit → Section → Assignment → Learner joins |

### Entire feature areas with ZERO E2E coverage

- **AI Practice Drills** — no test file exists
- **Peer Review** — no test file exists
- **Workbook grade submission** — workflow stops before learner completes exercises
- **AI chat integration** — no test file exists
- **Presence/awareness UI** — not tested beyond raw provider check
- **Audio recording** — explicitly noted as untested
- **Drag & drop (Meaning Association)** — explicitly noted as untested

---

## Priority Gaps

### P0 — High risk, add immediately

| # | Gap | Type | Why Critical |
|---|-----|------|-------------|
| 1 | `practiceXPCalculator.ts` — **zero tests** | Unit | Shared between Lambda and UI, controls gamification math. Off-by-one errors break XP for all students |
| 2 | `usePracticeDrill` hook — **zero tests** | Unit | Core session lifecycle: generation, answer tracking, save, XP award |
| 3 | Practice drill E2E — **no file** | E2E | The entire AI practice feature has no end-to-end validation |
| 4 | Peer review E2E — **no file** | E2E | Multi-user chat feature completely untested at the user level |
| 5 | `buildDrillEditorState` — **zero tests** | Unit | Generates Lexical JSON from drill blocks; incorrect output breaks rendering silently |
| 6 | Fix `waitFor` missing `await` in WorkbookCollaboration + PresenceBar tests | Bug | Assertions silently never run — tests pass vacuously |

### P1 — Medium risk

| # | Gap | Type | Why |
|---|-----|------|-----|
| 7 | `useDrillRecording` / `useDrillAudio` hooks | Unit | MediaRecorder + S3 upload + Whisper grading lifecycle untested |
| 8 | `useDrillCoverage` hook | Unit | Coverage computation from past sessions untested |
| 9 | `PracticeDrillDialog` story | Storybook | Full-screen dialog is the user's entry point — no visual regression testing |
| 10 | `DrillRecordButton` story | Storybook | Recording UX has no visual development path |
| 11 | Workbook grade submission integration test | Integration | exportToGradeData → Grade.update → reload never tested |
| 12 | Feedback boundary values (70%, 90%) | Unit | Threshold off-by-one would misclassify weak/strong areas |
| 13 | Comment delete/edit operations | Unit | Destructive operations completely untested |
| 14 | `usePeerReviewRoom` hook | Unit | Room creation/management hook has zero tests |

### P2 — Lower risk, polish

| # | Gap | Type | Why |
|---|-----|------|-----|
| 15 | 5 Workbook collab components missing stories | Storybook | TutorPresenceBanner, TutorCursorOverlay, ConnectionStatus, AIFeedbackSnackbar, WorkbookProgress |
| 16 | `OpenPeerReviewButton` + `PeerReviewFeedbackPrompt` stories | Storybook | Entry/exit points of peer review with no visual testing |
| 17 | SyncAdapter DynamoDB round-trip | Integration | Snapshot persistence untested |
| 18 | Question editor mutation assertions | Integration | Tests verify UI opens but never assert `Question.create` was called |
| 19 | `WorkbookPresenceBar` story uses mock component | Storybook | Won't catch real prop regressions |
| 20 | Complete workflow E2E: learner finishes workbook | E2E | Stops before grade submission |

---

## Coverage Scorecard

| Layer | Collaboration | AI Practice Drills | Peer Review |
|-------|--------------|-------------------|-------------|
| **Unit tests** | Good (126 tests, some bugs) | **Poor** (9 tests, 4 hooks + 2 utils untested) | Adequate (24 tests, 1 hook gap) |
| **Integration** | **Excellent** (26 tests) | **None** | **None** |
| **Storybook** | Partial (3/8 components) | Partial (5/7 components) | Partial (4/6 components) |
| **E2E** | Minimal (5 tests, no presence UI) | **None** | **None** |
