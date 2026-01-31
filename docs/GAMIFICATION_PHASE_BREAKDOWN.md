# Gamification System - Development Phases

**Created**: January 31, 2026  
**Total Estimated Effort**: 8-10 weeks  
**Developer**: 1-2 full-time  

## Overview

The gamification system is divided into 5 major phases, each building upon the previous. This breakdown prioritizes delivering value incrementally while maintaining code quality and type safety.

---

## Phase 1: Foundation - Data Models & XP System

**Goal**: Establish core data structures and XP calculation engine  
**Estimated Effort**: 1-2 weeks  
**Deliverables**: Working XP awards on unit completion  

### Tasks

#### 1.1: Amplify Schema Updates
- [ ] Define `UserProgress` model in schema.graphql
- [ ] Define `UserAchievement` model
- [ ] Define `UserBadge` model
- [ ] Define `XPEvent` model
- [ ] Define `Achievement` model
- [ ] Add enums (XPSource, AchievementCategory, Rarity, BadgeTier)
- [ ] Add XP fields to existing `Grade` model
- [ ] Add XP metadata to existing `Unit` model
- [ ] Run `amplify push` to generate models
- [ ] Increment SCHEMA_VERSION in pages/_app.js

**Verification**:
```bash
# Check generated models
ls -la src/models/ | grep -E "(UserProgress|XPEvent|Achievement)"

# Verify TypeScript types
tsc --noEmit --project tsconfig.json
```

#### 1.2: TypeScript Interfaces
- [ ] Create `src/types/gamification.ts` with core interfaces
- [ ] Export Achievement, UserProgress, XPEvent types
- [ ] Create utility types (XPSource union, etc.)
- [ ] Document interfaces with JSDoc comments

**Verification**:
```bash
# Ensure types are properly exported
grep -r "export.*interface.*Achievement" src/types/gamification.ts
```

#### 1.3: XP Calculation Utilities
- [ ] Create `src/utils/gamification/xp.ts`
- [ ] Implement `calculateXP(event: XPEvent): number`
- [ ] Implement `calculateLevel(totalXP: number): number`
- [ ] Implement `getXPForLevel(level: number): number`
- [ ] Implement `getLevelTitle(level: number): string`
- [ ] Implement `applyMultipliers(baseXP: number, userId: string): Promise<number>`
- [ ] Add input validation and error handling

**Verification**:
```bash
# Run unit tests
npm test -- src/utils/gamification/xp.test.ts

# Type check
tsc --noEmit --project tsconfig.json
```

#### 1.4: XP Service
- [ ] Create `src/services/gamification/xpService.ts`
- [ ] Implement `awardXP(userId: string, event: XPEvent): Promise<void>`
- [ ] Implement `getUserProgress(userId: string): Promise<UserProgress>`
- [ ] Implement `updateUserProgress(userId: string, xp: number): Promise<void>`
- [ ] Add DataStore integration
- [ ] Add Optimistic Concurrency Control handling

**Verification**:
```bash
npm test -- src/services/gamification/xpService.test.ts
```

#### 1.5: Integration with Grade Flow
- [ ] Modify grade save logic in `src/context/unitContext.js`
- [ ] Call `awardXP` when grade is saved with completion
- [ ] Calculate XP based on accuracy and speed
- [ ] Show XP notification in UI (simple toast)

**Verification**:
```bash
# E2E test: Complete a unit and verify XP awarded
npm run cypress:run -- --spec "cypress/e2e/gamification/xp-award.cy.ts"
```

### Testing Requirements
- [ ] Unit tests for all XP utility functions (>95% coverage)
- [ ] Integration tests for XP service with DataStore mocks
- [ ] E2E test: Complete unit → receive XP → level up

### Phase 1 Completion Criteria
- ✅ TypeScript compiles with zero errors
- ✅ All tests passing
- ✅ XP awarded on unit completion
- ✅ User level calculated correctly
- ✅ DataStore sync working (checked via Amplify console)

---

## Phase 2: Achievement System

**Goal**: Detect and award achievements based on user activity  
**Estimated Effort**: 2-3 weeks  
**Deliverables**: Achievement unlocks with notifications  

### Tasks

#### 2.1: Achievement Definitions
- [ ] Create `src/data/achievements.ts` with all achievement definitions
- [ ] Define criteria objects for each achievement category
- [ ] Export achievement constants
- [ ] Seed achievements to DataStore (initial data script)

**Verification**:
```bash
# Check achievement count
grep -c "id:" src/data/achievements.ts
# Should be 50+ achievements

# Run seed script
npm run seed:achievements
```

#### 2.2: Achievement Detection Service
- [ ] Create `src/services/gamification/achievementDetection.ts`
- [ ] Implement `checkAchievements(userId: string, event: XPEvent): Promise<Achievement[]>`
- [ ] Implement criteria matching logic (count, streak, accuracy, composite)
- [ ] Implement `updateAchievementProgress(userId: string, achievementId: string, progress: number)`
- [ ] Implement `awardAchievement(userId: string, achievement: Achievement)`
- [ ] Add duplicate detection (don't award twice)

**Verification**:
```bash
npm test -- src/services/gamification/achievementDetection.test.ts
```

#### 2.3: Achievement Context
- [ ] Create `src/context/achievementContext.tsx`
- [ ] Implement DataStore subscriptions for UserAchievement
- [ ] Provide `achievements`, `earnedAchievements`, `lockedAchievements`
- [ ] Provide `getAchievementProgress(achievementId: string)` function
- [ ] Follow existing context patterns (one subscription with client filtering)

**Verification**:
```bash
# Test context integration
npm test -- src/context/achievementContext.test.tsx
```

#### 2.4: Achievement Notification UI
- [ ] Create `src/components/gamification/AchievementModal.tsx`
- [ ] Add confetti animation (react-confetti)
- [ ] Add badge reveal animation
- [ ] Add sound effect (optional)
- [ ] Show XP reward and achievement details
- [ ] Queue multiple achievements (don't spam modals)

**Verification**:
```bash
# Storybook story
npm run storybook
# Navigate to Gamification > AchievementModal

# Component tests
npm test -- src/components/gamification/AchievementModal.test.tsx
```

#### 2.5: Integration with XP Events
- [ ] Call `checkAchievements` after every XP award
- [ ] Show achievement modal when unlocked
- [ ] Update achievement progress in UI

**Verification**:
```bash
# E2E test: Complete 5 units → unlock "Lesson Learner" achievement
npm run cypress:run -- --spec "cypress/e2e/gamification/achievement-unlock.cy.ts"
```

### Testing Requirements
- [ ] Unit tests for achievement detection logic (>85%)
- [ ] Integration tests for achievement context
- [ ] Component tests for AchievementModal
- [ ] E2E test: Unlock multiple achievements

### Phase 2 Completion Criteria
- ✅ Achievement detection working for all categories
- ✅ Achievements persist to DataStore
- ✅ Notifications display correctly
- ✅ No duplicate awards
- ✅ All tests passing

---

## Phase 3: Streaks & Badges

**Goal**: Track daily activity streaks and award badges  
**Estimated Effort**: 1-2 weeks  
**Deliverables**: Streak tracking with multipliers, badge showcase  

### Tasks

#### 3.1: Streak Management Service
- [ ] Create `src/services/gamification/streakService.ts`
- [ ] Implement `updateStreak(userId: string, activityDate: Date): Promise<number>`
- [ ] Implement `checkStreakBroken(userId: string): Promise<boolean>`
- [ ] Implement `getStreakMultiplier(streak: number): number`
- [ ] Handle timezone edge cases (use UTC)
- [ ] Track `longestStreak` separately from `currentStreak`

**Verification**:
```bash
npm test -- src/services/gamification/streakService.test.ts
```

#### 3.2: Daily Login Detection
- [ ] Add streak check to `pages/_app.js` on mount
- [ ] Call `updateStreak` on first activity of the day
- [ ] Apply streak multiplier to XP calculations
- [ ] Show streak status in navbar/header

**Verification**:
```bash
# Manual test: Log in on consecutive days and verify streak increments
```

#### 3.3: Badge System
- [ ] Create `src/data/badges.ts` with badge definitions
- [ ] Link badges to achievements
- [ ] Define badge tiers (bronze, silver, gold, platinum)
- [ ] Create badge icon components (or use images)

**Verification**:
```bash
grep -c "id:" src/data/badges.ts
# Should be 30+ badges
```

#### 3.4: Badge Showcase Component
- [ ] Create `src/components/gamification/BadgeShowcase.tsx`
- [ ] Display earned badges (unlocked)
- [ ] Display locked badges (grayed out with progress)
- [ ] Add badge grid layout
- [ ] Add badge detail modal (click to see description)
- [ ] Allow user to "showcase" favorite badge

**Verification**:
```bash
# Storybook
npm run storybook
# Navigate to Gamification > BadgeShowcase

# Component tests
npm test -- src/components/gamification/BadgeShowcase.test.tsx
```

#### 3.5: Integration
- [ ] Show streak counter in header/navbar
- [ ] Award badges when achievements unlock
- [ ] Add badge showcase to user profile page

**Verification**:
```bash
# E2E test: Earn achievement → receive badge → see in showcase
npm run cypress:run -- --spec "cypress/e2e/gamification/badge-award.cy.ts"
```

### Testing Requirements
- [ ] Unit tests for streak service (>85%)
- [ ] Component tests for BadgeShowcase
- [ ] E2E test: Multi-day streak tracking

### Phase 3 Completion Criteria
- ✅ Streaks tracked accurately across days
- ✅ Multipliers applied to XP awards
- ✅ Badges displayed in showcase
- ✅ User can set showcased badge
- ✅ All tests passing

---

## Phase 4: Leaderboards

**Goal**: Competitive leaderboards with rankings and filtering  
**Estimated Effort**: 2 weeks  
**Deliverables**: Global, section, and friends leaderboards  

### Tasks

#### 4.1: Leaderboard Service
- [ ] Create `src/services/gamification/leaderboardService.ts`
- [ ] Implement `getLeaderboard(filter: LeaderboardFilter, limit: number): Promise<LeaderboardEntry[]>`
- [ ] Implement `getUserRank(userId: string, filter: LeaderboardFilter): Promise<number>`
- [ ] Implement `updateLeaderboard(userId: string): Promise<void>`
- [ ] Add caching layer (5-minute TTL)
- [ ] Handle pagination for large lists

**Verification**:
```bash
npm test -- src/services/gamification/leaderboardService.test.ts
```

#### 4.2: Leaderboard Calculation
- [ ] Calculate ranks from UserProgress data
- [ ] Sort by totalXP descending
- [ ] Calculate rank changes (compare to previous period)
- [ ] Handle ties correctly

**Verification**:
```bash
# Test with 1000+ mock users
npm test -- src/services/gamification/leaderboard.perf.test.ts
```

#### 4.3: Leaderboard Table Component
- [ ] Create `src/components/gamification/LeaderboardTable.tsx`
- [ ] Display rank, avatar, username, XP, level, streak
- [ ] Show medals for top 3 (🥇🥈🥉)
- [ ] Highlight current user's row
- [ ] Show rank change indicator (↑↓)
- [ ] Add filters (global/section/friends, timeframe)
- [ ] Virtualize long lists (react-window)

**Verification**:
```bash
# Storybook
npm run storybook
# Navigate to Gamification > LeaderboardTable

# Component tests
npm test -- src/components/gamification/LeaderboardTable.test.tsx
```

#### 4.4: Leaderboard Page
- [ ] Create `pages/leaderboard.tsx`
- [ ] Add tab navigation (Global, My Class, Friends)
- [ ] Add timeframe selector (Daily, Weekly, Monthly, All Time)
- [ ] Show current user rank at bottom (sticky)
- [ ] Add refresh button with loading state

**Verification**:
```bash
# Manual test: Navigate to /leaderboard and verify all filters work
```

#### 4.5: Real-Time Updates
- [ ] Subscribe to UserProgress changes via DataStore.observeQuery
- [ ] Update leaderboard when XP changes
- [ ] Debounce updates to prevent flickering

**Verification**:
```bash
# E2E test: Complete unit in one tab, see leaderboard update in another
npm run cypress:run -- --spec "cypress/e2e/gamification/leaderboard-realtime.cy.ts"
```

### Testing Requirements
- [ ] Unit tests for leaderboard service (>80%)
- [ ] Integration tests with DataStore mocks
- [ ] Component tests for LeaderboardTable
- [ ] Performance tests (1000+ users should load in <500ms)
- [ ] E2E test: Navigate leaderboard, apply filters

### Phase 4 Completion Criteria
- ✅ Leaderboards display correctly for all filters
- ✅ Ranks calculated accurately
- ✅ Real-time updates working
- ✅ Performance benchmarks met
- ✅ All tests passing

---

## Phase 5: Progress Visualization & Polish

**Goal**: Add skill trees, charts, animations, and final polish  
**Estimated Effort**: 2-3 weeks  
**Deliverables**: Complete gamification experience  

### Tasks

#### 5.1: Progress Dashboard
- [ ] Create `pages/profile/progress.tsx`
- [ ] Add XP progress circular chart (Material UI)
- [ ] Add streak calendar heatmap (react-calendar-heatmap)
- [ ] Add skills radar chart (recharts)
- [ ] Add achievement progress summary
- [ ] Add study statistics (total units, avg accuracy, etc.)

**Verification**:
```bash
# Storybook stories for each chart component
npm run storybook
```

#### 5.2: Skill Tree (Optional/Advanced)
- [ ] Create `src/components/gamification/SkillTree.tsx`
- [ ] Define skill tree structure (grammar, vocab, listening, speaking)
- [ ] Show node states (completed, available, locked)
- [ ] Add SVG connections between nodes
- [ ] Make interactive (click to see requirements)

**Verification**:
```bash
# Component tests
npm test -- src/components/gamification/SkillTree.test.tsx
```

#### 5.3: Animations & Sound
- [ ] Add confetti for achievement unlocks (already in Phase 2)
- [ ] Add level-up animation
- [ ] Add XP gain animation (number counting up)
- [ ] Add sound effects (optional, with mute option)
- [ ] Add badge unlock animation

**Verification**:
```bash
# Manual testing: Complete various actions and verify animations
```

#### 5.4: Gamification Settings
- [ ] Add gamification preferences to SettingsContext
- [ ] Add toggle for notifications
- [ ] Add toggle for sound effects
- [ ] Add privacy settings (show/hide on leaderboard)
- [ ] Add reset progress option (admin only)

**Verification**:
```bash
# Test settings persistence
npm test -- src/context/settingsContext.test.ts
```

#### 5.5: Mobile Responsiveness
- [ ] Ensure all gamification components work on mobile
- [ ] Adjust leaderboard table for small screens
- [ ] Simplify dashboard layout on mobile
- [ ] Test on iOS and Android

**Verification**:
```bash
# Cypress mobile viewport tests
npm run cypress:run -- --config viewportWidth=375,viewportHeight=667
```

#### 5.6: Final Polish
- [ ] Add loading states to all components
- [ ] Add error states and retry logic
- [ ] Add empty states (no achievements yet, etc.)
- [ ] Add tooltips and help text
- [ ] Run full accessibility audit
- [ ] Optimize bundle size (code splitting)

**Verification**:
```bash
# Lighthouse audit
npm run build
npm run preview
# Run Lighthouse on /leaderboard and /profile/progress

# Bundle analysis
npm run build -- --analyze
```

### Testing Requirements
- [ ] Component tests for all new UI components (>60%)
- [ ] Accessibility tests (axe)
- [ ] Performance tests (Lighthouse score >90)
- [ ] Cross-browser testing (Chrome, Safari, Firefox)
- [ ] E2E test: Full user journey (sign up → earn XP → unlock achievement → check leaderboard)

### Phase 5 Completion Criteria
- ✅ Progress dashboard fully functional
- ✅ All animations working smoothly
- ✅ Mobile responsive
- ✅ Accessibility audit passed
- ✅ All tests passing
- ✅ Documentation complete

---

## Cross-Cutting Concerns

### Throughout All Phases

#### Documentation
- [ ] Update API.md with new models
- [ ] Create user guide (how to earn XP, unlock achievements)
- [ ] Create admin guide (how to manage achievements)
- [ ] Update ONBOARDING.md with gamification setup

#### Performance
- [ ] Monitor DataStore sync performance
- [ ] Optimize queries (use indexes)
- [ ] Implement caching where appropriate
- [ ] Lazy load heavy components

#### Security
- [ ] Validate all XP awards server-side (Lambda function)
- [ ] Prevent XP farming (rate limiting)
- [ ] Ensure leaderboard is read-only for students
- [ ] Audit auth rules on new models

#### Analytics
- [ ] Track achievement unlock rate
- [ ] Track leaderboard engagement
- [ ] Track streak retention
- [ ] A/B test XP values

---

## Dependency Graph

```
Phase 1: Foundation (XP System)
  └─> Phase 2: Achievement System
        └─> Phase 3: Streaks & Badges
              ├─> Phase 4: Leaderboards
              └─> Phase 5: Progress Visualization
```

**Critical Path**: Phases 1-4 must be sequential. Phase 5 can be partially parallelized.

---

## Risk Mitigation

### High-Risk Areas

1. **XP Economy Balance**
   - Risk: XP values too high/low
   - Mitigation: Test with spreadsheet model, A/B test in production

2. **Leaderboard Performance**
   - Risk: Slow queries with 10,000+ users
   - Mitigation: Add indexes, implement caching, use pagination

3. **Achievement Detection Logic**
   - Risk: Complex criteria hard to maintain
   - Mitigation: Use declarative criteria objects, add comprehensive tests

4. **DataStore Sync Issues**
   - Risk: Conflicts, sync delays
   - Mitigation: Use Optimistic Concurrency Control, add retry logic

### Contingency Plans

- If leaderboard is too slow: Use Lambda function to pre-calculate daily
- If achievement detection is too complex: Start with simple achievements, iterate
- If animations cause performance issues: Make them optional

---

## Success Metrics

### Phase 1
- XP awarded correctly 100% of the time
- TypeScript errors = 0
- Unit test coverage >95%

### Phase 2
- 80% of achievements unlockable
- Achievement notifications appear <500ms after unlock
- No duplicate awards

### Phase 3
- Streak accuracy 100%
- Badge showcase loads <200ms
- All badges displayable

### Phase 4
- Leaderboard query <500ms for 1000 users
- Real-time updates within 5 seconds
- Rank calculations 100% accurate

### Phase 5
- Lighthouse score >90
- All WCAG 2.1 Level AA criteria met
- Bundle size increase <200KB

---

## Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Foundation | 1-2 weeks | None |
| Phase 2: Achievements | 2-3 weeks | Phase 1 complete |
| Phase 3: Streaks & Badges | 1-2 weeks | Phase 2 complete |
| Phase 4: Leaderboards | 2 weeks | Phase 3 complete |
| Phase 5: Visualization & Polish | 2-3 weeks | Phase 4 complete |
| **Total** | **8-12 weeks** | |

**Assumptions**:
- 1-2 full-time developers
- No major blockers
- Designs approved upfront
- Existing infrastructure stable

---

## Next Steps

1. **Review this phase breakdown with stakeholders**
2. **Select starting phase** (recommend Phase 1)
3. **Generate detailed TODO list for selected phase**
4. **Begin implementation following TypeScript workflow**

---

**Questions for Discussion**:

1. Should we implement all phases or prioritize certain ones?
2. Are there specific achievements we want in Phase 1 for early testing?
3. Do we need skill tree (Phase 5.2) or can we defer it?
4. Should leaderboards have prizes/rewards?
5. What's our target launch date?
