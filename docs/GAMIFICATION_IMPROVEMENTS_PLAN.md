# Gamification Improvements Plan

Comprehensive plan for completing and improving the instructor gamification panel, skill evaluation system, group challenges, and student-facing gamification features.

_Last updated: May 2026_

## Current State Summary

Most planned features have been implemented. The instructor panel now lives in the **App Router** at `app/[locale]/admin/settings/page.tsx` (not the old Pages Router path). The system has full section scoping, skill evaluation, all four easter egg trigger types, boss battle CRUD, campaign timeline, badge model + editor with visual picker, and content lock management UI.

### What Works Well (Implemented)
- XP ledger with deduplication
- Badge auto-evaluation after XP awards (hardcoded + DB Badge model both evaluated)
- Anti-badge system with debuffs and redemption
- Streaks with freezes and milestones
- Content locking (XP/badge/linear gating) with instructor UI
- Cosmetic unlocks by level (avatar styles, editor themes)
- Squad system with embedded members/posts
- Leaderboard per section
- Dashboard widgets (StreakIndicator, ProgressRings, BadgeShelf, NailedItWall, CampaignTimeline, BossBattleCard)
- Practice drills with diminishing returns
- Peer review XP
- Section-scoped instructor panel with SectionSelector + URL persistence
- Copy From Section (skills, easter eggs, group challenges)
- Skill tree with unit linking, auto-evaluation on unit completion, and AI generation
- Easter Egg system: all 4 triggers (KEYWORD, SCHEDULE, SECRET_LINK, ACHIEVEMENT) work end-to-end
- Boss Battle creation form with stakes, featured image generation, progress display
- Campaign Timeline on student dashboard (chapter ordering via `chapterOrder`)
- Badge model with full CRUD, visual picker (shape/icon/gradient/animation), criteria config
- Content lock management in instructor panel (per-unit XP/badge/module requirements)
- XP history page at `/xp-history`
- Skills page at `/skills` with visual skill tree
- `SecretLinkIcon` on workbook pages

### What's Still Incomplete or Missing
- **Easter Egg badge picker** — form has no `badgeId` field; discovery doesn't let instructor choose which badge to award
- **AI Badge Designer** — planned chat-style badge generator not yet built into BadgeEditor
- **Squad page challenges** — `squad/[id]` does not display active group challenges
- **Campaign model references** — admin settings page still references `client.models.Campaign` which no longer exists in schema (dead code)
- **BossBattleForm is create-only** — no edit mode for existing battles

---

## Phase 1: Section-Scoped Instructor Panel ✅ COMPLETE

**Status**: Fully implemented. Panel lives at `app/[locale]/admin/settings/page.tsx` with section-level settings at `app/[locale]/section/[id]/settings/gamification/page.tsx`.

### 1.1 Section Selector ✅

- `SectionSelector` component rendered at panel top
- Selected section ID stored in state and URL query param
- All queries/mutations scoped by `cohortId` = selected section
- Section's assigned units passed as `availableUnits` prop to skill/easter-egg forms

**Files**: `app/[locale]/admin/settings/page.tsx`, `src/components/Gamification/SectionSelector.tsx`, `src/components/Gamification/InstructorGamificationPanel.tsx`

### 1.2 Copy Settings Between Sections ✅

Implemented in admin settings page callback, clones:
- Skills (preserves structure, resets student progress)
- Easter Eggs (resets discoveries, sets active=true)
- Group Challenges (resets currentXP=0, empties contributions)
- Does NOT copy: Squads, StudentProfiles, XP logs (student-specific)

Also: Section-level gamification config copy available at per-section settings page.

---

## Phase 2: Skill Tree — Unit Linking & Auto-Evaluation ✅ COMPLETE

**Status**: Fully implemented. Skills have unit linking, auto-evaluation triggers on unit completion, and the instructor form has all planned fields plus AI generation.

### 2.1 Schema ✅

`Skill` model has: `unitIds: a.string().array()`, `minimumAccuracy: a.integer()` (defaults to 70 in Lambda).

`evaluateSkillsForUnit` mutation exists with args: `studentId`, `unitId`, `cohortId`.

### 2.2 Lambda Handler ✅

`handleEvaluateSkillsForUnit` implemented at handler.ts:3442:
- Loads skills from cohortId, filters by unitIds containing current unit
- Checks completed grades with accuracy >= minimumAccuracy
- Updates StudentProfile.skillProgress
- Awards XP for mastery
- Calls advanceSkillProgress for prerequisite unlock propagation

### 2.3 Frontend Trigger ✅

Called in `src/context/unitContext.jsx` after unit completion (line ~506):
```javascript
client.mutations.evaluateSkillsForUnit({ studentId, unitId, cohortId: sectionId })
```

### 2.4 `generateSkillTree` ✅

Lambda sets `unitIds: [unitID]` and `minimumAccuracy: 70` on each generated Skill (handler.ts:4040-4041).

### 2.5 Instructor Panel — Skill Form ✅

`SkillForm.tsx` has all planned fields:
- Title (required)
- Description (multiline)
- XP Reward (number)
- Required Units (Autocomplete multi-select from `availableUnits`)
- Prerequisites (Autocomplete multi-select from `availableSkills`)
- Min Accuracy (Slider, default 70%)
- "Generate from Unit" button via `onGenerateFromUnit` prop

---

## Phase 3: Easter Egg Trigger Redesign ✅ MOSTLY COMPLETE

**Status**: All 4 new trigger types work end-to-end. Badge picker on discovery is the main remaining gap.

### Implementation vs Plan

**Schema**: EasterEgg trigger enum is `["KEYWORD", "SCHEDULE", "SECRET_LINK", "ACHIEVEMENT"]`. The last two are legacy holdovers — only the first four are exposed in the instructor form and actively handled.

**Lambda** (`handleCheckEasterEggs` at handler.ts:2898): Handles KEYWORD, SCHEDULE, and ACHIEVEMENT matching. `evaluateAchievementCondition` (handler.ts:3014) supports metrics: `accuracy`, `streak`, `xp`, `level`, `units_completed` with operators `>=`, `<=`, `>`, `<`, `==`.

**Frontend**:
- `EasterEggLayer.tsx` — KEYWORD listener + SCHEDULE polling/auto-discovery ✅
- `SecretLinkIcon.tsx` — renders hidden icon on workbook pages for SECRET_LINK eggs ✅
- `WorkbookClient.tsx` — imports and renders `SecretLinkIcon` with unit ID ✅
- ACHIEVEMENT — Lambda evaluates automatically, no frontend needed ✅

**Instructor Form** (`EasterEggForm.tsx`): Full type-conditional UI ✅
- KEYWORD: keyword/sequence text input
- SCHEDULE: start + end datetime-local inputs
- SECRET_LINK: target unit autocomplete from `availableUnits`
- ACHIEVEMENT: metric + comparator + numeric threshold → serialized as `"accuracy>=95"`

### Remaining Work

| Item | Status | Notes |
|------|--------|-------|
| Badge picker on form | ❌ Not implemented | `EasterEggFormData` has no `badgeId`; form needs badge autocomplete |
| `EasterEggTrigger.tsx` cleanup | ❌ Not done | File defines unused CLICK/TIME/INTERACTION hooks — should be deleted or replaced |



---

## Phase 4: Boss Battle / Group Challenge Creation ✅ MOSTLY COMPLETE

**Status**: Full creation form with rich fields including stakes and AI image generation. Progress display with pause/activate/delete. Edit mode not yet implemented.

### 4.1 Creation Form ✅

`BossBattleForm.tsx` includes:

| Field | Type | Notes |
|-------|------|-------|
| Title | text | required |
| Target XP (HP) | number | required |
| Start Date | date picker | optional |
| Deadline | date picker | optional |
| Bonus Multiplier | number | default 1.5 |
| Narrative Setting | text (multiline) | displayed in CampaignBriefing |
| Stakes | structured JSON | full BattleStakes config (see below) |
| Featured Image | AI-generated | via `generateImage` action |

**Stakes system** (richer than originally planned):
- Lose level, lose XP (configurable amount), lose streak freeze, reset streak
- Lose badge (by rarity target), streak miss XP penalty (per day)
- Lose cosmetics (with penalty duration in days)

### 4.2 Existing Battle Display ✅

`BossBattleProgress` component (rendered in instructor panel) shows:
- Title + active/paused state
- Progress bar: `currentXP / targetXP`
- Pause/activate toggle
- Delete button

**Missing from plan**: Top contributors list, deadline countdown display.

### 4.3 Student-Facing Challenge Display

| Location | Status | Notes |
|----------|--------|-------|
| Student Dashboard | ✅ | `BossBattleCard` rendered on home page |
| Squad Page | ❌ | `squad/[id]` does not show challenges |
| Section Detail | Not checked | |

---

## Phase 5: Campaign Chapter Progression ✅ COMPLETE

**Status**: Implemented. `CampaignTimeline` component exists and renders on the student dashboard.

### Implementation

- Each `GroupChallenge` with `setting`/`stakes` IS a campaign chapter
- `chapterOrder: a.integer()` exists on GroupChallenge schema
- `CampaignTimeline.tsx` sorts by `chapterOrder`, computes progress percent from `currentXP/targetXP`
- Classifies chapter state as completed/active/locked with status icons and progress bars
- Rendered on the main dashboard page (`app/[locale]/page.jsx`)

### Differences from Plan

- `CampaignTimeline` is simpler than originally envisioned — it's a list with progress bars and status chips, not the full chapter timeline visualization with locked/unlocked iconography described in the plan
- The "Campaign" model was fully absorbed into GroupChallenge (confirmed)
- **Dead code**: `app/[locale]/admin/settings/page.tsx` still references `client.models.Campaign` in handlers (~line 343) — this model no longer exists and should be cleaned up

---

## Phase 6: Badge System — Custom Badges & Content Locking ✅ MOSTLY COMPLETE

**Status**: Badge model exists in schema with full CRUD. Lambda evaluates both hardcoded criteria AND DB Badge records. BadgeEditor has visual picker with live preview. Content lock management UI exists in instructor panel. AI Badge Designer is the main remaining gap.

### 6.1 Badge Model ✅

Schema (`amplify/data/resource.ts:1640`) matches plan exactly:
```typescript
Badge: a.model({
  title: a.string().required(),
  description: a.string(),
  icon: a.string(),
  shape: a.enum(["circle", "hexagon", "shield", "diamond"]),
  rarity: a.enum(["common", "uncommon", "rare", "epic", "legendary"]),
  category: a.string(),
  criteria: a.json(),
  cohortId: a.string(),
  autoEvaluate: a.boolean().default(true),
})
```

### 6.2 Lambda Changes ✅

`handleCheckBadges` (handler.ts:1343) evaluates:
1. Hardcoded `BADGE_CRITERIA` (15 badges: FIRST_SUBMISSION, GOOD_EYE, QUICK_DRAW, SHARPSHOOTER, CONSISTENT, TEAM_PLAYER, DEEP_THINKER, TOP_OF_CLASS, PERFECTIONIST, DRILL_MASTER, COMEBACK_KID, STREAK_14, STREAK_30, EASTER_EGG_HUNTER, PEER_REVIEW_CHAMPION)
2. Hardcoded `ANTI_BADGE_CRITERIA` (6 anti-badges: CONSISTENTLY_WRONG, STREAK_BREAKER, SPEED_RUN_SCHOLAR, THE_GHOST, XP_ZERO_HERO, MINIMALLY_VIABLE_STUDENT)
3. DB Badge records with `autoEvaluate=true` + custom criteria JSON
4. Anti-badge debuffs and redemption logic

**Note**: Hardcoded criteria were NOT replaced by DB records as originally planned. Both coexist — the Lambda evaluates hardcoded first, then DB badges. This is a pragmatic simplification (no migration/seed needed).

### 6.3 Instructor Panel — Badge Creation UI ✅ (Partial)

`BadgeEditor.tsx` provides:
- Badge Name, Description
- Trigger Event (reason from XP log)
- Times Required threshold
- Rarity select
- Visual Design section (via `BadgeVisualPicker`)
- Buff configuration (XP multiplier, duration, streak freezes, unlock IDs)

`BadgeVisualPicker.tsx` provides:
- Icon catalog with search/tabs
- Shape toggle (circle/hexagon/shield/diamond)
- Background + icon color pickers
- Gradient preset picker
- Animation select
- **Live preview** via `BadgeIcon` component ✅

#### AI Badge Designer ❌ NOT IMPLEMENTED

The planned chat-style AI badge designer (using `useChat` hook with a badge-designer system prompt, `generate_badge_config` tool call, real-time preview updates) has **not been built**. This remains a future enhancement.

### 6.4 Content-Lock Configuration UI ✅

Implemented in `InstructorGamificationPanel.tsx` "Unit Progression" accordion section:
- Linear lock toggle (sequential unit progression)
- Per-unit configuration: Required XP, Required Badge, Required Module Completion
- Maps to `Unit.requiredXP`, `Unit.requiredBadgeId`, `Unit.requiredModuleCompletion`

Also available at section-level: `app/[locale]/section/[id]/settings/gamification/page.tsx` with feature toggles and typed gamificationConfig.

`ContentLockCard` component and `useContentLock()` hook consume these values on the student side.

### 6.5 Badge ↔ Easter Egg Integration ❌ NOT IMPLEMENTED

- `EasterEgg.badgeId` field exists in schema
- Lambda `handleDiscoverEasterEgg` can award the badge if `badgeId` is set
- **But**: `EasterEggForm.tsx` has no badge picker field — instructors cannot select which badge to award
- This is a small UI addition (badge autocomplete in the easter egg form)

---

## Remaining Work (Not Yet Implemented)

Features that were planned or exist in other gamification systems but are still missing:

| Feature | Impact | Effort | Notes |
|---------|--------|--------|-------|
| **Easter Egg badge picker** | Instructors can't assign badges to egg discoveries | Low | Add badge autocomplete to EasterEggForm |
| **AI Badge Designer** | No AI-assisted badge creation | Medium | Chat-style input + `generate_badge_config` tool call |
| **Squad page challenges** | Squad members can't see active challenges on their squad page | Low | Add GroupChallenge query + display to `squad/[id]` |
| **BossBattle edit mode** | Can only create, not edit existing battles | Low | Add initial values prop to BossBattleForm |
| **Clean up Campaign dead code** | Admin settings references non-existent model | Low | Remove `client.models.Campaign` handlers from admin settings page |
| **EasterEggTrigger.tsx cleanup** | Unused hooks file | Low | Delete or replace with only SecretLinkIcon |
| **Boss Battle contributors display** | Can't see who contributed most XP | Low | Render `contributions` array in BossBattleProgress |
| **Boss Battle deadline countdown** | No visual urgency indicator | Low | Add countdown timer to BossBattleProgress |
| **Notification Center** | Toasts are ephemeral, no persistent record | Medium | New model + page |
| **Daily/Weekly Personal Quests** | No recurring engagement hooks beyond streaks | High | New model + evaluation logic |
| **Unlock Roadmap/Preview** | Students can't see future unlocks | Low | UI only — show what each level unlocks |
| **Side-by-Side Student Comparison** | Can view profiles but can't compare | Low | UI only |
| **Privacy Controls for Profiles** | No "make my profile private" option | Low | Add field to StudentProfile |

### Priority Recommendations

**Quick wins** (small PRs, mostly UI):
1. Easter Egg badge picker (add field to form + wire to `badgeId`)
2. Squad page active challenges display
3. BossBattle edit mode
4. Remove dead code (Campaign references, legacy enum values, EasterEggTrigger.tsx)
5. Boss Battle contributors + deadline countdown

**Medium term**:
6. AI Badge Designer (chat UX + system prompt + tool call)
7. Notification center with history
8. Unlock roadmap visualization

**Long term**:
9. Daily/weekly personal quest system
10. Privacy controls

---

## Implementation Status Summary

```
Phase 1: Section scoping + copy           ✅ COMPLETE
Phase 2: Skill tree (schema + Lambda + UI) ✅ COMPLETE
Phase 3: Easter egg redesign              ✅ MOSTLY COMPLETE (missing badge picker)
Phase 4: Boss battle creation             ✅ MOSTLY COMPLETE (missing edit mode)
Phase 5: Campaign chapters                ✅ COMPLETE
Phase 6: Badge system                     ✅ MOSTLY COMPLETE (missing AI designer + egg integration)
Quick wins: XP history, feed, roadmap     ✅ XP history done; roadmap still missing
```

### Implementation Differences from Original Plan

| Planned | Actual |
|---------|--------|
| Panel at `pages/instructor/gamification.jsx` | Panel at `app/[locale]/admin/settings/page.tsx` (App Router) |
| Replace hardcoded BADGE_CRITERIA with DB | Both coexist — hardcoded evaluated first, then DB badges |
| Campaign as separate concept | Fully absorbed into GroupChallenge with `chapterOrder` |
| Badge seeding on first deploy | Not needed — hardcoded criteria still run alongside DB |
| Stakes as free-text | Structured `BattleStakes` JSON with typed penalty options |
| BossBattle simple form | Rich form with AI image generation for featured image |
| Anti-badge system (not in plan) | Implemented: 6 anti-badges with debuffs and redemption |
| `applyBattleStakes` mutation (not in plan) | Implemented: penalties applied when boss battle deadline passes |
| Section-level gamification config page (not in plan) | Implemented at `/section/[id]/settings/gamification` |
| Skills page (not in plan) | Implemented at `/skills` with SkillTreeClient |

---

## Files Affected (Updated)

| File | Status | Role |
|------|--------|------|
| `amplify/data/resource.ts` | ✅ Done | Skill (unitIds, minimumAccuracy), EasterEgg (new triggers + cohortId), Badge model, GroupChallenge (chapterOrder, stakes, rewards) |
| `amplify/functions/gamification/handler.ts` | ✅ Done | evaluateSkillsForUnit, generateSkillTree (sets unitIds), checkEasterEggs (KEYWORD/SCHEDULE/ACHIEVEMENT), checkBadges (hardcoded + DB), applyBattleStakes |
| `src/context/unitContext.jsx` | ✅ Done | Calls evaluateSkillsForUnit after unit completion |
| `src/context/gamificationContext.tsx` | ✅ Done | Content lock evaluation, linear lock, useContentLock hook |
| `src/components/Gamification/EasterEggLayer.tsx` | ✅ Done | KEYWORD listener + SCHEDULE polling |
| `src/components/Gamification/SecretLinkIcon.tsx` | ✅ Done | SECRET_LINK hidden icon on workbook pages |
| `src/components/Gamification/EasterEggForm.tsx` | ✅ Done | Type-conditional form (missing badge picker) |
| `src/components/Gamification/SkillForm.tsx` | ✅ Done | Full form with units, prerequisites, accuracy |
| `src/components/Gamification/BossBattleForm.tsx` | ✅ Done | Create form with stakes + image gen |
| `src/components/Gamification/BadgeEditor.tsx` | ✅ Done | Badge CRUD with visual picker (missing AI designer) |
| `src/components/Gamification/BadgeVisualPicker.tsx` | ✅ Done | Icon/shape/color/gradient/animation pickers with live preview |
| `src/components/Gamification/CampaignTimeline.tsx` | ✅ Done | Chapter progression display |
| `src/components/Gamification/InstructorGamificationPanel.tsx` | ✅ Done | All accordion sections wired |
| `src/components/Gamification/SectionSelector.tsx` | ✅ Done | Section picker |
| `app/[locale]/admin/settings/page.tsx` | ✅ Done | Panel host with section scoping + copy logic |
| `app/[locale]/section/[id]/settings/gamification/page.tsx` | ✅ Done | Per-section gamification config |
| `app/[locale]/workbook/[id]/WorkbookClient.tsx` | ✅ Done | Renders SecretLinkIcon |
| `app/[locale]/xp-history/page.jsx` | ✅ Done | XP earning history |
| `app/[locale]/skills/page.tsx` | ✅ Done | Visual skill tree page |
| `app/[locale]/squad/[id]/page.jsx` | ❌ Missing | Needs active challenges section |
| `src/components/Gamification/EasterEggTrigger.tsx` | 🧹 Cleanup | Unused hooks — should be deleted |

---

_Created: May 2026_  
_Last updated: May 23, 2026 — Reconciled with implemented code_
