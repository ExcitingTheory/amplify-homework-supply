# Storybook Interaction Audit

> Generated: 2026-08-06  
> Goal: Every meaningful user interaction covered exactly once across `play:` functions.  
> Status: **~400 stories across ~118 files. Only ~60 files have any `play:` function. Almost none of the editor, gamification, chat, dashboard, peer-review, practice-drill, recording, or workbook stories have interaction tests.**

---

## Legend

| Symbol | Meaning |
|---|---|
| ✅ | Has `play:` function(s) |
| ⚠️ | Has `play:` but incomplete — specific gaps noted |
| ❌ | No `play:` function — needs interactions |
| 🔴 | **Top priority** — high interaction density, blocking coverage |

---

## Table of Contents

1. [Editor (Editor3)](#1-editor-editor3)
2. [Gamification](#2-gamification)
3. [Chat](#3-chat)
4. [Dashboard](#4-dashboard)
5. [Peer Review](#5-peer-review)
6. [Practice Drill](#6-practice-drill)
7. [Recording Studio](#7-recording-studio)
8. [Workbook](#8-workbook)
9. [Debug Panel](#9-debug-panel)
10. [Utility / Other](#10-utility--other)
11. [stories/ Directory](#11-stories-directory)
12. [Summary Statistics](#summary-statistics)
13. [Top Priority Files](#top-priority-files)
14. [Mock Data Gaps](#mock-data-gaps)

---

## 1. Editor (Editor3)

### `src/components/Editor3/NarrativeReader.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` | ❌ | Render rich Lexical content, scroll to verify it displays correctly |
| `WithMaxHeight` | ❌ | Verify overflow/scroll is clamped at maxHeight |
| `CustomLabel` | ❌ | Verify custom label text renders |

> **Mock gap:** Missing an error state if content JSON is malformed.

---

### `src/components/Editor3/components/AIContentSuggestion.stories.jsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `WithSuggestion` | ❌ | Click "Insert" → verify `onInsert` called; click "Dismiss" → verify `onDismiss` called |
| `Loading` | ❌ | Verify spinner visible, buttons disabled |
| `ShortSuggestion` | ❌ | Verify compact layout renders |

> **Mock gap:** Missing an error state (failed AI suggestion).

---

### `src/components/Editor3/components/AssignmentConfiguration.stories.jsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `WithExistingAssignment` | ❌ | Change section Select → verify assignment list refreshes; select assignment → verify `onSelect` called |
| `NoAssignments` | ❌ | Verify empty state message |
| `NoSections` | ❌ | Verify disabled/empty state |

---

### `src/components/Editor3/components/ConfigurationManager.stories.jsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` | ❌ | Fill title field → change settings → click Save → verify `onSave` called with correct values |
| `WithFeaturedImage` | ❌ | Click "Remove image" or upload zone click → verify handler fires |

> **Mock gap:** Missing a "saving" loading state variant.

---

### `src/components/Editor3/components/EnhancedGeneration.stories.jsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `UnifiedImageGeneration` | ❌ | Type prompt → click Generate → verify loading state; verify result renders |
| `UnifiedAudioGeneration` | ❌ | Click record/generate → verify audio player appears |
| `ImageMaskEditorDemo` | ❌ | Draw mask on canvas → click Apply → verify mask data callback |
| `CompleteWorkflow` | ❌ | Step through full generation pipeline, verify each step transitions |
| `FeatureDocumentation` | ❌ | Display only — verify all feature sections render |

> **Mock gap:** Need `fn()` spies on `onGenerate`/`onSave` callbacks.

---

### `src/components/Editor3/components/ImageComponent.stories.jsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `WithFileId` | ❌ | Click image → verify selection handles appear |
| `WithSrcOnly` | ❌ | Verify image renders from src |
| `PublishedPath` | ❌ | Verify published path resolves correctly |

> **Mock gap:** Missing a broken/error image state.

---

### `src/components/Editor3/nodes/FileMetadataNode/FileMetadataComponent.stories.jsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `PdfWithParsedContent` | ❌ | Click "Expand" → verify full parsed content shown |
| `ImageFile` | ❌ | Verify thumbnail renders |
| `WithSearch` | ❌ | Type in search input → verify highlighted matches |
| `NoParsedContent` | ❌ | Verify fallback message shown |

---

### `src/components/Editor3/plugins/AIContentCompletionPlugin.stories.jsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `EmptyEditor` | ❌ | Type text → press Tab → verify suggestion ghost text appears |
| `PartialExplanation` | ❌ | Accept suggestion via Tab → verify text inserted into editor |
| `MidLesson` | ❌ | Reject suggestion via Escape → verify suggestion dismissed |
| `StreamingDemo` | ❌ | Verify tokens stream in progressively |

> **Mock gap:** Missing: error state (AI unavailable), debounce behavior.

---

### `src/components/Editor3/plugins/AnswerPlugin.audio-drawing.stories.jsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `AudioPronunciation` | ❌ | Click record button → verify recording UI activates |
| `DrawingVocabulary` | ❌ | Draw on canvas → click Submit → verify answer saved |
| `MultiModalVocabulary` | ❌ | Toggle between audio and drawing modes |
| `ListeningComprehension` | ❌ | Click play on audio → verify playback state |
| `DefinitionToDrawing` | ❌ | Submit drawing → verify `onAnswerChange` called |

> **Mock gap:** Missing a "graded/revealed correct answer" state.

---

### `src/components/Editor3/plugins/AutoEmbedPlugin.stories.jsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `EditableEmpty` | ❌ | Paste a YouTube URL → verify embed dialog/popup appears |
| `EditableWithInstructions` | ❌ | Accept embed suggestion → verify embed node inserted |

---

### `src/components/Editor3/plugins/BlockSuggestionPlugin.stories.jsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `EmptyEditor` | ❌ | Press `/` → verify block suggestion menu appears |
| `AfterHeading` | ❌ | Select a suggestion → verify block inserted |
| `AfterExplanation` | ❌ | Dismiss suggestion popup via Escape |
| `AfterQuiz` | ❌ | Verify quiz-context-aware suggestions differ from heading-context |

---

### `src/components/Editor3/plugins/CustomAIPlugin.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `EmptyEditable` | ❌ | Click AI toolbar button → verify AI panel opens |
| `WithQuestions` | ❌ | Select a question block → trigger AI assist → verify response panel |
| `StudentTextInput` | ❌ | Type in student answer field → verify word count/validation |
| `StudentMultiInput` | ❌ | Fill multiple inputs → verify all captured |
| `EmptyBlock` | ❌ | Trigger AI generation → verify loading indicator |

---

### `src/components/Editor3/plugins/CustomAnswerPlugin.stories.jsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `EditableEmpty` | ❌ | Click answer block → type answer → verify `onAnswerChange` fires |
| `EditableWithCustomAnswer` | ❌ | Edit existing answer → verify update |
| `ReadOnlyWithCustomAnswer` | ❌ | Click answer → verify no edit mode opens (read-only guard) |

---

### `src/components/Editor3/plugins/DragDropPastePlugin.stories.jsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `EditableEmpty` | ❌ | Simulate `dragover` + `drop` with an image file → verify image inserted |
| `EditableWithInstructions` | ❌ | Paste image from clipboard → verify image inserted |

> **Note:** Use `fireEvent.drop` with a `DataTransfer` mock — real drag/drop not needed.

---

### `src/components/Editor3/plugins/FloatingLinkEditorPlugin.stories.jsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `EditableEmpty` | ❌ | Select text → click link button → type URL in floating editor → Enter → verify link node created |
| `EditableWithLinks` | ❌ | Click existing link → verify floating editor opens with pre-filled URL; click "Edit" → change URL → save |

---

### `src/components/Editor3/plugins/ImagesPlugin.stories.jsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `EditableEmpty` | ❌ | Click insert image button → fill URL → confirm → verify image node inserted |
| `EditableWithImage` | ❌ | Click image → drag resize handle → verify `width`/`height` updated |
| `ReadOnlyWithImage` | ❌ | Verify resize handles absent in read-only |

---

### `src/components/Editor3/plugins/LinkPlugin.stories.jsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `EditableEmpty` | ❌ | Select text → Ctrl+K → type URL → Enter → verify link created |
| `EditableWithLinks` | ❌ | Click link → verify tooltip/popup; hover → verify href shown |
| `ReadOnlyWithLinks` | ❌ | Verify links are `<a>` tags (not editable) |

---

### `src/components/Editor3/plugins/PlaylistPlugin.stories.jsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `EditableEmpty` | ❌ | Insert playlist block → verify empty placeholder |
| `EditableWithPlaylist` | ❌ | Click track → verify playback state; drag to reorder |
| `ReadOnlyWithPlaylist` | ❌ | Verify no edit controls in read-only |

---

### `src/components/Editor3/plugins/TablePlugin.stories.jsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `EditableEmpty` | ❌ | Insert table → verify 3×3 grid renders; Tab through cells |
| `EditableWithTable` | ❌ | Click cell → type → Tab to next cell → verify value stored |
| `ReadOnlyWithTable` | ❌ | Click cell → verify no edit mode |

---

### `src/components/Editor3/plugins/YouTubePlugin.stories.jsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `EditableEmpty` | ❌ | Paste YouTube URL → verify embed node inserted with iframe |
| `EditableWithVideo` | ❌ | Click embed → verify selection; verify remove button |
| `ReadOnlyWithVideo` | ❌ | Verify iframe renders, no edit controls |

---

## 2. Gamification

### `src/components/Gamification/AnimatedXPCounter.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` | ❌ | Wait for animation to complete → verify final number matches `xp` prop |
| `SlowAnimation` | ❌ | Verify counter increments slowly |
| `Interactive` | ❌ | Click "Add XP" button → verify counter increments |

---

### `src/components/Gamification/ArmorEditor.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` | ❌ | Click shape selector → pick "round" → verify shield updates; change field color → verify applies |
| `WithInitialConfig` | ❌ | Verify initial config pre-filled; change division style → verify preview updates |
| Various preset stories | ❌ | Verify preview renders correctly for each preset |

> **Mock gap:** `onChange` spy should be `fn()`.

---

### `src/components/Gamification/ArmoriaShield.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `FallbackInitials` | ❌ | Verify initials text rendered when no crest config |
| `UnlockedNoDesign` | ❌ | Verify default unlocked placeholder |
| `CustomCrest` | ❌ | Verify crest SVG renders without error |
| `LargeSize` | ❌ | Verify size prop scales the shield |

---

### `src/components/Gamification/AvatarCustomizer.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Level2Colors` | ❌ | Open dialog → click a color swatch → verify avatar preview updates → click Save → verify `onSave` called |
| `Level4Accessories` | ❌ | Navigate to Accessories section → select accessory → verify preview |
| `Level5Full` | ❌ | Switch between all customizer tabs; verify locked sections not interactive at lower levels |
| `Level1AllLocked` | ❌ | Verify all options disabled/locked |
| `WithExistingOverrides` | ❌ | Open dialog → verify pre-populated; close without saving → verify no change |

---

### `src/components/Gamification/AvatarUnlockEditor.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` | ❌ | Toggle a style availability switch → verify state updates |
| `WithCustomConfig` | ❌ | Edit XP threshold → verify validation; save → verify `onSave` called |
| `AllStylesUsed` | ❌ | Verify all styles shown as enabled |
| `GlowDisabled` | ❌ | Verify glow toggle is off |

---

### `src/components/Gamification/BadgeCoinFlip.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Sharpshooter` | ❌ | Wait for flip animation → verify final face shows badge; verify `onAnimationComplete` fires |
| `FirstSteps` | ❌ | Same with different badge |

---

### `src/components/Gamification/BadgeShelf.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `AllEarned` | ❌ | Click a badge → verify tooltip/detail popup opens |
| `PartiallyEarned` | ❌ | Hover locked badge → verify locked state tooltip |
| `Empty` | ❌ | Verify empty state message |
| `TwoColumns` | ❌ | Verify 2-column grid layout |
| `EarnedOnly` | ❌ | Verify only earned badges shown |
| `WithMultipliers` | ❌ | Verify XP multiplier badges display correctly |
| `EarnedOnlyEmpty` | ❌ | Verify empty state when no badges earned |
| `AvatarProgression` | ❌ | Verify avatar unlock progression order |

---

### `src/components/Gamification/BadgeVisualPicker.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` | ❌ | Click shape selector → pick "shield" → verify `onChange` called; change bgColor → verify preview updates |
| `FireShield` | ❌ | Change animation from "glow" to "spin-in" → verify `onChange` fires |
| `CosmicDiamond` | ❌ | Type "star" in icon search → pick from results → verify icon updates |

---

### `src/components/Gamification/BossBattleCard.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Active` | ❌ | Verify XP progress bar width matches current XP |
| `Defeated` | ❌ | Verify defeated visual state |
| `SinglePhase` | ❌ | Verify single phase shown |
| `ActiveInteraction` | ✅ | Hover interaction — covered |

---

### `src/components/Gamification/CampaignBriefing.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` | ❌ | Verify title, setting, stakes text render |
| `Loading` | ❌ | Verify skeleton/spinner |
| `Compact` | ❌ | Verify compact layout (no expanded narrative) |
| `SettingOnly` | ❌ | Verify stakes section absent |
| `WithEmbeddedContent` | ❌ | Click "Expand" → verify full briefing visible |

---

### `src/components/Gamification/CampaignTimeline.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` | ❌ | Click a chapter → verify expanded detail or navigation |
| `AllComplete` | ❌ | Verify all steps show completed checkmarks |

---

### `src/components/Gamification/ChallengeRecapCard.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `WithRecaps` | ❌ | Scroll through recap entries; verify student names render |
| `NoRecaps` | ❌ | Verify empty state message |
| `Generating` | ❌ | Verify loading/spinner state |
| `LearnerView` | ❌ | Verify instructor-only controls hidden |

---

### `src/components/Gamification/ContentLockCard.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `LockedByXP` | ❌ | Hover locked card → verify tooltip with XP requirement |
| `LockedByBadge` | ❌ | Hover → verify badge requirement shown |
| `LockedByCompletion` | ❌ | Hover → verify completion requirement shown |
| `Unlocked` | ❌ | Click card → verify navigation/`onClick` fires |

---

### `src/components/Gamification/ContentUnlockAnimation.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Playing` | ❌ | Wait for animation cycle → verify `onComplete` fires |
| `Idle` | ❌ | Verify idle state shows static locked content |

---

### `src/components/Gamification/DiceBearAvatar.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` | ❌ | Verify SVG avatar renders without error |
| `AllStyles` | ❌ | Verify each style variant renders |
| `LockedVsUnlocked` | ❌ | Verify locked style has overlay/grayscale |
| `TierProgression` | ❌ | Verify tier 1-5 show progressively unlocked styles |
| `DifferentSeeds` | ❌ | Verify same style + different seeds = different avatars |

---

### `src/components/Gamification/EasterEggLayer.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` | ❌ | Type the trigger keyword → verify "found" animation plays; verify `onFound` callback fires |

---

### `src/components/Gamification/EasterEggToast.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Found` | ❌ | Verify toast renders with egg name/reward; wait for auto-dismiss |
| `HighReward` | ❌ | Verify large XP reward value shown |

---

### `src/components/Gamification/EasterEggTrigger.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` | ❌ | Click the trigger element → verify `onTrigger` called; verify found state transitions |
| `AlreadyFound` | ❌ | Verify already-found trigger is disabled/dimmed |

---

### `src/components/Gamification/Gamification.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` (BadgeMedallion) | ❌ | Hover badge → verify tooltip; click → verify detail modal |
| `CelebrationOpen` | ❌ | Wait for confetti/animation; verify close button dismisses |
| `XPToastOpen` | ❌ | Verify XP amount displayed; wait for auto-dismiss |
| `XPSummaryStory` | ❌ | Verify breakdown items render correctly |
| `WallStory` | ❌ | Scroll wall; click a badge → verify detail |

---

### `src/components/Gamification/GamificationToastLayer.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Idle` | ❌ | Dispatch an XP event → verify toast appears; wait → verify auto-dismiss |

> **Mock gap:** Need a button in the story that dispatches a custom event or calls the context method to trigger a toast.

---

### `src/components/Gamification/GroupChallengeCard.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Active` | ❌ | Verify progress bar reflects current XP/target |
| `Completed` | ❌ | Verify "Completed" badge/state shown |
| `WithDeadline` | ❌ | Verify countdown timer renders |
| `JustStarted` | ❌ | Verify 0% progress state |

---

### `src/components/Gamification/LevelBadge.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Beginner`…`Master` | ❌ | Verify each level label and color; hover → verify tooltip with level name |
| `Small` | ❌ | Verify size prop shrinks badge |
| `NoProgress` | ❌ | Verify 0% progress ring renders correctly |

---

### `src/components/Gamification/LexicalPlainTextField.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` | ❌ | Click field → type text → verify `onChange` called; press Enter → verify no newline (plain-text mode) |
| `Disabled` | ❌ | Click field → verify no focus |
| `Multiline` | ❌ | Press Enter → verify newline allowed in multiline mode |

---

### `src/components/Gamification/PersonalBestBanner.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Improvement` | ❌ | Verify score improvement delta shown (e.g., "+12%") |
| `FirstAttempt` | ❌ | Verify "first attempt" messaging |
| `PerfectScore` | ❌ | Verify 100% celebration state |

---

### `src/components/Gamification/ProgressRings.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `MultipleModules` | ❌ | Hover ring → verify tooltip with module name + % complete |
| `SingleModule` | ❌ | Verify single ring renders |
| `Empty` | ❌ | Verify 0% rings render without errors |

---

### `src/components/Gamification/RankChangeToast.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `RankUp` | ❌ | Verify "+N" rank change displayed; wait → verify auto-dismiss |
| `RankDown` | ❌ | Verify negative rank change shown in red |
| `TopRank` | ❌ | Verify "#1" special state |

---

### 🔴 `src/components/Gamification/RedemptionConditionForm.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Empty` | ❌ | Select condition type from dropdown → verify count field appears; enter count → verify `onChange` called |
| `Prefilled` | ❌ | Change count → verify `onChange` fires; switch type → verify count resets |
| `Disabled` | ❌ | Try clicking dropdown → verify disabled state |

---

### `src/components/Gamification/SecretLinkIcon.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` | ❌ | Click icon → verify `onClick` fires (or clipboard copy triggered) |

---

### `src/components/Gamification/SectionXPGauge.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `FewUnits` | ❌ | Hover a unit bar → verify tooltip with unit name + XP |
| `ModerateUnits` | ❌ | Verify bar widths proportional to XP |
| `ManyUnits` | ❌ | Verify scrollable/overflow handling |
| `WithMultipliers` | ❌ | Verify multiplier badge shown |
| `NoTuner` | ❌ | Verify tuner button absent |

---

### `src/components/Gamification/SquadCrest.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` | ❌ | Verify crest SVG renders |
| `Large` | ❌ | Verify size prop scaling |
| `SmallNoName` | ❌ | Verify squad name absent |

---

### `src/components/Gamification/SquadEditor.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `NewSquad` | ❌ | Type squad name → type description → configure crest → wait for auto-save debounce (1.5s) → verify `onSave` called |
| `ExistingSquad` | ❌ | Edit name → verify auto-save fires; verify crest editor pre-populated |
| `ManualSaveOnly` | ❌ | Type changes → verify no auto-save; click Save → verify `onSave` called |

---

### `src/components/Gamification/SquadJoinPanel.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `BrowseSquads` | ❌ | Click "Join" on a squad → verify `onJoinSquad` called with squad id |
| `InSquad` | ❌ | Click "Leave Squad" (as leader) → verify `onLeaveSquad` called |
| `InSquadAsMember` | ❌ | Verify leader controls absent |
| `EmptyState` | ❌ | Verify "No squads available" empty state |
| `Loading` | ❌ | Verify loading skeleton |

---

### `src/components/Gamification/SquadLeaderboard.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Full` | ❌ | Verify highlighted row (current squad) stands out; hover row → verify tooltip |
| `NoHighlight` | ❌ | Verify no highlight applied |
| `Empty` | ❌ | Verify empty state message |

---

### `src/components/Gamification/SquadMessagePanel.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` | ❌ | Click a squad tab → verify messages update; type message → send → verify `onSend` called |
| `TwoSquads` | ❌ | Switch between two tabs → verify message list changes |
| `Submitting` | ❌ | Verify send button disabled during submission |

---

### `src/components/Gamification/SquadPostEditor.stories.tsx` 🔴

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` | ❌ | Type post title → type body in Lexical editor → click "Publish" → verify `onPublish` called with `{title, data}` |
| `WithInitialContent` | ❌ | Verify pre-filled title/body; edit title → verify `onPublish` sends updated title |
| `Disabled` | ❌ | Click Publish → verify disabled (not fired) |

---

### `src/components/Gamification/SquadPostFeed.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `WithPosts` | ❌ | Click "New Post" button → verify composer opens; scroll feed → verify posts render |
| `EmptyFeed` | ❌ | Verify empty state; click "New Post" → verify composer |
| `NonMemberView` | ❌ | Verify "New Post" button absent for non-member |
| `Publishing` | ❌ | Verify submit disabled/loading during publish |

---

### `src/components/Gamification/StorybookPromoPanel.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` | ❌ | Verify panel renders with badge list |
| `SomeBadgesEarned` | ❌ | Verify earned badges styled differently from unearned |
| `AllBadgesEarned` | ❌ | Verify all badges earned state |

---

### `src/components/Gamification/StreakCalendar.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Empty` | ❌ | Verify all days greyed out |
| `FewActiveDays` | ❌ | Hover active day → verify date tooltip |
| `MostDaysActive` | ❌ | Verify heat-map color intensity gradient |
| `EveryDay` | ❌ | Verify "perfect month" state |
| `SpecificMonth` | ❌ | Verify month header shows correct month/year |

---

### `src/components/Gamification/StreakIndicator.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Active5Day` | ❌ | Verify "5" displayed with flame icon |
| `NoStreak` | ❌ | Verify "0" or empty state |
| `Milestone7Day` | ❌ | Verify milestone badge/decoration appears |
| `LongStreak` | ❌ | Verify large number renders |
| `SmallSize` | ❌ | Verify size prop changes dimensions |

---

### `src/components/Gamification/StreakShield.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `WithFreezes` | ❌ | Hover freeze icon → verify tooltip with count |
| `NoFreezes` | ❌ | Verify empty/no-shields state |
| `SmallSize` | ❌ | Verify size scaling |

---

### `src/components/Gamification/UnitMemoryCard.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` | ❌ | Click card → verify flip animation; verify back face shows definition |

---

### 🔴 `src/components/Gamification/XPTunerDialog.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` | ❌ | Change `HOMEWORK_SUBMITTED` slider → verify value updates; click Save → verify `onSave` called with new multipliers |
| `WithCustomMultipliers` | ❌ | Verify pre-filled multiplier values; reset a multiplier to 1× → verify change |
| `WithCaps` | ❌ | Edit daily cap field → verify `onSave` includes updated cap |
| `XPDisabled` | ❌ | Verify all controls disabled; toggle XP enable → verify controls enable |
| `DoubleXP` | ❌ | Verify all sliders at 2× |
| `CustomLeveling` | ❌ | Edit `xpPerLevel` → verify `onSave` includes leveling config |
| `MaxLevels` | ❌ | Click Close → verify `onClose` fired |

---

## 3. Chat

### `src/components/ChatSidebar/ContentPreview.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `MarkdownFormat` | ❌ | Click "Insert" → verify `onInsert` fires; click "Copy" → verify `onCopy` fires |
| `Compact` | ❌ | Verify compact layout; click Copy → verify `onCopy` |
| `NoActions` | ❌ | Verify Insert/Copy buttons absent |
| `HTMLFormat` | ❌ | Verify HTML rendered safely (no raw tags visible) |
| `LongContent` | ❌ | Verify scroll inside preview; click "Regenerate" → `onRegenerate` fires |

---

### `src/components/ChatSidebar/SearchResults.stories.jsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `AllResultTypes` | ❌ | Click a file result → verify `onResultClick` fires with correct result; click vocabulary result |
| `FilesOnly` | ❌ | Verify only file result type rendered |
| `LoadingState` | ❌ | Verify loading skeleton |
| `EmptyState` | ❌ | Verify "No results" message |
| `HighRelevanceScores` | ❌ | Verify high-relevance items sorted first |
| `LargeResultSet` | ❌ | Scroll to verify virtual scroll/pagination |
| `MinimalCallbacks` | ❌ | Verify renders without all optional callbacks |

---

### `src/components/ChatSidebar/VirtualizedMessageList.stories.jsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Empty` | ❌ | Verify empty state message |
| `FewMessages` | ❌ | Verify all messages render without scroll |
| `ManyMessages` | ❌ | Scroll to bottom → verify scroll-to-bottom button hides; scroll up → verify button reappears |
| `WithToolCalls` | ❌ | Verify tool call blocks render; click expand → verify tool output shown |
| `StreamingMessage` | ❌ | Verify streaming cursor/typing indicator |
| `LargeConversation` | ❌ | Scroll to top → verify load-more trigger |

---

### 🔴 `src/components/CollaborativeChat/MessageInput.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` | ❌ | Click input → type message → press Enter → verify `onSend` called; type `@k` → verify @mention popup appears; select mention → verify chip inserted |
| `WithReply` | ❌ | Verify reply preview shown; click X on reply → verify `onCancelReply` fires |
| `Disabled` | ❌ | Click input → verify no focus |
| `NoMembers` | ❌ | Type `@` → verify no mention suggestions |

> **Key missing:** Shift+Enter newline, keyboard navigation in mention popup (↑/↓/Enter).

---

### `src/components/CollaborativeChat/ThreadView.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `WithMessages` | ❌ | Scroll through messages; click reply on a message → verify reply input focused |
| `WithTypingIndicator` | ❌ | Verify typing dots animation |
| `EmptyThread` | ❌ | Verify empty state |
| `BotConversation` | ❌ | Verify bot message avatar shown differently |

---

### 🔴 `src/components/CollaborativeChat/TopicList.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `SectionScope` | ❌ | Click topic → verify `onSelectTopic` called and item highlighted; click "+" → verify create dialog opens → type topic name → click Create → verify `onCreateTopic` called |
| `UnitScope` | ❌ | Verify unit-scoped topics listed |
| `EmptyTopics` | ❌ | Verify empty state; click "+" → create first topic |
| `NoSelection` | ❌ | Verify no topic highlighted |

---

### `src/components/GlobalChatButton.stories.jsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` | ❌ | Click button → verify opens chat drawer (`onClick` fires) |
| `WithUnreadBadge` | ❌ | Verify badge count shown; click → verify badge clears |
| `ManyUnread` | ❌ | Verify "99+" overflow badge |
| `Hidden` | ❌ | Verify button not visible |

---

### `src/components/GlobalChatDrawer.stories.jsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Closed` | ❌ | Verify drawer not visible |
| `Open` | ❌ | Verify drawer visible; click close/X → verify `onClose` fires |
| `NarrowWidth` | ❌ | Verify layout adapts to narrow container |

---

### `src/stories/chat-components.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `MentionChipUser` | ❌ | Click chip → verify `onClick` fires |
| `MentionChipBot` | ❌ | Click bot chip → verify bot-specific action |
| `MessageComposerDefault` | ❌ | Type message → press Enter → verify send; Shift+Enter → verify newline |
| `MessageComposerWithReply` | ❌ | Verify reply context shown; dismiss reply |
| `LexicalMessageRendererMarkdown` | ❌ | Verify markdown bold/italic/code renders |
| `LexicalMessageRendererPlainText` | ❌ | Verify plain text renders without markdown artifacts |
| `NavigationPromptEditor` | ❌ | Type prompt → verify character count; submit → verify `onSubmit` |
| `NavigationPromptSections` | ❌ | Click a section chip → verify inserted into prompt |
| `RecordingScriptPreviewWord` | ❌ | Click play → verify audio playback starts |
| `RecordingScriptPreviewConversation` | ❌ | Play first utterance → stop → play second |

---

## 4. Dashboard

### `src/components/Dashboard/AssignmentCard.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Pending` | ❌ | Click card → verify navigation `onClick` fires |
| `Overdue` | ❌ | Verify overdue styling (red); click card |
| `Completed` | ❌ | Verify completed checkmark; verify grade displayed |
| `CompletedLowScore` | ❌ | Verify low-score color indicator |
| `Locked` | ❌ | Click card → verify no navigation (locked guard) |
| `LockedWithDate` | ❌ | Verify unlock date shown |
| `UpNext` | ❌ | Verify "Up Next" badge; click |
| `EasyDifficulty` | ❌ | Verify difficulty badge color |
| `HardDifficulty` | ❌ | Verify hard difficulty visual |

---

### 🔴 `src/components/Dashboard/SectionPanel.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `MixedProgress` | ❌ | Click accordion header → verify collapse/expand; click "Start Practice Drill" → verify `onOpenDrill` called; click "Request Guidance" → verify `onRequestGuidance` called |
| `AllCompleted` | ❌ | Click "Show Completed" toggle → verify completed assignments appear |
| `AllPending` | ❌ | Verify no completed assignments shown |
| `WithLockedAssignments` | ❌ | Verify locked assignments not clickable |
| `WithCampaignContext` | ❌ | Verify campaign briefing teaser shown |
| `Collapsed` | ❌ | Verify starts collapsed; click to expand |
| `SingleAssignment` | ❌ | Verify single item layout |

---

### `src/components/Dashboard/UpNextCard.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` | ❌ | Click card → verify navigation fires |
| `WithChapterContext` | ❌ | Verify chapter context shown |
| `WithNailedIt` | ❌ | Verify "Nailed It" badge displayed |
| `NoDueDate` | ❌ | Verify no due date shown |

---

### `src/components/InstructorDashboard.stories.jsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `WithSections` | ❌ | Click a section row → verify expansion; click student name → verify drill-down; click "View Flagged" → verify moderation filter |
| `SingleSection` | ❌ | Verify single section layout |
| `NoSections` | ❌ | Verify "No sections" empty state |
| `Loading` | ❌ | Verify skeleton loading state |

---

### `src/components/JobsDashboard.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` | ❌ | Verify job list renders; click job row → verify detail opens |
| `Compact` | ❌ | Verify compact layout |

> **Mock gap:** Missing error state (failed jobs) and loading state.

---

### `src/components/Leaderboard/Leaderboard.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` | ❌ | Verify rankings list; hover a row → verify user detail tooltip |
| `Empty` | ❌ | Verify empty state |
| `GridStory` (CompletionGrid) | ❌ | Click a cell → verify highlight; hover → verify student + assignment tooltip |

---

## 5. Peer Review

### `src/components/PeerReview/OpenCollaborationRooms.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `InstructorView` | ❌ | Click "Assign Peer Review" → verify dialog opens; select grade + reviewer → click "Assign Review" → verify `onAssignReview` called |
| `StudentView` | ❌ | Verify no "Assign" button; click "Join Room" → verify `onJoinRoom` fires |
| `OnlyTutoringRooms` | ❌ | Verify all rooms labeled "Tutoring" |
| `EmptyRooms` | ❌ | Verify empty state message |

---

### `src/components/PeerReview/PeerReview.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` (JoinPeerReviewDialog) | ❌ | Click "Join Room" → verify `onJoin` fires |
| `WithError` | ❌ | Verify error message shown |
| `RoomInviteStandalone` | ❌ | Click "Accept" → verify `onAccept`; click "Decline" → verify `onDecline` |
| `InvitationsStory` | ❌ | Accept first invitation → verify it disappears from list |
| `NoInvitations` | ❌ | Verify empty state |
| `ChatStory` | ❌ | Type message → send → verify message appears in thread |
| `OpenButtonDefault` | ❌ | Click button → verify peer review room opens |
| `OpenButtonDisabled` | ❌ | Click → verify no action |
| `OpenButtonCreateError` | ❌ | Click → verify error toast/message |
| `JoinDialogOpen` | ❌ | Enter room code → click Join → verify `onJoin` fires |
| `FeedbackPromptOpen` | ❌ | Select rating → type feedback → submit → verify `onSubmit` called |

---

### `src/components/PeerReview/PeerReviewAssignmentDialog.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` | ❌ | Select grade from dropdown → select reviewer checkboxes → click "Assign Review" → verify `onAssign` called |
| `SingleGrade` | ❌ | Verify single grade pre-selected |
| `ManyStudents` | ❌ | Search/filter students → verify filtered results |
| `Closed` | ❌ | Verify dialog not visible |

---

## 6. Practice Drill

### `src/components/PracticeDrill/CollaborativePresenceBar.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Connected` | ❌ | Hover an avatar → verify participant name tooltip |
| `Disconnected` | ❌ | Verify disconnected indicator |
| `TwoParticipants` | ❌ | Verify both avatars shown |
| `ManyParticipants` | ❌ | Verify overflow (+N) badge |
| `AllComplete` | ❌ | Verify completed checkmark per participant |

---

### `src/components/PracticeDrill/JoinPracticeDialog.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Open` | ❌ | Click "Join Practice" → verify dialog opens; click confirm → verify `onJoin` fires |
| `Closed` | ❌ | Verify dialog not visible |

---

### 🔴 `src/components/PracticeDrill/PracticeDrillConfigPopup.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` | ❌ | Change "Number of Questions" Select → change "Drill Type" → click "Start Drill" → verify `onStart` called with correct config |
| `WithCoverage` | ❌ | Verify coverage percentages shown per content type |
| `VocabularyOnly` | ❌ | Verify only vocabulary drill type available |
| `NoContent` | ❌ | Verify "No content" state with disabled start |
| `Loading` | ❌ | Verify loading spinner |
| `PreConfiguredFromChat` | ❌ | Verify pre-populated values from chat context |

---

### `src/components/PracticeDrill/PracticeDrillDialog.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` | ❌ | Answer all questions → verify completion state; verify "Submit" button → click → verify `onComplete` fires |
| `VocabularyOnly` | ❌ | Verify only vocab questions shown |
| `DiminishedXP` | ❌ | Verify reduced XP preview shown |
| `ReviewDrill` | ❌ | Verify review mode (answers pre-shown) |
| `Closed` | ❌ | Verify dialog not visible |

---

### `src/components/PracticeDrill/PracticeDrillProgress.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` | ❌ | Verify progress bar at 0% |
| `HalfComplete` | ❌ | Verify 50% progress bar width |
| `AllComplete` | ❌ | Verify 100% completion state |
| `DiminishedXP` | ❌ | Verify dimmed XP indicator |
| `WithStreak` | ❌ | Verify streak bonus badge shown |

---

### `src/components/PracticeDrill/PracticeDrillWorkbook.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` | ❌ | Answer a drill question → verify answer recorded; navigate next question |
| `Empty` | ❌ | Verify empty drill state |
| `WithDocumentRefs` | ❌ | Click document reference → verify preview opens |

---

## 7. Recording Studio

### `src/components/RecordingStudio2.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` | ❌ | Click record button → verify recording indicator; click stop → verify `onRecordingComplete` fires |
| `Embedded` | ❌ | Verify embedded layout (no outer chrome) |
| `WithFeedback` | ❌ | Verify feedback text shown; click "Request Definition" → verify `requestDefinition` called |

---

### `src/components/RecordingStudio3/AudioFilterPanel.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `AllOff` | ❌ | Toggle "Noise Reduction" switch → verify `onChange` called with updated filter config |
| `SomeActive` | ❌ | Verify active filters highlighted; turn off active filter → verify update |
| `AllActive` | ❌ | Turn off all filters → verify all toggles off |

---

### `src/components/RecordingStudio3/RecordingSettings.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` | ❌ | Change quality Select → verify `onChange` fires |
| `Off` | ❌ | Verify all settings disabled |
| `Light` / `Aggressive` | ❌ | Verify respective processing settings shown |

---

### `src/components/RecordingStudio3/TakeVersionHistory.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` | ❌ | Click a take version → verify `onSelect` called; verify selected row highlighted |
| `SingleVersion` | ❌ | Verify single version UI (no comparison) |
| `Disabled` | ❌ | Click version → verify no selection change |
| `NoSlotId` | ❌ | Verify empty/loading state without slotId |

---

### `src/components/RecordingStudio3/TimelineCard.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` | ❌ | Click card → verify `onClick` fires |
| `Selected` | ❌ | Verify selected border/highlight |
| `LongText` | ❌ | Verify text truncation with ellipsis |
| `NarrowCard` | ❌ | Verify narrow layout |

---

### `src/components/RecordingStudioEnhanced.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` | ❌ | Click record → verify recording state; click stop → verify take appears in history |
| `WithMetadata` | ❌ | Verify metadata fields shown |
| `MinimalProps` | ❌ | Verify minimal config renders without error |

---

## 8. Workbook

### `src/components/Workbook/AIFeedbackSnackbar.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` | ❌ | Verify snackbar visible with AI feedback message |
| `WithProvider` | ❌ | Trigger feedback from context → verify snackbar appears; wait → verify auto-dismiss |

---

### `src/components/Workbook/ConnectionStatus.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Connected` | ❌ | Verify green/connected indicator |
| `ConnectedMedium` | ❌ | Verify medium latency color |
| `NoLabel` | ❌ | Verify icon-only mode |
| `Disabled` | ❌ | Verify disabled state |

---

### 🔴 `src/components/Workbook/JoinWorkbookDialog.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Open` | ❌ | Switch to "Invitations" tab → verify list; switch back to "Link" tab → type code → click "Join" → verify `onJoin` fires; type invalid code → verify error message |
| `Closed` | ❌ | Verify dialog hidden |

---

### `src/components/Workbook/TutorCursorOverlay.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `NoTutors` | ❌ | Verify overlay invisible |
| `Disabled` | ❌ | Verify no cursors shown even with tutors |

---

### `src/components/Workbook/TutorPresenceBanner.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `TwoTutors` | ❌ | Verify both tutor names shown; click banner → verify `onClick` fires |
| `SingleTutor` | ❌ | Verify single tutor name |
| `NoTutors` | ❌ | Verify banner hidden |
| `Disabled` | ❌ | Verify banner hidden when disabled |

---

### `src/components/Workbook/Workbook.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `NoComments` | ❌ | Verify no annotation markers shown |
| `WithComments` | ❌ | Click annotation marker → verify comment thread opens |
| `AllResolved` | ❌ | Verify all threads show resolved state |
| `DrawerOpen` | ❌ | Verify drawer visible; click close → verify `onClose`; type reply → submit |
| `DrawerEmpty` | ❌ | Verify empty thread state |
| `HistoryStory` | ❌ | Click a history entry → verify version highlighted |
| `HistoryEmpty` | ❌ | Verify empty history state |

---

### `src/components/Workbook/WorkbookInviteShare.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Connected` | ❌ | Click share icon → verify popover opens; click "Copy" → verify success toast |
| `Disconnected` | ❌ | Click share icon → verify offline warning shown |
| `NoParticipants` | ❌ | Click share icon → verify invite prompt shown |
| `ManyParticipants` | ❌ | Verify overflow "+N" chip for > 4 participants |

> **Mock gap:** Need clipboard permission denied error state.

---

### `src/components/Workbook/WorkbookPresenceBar.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Connected` | ❌ | Hover avatar → verify user name tooltip |
| `Disconnected` | ❌ | Verify disconnected badge on avatar |
| `ManyParticipants` | ❌ | Verify overflow "+N" chip |
| `WithIdleUsers` | ❌ | Verify idle avatars greyed out |
| `Overflow` | ❌ | Verify "+N more" chip |
| `Empty` | ❌ | Verify empty state |

---

### `src/components/Workbook/WorkbookProgress.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` | ❌ | Hover progress ring → verify completion % tooltip |
| `Compact` | ❌ | Verify compact layout |
| `Detailed` | ❌ | Verify expanded stats (blocks complete, accuracy) |
| `Complete` | ❌ | Verify 100% completion celebration state |
| `JustStarted` | ❌ | Verify 10% progress state |
| `Disabled` | ❌ | Verify hidden when workbook disabled |

---

## 9. Debug Panel

### `src/components/DebugPanel/ComponentTreeView.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` | ❌ | Click a node → verify selection highlight; expand node → verify children shown |
| `EmptyTree` | ❌ | Verify empty tree message |
| `WithSelection` | ❌ | Verify pre-selected node highlighted |
| `ManyInstances` | ❌ | Click different nodes → verify only one selected at a time |
| `HighRenderCount` | ❌ | Verify high render-count warning color |
| `ComplexProps` | ❌ | Expand props section → verify nested props shown |

---

### 🔴 `src/components/DebugPanel/DebugPanel.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` | ❌ | Click "Logs" tab → verify log viewer; click "State" tab → verify inspector; click close (X) → verify `onClose` fires |
| `LogsTab` | ❌ | Filter by level → verify filtered logs |
| `StateTab` | ❌ | Verify state inspector active |
| `Interactive` | ❌ | Click "Open Debug Panel" button → verify panel opens; Ctrl+Shift+D → verify toggle |

---

### 🔴 `src/components/DebugPanel/LogViewer.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` | ❌ | Type in search box → verify filtered entries; change level filter → verify matching levels only; click "Clear" → verify `onClear` called |
| `Empty` | ❌ | Verify empty state |
| `ErrorsOnly` | ❌ | Verify only error-level logs |
| `ManyLogs` | ❌ | Scroll to bottom; verify auto-scroll |
| `WithStackTraces` | ❌ | Click error log → verify stack trace expands |
| `MixedLevels` | ❌ | Filter to "warn" → verify only warn entries |

---

### `src/components/DebugPanel/StateInspector.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` | ❌ | Expand a state tree node → verify nested keys; click value → verify copy to clipboard |
| `EmptyState` | ❌ | Verify empty state message |
| `WithErrors` | ❌ | Verify error nodes highlighted in red |
| `LargeDataSet` | ❌ | Collapse/expand deeply nested nodes |

---

## 10. Utility / Other

### 🔴 `src/components/AIAgentConfig.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `PlatformMode` | ❌ | Expand "Kai Settings" accordion → change temperature slider → change model Select → click Save → verify `onSave` called |
| `PlatformBudgetEnforcementOff` | ❌ | Toggle enforcement on → verify budget fields enable |
| `PlatformSaving` | ❌ | Verify Save button disabled/loading during save |
| `SectionMode` | ❌ | Fill overrides → save |
| `SectionWithOverrides` | ❌ | Verify override values pre-filled |
| `EmptyValues` | ❌ | Verify form renders with empty/default values |

---

### `src/components/AIFeedbackWidget.stories.jsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `ChatMessage` | ❌ | Click thumbs-up → verify positive feedback sent; toggle state changes |
| `ContentCompletion` | ❌ | Click thumbs-down → verify `onFeedbackSubmitted` fires |
| `WithCallback` | ❌ | Click thumbs-up → verify "Feedback submitted: POSITIVE" message appears |
| `WithLabels` | ❌ | Verify labels shown; click rating |
| `LargeButtons` | ❌ | Verify larger button size |

---

### `src/components/AvatarEditor.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` | ❌ | Click "Customize" → verify customizer opens; pick a style → click Save → verify `onSave` called |
| `Level1` | ❌ | Click Customize → verify only "Neutral" style available |
| `Level2Detailed` | ❌ | Click Customize → verify "Detailed" style available |
| `WithOverrides` | ❌ | Verify pre-applied overrides shown in avatar preview |

---

### `src/components/CampaignProgress.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `InProgress` | ❌ | Click a chapter → verify chapter detail expands; hover progress bar → verify XP tooltip |
| `Completed` | ❌ | Verify "Completed" state styling |
| `UrgentDeadline` | ❌ | Verify countdown timer shown with urgent color |
| `EndedCampaign` | ❌ | Verify "Ended" state |

---

### `src/components/DictionaryEditor2.stories.jsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` | ❌ | Click "Add Word" → verify new row added; type in word field → type in definition → click Save → verify entry saved; click delete on row → verify row removed; use search box → verify filtered results |
| `Empty` | ❌ | Verify empty state; click "Import CSV" → verify file picker opens |

---

### `src/components/EasterEggEditor.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` | ❌ | Fill keyword → fill reward → click Save → verify `onSubmit` called |
| `EditKeywordEgg` | ❌ | Change trigger value → toggle active switch → save |
| `ScheduleTrigger` | ❌ | Change trigger type to Schedule → verify date/time fields appear → fill → save |
| `InactiveEgg` | ❌ | Toggle active switch → verify state changes |
| `Submitting` | ❌ | Verify Save button disabled during submission |

---

### 🔴 `src/components/GlobalSearchBar.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` | ❌ | Click input → type 2+ characters → verify dropdown opens; click a result → verify `onResultClick`; click "×" → verify cleared; press Escape → verify dropdown closes; change type filter chip → verify filtered results |
| `InToolbar` | ❌ | Same interactions in toolbar context |

> **Mock gap:** `searchContext` mock with `fn()` returning mock results; loading state mock.

---

### `src/components/GradedWorkbookViewer/GradedWorkbookViewer.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `MultipleAttempts` | ❌ | Click attempt tab → verify that attempt's content shown |
| `FlaggedContent` | ❌ | Verify flagged badge; click "Review" → verify moderation action |
| `PendingModeration` | ❌ | Verify pending badge shown |
| `SingleAttemptHighScore` | ❌ | Verify high score highlighted |
| `SingleAttemptLowScore` | ❌ | Verify low score color (red) |
| `NoModeration` | ❌ | Verify no moderation controls |

---

### `src/components/GradedWorkbookViewer/GutterAnnotations.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `MultipleBlocks` | ❌ | Click wrong-answer annotation → verify expansion with correct answer |
| `SingleBlock` | ❌ | Verify single annotation gutter |
| `NoWrongAnswers` | ❌ | Verify clean gutter |
| `FirstAttempt` | ❌ | Verify first-attempt indicator |

---

### `src/components/GroupChallengeEditor.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` | ❌ | Fill title → fill target XP → set deadline → fill narrative → click Save → verify `onSubmit` called with all fields |
| `EditWithProgress` | ❌ | Verify pre-filled values; edit title → save |
| `ExpiredDeadline` | ❌ | Verify expired deadline warning |
| `CompletedChallenge` | ❌ | Verify completed state / progress at 100% |
| `Submitting` | ❌ | Verify Save button disabled |

---

### 🔴 `src/components/InlineGradeCell.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` | ❌ | Click cell → verify Lexical editor opens; type grade value → Tab → verify next cell gets focus; Enter → verify navigation to student work |
| `WithOverride` | ❌ | Click cell → type override → Tab out → verify auto-save fires `onSave` |
| `NoGrade` | ❌ | Click empty cell → verify placeholder shows computed grade; type override |
| `StudentView` | ❌ | Click → verify read-only (no editor opens) |
| `GradebookTable` | ❌ | Tab through multiple cells → verify grid navigation; Up/Down arrows → verify row navigation |

---

### 🔴 `src/components/MiniEditor/MiniEditor.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Editable` | ❌ | Click editor → type text → verify content updates; Ctrl+B → verify bold applied |
| `EditableWithContent` | ❌ | Edit existing content → verify `onChange` fires |
| `ChatMode` | ❌ | Press Enter → verify `onSubmit` fires; Shift+Enter → verify newline |
| `ChatModeNoBlockInserter` | ❌ | Verify block inserter button absent |
| `ReadOnly` | ❌ | Verify content rendered but not editable |
| `SquadDescription` | ❌ | Type description → verify character limit |

---

### `src/components/ModerationPanel.stories.jsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `SingleCategoryFlagged` | ❌ | Click "Approve" → verify `onApprove` fires; click "Flag for Review" → verify `onFlag` fires |
| `MultipleCategoriesFlagged` | ❌ | Approve one category → verify partial approval state |
| `ApprovedContent` | ❌ | Verify approve button absent (already approved) |
| `InstructorReviewWorkflow` | ❌ | Click through approve/flag workflow; verify state transitions |
| `MalformedFlags` | ❌ | Verify graceful handling of bad data |

---

### 🔴 `src/components/NotificationList.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `WithNotifications` | ❌ | Click "Mark All as Read" → verify all items marked read; click category tab → verify filtered notifications; click a notification item → verify `onClick` fires |
| `Empty` | ❌ | Verify empty state per tab |
| `Loading` | ❌ | Verify skeleton shown |
| `AllSeen` | ❌ | Verify "Mark All as Read" disabled |
| `SingleCategory` | ❌ | Verify correct tab pre-selected |

---

### `src/components/NotificationInvitations.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `PeerReviewInvites` | ❌ | Click "Accept" on first invite → verify removed from list; click "Decline" → verify decline handler fires |
| `PracticeSessionInvites` | ❌ | Accept invite → verify join action triggered |
| `AllCollaborationInvites` | ❌ | Accept one of each type |
| `EmptyState` | ❌ | Verify empty message |
| `LoadingState` | ❌ | Verify loading skeleton |

---

### `src/components/OfflineBanner.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `OnlineNoPending` | ❌ | Verify banner not visible |
| `OfflineWarning` | ❌ | Verify banner visible; simulate reconnect → verify banner hides |

---

### `src/components/PermissionErrorOverlay.stories.jsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `UnitPermissionError` | ❌ | Click "Request Access" → verify callback fires |
| `Interactive` | ❌ | Click toggle → verify overlay shows; click Request Access → verify toggle back |
| `ClosedState` | ❌ | Verify overlay not shown |

---

### `src/components/QuestionEditor2.stories.jsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` | ❌ | Type question text → add answer options → mark correct answer → click Save → verify `onSave` fired with question data; switch type MCQ→True/False → verify UI adapts |
| `Empty` | ❌ | Click "Add Answer" → verify new option row appears |

---

### `src/components/SafeHydrate.stories.jsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` | ❌ | Verify content renders after hydration (no SSR flash) |
| `WithComplexContent` | ❌ | Verify complex nested content renders |

---

### `src/components/SkillTreeEditor.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` | ❌ | Fill title → select units from multi-select → set minimum accuracy → click Save → verify `onSubmit` called with correct data |
| `EditExisting` | ❌ | Verify pre-filled values; add prerequisite → save |
| `EmptySection` | ❌ | Verify unit/skill dropdowns empty |
| `Submitting` | ❌ | Verify Save button disabled |

---

### `src/components/SkillTreePopupButton.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` | ❌ | Click button → verify skill tree popup opens; close popup → verify button returns to default |
| `CustomLabel` | ❌ | Verify custom label text on button |

---

### 🔴 `src/components/SortableAnswers.stories.jsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` | ❌ | Edit answer text → verify `onQuestionChange` fires; toggle "Correct" checkbox → verify `onCorrectChange` fires; click delete → verify `onQuestionDelete` fires; drag to reorder → verify `onQuestionReorder` called |
| `SingleAnswer` | ❌ | Verify delete button absent (can't delete only answer) |
| `ManyAnswers` | ❌ | Drag first item to last → verify reorder |

---

### `src/components/StorageManagement.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` | ❌ | Click "Download Model" → verify download progress; click delete model → verify confirm dialog; click cached assignment "Remove" → verify removed from list |

> **Mock gap:** Loaded state (model already downloaded, cached assignments). IndexedDB needs a decorator to inject mock data.

---

### `src/components/SyncStatusIndicator.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `AllSynced` | ❌ | Verify indicator hidden |
| `OfflineNoPending` | ❌ | Dispatch `offline` event → verify "Offline" chip shows |

---

### `src/components/UserAvatar.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` | ❌ | Hover avatar → verify tooltip with username |
| `WithStreak` | ❌ | Verify streak badge shown |
| `StreakMilestone` | ❌ | Verify milestone glow/badge |
| `WithExternalSrc` | ❌ | Simulate image load error → verify fallback initials |

---

## 11. stories/ Directory

### 🔴 `src/stories/KeyboardShortcutTrainer.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `Default` | ❌ | Press Ctrl+B → verify row highlights + checkmark; press Ctrl+I → verify second row; press 5 shortcuts → verify "Keyboard Novice" achievement unlocks; press all 20 → verify "Keyboard Master" |

---

### `src/stories/SidebarNavigation.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `SidebarNavigation` | ❌ | Click each destination button → verify correct storyId URL constructed and applied |

---

### `src/stories/section-settings.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `AISettings` | ❌ | Change AI model → click Save → verify save called |
| `GamificationSettings` | ❌ | Toggle XP enabled → verify change saved; edit multiplier |

---

### `src/stories/root-components.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `BotCustomizerTier0/2/4` | ❌ | Click customizer option → verify appearance updates |
| `CommunityUnitCardDefault` | ❌ | Click card → verify navigation |
| `CommunityUnitCardForking` | ❌ | Click "Fork" → verify fork action |
| `PrefetchButtonDefault` | ❌ | Click → verify prefetch triggered + loading state |
| `SharedUnitCardEdit` | ❌ | Click Edit → verify edit mode; save |
| `ShowDeletedToggleOff/On` | ❌ | Click toggle → verify deleted items shown/hidden |
| `ToolbarScrollButtonLeft/Right` | ❌ | Click → verify scroll; `Disabled` → verify no scroll |

---

### `src/stories/root-components-with-providers.stories.tsx`

| Story | Status | Missing Interactions |
|---|---|---|
| `GradeReviewDrawerOpen` | ❌ | Click grade row → verify detail; close drawer → verify closed |
| `CollaboratorManagerOwner` | ❌ | Add collaborator (type email → invite) → verify row appears; change role → verify update; remove → verify removed |
| `CollaboratorManagerReadOnly` | ❌ | Verify no edit controls |
| `RecordingStudioEnhancedModalOpen` | ❌ | Click record → verify recording starts; stop → verify take saved |

---

## Summary Statistics

| Category | Files | Approx. Stories | Files with `play:` | Coverage |
|---|---|---|---|---|
| Editor (Editor3) | 19 | ~60 | 0 | **0%** |
| Gamification | 36 | ~110 | 1 (partial) | **<3%** |
| Chat | 10 | ~35 | 0 | **0%** |
| Dashboard | 5 | ~22 | 0 | **0%** |
| Peer Review | 3 | ~16 | 0 | **0%** |
| Practice Drill | 6 | ~22 | 0 | **0%** |
| Recording Studio | 6 | ~18 | 0 | **0%** |
| Workbook | 9 | ~35 | 0 | **0%** |
| Debug Panel | 4 | ~22 | 0 | **0%** |
| Utility / Other | 20 | ~60 | 0 | **0%** |
| **TOTAL** | **~118** | **~400** | **<1** | **<1%** |

---

## Top Priority Files

Ranked by interaction density and user impact. Start here.

| # | File | Why High Priority |
|---|---|---|
| 1 | 🔴 `InlineGradeCell.stories.tsx` | Click-to-edit, Tab/arrow keyboard grid nav, auto-save debounce |
| 2 | 🔴 `GlobalSearchBar.stories.tsx` | Search input, typeahead dropdown, filter chips, clear, Escape |
| 3 | 🔴 `NotificationList.stories.tsx` | Tabs, mark-all-read, per-item click |
| 4 | 🔴 `CollaborativeChat/MessageInput.stories.tsx` | Type, send, @mention keyboard popup, Shift+Enter |
| 5 | 🔴 `CollaborativeChat/TopicList.stories.tsx` | Select topic, create-dialog flow, form submit |
| 6 | 🔴 `DebugPanel/LogViewer.stories.tsx` | Search input, level filter Select, clear button |
| 7 | 🔴 `Gamification/XPTunerDialog.stories.tsx` | Multiple sliders, text fields, enable/disable toggle, save |
| 8 | 🔴 `Gamification/RedemptionConditionForm.stories.tsx` | Select + number input, conditional fields |
| 9 | 🔴 `PracticeDrill/PracticeDrillConfigPopup.stories.tsx` | Two Selects, start button, no-content guard |
| 10 | 🔴 `Workbook/JoinWorkbookDialog.stories.tsx` | Tabs, text input, join button, error state |
| 11 | 🔴 `AIAgentConfig.stories.tsx` | Accordion expand, slider, Select, budget enforcement toggle, save |
| 12 | 🔴 `SortableAnswers.stories.jsx` | Edit text, toggle checkbox, delete, drag-reorder |
| 13 | 🔴 `Gamification/SquadPostEditor.stories.tsx` | Lexical editor, title field, publish |
| 14 | 🔴 `PeerReview/OpenCollaborationRooms.stories.tsx` | Table row actions, assign dialog flow |
| 15 | 🔴 `MiniEditor/MiniEditor.stories.tsx` | Lexical editable, Ctrl+B bold, chat-mode Enter |
| 16 | 🔴 `DebugPanel/DebugPanel.stories.tsx` | Tab switching, close button, keyboard shortcut toggle |
| 17 | 🔴 `stories/KeyboardShortcutTrainer.stories.tsx` | Keyboard event sequencing, achievement unlock |

---

## Mock Data Gaps

These stories need new or extended mock data before `play:` interactions can be written.

| File | Gap |
|---|---|
| `StorageManagement.stories.tsx` | Loaded state: model downloaded, cached assignments present — needs IndexedDB decorator |
| `GlobalSearchBar.stories.tsx` | `searchContext` mock with `fn()` returning typed results; loading state; error state |
| `GamificationToastLayer.stories.tsx` | Button in the story that fires a toast event (can't test toast without triggering it) |
| `EnhancedGeneration.stories.jsx` | `fn()` spies on all `onGenerate`/`onSave` callbacks |
| `Editor3 plugins (all)` | Error states: AI unavailable, upload failed, network error |
| `SquadJoinPanel.stories.tsx` | "Joining in progress" loading state |
| `PracticeDrillDialog.stories.tsx` | Error state: drill generation failed |
| `JobsDashboard.stories.tsx` | Error state, loading state |
| `WorkbookInviteShare.stories.tsx` | Clipboard permission denied error state |
| `CollaborativeChat/*.stories` | WebSocket/real-time event mocks for live update simulation |
| `DictionaryEditor2.stories.jsx` | CSV import mock (file input with mock parse result) |
| `InlineGradeCell.stories.tsx` | GradebookTable story needs 5+ cells to test keyboard grid nav |
