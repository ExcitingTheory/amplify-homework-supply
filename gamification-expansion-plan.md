# Gamification Expansion Plan — Homework Supply
> Grounded in the existing XP ledger, leaderboards, badges, Nailed It, and peer review rooms.  
> Designed for a team without a dedicated art department — every mechanic is achievable with code + MUI + data visualization.

---

## 🗺️ What We Already Have (Baseline)

| Feature | Implementation |
|---|---|
| XP / Points | Immutable `StudentXPLog` ledger |
| Leaderboards | Denormalized `LeaderboardEntry` cache rebuilt by Lambda |
| Badges | Awarded on XP/event thresholds |
| Nailed It | JSON envelope detection (~10% rate), celebration component |
| Peer Review | Chat rooms with invite functionality |
| AI Memory | Per-student markdown stored in DB, async OpenAI update |
| Workbooks | Real-time collaborative editing via GraphQL subscriptions |

---

## 🧭 Planning Tiers

Features are grouped into three implementation tiers based on complexity and art dependency.

---

## TIER 1 — High Impact, Low Lift (no art required)

### 1. Engagement Streaks
**What:** Track consecutive days/weeks a student submits work or logs in.  
**Why it works:** Streaks create loss aversion. Breaking a streak hurts more than gaining XP feels good — this drives consistent return visits.  
**No art needed:** A flame icon (MUI SvgIcon or emoji) + number is sufficient. Duolingo proves this format.

**Schema addition:**
```graphql
type StudentStreak @model {
  studentId: ID! @index
  currentStreak: Int!
  longestStreak: Int!
  lastActivityDate: AWSDate!
  freezesRemaining: Int!   # "streak shield" mechanic, see below
}
```

**Mechanics to layer in:**
- **Streak Shield / Freeze:** Award 1 freeze per 7-day streak. Students can "use" it once to survive a missed day without losing the streak. Adds a meta-game around protecting streaks.
- **Streak Milestones:** At 7, 14, 30 days award bonus XP and a badge. The 30-day badge should feel rare.
- **Comeback Mechanic:** If a student returns after >7 days of inactivity, award "Comeback Kid" XP + badge. This catches lapsed students before they churn fully.

---

### 2. Progress Bars & Completion Rings
**What:** Visual representations of long-arc progress — per-module, per-skill-area, overall course.  
**Why it works:** A bar at 94% is more motivating than knowing you have 2 assignments left. The visual gap does the work.  
**No art needed:** MUI `LinearProgress` + circular SVG for rings.

**Implementation plan:**
- `StudentProgress` model: aggregates completion % per module from workbook submissions
- Dashboard widget: "Your Course Map" showing 3–5 progress rings (e.g. Foundations, Applied Projects, Peer Review, Bonus Content)
- Milestone markers on bars: at 25%, 50%, 75% a small star unlocks and plays a micro-animation
- Lambda recomputes after each submission, pushes via AppSync subscription so bars update live

---

### 3. Personal Best Tracking
**What:** Track a student's own historical best scores per workbook type, not just rank vs peers.  
**Why it works:** Intrinsic motivation. Competing against yourself is psychologically healthier than always comparing to peers, especially for students who are solidly mid-leaderboard.

**Schema:**
```graphql
type StudentPersonalBest @model {
  studentId: ID! @index
  workbookTypeId: ID! @index
  bestScore: Float!
  achievedAt: AWSDateTime!
  previousBest: Float
}
```

**UI:** On workbook completion, if a PB is broken: animate a "New Personal Best 🏆" banner (similar to Nailed It flow). Extend the JSON envelope from OpenAI to include a `personal_best` flag.

---

### 4. Unlockable Content (Mastery Gates)
**What:** Lock bonus workbooks, deep-dive readings, or "expert challenge" problems behind XP or badge prerequisites.  
**Why it works:** Creates meaningful goals beyond just "finish the assignment." Also mirrors professional credentialing — you have to prove basics before advanced access.  
**No art needed:** A locked card state in MUI with a padlock icon + "Requires: X badge or Y XP" label.

**Schema addition:**
```graphql
type ContentLock @model {
  contentId: ID! @index
  requiredXP: Int
  requiredBadgeId: ID
  requiredModuleCompletion: Float   # 0.0–1.0
}
```

**Implementation:** At query time, join `ContentLock` against student's current XP + badges. Return `isLocked: Boolean` + `lockReason: String` on the workbook/content type. Client renders locked vs unlocked state. No separate "unlock" action needed — it's continuous.

---

### 5. Micro-Interaction Layer
**What:** Intentional motion feedback on high-value moments — XP gain, badge award, streak update, leaderboard rank change.  
**Why it works:** Small sensory confirmations train the brain to associate actions with reward. The "Nailed It" component already proves this pattern works.  
**No art needed:** CSS animations + Framer Motion + emoji/icon sets.

**Expansion checklist:**
- [ ] Animated XP counter: number ticks up like a slot machine when XP is awarded
- [ ] Rank change toast: "+3 positions on leaderboard 🚀" with slide-in animation
- [ ] Streak increment: flame grows briefly on streak update
- [ ] Badge awarded: coin-flip reveal animation (CSS 3D transform, no images needed)
- [ ] Locked content unlocking: padlock opens with a click animation + shimmer effect
- [ ] Personal best: burst of stars radiating from the score

All can be driven by AppSync subscription events already in place.

---

## TIER 2 — Medium Lift (text-based or data-viz art)

### 6. Skill Tree / Learning Pathway Map
**What:** A visual DAG (directed acyclic graph) of curriculum topics. Students see which skills unlock which next skills. They can see exactly what they're building toward.  
**Why it works:** Autonomy is a core self-determination theory driver. Seeing the whole map makes students feel in control of their journey.  
**No art needed:** Use **React Flow** (already OSS, MIT license). Nodes are MUI Cards. Edges are SVG paths. No sprites or illustrations required.

**Implementation plan:**
1. `Skill` model: `id`, `title`, `description`, `prerequisites: [SkillID]`, `xpReward`
2. `StudentSkillProgress` model: `studentId`, `skillId`, `status: LOCKED | AVAILABLE | IN_PROGRESS | MASTERED`
3. React Flow renders the graph. Node color = status (MUI palette: grey/blue/amber/green)
4. Clicking a node opens a side drawer with: description, prerequisites, linked workbooks, current progress bar
5. Admin panel to define the skill tree (drag-and-drop in React Flow, save to GraphQL)

**Cohort-specific trees:** Different cohorts can have different skill trees. The `Cohort` → `SkillTree` relationship already makes sense given the existing data model.

---

### 7. Guilds / Study Squads
**What:** Persistent small teams (3–5 students) within a cohort. Guild XP is the sum of member XP. Guild leaderboard sits alongside the individual one.  
**Why it works:** Cooperative goals activate different motivation than competition. Students pull each other along. Peer accountability without the platform having to enforce it.  
**No art needed:** A guild "crest" can be generated from the guild name initials in a styled MUI Avatar with a unique color derived from the guild ID hash.

**Schema:**
```graphql
type Guild @model {
  id: ID!
  name: String!
  cohortId: ID! @index
  members: [GuildMembership] @hasMany
  totalXP: Int!               # denormalized, rebuilt by Lambda
  description: String
  createdAt: AWSDateTime!
}

type GuildMembership @model {
  guildId: ID! @index
  studentId: ID! @index
  role: GuildRole!            # LEADER | MEMBER
  joinedAt: AWSDateTime!
}
```

**Mechanics:**
- Guild formation: students invite peers during cohort onboarding week
- Guild XP Lambda: triggered on `StudentXPLog` write, adds to `Guild.totalXP`
- Guild leaderboard: same `LeaderboardEntry` pattern, `scope: GUILD`
- Guild chat: extend existing peer review chat room model with `guildId` scope
- **Guild challenges:** Time-boxed co-op tasks (see Tier 3 boss battles lite version)

---

### 8. Narrative Wrapper (AI-Generated, Text-Only)
**What:** A lightweight story frame around the curriculum. No illustrations needed — pure text, generated by OpenAI, seeded per cohort.  
**Why it works:** Context transforms tasks. "Debug this API" is chore. "The server is failing and users are counting on you — fix it before launch" is a mission. Same task, 10x more engaging.  
**No art needed:** This is literally just text rendered in the UI. Use a distinct font/style to visually separate narrative from instructional content.

**Implementation plan:**
1. Each cohort gets a **Campaign** (story arc): setting, stakes, overarching goal. Instructor sets this at cohort creation.
2. Each module gets a **Chapter Brief**: 2–3 sentences of flavor text generated by OpenAI at module creation time, given the campaign context.
3. Each workbook gets a **Mission Briefing**: 1–2 sentences framing the assignment within the story. Generated async, stored on the `Workbook` model.
4. On "Nailed It" moments, OpenAI adds a story-progress line: "The system comes back online. The team breathes again."

**Schema addition:**
```graphql
type Campaign @model {
  id: ID!
  cohortId: ID! @index
  title: String!
  setting: String!
  stakes: String!
  systemPromptSeed: String!   # fed to OpenAI for narrative consistency
}
```

**Cost control:** Generate narrative text once at content-creation time, store it. Don't re-generate per student view. Zero per-student API cost.

---

### 9. Easter Eggs & Hidden Challenges
**What:** Secret bonus workbooks or XP triggers hidden in content — a specific keyword in a submission, clicking a hidden element in the UI, submitting unusually early, etc.  
**Why it works:** Intermittent variable rewards (the psychology behind slot machines) spike curiosity and exploration. Students talk about Easter eggs, which builds community.  
**No art needed:** A "Secret Unlocked 🔍" toast + small XP award is all that's needed visually.

**Implementation plan:**
- `EasterEgg` model: `trigger: KEYWORD | UI_INTERACTION | TIME_BASED | SUBMISSION_QUALITY`, `triggerValue: String`, `xpReward`, `badgeId?`, `revealMessage`
- Keyword trigger: Lambda on workbook submission scans for trigger word/phrase
- Time-based: submitting before a certain hour, or on a specific date
- Quality trigger: AI returns a score above threshold → triggers egg
- UI interaction: hidden clickable element (e.g., a tiny icon in the course map) — purely front-end, fires a GraphQL mutation

Keep the list of eggs secret. Let discovery be organic. Instructors can see the full list in the admin panel.

---

## TIER 3 — Larger Lift (worth planning now, build later)

### 10. Boss Battles / Group Challenges
**What:** A special event-type assignment where an entire guild or cohort works together to "defeat" a challenge by collectively accumulating a shared score.  
**Why it works:** Creates synchronized effort and shared triumph. The shared progress bar is a powerful social motivator — no one wants to be the person who didn't contribute.

**Lite version (Tier 2 effort):**
- A `GroupChallenge` has a `targetXP` goal (the "boss HP")
- Each member's submission XP contributes to a shared pool
- A live progress bar shows collective progress toward the goal
- If goal is met before deadline: every member gets a bonus XP multiplier + "Guild Conqueror" badge
- No RPG art needed — frame it as "the final project sprint" with a countdown timer

**Full version (Tier 3):**
- Narrative-integrated boss encounters per campaign chapter
- Role-based contributions: some students answer core questions, others write tests, others do code review — each role contribution unlocks a different "phase" of the boss fight
- Instructor can set boss parameters in admin panel

---

### 11. Lightweight Avatar / Identity System
**What:** A customizable student identity that visually evolves with progress.  
**Why:** Students who feel personally represented in a system are more invested in it.  
**Without an art team:** Use a code-generated avatar system.

**Feasible approach — CSS/SVG avatar builder:**
- Use **DiceBear** (open source, MIT, generates SVG avatars from a seed string) — zero art assets needed
- Avatar "style" unlocks at XP milestones: change from basic to more elaborate DiceBear style sets
- Students pick a name/handle and color scheme; DiceBear generates a consistent avatar from those params
- Avatar appears on leaderboard, guild page, peer review chat, profile

**XP-gated cosmetics (no art):**
- Custom color themes for their workbook editor
- Flair text next to their name ("⚡ 30-Day Streak", "🏆 Guild Leader")
- Emoji badges displayed on profile (unlocked, no images)

---

## 🗃️ Data Model Summary (New Additions)

```graphql
# Streaks
type StudentStreak @model { ... }

# Content gating  
type ContentLock @model { ... }

# Skill tree
type Skill @model { ... }
type StudentSkillProgress @model { ... }
type SkillTree @model { cohortId, rootSkillIds }

# Guilds
type Guild @model { ... }
type GuildMembership @model { ... }

# Narrative
type Campaign @model { ... }

# Easter eggs
type EasterEgg @model { ... }
type EasterEggDiscovery @model { studentId, eggId, discoveredAt }

# Group challenges
type GroupChallenge @model { ... }
type GroupChallengeContribution @model { ... }

# Personal bests
type StudentPersonalBest @model { ... }
```

---

## 🚦 Recommended Implementation Order

| Phase | Features | Rationale |
|---|---|---|
| **Phase A** (now) | Streaks + Freeze, Progress Bars, Personal Best | Highest behavioral impact, lowest complexity. Pure data + MUI. |
| **Phase B** | Micro-interaction layer, Unlockable Content, Easter Eggs | Deepens existing mechanics, no new schema dependencies. |
| **Phase C** | Skill Tree (React Flow), Narrative Wrapper, Guilds | Medium lift, needs schema work + instructor tooling. |
| **Phase D** | Boss Battles, Avatar System (DiceBear) | Social events + identity. Build after Guilds are established. |

---

## ⚠️ Anti-Patterns to Avoid

- **Leaderboard-only competition:** Already mitigated by personal bests and guild co-op, but actively monitor for students who disengage when they fall behind individually.
- **XP inflation:** If everything gives XP, nothing means anything. Keep the ~10% Nailed It guard in place. Easter eggs and boss battles should be the *exceptional* XP sources.
- **Narrative that doesn't match the cohort:** The campaign system needs instructor input. A narrative about "space exploration" doesn't land for a web dev bootcamp. Keep it tech-adjacent.
- **Feature overload at launch:** Students need to understand the system to be motivated by it. Introduce mechanics progressively — streaks and progress bars first, boss battles later.

---

## 🔧 Key Libraries (No Art Needed)

| Library | Use Case |
|---|---|
| `reactflow` | Skill tree DAG visualization |
| `dicebear` | Code-generated SVG avatars |
| `framer-motion` | Micro-interaction animations |
| `recharts` | Progress analytics, XP history charts |
| MUI `LinearProgress` / `CircularProgress` | Progress bars and rings |
| Existing OpenAI integration | Narrative text generation, Easter egg quality triggers |

---

*All mechanics above are achievable with the existing Next.js + MUI + Amplify + GraphQL + OpenAI stack. No Unity, no Figma illustrations, no sprite sheets required.*
