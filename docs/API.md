# API Documentation

Data models, backend services, and integration patterns for Homework Supply.

## Architecture

**Stack**: Next.js + AWS Amplify Gen 2 (GraphQL/AppSync) + DynamoDB + S3 + Lambda + OpenAI

- **GraphQL API**: AWS AppSync with real-time subscriptions
- **Auth**: AWS Cognito (groups: Admins, Moderators, Instructors, Learners)
- **Database**: DynamoDB via Amplify Data Client with optimistic locking (`_version`)
- **Storage**: S3 organized by protection level (public/protected/private)
- **Functions**: 16 Lambda functions for AI, gamification, sync, and more
- **Real-time**: `observeQuery()` subscriptions with client-side filtering
- **Collaboration**: Yjs CRDT over WebSocket (API Gateway) + y-indexeddb persistence
- **i18n**: next-i18next with 6 languages (en, zh, es, fr, de, ja)

## Data Models (33 total)

Schema definition: [`amplify/data/resource.ts`](../amplify/data/resource.ts)

### Core Content

| Model | Purpose |
|-------|---------|
| **Unit** | Learning modules with Lexical JSON content in `data` field |
| **Assignment** | Units assigned to a Section with due dates |
| **Grade** | Student submissions with `data` JSON (question responses) and `accuracy` |
| **Section** | Student groups (classes) with join codes |
| **Question** | Practice questions with audio, images, answers, embeddings |
| **Word** | Vocabulary with phonetic, definition, audio files, embeddings |
| **File** | S3 objects with metadata (audio/video/images/PDFs/documents) |
| **Document** | PDF/document analysis results with extracted text |
| **ParsedContent** | Extracted vocabulary and content from analyzed documents |

### Join Tables (many-to-many)

`UnitFile`, `UnitWord`, `QuestionUnit`, `UnitDocument`, `QuestionFile`, `WordFile`, `QuestionWord`, `DocumentWord`, `DocumentQuestion`, `AssistantChatFile`

### AI & Chat

| Model | Purpose |
|-------|---------|
| **AssistantChat** | Chat conversations with system prompts and message history |
| **AIFeedback** | User feedback on AI responses (thumbs up/down + comments) |
| **AgentJob** | Async AI job tracking (status, progress, results) |

### Gamification

| Model | Purpose |
|-------|---------|
| **StudentProfile** | Aggregated student data: XP, level, badges, streaks, skill progress, unit memories, personal bests, leaderboard fields |
| **StudentXPLog** | Immutable XP ledger (amount, reason, cohort) |
| **StudentMemory** | Per-student AI memory (global markdown + per-unit concept tracking with weak/strong concepts, confusion pairs, accuracy) |
| **EasterEgg** | Hidden discoverable content with trigger conditions |
| **Skill** | Skill tree nodes with prerequisites and mastery levels |
| **Squad** | Student squads with members, posts, crest customization |
| **GroupChallenge** | Collaborative challenges with XP targets and contributions |
| **PracticeSession** | AI-generated drill sessions with coverage tracking |

### Collaboration & Settings

| Model | Purpose |
|-------|---------|
| **HomeworkRoom** | Peer review chat rooms with Y.js document sync |
| **WorkbookComment** | Block-level comments on student workbooks |
| **Settings** | Per-user preferences (editor theme, font size, locale, etc.) |

## Auth Rules

Most models use combinations of:
- `allow.owner()` — user-created content
- `allow.group('Admins')` — full access
- `allow.group('Instructors')` — create/read content
- `allow.authenticated().to(['read'])` — any logged-in user can read

Dynamic group auth is used for Section-based access control via `readGroups`/`writeGroups` fields.

### User Groups

| Group | Capabilities |
|-------|-------------|
| **Admins** | Full CRUD on all models |
| **Moderators** | Content moderation, AI feedback review |
| **Instructors** | Create/manage units, assignments, vocabulary, questions, sections |
| **Learners** | Read assigned content, submit grades, participate in peer review |

## Data Client Patterns (Gen 2)

```javascript
import { generateClient } from 'aws-amplify/data'
const client = generateClient()

// Create
await client.models.Unit.create({ name, description })

// Update with optimistic locking
await client.models.Unit.update({
  id: unit.id,
  name: newName,
  data: JSON.stringify(editorContent),
  _version: unit._version,
})

// Delete
await client.models.Unit.delete({ id: unit.id, _version: unit._version })

// Real-time subscription (one per model, client-side filtering)
const sub = client.models.Grade.observeQuery().subscribe({
  next: ({ items }) => {
    const valid = items.filter(item => item \!= null)
    setGrades(valid)
  },
})
// Cleanup
return () => sub.unsubscribe()

// Many-to-many lazy loading
const words = await unit.words.toArray()
```

## S3 Storage (Gen 2)

```
public/           — Publicly readable (unit content, shared audio)
protected/{userId}/ — User-specific (student recordings)
private/{userId}/   — Owner-only (instructor materials)
```

```javascript
import { uploadData } from 'aws-amplify/storage'

const result = await uploadData({
  key: `public/audio/${filename}`,
  data: file,
  options: {
    contentType: file.type,
    onProgress: ({ transferredBytes, totalBytes }) => {
      console.log(`${Math.round(transferredBytes / totalBytes * 100)}%`)
    },
  },
}).result
```

Use `getCachedUrl(filePath)` utility for cached S3 URL resolution.

## Lambda Functions (16)

| Function | Purpose |
|----------|---------|
| **openai** | GPT-4 text generation, Whisper transcription, TTS audio generation, image analysis |
| **chatStream** | Streaming chat via Vercel AI SDK |
| **contentCompletionStream** | AI autocomplete for Lexical editor |
| **suggestBlocksStream** | AI block suggestions (quiz, vocabulary, etc.) |
| **assistant** | AI assistant operations |
| **ai** | General AI utilities |
| **gamification** | XP awards, badge checks, streak tracking, skill tree generation, student memory, squad challenges, campaign management |
| **generatePracticeDrill** | AI-generated practice exercises from unit content |
| **documentAnalysis** | PDF/DOCX/XLSX/PPTX/EPUB text extraction and vocabulary analysis |
| **embeddings** | Vector embedding generation (text-embedding-3-small) |
| **moderation** | Content safety screening |
| **peerReviewAI** | AI feedback for peer review rooms |
| **section** | Section management and join code operations |
| **mediaConvert** | Audio/video transcoding |
| **streakResetCron** | Scheduled streak reset (daily cron) |
| **yjsSync** | Yjs document synchronization via WebSocket |

## Custom Mutations

Key mutations handled by the gamification Lambda:

| Mutation | Purpose |
|----------|---------|
| `awardXP` | Award XP to a student |
| `checkBadge` | Check and award badge eligibility |
| `updateStudentUnitMemoryFromGrade` | Update per-unit learning analytics from grade data |
| `rebuildStudentMemoryProfile` | Aggregate unit memories into student profile |
| `checkPersonalBest` | Check and record personal best scores |
| `contributeToChallenge` | Add XP to a group challenge |
| `generateSkillTree` | AI-generate skill tree from unit content |
| `bootstrapStudentGamification` | Initialize all gamification data for a new student |

## Pages & Routes

| Route | Purpose |
|-------|---------|
| `/` | Student dashboard (assignments, XP, streaks, badges, campaigns) |
| `/units` | Unit browser with practice drill launcher |
| `/unit/[id]` | Unit editor (Lexical + dictionary + questions + files) |
| `/workbook/[id]` | Student workbook (read-only unit + graded answer blocks) |
| `/sections` | Section management for instructors |
| `/section/[id]` | Section detail with assignment management |
| `/settings` | User preferences, avatar customization, bot customizer |
| `/profile` | Student profile (XP, badges, streaks, progress rings, nailed it wall) |
| `/profile/[username]` | Public profile view |
| `/leaderboard` | XP leaderboard with squad rankings |
| `/squads` | Squad browser and creation |
| `/squad/[id]` | Squad detail with posts, members, challenges |
| `/skills` | Skill tree visualization |
| `/review/[id]` | Peer review room |
| `/instructor/gamification` | Instructor gamification management panel |
| `/instructor/grade/[id]` | Instructor grade review |
| `/offline` | Offline fallback page |

## Key Features

### Lexical Editor
Rich text editor with custom graded block types: `quiz`, `meaning-association`, `answer`, `custom-answer`. Content stored as JSON in `Unit.data`. Supports images, YouTube embeds, PDFs, audio playlists, tables, layouts, drag-and-drop, and AI autocomplete.

### Real-time Collaboration (Yjs)
CRDT-based collaboration via WebSocket with providers for workbooks (`WorkbookCollaborationProvider`), peer review rooms (`PeerReviewRoomProvider`), and practice drills (`PracticeCollaborationProvider`). Presence indicators, tutor cursors, block history timeline, and comments.

### Gamification System
XP ledger, level progression, engagement streaks with shields, badge shelf, progress rings, personal bests, nailed-it celebrations, content locking/unlocking, skill trees, group challenges (boss battles), squads with posts and crests, campaigns with narrative briefings, easter eggs, and animated toast notifications.

### AI Integration
- **Chat**: Streaming chat with tool calls (Vercel AI SDK + `useChat` hook)
- **Grading**: AI-assisted answer verification (definition, word, short answer, audio)
- **Content**: AI autocomplete, block suggestions, practice drill generation
- **Documents**: PDF/DOCX/XLSX/PPTX/EPUB text extraction with vocabulary analysis
- **Embeddings**: Semantic search via text-embedding-3-small stored in DynamoDB
- **Memory**: Per-student learning analytics with concept tracking and confusion pairs

### Practice Drills
AI-generated exercises from unit vocabulary, questions, and documents. Students access via units list or chat command. Sessions use standard workbook graded blocks with diminishing XP returns.

### Peer Review
Chat rooms where students review each other's work. AI-assisted feedback prompts. Invitation system with join codes.

### Recording Studios
- **RecordingStudio2**: Student audio input for answer blocks
- **RecordingStudioEnhanced**: Enhanced student recording with waveform visualization
- **RecordingStudio3**: Instructor tool for scripted multi-speaker dialogue recording with Fountain screenplay format, TTS generation, and timeline editing

### Dark Mode
CSS variables theme via MUI v7 `colorSchemes`. Toggle in MainToolbar persisted to Settings model.

### Internationalization
6 languages (en, zh, es, fr, de, ja) with 12 namespaces. ARIA labels localized. Storybook translation mode for in-context editing.

## React Contexts (17)

| Context | Purpose |
|---------|---------|
| `authContext` | Session, user groups, authentication state |
| `unitContext` | Units, grades, rubric, editor content, workbook sync |
| `sectionContext` | Class sections and assignments |
| `dictionaryContext` | Vocabulary words and questions |
| `fileContext` | File management and S3 operations |
| `chatContext` | AI chat conversations |
| `settingsContext` | User preferences and theme |
| `gamificationContext` | XP, badges, challenges, squads, profiles |
| `xpContext` | XP tracking and toast notifications |
| `campaignContext` | Campaign/narrative progression |
| `skillTreeContext` | Skill tree data and progress |
| `gutterContext` | Editor gutter comments |
| `tabContext` | Tab/panel state management |
| `tourContext` | Onboarding tour state |
| `vectorStoreContext` | Embedding cache and semantic search |

---

**Schema Reference**: [`amplify/data/resource.ts`](../amplify/data/resource.ts)
**Copilot Instructions**: [`../.github/copilot-instructions.md`](../.github/copilot-instructions.md)

_Last Updated: May 2026_
