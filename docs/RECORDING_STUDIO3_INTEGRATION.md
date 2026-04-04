# RecordingStudio3 Integration Plan

## Overview

Replace `RecordingStudioEnhanced` with `RecordingStudio3` in two workflows—**Dictionary** (vocab word audio) and **Editor** (conversation content)—using preset factories to auto-configure script data based on context.

## Current State

| Component                      | Location                                                   | Status                                                       |
| ------------------------------ | ---------------------------------------------------------- | ------------------------------------------------------------ | --- | ----------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------- |
| `RecordingStudio3`             | `src/components/RecordingStudio3.jsx`                      | Built, has stories, not wired into any live workflow         |
| `RecordingStudioEnhanced`      | `src/components/RecordingStudioEnhanced.jsx`               | Used in DictionaryEditor2 and EnhancedGenerators (partially) |
| `RecordingStudio2`             | `src/components/RecordingStudio2.jsx`                      | Used in AnswerComponent for student audio input              |
| `MicLevelIndicator`            | `src/components/Editor3/components/MicLevelIndicator.jsx`  | Only used in RS2                                             |
| FileManager2 RS3 import        | `src/components/Editor3/components/FileManager2.jsx:140`   | Dead import, never rendered                                  |
| EnhancedGenerators RS Enhanced | `src/components/Editor3/components/EnhancedGenerators.jsx` | Opens RS Enhanced but `onSave` is not wired—dead branch      |     | `RecordingStudio3Modal` | `src/components/RecordingStudio3Modal.jsx` | **NEW** — Fullscreen modal wrapper with confirmation preview and preset-aware save |

## Architecture

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

| Feature              | Implementation                                                                   |
| -------------------- | -------------------------------------------------------------------------------- |
| Fullscreen Dialog    | MUI `Dialog fullScreen` with `Slide` transition                                  |
| AppBar title bar     | Close (X), title, recording indicator chip, "Done" button                        |
| Confirmation preview | Summary of speakers, takes per line, missing-audio warnings                      |
| Save flow            | "Done" → preview → "Confirm & Save" → `onSave(payload)` → close                  |
| Cancel guard         | `window.confirm` if `hasChanges` is true                                         |
| Preset-aware save    | `buildSavePayload(scriptData, preset)` maps takes to Word fields or File records |

**Props:**

```typescript
interface RecordingStudio3ModalProps {
  open: boolean; // Dialog visibility
  onClose: () => void; // Called on cancel or after save
  onSave: (payload: SavePayload) => Promise<void>; // Called after confirm
  title: string; // AppBar title
  preset: "word" | "conversation" | "question"; // Determines save mapping
  scriptData: ScriptData; // From preset factory
  lockedTracks?: string[]; // Passed through to RS3
  gradeId?: string; // For S3 uploads
  nodeKey?: string; // File org key
  identityId?: object; // User identity
  readOnly?: boolean; // Disable editing
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

Replace `RecordingStudioEnhanced` with `RecordingStudio3Modal` in `WordDecoratorComponent`.

### Changes

1. **Imports**: Replace `RecordingStudioEnhanced` import with `RecordingStudio3Modal` + `createWordPreset`
2. **Preset computation**: In `WordDecoratorComponent`, compute the preset from the word data:
   ```js
   const preset = createWordPreset({ phrase, pronunciation, definition });
   ```
3. **Replace Dialog + RecordingStudioEnhanced** with a single `RecordingStudio3Modal`:
   ```jsx
   <RecordingStudio3Modal
     open={recordingDialogOpen}
     onClose={() => setRecordingDialogOpen(false)}
     onSave={handleStudioSave}
     title={`${t("dictionaryEditor.audioStudioTitle")} - ${phrase}`}
     preset="word"
     scriptData={preset.scriptData}
     lockedTracks={preset.lockedTracks}
     identityId={identityId}
   />
   ```
   No wrapping `<Dialog>` needed — the modal manages its own fullscreen Dialog.
4. **Save handler** (`handleStudioSave`): Receives the typed payload from the modal:

   ```js
   const handleStudioSave = async (payload) => {
     // payload.type === 'word'
     // payload.phraseAudio → [{ audioPath, waveformData }]
     // payload.definitionAudio → [{ audioPath, waveformData }]
     // payload.scriptData → full script for re-opening

     const audioPaths = payload.phraseAudio.map((a) => a.audioPath);
     const defPaths = payload.definitionAudio.map((a) => a.audioPath);
     const newAudio = deduplicateUrls([...audioUrls, ...audioPaths]);
     const newDefAudio = deduplicateUrls([...defAudioUrls, ...defPaths]);

     await onUpdate(
       wordId,
       {
         audio: newAudio,
         definitionAudio: newDefAudio,
         waveformData: payload.phraseAudio[0]?.waveformData,
         definitionWaveformData: payload.definitionAudio[0]?.waveformData,
         scriptData: JSON.stringify(payload.scriptData),
       },
       version,
     );
   };
   ```

5. Remove the old `<Dialog>` + `<DialogTitle>` + `<DialogContent>` wrapper entirely

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

Wire `RecordingStudio3Modal` into a working conversation recording flow, replacing the dead RS3 import.

### Changes

1. **Imports**: Replace dead `RecordingStudio3` import with `RecordingStudio3Modal` + `createConversationPreset`
2. **State**: Add `const [studioOpen, setStudioOpen] = useState(false)` in FileManager2
3. **Toolbar button**: Add "Record Conversation" button near the existing audio section:
   ```jsx
   <Button startIcon={<MicIcon />} onClick={() => setStudioOpen(true)}>
     Record Conversation
   </Button>
   ```
4. **Render the modal** (no wrapping Dialog needed):
   ```jsx
   <RecordingStudio3Modal
     open={studioOpen}
     onClose={() => setStudioOpen(false)}
     onSave={handleConversationSave}
     title={`Record Conversation — ${unit?.name || ""}`}
     preset="conversation"
     scriptData={createConversationPreset(unit?.name)}
     lockedTracks={[]}
     gradeId={currentGrade?.id}
     nodeKey={nodeKey}
     identityId={identityId}
   />
   ```
5. **Save handler** (`handleConversationSave`): Receives the typed payload:

   ```js
   const handleConversationSave = async (payload) => {
     // payload.type === 'conversation'
     // payload.audioFiles → [{ audioPath, waveformData, speakerName, text, type }]
     // payload.scriptData → full script JSON

     // 1. Create File records for each audio take
     const fileIds = [];
     for (const audio of payload.audioFiles) {
       const file = await client.models.File.create({
         name: `${audio.speakerName} - ${audio.text.slice(0, 30)}`,
         path: audio.audioPath,
         type: "audio/mpeg",
         waveformData: JSON.stringify(audio.waveformData),
       });
       fileIds.push(file.data.id);
     }

     // 2. Save scriptData as a JSON File record for re-editing
     const scriptFile = await client.models.File.create({
       name: `${unit?.name || "Conversation"} - Script`,
       type: "application/json",
       data: JSON.stringify(payload.scriptData),
     });

     // 3. Insert audio files into editor
     if (fileIds.length > 0) {
       editor.dispatchCommand(INSERT_PLAYLIST_COMMAND, fileIds);
     }
   };
   ```

6. **Confirmation preview**: Handled by `RecordingStudio3Modal` internally — shows summary before `onSave` fires

### Acceptance Criteria

- [ ] "Record Conversation" button visible in FileManager2 toolbar
- [ ] RS3Modal opens fullscreen with empty conversation preset (no locked tracks)
- [ ] Users can add speakers, dialogue lines, record/generate TTS
- [ ] "Done" opens confirmation preview with per-line take summary
- [ ] Confirming save creates File records and inserts playlist into editor
- [ ] Script data persisted as File record (`application/json`) for re-editing
- [ ] Cancel with unsaved changes shows warning before closing

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

**RS3Modal** is already created as a scaffolded component at `src/components/RecordingStudio3Modal.jsx` with the fullscreen Dialog, confirmation preview, and save payload builders. It needs the preset factory (Step A) and integration wiring (Steps D+E) to be functional.

---

## Decisions (Finalized)

| #   | Question                                                                | Decision                                                                                                                                                                                                    |
| --- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Should full `scriptData` JSON be persisted?                             | **Yes.** Save the entire script to the **Word model** (dictionary preset) or as a **File record** (`application/json`) for editor conversations. Enables re-opening and continuing edits.                   |
| 2   | When closing RS3 from the editor, auto-insert audio or let user choose? | **Show a confirmation with preview.** Display a summary of recorded takes/files before inserting into the editor or saving to the Word model.                                                               |
| 3   | Should RS3 replace `RecordingStudioEnhanced`?                           | **Yes for instructor workflows only.** RS3 replaces Enhanced in DictionaryEditor2 and FileManager2. **Do NOT use RS3 for student inputs** — keep RS2 in the workbook AnswerComponent for student recording. |
| 4   | Should `MicLevelIndicator` be added to RS3?                             | **Yes.** Add to the RS3 recording UI during active recording.                                                                                                                                               |

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
