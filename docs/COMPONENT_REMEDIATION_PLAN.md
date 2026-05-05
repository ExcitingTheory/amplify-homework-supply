# Component Remediation Plan

Audit date: April 17, 2026

Full inventory of `src/components/` (~200 files), `pages/` (13 files), 78 story files, 57 test files. All components use MUI `sx` prop consistently — no styling inconsistencies found.

---

## Phase 1: Dead Code Cleanup

**Risk**: Low — zero imports confirmed for every file below.

### 1A. Remove orphaned top-level components

| File | Notes |
|------|-------|
| `src/components/PreviewImage.jsx` | Zero imports anywhere |
| `src/components/ItemTypes.js` | Plain `{ CARD: 'card' }` constant, no importers |
| `src/components/SavedPdfThumbnail.tsx` | Zero imports |
| `src/components/DocumentSourceBadge.tsx` | Zero imports |
| `src/components/VideoPlayer.js` | Only referenced as a story name, never actually imported as a component |
| `src/components/SvgPreview.jsx` | Zero component imports (only an i18n key collision) |

### 1B. Remove dead Editor3 sub-components

| File | Notes |
|------|-------|
| `src/components/Editor3/components/QuizComponent1.jsx` | Superseded by `QuizComponent` |
| `src/components/Editor3/components/ExcalidrawWrapper.jsx` | Zero importers |
| `src/components/Editor3/components/FreeSoloCreateOptionDialog.jsx` | Zero importers |
| `src/components/Editor3/components/InsertLayoutDialog.jsx` | `ToolBarPlugin` uses an inline modal instead |
| `src/components/Editor3/components/LazyMediaPlayerOnScroll.jsx` | Zero importers |
| `src/components/Editor3/components/MetadataCard.jsx` | Zero importers |
| `src/components/Editor3/components/MetadataField.jsx` | Only imported by dead `MetadataCard` |
| `src/components/Editor3/components/DocumentUploader.jsx` | Zero importers |
| `src/components/Editor3/components/CollaboratorsList.tsx` | Zero importers |

### 1C. Remove dead folders

| Path | Notes |
|------|-------|
| `src/components/embeddings/` | Both `UnitEmbeddingComponents.jsx` and `WordEmbeddingIntegration.jsx` have zero imports |
| `src/components/Examples/` | `CollaborativeWorkbook.tsx` — example code never imported |

**Note**: `RecordingStudio3/ScreenplayEditor.jsx` is **not** dead code — it will be rewritten as part of the ScreenplayEditor redesign (see Phase 6).

**Total**: 19 files to delete.

---

## Phase 2: Naming & Organization Fixes

### 2A. File renames

| Current | Proposed | Reason |
|---------|----------|--------|
| `src/components/authenticator.jsx` | `src/components/AmplifyAuthenticator.jsx` | Lowercase violates PascalCase convention; export is `MyAuth` which doesn't match either. Rename file, keep export name, update import in `pages/_app.jsx` |

### 2B. Misplaced files (move to correct directory)

| Current | Proposed | Reason |
|---------|----------|--------|
| `src/components/Editor3/components/memoizedUser.js` | `src/utils/memoizedUser.js` | Pure async caching utility (`getMemoizedUser`, `getIdentity`), not a React component |
| `src/components/Editor3/components/LanguageEditorTheme.js` | `src/components/Editor3/config/LanguageEditorTheme.js` | Lexical theme config object, not a component |

### 2C. Export style inconsistency

`GlobalChatButton` and `GlobalChatDrawer` use **named exports** while the rest of the codebase uses **default exports**. Low priority — only affects import ergonomics. Can fix opportunistically when these files are touched for other reasons.

### 2D. Version suffix question (deferred)

These components have a `2` or `3` suffix but no v1 exists: `DictionaryEditor2`, `QuestionEditor2`, `QuestionsReview2`, `VocabularyReview2`, `FileManager2`, `RecordingStudio2`, `RecordingStudio3`.

**Recommendation**: Leave as-is for now. Renaming would touch many import sites across the codebase and git history would lose blame context. Consider dropping suffixes only when a component gets a major rewrite.

---

## Phase 3: Storybook Coverage

Components listed below are actively used in production but have **no Storybook story** (direct or indirect).

### Priority 1 — Page-level components (highest user impact)

| Component | Used in | Notes |
|-----------|---------|-------|
| `InstructorDashboard.jsx` | `pages/sections.jsx` | Core instructor page, complex UI with tables/accordions/charts. Also a dependency of the Practice Drills plan (`InstructorInsight` integration). |
| `DictionaryEditor2.jsx` | `TabsVerticalLeft/Right` (editor sidebar) | Vocabulary management UI, used by every instructor |
| `QuestionEditor2.jsx` | `TabsVerticalLeft` (editor sidebar) | Question bank editor, used by every instructor |

### Priority 2 — App-wide components

| Component | Used in | Notes |
|-----------|---------|-------|
| `GlobalChatButton.jsx` | `pages/_app.jsx` | Visible on every page for authenticated users |
| `GlobalChatDrawer.jsx` | `pages/_app.jsx` | The global chat drawer wrapper |
| `AvatarEditor.tsx` | `pages/profile/[username].jsx` | Profile page avatar upload/crop |

### Priority 3 — Workbook sub-components (5 of 10 missing)

| Component | Notes |
|-----------|-------|
| `Workbook/AIFeedbackSnackbar.tsx` | Snackbar for AI grading feedback |
| `Workbook/ConnectionStatus.tsx` | WebSocket/Yjs connection indicator |
| `Workbook/TutorCursorOverlay.tsx` | Shows instructor cursor position |
| `Workbook/TutorPresenceBanner.tsx` | Banner when tutor joins workbook |
| `Workbook/WorkbookProgress.tsx` | Student progress bar in workbook |

### Priority 4 — Editor3 sub-components with no indirect coverage

| Component | Notes |
|-----------|-------|
| `Editor3/components/AIContentSuggestion.jsx` | AI completion overlay — plugin story imports the Node, not this component |
| `Editor3/components/AssignmentConfiguration.jsx` | Tab panel never activated in any story |
| `Editor3/components/ConfigurationManager.jsx` | Same — hidden tab panel |
| `Editor3/components/PdfViewerComponent.jsx` | Lazy-loaded via `PdfViewerNode`, no story seeds PDF content |
| `Editor3/nodes/FileMetadataNode/FileMetadataComponent.jsx` | Lazy-loaded, no story exists |

**Total**: 16 components need stories.

---

## Phase 4: Unit Test Coverage

The project currently relies on Storybook stories + integration tests (`test/integration/`). No Editor3 sub-component has a dedicated unit test.

### Recommended unit tests (by complexity/risk)

| Component | Reason | What to test |
|-----------|--------|-------------|
| `QuizComponent` | Complex grading logic, multiple answer types | Correct/incorrect answer detection, score calculation, state transitions |
| `MeaningAssociationEditor` | Drag-and-drop matching with scoring | Pair matching, shuffle, completion detection |
| `AnswerComponent` | Short-answer verification, audio recording | Input handling, submission flow, accuracy check |
| `Save.jsx` | Debounced save with version conflict handling | Save triggers, conflict resolution, dirty state tracking |
| `SubmissionCountdown.jsx` | Timer logic with auto-submit | Countdown accuracy, auto-submit trigger, pause/resume |
| `GradeHistory.jsx` | Grade data parsing and display | JSON parsing of `Grade.data`, accuracy display, sorting |

### Existing test coverage (for reference)

Already well-tested areas (no action needed):
- `ChatSidebar/` — 3 unit tests + stories
- `DebugPanel/` — 4 unit tests + 4 stories
- `Gamification/` — 1 test + 5 stories
- `Leaderboard/` — 1 test + 1 story
- `PeerReview/` — 2 tests + 1 story
- `src/utils/` — 22 unit tests
- `test/integration/` — 8 integration tests

---

## Phase 5: Alignment with Practice Drills Plan

The [AI Practice Drills feature plan](AI_PRACTICE_DRILLS_PLAN.md) reuses the existing Workbook (`src/components/Editor3/Workbook.tsx`) with a stripped-down plugin set — no new workbook components are created. The `PracticeDrillDialog` wraps the Workbook in a dialog with progress/XP UI, and `buildDrillEditorState.ts` generates Lexical state from AI-generated blocks.

| Remediation item | Practice Drills dependency | Sequence |
|-----------------|--------------------------|----------|
| `InstructorDashboard` story (Phase 3) | Practice Drills adds "Practice Insights" section to this component | Write story **before** Practice Drills work starts — the story becomes a regression baseline |
| Dead code deletion (Phase 1) | No conflict | Do first — reduces noise in the codebase before new feature work |
| `Workbook/` stories (Phase 3) | Practice Drills reuse the Workbook directly — no new workbook components needed | Write stories before Practice Drills to establish baseline coverage |

---

## Execution Order

```
Phase 1 (Dead Code)        ← Do first, one PR, low risk
  │
Phase 2A-2B (Renames)      ← Second PR, mechanical changes
  │
Phase 3 Priority 1-2       ← Stories for InstructorDashboard, DictionaryEditor2,
  │                           QuestionEditor2, GlobalChat*, AvatarEditor
  │
Phase 3 Priority 3         ← Workbook sub-component stories
  │
Phase 3 Priority 4         ← Editor3 sub-component stories
  │
Phase 4                    ← Unit tests (ongoing, can interleave with feature work)
  │
Phase 5                    ← Practice Drills alignment (sequence stories before new features)
  │
```

Each phase is an independent PR. No phase blocks another except where noted in the Phase 5 sequencing tables above.
