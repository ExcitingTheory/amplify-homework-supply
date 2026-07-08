# Homework Supply

An interactive elearning platform built with Next.js, AWS Amplify Gen 2, and OpenAI. Instructors author rich multimedia lessons with a custom Lexical editor; students complete graded workbooks with real-time AI tutoring support.

## Features

### Rich Content Editor (Lexical)
Custom block-based editor with graded quiz nodes, meaning-association exercises, audio/video embeds, and AI-powered content completion. Collaborative editing via Yjs with real-time presence.

### AI Agents — Kai & Sage
Multi-step tool-calling agents (Vercel AI SDK) with semantic retrieval (RAG over S3 embedding bundles), persistent conversation memory, and streaming responses. Kai tutors students; Sage assists instructors with analytics and content generation.

### Custom AI-Graded Block
Instructor-customizable exercises graded by OpenAI with security guardrails — immutable system prompt, input sanitization, output schema enforcement, and PII filtering. Supports text, audio, image, and drawing input modes.

### Gamification
XP leveling, 15 hardcoded + custom badges, anti-badges with redemption, skill trees linked to units, easter eggs (keyword/schedule/secret-link/achievement triggers), boss battles with stakes, campaign narratives, squad collaboration, content locks, and cosmetic unlocks. ([details](./docs/GAMIFICATION.md))

### Real-Time Notifications
In-app notification system with category tabs (assignment, collaboration, gamification, squad, system), badge counts, scheduled reminders via Lambda cron, and admin announcements.

### Offline PWA
Serwist service worker with tiered caching (app shell, fonts, S3 media, API). IndexedDB sync queue for grade submissions, on-device embedding cache, and Yjs local persistence. ([details](./docs/OFFLINE_EXPERIENCE.md))

### Instructor Collaboration & Visibility
Collaborator access grants between instructors (read/edit), community browse with fork, and section-scoped student work visibility.

### Course Context Summaries
Typed `CourseOutlineEntry` arrays on sections with vocabulary/question/file counts, auto-generated on publish. Fed to typeahead, chatbots, practice drills, and RecordingStudio3. ([details](./docs/COURSE_CONTEXT_SUMMARY_PLAN.md))

### Learner Dashboard
Section-grouped assignment view with "Up Next" hero cards, inline campaign timelines, and nailed-it badges on completed work. ([details](./docs/LEARNER_DASHBOARD_UX_PLAN.md))

### Soft Delete & Recycle Bin
Soft delete with `deletedAt`/`deletedBy` fields on content models, cascading to join tables. Permanent delete archives to compressed S3; admin-only unarchive restores records.

### File Processing & Storage
Fan-out upload pipeline, S3 with CloudFront signed cookies, PDF analysis with vocabulary extraction, and audio/video transcription. ([details](./docs/FILE_PROCESSING_PIPELINE.md))

### Search
Semantic search over embeddings (text-embedding-3-small, 512D) with IVF clustering for large bundles, client-side IndexedDB cache. ([details](./docs/SEARCH_ARCHITECTURE.md))

---

## Outstanding Plans (Not Yet Implemented)

| Feature | Status | Plan |
|---------|--------|------|
| **Admin Bot "Atlas"** — AI admin assistant with 25+ tools for user management, platform settings, announcements, and system health | Not started | [ADMIN_BOT_PLAN.md](./docs/ADMIN_BOT_PLAN.md) |
| **Audio Filter Panel** — ML noise suppression (RNNoise) and EQ presets for RecordingStudio3 playback; pre-submission cleanup; versioned takes | Not started | [RECORDING_STUDIO3_AUDIO_PROCESSING_PLAN.md](./docs/RECORDING_STUDIO3_AUDIO_PROCESSING_PLAN.md) |
| **Unified Undo/Redo** — Single Yjs UndoManager across Lexical body, dictionary, questions, and metadata on the unit detail page | Not started | [UNIFIED_UNDO_REDO_PLAN.md](./docs/UNIFIED_UNDO_REDO_PLAN.md) |
| **Learner Dashboard Phase 6** — Card completion check animation | Phases 1–5 complete; level-up + chapter-unlock celebrations done | [LEARNER_DASHBOARD_UX_PLAN.md](./docs/LEARNER_DASHBOARD_UX_PLAN.md) |
| **Offline AI & Data** — On-device LLM (WebLLM + Chrome AI) implemented; DynamoDB offline data cache and conflict resolution UI integration testing remaining | Core offline AI exists; integration testing needed | [OFFLINE_EXPERIENCE.md](./docs/OFFLINE_EXPERIENCE.md) |
| **Course Context Testing** — End-to-end publish flow validation, token budget audit | Schema + frontend consumers + Lambda done; integration testing remaining | [COURSE_CONTEXT_SUMMARY_PLAN.md](./docs/COURSE_CONTEXT_SUMMARY_PLAN.md) |

### Completed Plans

All completed features are documented in [FEATURES.md](./docs/FEATURES.md): custom themes, instructor visibility & collaboration, soft delete & recycle bin, notification system, custom AI block, agent architecture, app security/platform hardening, searchable sections, AI badge designer, learner dashboard phases 1–5, celebration animations, and course context summary.

---

## Getting Started

```bash
npm run dev          # Next.js dev server (port 3000)
npm run storybook    # Component development (port 6006)
npx ampx sandbox     # Deploy Amplify backend locally
```

See [docs/ONBOARDING.md](./docs/ONBOARDING.md) for full setup and [docs/QUICK_START.md](./docs/QUICK_START.md) for essential links.

## Testing

```bash
npm run journeys              # Playwright E2E user journeys
npm run journeys:offline      # Offline-specific journeys
npm run journeys:ui           # Interactive Playwright UI
```

Start the app first with `npm run dev` (or use `npm run journeys:wait-and-run`).

## Documentation

### Getting Started
- [Quick Start](./docs/QUICK_START.md) — Links and communication channels
- [Onboarding](./docs/ONBOARDING.md) — Developer setup
- [Storybook Onboarding](./docs/STORYBOOK_ONBOARDING.md) — Adding components

### Technical Reference
- [API](./docs/API.md) — Data models, Lambda functions, routes
- [App Router Migration](./docs/APP_ROUTER_MIGRATION.md) — Next.js architecture
- [SSR & Performance](./docs/SSR_PERFORMANCE.md) — React Compiler, Turbopack, View Transitions
- [CloudFront CDN](./docs/CLOUDFRONT_CDN.md) — Signed cookies, image optimization
- [Optimistic Concurrency](./docs/OPTIMISTIC_CONCURRENCY.md) — `_version`-based conflict resolution
- [S3 Content Storage](./docs/S3_CONTENT_STORAGE_SPEC.md) — Paths, versioning, lifecycle
- [S3 Embeddings](./docs/S3_EMBEDDINGS_SPEC.md) — Embedding storage and retrieval

### Process
- [Contributing](./CONTRIBUTING.md) — Code standards and PR process
- [Code of Conduct](./CODE_OF_CONDUCT.md) — Community standards
- [Security](./SECURITY.md) — Reporting and best practices

## Communication & Support

- **Email**: [info@homework.supply.com](mailto:info@homework.supply.com)
- **Discord**: [Join Discord](https://discord.gg/BNsTK6nvYw)
- **Bug Reports**: [GitHub Issues](https://github.com/ExcitingTheory/amplify-homework-supply/issues)
- **Storybook**: [Component Library](https://main--67e40f1917d7a8ef683541d7.chromatic.com)
- Each journey test now writes a `journey-diagnostics.json` artifact with:
	- Console logs (all levels)
	- Network traffic summary (responses, failed requests, HTTP error counts)
	- Browser metrics (FCP, LCP, CLS, INP, and navigation timings)
- Diagnostics are attached to Playwright test output in `test/test-results/journeys-output`.

Direct Playwright UI command:

```bash
npx playwright test --config=test/e2e/journeys/playwright.config.ts --ui
```

