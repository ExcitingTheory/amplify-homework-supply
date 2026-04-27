# AI Practice Drills — Feature Plan

## Overview

AI-driven practice mode that generates drill exercises from a Unit's vocabulary, questions, documents, and Lexical content. Students access a **read-only, stripped-down Workbook popup** where the AI creates fresh variations of the teacher's material—using synonyms and rephrasing while preserving original meaning. Document references include relevant page numbers. Practice sessions are saved and award XP with **diminishing returns** to prevent farming while still maintaining the student's streak.

---

## Entry Points

### 1. Units List Button

Add a **"Practice"** icon button to each unit card on `/units` (student view only, for published/assigned units).

- Located alongside the existing "Open Workbook" action
- Disabled when the unit has no vocabulary, questions, or documents (nothing to drill)
- Opens the Practice Popup dialog

### 2. Chat Command

The AI tutor in `ChatSidebar` can start a practice session via tool call:

- Student says something like *"quiz me"*, *"let's practice"*, or *"drill me on this unit"*
- Chat uses a new `startPracticeDrill` tool that opens the Practice Popup
- The tool receives the current `unit.id` from `useChatPageContext`
- If the student is already in the workbook, the popup overlays it; if on the units list, it launches in a standalone dialog

---

## Practice Popup — UI Architecture

### Component: `PracticeDrillDialog`

A full-screen `MUI Dialog` (or `Drawer`) containing a **stripped-down, read-only Workbook**.

```
┌─────────────────────────────────────────────────┐
│  Practice: [Unit Name]                    [X]   │
│─────────────────────────────────────────────────│
│  Progress: ████████░░░░  6/10 questions         │
│  XP this session: +18  (diminishing indicator)  │
│─────────────────────────────────────────────────│
│                                                 │
│  📄 Ref: biology-cell-structure.pdf, p. 3       │
│                                                 │
│  [Graded Block — e.g. Quiz, MeaningAssociation] │
│  🔊 ← play button on every text element        │
│                                                 │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│                                                 │
│  📄 Ref: biology-cell-structure.pdf, p. 7       │
│                                                 │
│  [Next Graded Block]                            │
│  🔊 ← play button on every text element        │
│                                                 │
│─────────────────────────────────────────────────│
│  [Submit Practice] or auto-advance per block    │
└─────────────────────────────────────────────────┘
```

### Audio Play Buttons — Inline TTS Playback

Every pronounceable text element in the drill workbook gets a small **play button** (🔊) that plays its pre-generated TTS audio. This uses the existing `AudioPlayerContext` so only one audio plays at a time.

**Component: `DrillAudioButton`** — a small inline `IconButton`:

```tsx
interface DrillAudioButtonProps {
  audio: string            // base64 MP3 or S3 path
  label?: string           // aria-label for accessibility (e.g., "Play question audio")
  size?: 'small' | 'medium'
}
```

**Where play buttons appear**:

| Block type | Play buttons on |
|------------|----------------|
| `quiz` | Question text, each choice option |
| `answer` | Question text, expected answer (shown after submit) |
| `meaning-association` | Each term, each definition |
| `custom-answer` | Prompt text, hint (if shown), expected answer (after submit) |
| Instructions | Any instruction/context text above a block |

**Playback behavior**:
- Tap play → converts base64 to blob URL (or calls `getCachedUrl` for S3 paths) → plays via `AudioPlayerContext`
- Tapping another play button stops the current audio and starts the new one (single-player pattern from `AudioPlayerContext`)
- Button shows a small spinner while audio is loading, then toggles between play/pause icons
- Keyboard accessible: `Enter` or `Space` triggers playback

**Integration with `PracticeDrillWorkbook`**:
- `buildDrillEditorState.ts` embeds audio data into Lexical node metadata so the workbook plugins can render play buttons
- Each graded block plugin (`QuizPlugin`, `AnswerPlugin`, `MeaningAssociationPlugin`, `CustomAnswerPlugin`) reads the audio field from the block's metadata and renders `DrillAudioButton` inline with the text

### Stripped-Down Workbook

Reuse `src/components/Editor3/Workbook.tsx` with these modifications:

| Include | Exclude |
|---------|---------|
| `QuizPlugin` | Toolbar / editing controls |
| `AnswerPlugin` | `TutorPresenceBanner` / `TutorCursorOverlay` |
| `MeaningAssociationPlugin` | `WorkbookPresenceBar` (no peer presence) |
| `CustomAnswerPlugin` | Side drawer (dictionary, files, chat tabs) |
| `WorkbookStatePlugin` | Timer system (`TimerWrappedEditor`) |
| `StoryProgressPlugin` | `UnitCompletedPlugin` (uses its own completion) |
| `AIFeedbackSnackbar` | Navigation chrome / breadcrumbs |

The Lexical editor state is **programmatically constructed** from AI-generated content—not loaded from `unit.data`. This means the popup builds a fresh Lexical JSON document containing only graded blocks + supporting text (instructions, page references).

---

## AI Question Generation

### Data Sources (read from Unit via context)

| Source | What's extracted | Field / path |
|--------|-----------------|--------------|
| **Vocabulary** (`dictionary`) | Words, definitions, phonetics, audio | `UnitWord` → `Word` model |
| **Question Bank** (`questionBank`) | Existing questions with answers, types | `QuestionUnit` → `Question` model |
| **Documents** (`unitDocuments`) | `ParsedContent.vocabularyJSON`, `questionsJSON`, `summariesJSON`, `conceptsJSON` | `UnitDocument` → `Document` → `ParsedContent` |
| **Lexical Content** (`unit.data`) | Text blocks, existing graded blocks (quiz choices, answer prompts) | `Unit.data` JSON |

### Generation Strategy

**Lambda mutation**: `generatePracticeDrill(unitId, drillType, count)`

New Lambda function `amplify/functions/generatePracticeDrill/` that:

1. Fetches unit + related vocabulary, questions, documents, and ParsedContent
2. Builds a prompt with **all source material** as context
3. Instructs GPT-4 to generate `count` practice items with these rules:
   - **Preserve original meaning** — every question must test the same concept as the source
   - **Use synonyms and rephrase** — change wording of questions and definitions so the student isn't just memorizing exact strings
   - **Reference documents by page** — when a question derives from `ParsedContent`, include the filename and `page` / `page_range` from `vocabularyJSON[].page` or `summariesJSON[].page_range`
   - **Vary block types** — mix quiz (multiple-choice), answer (short-answer), meaning-association (matching), and custom-answer (free-response)
   - **Use distractors from the same unit** — wrong answers for multiple-choice should come from other vocabulary/concepts in the unit to avoid trivial elimination
4. Returns an array of `PracticeDrillBlock` objects:

```typescript
interface PracticeDrillBlock {
  type: 'quiz' | 'answer' | 'meaning-association' | 'custom-answer'
  instruction: string                  // AI-generated prompt text
  documentRef?: {                      // page reference when applicable
    filename: string
    page: number | string              // single page or "3-5" range
  }
  // Type-specific payload:
  choices?: { choice: string; correct: boolean }[]    // quiz
  expectedAnswer?: string                              // answer / custom-answer
  pairs?: { term: string; definition: string }[]       // meaning-association
  hint?: string                                        // optional hint
  sourceBlockId?: string                               // original question/block ID for tracking

  // TTS audio for all pronounceable text (pre-generated during drill creation)
  audio?: {
    instruction?: string               // base64 MP3 of the instruction text
    expectedAnswer?: string            // base64 MP3 of the correct answer
    choices?: Record<string, string>   // choice text → base64 MP3
    pairs?: Record<string, string>     // term or definition → base64 MP3
    hint?: string                      // base64 MP3 of the hint
  }
}
```

### TTS Audio Pre-Generation

Every piece of pronounceable text in a practice drill gets TTS audio generated **during drill creation** in the Lambda, so students see play buttons immediately without waiting.

**What gets audio** (any user-facing text a student might want to hear):

| Block type | Audio generated for |
|------------|-------------------|
| `quiz` | instruction, each choice text |
| `answer` | instruction, expectedAnswer |
| `meaning-association` | instruction, each term, each definition |
| `custom-answer` | instruction, expectedAnswer, hint |

**Generation approach in Lambda**:

```typescript
// In generatePracticeDrill handler, after GPT-4 returns blocks:
async function attachAudioToBlocks(blocks: PracticeDrillBlock[]): Promise<PracticeDrillBlock[]> {
  const openai = await getOpenAI()

  // Collect all unique text strings that need TTS
  const textSet = new Set<string>()
  for (const block of blocks) {
    textSet.add(block.instruction)
    if (block.expectedAnswer) textSet.add(block.expectedAnswer)
    if (block.hint) textSet.add(block.hint)
    block.choices?.forEach(c => textSet.add(c.choice))
    block.pairs?.forEach(p => { textSet.add(p.term); textSet.add(p.definition) })
  }

  // Batch generate TTS — deduplicate identical strings
  const audioMap = new Map<string, string>()
  const texts = [...textSet]

  // Generate in parallel batches of 10 to avoid rate limits
  for (let i = 0; i < texts.length; i += 10) {
    const batch = texts.slice(i, i + 10)
    const results = await Promise.all(
      batch.map(async (text) => {
        const response = await openai.audio.speech.create({
          model: 'tts-1',
          voice: 'alloy',
          input: text,
        })
        const buffer = await response.arrayBuffer()
        return { text, base64: Buffer.from(buffer).toString('base64') }
      })
    )
    results.forEach(r => audioMap.set(r.text, r.base64))
  }

  // Attach audio to each block
  return blocks.map(block => ({
    ...block,
    audio: {
      instruction: audioMap.get(block.instruction),
      expectedAnswer: block.expectedAnswer ? audioMap.get(block.expectedAnswer) : undefined,
      hint: block.hint ? audioMap.get(block.hint) : undefined,
      choices: block.choices
        ? Object.fromEntries(block.choices.map(c => [c.choice, audioMap.get(c.choice)!]))
        : undefined,
      pairs: block.pairs
        ? Object.fromEntries(block.pairs.flatMap(p => [
            [p.term, audioMap.get(p.term)!],
            [p.definition, audioMap.get(p.definition)!],
          ]))
        : undefined,
    },
  }))
}
```

**Voice selection**: Uses `tts-1` (faster, lower cost) with `alloy` voice by default. If the unit's vocabulary has a `language` field (e.g., Japanese, Spanish), the Lambda selects an appropriate voice:

| Language | Voice | Rationale |
|----------|-------|-----------|
| Default / English | `alloy` | Neutral, clear |
| Japanese | `nova` | Cleaner non-English pronunciation |
| Spanish / French | `shimmer` | Good Romance language cadence |

**Size considerations**: base64 TTS for a short phrase (~5 words) is ~15-30 KB. A 10-block drill with ~40 unique text strings ≈ 600 KB–1.2 MB total, which fits within Lambda response limits and is fine to store in `PracticeSession.generatedContent` (DynamoDB max item 400 KB compressed — if this exceeds the limit, audio is stored as S3 files via `generateAudioFile` instead and the `audio` field holds S3 paths).

**Fallback for large drills**: If total audio exceeds 300 KB, switch to S3-backed audio:
1. Upload each MP3 to `public/audio/practice/{sessionId}/{hash}.mp3`
2. Store S3 paths in the `audio` field instead of base64
3. Client detects path vs base64 and uses `getCachedUrl()` for S3 paths

### Drill Types

| `drillType` | Description |
|-------------|-------------|
| `mixed` | Balanced across all block types (default) |
| `vocabulary` | Focus on word definitions, matching, fill-in-blank |
| `comprehension` | Focus on document-derived questions, short answer |
| `review` | Prioritizes questions the student previously got wrong (uses `Grade.data` history) |

---

## Practice Session Persistence

### New Model: `PracticeSession`

```typescript
const PracticeSession = a.model({
  unitID: a.string().required(),
  drillType: a.enum(['MIXED', 'VOCABULARY', 'COMPREHENSION', 'REVIEW']),
  data: a.json(),             // Same format as Grade.data — keyed by generated block IDs
  accuracy: a.float(),        // Overall accuracy 0-100
  blockCount: a.integer(),    // How many blocks in this drill
  blocksCompleted: a.integer(),
  complete: a.boolean().default(false),
  xpAwarded: a.integer().default(0),
  generatedContent: a.json(), // The PracticeDrillBlock[] for replay/review

  // Versioning
  _version: a.integer(),
  _lastChangedAt: a.timestamp(),
  _deleted: a.boolean(),
})
.secondaryIndexes((index) => [
  index('unitID'),
])
.authorization((allow) => [
  allow.owner(),
  allow.groups(['Admins']).to(['read', 'create', 'update', 'delete']),
  allow.groups(['Instructors']).to(['read']),
])
```

**Relationship**: `Unit` hasMany `PracticeSession` via `unitID`.

### Save Flow

1. As the student answers each block, update `PracticeSession.data[blockId]` with `{ complete, accuracy, userAnswer }`
2. On session complete (all blocks answered or student closes dialog):
   - Calculate overall `accuracy` via existing `verifyAccuracy()` logic
   - Mark `complete: true`
   - Award XP (with diminishing returns — see below)

---

## XP Diminishing Returns

### New XP Reason

Add to the `XPReason` enum and `XP_AMOUNTS` map in `amplify/functions/gamification/handler.ts`:

```typescript
// New reason
PRACTICE_DRILL_COMPLETED: 30,   // base XP for first practice of the day
```

### Diminishing Returns Formula

Each **completed practice session per unit per day** reduces XP by 50%, floored at 5 XP:

```
Session 1 today: 30 XP  (base)
Session 2 today: 15 XP  (30 × 0.5)
Session 3 today: 8 XP   (15 × 0.5, rounded)
Session 4 today: 5 XP   (floor)
Session 5+ today: 5 XP  (floor)
```

**Implementation** in `handleAwardXP`:

```typescript
if (reason === 'PRACTICE_DRILL_COMPLETED') {
  const todayStr = new Date().toISOString().split('T')[0]
  const todayPracticeLogs = logs.filter(
    (l: any) =>
      l.reason === 'PRACTICE_DRILL_COMPLETED' &&
      l.createdAt?.startsWith(todayStr)
  )
  const sessionIndex = todayPracticeLogs.length // 0-based: 0 = first session
  const diminished = Math.max(5, Math.floor(baseXP * Math.pow(0.5, sessionIndex)))
  xpAmount = diminished
}
```

### Accuracy Bonus

Additional XP for high accuracy (stacks, also subject to diminishing returns):

| Accuracy | Bonus |
|----------|-------|
| 90–100%  | +15 XP |
| 80–89%   | +10 XP |
| 70–79%   | +5 XP |
| < 70%    | +0 XP |

The accuracy bonus is logged as `PRACTICE_DRILL_ACCURACY_BONUS` (separate reason, own diminishing curve).

### Streak Preservation

- A completed practice session (any accuracy) counts as daily activity → calls `updateStreak(studentId)`
- This means practice drills **maintain the student's streak** even on days without formal homework submissions
- The `StudentStreak.lastActivityDate` is updated to today

### UI Feedback

The `PracticeDrillDialog` header shows:
- Running XP earned this session
- A diminishing indicator (e.g., `"⚡ 15 XP"` with tooltip: *"Practice XP decreases with each session today. Try again tomorrow for full XP!"*)
- Streak flame icon with current count: `"🔥 7-day streak maintained"`

---

## Chat Integration — `startPracticeDrill` Tool

Add a new tool to `ChatSidebar`'s tool definitions:

```typescript
{
  name: 'startPracticeDrill',
  description: 'Start an AI practice drill for the current unit',
  parameters: {
    drillType: {
      type: 'string',
      enum: ['mixed', 'vocabulary', 'comprehension', 'review'],
      description: 'Type of practice drill',
      default: 'mixed',
    },
    count: {
      type: 'number',
      description: 'Number of questions (5-20)',
      default: 10,
    },
  },
}
```

When invoked:
1. Tool handler calls `generatePracticeDrill` mutation
2. Opens `PracticeDrillDialog` with the returned content
3. Chat displays a confirmation: *"Starting a mixed practice drill with 10 questions from [Unit Name]…"*

---

## File Structure — New Files

```
amplify/functions/generatePracticeDrill/
  handler.ts              # Lambda: generates drill content via OpenAI
  resource.ts             # Function definition

src/components/PracticeDrill/
  PracticeDrillDialog.tsx          # Full-screen MUI Dialog wrapper
  PracticeDrillConfigPopup.tsx     # Source selection + config popup (switches, count, coverage)
  PracticeDrillWorkbook.tsx        # Stripped-down Lexical workbook 
  PracticeDrillProgress.tsx        # Progress bar + XP indicator
  PracticeDrillDocRef.tsx          # Document page reference badge
  DrillAudioButton.tsx             # Inline 🔊 play button for TTS audio (base64 or S3 path)
  DrillRecordButton.tsx            # Inline 🎤 record button for pronunciation drills (Whisper)
  usePracticeDrill.ts              # Hook: manages session state, save, XP, memory upsert
  useDrillCoverage.ts              # Hook: calculates coverage from past PracticeSessions
  useDrillAudio.ts                 # Hook: converts base64/S3 paths to blob URLs, manages playback via AudioPlayerContext
  useDrillRecording.ts             # Hook: records audio via MediaRecorder, uploads, calls verifyAudioUrl
  buildDrillEditorState.ts         # Converts PracticeDrillBlock[] → Lexical JSON (embeds audio metadata)
  buildPracticeDrillFeedback.ts    # Builds StudentMemory feedback markdown from session results
  PracticeDrillDialog.stories.tsx  # Storybook stories
  PracticeDrillConfigPopup.stories.tsx  # Config popup stories
  DrillAudioButton.stories.tsx     # Audio button stories
  DrillRecordButton.stories.tsx    # Record button stories

src/utils/
  practiceXPCalculator.ts          # Diminishing returns calculation (shared between Lambda + UI preview)
```

### Modified Files

| File | Change |
|------|--------|
| `amplify/data/resource.ts` | Add `PracticeSession` model, `InstructorInsight` model, `PracticeDrillType` enum, `generatePracticeDrill` mutation |
| `amplify/functions/gamification/handler.ts` | Add `PRACTICE_DRILL_COMPLETED` + `PRACTICE_DRILL_ACCURACY_BONUS` reasons, diminishing returns logic |
| `src/components/InstructorDashboard.jsx` | Add "Practice Insights" section showing class-wide weak areas, per-student drill history, source effectiveness |
| `pages/units.jsx` | Add Practice button to unit cards (student view) |
| `src/components/ChatSidebar.jsx` | Add `startPracticeDrill` tool definition |
| `src/context/unitContext.jsx` | Expose `practiceSessions` from subscription, add `createPracticeSession` / `updatePracticeSession` |
| `pages/workbook/[id].jsx` | Mount `PracticeDrillDialog` for chat-triggered drills |

---

## Data Flow

```
Student clicks "Practice" (units list)
  or says "quiz me" (chat → startPracticeDrill tool)
        │
        ▼
generatePracticeDrill(unitId, drillType, count)   [Lambda]
  ├─ Fetch Unit + vocabulary + questions + documents + ParsedContent
  ├─ Build OpenAI prompt with all material
  ├─ GPT-4 generates PracticeDrillBlock[]
  ├─ attachAudioToBlocks() — TTS for all pronounceable text
  │     ├─ Collect unique text strings across all blocks
  │     ├─ Batch generate TTS via openai.audio.speech.create (tts-1)
  │     ├─ Deduplicate: same string reused across blocks shares one audio
  │     └─ Attach base64 MP3 (or S3 paths for large drills) to each block
  └─ Return blocks with embedded audio to client
        │
        ▼
PracticeDrillDialog opens
  ├─ buildDrillEditorState() → Lexical JSON from blocks (with audio metadata)
  ├─ Create PracticeSession record (incomplete)
  └─ Render stripped-down Workbook with graded blocks + 🔊 play buttons
        │
        ▼
Student interacts with drill
  ├─ 🔊 Tap play → AudioPlayerContext plays TTS for that text
  ├─ Per-block: answer → call verifyWord / verifyShortAnswer / local check
  ├─ Update PracticeSession.data[blockId] = { complete, accuracy, userAnswer }
  └─ Update progress bar
        │
        ▼
Session complete (all blocks answered or dialog closed)
  ├─ Calculate overall accuracy
  ├─ Mark PracticeSession.complete = true
  ├─ awardXPAndCheck(studentId, 'PRACTICE_DRILL_COMPLETED', sessionId)
  │     └─ Diminishing returns applied in Lambda
  ├─ (optional) awardXPAndCheck(studentId, 'PRACTICE_DRILL_ACCURACY_BONUS', sessionId)
  ├─ updateStreak(studentId)  ← maintains streak
  ├─ upsertStudentMemory(studentId, drillFeedback, 'practice-drill')
  │     └─ Appends per-block accuracy, weak areas, and strengths
  └─ upsertInstructorInsight(unitId, studentId, drillSummary)
        └─ Aggregates class-wide practice patterns for instructor
```

---

## Synonym / Rephrase Strategy

The OpenAI prompt for `generatePracticeDrill` includes explicit instructions:

```
You are generating practice questions for a student. The source material is provided below.

RULES:
1. Every question MUST test the same concept/meaning as the original.
2. REPHRASE questions using synonyms and different sentence structures.
   - Original: "What is the process by which plants convert sunlight into energy?"
   - Practice: "Which biological mechanism allows vegetation to transform solar radiation into chemical fuel?"
3. For vocabulary drills, use the SAME target word but change the definition phrasing.
   - Original definition: "the green pigment in plants"
   - Practice definition: "a green-colored substance found in plant cells"
4. For multiple-choice, generate plausible wrong answers from OTHER vocabulary/concepts in this unit.
5. When a question derives from a document, include { filename, page } from the source.
6. Never change the factual answer — only change how the question is asked.
```

---

## Memory Integration

### Learner Memory Pass-Back

After each completed practice session, the system calls `upsertStudentMemory` to update the learner's persistent AI memory with practice performance. This ensures subsequent AI interactions (chat, verify, future drills) are personalized.

**What gets written to `StudentMemory`**:

```typescript
// Built in generatePracticeDrill Lambda or usePracticeDrill hook after completion
const drillFeedback = buildPracticeDrillFeedback(session: PracticeSession)

interface PracticeDrillFeedback {
  unitName: string
  drillType: string
  overallAccuracy: number
  blockResults: {
    blockType: string
    sourceType: 'vocabulary' | 'question' | 'text' | 'document'
    concept: string           // What concept was tested
    accuracy: number
    userAnswer: string
    expectedAnswer: string
    wasCorrect: boolean
  }[]
  weakAreas: string[]         // Concepts with < 70% accuracy
  strongAreas: string[]       // Concepts with >= 90% accuracy
  sourcesUsed: string[]       // Which content sources were active
  timestamp: string
}
```

**Markdown appended to `StudentMemory.memoryMarkdown`**:

```markdown
### Practice Drill — [Unit Name] (2026-04-17T14:30:00Z)
- **Type**: mixed | **Accuracy**: 78% | **Blocks**: 10/10
- **Sources**: vocabulary, questions, text
- **Weak areas**: photosynthesis mechanism, chloroplast structure
- **Strong areas**: cell membrane, osmosis
- **Note**: Student struggles with process-oriented questions but excels at definition recall.
```

**Implementation** — called from `usePracticeDrill.ts` on session complete:

```typescript
// After marking PracticeSession.complete = true
const feedback = buildPracticeDrillFeedback(session, generatedContent, unitName)
await client.graphql({
  query: mutations.upsertStudentMemory,
  variables: {
    studentId: session.username,
    feedbackMarkdown: feedback,
    source: 'practice-drill',
  },
})
```

The existing `handleUpdateStudentMemory` in `amplify/functions/gamification/handler.ts` already supports appending timestamped markdown sections with a `source` label — no Lambda changes needed for the learner side.

**How it improves subsequent interactions**:
- AI chat (`ChatSidebar`) reads `StudentMemory` and can say "Last time you practiced, you struggled with photosynthesis—want to focus on that?"
- Verify functions (`verifyShortAnswer`, `verifyWord`) receive `studentMemory` via `useVerifyContext()` and adjust feedback tone/hints
- Future `review` drills prioritize `weakAreas` from memory

### Instructor Memory — `InstructorInsight` Model

Instructors don't get a personal "memory" document—they get **aggregated practice analytics** per unit so they can see where their class is struggling.

**New Model: `InstructorInsight`**

```typescript
const InstructorInsight = a.model({
  unitID: a.string().required(),
  studentId: a.string().required(),
  practiceSessionId: a.string(),
  drillType: a.string(),
  accuracy: a.float(),
  weakAreas: a.json(),           // string[] of concepts the student got wrong
  strongAreas: a.json(),         // string[] of concepts the student got right
  sourcesUsed: a.json(),         // string[] — which toggles were on
  blockBreakdown: a.json(),      // { vocabulary: 85, questions: 72, text: 60 } accuracy by source
  timestamp: a.datetime(),

  // Versioning
  _version: a.integer(),
  _lastChangedAt: a.timestamp(),
  _deleted: a.boolean(),
})
.secondaryIndexes((index) => [
  index('unitID').name('byUnit'),
  index('studentId').name('byStudent'),
])
.authorization((allow) => [
  allow.owner(),
  allow.groups(['Admins']).to(['read', 'create', 'update', 'delete']),
  allow.groups(['Instructors']).to(['read']),
])
```

**Written on session complete** — alongside the StudentMemory upsert:

```typescript
await client.models.InstructorInsight.create({
  unitID: session.unitID,
  studentId: session.username,
  practiceSessionId: session.id,
  drillType: session.drillType,
  accuracy: session.accuracy,
  weakAreas: JSON.stringify(feedback.weakAreas),
  strongAreas: JSON.stringify(feedback.strongAreas),
  sourcesUsed: JSON.stringify(feedback.sourcesUsed),
  blockBreakdown: JSON.stringify(feedback.blockBreakdown),
  timestamp: new Date().toISOString(),
})
```

**Instructor Dashboard Integration** (`InstructorDashboard.jsx`):

Add a new "Practice Insights" accordion/tab showing:

| Metric | Source | Display |
|--------|--------|---------|
| Class-wide weak areas | Aggregate `weakAreas` across all students for a unit | Tag cloud or bar chart of most-missed concepts |
| Per-student drill history | `InstructorInsight` filtered by `studentId` | Table: date, drill type, accuracy, weak areas |
| Source effectiveness | `blockBreakdown` averages | "Students score 85% on vocabulary but only 60% on text comprehension" |
| Practice frequency | Count of `InstructorInsight` per student per week | Identify students who aren't practicing |

This gives instructors actionable data: if 80% of students miss "chloroplast function" in practice drills, the instructor knows to revisit that topic in class.

---

## Full Content Coverage Guarantee

The generation strategy **must cover all content in the unit**, not sample randomly. Omitting content means students never practice it.

### Coverage Algorithm

The `generatePracticeDrill` Lambda uses a **coverage-first** approach:

1. **Inventory all source items**:
   - Every vocabulary word from `UnitWord` → `Word`
   - Every question from `QuestionUnit` → `Question`
   - Every concept/summary from `ParsedContent.conceptsJSON` and `summariesJSON`
   - Every graded block from `Unit.data` Lexical JSON

2. **Track coverage via `PracticeSession` history**:
   - Query past `PracticeSession.generatedContent` for this student + unit
   - Build a `coveredSourceIds` set from `sourceBlockId` fields in past sessions
   - Prioritize **uncovered items first**, then cycle back to previously-covered items

3. **Generate blocks to cover all items**:
   - If `count` < total source items: generate `count` blocks prioritizing uncovered items
   - If `count` >= total source items: cover everything, then fill remaining slots with rephrased variations of weak areas
   - Each `PracticeDrillBlock` includes `sourceItemId` (the original Word ID, Question ID, or block key) so coverage can be tracked

4. **Multi-session full coverage**:
   - Across multiple practice sessions, the student eventually practices **every** item in the unit
   - The `review` drill type specifically targets uncovered + low-accuracy items
   - UI shows a coverage indicator: "Practiced 24/30 vocabulary words, 8/12 questions"

### Updated `PracticeDrillBlock` Interface

```typescript
interface PracticeDrillBlock {
  type: 'quiz' | 'answer' | 'meaning-association' | 'custom-answer'
  instruction: string
  documentRef?: { filename: string; page: number | string }
  choices?: { choice: string; correct: boolean }[]
  expectedAnswer?: string
  pairs?: { term: string; definition: string }[]
  hint?: string
  sourceBlockId?: string             // original question/block ID
  sourceItemId: string               // ID of the Word, Question, or content block
  sourceType: 'vocabulary' | 'question' | 'text' | 'document'  // which source this came from

  // TTS audio for all pronounceable text (pre-generated during drill creation)
  audio?: {
    instruction?: string               // base64 MP3 or S3 path
    expectedAnswer?: string
    choices?: Record<string, string>   // choice text → base64 MP3 or S3 path
    pairs?: Record<string, string>     // term/definition → base64 MP3 or S3 path
    hint?: string
  }
}
```

### Updated `PracticeSession` Model

Add coverage tracking fields:

```typescript
const PracticeSession = a.model({
  // ... existing fields ...
  sourcesEnabled: a.json(),       // { vocabulary: true, questions: true, text: true }
  coverageSnapshot: a.json(),     // { vocabulary: { total: 30, covered: 24 }, questions: { total: 12, covered: 8 }, text: { total: 5, covered: 5 } }
})
```

### Edge Case Update

The previous plan capped large units at 50 source items. This is **removed**. Instead:

| Scenario | New Handling |
|----------|--------------|
| Very large unit (100+ items) | Generate `count` blocks from uncovered items. Subsequent sessions cover the rest. Show coverage progress. |
| All items covered | Switch to variation mode: rephrase previously-covered items, prioritizing weak areas from StudentMemory. |
| Single source type disabled | Only cover items from enabled sources. Coverage tracking is per-source-type. |

---

## Content Source Selection UI

### Entry Point: `PracticeDrillConfigPopup`

Before the drill starts, a **configuration popup** lets the student choose which content sources to include. This appears after clicking "Practice" and before generation begins.

```
┌─────────────────────────────────────────────────┐
│  Practice: [Unit Name]                          │
│─────────────────────────────────────────────────│
│                                                 │
│  Choose what to practice:                       │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │ 📚 Vocabulary        [====ON====]  30w  │    │
│  │ Words, definitions, matching             │    │
│  └─────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────┐    │
│  │ ❓ Questions          [====ON====]  12q  │    │
│  │ From the question bank                   │    │
│  └─────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────┐    │
│  │ 📝 Text Content       [====ON====]   5b  │    │
│  │ From lesson text and graded blocks       │    │
│  └─────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────┐    │
│  │ 📄 Documents          [====ON====]   3d  │    │
│  │ From uploaded PDFs and parsed content    │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  Coverage: 24/50 items practiced (48%)          │
│  ████████████░░░░░░░░░░░░░                      │
│                                                 │
│  Number of questions: [  10  ] ▼                │
│                                                 │
│  [Cancel]                    [Start Practice]   │
└─────────────────────────────────────────────────┘
```

### Component: `PracticeDrillConfigPopup.tsx`

```typescript
interface DrillSourceConfig {
  vocabulary: boolean    // default: true
  questions: boolean     // default: true
  text: boolean          // default: true
  documents: boolean     // default: true
}

interface PracticeDrillConfigProps {
  open: boolean
  onClose: () => void
  onStart: (config: {
    sources: DrillSourceConfig
    count: number
    drillType: string
  }) => void
  unitId: string
  unitName: string
  // Source counts from context
  vocabularyCount: number
  questionCount: number
  textBlockCount: number
  documentCount: number
  // Coverage from past sessions
  coverageSnapshot?: {
    vocabulary: { total: number; covered: number }
    questions: { total: number; covered: number }
    text: { total: number; covered: number }
    documents: { total: number; covered: number }
  }
}
```

**Behavior**:
- All switches default to **ON**
- Each switch shows the count of available items (e.g., "30w" for 30 words)
- Switches with 0 items are disabled and shown as unavailable
- At least one source must be enabled — disable "Start Practice" if all are off
- The count selector allows 5–20 questions (default 10)
- Coverage bar shows how many items from enabled sources have been practiced
- Config is passed to `generatePracticeDrill` mutation as `sourcesEnabled`

### Lambda Changes

The `generatePracticeDrill` mutation signature updates:

```typescript
generatePracticeDrill(
  unitId: String!
  drillType: String!       # MIXED, VOCABULARY, COMPREHENSION, REVIEW
  count: Int!
  sourcesEnabled: AWSJSON!  # { vocabulary: true, questions: false, text: true, documents: true }
)
```

The Lambda filters source material based on `sourcesEnabled` before building the OpenAI prompt. Only enabled sources are included in the prompt context and only their items can appear in generated blocks.

### Chat Integration Update

When the chat `startPracticeDrill` tool is invoked, it opens the `PracticeDrillConfigPopup` first (not the drill directly). The student can adjust sources before starting. If the student says "just quiz me on vocabulary", the chat can pre-configure:

```typescript
// Tool handler sets initial config from chat intent
onStart({
  sources: { vocabulary: true, questions: false, text: false, documents: false },
  count: 10,
  drillType: 'vocabulary',
})
```

---

## Edge Cases & Guards

| Scenario | Handling |
|----------|----------|
| Unit has no vocabulary, questions, or documents | Disable Practice button; chat tool returns "This unit doesn't have enough content for practice drills." |
| Student closes dialog mid-session | Save partial `PracticeSession` with `complete: false`; no XP awarded. Can be resumed later. |
| Network failure during generation | Retry with exponential backoff (max 2 retries). Show error state in dialog. |
| Very large unit (100+ items) | Generate `count` blocks from uncovered items first. Subsequent sessions cover the rest. Coverage progress shown in config popup. |
| Student has completed all unit content perfectly | `review` drill type falls back to `mixed` with a note: "Great job! Here's a general review." |
| Concurrent sessions | Only one `PracticeDrillDialog` open at a time. Starting a new drill asks to abandon the current one. |

---

## Phase Plan

### Phase 1 — Core Generation + Popup (MVP)

- [ ] `PracticeSession` model in schema (with `sourcesEnabled` and `coverageSnapshot` fields)
- [ ] `InstructorInsight` model in schema
- [ ] `generatePracticeDrill` Lambda function (with `sourcesEnabled` filter + coverage-first algorithm)
- [ ] TTS audio pre-generation in Lambda (`attachAudioToBlocks`) — batch TTS for all pronounceable text
- [ ] `PracticeDrillConfigPopup` — source selection switches, count selector, coverage bar
- [ ] `PracticeDrillDialog` + `PracticeDrillWorkbook` components
- [ ] `DrillAudioButton` — inline play button component using `AudioPlayerContext`
- [ ] `useDrillAudio` hook — base64 → blob URL conversion, S3 path fallback via `getCachedUrl`
- [ ] `buildDrillEditorState` to construct Lexical JSON with audio metadata
- [ ] Play buttons rendered on all pronounceable text (questions, choices, terms, definitions, answers)
- [ ] `DrillRecordButton` — 🎤 record button for pronunciation drills using Whisper
- [ ] `useDrillRecording` hook — records audio, uploads, calls `verifyAudioUrl` for grading
- [ ] Pronunciation mode for vocabulary and answer blocks (listen → record → verify)
- [ ] "Practice" button on units list (student view)
- [ ] Session persistence (create/update `PracticeSession`)
- [ ] Basic XP award (`PRACTICE_DRILL_COMPLETED`)

### Phase 2 — Memory + Diminishing Returns

- [ ] `buildPracticeDrillFeedback` — generate markdown from session results
- [ ] `upsertStudentMemory` call on session complete (learner memory pass-back)
- [ ] `InstructorInsight` record created on session complete
- [ ] Diminishing returns logic in gamification handler
- [ ] `PRACTICE_DRILL_ACCURACY_BONUS` reason
- [ ] Streak maintenance from practice sessions
- [ ] XP indicator UI in dialog header

### Phase 3 — Chat Integration + Coverage

- [ ] `startPracticeDrill` tool in `ChatSidebar` (opens config popup first)
- [ ] Chat-initiated drill opens dialog from workbook or units page
- [ ] Chat context aware of active practice session
- [ ] `useDrillCoverage` hook — tracks per-source coverage across sessions
- [ ] Coverage indicator in config popup and drill progress header
- [ ] "Review mistakes" follow-up after practice

### Phase 4 — Instructor Analytics + Review Mode

- [ ] `review` drill type using Grade + PracticeSession history + StudentMemory weak areas
- [ ] Practice history view per unit (list of past sessions with accuracy)
- [ ] Instructor Dashboard: "Practice Insights" section
  - [ ] Class-wide weak areas (aggregated from `InstructorInsight`)
  - [ ] Per-student drill history table
  - [ ] Source effectiveness breakdown (vocabulary vs. questions vs. text accuracy)
  - [ ] Practice frequency per student
- [ ] Storybook stories for all new components

---

## Whisper Pronunciation Drills

Practice drills include **pronunciation exercises** where students listen to TTS audio, then record themselves saying the word/phrase, and get graded via Whisper transcription + GPT verification. This uses the existing `verifyAudioUrl` query — no new Lambda code required.

### How It Works

1. **Listen**: Student taps 🔊 to hear the TTS pronunciation of a vocabulary word, answer, or phrase
2. **Record**: Student taps 🎤 to start recording via `MediaRecorder` API
3. **Submit**: Recording auto-stops after silence detection (or manual stop). Audio blob is uploaded to S3 (`protected/{identityId}/practice/{sessionId}/{blockId}.mp3`)
4. **Verify**: Client calls `verifyAudioUrl({ expected, audioUrl, model: 'whisper-1', chatModel: 'gpt-4o' })`
5. **Grade**: Response JSON `{ correct: boolean, score: 0-100, feedback: string }` is stored in `PracticeSession.data[blockId]`
6. **Feedback**: Student sees score + written feedback inline. Can re-record to improve.

### Which Blocks Get Pronunciation

| Block type | Pronunciation target | When |
|------------|---------------------|------|
| `vocabulary` (quiz/meaning-association) | The vocabulary word itself | Always — vocabulary drills always offer record |
| `answer` | The expected answer phrase | When answer is a pronounceable word/phrase |
| `custom-answer` | The expected answer | When block has `pronunciationEnabled: true` |
| Any block | The instruction text | Only if instruction is in a non-English language |

### Updated `PracticeDrillBlock` — Pronunciation Fields

```typescript
interface PracticeDrillBlock {
  // ... existing fields (type, instruction, choices, etc.)
  // ... existing audio field

  // Pronunciation drill fields
  pronunciation?: {
    enabled: boolean                  // whether this block has a pronunciation exercise
    targetText: string                // the text the student should pronounce
    targetLanguage?: string           // ISO 639-1 code (e.g., 'ja', 'es', 'fr')
    audioKey?: string                 // key into audio.* for the reference TTS
    maxAttempts?: number              // default 3 — max re-records before moving on
  }
}
```

The `generatePracticeDrill` Lambda sets `pronunciation.enabled = true` for vocabulary blocks and answer blocks where the expected answer is a pronounceable word. The `targetText` is the word/phrase to match against.

### Component: `DrillRecordButton`

A 🎤 button that records audio, uploads, and triggers verification:

```tsx
interface DrillRecordButtonProps {
  targetText: string              // expected pronunciation
  targetLanguage?: string         // for Whisper language hint
  blockId: string                 // for saving results
  sessionId: string               // for S3 path
  onResult: (result: {
    correct: boolean
    score: number
    feedback: string
    audioUrl: string
  }) => void
  maxAttempts?: number
  disabled?: boolean
}
```

**States**: idle → recording (pulsing red) → uploading (spinner) → verifying (spinner) → result (score + feedback)

**Re-record**: After seeing feedback, student can tap 🎤 again (up to `maxAttempts`). Best score is kept.

### Hook: `useDrillRecording`

```typescript
function useDrillRecording(options: {
  sessionId: string
  onVerifyResult?: (blockId: string, result: VerifyResult) => void
}): {
  startRecording: (blockId: string) => Promise<void>
  stopRecording: () => Promise<void>
  isRecording: boolean
  isUploading: boolean
  isVerifying: boolean
  currentBlockId: string | null
  results: Record<string, VerifyResult>
  attemptCounts: Record<string, number>
}
```

**Internally**:
1. Uses `navigator.mediaDevices.getUserMedia({ audio: true })` to get mic stream
2. Records via `MediaRecorder` (webm or mp3 depending on browser support)
3. Uploads blob to `protected/{identityId}/practice/{sessionId}/{blockId}-attempt-{n}.mp3` via `uploadData`
4. Calls `client.queries.verifyAudioUrl({ expected: targetText, audioUrl, model: 'whisper-1', chatModel: 'gpt-4o' })`
5. Parses response and updates results map

### UI Layout — Pronunciation Mode

When a block has `pronunciation.enabled`, it renders in a special mode:

```
┌─────────────────────────────────────────────────┐
│  Pronounce this word:                           │
│                                                 │
│  ┌─────────────────────────────────────┐        │
│  │  光合成 (photosynthesis)            │        │
│  │  🔊 Listen    🎤 Record             │        │
│  └─────────────────────────────────────┘        │
│                                                 │
│  [After recording:]                             │
│  Score: 85/100 ✅                               │
│  "Good pronunciation! The 'gō' vowel was        │
│   slightly long — try shortening it."           │
│                                                 │
│  [🎤 Try Again]  (2/3 attempts remaining)       │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Grading Integration

Pronunciation scores feed into the block's accuracy:
- For blocks that are **pronunciation-only** (vocabulary drill): pronunciation score IS the block accuracy
- For blocks that combine text answer + pronunciation: accuracy = `0.7 * textScore + 0.3 * pronunciationScore`
- Pronunciation results are stored in `PracticeSession.data[blockId]`:

```json
{
  "complete": true,
  "accuracy": 85,
  "userAnswer": "photosynthesis",
  "pronunciation": {
    "bestScore": 85,
    "attempts": 2,
    "feedback": "Good pronunciation!",
    "audioUrl": "protected/user-123/practice/session-456/block-789-attempt-2.mp3"
  }
}
```

### Audio Permissions

The `PracticeDrillDialog` requests microphone permission on mount if any blocks have `pronunciation.enabled`. If denied, pronunciation blocks fall back to text-only input with a message: "Enable microphone access to practice pronunciation."

---

## Open Questions

1. **Resume partial sessions?** Should students be able to return to an incomplete practice session, or always start fresh? Yes, they can resume incomplete sessions. The "Practice" button on the unit card shows "Resume Practice" if there's an incomplete session for that unit.
2. **Practice frequency caps?** Beyond diminishing XP returns, should there be a hard cap on daily practice sessions (e.g., max 10)? No hard cap, but the diminishing returns should strongly discourage excessive sessions.
3. **Instructor control?** Should instructors be able to disable practice drills for specific units or configure drill types? Yes, add a `practiceEnabled: boolean` field to `Unit` with a toggle in the instructor unit editor. If disabled, the Practice button is hidden and chat tool returns "Practice drills are disabled for this unit."
4. **Audio drills?** ~~Should practice include audio playback (TTS for vocabulary) and audio recording (pronunciation checks via Whisper)?~~ **Resolved — TTS + Whisper are part of Phase 1.** All pronounceable text gets TTS audio pre-generated via `attachAudioToBlocks()`. The `DrillAudioButton` component renders inline 🔊 play buttons using `AudioPlayerContext`. **Pronunciation recording via Whisper** is also Phase 1 — vocabulary and answer blocks show a 🎤 record button that records audio, sends it to `verifyAudioUrl` (Whisper transcription + GPT verification), and grades pronunciation accuracy. See "Whisper Pronunciation Drills" section below.
5. **Offline support?** Should generated drills be cached for offline use, or always require network? Generated drills are saved in `PracticeSession.generatedContent`, so they can be accessed offline after generation. However, starting a new drill requires network to call the Lambda. We can show an offline message if the user tries to start a drill without connectivity. And grading for some block types can be done client-side for instant feedback, while others (like short answer) may require a quick API call to verify.
6. **Memory granularity?** How detailed should per-block feedback be in StudentMemory? Answered: Include concept name, accuracy, and whether the student got it right. Keep it concise — the memoryParser already trims to 4KB soft cap and 10 recent entries.
7. **Instructor notification?** Should instructors be notified when class-wide weak areas emerge from practice data? Deferred to Phase 4. For now, instructors see aggregated data in the dashboard when they check it. Push notifications could be a Phase 5 item.
