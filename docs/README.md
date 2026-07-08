# Homework Supply Documentation

Elearning platform built with Next.js 16, AWS Amplify Gen 2, and OpenAI.

## Quick Start

1. **[Quick Start Guide](QUICK_START.md)** — Essential links and communication channels
2. **[Onboarding Guide](ONBOARDING.md)** — Complete developer setup walkthrough
3. **[Storybook Onboarding](STORYBOOK_ONBOARDING.md)** — Adding components to Storybook

## Architecture & Reference

- **[API Documentation](API.md)** — Data models, Lambda functions, routes, and Gen 2 patterns
- **[App Router Migration](APP_ROUTER_MIGRATION.md)** — Next.js App Router architecture and route map
- **[SSR & Performance](SSR_PERFORMANCE.md)** — Server-side rendering, Amplify server client, React Compiler, Turbopack, View Transitions, Server Actions
- **[CloudFront CDN](CLOUDFRONT_CDN.md)** — CDN architecture, signed cookies, image optimization
- **[File Processing Pipeline](FILE_PROCESSING_PIPELINE.md)** — Fan-out upload architecture: image processing, thumbnails, embeddings, media conversion
- **[Optimistic Concurrency](OPTIMISTIC_CONCURRENCY.md)** — `_version`-based conflict resolution with observeQuery
- **[Search Architecture](SEARCH_ARCHITECTURE.md)** — Semantic search with embeddings and IVF indexing
- **[S3 Content Storage](S3_CONTENT_STORAGE_SPEC.md)** — Storage paths, versioning, and content lifecycle
- **[S3 Embeddings](S3_EMBEDDINGS_SPEC.md)** — Embedding bundle storage and retrieval

### App Router & Server Actions

> **Next.js 16.x** with App Router | **i18n**: `next-intl` (6 locales, 10 namespaces) | **PWA**: Serwist

All routes live under `app/[locale]/`.

**Pages (`app/[locale]/`)**:

| Route | Rendering | Notes |
|-------|-----------|-------|
| `/` | Client | Home/landing |
| `/units` | Client | Unit list |
| `/unit/[id]` | RSC | Unit detail |
| `/workbook/[id]` | RSC | Server-side Lexical rendering (`@lexical/headless` + `linkedom`) |
| `/instructor/grade/[id]` | RSC | `getServerClient()` |
| `/profile/[username]` | RSC | NailedIt client island |
| `/leaderboard` | ISR | `revalidate: 60s`, live subscription hydration |
| `/skills` | ISR | `revalidate: 300s`, client hydration |
| `/sections` | Client | Section management |
| `/section/[id]` | Client | Section detail |
| `/section/[id]/settings/gamification` | Client | Gamification config |
| `/squads` | Client | Squad list |
| `/squad/[id]` | Client | Squad detail |
| `/settings` | Client | User settings |
| `/profile` | Client | Own profile |
| `/profile/notifications` | Client | Notification inbox |
| `/admin/settings` | Client | Admin panel |
| `/offline` | Client | Offline status |
| `/review/[id]` | Client | Peer review |
| `/xp-history` | Client | XP log |
| `/privacy` | Client | Privacy policy |

**Route Handlers (`app/api/`)**:

| Endpoint | Purpose |
|----------|---------|
| `/api/chat` | Streaming chat (Vercel AI SDK + block tools + auth) |
| `/api/suggest-blocks` | Block suggestion streaming |
| `/api/content-completion` | Editor content completion |
| `/api/grade-ai` | Custom AI block grading |

**Server Actions (`app/actions/`)**:

| File | Exports |
|------|---------|
| `chat.ts` | `chatCompletion` |
| `drill.ts` | `generatePracticeDrill` |
| `embeddings.ts` | `generateEmbedding`, `generateEmbeddings` |
| `feedback.ts` | `summarizeGradeFeedback` |
| `gamification.ts` | `awardXP`, `recordGradeCompletion`, `generateSkillTreeFromUnit`, `rebuildLeaderboard` |
| `generate.ts` | `generateAudioFile`, `generateImage`, `generateContent` |
| `grading.ts` | `gradeAnswer`, `gradeCustomAnswer`, `gradeRecording` |
| `moderate.ts` | `moderateContent` |
| `peerReview.ts` | `handleAIMention`, `generateReviewSummary` |
| `section.ts` | `joinSection`, `listSectionStudents` |
| `storage.ts` | S3 upload/download helpers |
| `unitContent.ts` | Unit content operations |

No Lambda functions are called from UI code. Retained Lambdas (streakResetCron, yjsSync, mediaConvert, notificationCron) are purely event-driven.

**Key decisions**:
1. No `middleware.ts` — Next.js 16+ handles locale routing without it.
2. Emotion SSR — MUI v7 streaming support, no manual `getInitialProps`.
3. Provider nesting in `app/providers.tsx` (`'use client'`): CacheProvider → ThemeProvider → AuthProvider → SettingsProvider → ChatContextProvider → children.

## Feature Documentation

- **[Implemented Features](FEATURES.md)** — Custom themes, notifications, custom AI block, agent architecture, instructor visibility, soft delete, security hardening, celebration animations
- **[Gamification](GAMIFICATION.md)** — XP, badges, streaks, boss battles, skill trees, content locks, squads
- **[Layout Suggestions](LAYOUT_SUGGESTIONS.md)** — Data-driven block autocomplete from instructor usage patterns
- **[Offline Experience](OFFLINE_EXPERIENCE.md)** — PWA with Serwist service worker caching; offline data planned

**Optimistic Concurrency**: All contexts use `client.models.X.observeQuery()` with `_version` map refs and optimistic `_version+1` bumps before saves. No manual `onCreate`/`onUpdate`/`onDelete` subscriptions remain.

### AI Practice Drills (`src/components/PracticeDrill/`)

AI-generated drill exercises from vocabulary, questions, documents, and Lexical content. Stripped-down Workbook popup with diminishing XP returns.

**Entry points**: "Practice" button on unit cards | Chat command ("quiz me" → `startPracticeDrill` tool)

| Component | Purpose |
|-----------|---------|
| `PracticeDrillDialog.tsx` | Full-screen dialog container |
| `PracticeDrillWorkbook.tsx` | Stripped-down Lexical editor (graded blocks only) |
| `PracticeDrillProgress.tsx` | Progress bar + XP indicator |
| `PracticeDrillConfigPopup.tsx` | Drill type/count selection |
| `DrillStatePlugin.tsx` | Tracks completion state per block |
| `DrillGradeAdapter.tsx` | Adapts responses to Grade model format |
| `buildDrillEditorState.ts` | Constructs Lexical JSON from AI blocks |
| `usePracticeDrill.ts` | Hook: session lifecycle, calls `app/actions/drill.ts` |
| `useDrillCoverage.ts` | Tracks which material has been drilled |

Block types: `quiz`, `answer`, `meaning-association`, `custom-answer`. TTS audio pre-generated via `tts-1` (base64 or S3 paths for large drills).

### Collaborative Chat (`src/components/CollaborativeChat/` + `src/yjs/`)

Yjs-backed real-time chat with section/squad rooms, scoped topics, threaded messages, @mentions, and server-side `@kai` AI bot.

| Component | Purpose |
|-----------|---------|
| `ChatPanel.tsx` | Main container (TopicList + ThreadView + input) |
| `ThreadView.tsx` | Message list with rich content rendering |
| `TopicList.tsx` | Scoped topic sidebar |
| `MessageInput.tsx` | Plain text input |
| `MentionChip.tsx` | @mention display |
| `CollaborativeChatWrapper.tsx` | Provider/connection wrapper |

Server: `amplify/functions/yjsSync/botObserver.ts` handles bot streaming via OpenAI → throttled Yjs writes → broadcast to all clients.

## In-Progress Plans

| Plan | Status | What Remains |
|------|--------|--------------|
| [Admin Bot](ADMIN_BOT_PLAN.md) | Not started | Atlas admin AI assistant — schema, Lambda, and UI |
| [Audio Processing](RECORDING_STUDIO3_AUDIO_PROCESSING_PLAN.md) | Not started | ML noise suppression, filter panel, versioned takes |
| [Unified Undo/Redo](UNIFIED_UNDO_REDO_PLAN.md) | Not started | Y.UndoManager across Editor3, DictionaryEditor2, QuestionEditor2, Workbook |
| [Search Architecture](SEARCH_ARCHITECTURE.md) | Partial | S3 bundles + IVF implemented; global search bar not built |
| [Learner Dashboard](LEARNER_DASHBOARD_UX_PLAN.md) | Mostly done | Phase 6.4 card completion check animation remaining |
| [Course Context](COURSE_CONTEXT_SUMMARY_PLAN.md) | Schema done | Integration testing remaining |

## Support & Contact

- **Discord**: [Join Discord](https://discord.gg/BNsTK6nvYw)
- **Email**: info@homework.supply.com
- **GitHub**: [Repository](https://github.com/ExcitingTheory/amplify-homework-supply)
- **Issues**: [Bug Reports](https://github.com/ExcitingTheory/amplify-homework-supply/issues)
- **Security**: See [SECURITY.md](https://github.com/ExcitingTheory/amplify-homework-supply/blob/main/SECURITY.md)

## Contributing

- **[Contributing Guidelines](../CONTRIBUTING.md)** — Code standards and PR process

---

<details><summary><strong>Acronyms used in this document</strong></summary>

| Acronym | Definition |
|---------|------------|
| RSC | React Server Component — rendered on the server, zero client JS |
| ISR | Incremental Static Regeneration — static page revalidated on a timer |
| SSR | Server-Side Rendering — rendered per-request on the server |
| i18n | Internationalization — multi-language support |
| PWA | Progressive Web App — installable, offline-capable web app |
| TTS | Text-to-Speech — audio generation from text |
| XP | Experience Points — gamification reward currency |
| SDK | Software Development Kit |

</details>

<details><summary><strong>App-specific terminology</strong></summary>

| Term | Definition |
|------|------------|
| Unit | A learning module — contains Lexical JSON content, vocabulary, questions, and files. The core content object instructors author. |
| Workbook | The student-facing read-only editor view where learners complete graded blocks within a Unit. |
| Section | A class or student group with a join code. Instructors assign Units to Sections. |
| Assignment | A Unit assigned to a Section with a due date. |
| Grade | A student submission record. `Grade.data` is a JSON object keyed by block ID tracking each response and accuracy. |
| Block | A graded Lexical editor node — one of: `quiz`, `answer`, `meaning-association`, `custom-answer`, `custom-ai`. |
| Rubric | Array of graded block IDs within a Unit, used to calculate overall Grade accuracy. |
| Editor3 | The current (3rd-generation) Lexical-based rich text editor for authoring Units. Located at `src/components/Editor3/`. |
| MiniEditor | Lightweight Lexical editor for chat messages — supports all block types in read-only, and basic rich text when editable. |
| Block Inserter | Notion-style hover "+" button on empty paragraphs that opens a categorized menu for inserting content blocks. |
| Kai | The AI teaching assistant bot. In collaborative chat, `@kai` mentions are handled server-side by `botObserver`. In private chat, uses `ChatSidebar` with Vercel AI SDK. |
| Squad | A student collaborative group — has its own chat room and shared activities. |
| Practice Drill | An AI-generated exercise session. Reuses Workbook graded blocks but with fresh AI-created content from the Unit's source material. |
| ParsedContent | Extracted text, vocabulary, questions, and summaries from an uploaded PDF document. Created by the `analyzeDocument` pipeline. |
| Boss Battle | A gamification challenge format where students collectively defeat a boss by completing assignments correctly. |
| Skill Tree | A visual progression system (our term for "learning path") mapping Unit content to learnable skills. Generated via `generateSkillTreeFromUnit` server action. |
| NailedIt | A student achievement/milestone celebration component shown on profile pages. |
| Data Client | Amplify Gen 2's generated client (`client.models.X`) for type-safe CRUD operations against DynamoDB. |
| observeQuery | Amplify's real-time subscription method — returns a stream of the full item set, automatically handling creates/updates/deletes. |
| `_version` | Integer field on every model for optimistic locking. Incremented on each mutation; used to detect conflicts and suppress subscription echoes. |
| Server Action | A Next.js `'use server'` function in `app/actions/` — replaces direct Lambda calls from the client. Handles auth automatically. |
| botObserver | The Yjs server-side observer that detects bot mentions in collaborative chat and streams OpenAI responses directly into the Y.Doc. |

</details>
