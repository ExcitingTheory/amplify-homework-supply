# Gamification Improvements Plan

Comprehensive plan for completing and improving the instructor gamification panel, skill evaluation system, group challenges, and student-facing gamification features.

## Current State Summary

The gamification system has strong backend infrastructure but the **instructor panel is too minimal to control it**, and several student-facing features are incomplete or missing.

### What Works Well
- XP ledger with deduplication
- Badge auto-evaluation after XP awards
- Streaks with freezes and milestones
- Content locking (XP/badge/linear gating)
- Cosmetic unlocks by level (avatar styles, editor themes)
- Guild system with embedded members/posts
- Leaderboard per section
- Dashboard widgets (StreakIndicator, ProgressRings, BadgeShelf, NailedItWall)
- Practice drills with diminishing returns
- Peer review XP

### What's Broken or Incomplete
- `/instructor/gamification` panel is too bare to control any feature properly
- Skills have no unit linking — mastery is never triggered by completion
- Easter Egg creation form lacks trigger configuration (only KEYWORD works end-to-end)
- Boss Battle has no creation form — only a delete list
- Group challenge narratives are only partially displayed
- Campaign chapter progression has no student-facing UI
- No section scoping on the instructor panel

---

## Phase 1: Section-Scoped Instructor Panel

**Goal**: Make `/instructor/gamification` actually useful for instructors.

### 1.1 Section Selector (Foundation)

Add a section picker at the top of the page. All data is already `cohortId`-based, so this scopes queries by the selected section ID.

**Files**: `pages/instructor/gamification.jsx`, `InstructorGamificationPanel.tsx`

**Behavior**:
- Show instructor's owned sections in a dropdown
- Selected section ID becomes the `cohortId` for all queries/mutations
- Persist selection in URL query param (`?section=abc-123`)
- Show section's assigned units in a data prop for skill creation

### 1.2 Copy Settings Between Sections

"Copy From Section" button that clones gamification config from another section:
- Skills (reset progress, remap unitIds if matching assignments exist)
- Easter Eggs (clone with reset discoveries)
- Group Challenges (clone with currentXP=0, reset contributions)
- Does NOT copy: Guilds, StudentProfiles, XP logs (student-specific)

**Files**: `pages/instructor/gamification.jsx` (new callback), could be a Lambda mutation for atomicity

---

## Phase 2: Skill Tree — Unit Linking & Auto-Evaluation

**Goal**: Skills are tied to units. Completing all linked units at ≥70% accuracy masters the skill.

### 2.1 Schema Change

```typescript
Skill: a.model({
  ...existing,
  unitIds: a.string().array(),           // Units required to master this skill
  minimumAccuracy: a.integer().default(70), // Min accuracy per unit
})
```

Add mutation:
```typescript
evaluateSkillsForUnit: a.mutation()
  .arguments({ studentId: a.string().required(), unitId: a.string().required(), cohortId: a.string() })
  .returns(a.json())
  .handler(a.handler.function(gamificationFunction))
  .authorization(...)
```

### 2.2 Lambda Handler: `handleEvaluateSkillsForUnit`

```
Input: { studentId, unitId, cohortId }
1. Query Skills where unitIds contains unitId (filter client-side from cohort skills)
2. For each matching skill:
   a. For each unitId in skill.unitIds, fetch student's Grade where:
      - owner = studentId
      - unitID = unitId (via assignment lookup)
      - complete = true
      - accuracy >= skill.minimumAccuracy (default 70)
   b. If ALL units pass → advanceSkillProgress(studentId, skillId, 'MASTERED')
   c. If SOME but not all → set IN_PROGRESS
   d. If NONE → leave as AVAILABLE
3. Prerequisite unlocking handled by existing advanceSkillProgress logic
```

### 2.3 Frontend Trigger

In `src/context/unitContext.jsx`, after `awardXPAndCheck('ALL_BLOCKS_COMPLETED', ...)`:
```javascript
client.mutations.evaluateSkillsForUnit({ studentId: username, unitId, cohortId: sectionId })
  .catch(err => console.warn('[unitContext] Skill evaluation:', err))
```

### 2.4 `generateSkillTree` Update

Lambda's `generateSkillTree` already knows the source `unitID`. Update it to:
- Set `unitIds: [unitID]` on each generated Skill
- Set `minimumAccuracy: 70` on each

### 2.5 Instructor Panel — Skill Form

Replace current title-only input with:

| Field | Type | Notes |
|-------|------|-------|
| Title | text | required |
| Description | text (multiline) | optional |
| XP Reward | number | default 0 |
| Required Units | Autocomplete (multi) | from section's assignments |
| Prerequisites | Autocomplete (multi) | from existing skills in section |
| Min Accuracy | number | default 70%, range 0-100 |

Plus "Generate from Unit" button that calls `generateSkillTree` for a selected unit.

---

## Phase 3: Easter Egg Trigger Redesign

**Goal**: Replace the broken/incomplete trigger types with ones that actually work end-to-end without developer intervention.

### Current Problems
1. Form uses "Message" field as both `triggerValue` and `revealMessage`
2. `TIME_BASED` — Lambda stores `"HH:MM-HH:MM"` UTC but frontend hook expects ISO datetime strings. Never globally wired.
3. `UI_INTERACTION` — Requires hardcoded component placement. Instructor can't configure where.
4. `SUBMISSION_QUALITY` — In the enum but completely unimplemented everywhere.

### Redesigned Trigger Types

Replace the current enum:
```typescript
// OLD (broken)
trigger: a.enum(["KEYWORD", "UI_INTERACTION", "TIME_BASED", "SUBMISSION_QUALITY"])

// NEW (all work automatically)
trigger: a.enum(["KEYWORD", "SCHEDULE", "SECRET_LINK", "ACHIEVEMENT"])
```

| Type | What it does | `triggerValue` format | How it triggers |
|------|-------------|----------------------|-----------------|
| **KEYWORD** | Secret word typed anywhere in app | `"konami"` (case-insensitive) | `EasterEggLayer` global keypress listener (already works) |
| **SCHEDULE** | Active during a date/time window | ISO JSON: `{"start":"2026-05-10T00:00:00Z","end":"2026-05-11T23:59:59Z"}` | `EasterEggLayer` polls active SCHEDULE eggs every 60s, auto-triggers on match |
| **SECRET_LINK** | Hidden on a specific unit page | Unit ID: `"unit-abc123"` | Renders a tiny hidden icon on that unit's workbook page. Student clicks it. |
| **ACHIEVEMENT** | Triggered by grade/streak/XP milestones | Condition string: `"accuracy>=95"` or `"streak>=7"` or `"xp>=1000"` | Lambda evaluates after `awardXP`/grade submission. No frontend hook needed. |

### 3.1 Schema Change

```typescript
EasterEgg: a.model({
  trigger: a.enum(["KEYWORD", "SCHEDULE", "SECRET_LINK", "ACHIEVEMENT"]),
  triggerValue: a.string().required(),
  xpReward: a.integer().required(),
  revealMessage: a.string().required(),
  active: a.boolean().default(true),
  cohortId: a.string(),  // ADD — section scoping
  discoveries: a.ref("EasterEggDiscoveryEntry").array(),
})
```

### 3.2 Lambda Changes

**`handleCheckEasterEggs`** — update matching logic:
```typescript
if (egg.trigger === "KEYWORD") {
  matched = textLower.includes((egg.triggerValue || "").toLowerCase());
} else if (egg.trigger === "SCHEDULE") {
  const { start, end } = JSON.parse(egg.triggerValue || "{}");
  const now = new Date().toISOString();
  matched = (!start || now >= start) && (!end || now <= end);
} else if (egg.trigger === "ACHIEVEMENT") {
  // Parse condition: "accuracy>=95", "streak>=7", "xp>=1000"
  const [metric, op, value] = parseTriggerCondition(egg.triggerValue);
  matched = evaluateCondition(metric, op, Number(value), studentStats);
}
// SECRET_LINK — uses discoverEasterEgg mutation directly (no checkEasterEggs call)
```

**New**: Call `checkEasterEggs` with `triggerType: "ACHIEVEMENT"` after `awardXP` and grade completion pipelines, passing student stats (current XP, streak, last accuracy).

### 3.3 Frontend Changes

**`EasterEggLayer`** — add SCHEDULE polling:
```typescript
// Fetch SCHEDULE eggs, check if current time is in window
// Poll every 60s, trigger discoverEasterEgg when matched
useEffect(() => {
  const scheduleEggs = allEggs.filter(e => e.trigger === 'SCHEDULE' && e.active);
  const interval = setInterval(() => {
    for (const egg of scheduleEggs) {
      const { start, end } = JSON.parse(egg.triggerValue || '{}');
      const now = new Date().toISOString();
      if ((!start || now >= start) && (!end || now <= end)) {
        discoverEasterEgg(studentId, egg.id);
      }
    }
  }, 60000);
  return () => clearInterval(interval);
}, [allEggs, studentId]);
```

**Workbook page** — add SECRET_LINK rendering:
```typescript
// In workbook/[id] page, check if any SECRET_LINK eggs target this unit
// Render a tiny semi-hidden icon (magnifying glass) that triggers discoverEasterEgg on click
```

**ACHIEVEMENT** — no frontend changes needed. Lambda triggers automatically.

### 3.4 Instructor Form

Separate fields with type-conditional UI:

| Field | Purpose |
|-------|---------|
| Type | Select: Keyword / Schedule / Secret Link / Achievement |
| Trigger Value | **Changes based on type** (see below) |
| Reveal Message | What students see when discovered |
| XP Reward | number, default 50 |

**Type-conditional input:**

| Type | Input UI | Description shown to instructor |
|------|----------|--------------------------------|
| KEYWORD | Text field | "Secret word students must type anywhere in the app." |
| SCHEDULE | Date range picker (start + end) | "Active time window. Students who are online during this period discover it automatically." |
| SECRET_LINK | Unit autocomplete (from section assignments) | "Places a hidden icon on this unit's workbook page." |
| ACHIEVEMENT | Metric select + comparator + value | "Triggered automatically when a student reaches this milestone." |

**Achievement metric options**: `accuracy` (last submission), `streak` (current), `xp` (total), `level`, `units_completed`

### 3.4.1 Badge on Discovery

Every easter egg awards a badge when found. The instructor form includes a badge picker (from Phase 6 Badge model) so instructors can assign a specific badge to each egg. If no badge is selected, a default `EASTER_EGG_HUNTER` badge is awarded.

The Lambda's `handleCheckEasterEggs` and `handleDiscoverEasterEgg` already have a `badgeId` field on the EasterEgg model — once badges become a proper model (Phase 6), this wires up naturally.



---

## Phase 4: Boss Battle / Group Challenge Creation

**Goal**: Full CRUD for Group Challenges with proper fields.

### 4.1 Creation Form

| Field | Type | Notes |
|-------|------|-------|
| Title | text | required |
| Target XP (HP) | number | required — total XP the group must earn |
| Deadline | date picker | optional |
| Bonus Multiplier | number | default 1.5 — XP multiplier when completed |
| Narrative Setting | text (multiline) | optional — displayed in CampaignBriefing |
| Stakes | text (multiline) | optional — "what's at risk" flavor text |

### 4.2 Existing Battle Display

Replace current bare list with:
- Title + active/inactive chip
- Progress bar: `currentXP / targetXP` with percentage
- Deadline countdown (if set)
- Top contributors list (from `contributions` array)
- Toggle active/inactive button
- Delete button

### 4.3 Where Challenges Should Be Displayed (Student-Facing)

| Location | What to Show |
|----------|-------------|
| **Student Dashboard** (`pages/index.jsx`) | Active challenges as `BossBattleCard` — already wired |
| **Guild Page** (`pages/guild/[id].jsx`) | Active challenges for the guild's section — add below posts |
| **Section Detail** (`pages/section/[id].jsx`) | For instructors: progress overview of active challenges |

---

## Phase 5: Campaign Chapter Progression (Future)

**Goal**: Give campaigns a visual chapter structure.

Currently, `GroupChallenge` absorbed the Campaign model's narrative fields. The suggested approach:

- Each `GroupChallenge` with `setting`/`stakes` IS a campaign chapter
- Order chapters by creation date or a `chapterOrder` field
- Show a "Campaign Timeline" on the dashboard:
  ```
  Chapter 1: "The Awakening" ✓ (completed)
  Chapter 2: "The Deep Forest" → [progress bar 65%]
  Chapter 3: "The Final Battle" 🔒
  ```
- Requires adding `chapterOrder: a.integer()` to GroupChallenge schema
- Frontend: new `CampaignTimeline` component on the dashboard

---

## Phase 6: Badge System — Custom Badges & Content Locking

**Goal**: Make badges instructor-configurable instead of hardcoded. Add content-lock UI.

### Current State
- 14 badge criteria hardcoded in `BADGE_CRITERIA` array in Lambda
- Visual config in `badgeRegistry.ts` (icon, gradient, shape, rarity)
- Stored as `BadgeEntry` array on `StudentProfile.badges` (JSON)
- No `Badge` model — no instructor CRUD
- `EasterEgg.badgeId` field exists but has no badge to reference
- `Unit.requiredBadgeId` field exists but no UI to configure it

### 6.1 New `Badge` Model

```typescript
Badge: a.model({
  title: a.string().required(),
  description: a.string(),
  icon: a.string(),           // react-icons identifier or emoji
  shape: a.enum(["circle", "hexagon", "shield", "diamond"]),
  rarity: a.enum(["common", "uncommon", "rare", "epic", "legendary"]),
  category: a.string(),       // "core", "streak", "special", custom
  criteria: a.json(),         // Evaluation criteria (see below)
  cohortId: a.string(),       // Section scoping (null = global/system badge)
  autoEvaluate: a.boolean().default(true),  // Lambda checks this automatically
})
```

**Criteria JSON format** (evaluated by Lambda):
```json
{
  "type": "xp_log_count",
  "reason": "PERFECT_SCORE",
  "threshold": 3
}
```
Or:
```json
{
  "type": "stat_threshold",
  "metric": "totalXP",
  "operator": ">=",
  "value": 500
}
```
Or:
```json
{
  "type": "manual"
}
```
(Manual badges are awarded only by instructor action or easter egg discovery.)

### 6.2 Lambda Changes

**Replace `BADGE_CRITERIA` hardcoded array** with a DB query:
```typescript
async function handleCheckBadges(gqlClient, args) {
  // 1. Fetch all Badge records (global + student's cohort)
  // 2. For each with autoEvaluate=true, evaluate criteria against student stats/logs
  // 3. Award if criteria met and not already earned
}
```

**Seed system badges**: On first deploy, create Badge records for the existing 14 hardcoded badges so nothing breaks.

**Easter egg → badge linking**: When `handleDiscoverEasterEgg` fires, if `egg.badgeId` is set, award that Badge directly (skip criteria evaluation).

### 6.3 Instructor Panel — Badge Creation UI with AI Assistant

The badge creation form uses the existing `BadgeIcon` component as a **live preview** and an AI assistant to help instructors design badges.

#### Live Preview

The form renders a `<BadgeIcon config={...} size={96} />` that updates in real-time as the instructor changes fields. This lets them see exactly what students will see.

#### Form Fields

| Field | Type | Maps to `BadgeVisualConfig` |
|-------|------|----------------------------|
| Title | text | `name` |
| Description | text | `description` |
| Shape | visual picker (4 shape thumbnails) | `shape` |
| Rarity | select with color preview | `rarity` |
| Category | select | `category` |
| Icon | icon search/picker (react-icons) | `icon` |
| Background | gradient builder OR color picker | `gradient` / `bgColor` |
| Icon Color | color picker | `iconColor` |
| Animation | select with preview button | `animation` |
| Criteria Type | select: XP Log Count / Stat Threshold / Manual | `criteria.type` |
| Criteria Config | conditional fields (metric, threshold, reason) | `criteria` |

#### AI Badge Designer

"Design with AI" button opens a chat-style input where the instructor describes what they want:

> "A gold shield badge for students who get 100% on 3 assignments in a row"

The AI (via existing `chatStream` Lambda) returns a complete `BadgeVisualConfig` + criteria JSON:

```json
{
  "config": {
    "name": "Triple Crown",
    "description": "Score 100% on 3 consecutive assignments",
    "shape": "shield",
    "rarity": "epic",
    "gradient": { "type": "linear", "angle": "135deg", "stops": [{"color": "#FFD700", "position": "0%"}, {"color": "#B8860B", "position": "100%"}] },
    "iconColor": "#FFFFFF",
    "icon": "FaCrown",
    "animation": "bounce-in",
    "category": "core"
  },
  "criteria": {
    "type": "xp_log_count",
    "reason": "PERFECT_SCORE",
    "threshold": 3
  }
}
```

The preview updates immediately with the AI suggestion. Instructor can accept, tweak individual fields, or describe changes ("make it diamond shaped instead").

#### Implementation

- System prompt includes the `BadgeVisualConfig` type definition, available shapes/rarities/animations, react-icons library names, and the criteria schema
- Uses existing `useChat` hook pointed at a badge-designer system prompt
- Tool call: `generate_badge_config` returns structured JSON (parsed into form state)
- The AI response populates form fields — instructor has full override on every field
- "Award Manually" button for manual badges — picks students from section roster

#### Existing Components Leveraged

| Component | Usage |
|-----------|-------|
| `BadgeIcon` | Live preview with `config` prop override |
| `BadgeCoinFlip` | "Preview Award" animation — shows what the student will see |
| `badgeRegistry` | Source of shape/rarity/animation constants for the form pickers |
| `GamificationToastLayer` | Preview the toast notification |

### 6.4 Content-Lock Configuration UI

Add a "Requirements" section to the Unit editor or Assignment form:

| Field | Type | Notes |
|-------|------|-------|
| Required XP | number (optional) | Student must have ≥ this XP to access |
| Required Badge | Badge autocomplete (optional) | Student must have earned this badge |
| Required Module | Unit autocomplete (optional) | Student must have completed this unit |

These map to existing schema fields: `Unit.requiredXP`, `Unit.requiredBadgeId`, `Unit.requiredModuleCompletion`.

The `ContentLockCard` component and `useContentLock()` hook already exist — they just need the instructor UI to set the values.

### 6.5 Badge ↔ Easter Egg Integration

In the Easter Egg form (Phase 3), add a badge picker field:
- Instructor selects which badge to award when this egg is discovered
- Maps to existing `EasterEgg.badgeId` field
- On discovery, Lambda awards the badge directly (no criteria check)

---

## Missing Features (Not Yet Planned)

Features that exist in other gamification systems but are absent here:

| Feature | Impact | Effort |
|---------|--------|--------|
| **XP History Page** | Students can't review their earning history | Low — data exists, needs a page |
| **Notification Center** | Toasts are ephemeral, no persistent record | Medium |
| **Daily/Weekly Personal Quests** | No recurring engagement hooks beyond streaks | High — new model + evaluation logic |
| **Recent XP Feed on Dashboard** | `AnimatedXPCounter` exists but unused | Low |
| **Unlock Roadmap/Preview** | Students can't see future unlocks | Low — UI only |
| **Campaign Chapter Progression UI** | Narrative system has no visual tracker | Medium |
| **Side-by-Side Student Comparison** | Can view profiles but can't compare | Low |
| **Privacy Controls for Profiles** | No "make my profile private" option | Low |
| **Completed Challenges Display** | `completedChallenges` never rendered | Low |
| **Lock Management UI for Instructors** | Content locking is code-configured only | Medium |

### Priority Recommendations

**Quick wins** (build immediately after panel improvements):
1. XP history page/tab on profile
2. Recent XP feed on dashboard (AnimatedXPCounter is ready)
3. Completed challenges section on dashboard
4. Unlock roadmap (show what each level unlocks)

**Medium term**:
5. Campaign chapter timeline UI
6. Challenge display on guild page
7. Notification center with history

**Long term**:
8. Daily/weekly personal quest system
9. Instructor lock management UI
10. Privacy controls

---

## Implementation Order

```
Phase 1: Section scoping + copy           → Foundation for all other work
Phase 2: Skill tree (schema + Lambda + UI) → Biggest functional gap
Phase 3: Easter egg redesign (schema + Lambda + EasterEggLayer + form) → Makes all types work automatically
Phase 4: Boss battle creation              → Completes instructor CRUD
Phase 5: Campaign chapters                 → Future enhancement
Phase 6: Badge system (model + Lambda + CRUD + content locking UI) → Makes badges configurable
Quick wins: XP history, feed, roadmap      → Polish after core is done
```

Note: Phase 3 depends on Phase 6 for the badge picker (easter eggs award badges on discovery). Implement Phase 6 before or alongside Phase 3.

---

## Files Affected (Summary)

| File | Changes |
|------|---------|
| `amplify/data/resource.ts` | Add `unitIds`, `minimumAccuracy` to Skill; add `evaluateSkillsForUnit` mutation; change EasterEgg trigger enum to `KEYWORD/SCHEDULE/SECRET_LINK/ACHIEVEMENT`; add `cohortId` to EasterEgg; new `Badge` model; optionally add `chapterOrder` to GroupChallenge |
| `amplify/functions/gamification/handler.ts` | Add `handleEvaluateSkillsForUnit`; update `generateSkillTree` to set `unitIds`; rewrite `handleCheckEasterEggs` for new trigger types; add ACHIEVEMENT evaluation after `awardXP` pipeline |
| `src/context/unitContext.jsx` | Call `evaluateSkillsForUnit` after unit completion |
| `src/components/Gamification/EasterEggLayer.tsx` | Add SCHEDULE polling; fetch all active eggs (not just KEYWORD) |
| `src/components/Gamification/EasterEggTrigger.tsx` | Remove `useEasterEggTime`/`useEasterEggRapidClick` (unused); add `SecretLinkIcon` component |
| `src/components/Gamification/InstructorGamificationPanel.tsx` | Rewrite all form sections (skills, easter eggs, boss battles) |
| `pages/instructor/gamification.jsx` | Section selector, new callbacks, unit/assignment data, copy logic |
| `pages/workbook/[id].jsx` | Render SECRET_LINK hidden icons for eggs targeting this unit |
| `pages/guild/[id].jsx` | Add active challenges section (instructor + member view) |
| `pages/section/[id].jsx` | Add challenge progress for instructors |

---

_Created: May 2026_
