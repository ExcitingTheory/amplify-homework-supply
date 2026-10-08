# Page/Story Design Critique — Outstanding TODO

Tracks remaining work from [PAGE_STORY_DESIGN_CRITIQUE_PLAN.md](PAGE_STORY_DESIGN_CRITIQUE_PLAN.md) after an audit of the current codebase (2026-10-07). Roughly half the original plan is already implemented (Semantic Theme, type scale, button/chip/card tokens, `EmptyState`/`ErrorState` components, Cancel button neutral color, Offline MUI button, safe-area FAB, etc.) — only the outstanding items are listed below, grouped and ordered by the plan's own priority tiers.

## P0 — small, verifiable bug fixes

- [x] ~~T2~~ — Instructor Grade accuracy chip color is semantically correct (red only below 60%, a genuine error state); no fix needed.
- [x] ~~T3~~ — Timed-workbook start/resume/completed gate already fully implemented in `WorkbookClient.tsx`'s `TimerWrappedEditor` (static resume snapshot, session-guarded direct-start, `UnitCompletedPlugin.jsx` time-limit display, `SEMANTIC_THEME.radius.modal`/`surface.lightGlass` styling with a no-blur-support fallback) plus three dedicated stories in `pages-workbook.stories.tsx`.

## P1 — design-system consistency

- [x] ~~T4~~ — `CardMediaThumbnail.tsx` now renders a deterministic gradient + monogram (reusing `heraldry.ts`'s `pickTinctures`/`readableInk`, keyed to a new `title` prop) instead of plain empty-label text when there's no cover image. Wired `title` through all 6 consumers: `UnitCard.tsx`, `AssignmentFeedCard.tsx`, `CommunityUnitCard.tsx`, `SharedUnitCard.tsx`, `SectionsClient.jsx`, and `PublishedUnitHtmlThumbnail.jsx` (+ its caller `AssignmentCard.tsx`). Also fixed 2 layout bugs surfaced while verifying live: (1) `CommunityUnitCard`/`SharedUnitCard`/`UnitCard`/`SectionsClient` switched to row layout at the `md` breakpoint while `CardMediaThumbnail`'s own internal breakpoint is `sm` \u2014 aligned all four to `sm` so the thumbnail and card layout change together instead of the image floating as a small square inside a still-column layout between 600\u2013900px. (2) None of those four passed `fillHeight`, so the thumbnail stayed locked to its fixed `size` (160px) instead of stretching to the row's actual height in horizontal mode \u2014 added `fillHeight`, matching `AssignmentFeedCard.tsx`'s existing pattern. Verified live in Storybook (CommunityUnitCard + SharedUnitCard stories).
- [x] ~~T5~~ — Standardized the card-footer action-row pattern (secondary outlined actions left, one primary solid action right, `justifyContent: "space-between"`). Fixed 3 deviating footers: `app/[locale]/units/UnitCard.tsx` (View Workbook now primary/right, Practice+Edit secondary/left), `src/components/Dashboard/SectionPanel.tsx` (View Class now primary/right, Discuss+Skills secondary/left), `src/components/InstructorDashboard.jsx`'s `SectionFooterActions` (Manage Section now right-aligned via `space-between` instead of `ml: "auto"` on the overflow button). `AssignmentCardView.tsx`/`AssignmentFeedCard.tsx` already matched the pattern.
- [ ] **T6** — Design and build the workbook/editor two-row app-bar contract (title+description row, contextual tools row) with hover-reveal/marquee + click-to-popover for truncated title/description text. No such component exists yet.

## P2 — state design

- [x] ~~T7~~ — `EmptyState`/`ErrorState` already wired into Drill, Peer Review, Squad join (`SquadJoinPanel.tsx`), and `NailedItWall.tsx`. Fixed the Leaderboard "Fastest" tab gap: `FastestCompletionsTable` returned `null` on an empty filtered list while the parent's blanket `entries.length === 0` check didn't fire (students with XP but no completed timed assignments saw a blank tab) — `LiveLeaderboard.tsx` now shows a dedicated `EmptyState` for that case. Also discovered and fixed the root cause: `StudentProfile.reportCard.timeStats` (schema existed, frontend read it) was never populated by any backend function. `amplify/functions/gamification/handler.ts`'s `rebuildLeaderboard` now computes `timeStats` (min/max/avg/count) from each student's `Grade.engagedTimeMs` — the existing focused-time-excluding-idle field already tracked for every assignment, not just timed ones — so "Fastest" now has real data for any assignment type.
- [x] ~~T8~~ — Scroll lock already implemented: `Workbook.tsx:142` sets `scrollLocked = Boolean(timerGateOverlay) || Boolean(showUnitComplete)`, applied as `overflowY: scrollLocked ? "hidden" : "auto"`.
- [ ] **T9** — Verify/standardize the mobile drawer backdrop (blurred/tinted) and close affordance in `MainToolbar.jsx`'s `SwipeableDrawer`.

## P3 — delight

- [x] ~~T10~~ — `AnalyticsClient.tsx`'s `StatCard` now takes an `icon` prop (wired per-metric: people/visibility/devices/clock/timer/hourglass/play/check/assignment/grade/chat/description icons) and a `trend` prop showing a colored \u2191/\u2193/\u2212 arrow + percent change, computed by `computeTrend()` comparing the first half vs second half of the selected date range (flat below a 3% threshold to avoid noisy churn).
- [ ] **T11** — Reuse `DashboardHeroView`'s gradient/depth treatment on Sections/Units/Profile pages so the product feels unified.

## Showcase & gamification visual unification

- [x] ~~T12~~ — `SectionXPGauge.tsx` already used `SEMANTIC_THEME.radius.chip`; `ProgressRings.tsx`/`SquadCrest.tsx` had no hardcoded radius/hex to fix (SquadCrest is Medallion/heraldry-driven, already theme-aware). Fixed the 2 real gaps: `BadgeShelf.tsx`'s detail popover (`borderRadius: 2` \u2192 `SEMANTIC_THEME.radius.modal`) and `BossBattleProgress.tsx`'s progress bar (`borderRadius: 1` \u2192 `SEMANTIC_THEME.radius.progress`, which also now matches the global `MuiLinearProgress` theme default instead of silently overriding it).
- [ ] **T13** — Unify gamification card rounding/elevation/chip styling with the dashboard assignment-card language (single accent token, no bespoke capsules).
- [ ] **T14** — Collapse `ProfileCardView.tsx` (and sibling `AccountPreferencesView`/`ProfileInfoView`/`LanguagePreferenceView`/`AdvancedSettingsView`) from stacked full-width Cards into a compact toggle/row/accordion layout — no feature loss, reorganize only.
- [x] ~~T15~~ — `LevelBadge.tsx` already fully theme-driven (`getLevelColors(theme)`, `readableInk`); no hardcoded hex/fontFamily remains. (The hardcoded `Georgia` serif font is in `SquadCrest.tsx`, a different component — out of T15's scope.)
- [x] ~~T16~~ — `SquadJoinPanel.tsx`/`NailedItWall.tsx` already used `EmptyState`. Added it to the two remaining gaps: Leaderboard Fastest tab (see T7) and `DashboardClient.jsx`'s boss-battle section (shows "No active boss battles" when a campaign exists but `activeChallenges.length === 0`, instead of rendering nothing).
- [ ] **T17** — Reconcile `MainToolbar.jsx` with the `ToolbarSpecimens` showcase so real chrome and the design-system reference actually match (not just visually similar).
- [x] ~~T18~~ — Lexical code-highlight colors already route through `--mui-palette-custom-tokenXxx` CSS vars backed by `editorThemes.ts`'s `palette.custom.tokenComment` etc.; hex values in `LanguageEditorTheme.css` are inline fallbacks only, not the source of truth.
- [ ] **T19** — After T12/T13/T16/T17, re-render and diff the four regression stories (Editor Blocks Live, Gamification Components, Real Components, Recurring Patterns) to confirm no feature loss.

## Already DONE (no action needed)

`profile.name` i18n key, Cancel button neutral color, Offline MUI Button, Semantic Theme contract, button/card/chip theme overrides, type scale, Card max-width rule, `EmptyState`/`ErrorState` components, safe-area FAB offset, dashboard action-row basics, **T1** (assignment `workbookChatEnabled`/`aiChatEnabled` fields + `AssignmentConfiguration.jsx` UI), **T2**, **T3** (timed workbook gate), **T8** (scroll lock), **T15**, **T18**.

---

Note: T6/T14 are each multi-file feature/restyle efforts (not quick fixes) — scope these as separate follow-ups rather than one pass. Production-code edits under `src/`/`app/` need explicit confirmation before starting, per repo policy.
