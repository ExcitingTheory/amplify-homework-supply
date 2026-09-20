# AI Feedback Coverage Plan

> Status: Planned expansion; chat integration is implemented
>
> Goal: every user-visible AI-generated result has a consistent, accessible way to
> submit feedback with enough context to diagnose and evaluate the generation.

## Existing Foundation

- `AIFeedback` is defined in `amplify/data/resource.ts` with content type,
  positive/negative rating, reasons, comments, model metadata, generated content,
  and contextual IDs.
- `src/components/AIFeedbackWidget.tsx` persists feedback and has Storybook stories.
- `src/components/ChatSidebar.jsx` renders the widget for assistant text messages.
- `src/utils/aiFeedbackUtils.ts` contains query, aggregate, and submission helpers.

The current widget is not yet a complete project-wide contract. It duplicates schema
enums, uses broad casts, contains non-localized fallback strings, does not visibly
delete a persisted rating when toggled off, and is not integrated with most generated
content surfaces. Resolve these before multiplying integrations.

## Product Contract

Every durable or consequential generated result should expose feedback adjacent to
the result. Ephemeral suggestions may use accept/dismiss/correct signals instead of a
large widget, but those signals must map to the same feedback taxonomy.

Required context:

- Stable generation/result ID and content type.
- Model/provider and server-side trace or request correlation ID.
- Applicable unit, grade, document, section, or session ID.
- A privacy-reviewed prompt reference or redacted prompt summary, not hidden secrets.
- Exact displayed output or a durable content hash plus version.
- Locale, persona, tool names, and offline/online generation mode when applicable.

The user must be able to revise or remove feedback. Submission needs loading,
success, retry, offline, and permission states. Controls must be keyboard and screen
reader accessible and must not cover generated content at narrow widths.

## Impacted Surfaces

| Content type | User-facing owners | Integration expectation |
| --- | --- | --- |
| Chat messages and generated tool results | `ChatSidebar.jsx`, `ChatSidebar/ContentPreview.tsx`, `ChatSidebar/RecordingScriptPreview.jsx`, `CollaborativeChat/ThreadView.tsx` | Keep message feedback; add feedback to durable generated previews and Kai replies without rating search results as generated content. |
| Content completion | `Editor3/plugins/AIContentCompletionPlugin.js` | Capture accept, partial accept, dismiss, and edited-after-accept signals with a compact affordance. |
| Block suggestions | `Editor3/plugins/BlockSuggestionPlugin.jsx` | Capture insert, dismiss, and explicit negative reasons for each suggestion batch. |
| Custom AI grading | `Editor3/nodes/CustomAINode/CustomAIComponent.tsx`, `Editor3/Workbook.tsx`, `GradedWorkbookViewer/GradedWorkbookViewer.tsx` | Rate grading feedback separately from the learner answer; associate `gradeID` and block ID. |
| Generated images and audio | `Editor3/components/EnhancedGenerators.jsx`, `Editor3/components/FileManager2.jsx`, `Editor3/nodes/CustomAnswerNode/CustomAnswerEditor.jsx`, `Gamification/BossBattleForm.tsx`, `GroupChallengeEditor.tsx` | Place feedback beside the selected output and retain generation/version identity across regenerate actions. |
| Document analysis and extracted content | `Editor3/components/FileManager2.jsx`, `VocabularyReview2.tsx`, `QuestionsReview2.tsx`, `Editor3/nodes/FileMetadataNode/FileMetadataComponent.jsx` | Rate analysis groups and individual extracted items; distinguish extraction errors from editorial rejection. |
| Transcription and recording analysis | `RecordingStudio2.jsx`, `Editor3/components/AnswerComponent.jsx`, recording and custom-answer editors | Let users correct transcripts; preserve corrected text as a stronger signal than thumbs alone. |
| Practice drills | `PracticeDrill/usePracticeDrill.ts`, `PracticeDrill/PracticeDrillDialog.tsx`, `PracticeDrill/PracticeDrillWorkbook.tsx` | Rate the generated drill as a set and flag individual invalid or unsuitable blocks. |
| Generated skill trees and challenge art | `Gamification/SkillTree.tsx`, `Gamification/BossBattleForm.tsx`, `GroupChallengeEditor.tsx` | Collect feedback before save/publish and after regeneration. |
| Grade summaries | `src/context/unitContext.jsx` and the instructor/learner surfaces that render its generated summary | Associate with grade and visibility role; avoid exposing private prompt context. |

Server-side generation owners that must emit correlation metadata include
`app/api/chat/route.ts`, `app/api/content-completion/route.ts`,
`app/api/suggest-blocks/route.ts`, `app/api/grade-ai/route.ts`, and generation,
grading, drill, peer-review, feedback, and gamification server actions under
`app/actions/`.

## Delivery Plan

### Phase 1: Harden the shared contract

- Generate or import schema-derived enums and remove `as any` from creation input.
- Define create/update/delete semantics so toggling or revising feedback matches the
  persisted record.
- Add a stable `generationId`/trace correlation strategy without storing secrets or
  unnecessary personal data.
- Localize every visible label, reason, success message, and failure message.
- Add unit tests for persistence, retries, duplicate feedback, updates, deletion,
  permission failures, and redaction.
- Add Storybook interactions for keyboard use, negative-reason validation, narrow
  layouts, offline failure, and successful retry.

### Phase 2: Integrate high-risk output

1. Custom AI grading and grade summaries.
2. Document analysis, vocabulary extraction, and question extraction.
3. Transcriptions and generated recording content.
4. Practice drills and inserted generated blocks.

### Phase 3: Integrate creative and assistive output

1. Generated images/audio and regeneration history.
2. Skill trees, challenge art, and peer-review AI replies.
3. Content completion and block suggestions using lightweight implicit signals.

### Phase 4: Close the learning loop

- Build an administrator review queue using the existing `AIFeedback` model.
- Define moderation state, assignment, resolution, and audit history before adding
  workflow fields to the schema.
- Correlate feedback with Phoenix traces and evaluation datasets using opaque IDs.
- Track feedback rate, negative-reason distribution, response latency, unresolved
  reports, model/version regressions, and accepted suggestion rate.
- Convert representative, privacy-reviewed failures into regression evaluations.

## Acceptance Criteria

- An inventory test or maintained registry maps every AI content type to its UI owner.
- All consequential generated content surfaces provide explicit feedback.
- Ephemeral generation surfaces provide consistent implicit feedback signals.
- Feedback can be created, changed, removed, retried, and reviewed.
- No API keys, system prompts, unredacted PII, or unrelated learner data are persisted.
- Every integration has an interaction test and the relevant authorization test.
- Feedback records can be correlated to a Phoenix trace without exposing user data.

## Good First Issues

- Add a typed content-type registry shared by the widget and its stories.
- Localize the widget's remaining literal labels and snackbar messages.
- Add a narrow-layout and keyboard-only interaction story.
- Add feedback to one generated-image preview after the shared contract is hardened.
