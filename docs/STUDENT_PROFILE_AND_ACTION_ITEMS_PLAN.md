# Student Profile and Action Items Plan

## Status

Product scope and decisions are agreed. This document is a plan, not an
implementation authorization. No production code, data schema, or deployment
is changed by this plan.

## Goal

Give an instructor a section-specific view of a student’s learning activity,
coursework health, and learning patterns, with transparent follow-up suggestions
and an auditable record of teacher actions.

## Product decisions

- Show metrics that the platform has collected for the student, and build
  section-scoped student rollups to make them useful on the profile.
- Use transparent rules for recommendations. Thresholds have platform defaults
  and can be overridden per section.
- Generate an AI activity summary when the student’s section rollup changes.
  The summary can compare the student to section average, minimum, maximum, and
  median, and describe evidence-backed struggles. AI output is a suggestion,
  not a diagnosis or authoritative risk label.
- Limit the page, metrics, memory, rollups, comparisons, and summary to the
  selected section. A student enrolled in multiple sections has distinct views
  and data for each.
- Keep action records append-only. Editing an action adds a revision; neither
  actions nor their revisions can be deleted.
- Allow the instructors authorized for that section and administrators to
  access action records. Do not expose teacher notes to students by default.
- Provide entry points from the section gradebook and the student’s profile.

## Profile content and metric inventory

Display available student-level information, with section context and
appropriate time ranges. Availability depends on each source record being
associated with both the student and selected section.

### Learning and assignments

- **Grades:** completion percentage and status, accuracy, attempt number, and
  per-block completion, accuracy, responses, and feedback. Grade records may
  also include submitted files, engaged time, instructor-review information,
  and peer-review details.
- **Assignment rollups:** best, worst, sum, effective score, number of attempts,
  and first completion time. Assignment due dates and late status support
  on-time tracking.
- **Section progress:** completed assignments, total submissions, on-time
  submissions, “nailed it” counts, active days, last activity date, and recent
  submission timestamps.

### Skills and learning patterns

- **By unit/module:** completion percentage, completed and total workbooks,
  personal-best score and previous best, and skill status (locked, available,
  in progress, or mastered).
- **Concept memory:** weak and strong concepts, attempts, average accuracy,
  accuracy by source, review priority, last-practiced time, and confusion
  pairs/frequencies. Where present, include global or per-unit AI memory only
  after it has been correctly scoped to the selected section.

### Practice and gamification

- **Practice drills:** drill type, accuracy, block count and completions,
  completion status, XP awarded, responses, coverage, weak/strong areas, and
  source breakdown.
- **Gamification:** total XP, level, current and longest streak, last activity
  date, streak freezes remaining/used, badge and reward history, discovered
  easter eggs, and active debuffs.
- **XP ledger:** XP amount, reason, accuracy when present, and related section,
  unit, and reference.

### Time and activity analytics

- **Per-student report card:** grade minimum, maximum, average, and count; and
  engaged-time minimum, maximum, average, and count. Engaged time represents
  active interaction, not merely elapsed time.
- **Tracked student events:** where individually attributable and scoped,
  include page views, workbook starts/completions/retries, engaged-time updates,
  grade submissions, chat activity, media playback/downloads, document
  analysis, peer reviews, practice drills, badges/level-ups, and squad activity.
  Events may include timestamps, session/path, user, section/unit, and
  event-specific metrics such as accuracy, engaged time, or drill XP.

### Analytics boundary

The Kinesis analytics pipeline produces daily aggregates by platform,  m section,
unit, squad, page, or geography, including active users, page views, sessions,
average session duration, engaged time, grades/accuracy, workbook activity,
chat, document analysis, and Web Vitals (LCP, INP, TTFB, FCP, CLS). These are
cohort/platform aggregates, not individual student reports. Do not attribute
them to a student or present them as student metrics. Use only separately
available events that can be reliably associated with that student and section.

## Rollups, comparisons, and recommendations

1. Establish a per-student, per-section rollup. Include only source records
   associated with that student and section; retain unit-level breakdowns where
   useful.
2. Record metric definitions, denominators, and relevant time windows so the UI
   can explain how a metric was calculated. Do not treat missing or ungraded
   work as a zero without an explicit grading rule.
3. Calculate section comparison values (average, minimum, maximum, and median)
   from eligible students and the same metric definition/time window. Do not
   include the focal student in their own comparison if product/privacy review
   determines that is necessary; this remains a design question before
   implementation.
4. Define platform-default recommendation rules and thresholds, with
   section-level overrides. Each suggestion should identify the triggering
   metric/rule, offer a relevant teacher action, and allow the instructor to
   dismiss or record a response. Avoid unsupported labels such as “at risk”
   until their meanings and thresholds are explicitly approved.
5. When the section rollup changes, enqueue/update a section-specific summary
   using only that rollup and section benchmarks. Keep the summary tied to the
   rollup version/time so stale output is detectable. Show the comparison
   context and make clear that generated observations may be incomplete.

## Teacher action history

Provide a way to record a planned follow-up or an action taken, linked to the
student and section. An action should support a description, creator, timestamps,
status, optional target date, and optional outcome/follow-up. A teacher edit
creates a new immutable revision linked to the prior version, preserving who
changed what and when. There is no delete path.

Only instructors authorized for the associated section and administrators may
read or append action revisions. Authorization must be enforced by the backend,
not only by hiding UI controls. Student visibility is off by default.

## Section isolation and existing system

- A section selection is required for instructor-facing profiles and summaries.
- A student’s memories and rollups must be separated by section; never fall back
  to global memory for a section profile or mix data from other sections.
- Unit-level memory may remain nested under the section scope.
- Existing `Section.studentProgress` is a section-level rollup. Confirm its
  fields and update cadence before deciding whether to extend or complement it.
- The existing `StudentMemory` model is keyed by student and optionally unit;
  its current shape does not itself enforce section separation. All relevant
  reads, writes, and aggregations need a section-aware design.
- Grade and analytics sources must be verified for reliable student/section
  association before being included in a student rollup.

## Proposed entry points

- Add an “About this student” link/action from the section gradebook.
- Add the same entry point from the student’s profile when the instructor is
  viewing that student in a specific section.
- Preserve the selected section in navigation and make the section clear in the
  page header.

## Acceptance criteria

- Instructors can open a student profile only in a section they are authorized
  to teach; administrators can access it according to admin policy.
- All displayed metrics, memory, rollups, comparisons, recommendations, and AI
  summaries are scoped to that section.
- Available individual metrics are displayed with definitions/context; cohort
  analytics are never misrepresented as individual data.
- Section comparisons use the same metric definition and eligible population
  across average, minimum, maximum, and median.
- Recommendations can be traced to configured rules and thresholds, including
  section overrides.
- The summary is regenerated from the appropriate section rollup and clearly
  distinguished from measured facts.
- Teachers authorized for the section and administrators can create and revise
  action records; prior revisions remain readable and records cannot be deleted.
- Both the gradebook and student profile provide a route to the section-specific
  view.

## Open design questions before implementation

- Which collected event types have trustworthy student and section identifiers
  and should be included in the initial rollup?
- What time windows and eligibility rules apply to each section comparison?
- Should the focal student be included in the section benchmark calculations?
- Which recommendation rules and initial platform default thresholds are
  appropriate, and which may sections override?
- What exact action statuses, reminder behavior, and instructor dismissal
  behavior are needed?
- Which profile metrics should be visible to all authorized section instructors
  versus administrators only?
- How should revision history be presented and should every section instructor
  be able to revise another instructor’s action?
- Which model/provider, prompt, and regeneration mechanism should produce the
  summary, and how should generation failures or stale summaries appear?

## Suggested implementation sequence

1. Audit available data sources and authorization paths; define the section
   rollup contract, metric definitions, eligibility, and benchmark population.
2. Design and test section-aware memory and rollups, including legacy global
   memory behavior and isolation across multiple sections.
3. Design backend-enforced access and append-only action/revision records.
4. Build the section-specific profile and gradebook/profile entry points.
5. Add configurable transparent recommendation rules and explainable UI.
6. Add rollup-triggered, versioned AI summaries with section comparisons.
7. Test access boundaries, section isolation, metric calculations, revision
   immutability, stale summaries, and missing/ungraded data behavior.
