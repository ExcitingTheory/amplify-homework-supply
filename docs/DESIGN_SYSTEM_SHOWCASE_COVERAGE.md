# Design System Showcase — Component Coverage

Tracking record for the reusable components represented in the Design System
Showcase (`🧩 UI Components/Design System Showcase` in Storybook,
[src/stories/DesignSystemShowcase.stories.tsx](../src/stories/DesignSystemShowcase.stories.tsx)).

Use this to compare what we reuse against what the showcase captures, and to know
when coverage is "finished."

## Legend

- ✅ **Captured** — the real reusable component is rendered in the showcase.
- 🟡 **Mock/specimen** — represented by a dependency-free visual stand-in
  (context-bound components mocked to visual). Swap to the real component when it
  can render without app contexts.
- ⬜ **Pending** — reused in the app but not yet in the showcase.

---

## Foundations

| Item | Status | Showcase story |
| --- | --- | --- |
| Color palettes — 5 themes × light/dark (default, midnight, forest, sunset, aurora) | ✅ | All Themes & Colors |
| Custom palette tokens (chat bubbles, code block, search highlight, hero gradient, subtle border, glass navbar) | ✅ | All Themes & Colors |
| Typography scale (h1–h6, body1/2, caption, button) + font rhythm | ✅ | Typography & Font Rhythm |
| Semantic tokens — radius (rounding) | ✅ | Semantic Tokens |
| Semantic tokens — elevation (depth) | ✅ | Semantic Tokens |
| Semantic tokens — spacing / padding (density) | ✅ | Semantic Tokens |
| Semantic tokens — surface / glass (app bar, drawer, modal blur) | ✅ | Semantic Tokens |

## Core MUI components (with app overrides)

Rendered per-theme in **Components Across Themes** and **All Themes & Colors**.

| Component | Status |
| --- | --- |
| Button (contained / outlined / text / secondary / disabled) | ✅ |
| Chip (filled / outlined / deletable) | ✅ |
| Card | ✅ |
| LinearProgress (primary / secondary) | ✅ |
| ToggleButton / ToggleButtonGroup | ✅ |
| TextField | ✅ |
| Switch | ✅ |
| Slider | ✅ |
| Alert | ✅ |
| Avatar | ✅ |
| Badge | ✅ |
| Tooltip / IconButton | ✅ |

## Recurring app patterns

In **Recurring Patterns** — being migrated from mocks to real view sub-components.

| Pattern | Status | Real component to swap in |
| --- | --- | --- |
| Dashboard card | ✅ | `Dashboard/AssignmentCardView` (real, context-free) |
| Workbook gate (timed) | 🟡 | `Workbook/*` gate |
| Instructor review chips | 🟡 | `InlineGradeCell` / grade chips |
| App bar (two-row) | 🟡 | `MainToolbar` |
| Drawer | 🟡 | `GlobalChatDrawer` / app drawer |
| Completion modal | 🟡 | workbook completion card |
| Empty state | 🟡 | shared `EmptyState` (not yet built) |

### View sub-component pattern (established)

`AssignmentCard` is now split into:
- `AssignmentCardView` — pure presentational, takes plain props + slots
  (`thumbnail`, `prefetchBadge`, `peerReviewButton`, `startButton`) and resolved
  context values (`t`, `reducedMotion`, `reviewInvitation`, `onJoinReview`,
  `onDiscuss`). Renders with no app context → reusable in the showcase.
- `AssignmentCard` — thin wrapper that resolves router/translations/notifications
  and passes the real context-bound children as slots.

Apply this same split to the remaining 🟡 components below.


## Toolbars

In **Toolbars (all variants, in proportion)** via
[ToolbarSpecimens](../src/components/DesignSystem/ToolbarSpecimens.tsx).

| Surface | Status |
| --- | --- |
| Main toolbar / app bar | 🟡 specimen |
| Editor toolbar(s) | 🟡 specimen |
| Contextual / page toolbars | 🟡 specimen |

## Gamification (badges, XP, streaks, squads, indicators)

In **Gamification Components** — real components.

| Component | Status |
| --- | --- |
| BadgeIcon (earned / locked) | ✅ |
| BadgeShelf | ✅ |
| LevelBadge | ✅ |
| AnimatedXPCounter | ✅ |
| ProgressRings | ✅ |
| StreakIndicator | ✅ |
| StreakCalendar | ✅ |
| StreakShield | ✅ |
| SquadCrest | ✅ |
| SquadMentionPill | ✅ |
| AvatarDisplay (all border effects) | ✅ |
| AvatarGlowRing | ✅ |
| SectionXPGauge | ✅ |
| BossBattleProgress | ✅ |

---

## Pending — reused components not yet in the showcase

Add these to reach full coverage. Grouped by domain.

### Avatars & identity
- ⬜ `UserAvatar`
- ⬜ `BotAvatar` / `BotCustomizer`
- ⬜ `DiceBearAvatar` (standalone, outside glow ring)
### Notifications
- ✅ `NotificationBadge` (real, Real Components gallery)
- ✅ `NotificationCard` (real, Recurring Patterns + Real Components)
- ⬜ `NotificationList` (context-bound — needs view/wrapper split)

### Offline & sync
- ⬜ `OfflineBanner` (renders null when online — needs forced state)
- ⬜ `SyncStatusIndicator` (renders null when synced — needs mock queue)
- ✅ `PrefetchBadge` (real, Real Components gallery)
- ⬜ `PrefetchButton`

### Cards & content
- ✅ `Dashboard/AssignmentCardView` (real, Recurring Patterns)
- ✅ `Dashboard/DashboardHeroView` (real, Real Components gallery)
- ✅ `SharedUnitCard` (real, Real Components gallery)
- ✅ `CommunityUnitCard` (real, Real Components gallery)
- ⬜ `PdfThumbnail` (pdf.worker fails to resolve in iframe context)
- ⬜ `InlineGradeCell` (Lexical-based; extract view or specimen)

### Main menu / sidebar & app chrome
- ⬜ Main menu sidebar / app drawer nav (context-bound — view/wrapper split)
- 🟡 `MainToolbar` (specimen in Toolbars; real view not yet extracted)
- ⬜ `GlobalChatButton` / `GlobalChatDrawer`

### Settings
- ⬜ Settings page panels (cosmetic selector, XP tuner, theme mixer, profile)

### Peer review
- ⬜ `PeerReview` room view
- ⬜ `OpenCollaborationRooms`
- ⬜ `PeerReviewAssignmentDialog`

### Dialogs & overlays
- ⬜ `ConfirmDialog`
- ⬜ `ConflictResolutionDialog`
- ⬜ `PersonalBestBanner`
- ⬜ `PermissionErrorOverlay`

### Moderation & admin
- ✅ `ModerationBadge` (real, Real Components gallery)
- ⬜ `ModerationPanel`

### Search & navigation
- 🟡 Search bar (specimen in Recurring Patterns; real `GlobalSearchBar` not used)

### Skeletons / loading
- ✅ `AuthFormSkeleton` (real, Real Components gallery)
- ⬜ `AppSkeleton` (full app-shell skeleton — too large for a gallery cell)

### Storage & jobs
- ⬜ `StorageManagement`
- ⬜ `JobsDashboard`

### Armor
- ✅ `ArmoriaShield` (real, Gamification Components — Armor Editor coat of arms)

### Editor blocks — live renders (Editor Blocks (Live) story)
- ✅ Editable inline editor (`MiniEditor` mode="editable", full `EditorNodes` set +
  Notion-style "+" block inserter — the edit side, all nodes registered)
- ✅ Quiz block (`QuizView`, real exported view shared with the editor)
- ✅ Answer block (`AnswerView`, real exported view shared with the editor)
- ✅ Custom Answer block (`CustomAnswerView`, real exported view shared with the editor)
- ✅ Meaning Association block (real, via NarrativeReader)
- ✅ Word Block (real, via NarrativeReader)
- ✅ Image (real, via NarrativeReader — data-URI src)
- ✅ YouTube media (real embed)
- ✅ Audio Playlist (real `MediaPlayerComponent`, mock `UnitContext` files w/ story-mock URLs)
- ✅ Conversation Playlist (real, dialogue + audio scrubber, mock file URLs)
- ✅ AI Block (`custom-ai`, real, mock questionBank question)
- ✅ All rich-text styles (h1–h6, bold/italic/underline/strikethrough/code/
  highlight/sub/superscript/link, bullet/numbered/check lists, quote, code, divider)
- ⬜ PDF viewer (real node renders but react-pdf `pdf.worker.mjs` fails to resolve
  in the iframe context — catalog specimen only)
- ⬜ Drawing (Excalidraw — node not registered in NarrativeReader; catalog specimen)

### Editor block catalog
- ✅ All 24 insertable block types have rendered style specimens (Recurring
  Patterns → "All insertable block types (catalog)")

> Note: Editor block nodes render inside a live `LexicalComposer`. Prefer a
> presentational "view" of each block's decorator component (the part that draws
> the UI) so it can render standalone, or a 🟡 specimen where the Lexical
> coupling is too deep.


