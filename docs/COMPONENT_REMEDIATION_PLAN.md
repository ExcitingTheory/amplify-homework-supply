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

The [AI Practice Drills feature plan](AI_PRACTICE_DRILLS_PLAN.md) creates new components under `src/components/PracticeDrill/` and modifies several existing ones. Remediation work should be sequenced to avoid conflicts:

| Remediation item | Practice Drills dependency | Sequence |
|-----------------|--------------------------|----------|
| `InstructorDashboard` story (Phase 3) | Practice Drills adds "Practice Insights" section to this component | Write story **before** Practice Drills work starts — the story becomes a regression baseline |
| Dead code deletion (Phase 1) | No conflict | Do first — reduces noise in the codebase before new feature work |
| `Workbook/` stories (Phase 3) | Practice Drills reuses `AIFeedbackSnackbar`, `WorkbookProgress` in the drill workbook | Write stories **before** Practice Drills — validates these components work in isolation |
| Naming fixes (Phase 2) | No conflict | Do anytime |

---

## Phase 6: ScreenplayEditor Redesign + Horizontal RS3 Timeline

The existing `ScreenplayEditor.jsx` is incomplete (its Lexical node, plugin, and theme dependencies don't exist). It will be **rewritten from scratch** with a fundamentally different architecture — a chat-driven AI screenplay generator that feeds `RecordingStudio3`'s `scriptData` format.

### Current State

- `RecordingStudio3/ScreenplayEditor.jsx` — imports 3 missing modules (`ScreenplayParagraphNode`, `ScreenplayFormatPlugin`, `ScreenplayTheme`), uses a full rich-text Lexical surface with custom paragraph types. **Cannot render.**
- `RecordingStudio3.jsx` — working component with vertical timeline (stacked `Paper` cards), speakers panel, properties panel. Has `direction` and `emotion` fields per dialogue line.

### New Architecture

Replace the broken rich-text screenplay editor with a **two-panel layout**: an editable Lexical Fountain editor on top, and a chat-like AI prompt input at the bottom. Manual edits in the Fountain editor re-parse into RS3 `scriptData` on every change (debounced), giving instructors direct control over speakers, dialogue, direction notes, and timing.

```
┌─────────────────────────────────────────────────────────────────┐
│  Screenplay: [Title]                           [Export] [Done] │
│─────────────────────────────────────────────────────────────────│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   SCREENPLAY EDITOR                     │    │
│  │                   (Lexical, editable Fountain)            │    │
│  │                                                         │    │
│  │  ## INT. COFFEE SHOP - MORNING                          │    │
│  │                                                         │    │
│  │  **NARRATOR** *(warm, inviting)*                        │    │
│  │  > Welcome to our lesson on greetings.                  │    │
│  │                                                         │    │
│  │  **AKIKO** *(cheerful, native speaker)*                 │    │
│  │  > こんにちは！ はじめまして。                              │    │
│  │  > *(Direction: Bow slightly, formal tone)*             │    │
│  │                                                         │    │
│  │  **NARRATOR**                                           │    │
│  │  > That means "Hello! Nice to meet you."               │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 💬 Describe what you want...                            │    │
│  │                                                    [⏎]  │    │
│  └─────────────────────────────────────────────────────────┘    │
│  Examples: "Add a scene where the student practices ordering    │
│  coffee" · "Make Akiko speak more casually" · "Add direction    │
│  notes for the narrator to pause between sentences"             │
└─────────────────────────────────────────────────────────────────┘
```

### Component: `ScreenplayEditor` (rewrite)

**Two zones:**

| Zone | Implementation | Purpose |
|------|---------------|----------|
| **Fountain editor** | Editable Lexical editor with Fountain syntax highlighting (character names, parentheticals, dialogue, and `[[notes]]` styled distinctly). On every change (debounced 500ms), the plain text is re-parsed via `parseFountainToScriptData()` and the resulting `scriptData` is pushed to RS3, updating speakers, dialogue lines, direction notes, and timing on the horizontal timeline. | Gives instructors direct manual control over the screenplay. Scene headings, characters, dialogue, and direction notes are visually distinct via CSS. Uses `fountain-js` to parse tokens for both rendering and scriptData generation. |
| **Prompt input** | Small Lexical editor (single-line or multi-line) at the bottom, like ChatSidebar's input | User types natural language prompts. Press Enter (or click send) to submit. AI generates/updates the Fountain screenplay. |

**No custom Lexical nodes required.** The Fountain text is plain text in the editor with CSS-based syntax highlighting applied via a decorator plugin that matches Fountain patterns (scene headings, characters, parentheticals, notes). Edits flow **bidirectionally**: manual text changes re-parse into RS3 `scriptData`, and AI-generated Fountain text replaces the editor content. This eliminates the need for `ScreenplayParagraphNode`, `ScreenplayFormatPlugin`, and `ScreenplayTheme`.

### Fountain Screenplay Format

The AI generates and the display surface renders standard [Fountain format](https://fountain.io/syntax):

```fountain
Title: Japanese Greetings Lesson
Author: Instructor
Date: 2026-04-17

INT. COFFEE SHOP - MORNING

NARRATOR
(warm, inviting)
Welcome to our lesson on Japanese greetings.
[[Slower pace. Clear enunciation.]]

AKIKO
(cheerful, native speaker)
こんにちは！ はじめまして。
[[Bow slightly. Formal register. Pause 1s after each phrase.]]

NARRATOR
That means "Hello! Nice to meet you."
[[Emphasize the English translation.]]

===

INT. COFFEE SHOP - LATER

AKIKO
(casual, friendly)
コーヒーをください。
[[Gesture toward menu. Relaxed tone.]]
```

**Fountain syntax used:**
- `INT. SCENE` / `EXT. SCENE` — scene headings (auto-detected by prefix)
- `CHARACTER` — all-caps line before dialogue
- `(parenthetical)` — character description/emotion on its own line
- Plain text after character — dialogue lines
- `[[double brackets]]` — Fountain notes, used for AI/voice direction
- `===` — scene breaks
- Title page key-value pairs at top of file

### Direction Notes for AI / Voice Actors

Direction uses Fountain's native `[[notes]]` syntax. Notes are **co-located with the dialogue they apply to** — placed on the line after dialogue text.

**What direction notes contain:**
- Pacing: `[[Pause 2s before speaking]]`, `[[Rapid-fire delivery]]`
- Emotion/tone: `[[Whispered, conspiratorial]]`, `[[Excited but trying to stay calm]]`
- Physical context: `[[Pointing at the board]]`, `[[Walking between desks]]`
- TTS hints: `[[Emphasize the third syllable]]`, `[[Formal register]]`
- Pronunciation: `[[Elongate vowels]]`, `[[Rising intonation on final word]]`

When parsed into RS3 `scriptData`, `[[notes]]` map to the `direction` field on each dialogue entry, so TTS generation can include them as context.

### AI Generation Flow

1. User types prompt: *"Create a 2-minute lesson introducing Japanese greetings with a narrator and a native speaker named Akiko"*
2. Client sends prompt + current Fountain text (if any) to Lambda
3. Lambda calls GPT-4 with:
   - System prompt defining Fountain format rules + `[[notes]]` convention
   - Current Fountain text (for edits/additions)
   - User prompt
4. GPT-4 returns updated Fountain text
5. Client replaces the display surface content with the new Fountain text
6. Client also parses Fountain → RS3 `scriptData` (see below)

**Subsequent prompts** are edits: *"Make the narrator more energetic"*, *"Add a scene where they practice at a train station"*, *"Add direction for Akiko to speak more slowly"*

### Parsing Fountain → RS3 `scriptData`

New utility: `parseFountainToScriptData(fountain: string): ScriptData`

Uses `fountain-js` npm package to parse Fountain into a token stream, then maps to RS3 format:

```typescript
interface ScriptData {
  metadata: {
    title: string          // from Fountain title page
    scene: string          // from first scene heading
    date: string           // from Fountain title page
    version: string
  }
  speakers: Record<string, {
    name: string
    voice: string          // default 'alloy', user picks in RS3 (stored in File.metadata)
    description: string    // from first parenthetical after character name
  }>
  dialogue: Array<{
    id: number
    speaker: string        // key into speakers
    text: string           // dialogue text
    timing: { start: number; end: number }  // calculated from estimated durations
    direction: string      // extracted from [[notes]]
    emotion: string        // extracted from (parenthetical)
    takes: []
    activeTakeIndex: null
  }>
}
```

**Parsing steps:**
1. Parse Fountain text with `fountain-js` → token stream (scene_heading, character, parenthetical, dialogue, note, etc.)
2. Walk tokens: each `character` token starts a new speaker; collect subsequent `parenthetical`, `dialogue`, and `note` tokens
3. Build `speakers` map from unique character names + first parenthetical as description
4. Build `dialogue` array: each dialogue token becomes an entry; adjacent `note` tokens → `direction` field
5. Estimate timing from text length (~150 words/minute for speech)
6. Build sequential timing offsets so dialogue entries stack along a timeline
7. Voice assignments loaded from `File.metadata` (not in the Fountain text itself)

### RecordingStudio3 — Horizontal Timeline Redesign

The current RS3 has a **vertical** timeline (stacked `Paper` cards in a column). Redesign to a **horizontal** timeline where dialogue cards are positioned at their `timing.start` offset along a scrollable horizontal track.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ◀ ▶ ⏺  0:00              0:30              1:00              1:30     │
│  ─────────┼─────────────────┼─────────────────┼─────────────────┼────── │
│                                                                         │
│  NARRATOR │▓▓▓▓▓▓▓▓▓▓▓│                      │▓▓▓▓▓▓▓▓│               │
│           │ Welcome to │                      │ That    │               │
│           │ our lesson │                      │ means...│               │
│           │ *warm*     │                      │         │               │
│                                                                         │
│  AKIKO    │            │▓▓▓▓▓▓▓▓▓▓▓▓▓│       │         │▓▓▓▓▓▓▓▓▓▓│  │
│           │            │ こんにちは！   │       │         │ コーヒーを │  │
│           │            │ *bow, formal* │       │         │ *casual*   │  │
│           │            │               │       │         │            │  │
│  ─────────┼─────────────────┼─────────────────┼─────────────────┼────── │
│  ◀═══════════════════════════════════════════════════════════════════▶   │
└──────────────────────────────────────────────────────────────────────────┘
```

**Timeline features:**
- Each speaker gets a **horizontal track** (row)
- Dialogue cards are positioned at `timing.start` and span `timing.end - timing.start`
- Cards show: truncated text, direction note (italic), emotion chip, waveform if take exists
- Click a card → opens the properties panel (text, direction, emotion, takes)
- Playhead line (vertical) shows current playback position
- Horizontal scroll for longer scripts; zoom in/out with pinch or `Ctrl+scroll`
- Transport controls: play all (sequential by timing), stop, record
- Cards are **draggable** left/right to adjust timing
- Direction notes visible as a subtle italic sub-line on each card

**Implementation:** Replace the current vertical `Box` timeline section in `RecordingStudio3.jsx` with a new `HorizontalTimeline` sub-component that uses absolute positioning within a scrollable container. Each track row is a flex container; cards are absolutely positioned based on `timing.start / totalDuration * containerWidth`.

### Updated RS3 Layout

The three-panel layout changes:

| Before (current) | After (redesign) |
|-------------------|------------------|
| Left: Script list (vertical) | Top-left: Editable Fountain screenplay editor |
| Center-top: Properties panel | Top-right: Speakers panel (same as current right panel) |
| Center-bottom: Vertical timeline | Bottom: Horizontal timeline spanning full width |
| Right: Speakers panel | Properties panel: opens as overlay/drawer when a card is clicked |

```
┌─────────────────────────────────────────────────────────────────┐
│  [Title]                              [Batch TTS] [Export]     │
│─────────────────────────────────────────────────────────────────│
│                                        │                       │
│  SCREENPLAY EDITOR                     │   SPEAKERS PANEL      │
│  (editable Lexical Fountain)           │   ┌───────────────┐   │
│                                        │   │ NARRATOR       │   │
│  ## INT. COFFEE SHOP                   │   │ voice: alloy   │   │
│  **NARRATOR** *(warm)*                 │   │ warm, inviting │   │
│  > Welcome to our lesson...            │   ├───────────────┤   │
│                                        │   │ AKIKO          │   │
│  ┌─────────────────────────────────┐   │   │ voice: nova    │   │
│  │ 💬 Add a pause after each...   │   │   │ native speaker │   │
│  └─────────────────────────────────┘   │   └───────────────┘   │
│────────────────────────────────────────────────────────────────│
│  ◀ ▶ ⏺   0:00         0:30         1:00         1:30         │
│  ────────┼──────────────┼──────────────┼──────────────┼─────  │
│  NARRATOR│▓▓▓▓▓▓▓▓▓│                   │▓▓▓▓▓▓▓│             │
│  AKIKO   │         │▓▓▓▓▓▓▓▓▓▓▓│      │       │▓▓▓▓▓▓▓▓│    │
│  ────────┼──────────────┼──────────────┼──────────────┼─────  │
└─────────────────────────────────────────────────────────────────┘
```

### File Structure — New/Modified Files

```
src/components/RecordingStudio3/
  ScreenplayEditor.jsx          # REWRITE — editable Fountain editor + AI prompt input, bidirectional sync to RS3 scriptData
  HorizontalTimeline.tsx        # NEW — horizontal scrollable timeline with track rows
  TimelineCard.tsx              # NEW — individual dialogue card on the timeline
  parseFountainToScriptData.ts  # NEW — Fountain → ScriptData parser (wraps fountain-js)
  ScreenplayEditor.stories.tsx  # NEW — Storybook stories
  HorizontalTimeline.stories.tsx # NEW — timeline stories
```

**Modified files:**

| File | Change |
|------|--------|
| `src/components/RecordingStudio3.jsx` | Replace vertical timeline section with `HorizontalTimeline`; restructure layout to top (screenplay+speakers) / bottom (timeline) |
| `src/components/RecordingStudio3.stories.jsx` | Add stories for screenplay-driven flow |
| `src/utils/recordingStudioPresets.js` | Add `createScreenplayPreset(fountain)` factory that calls `parseFountainToScriptData` |
| `src/components/Editor3/plugins/DragDropPastePlugin.js` | Add `text/x-fountain` to `ACCEPTABLE_FILE_TYPES` |
| `src/components/Editor3/components/FileManager2.jsx` | Add `scripts` category to file organization; route `text/x-fountain` files to it |
| `src/utils/fileUploadUtils.jsx` | Add `text/x-fountain` to recognizable types if needed |

### Script File Type: `text/x-fountain`

Scripts are stored as `File` model records with MIME type `text/x-fountain` using the industry-standard [Fountain screenplay format](https://fountain.io/syntax). The file content is **plain Fountain text** — not a JSON envelope. RS3 `scriptData` is derived at load time via `parseFountainToScriptData()`. See full spec in [RECORDING_STUDIO3_INTEGRATION.md](RECORDING_STUDIO3_INTEGRATION.md#script-file-type-textx-fountain).

**Storage path:** `public/scripts/{fileId}.fountain`

**Save flow (ScreenplayEditor → File):**
1. User finishes editing screenplay via prompt input
2. Client saves the Fountain plain text to S3
3. Create/update `File` record with `mimeType: 'text/x-fountain'`
4. Voice assignments + prompt history stored in `File.metadata` JSON field
5. Create `UnitFile` join if linked to a unit

**Load flow (File → ScreenplayEditor + RS3):**
1. Open `.fountain` file from FileManager2's Scripts category
2. Fetch plain text from S3
3. Render Fountain text in ScreenplayEditor display surface
4. Parse Fountain → RS3 `scriptData` via `parseFountainToScriptData()`
5. Read voice assignments + prompt history from `File.metadata`

**FileManager2 categorization:** Files with `mimeType === 'text/x-fountain'` appear under a **"Scripts"** section alongside images, audio, documents, and video.

### Dependencies Removed

The rewrite eliminates the need for:
- `RecordingStudio3/nodes/ScreenplayParagraphNode` (never existed)
- `RecordingStudio3/plugins/ScreenplayFormatPlugin` (never existed)
- `RecordingStudio3/theme/ScreenplayTheme` (never existed)

The new approach uses only standard Lexical markdown nodes — no custom screenplay nodes.

### Sequencing with Other Phases

| Dependency | Notes |
|-----------|-------|
| Phase 1 (Dead Code) | Do first — but **skip** `ScreenplayEditor.jsx` deletion |
| Phase 3 (Stories) | ScreenplayEditor + HorizontalTimeline stories are part of this phase |
| Practice Drills | No dependency — RS3 redesign is independent |
| RS3 Integration Plan | The horizontal timeline and screenplay flow supersede the current integration plan's UI assumptions; `createWordPreset` / `createConversationPreset` still work since they produce `scriptData`. **Note**: RS3 is the instructor tool; `RecordingStudioEnhanced` remains the end-user (student) recording surface and is not affected by this redesign. |

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
Phase 6                    ← ScreenplayEditor rewrite + HorizontalTimeline + RS3 layout
                              (can start after Phase 1; independent of Phases 2-5)
```

Each phase is an independent PR. No phase blocks another except where noted in the Phase 5/6 sequencing tables above.
