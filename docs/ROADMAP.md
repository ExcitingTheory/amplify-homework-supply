# Homework Supply Roadmap

> Last audited: 2026-09-19
>
> Current phase: **testing, component-completeness review, and usability validation**

Homework Supply has broad product functionality in place. The current priority is
not feature volume: it is proving that existing workflows are complete, usable,
accessible, observable, and safe to release. A feature listed as implemented below
still requires the applicable release gates before it is considered production-ready.

This roadmap is the project-level index. Detailed designs and issue-sized work should
live in the linked plans rather than being duplicated here.

## Status Definitions

| Status | Meaning |
| --- | --- |
| Implemented | Matching application behavior exists in the current source. |
| Validation | Core behavior exists, but testing, integration, usability, or rollout work remains. |
| Planned | A documented design exists but material implementation has not started. |
| Proposed | Requirements or architecture still need decisions before implementation. |

## Current State

### Implemented product areas

- Authentication and role-aware access for administrators, instructors, and learners.
- Unit authoring with the Lexical-based Editor3 and interactive workbook rendering.
- Graded quiz, vocabulary answer, custom answer, meaning-association, and custom AI blocks.
- Streaming Kai/Sage chat, tool calls, semantic search, and editor block insertion.
- Assignment, section, grading, peer-review, notification, and instructor workflows.
- File and media management, document analysis, generated media, and recording tools.
- Gamification, dashboards, skill trees, campaigns, squads, badges, and leaderboards.
- Offline/PWA infrastructure, Yjs collaboration, and conflict-resolution foundations.
- Reusable AI feedback persistence and UI; chat messages currently expose it.
- OpenTelemetry/Phoenix tracing and agent-evaluation scaffolding.
- Storybook, Vitest, Playwright, TypeScript project checks, and ESLint infrastructure.

See [FEATURES.md](FEATURES.md), [MAIN_FEATURES.md](MAIN_FEATURES.md), and
[API.md](API.md) for the detailed feature and architecture inventories.

### Components in validation

| Area | Current evidence | Work remaining |
| --- | --- | --- |
| Storybook components | 1,007 stories; 818 have `play` functions (81.2%) in the 2026-09-12 audit | Close risk-bearing interaction gaps; classify intentionally visual stories separately. |
| User journeys | Playwright coverage exists | Replace synthetic completion and skipped spotlight flows with real user actions. |
| Onboarding | Tour and task framework exists | Repair missing targets, broken selectors, and completion-sequence mismatches. |
| Editor block presentation | Quiz read-only styling is complete | Finish editable quiz, answer, custom answer, meaning-association, custom AI, and media block redesigns. |
| Internationalization | Six-locale structure and extraction tooling exist | Translate the remaining keys and add Storybook locale coverage. |
| Course context | Data and consumers are substantially implemented | Verify publish-to-generation flow and token budgets end to end. |
| Offline experience | Service worker, local data, sync, and offline AI exist | Run authenticated integration and conflict-resolution usability tests. |
| Learner dashboard | Main phases are implemented | Complete and test the remaining completion-state animation. |
| RecordingStudio3 processing | RNNoise processing foundation exists | Complete filter UI, take versioning, rollback, and validation. |
| Unified undo/redo | Per-surface history exists; shared design is documented | Integrate Yjs `UndoManager` across authoring surfaces. |
| Search | Global and editor search implementations exist | Test relevance, authorization boundaries, highlighting, empty states, and large indexes. |

Primary evidence: [STORYBOOK_INTERACTION_AUDIT.md](STORYBOOK_INTERACTION_AUDIT.md),
[TEST_AUDIT.md](TEST_AUDIT.md), [ONBOARDING_TOUR_AUDIT.md](ONBOARDING_TOUR_AUDIT.md),
[EDITOR_BLOCK_REDESIGN_PLAN.md](EDITOR_BLOCK_REDESIGN_PLAN.md), and
[I18N_MISSING_TRANSLATIONS.md](I18N_MISSING_TRANSLATIONS.md).

### Planned or proposed areas

- Atlas administrative assistant: [ADMIN_BOT_PLAN.md](ADMIN_BOT_PLAN.md).
- Remaining audio processing and take history:
  [RECORDING_STUDIO3_AUDIO_PROCESSING_PLAN.md](RECORDING_STUDIO3_AUDIO_PROCESSING_PLAN.md).
- Shared authoring undo/redo: [UNIFIED_UNDO_REDO_PLAN.md](UNIFIED_UNDO_REDO_PLAN.md).
- Additional Lexical blocks and editor actions:
  [LEXICAL_ADDITIONAL_BLOCKS_PLAN.md](LEXICAL_ADDITIONAL_BLOCKS_PLAN.md).
- AI feedback coverage for every user-visible generated result:
  [AI_FEEDBACK_COVERAGE_PLAN.md](AI_FEEDBACK_COVERAGE_PLAN.md).
- Load-time and bundle improvements: [LOAD_TIME_OPTIMIZATION_PLAN.md](LOAD_TIME_OPTIMIZATION_PLAN.md).

## Release Priorities

### P0: Trust the test results

- Repair the journey tests identified in [TEST_AUDIT.md](TEST_AUDIT.md) so they
  execute real workflows rather than injecting completion state.
- Fix the blocking onboarding targets and completion criteria in
  [ONBOARDING_TOUR_AUDIT.md](ONBOARDING_TOUR_AUDIT.md).
- Re-run lint, parallel typechecking, unit tests, Storybook tests/build, Next.js
  build, authenticated journeys, and the console crawl using
  [RELEASE_STRATEGY.md](RELEASE_STRATEGY.md).
- Establish explicit acceptance criteria for component completeness: keyboard,
  screen reader, narrow viewport, loading, empty, error, offline, and permission states.

### P1: Complete and review existing components

- Finish the remaining editor block visual redesign.
- Resolve documented layout collisions and page-story design issues.
- Complete risk-based Storybook interactions, prioritizing forms, destructive
  actions, grading, permissions, and generated content over display-only variants.
- Conduct moderated usability sessions for the authoring, assignment, workbook,
  grading, onboarding, and offline recovery workflows.
- Convert findings into reproducible issues with screenshots, expected behavior,
  accessibility impact, and a linked test requirement.

### P1: Engineering quality baseline

- **Formatting:** select and configure Prettier or an equivalent formatter; add
  check-only CI and document editor integration. Keep formatting changes separate
  from behavior changes.
- **Linting:** verify the existing ESLint 9 flat configuration across `src/`,
  `app/`, `pages/`, tests, scripts, and stories. Do **not** add TSLint: it is
  deprecated and this repository already uses ESLint with TypeScript support.
- **Typechecking:** verify `npm run typecheck` and `npm run typecheck:parallel`
  against all maintained TypeScript project configs; add CI coverage for any
  omitted scripts or stories.
- Define a scheduled dependency-vulnerability workflow with triage ownership,
  severity SLAs, lockfile review, and documented exceptions.
- Audit third-party source and embedded assets for SPDX metadata, attribution,
  redistribution requirements, and license compatibility. Generate a distributable
  notices artifact and fail CI on prohibited or unknown licenses.

### P1: AI quality and observability

- Complete [AI_FEEDBACK_COVERAGE_PLAN.md](AI_FEEDBACK_COVERAGE_PLAN.md), including
  stable generation IDs, model/prompt metadata policy, retries, accessibility,
  analytics, and administrator review.
- Validate self-hosted Phoenix first, then Phoenix Cloud, using
  [PHOENIX_EVALS.md](PHOENIX_EVALS.md).
- Confirm traces cover every server-side generation path, redact sensitive prompt
  data, use environment-specific projects, and expose actionable latency/error/token
  dashboards and alerts.
- Expand evaluations for groundedness, tool selection, safety boundaries,
  multilingual quality, grading consistency, and regressions found through feedback.

### P2: Editor capabilities

Use [LEXICAL_ADDITIONAL_BLOCKS_PLAN.md](LEXICAL_ADDITIONAL_BLOCKS_PLAN.md) as the
source for dependencies, open decisions, phases, and issue boundaries. Do not begin
high-risk blocks until serialized-state compatibility, read-only rendering, import/
export behavior, permissions, i18n, accessibility, and migration tests are defined.

### P2: Support, diagnostics, and community

- Verify the hidden diagnostic panel captures a consented, redacted snapshot,
  downloads reliably, and sends through the configured support path without secrets.
- Decide whether chat may open the panel or prepare a report. Require an explicit
  user preview and send action; the agent must never transmit diagnostics silently.
- Add a consistent support destination to application help surfaces: contact form or
  support email, Discord, and GitHub issues/contribution guidance.
- Define Discord ownership, moderation, notification rules, bot permissions,
  retention, and incident escalation before expanding integrations.
- Hold community meetings only when participation warrants them; publish an agenda,
  code of conduct, notes, and asynchronous feedback path.

### P2: Cross-cutting audits

- Search: relevance fixtures, authorization isolation, stale-index behavior,
  highlighting links, keyboard use, and multilingual queries.
- Error handling: shared error taxonomy, useful recovery actions, correlation IDs,
  offline behavior, and no swallowed subscription or generation failures.
- Performance: large Lexical documents, media-heavy units, subscription counts,
  render profiling, collaboration latency, memory use, and bundle budgets.
- Accessibility: WCAG 2.2 AA review, automated checks plus keyboard and assistive
  technology testing for editor dialogs, custom blocks, drag/drop, and timers.
- Internationalization: remove literal UI strings, verify locale-sensitive dates and
  numbers, test RTL readiness, and document locale-aware Storybook practices.
- Security: threat-model AI and editor import/export paths; review authorization,
  sanitization, uploads, prompt injection, PII, CSP, audit logs, and dependency risk.
- Documentation: reconcile stale status claims and update editor feature, serialized
  format, authoring, migration, and troubleshooting references.

## Good First Issues

These are candidates, not automatic labels. Each issue should be confirmed against
the current branch and include a focused test or interaction story.

| Candidate | Why it is bounded | Expected artifacts |
| --- | --- | --- |
| Document the ESLint-versus-TSLint decision | Documentation-only and removes an obsolete assumption | Roadmap/tooling docs update. |
| Add a formatter evaluation record | Small research task with objective comparison criteria | Decision record for Prettier or alternative; no mass reformat. |
| Add editor case transforms | Local toolbar command with no new serialized node | Utility, toolbar action, unit test, interaction story. |
| Verify animated GIF behavior | Existing image path already accepts common media | GIF fixture/story and any narrowly required validation fix. |
| Add an editor keyboard-shortcuts menu entry | Existing reference content is available | Toolbar/help action, accessible dialog/link, story. |
| Add support links to editor help | Existing Discord and GitHub destinations can be reused | Localized menu copy and interaction story. |
| Add Storybook locale variants for a small component | Isolated and repeatable | One component's locale stories and assertions. |
| Classify display-only Storybook gaps | No production behavior change | Audit annotations explaining why `play` is or is not required. |
| Add AI feedback to one isolated generated-image preview | Reuses the existing widget and schema | Integration, stable metadata mapping, interaction story. |
| Add a Phoenix setup smoke-check document | Documentation and environment verification only | Redaction-safe local trace checklist. |

Page breaks, HTML import/export, Ruby nodes, collaboration permissions, polls, and
timed graded sections are **not** good first issues: they affect persistence,
security, interoperability, or grading semantics.

## Suggested Missing Work

- Define a public support policy and security-reporting path distinct from Discord.
- Add data-retention and deletion rules for prompts, traces, AI feedback, diagnostics,
  transcripts, and anonymous poll responses.
- Define browser/device support and test matrices, including microphone permissions,
  reduced motion, high contrast, touch, and offline transitions.
- Add serialized Lexical fixture migrations and backward-compatibility gates before
  introducing more custom nodes.
- Establish feature flags and rollback criteria for high-risk editor and AI releases.
- Add product-level success measures: task completion, authoring time, learner errors,
  feedback rate, AI acceptance rate, and support burden.
- Add backup/restore drills for S3 content, DynamoDB records, collaboration state,
  Phoenix data, and exported learning content.

## Issue Authoring Rules

When moving roadmap work into GitHub:

1. Create one epic per linked plan or release priority, not one issue for this file.
2. Split implementation by independently testable behavior and owner.
3. Include current evidence, expected files or symbols, acceptance criteria, tests,
   accessibility/i18n requirements, migration impact, and rollback notes.
4. Apply `good first issue` only to the bounded candidates above after maintainer review.
5. Link the issue back to this roadmap and its detailed plan; update status in the
   detailed plan first and summarize milestones here.
