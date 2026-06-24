# Course Context Summary Plan

## Overview

Enrich the AI context available to **all generation features** with a structured, typed course outline that includes unit summaries, vocabulary highlights, question counts, and attached document summaries. This gives every AI feature (typeahead, chatbots, practice drills, RecordingStudio3) awareness of course progression and unit content structure.

## Goals

- [ ] Define a typed `CourseOutlineEntry` custom type in the schema (replacing raw JSON)
- [ ] Expand `Unit.summary` generation at publish time to include document summaries, vocabulary highlights, and question/file counts
- [ ] Make `Section.courseOutline` a typed array of `CourseOutlineEntry`
- [ ] Feed course outline to **typeahead ghost text** (AIContentCompletionPlugin)
- [ ] Feed course outline to **chatbots** (Kai + Sage via ChatSidebar → `/api/chat` → `buildPersonaSystemMessage`)
- [ ] Feed course outline to **practice drill generation** (generatePracticeDrill Lambda)
- [ ] Feed course outline to **RecordingStudio3** conversation generation
- [ ] Feed course outline to **block suggestions** (BlockSuggestionPlugin)
- [ ] Derive draft summary on save (client-side, not persisted) for typeahead/editor context
- [ ] Ensure summary is generated on publish without excessive writes (single Lambda call, no stream needed)

## Non-Goals

- Real-time summary regeneration on every keystroke (too expensive)
- AI-generated prose summaries (structural extraction is sufficient and cheaper)
- Changing document analysis pipeline (summaries already exist on ParsedContent)
- Adding DynamoDB streams (publishUnit Lambda is the trigger point)

## Architecture

### Custom Type: CourseOutlineEntry

```typescript
const CourseOutlineEntry = a.customType({
  unitId: a.id().required(),
  name: a.string().required(),
  number: a.float(),
  summary: a.string(),        // Structural summary (headings + content highlights)
  vocabularyCount: a.integer(),
  questionCount: a.integer(),
  fileCount: a.integer(),
  documentSummaries: a.string(), // Condensed document summaries (pipe-delimited titles)
});
```

### Schema Changes

| Model   | Field          | Type                               | Purpose                              |
| ------- | -------------- | ---------------------------------- | ------------------------------------ |
| Unit    | `summary`      | `a.string()` ✅ (already added)   | Enriched structural unit summary     |
| Section | `courseOutline` | `a.ref("CourseOutlineEntry").array()` | Typed array replacing raw `a.json()` |

### Components Affected

| File | Change |
| ---- | ------ |
| `amplify/data/resource.ts` | Add `CourseOutlineEntry` custom type; change `Section.courseOutline` from `a.json()` to typed ref |
| `amplify/functions/publishUnit/handler.ts` | Expand summary to include vocabulary, questions, files, document summaries |
| `src/components/Editor3/plugins/AIContentCompletionPlugin.js` | ✅ Already passes courseOutline (done) |
| `src/components/Editor3/plugins/BlockSuggestionPlugin.jsx` | Add courseOutline to context payload |
| `src/components/ChatSidebar.jsx` | Add courseOutline to contextData |
| `app/api/_shared/botPersonas.ts` | Handle courseOutline in `buildPersonaSystemMessage` |
| `app/api/content-completion/route.ts` | ✅ Already handles courseOutline (done) |
| `app/api/suggest-blocks/route.ts` | Handle courseOutline in system prompt |
| `src/components/RecordingStudio3.jsx` | Pass courseOutline to AI screenplay generation |
| `amplify/functions/generatePracticeDrill/handler.ts` | Optionally include courseOutline for cross-unit awareness |

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  PUBLISH UNIT (Lambda trigger point)                             │
│                                                                  │
│  1. Parse Lexical JSON → extract headings                        │
│  2. Query UnitWord joins → vocabulary count + key terms          │
│  3. Query QuestionUnit joins → question count                    │
│  4. Query UnitFile joins → file count                            │
│  5. Query UnitDocument → ParsedContent.summariesJSON             │
│  6. Build enriched summary string                                │
│  7. Write Unit.summary                                           │
│  8. Query Assignments for this unit → find sections              │
│  9. For each section:                                            │
│     a. Query all assignments in section                          │
│     b. Fetch each unit's summary, name, number                   │
│     c. Build CourseOutlineEntry array                             │
│     d. Write Section.courseOutline                                │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│  CONSUMERS (all read Section.courseOutline at runtime)            │
│                                                                  │
│  • AIContentCompletionPlugin → /api/content-completion           │
│  • BlockSuggestionPlugin → /api/suggest-blocks                   │
│  • ChatSidebar → /api/chat → buildPersonaSystemMessage           │
│  • RecordingStudio3 → chatCompletion context                     │
│  • generatePracticeDrill Lambda (reads Unit.summary directly)    │
└─────────────────────────────────────────────────────────────────┘
```

### Draft Summary (Client-Side, Ephemeral)

On each typeahead trigger, the plugin extracts headings from the current editor state. This is NOT persisted — it's derived fresh each time. This gives the AI awareness of current draft structure without needing a save.

### State Management

- `SectionContext` already provides `sections` (with all scalar fields including `courseOutline`)
- `UnitContext` already provides `currentUnit` (will include `summary` after publish)
- No new contexts needed — consumers just read existing context values

## User Stories

1. As an **instructor**, when I type in the editor, I want the ghost text suggestions to understand what comes before and after this unit in my course, so completions flow naturally in the course progression.
2. As a **student**, when I chat with Kai, I want the bot to understand where this unit fits in the course structure, so it can reference prior concepts and preview upcoming topics.
3. As an **instructor**, when I generate a practice drill, I want it to optionally reference concepts from adjacent units for spaced repetition context.
4. As an **instructor**, when I generate a conversation script in RecordingStudio3, I want the AI to know the vocabulary and topics covered in surrounding units.
5. As an **instructor**, when I publish a unit, I want the summary (including document content, vocabulary, questions) to be generated automatically without extra steps.

## Implementation Order (TODOs)

### Phase 1: Schema & Type (Foundation)
- [x] 1.1 Define `CourseOutlineEntry` custom type in `amplify/data/resource.ts`
- [x] 1.2 Change `Section.courseOutline` from `a.json()` to `a.ref("CourseOutlineEntry").array()`
- [ ] 1.3 Deploy schema changes (`npx ampx sandbox`)

### Phase 2: Enriched Summary Generation (Lambda)
- [x] 2.1 Add GraphQL queries to publishUnit for vocabulary, questions, files, documents
- [x] 2.2 Expand `buildUnitSummary()` to include vocab highlights, question count, file count, document summary titles
- [x] 2.3 Update `CourseOutlineEntry` construction to include counts
- [ ] 2.4 Test publish flow end-to-end

### Phase 3: Consumer Integration (Frontend)
- [x] 3.1 ChatSidebar — add `courseOutline` to `contextData` memo
- [x] 3.2 `buildPersonaSystemMessage` — render course outline section in system prompt
- [x] 3.3 BlockSuggestionPlugin — add courseOutline to `/api/suggest-blocks` payload
- [x] 3.4 `/api/suggest-blocks/route.ts` — include outline in system prompt
- [x] 3.5 RecordingStudio3 — pass courseOutline context from SectionContext into AI generation
- [ ] 3.6 generatePracticeDrill — optionally read Unit.summary for cross-unit context

### Phase 4: Testing & Audit
- [ ] 4.1 Verify publishUnit generates correct enriched summary
- [ ] 4.2 Verify section courseOutline is rebuilt on publish
- [ ] 4.3 Verify typeahead receives and uses outline context
- [ ] 4.4 Verify chatbot system prompt includes outline
- [ ] 4.5 Verify RecordingStudio3 AI generation uses outline
- [ ] 4.6 Check for token budget — ensure outline doesn't blow context windows

## Enriched Summary Format

```
Unit Name — Description
  • Heading 1
    ◦ Heading 2
  • Heading 3
Vocabulary: 12 words (hiragana, katakana, kanji basics, ...)
Questions: 8 practice questions
Files: 3 (2 audio, 1 PDF)
Documents: "Chapter 1 Overview", "Phonetics Guide"
```

This stays under ~500 tokens per unit, meaning a 20-unit course outline fits comfortably in ~10K tokens — well within GPT-4o's context window even alongside other content.

## Risks & Mitigations

| Risk | Mitigation |
| ---- | ---------- |
| Large courses (50+ units) blow token budget | Truncate outline to ±5 units around current position |
| publishUnit Lambda timeout with many sections | Rebuild outlines in parallel, cap at 10 sections |
| Stale outline after unit rename (no re-publish) | Acceptable — outline updates on next publish of any unit in the section |
| courseOutline field migration (json → typed) | Amplify Gen 2 handles type changes gracefully; old JSON values ignored |

## Success Criteria

- All AI features (typeahead, chatbot, drills, RecordingStudio3, block suggestions) have access to course outline context
- Published unit summary includes headings, vocabulary count, question count, file count, and document summary titles
- Section courseOutline is automatically rebuilt when any unit in the section is published
- No additional Lambda functions or DynamoDB streams required
- Total outline payload stays under 15K tokens for a 30-unit course
- No measurable latency impact on typeahead (outline is pre-computed, just read from context)
