# RecordingStudio3 Audio Processing Plan

> **Status**: Planning  
> **Components**: `RecordingStudio3`, `AudioWaveformPlayer`, `RecordingStudio3/AudioFilterPanel`  
> **Dependencies**: `@jitsi/rnnoise-wasm` (ML noise suppression) + Web Audio API (EQ/dynamics)

Three related features that share the same Web Audio infrastructure:

1. **Filter Panel** — listener-side audio processing. Applies preset EQ/dynamics filters to *existing takes* so users can hear cleaned-up audio before deciding to keep or re-record.
2. **Pre-Submission Cleanup** — recorder-side audio processing. Runs a cleanup chain on the captured blob *before* it is uploaded to S3, so the stored take is already clean.
3. **Versioned Audio & Take History** — every re-recording uploads to a new versioned S3 key instead of overwriting. A history dropdown per take lets users roll back to any previous version; the `File` record always reflects the current active key.

---

## 1. Filter Panel (Listen with Filters)

### Goal

Allow instructors and learners to audition a take through a set of optional audio processing presets — noise gate, pop reduction, EQ — without modifying the original file. A preview of what the audio *would* sound like after applying these filters.

### How It Works

When a user activates filters and presses Play on a take, instead of loading the raw URL into the shared `HTMLAudioElement`, the player:

1. Fetches the audio as an `ArrayBuffer`
2. Decodes it via `AudioContext.decodeAudioData()`
3. Builds a filter node chain in an `OfflineAudioContext`
4. Renders the chain synchronously (faster than real-time)
5. Encodes the result to a Blob URL and plays that through the existing shared player

Original S3 file is never modified.

### Filter Presets

| Preset | Implementation | Targets |
|--------|---------------|---------|
| **De-rumble** | `BiquadFilterNode` — highpass @ 80 Hz, Q 0.7 | Desk/keyboard vibration, mic handling noise, low-end hum |
| **Pop filter** | `BiquadFilterNode` — highpass @ 120 Hz, Q 1.2 + `DynamicsCompressorNode` (threshold -30, ratio 8, attack 0.003) | Plosive blasts ("p", "b") from close-mic recording |
| **Noise cancel** | `@jitsi/rnnoise-wasm` via `AudioWorkletNode` — RNNoise ML model (Xiph/Mozilla) | Background noise, fans, AC, keyboard, street noise — anything that isn't speech |
| **Compress** | `DynamicsCompressorNode` — threshold -24, knee 10, ratio 4, attack 0.005, release 0.1 | Evens out loud/quiet sections; especially useful for dialogue with varying speaker proximity |
| **Presence** | `BiquadFilterNode` — peaking @ 3000 Hz, Q 1.5, gain +3 dB | Speech intelligibility and clarity for EFL learners |

Multiple presets can be active simultaneously. The node chain is assembled in order: highpass (de-rumble) → highpass (pop) → RNNoise worklet (noise cancel) → compressor → peaking EQ (presence) → destination.

### Architecture

#### New Component: `src/components/RecordingStudio3/AudioFilterPanel.jsx`

```
┌─────────────────────────────────────────────────────────────┐
│  Audio Filters                                              │
│                                                             │
│  [De-rumble]  [Pop filter]  [Hiss]  [Compress]  [Presence] │
│   ● active     ○ off        ● active  ○ off       ○ off    │
└─────────────────────────────────────────────────────────────┘
```

- MUI `Chip` toggles with `outlined` (off) / `filled` (on) variant
- A popover active on hover, around each chip explains what it fixes
- Emits `onFiltersChange(activeFilters: Set<string>)` to parent

#### Modified: `src/components/RecordingStudio3.jsx`

- Add `activeFilters` state (`Set<string>`, initially empty)
- Render `<AudioFilterPanel>` in the Properties Panel above the takes list (only when `selectedDialogue` is set)
- Pass `activeFilters` down to each take's `<AudioWaveformPlayer>` via new `audioFilters` prop

#### Modified: `src/components/Editor3/components/AudioWaveformPlayer.jsx`

- Add `audioFilters` prop (`Set<string> | string[]`, default empty)
- When `audioFilters` is non-empty and play is triggered:
  - If source is a URL: fetch → `decodeAudioData` → build `OfflineAudioContext` chain → render → `createObjectURL` → play processed blob
  - Cache: store the processed blob URL keyed by `${sourceUrl}::${[...audioFilters].sort().join(',')}` — avoids re-processing on repeated plays of the same filter combination
  - On cleanup: revoke cached blob URLs
- When `audioFilters` is empty: behave exactly as today (no performance impact)

#### Utility: `src/utils/applyAudioFilters.ts`

Pure function — accepts `AudioContext`, `AudioBuffer`, and `Set<string>` of active filter names. Returns a new `AudioBuffer` with filters applied via `OfflineAudioContext`. Exported separately so it can be reused in both the filter panel playback path and the pre-submission cleanup path.

```typescript
export async function applyAudioFilters(
  buffer: AudioBuffer,
  activeFilters: Set<string>,
): Promise<AudioBuffer>
```

#### RNNoise Integration (`src/workers/rnnoise-worklet.js`)

RNNoise operates frame-by-frame (480 samples @ 48 kHz, mono). The `AudioWorkletProcessor` handles this:

1. **Sample rate conversion**: If `AudioContext.sampleRate !== 48000`, the worklet resamples in/out via linear interpolation (RNNoise requires exactly 48000 Hz)
2. **Frame buffering**: The Web Audio `process()` callback delivers 128-sample quantum frames. The worklet accumulates frames into 480-sample RNNoise frames, then flushes the output
3. **WASM loading**: Uses `rnnoise-sync.js` from `@jitsi/rnnoise-wasm` — WASM binary inlined as base64, so it loads synchronously inside the AudioWorklet context (no fetch required)

```
public/
  workers/
    rnnoise-worklet.js     ← AudioWorkletProcessor (copied from package at build time)
    rnnoise-sync.js        ← from @jitsi/rnnoise-wasm/dist/rnnoise-sync.js (copied)
```

For `OfflineAudioContext` processing (filter panel + submission cleanup), the worklet is registered via:
```javascript
await offlineCtx.audioWorklet.addModule('/workers/rnnoise-worklet.js');
const rnnoiseNode = new AudioWorkletNode(offlineCtx, 'rnnoise-processor');
```

**Next.js build**: Add a `copy-rnnoise-worker.js` script (same pattern as existing `copy-pdf-worker.js`) to copy the worklet files to `public/workers/` during build.

---

## 2. Pre-Submission Audio Cleanup

### Goal

When a learner finishes recording a take in RecordingStudio3 (or any `AudioWaveformPlayer` with `enableRecording`), automatically run a cleanup pass on the captured blob *before* uploading it to S3. The result stored in DynamoDB and S3 is already clean — no server-side processing needed.

### When It Runs

After `MediaRecorder` fires `stop` and the chunks are assembled into a blob, but before `uploadStudentSubmission()` is called. The existing flow in `AudioWaveformPlayer.jsx` is:

```
MediaRecorder stop
  → assemble chunks into blob
  → decodeAudioData (for duration + waveform)    ← hook in here
  → uploadStudentSubmission
  → onRecordingComplete callback
```

### Default Cleanup Chain

Unlike the filter panel (user-controlled), the submission cleanup chain is **always-on** for human recordings. It uses RNNoise as the primary noise suppressor, with EQ guards:

| Pass | Why always-on |
|------|--------------|
| Highpass @ 80 Hz | Removes inaudible sub-bass; prevents playback distortion on phones/earbuds |
| **RNNoise** (`@jitsi/rnnoise-wasm`) | ML noise suppression — removes fan, AC, street, keyboard noise without touching speech |
| Gentle compressor (threshold -30, ratio 3, attack 0.01, release 0.15) | Prevents clipping; makes soft speech audible |
| Normalize to -3 dBFS peak | Consistent perceived volume across takes and speakers |

TTS-generated takes are **not processed** — they're already produced at a consistent level by OpenAI, and the `take.type === 'tts'` flag distinguishes them.

### Architecture

#### Modified: `src/components/Editor3/components/AudioWaveformPlayer.jsx`

After `decodeAudioData` in `stopRecording`, before upload:

```javascript
// Apply submission cleanup if this is a human recording
const processedBuffer = await applyAudioFilters(
  rawBuffer,
  new Set(['derumble', 'compress', 'normalize']),
);
const processedBlob = await audioBufferToBlob(processedBuffer, 'audio/webm');
// Use processedBlob for upload and waveform instead of raw audioBlob
```

#### Utility: `src/utils/audioBufferToBlob.ts`

Encodes an `AudioBuffer` back to a `Blob` using the Web Audio API `OfflineAudioContext` → `encodeAudioData`. Since the Web Audio API doesn't have a built-in encoder, we use `AudioContext.createBufferSource` + `MediaRecorder` on the rendered output, or write raw PCM into a WAV container (simple, no dependencies).

```typescript
export async function audioBufferToBlob(
  buffer: AudioBuffer,
  mimeType: 'audio/wav' | 'audio/webm',
): Promise<Blob>
```

WAV is preferred here because it is a trivially encodable lossless format — the cleaned blob is re-compressed to MP3 or WebM by the browser's `MediaRecorder` or by the server's MediaConvert pipeline anyway.

### User-Controlled Cleanup Strength (Phase 2)

A future `<RecordingSettings>` panel can expose a single "Cleanup" slider (Off → Light → Standard → Aggressive) that adjusts the compressor `ratio` and normalize target without exposing individual filter controls to learners.

---

## 3. Versioned Audio Files & Take History

### Goal

Every time a recording slot is re-recorded, upload to a new S3 key with a `_{version}` suffix rather than overwriting. The take always points to the currently active version. A history dropdown lets users roll back — without deleting any S3 object.

### S3 Naming Convention

Each take slot has a **stable slot ID** (UUID generated once when the slot is first created). Re-recordings increment the version counter:

```
protected/{identityId}/takes/{dialogueId}-{slotId}_{version}.{ext}
```

Examples:
```
protected/us-east-1:abc.../takes/1-f3a2c8_1.webm   ← first recording
protected/us-east-1:abc.../takes/1-f3a2c8_2.webm   ← re-recorded
protected/us-east-1:abc.../takes/1-f3a2c8_3.webm   ← re-recorded again (current)
```

Extension matches the recorded MIME type (`webm` for `MediaRecorder` output, `mp3` for TTS).

### Take Object Shape (Updated)

Current shape (relevant fields):
```js
{
  id: Date.now(),       // timestamp — will become stable UUID
  type: 'human' | 'tts',
  audioPath: 'protected/.../narrator-take1.mp3',
  file: { key: '...', level: 'protected', ... },
  createdAt: '...',
}
```

Updated shape:
```js
{
  id: 'f3a2c8b1-...',    // stable UUID (slot ID — never changes on re-record)
  type: 'human' | 'tts',
  version: 3,             // upload counter — monotonically increasing, never decremented
  audioPath: 'protected/{identityId}/takes/1-f3a2c8_3.webm', // active key (may differ from version on rollback)
  fileId: 'ddb-file-record-id', // DynamoDB File record ID for this slot
  file: { key: 'protected/{identityId}/takes/1-f3a2c8_3.webm', level: 'protected', ... },
  createdAt: '...',       // timestamp of first recording for this slot
  updatedAt: '...',       // timestamp of most recent upload or rollback
}
```

**`audioPath` vs `version`**: `version` is the upload counter (strictly increasing). `audioPath` / `file.key` is what gets played — updated on new recordings AND on rollback. On rollback, `audioPath` changes to an older key but `version` stays the same, so the next re-record always uploads to `version + 1`.

### History Retrieval

Use S3 `listObjectsV2` with a prefix — deterministic regardless of gaps:

```
Prefix: protected/{identityId}/takes/{dialogueId}-{slotId}_
```

Parse the version number from the key suffix:
```typescript
const versionNum = parseInt(key.split('_').pop()!.split('.')[0], 10);
```

The list is **lazy-loaded** — only fetched when the user opens the history dropdown, not on render. Amplify Storage's `list()` API handles this:

```typescript
import { list } from 'aws-amplify/storage';

const { items } = await list({
  path: `protected/${identityId}/takes/${dialogueId}-${slotId}_`,
  options: { listAll: true },
});
```

### Re-recording Flow

```
User clicks Re-record on an existing take slot
  → MediaRecorder captures new blob
  → applyAudioFilters (pre-submission cleanup chain)
  → audioBufferToBlob
  → Upload to `protected/{identityId}/takes/{dialogueId}-{slotId}_{version+1}.{ext}`
  → take.version = version + 1
  → take.audioPath = new key
  → take.file.key = new key
  → take.updatedAt = now()
  → client.models.File.update({ id: take.fileId, key: newKey, _version: file._version })
  → Old S3 objects at _{1}..._{N} remain untouched
```

### Rollback Flow

```
User opens history dropdown → S3 prefix list → shows all N versions
User selects version K (where K < version)
  → take.audioPath = protected/.../takes/{dialogueId}-{slotId}_{K}.{ext}
  → take.file.key = same
  → take.version unchanged (next re-record still uploads to version + 1)
  → client.models.File.update({ id: take.fileId, key: rolledBackKey, _version })
  → No new S3 objects written — purely a metadata update in scriptData + File record
```

### History Dropdown UI

```
┌──────────────────────────────────────────────────┐
│  ↩ Version History                               │
│                                                  │
│  ● v3 — Jun 1, 2026  2:14 PM  human  (active)   │
│    v2 — Jun 1, 2026  1:52 PM  human              │
│    v1 — May 31, 2026 9:40 AM  tts                │
│                                                  │
│                           [Restore v2]           │
└──────────────────────────────────────────────────┘
```

- `<HistoryIcon>` `IconButton` next to each take row in the takes list
- Opens a MUI `Popover` — lazy-fetches the S3 version list on first open, shows a `CircularProgress` while loading
- Active version marked with `●`; each row shows version number, timestamp, and `human`/`tts` badge
- "Restore vN" button calls a new `onRollbackTake(dialogueId, takeId, versionKey)` callback prop
- New component: `src/components/RecordingStudio3/TakeVersionHistory.jsx`

### File Record Sync

Add `fileId` to the take shape so the File DynamoDB record can be found for updates without a separate query:

```javascript
// On new recording
await client.models.File.create({ key: newKey, level: 'protected', ... });
// Store returned id as take.fileId

// On re-record or rollback
await client.models.File.update({
  id: take.fileId,
  key: newActiveKey,
  _version: currentFile._version,
});
```

---

## 4. Components Affected

| File | Change | Confirmation Required |
|------|--------|-----------------------|
| `@jitsi/rnnoise-wasm` | **Install** npm package | No (package.json) |
| `scripts/copy-rnnoise-worker.js` | **Create** — copies worklet + WASM files to `public/workers/` at build time | No (new script) |
| `public/workers/rnnoise-worklet.js` | **Create** — `AudioWorkletProcessor` wrapping RNNoise | No (new public asset) |
| `src/utils/applyAudioFilters.ts` | **Create** — core filter chain utility | No (new util) |
| `src/utils/audioBufferToBlob.ts` | **Create** — WAV encoder utility | No (new util) |
| `src/components/RecordingStudio3/AudioFilterPanel.jsx` | **Create** — filter toggle UI | No (new component) |
| `src/components/Editor3/components/AudioWaveformPlayer.jsx` | **Modify** — add `audioFilters` prop + submission cleanup | **Yes** |
| `src/components/RecordingStudio3.jsx` | **Modify** — add filter state + render `AudioFilterPanel` | **Yes** |
| `package.json` (scripts) | **Modify** — add `copy-rnnoise-worker` to build/dev scripts | No (scripts only) |
| `src/utils/takeVersioning.ts` | **Create** — helpers: `buildVersionedKey()`, `parseVersionFromKey()`, `listTakeVersions()` | No (new util) |
| `src/components/RecordingStudio3/TakeVersionHistory.jsx` | **Create** — history popover with S3 version list + restore button | No (new component) |
| `src/components/RecordingStudio3.jsx` | **Modify** — add `onRollbackTake` handler; pass `onRollbackTake` + `fileId` to take rows | **Yes** |
| `src/components/RecordingStudio3/parseFountainToScriptData.ts` | **Modify** — `DialogueLine.takes[]` type: add `version`, `fileId`, `updatedAt` fields | No (type only) |

---

## 5. Data Model Changes

**No DynamoDB schema changes required.** All changes are to the JSON blob stored in the `scriptData` field and to the existing `File` record's `key` field.

### Take Object — Added Fields

| Field | Type | Description |
|-------|------|-------------|
| `version` | `number` | Upload counter — incremented on every re-record, never decremented |
| `fileId` | `string` | DynamoDB `File` record ID for this slot — used to update `File.key` on re-record/rollback |
| `updatedAt` | `string` (ISO 8601) | Timestamp of most recent upload or rollback |
| `processingApplied` | `string[]` | Filter passes applied before upload (e.g. `['derumble','rnnoise','compress','normalize']`) |

### Take Object — Changed Fields

| Field | Before | After |
|-------|--------|-------|
| `id` | `Date.now()` (number) | `crypto.randomUUID()` (string) — stable slot identifier |
| `audioPath` | single key, overwritten on re-record | versioned key `_{N}.ext`; updated on re-record and rollback |
| `file.key` | same as `audioPath` | kept in sync with `audioPath` |

### File DynamoDB Record

The existing `File.key` field always reflects the **currently active** version of the audio. Updated via `client.models.File.update()` on every re-record or rollback. No new fields needed on the `File` model.

---

## 6. User Stories

1. As a **learner**, I record a take on my laptop microphone with background hiss — the stored recording sounds clean without re-recording.
2. As a **learner**, I accidentally recorded with too much bass rumble — the pre-submission cleanup removes it automatically.
3. As an **instructor**, I want to audition a student's take with the "Presence" filter on to judge how it would sound at normal EQ before giving feedback.
4. As an **instructor**, I want to hear a rough student recording with compression applied to better assess pronunciation quality without loudness distractions.
5. As an **instructor**, I can turn all filters off and hear the raw recording when I want to evaluate the student's actual mic technique.
6. As a **learner**, I re-record a take but prefer my first attempt — I open the version history and restore v1 without losing the newer recordings.
7. As an **instructor**, I can see the full recording history for a dialogue line and compare any two versions by clicking through them.
8. As a **learner**, I accidentally click re-record and overwrite a good take — I can roll back to the previous version immediately.

---

## 7. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| `OfflineAudioContext` render is slow for long recordings (>30s) | Show a spinner; RS3 takes are rarely >10s so this is unlikely in practice |
| `AudioWorklet` not supported in all browsers | All modern browsers (Chrome 66+, FF 76+, Safari 14.1+); add try/catch that falls back to raw BiquadFilter for the "Noise cancel" preset |
| RNNoise WASM file not found at runtime (build step missed) | `copy-rnnoise-worker.js` will throw loudly if source file is missing; tested in CI |
| RNNoise requires exactly 480-sample frames @ 48 kHz — Web Audio delivers 128-sample quantum at varying rates | Worklet buffers incoming samples and resamples; fully handled in `rnnoise-worklet.js` |
| `OfflineAudioContext` + `AudioWorklet` combination requires Chrome 70+ / Safari 16+ | Acceptable minimum — graceful fallback to BiquadFilter-only for noise cancel on older browsers |
| Pre-submission cleanup changes what the student actually recorded | Conservative defaults only — RNNoise does not alter pitch, timing, or intelligibility; it suppresses non-speech noise specifically |
| WAV blob is larger than WebM | WAV is ~10× larger; for a 5s recording this is ~1 MB. Acceptable, and the MediaConvert pipeline will re-encode to HLS/AAC anyway |
| Processed blob URL leak | Revoke in `useEffect` cleanup — same pattern as existing `recordedBlobUrl` |
| Filter cache grows unbounded | Cache is component-scoped (lives in component state); evicted on unmount automatically |
| S3 storage grows with every version — no garbage collection | Expected take count per learner is low (<20). Each 5s webm is ~50 KB. At 10 versions per take × 20 takes = 10 MB/learner — negligible. A future cleanup Lambda can prune versions older than N if needed |
| `listObjectsV2` latency on history open | History is lazy-loaded on dropdown open, not on render. Cached after first fetch per take slot per component mount |
| `id` type change (number → string UUID) breaks existing data | Existing scriptData blobs in DynamoDB have numeric `id`s. Read path must accept both `string` and `number` for `take.id`; only new recordings generate UUIDs |
| Re-recording a TTS take with the human cleanup chain | Guard: only apply pre-submission cleanup when `type === 'human'` — same guard as today |

---

## 8. Implementation Order

### Phase 0 — Versioned Audio Keys & Take History

- [ ] **P0-1** Create `src/utils/takeVersioning.ts` — `buildVersionedKey(identityId, dialogueId, slotId, version, ext)`, `parseVersionFromKey(key)`, `listTakeVersions(identityId, dialogueId, slotId)` (wraps Amplify Storage `list()`)
- [ ] **P0-2** Update `handleRecordingComplete` in `RecordingStudio3.jsx` to generate a UUID `slotId` for new takes and upload to a versioned key; set `take.version = 1`
- [ ] **P0-3** Update re-record path in `RecordingStudio3.jsx` to upload to `version + 1` key and update `take.audioPath`, `take.file.key`, `take.version`, `take.updatedAt`
- [ ] **P0-4** Add `onRollbackTake(dialogueId, takeId, versionKey)` handler; update `take.audioPath` + `take.file.key` + `File.key` DynamoDB record
- [ ] **P0-5** Create `src/components/RecordingStudio3/TakeVersionHistory.jsx` — lazy-loading `Popover` with version list and Restore button
- [ ] **P0-6** Wire `TakeVersionHistory` into the takes list in `RecordingStudio3.jsx`
- [ ] **P0-7** Update `parseFountainToScriptData.ts` `DialogueLine` type to include `version`, `fileId`, `updatedAt`; make `take.id` accept `string | number`
- [ ] **P0-8** Add Storybook stories for `TakeVersionHistory` (1 version, 3 versions, loading state)

### Phase 1 — RNNoise Infrastructure + Filter Panel (listen only, no upload changes)

- [ ] **P1-1** Install `@jitsi/rnnoise-wasm`
- [ ] **P1-2** Create `scripts/copy-rnnoise-worker.js` and wire into `package.json` `build`/`dev` scripts
- [ ] **P1-3** Create `public/workers/rnnoise-worklet.js` — `AudioWorkletProcessor` with 480-sample frame buffering and 48 kHz resampling
- [ ] **P1-4** Create `src/utils/applyAudioFilters.ts` — builds `OfflineAudioContext` chain with BiquadFilter nodes + RNNoise worklet node
- [ ] **P1-5** Create `src/components/RecordingStudio3/AudioFilterPanel.jsx`
- [ ] **P1-6** Add `audioFilters` prop to `AudioWaveformPlayer` + offline processing on play
- [ ] **P1-7** Wire `activeFilters` state + `AudioFilterPanel` into `RecordingStudio3` properties panel
- [ ] **P1-8** Add Storybook stories for `AudioFilterPanel` (all filters off, some on, all on)

### Phase 2 — Pre-Submission Cleanup

- [ ] **P2-1** Create `src/utils/audioBufferToBlob.ts` (WAV encoder)
- [ ] **P2-2** Add cleanup pass in `AudioWaveformPlayer` `stopRecording` handler (highpass → RNNoise → compress → normalize, after `decodeAudioData`, before upload)
- [ ] **P2-3** Guard: skip cleanup when `take.type === 'tts'`
- [ ] **P2-4** Add a `processingApplied` field to the take object for debugging

### Phase 3 — Cleanup Strength Control (future)

- [ ] **P3-1** `RecordingSettings` panel with slider (Off → Light → Standard → Aggressive)
- [ ] **P3-2** Persist cleanup preference in `SettingsContext`

---

## 9. Success Criteria

- [ ] Activating any filter combination and pressing Play produces audibly processed audio within 500 ms for takes under 15 seconds
- [ ] Original S3 file is never modified
- [ ] Turning all filters off reverts to original audio exactly
- [ ] A student recording made with a noisy laptop microphone has audibly less hiss when the "Hiss" preset is active
- [ ] Pre-submission cleanup runs transparently on every human recording — no UI change visible to learners
- [ ] TTS takes are not processed by the cleanup chain
- [ ] No new npm dependencies added
- [ ] Re-recording a take uploads to `_{N+1}.ext` — the previous versioned S3 file is still accessible
- [ ] Opening the history dropdown lists all versions for a take slot via S3 prefix list
- [ ] Restoring a previous version updates `audioPath`, `file.key`, and the `File` DynamoDB record — no S3 writes
- [ ] After rollback, the next re-record uploads to `version + 1` (not `version`)
- [ ] Existing scriptData with numeric `take.id` values continues to work without migration
