# Learner Dashboard UX Improvement Plan

## Problem Statement

The learner dashboard suffers from **information overload without structure**. Assignments from multiple sections are dumped into a single flat list, gamification features (campaign timeline, nailed-it cards, boss battles) float at the bottom with no connection to the content they relate to, and the narrative system—while technically capable—is invisible from the places where teachers and students actually work.

### Core Issues

1. **No section grouping** — Assignments from all enrolled sections appear in one flat pending/completed split
2. **Campaign timeline is orphaned** — It sits at the bottom with no connection to which assignments unlock which chapters
3. **"Nailed It" wall is decontextualized** — Mastery moments have no link to the section or unit they came from
4. **No clear "next step" callout** — Students must scan the entire list to figure out what to do
5. **Narratives are invisible** — `CampaignBriefing` and `NarrativeReader` exist but aren't exposed in workbook, unit editor, or section detail views
6. **Gamification config is buried** — `/admin/settings` is disconnected from the section editing workflow; no contextual access from section detail or unit editor
7. **Accessibility gaps** — Flat lists with no landmarks, no skip navigation, cognitive overload for students with executive function challenges

---

## Design Principles

- **Section is the primary grouping unit** — Everything the student sees should be scoped to a section context
- **One clear next action** — The most important thing should be unmistakable
- **Progressive disclosure** — Show summary first, drill into detail on demand
- **Narrative as connective tissue** — Campaign/chapter text provides the "why" for each assignment
- **Configuration in context** — Teachers should configure gamification where they're already working
- **WCAG 2.1 AA minimum** — Landmark regions, focus management, reduced motion support, screen reader announcements

---

## Phase 1: Section-Grouped Dashboard (High Impact, Foundation)

### 1.1 Replace flat list with section accordion/tabs

**Current**: One `<Stack>` of all pending assignments, then all completed assignments.

**Proposed**: Each enrolled section becomes a collapsible panel (or tab) containing:
```
┌─────────────────────────────────────────────────┐
│ 📚 Section: "Spanish 101 - Fall 2026"           │
│    Instructor: Prof. García                     │
│    ▸ 3 pending · 5 completed · Level 4          │
├─────────────────────────────────────────────────┤
│ ⭐ UP NEXT (highlighted, single card)           │
│    "Chapter 3: Verb Conjugation" — Due Wed      │
│                                                 │
│ 📋 Remaining (collapsed by default)             │
│    • Assignment 4 — Due Fri                     │
│    • Assignment 5 — Locked (complete Ch 3 first)│
│                                                 │
│ ✅ Completed (collapsed)                        │
│    • Assignment 1 — 92% · Nailed It! 🎯        │
│    • Assignment 2 — 78%                         │
│                                                 │
│ 🏰 Campaign Progress (inline mini-timeline)    │
│    Ch1 ●─── Ch2 ●─── Ch3 ◐─── Ch4 ○           │
└─────────────────────────────────────────────────┘
```

**Implementation**:
- Group `assignments` by `sectionID` in the page component
- Render each section group as an `<Accordion>` (MUI) with `defaultExpanded` for the section with the nearest due date
- Within each section, sort assignments by due date with content-lock ordering
- Add `aria-label` per section, use `role="region"` landmarks

### 1.2 "Up Next" hero card per section

- Identify the single most urgent assignment per section (nearest due date, not locked, not completed)
- Render as a visually distinct card at the top of each section group
- Include: title, due date, brief narrative context (from campaign chapter if linked), estimated time, action button
- Use `aria-live="polite"` for dynamic updates
- Add a global "Your Next Step" banner at the very top of the dashboard showing the most urgent across ALL sections

### 1.3 Inline "Nailed It" badges on completed cards

- Instead of a separate "Nailed It Wall" at the bottom, show a small badge/chip directly on the completed assignment card that earned it
- Keep the full wall as an expandable section within each section group (or as a modal/drawer triggered from the badge)

**Files to modify**:
- `app/[locale]/page.jsx` — Restructure the render section
- New: `src/components/Dashboard/SectionPanel.tsx` — Extracted section accordion component
- New: `src/components/Dashboard/UpNextCard.tsx` — Hero "next step" card
- New: `src/components/Dashboard/AssignmentCard.tsx` — Refactored from inline JSX

---

## Phase 2: Scoped XP & Campaign↔Unit Linking (Medium Effort, Critical Correctness)

### 2.1 Add `linkedUnitIds` to GroupChallenge

**Current data gap**: `GroupChallenge` has `cohortId` and `targetXP` but no way to scope which units contribute XP to that chapter. Currently ALL XP in a section flows into ALL active challenges equally.

**Schema change** (requires permission):
```typescript
// In amplify/data/resource.ts — GroupChallenge model
linkedUnitIds: a.string().array(), // Unit IDs whose XP contributes to this chapter
```

- Additive nullable field — no migration needed
- Follows existing patterns (`contributions: a.ref(...).array()`)
- When empty/null: legacy behavior (all XP contributes) for backward compatibility

### 2.2 Scope challenge XP crediting to linked units

**Current behavior** (`amplify/functions/leaderboardStream/handler.ts`):
- Queries ALL active challenges for the cohort
- Credits the entire XP batch to every active challenge regardless of source unit

**New behavior**:
- When `challenge.linkedUnitIds` is non-empty, only credit XP from `StudentXPLog` records whose `unitID` is in that array
- When `linkedUnitIds` is null/empty, retain current behavior (all XP contributes)
- The `unitID` field already exists on `StudentXPLog` — no additional schema change needed

```typescript
// leaderboardStream handler — challenge rollup section
for (const challenge of activeChallenges) {
  let creditableXP = totalDelta; // default: all XP

  if (challenge.linkedUnitIds?.length > 0) {
    // Only credit XP from logs whose unitID matches a linked unit
    creditableXP = xpLogs
      .filter(log => challenge.linkedUnitIds.includes(log.unitID))
      .reduce((sum, log) => sum + log.xpAmount, 0);
  }

  if (creditableXP <= 0) continue; // Nothing to credit

  const newChallengeXP = (challenge.currentXP || 0) + creditableXP;
  // ... rest of existing logic
}
```

### 2.3 Chapter Goal Feasibility Calculator (Instructor UX)

When an instructor sets `targetXP` for a chapter, show a real-time feasibility breakdown:

```
┌─────────────────────────────────────────────────────────────┐
│ Chapter 3: "The Dragon's Lair"                              │
│ Target: 200 XP    Linked Units: Unit 5, Unit 6             │
├─────────────────────────────────────────────────────────────┤
│ XP Budget Breakdown (per student):                          │
│                                                             │
│ ✅ One-time XP (guaranteed if completed):                   │
│    • HOMEWORK_SUBMITTED × 2 units      = 100 XP            │
│    • ALL_BLOCKS_COMPLETED × 2 units    = 150 XP            │
│    • ON_TIME_SUBMISSION × 2 units      = 30 XP             │
│    Subtotal: 280 XP (exceeds target ✓)                     │
│                                                             │
│ 🔄 Repeatable XP (drills, diminishing returns):             │
│    • 1st drill session/day: 30 XP                          │
│    • 2nd: 15 XP, 3rd: 7 XP, 4th+: 5 XP/each              │
│                                                             │
│ 🎯 Verdict: Students can complete this chapter by           │
│    finishing both units without any drills.                  │
│                                                             │
│ ⚠️  If target were 400 XP: Students would need ~4 drill     │
│    sessions beyond unit completion.                          │
└─────────────────────────────────────────────────────────────┘
```

**Calculation logic** (new utility: `src/utils/chapterFeasibility.ts`):

```typescript
interface FeasibilityResult {
  oneTimeXP: number;           // Max XP from completing linked units once
  oneTimeBreakdown: { reason: string; amount: number; count: number }[];
  drillsNeeded: number;        // Extra drill sessions needed beyond one-time
  drillDaysNeeded: number;     // Days of drilling (accounting for diminishing returns)
  achievable: boolean;         // Can it be completed with one-time XP alone?
  warning: string | null;      // Human-readable concern
}

function calculateFeasibility(
  targetXP: number,
  linkedUnitCount: number,
  multipliers: XPMultipliers,  // Section XP tuner config
): FeasibilityResult
```

**One-time XP per unit** (assuming all possible awards):
| Reason | Base | Notes |
|--------|------|-------|
| `HOMEWORK_SUBMITTED` | 50 | Once per unit |
| `ALL_BLOCKS_COMPLETED` | 75 | Once per unit (all blocks done) |
| `ON_TIME_SUBMISSION` | 15 | Once per unit (if before deadline) |
| `PERFECT_SCORE` | 100 | Once per unit (if 100% accuracy) |
| `NAILED_IT` | 20 | Per graded block (variable, ~3-8 per unit) |
| `PERSONAL_BEST` | 25 | Once per unit |

**Conservative estimate**: ~140 XP/unit (homework + all blocks + on-time)
**Optimistic estimate**: ~290 XP/unit (all bonuses including perfect score + nailed-its)

**Drill XP per day** (diminishing returns): 30 + 15 + 7 + 5×N sessions

**Instructor warnings**:
- `targetXP > oneTimeMax`: "Students will need drill practice beyond completing the assignments"
- `targetXP > oneTimeMax + 7_days_drilling`: "This goal may take over a week of daily practice — consider lowering the target or adding more linked units"
- `linkedUnitIds` is empty: "No units linked — all section XP contributes (legacy mode)"

### 2.4 Inline campaign briefing per section

- Move `CampaignBriefing` from the bottom of the page to the **top of each section panel** (collapsed by default, with a teaser line)
- Show the active chapter's narrative text as context for the current assignments
- Use `NarrativeReader` to render rich Lexical content inline

### 2.5 Campaign timeline moved inside section context

- Remove the global `CampaignTimeline` from the bottom
- Place a compact inline version at the top of each section's assignment list
- Each chapter node shows its linked units as a tooltip/popover
- Active chapter is highlighted and expanded

**Files to modify**:
- `amplify/data/resource.ts` — Add `linkedUnitIds` to GroupChallenge (with permission)
- `amplify/functions/leaderboardStream/handler.ts` — Add unit-scoped challenge crediting
- New: `src/utils/chapterFeasibility.ts` — Feasibility calculation utility
- `src/components/Gamification/InstructorGamificationPanel.tsx` — Unit linking multi-select + feasibility display
- `src/components/Gamification/CampaignTimeline.tsx` — Add compact variant prop
- `src/components/Gamification/CampaignBriefing.tsx` — Add collapsed/teaser mode
- `app/[locale]/page.jsx` — Move campaign components into section panels

---

## Phase 3: Surface Narratives in Workbook & Editor (Medium Effort, High Discoverability)

### 3.1 Narrative context banner in Workbook view

**Current**: `app/[locale]/workbook/[id]/WorkbookClient.tsx` shows the unit content with no campaign/narrative context.

**Proposed**: Add a collapsible "Story So Far" banner at the top of the workbook:
```
┌─────────────────────────────────────────────────┐
│ 📖 Chapter 3: The Dragon's Lair                 │
│ "The ancient texts reveal the conjugation       │
│  patterns needed to unlock the sealed door..."  │
│                                     [Collapse ▲]│
└─────────────────────────────────────────────────┘
```

- Query the `GroupChallenge` whose `linkedUnitIds` includes the current unit
- Render via `CampaignBriefing` in compact mode
- Respect user preference (remember collapsed state in localStorage)

### 3.2 Narrative preview in Unit Editor (instructor side)

**Current**: The unit editor (`pages/units/[id].jsx` or app router equivalent) has no visibility into how a unit fits into campaign narratives.

**Proposed**: Add a sidebar widget "Campaign Context" showing:
- Which campaign chapters reference this unit
- The narrative text that will appear to students
- Quick link to edit the campaign chapter
- Warning if the unit has no campaign context ("Students won't see narrative framing for this content")

### 3.3 Campaign/narrative column in Section Detail view

**Current**: Section detail page shows assignments in a table with grades.

**Proposed**: Add a "Chapter" column to the assignment table showing which campaign chapter each assignment belongs to. Clicking opens a drawer with the full narrative + timeline position.

**Files to create/modify**:
- New: `src/components/Workbook/NarrativeContextBanner.tsx`
- `app/[locale]/workbook/[id]/WorkbookClient.tsx` — Add banner
- New: `src/components/Editor/CampaignContextWidget.tsx`
- `app/[locale]/section/[id]/page.jsx` — Add chapter column

---

## Phase 4: Contextual Gamification Configuration (Reduce Instructor Friction)

### 4.1 Inline gamification config from Section Detail

**Current**: Instructor must navigate to `/admin/settings`, select a section from a dropdown, then configure.

**Proposed**: Add a "⚙ Gamification" tab or button directly on the section detail page (`/section/[id]`) that opens a focused panel with:
- Campaign chapter editor (scoped to this section)
- Content lock rules for this section's assignments
- XP multiplier for this section
- Quick badge creation

This replaces the need to context-switch to the global admin page for common tasks.

### 4.2 Quick-config from Unit Editor

When editing a unit, show a small panel:
- "Add to campaign chapter" dropdown
- "Set content lock" (prerequisite, XP requirement)
- "Preview student narrative"

### 4.3 Gamification setup wizard for new sections

When an instructor creates a new section:
1. Prompt: "Would you like to add a campaign narrative?" (optional)
2. If yes: AI generates a starter narrative based on the section name and assigned units
3. Auto-creates chapter structure linked to the assignments
4. Shows preview of what students will see

### 4.4 Section settings inline link

On the section detail page, add a prominent "Customize Learning Path" button that opens the section-specific gamification settings in a drawer/dialog rather than navigating away.

**Files to create/modify**:
- New: `src/components/Section/GamificationQuickPanel.tsx` — Focused per-section config
- `app/[locale]/section/[id]/page.jsx` — Add tab/button
- New: `src/components/Gamification/CampaignSetupWizard.tsx` — New section wizard
- `src/components/Gamification/InstructorGamificationPanel.tsx` — Refactor into composable sub-panels

---

## Phase 5: Accessibility & Cognitive Load Reduction

### 5.1 Landmark regions and skip navigation

- Add `<nav aria-label="Section navigation">` around section tabs/accordion headers
- Add `<main aria-label="Dashboard content">`
- Add skip link: "Skip to your next assignment"
- Each section panel: `<section aria-labelledby="section-{id}-heading">`

### 5.2 Reduced motion mode

- Campaign timeline animations, XP toasts, streak glow → respect `prefers-reduced-motion` ✅
- Provide static alternatives for all animated indicators ✅ (AnimatedXPCounter snaps to value, ContentUnlockAnimation skips to done state)
- Boss battle card phase transitions: use fade instead of slide when reduced motion enabled
- Level-up + chapter-unlock celebrations skip confetti, use instant transitions ✅
- All celebration/animation components use `useReducedMotion()` hook which checks OS + app setting ✅

### 5.3 Focus management

- When a section accordion expands, move focus to the "Up Next" card
- After completing an assignment and returning to dashboard, announce "Assignment completed. Your next step is..."
- Dialog/drawer focus trapping for gamification config panels

### 5.4 Cognitive scaffolding

- **Progress summary sentence**: "You've completed 3 of 8 assignments in Spanish 101. Next: Chapter 3 verb practice, due Wednesday."
- **Color + icon + text** for all status indicators (never color alone)
- **Consistent card structure**: Every assignment card has the same visual hierarchy regardless of state
- **Estimated time** on each assignment (from unit metadata or AI estimate)
- **Difficulty indicator** using a simple 1-3 dot scale

### 5.5 Screen reader announcements

- `aria-live` region for XP gains, level ups, streak updates
- Meaningful alt text for avatar, badges, campaign timeline nodes
- Campaign timeline: provide text alternative "Chapter 3 of 5: In progress, 60% complete"

---

## Phase 6: Polish & Delight

### 6.1 Personalized greeting with context

Replace generic "Welcome back" with:
- "Welcome back, [Name]. You're on a 5-day streak! 🔥 Your next step: finish the verb practice in Spanish 101."

### 6.2 Section-aware empty states

When a section has no pending assignments:
- "All caught up in Spanish 101! Check your grades or explore practice drills."
- Show relevant completed work + nailed-it moments

### 6.3 Smart ordering

- Sections ordered by: most urgent due date first, then most recently active
- Within section: locked items at bottom (grayed), urgent items highlighted
- Completed items collapsed by default with expandable "View completed (5)"

### 6.4 Transition micro-animations

- Card completion: satisfying check animation (respects reduced-motion) — **not yet implemented**
- Chapter unlock: brief celebration with narrative reveal — **Done** (`ChapterUnlockCelebration.tsx`, respects `useReducedMotion`)
- Level up: full-screen celebration (dismissible, skippable) — **Done** (`LevelUpCelebration.tsx`, respects `useReducedMotion`)

---

## Implementation Priority

| Phase | Effort | Impact | Accessibility Gain | Priority |
|-------|--------|--------|-------------------|----------|
| 1 (Section grouping) | Medium | Very High | High (landmarks, reduced cognitive load) | **P0** |
| 2 (Campaign↔content linking) | Medium | High | Medium (narrative context aids comprehension) | **P1** |
| 5 (Accessibility) | Low-Medium | Very High | Very High | **P0** (parallel with Phase 1) |
| 4 (Contextual config) | Medium | High | Low (instructor-facing) | **P1** |
| 3 (Narrative in workbook/editor) | Low | Medium | Medium | **P2** |
| 6 (Polish) | Low | Medium | Low | **P3** |

---

## Data Model Changes Required

1. **GroupChallenge** — Add `linkedUnitIds: a.string().array()`
   - Defines which units' XP contributes to this chapter's progress
   - When null/empty: legacy behavior (all section XP contributes)
   - When populated: only XP from `StudentXPLog` records with matching `unitID` advances the chapter
   - The `StudentXPLog.unitID` field already exists — no additional schema change for tracking
   - The `unlockContentId: a.id()` field already handles "what unlocks when complete"
   - Additive nullable field, no migration needed

2. **No `linkedAssignmentIds` needed** — Assignments already have `unitID` + `sectionID`, and challenges have `cohortId` (= sectionID). The dashboard can derive "which assignments belong to which chapter" by matching `assignment.unitID ∈ challenge.linkedUnitIds`.

3. **Unit** — Consider `estimatedMinutes: a.integer()` for time estimates on cards (optional, low priority)

---

## Backend Change Required

**`amplify/functions/leaderboardStream/handler.ts`** — Challenge XP crediting:
- Current: credits ALL XP to ALL active challenges in the cohort
- New: when `challenge.linkedUnitIds` is populated, filter XP records by `unitID` membership before crediting
- Backward-compatible: empty `linkedUnitIds` retains current behavior

---

## Migration Strategy

- Phase 1 requires **no schema changes** — pure frontend restructuring
- Phase 2 schema change is one additive nullable field (`linkedUnitIds`) — no migration needed
- Phase 2 backend change (leaderboard stream) is backward-compatible: empty `linkedUnitIds` = current behavior
- Existing challenges continue working unchanged until instructor opts in by linking units
- Instructor feasibility calculator works immediately — reads XP constants + multiplier config
- Instructor wizard (Phase 4.3) can auto-suggest `linkedUnitIds` based on assignment order

---

## Success Metrics

- **Task completion time**: Time from dashboard load to starting the correct next assignment (target: <5 seconds)
- **Cognitive load survey**: SUS score improvement (target: +15 points)
- **Accessibility audit**: Zero WCAG 2.1 AA violations in dashboard components
- **Instructor config time**: Time to set up campaign for a section (target: <3 minutes with wizard)
- **Student comprehension**: "I understand what I need to do next" survey (target: >90% agreement)
- **Screen reader usability**: Complete dashboard navigation and start assignment via screen reader in <60 seconds
