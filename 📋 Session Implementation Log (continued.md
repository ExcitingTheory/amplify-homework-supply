📋 Session Implementation Log (continued — Untitled-4 was found empty on this edit, likely reset when the untitled buffer reloaded; prior Sections 1–5 content is not recoverable from here)

✅ Stacked Accordion Grouping (per hand-drawn spec) — DONE
• Removed gaps between adjacent accordions in a list: InstructorDashboard's `<Stack spacing={3}>` → `spacing={0}`; SectionPanel's own `mb: 2` removed. Rows now sit flush (0px gap).
• Extended the `MuiAccordion` theme override (src/themes/semanticTheme.ts) so ONLY the group's first row gets top-rounded corners and ONLY the last row gets bottom-rounded corners (`&:not(:first-of-type)` / `&:not(:last-of-type)` force the other two corners to 0). Middle rows are fully square.
• Added subtle alternating-row backgrounds via `&:nth-of-type(even) { backgroundColor: theme.palette.action.hover }`.
• Removed SectionPanel's hardcoded `#ffffff` (AccordionSummary) / `#fafafa` (AccordionDetails) backgrounds that were opaquely covering the zebra tint.
• Verified live via DOM measurement on both the teacher (3 sections, InstructorDashboard) and student (2 sections, SectionPanel) dashboards: 0px gap between rows, 12px radius only on the outer corners of the first/last row, alternating white/`rgba(0,0,0,0.04)` row backgrounds.

(Earlier work this session, now lost from this doc but still reflected in the actual code: Instructor Dashboard component extraction (SectionHeader/CompactStudentTable/ParentSectionCard/GradeDonut), Card Thumbnail Consolidation (CardMediaThumbnail, left-anchored, mobile stacking), real-Accordion conversion of the teacher dashboard with semantic MuiAccordion theme radius instead of `!important`, and several confirmed-bug fixes — Late/Overdue chip dedup, Chip icon+avatar conflict, duplicate "Your next step" banner still outstanding.)

🔜 Planned — Not Yet Implemented

1. Pill (Chip) Alignment
• The stat pills/chips in the accordion headers (SectionHeader, SectionPanel summary) need to align centered with each other (same vertical baseline) and as a group be right-aligned within the header row.

2. Progress Visualization: Bars → Segmented Donut
• Replace the Grade Distribution breakdown bar (GradeDistributionBar in InstructorDashboard.jsx — the stacked A/B/C/F segments) and other progress bars (e.g. completion % LinearProgress in SectionPanel/SectionHeader, class-progress-by-unit bars) with a segmented donut chart instead of a linear bar.
• Scope to confirm before implementing: which specific bars convert (grade distribution is the clearest fit for "segmented" since it already has multiple colored bands; plain single-value completion % bars may become a simple ring rather than multi-segment).

---

## 🔲 Outstanding Tasks (compiled by querying full chat history, Oct 2026)

Note: items 1–2 above ("Pill Alignment", "Progress bars → donut") were actually completed later in this same session (E6/E7 in repo memory `dashboard-audit-fixes.md`) — this doc just never got updated after that. They are NOT still outstanding. Below is the accurate current list, pulled directly from the session transcript and repo memory rather than this stale doc.

### A. Backend security fix — needs your explicit approval (schema change)
`amplify/data/resource.ts`: `Grade.owner`/`Grade.unitID` have field-level `allow.authenticated().to(["read"])`, broader than the model-level rule. Combined with an unfiltered `Grade.observeQuery()` in SectionDetailClient.jsx, any authenticated user's subscription receives every Grade record app-wide with `owner`+`unitID` visible (sensitive fields like `accuracy`/`complete` do correctly redact). Proposed fix: remove that field-level override, add `filter: { sectionID: { eq: section.id } }` to the observeQuery call. Never implemented — requires explicit approval + sandbox redeploy per this repo's rules. (Frontend-side mitigation — scoping the Completion Overview roster per viewer role — is already done.)

### B. Collaboration tab rework — started, never finished
From: *"For students Open collaboration rooms should just be their section collaboration rooms instead. With a request review component that we use elsewhere. Notifications that are the top of these sections need to actually go in the Tabs directly. The Tab bodies seems to be adding a secondary title that matched the Tab name, Is redundant."*
Only a plan was stated before the next unrelated request arrived; no code was changed. Still needed:
- Student-facing Collaboration tab should show only that student's own section rooms, using the existing `OpenPeerReviewButton` request-review flow instead of the instructor-oriented `OpenCollaborationRooms` controls.
- Move the notice/banner strips currently rendered above each tab's content (e.g. `NeedsAttention`) so they render inside the active tab panel.
- Remove tab-body headings that just repeat the Tab's own label (redundant secondary titles).

### C. E9 leftover polish (flagged, never revisited)
SectionDetailClient shared-thumbnail / `ContentLockCard` padding parity — explicitly logged as lower-priority and folded into E10/E11, but never actually done.

### D. Known follow-ups flagged but not done (from repo memory)
- e2e specs referencing `data-testid="gradebook-table"`/`"roster-table"`/`"student-grade-table"` (see `docs/JOURNEY_TEST_FAILURES_PLAN.md`) need updating — those elements are now tab-gated, so the tests must click the correct tab first or they won't find the element.
- Full e2e suite and repo-wide `npm run lint` were never run this session (only `get_errors` + scoped `tsc` per change).
- Section 7/8 micro-critiques explicitly skipped: gradebook row `paddingRight` tweak, an "undated assignment placeholder" edge case beyond the general chronological-sort fix, and folding the completion badge directly into `InlineGradeCell` (a simpler "fold into same tab" approach was used instead).

### E. Unrelated, surfaced but not addressed
Pushing to `main` reported GitHub found **50 Dependabot vulnerabilities** (1 critical, 32 high, 15 moderate, 2 low) on the default branch. Not caused by this session's changes, but visible in your terminal output and not yet triaged.

### F. Delta vs. `\.md` (Learning Platform Dashboard Redesign plan) — items that plan raised but this log never tracked (added 2026-10-03, verified against current source)

Already done but never logged here:
- **i18n key-leakage audit** (plan flagged `pages.sectionDetail.*`, `components.assignmentCard.*`, `pages.index.courseDescription`, "Add Course Note", `viewWorkbook`/`practice`/`discussion`) — verified non-issue: no literal leaked keys exist in source; real `t()` calls resolve correctly.
- **CTA button weight hierarchy** (ghost secondary buttons vs. solid primary "Start Workbook"/"Manage Section") — already correct in `AssignmentCardView`.
- **Mobile card stacking** (image full-width on top instead of hidden) — `CardMediaThumbnail.tsx` already does `width: { xs: "100%", sm: size }`.
- **Sticky table headers** (Gradebook/Analytics) — `position: "sticky"` already present at multiple header rows in `SectionDetailClient.jsx`.
- **Open Collaboration Rooms toolbar styling** (grey `action.hover` wrapper instead of floating controls) — already wraps the component in a `bgcolor: "action.hover"` Box.
- **Leaderboard gold/silver/bronze medal styling** — `LeaderboardTable.tsx` already has `MEDAL_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"]` for top 3 ranks.
- **Tabbed navigation split** (Assignments/Gradebook/Leaderboard/Collaboration as separate tabs instead of one long scroll) — already implemented via `activeTab` tab system in `SectionDetailClient.jsx`.

Still genuinely open, never logged anywhere until now:
- **Merge Gradebook + Completion Overview into a single Master Gradebook Grid Table** — NOT done. `SectionDetailClient.jsx` still renders `sectionDetail.gradebook` and `sectionDetail.completionGrid` as two separate sections/tables with overlapping student-status data.
- **Muted icon contrast on assignment-card action icons** (Practice/Discussion/Help icons should read `text.secondary`, not full-contrast black) — unverified; no matching icon-color styling found in `AssignmentCardView`, needs a direct look.

