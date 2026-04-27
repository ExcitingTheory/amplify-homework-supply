# RecordingStudio3 Integration Plan

## Overview

Wire `RecordingStudio3` into **instructor** workflows—**Dictionary** (vocab word audio) and **Editor** (conversation content)—using preset factories to auto-configure script data based on context.

**Important**: `RecordingStudioEnhanced` is the **end-user (student/learner)** recording surface and is **not being replaced**. `RecordingStudio3` is the **instructor** tool for scripted, multi-speaker dialogue recording and TTS generation. They serve different audiences.

## Current State

| Component | Location | Audience | Status |
|-----------|----------|----------|--------|
| `RecordingStudio3` | `src/components/RecordingStudio3.jsx` | **Instructors** | Built, has stories, not wired into any live workflow |
| `RecordingStudioEnhanced` | `src/components/RecordingStudioEnhanced.jsx` | **End users (students/learners)** | Used in DictionaryEditor2 and EnhancedGenerators (partially) |
| `RecordingStudio2` | `src/components/RecordingStudio2.jsx` | **End users (students/learners)** | Used in AnswerComponent for student audio input |
| `MicLevelIndicator` | `src/components/Editor3/components/MicLevelIndicator.jsx` | — | Only used in RS2 |
| FileManager2 RS3 import | `src/components/Editor3/components/FileManager2.jsx:140` | — | Dead import, never rendered |
| EnhancedGenerators RS Enhanced | `src/components/Editor3/components/EnhancedGenerators.jsx` | — | Opens RS Enhanced but `onSave` is not wired—dead branch |

## Architecture

### Script File Type: `text/x-fountain`

Scripts are stored as **File** records with MIME type `text/x-fountain` using the industry-standard [Fountain screenplay format](https://fountain.io/syntax). The file content is **plain text** — no JSON envelope.

**Fountain syntax mapping:**

| Screenplay element | Fountain syntax | Example |
|-------------------|----------------|----------|
| Scene heading | Auto-detected `INT.`/`EXT.` prefix (or force with `.`) | `INT. COFFEE SHOP - MORNING` |
| Character | ALL CAPS line before dialogue | `NARRATOR` |
| Parenthetical | `(text)` on its own line after character | `(warm, inviting)` |
| Dialogue | Plain text after character/parenthetical | `Welcome to our lesson on greetings.` |
| Action/description | Plain paragraph | `Akiko bows slightly.` |
| Direction notes | `[[double brackets]]` (Fountain notes) | `[[Pause 2s. Formal register. Emphasize third syllable.]]` |
| Scene break | `===` | `===` |
| Transition | `CUT TO:` or `> FADE OUT` | `CUT TO:` |
| Title page | `Key: Value` pairs at top of file | `Title: Japanese Greetings` |

**Example `.fountain` file:**

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

**File storage pattern:**

| Field | Value |
|-------|-------|
| `mimeType` | `text/x-fountain` |
| `path` | `public/scripts/{fileId}.fountain` |
| `name` | `{title}.fountain` |
| `level` | `PUBLIC` (instructor-created content) |

**Why standard Fountain:**
- Industry-standard format — parsers exist on npm (`fountain-js`)
- Interoperable with Final Draft, Highland, WriterSolo, etc.
- `[[notes]]` are a native Fountain concept — perfect for AI/voice direction
- Plain text is diffable, versionable, and human-readable
- No custom format to maintain

**Derived data (not stored in the file):**
- `scriptData` (RS3 format) is parsed from Fountain at load time via `parseFountainToScriptData()`
- `promptHistory` is stored on the `File` model's `metadata` JSON field if needed for AI continuation
- TTS voice assignments are stored on the `File` model's `metadata` JSON field (Fountain has no voice concept)

**FileManager2 integration:** Script files appear under a new **"Scripts"** category alongside images, audio, documents, and video. They are openable in the ScreenplayEditor + RS3 horizontal timeline view.

```
┌─────────────────────────────────────────────────────────┐
│                    Preset Factory                        │
│  createWordPreset(word)   createConversationPreset()     │
│  createQuestionPreset(q)                                 │
└──────────┬──────────────────────────┬───────────────────┘
           │                          │
           ▼                          ▼
┌─────────────────────┐   ┌─────────────────────────────┐
│  DictionaryEditor2  │   │  FileManager2 (Editor3)     │
│  ┌───────────────┐  │   │  ┌───────────────────────┐  │
│  │ RS3Modal      │  │   │  │ RS3Modal               │  │
│  │ (fullscreen)  │  │   │  │ (fullscreen)           │  │
│  │ preset=word   │  │   │  │ preset=conversation    │  │
│  │ locked tracks │  │   │  │ no locked tracks       │  │
│  └───────┬───────┘  │   │  └──────────┬────────────┘  │
│          │          │   │             │                │
│   onSave(payload)   │   │      onSave(payload)        │
│          │          │   │             │                │
│          ▼          │   │             ▼                │
│  Map takes to:      │   │  Create File records        │
│  • Word.audio[]     │   │  INSERT_PLAYLIST_COMMAND    │
│  • Word.defAudio[]  │   │  (embed in Lexical editor)  │
│  • Word.waveform    │   │                             │
│  • Word.scriptData  │   │  Save scriptData as File    │
└─────────────────────┘   └─────────────────────────────┘
```

### RS3Modal Component (`src/components/RecordingStudio3Modal.jsx`)

Shared fullscreen modal wrapper that hosts RecordingStudio3 in both workflows.

**RS3 has NO internal save/close UI** — it is purely reactive (`onScriptChange` fires on every mutation). The modal adds:

| Feature | Implementation |
|---------|----------------|
| Fullscreen Dialog | MUI `Dialog fullScreen` with `Slide` transition |
| AppBar title bar | Close (X), title, recording indicator chip, "Done" button |
| Confirmation preview | Summary of speakers, takes per line, missing-audio warnings |
| Save flow | "Done" → preview → "Confirm & Save" → `onSave(payload)` → close |
| Cancel guard | `window.confirm` if `hasChanges` is true |
| Preset-aware save | `buildSavePayload(scriptData, preset)` maps takes to Word fields or File records |

**Props:**

```typescript
interface RecordingStudio3ModalProps {
  open: boolean;                          // Dialog visibility
  onClose: () => void;                    // Called on cancel or after save
  onSave: (payload: SavePayload) => Promise<void>;  // Called after confirm
  title: string;                          // AppBar title
  preset: 'word' | 'conversation' | 'question';     // Determines save mapping
  scriptData: ScriptData;                 // From preset factory
  lockedTracks?: string[];                // Passed through to RS3
  gradeId?: string;                       // For S3 uploads
  nodeKey?: string;                       // File org key
  identityId?: object;                    // User identity
  readOnly?: boolean;                     // Disable editing
}
```

**Save Payload by preset:**

```typescript
// preset === 'word'
{
  type: 'word',
  phraseAudio: [{ audioPath, waveformData }],
  definitionAudio: [{ audioPath, waveformData }],
  scriptData: { ... }
}

// preset === 'conversation' | 'question'
{
  type: 'conversation',
  audioFiles: [{ audioPath, waveformData, speakerName, text, type }],
  scriptData: { ... }
}
```

---

## Step A: Create Preset Factory Utility

**File**: `src/utils/recordingStudioPresets.js` (new)

Three factory functions that return `{ scriptData, lockedTracks }` for RecordingStudio3.

### `createWordPreset(word)`

Generates a two-track script from a Word model object.

- **Input**: `{ phrase, pronunciation, definition }` (from Word model)
- **Speakers**:
  - `phrase_track` — name: `"Phrase (${word.phrase})"`, voice chosen by language detection heuristic
  - `definition_track` — name: `"Definition"`, voice: `alloy`
- **Dialogue**: two lines — phrase pronunciation, then definition reading
- **Locked tracks**: `['phrase_track', 'definition_track']`
- **Metadata title**: `"${word.phrase} — Vocabulary"`

### `createConversationPreset(title?, speakers?)`

Generates an open-ended conversation script for the editor.

- **Input**: optional title string, optional initial speakers array
- **Speakers**: empty `{}` or seeded from provided names
- **Dialogue**: empty `[]` — user builds from scratch
- **Locked tracks**: `[]` — fully editable
- **Metadata title**: provided title or `"New Conversation"`

### `createQuestionPreset(question)`

Generates a two-track script from a Question model object.

- **Input**: `{ prompt, correctAnswer }` (from Question model)
- **Speakers**:
  - `prompt_track` — name: `"Question Prompt"`, voice: `fable`
  - `answer_track` — name: `"Answer"`, voice: `nova`
- **Dialogue**: question text + answer text
- **Locked tracks**: `['prompt_track', 'answer_track']`

### Acceptance Criteria

- [ ] Each factory returns `{ scriptData, lockedTracks }` matching RecordingStudio3 prop shapes
- [ ] `scriptData` includes `metadata`, `speakers`, and `dialogue` with proper structure
- [ ] Dialogue entries have `id`, `speaker`, `text`, `timing`, `direction`, `emotion`, `takes: []`, `activeTakeIndex: null`

---

## Step B: Unit Tests for Presets

**File**: `__tests__/recordingStudioPresets.test.js` (new)

- [ ] `createWordPreset` returns correct speakers, dialogue, locked tracks from a Word object
- [ ] `createWordPreset` handles missing fields gracefully (no pronunciation, empty definition)
- [ ] `createConversationPreset` returns empty dialogue and no locked tracks
- [ ] `createConversationPreset` seeds speakers when provided
- [ ] `createQuestionPreset` returns correct speakers, dialogue, locked tracks
- [ ] All presets produce valid `scriptData` structure (metadata, speakers, dialogue arrays)

---

## Step C: Update Stories to Use Preset Factory

**File**: `src/components/RecordingStudio3.stories.jsx` (edit)

- [ ] Import preset factory functions
- [ ] Replace inline `mockWordScript` with `createWordPreset({ phrase: 'こんにちは', pronunciation: 'konnichiwa', definition: 'Hello. Good afternoon.' })`
- [ ] Replace inline `mockQuestionScript` with `createQuestionPreset({ prompt: 'What is the capital of France?', correctAnswer: 'Paris' })`
- [ ] Add a new story: `ConversationPreset` using `createConversationPreset('Coffee Shop')`
- [ ] Keep the existing `mockConversationScript` and `mockScriptWithTakes` stories as manual/advanced examples
- [ ] Verify all stories render correctly in Storybook

---

## Step D: Dictionary Integration

**File**: `src/components/DictionaryEditor2.jsx` (edit)

Replace `RecordingStudioEnhanced` with `RecordingStudio3` in `WordDecoratorComponent`.

### Changes

1. **Imports**: Replace `RecordingStudioEnhanced` import with `RecordingStudio3` + `createWordPreset`
2. **Preset computation**: In `WordDecoratorComponent`, compute the preset from the word data:
   ```js
   const preset = createWordPreset({ phrase, pronunciation, definition });
   ```
3. **Dialog content**: Replace `<RecordingStudioEnhanced onSave={...} onCancel={...} />` with:
   ```jsx
   <RecordingStudio3
     scriptData={preset.scriptData}
     lockedTracks={preset.lockedTracks}
     identityId={identityId}
     onUpdateData={handleStudioUpdate}
   />
   ```
4. **Save handler** (`handleStudioUpdate`): On `TAKE_ADDED` events:
   - `phrase_track` takes → append `audioPath` to `Word.audio[]`
   - `definition_track` takes → append `audioPath` to `Word.definitionAudio[]`
   - Extract `waveformData` from takes → `Word.waveformData` / `Word.definitionWaveformData`
5. **Save & Close** action:
   - Shows a **confirmation preview** summarizing takes per track before saving
   - Collects active takes from `phrase_track` dialogue → uploads/maps to `Word.audio`
   - Collects active takes from `definition_track` dialogue → maps to `Word.definitionAudio`
   - Stores `waveformData` from takes → `Word.waveformData` / `Word.definitionWaveformData`
   - **Persists full `scriptData` JSON** to a new field on the Word model (e.g., `Word.scriptData`) for re-opening
   - Calls `onUpdate(wordId, { audio, definitionAudio, waveformData, definitionWaveformData, scriptData }, version)`
6. **Dialog sizing**: Use `fullScreen` Dialog — RS3's two-panel layout needs the full viewport

### Acceptance Criteria

- [ ] Opening audio studio on a VocabularyCard opens RS3 with word data pre-populated
- [ ] Phrase track and definition track are locked (cannot rename/delete)
- [ ] TTS generation works for both tracks using preset voices
- [ ] Human recording uploads to S3 and maps to correct Word field
- [ ] Closing dialog saves audio paths to Word model
- [ ] Existing word audio is preserved (deduplication)

---

## Step E: Editor Integration

**File**: `src/components/Editor3/components/FileManager2.jsx` (edit)

Wire the existing dead `RecordingStudio3` import into a working conversation recording flow.

### Changes

1. **State**: Add `const [studioOpen, setStudioOpen] = useState(false)` in FileManager2
2. **Toolbar button**: Add "Record Conversation" button near the existing audio section:
   ```jsx
   <Button startIcon={<MicIcon />} onClick={() => setStudioOpen(true)}>
     Record Conversation
   </Button>
   ```
3. **Fullscreen Dialog**: Render RS3 in a fullscreen MUI Dialog:
   ```jsx
   <Dialog open={studioOpen} onClose={() => setStudioOpen(false)} fullScreen>
     <DialogTitle>
       Record Conversation
       <IconButton onClick={() => setStudioOpen(false)}><CloseIcon /></IconButton>
     </DialogTitle>
     <DialogContent sx={{ p: 0 }}>
       <RecordingStudio3
         scriptData={createConversationPreset(unit?.name)}
         lockedTracks={[]}
         gradeId={currentGrade?.id}
         nodeKey={nodeKey}
         identityId={identityId}
         onUpdateData={handleConversationUpdate}
       />
     </DialogContent>
   </Dialog>
   ```
4. **On close / "Done"**: For each dialogue line with an active take that has `audioPath`:
   - Create a `File` model record (type `audio/mpeg`, path from take)
   - Create `UnitFile` join record
   - Dispatch `INSERT_PLAYLIST_COMMAND` with collected file IDs to embed in editor
5. **Persist script**: Store the Fountain screenplay as a `File` record (`text/x-fountain`, linked via `UnitFile`) so the conversation can be re-opened for further editing. Voice assignments and prompt history stored in the File's `metadata` JSON field.
6. **Confirmation preview**: On "Done", show a confirmation dialog summarizing recorded takes, speakers, and audio files before inserting into editor

### Acceptance Criteria

- [ ] "Record Conversation" button visible in FileManager2 toolbar
- [ ] RS3 opens with empty conversation preset (no locked tracks)
- [ ] Users can add speakers, dialogue lines, record/generate TTS
- [ ] On close, audio takes are saved as File model records
- [ ] Audio is insertable into editor via playlist command
- [ ] Script data persisted as File record (`text/x-fountain`) for re-editing
- [ ] Confirmation preview shown before inserting/saving
- [ ] RS3 opens in fullscreen Dialog with proper close/done actions

---

## Step F: Clean Up EnhancedGenerators

**File**: `src/components/Editor3/components/EnhancedGenerators.jsx` (edit)

- [ ] Remove the dead `RecordingStudioEnhanced` rendering branch in `EnhancedAudioGenerator`
- [ ] Remove or redirect the "Open Recording Studio" button to open the new RS3 dialog in FileManager2 instead
- [ ] Remove `RecordingStudioEnhanced` import if no longer used
- [ ] Verify RS2 remains untouched in AnswerComponent for student workbook inputs

---

## Step G: Add MicLevelIndicator to RecordingStudio3

**File**: `src/components/RecordingStudio3.jsx` (edit)

- [ ] Import `MicLevelIndicator` from `Editor3/components/MicLevelIndicator`
- [ ] During active recording, create an `AnalyserNode` from the `MediaRecorder`'s audio stream
- [ ] Render `<MicLevelIndicator analyser={recordingAnalyser} />` next to the record button
- [ ] Clean up analyser on recording stop

---

## Implementation Order

```
Step A (preset factory) ──► Step B (tests)
                         ──► Step C (stories)
                         ──► Step D (dictionary) ──► Step F (cleanup)
                         ──► Step E (editor)     ──► Step F (cleanup)
                                                 ──► Step G (mic indicator)
```

Steps A and B can be done first without touching any existing components. Steps C–E depend on A. Step F depends on D+E. Step G is independent and can be done anytime.

---

## Decisions (Finalized)

| # | Question | Decision |
|---|----------|----------|
| 1 | Should full `scriptData` JSON be persisted? | **No — store Fountain plain text.** The `.fountain` file is the source of truth. `scriptData` is derived at load time via `parseFountainToScriptData()`. Voice assignments and prompt history go in the File model's `metadata` JSON field. For dictionary presets, also save to the **Word model** `scriptData` field. |
| 2 | When closing RS3 from the editor, auto-insert audio or let user choose? | **Show a confirmation with preview.** Display a summary of recorded takes/files before inserting into the editor or saving to the Word model. |
| 3 | Should RS3 replace `RecordingStudioEnhanced`? | **No.** `RecordingStudioEnhanced` is the **end-user (student/learner)** recording surface and remains as-is. RS3 is the **instructor** tool for scripted, multi-speaker dialogue recording. RS2 stays in the workbook AnswerComponent for student recording. |
| 4 | Should `MicLevelIndicator` be added to RS3? | **Yes.** Add to the RS3 recording UI during active recording. |

## UI Orientation Decision

**Chosen: Fullscreen Dialog** (opened from FileManager2 toolbar or DictionaryEditor2 card action)

Rationale:
- RS3 has an internal two-panel layout (350px Script Panel + flex Recording Panel) that needs ~800px+ to be usable
- The editor's left/right drawers max at ~600-700px when manually resized — too narrow for RS3's layout
- Follows the existing `EnhancedGenerators` → `RecordingStudioEnhanced` fullscreen precedent
- A `Dialog fullScreen` gives RS3 the full viewport, matching its `height: 100vh` expectation
- Clear entry/exit: toolbar button opens it, "Done" button triggers the confirmation preview and closes
- Does not disrupt the editor's 3-column permanent drawer layout
- On mobile, fullscreen is the only viable option anyway

Alternative considered but rejected:
- **Left drawer tab**: drawer width is too constrained for RS3's two-panel layout, even when resized
- **Right drawer tab**: already occupied by ChatSidebar; RS3 is a focused task, not an ambient tool
- **Persistent side panel**: RS3 is a session-based tool (open → record → save → close), not something users leave open while editing
