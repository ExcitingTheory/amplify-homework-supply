# Feature: Gamification & Achievement System

**Created**: January 31, 2026  
**Status**: Planning Phase  
**Component Version**: New Feature (no existing version)  
**Dependencies**: AWS Amplify DataStore, React Context API, Material UI, Lexical Editor

## Overview

Transform the elearning platform into an engaging journey through a comprehensive gamification system featuring XP progression, achievements, badges, leaderboards, and social features.

## Goals

### Primary Objectives
- ✅ Increase student engagement through rewards and recognition
- ✅ Encourage daily study habits via streak tracking
- ✅ Provide clear progression paths through skill trees
- ✅ Foster healthy competition via leaderboards
- ✅ Celebrate learning milestones with badges and titles

### Success Criteria
- Students complete 30% more units after gamification launch
- Daily active users increase by 40%
- Average study streak increases from 3 to 7 days
- 80%+ of students earn at least one badge in first week
- Leaderboard participation reaches 60% of active students

## Technical Requirements

### TypeScript Version
- TypeScript 5.x with strict mode enabled
- All new code must be TypeScript (`.ts`/`.tsx`)
- Gradual migration compatible with existing JS codebase

### Required Dependencies
- **Existing**: AWS Amplify Gen 1, DataStore, React 18, Material UI, Lexical
- **New**: 
  - `date-fns` (date manipulation for streaks)
  - `react-confetti` (celebration animations)
  - `recharts` (data visualization for progress charts)
  - `victory` or `recharts` (radar charts for skill visualization)

### Type Safety Requirements
- All data models must have TypeScript interfaces matching Amplify schema
- Context providers must be fully typed
- UI components must have strict prop interfaces
- No `any` types in production code
- Utility functions must use generics where applicable

## API Design

### Core Type Definitions

```typescript
// Achievement Types
interface Achievement {
  id: string;
  category: AchievementCategory;
  name: string;
  description: string;
  criteria: AchievementCriteria;
  xpReward: number;
  badgeId?: string;
  titleReward?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  icon: string;
}

type AchievementCategory = 
  | 'learning_milestones'
  | 'consistency_streaks'
  | 'accuracy_mastery'
  | 'audio_pronunciation'
  | 'social_collaborative'
  | 'creative_exploration'
  | 'speed_efficiency'
  | 'special_seasonal'
  | 'long_term_mastery';

interface AchievementCriteria {
  type: 'count' | 'streak' | 'accuracy' | 'composite';
  target: number;
  metric: string; // e.g., 'words_learned', 'units_completed', 'daily_streak'
  conditions?: Record<string, unknown>;
}

// User Progress Types
interface UserProgress {
  userId: string;
  totalXP: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string; // ISO date
  achievements: UserAchievement[];
  badges: UserBadge[];
  title?: string;
  avatarFrameId?: string;
}

interface UserAchievement {
  achievementId: string;
  earnedAt: string; // ISO timestamp
  progress: number; // 0-100
  notificationSent: boolean;
}

interface UserBadge {
  badgeId: string;
  earnedAt: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  showcased: boolean; // user can feature one badge
}

// XP Event Types
interface XPEvent {
  userId: string;
  source: XPSource;
  amount: number;
  multiplier: number;
  timestamp: string;
  metadata: Record<string, unknown>;
}

type XPSource = 
  | 'question_correct'
  | 'unit_complete'
  | 'word_learned'
  | 'audio_recording'
  | 'daily_login'
  | 'streak_bonus'
  | 'achievement_earned';

// Leaderboard Types
interface LeaderboardEntry {
  userId: string;
  username: string;
  avatarUrl?: string;
  rank: number;
  totalXP: number;
  level: number;
  title?: string;
  streak: number;
  rankChange?: number; // +3, -2, etc.
}

interface LeaderboardFilter {
  scope: 'global' | 'section' | 'friends';
  timeframe: 'daily' | 'weekly' | 'monthly' | 'all_time';
  sectionId?: string;
}
```

### Core Functions

```typescript
// XP Calculation
function calculateXP(event: XPEvent): number;
function calculateLevel(totalXP: number): number;
function getXPForLevel(level: number): number;
function getLevelTitle(level: number): string;
function applyMultipliers(baseXP: number, userId: string): Promise<number>;

// Achievement Detection
function checkAchievements(userId: string, event: XPEvent): Promise<Achievement[]>;
function updateAchievementProgress(userId: string, achievementId: string, progress: number): Promise<void>;
function awardAchievement(userId: string, achievement: Achievement): Promise<void>;

// Streak Management
function updateStreak(userId: string, activityDate: Date): Promise<number>;
function getStreakMultiplier(streak: number): number;
function checkStreakBroken(userId: string): Promise<boolean>;

// Leaderboard
function getLeaderboard(filter: LeaderboardFilter, limit: number): Promise<LeaderboardEntry[]>;
function getUserRank(userId: string, filter: LeaderboardFilter): Promise<number>;
function updateLeaderboard(userId: string): Promise<void>;

// Badge System
function unlockBadge(userId: string, badgeId: string, tier: string): Promise<void>;
function getBadgeProgress(userId: string, badgeId: string): Promise<number>;
function getShowcasedBadges(userId: string): Promise<UserBadge[]>;
```

## Data Models (Amplify Schema Extensions)

### New Models

```graphql
type UserProgress @model @auth(rules: [
  { allow: owner, operations: [read, update] }
  { allow: groups, groups: ["Admins"], operations: [read] }
]) {
  id: ID!
  owner: String @index(name: "byOwner")
  totalXP: Int!
  level: Int!
  currentStreak: Int!
  longestStreak: Int!
  lastActivityDate: AWSDateTime!
  title: String
  avatarFrameId: String
  achievements: [UserAchievement] @hasMany
  badges: [UserBadge] @hasMany
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}

type UserAchievement @model @auth(rules: [
  { allow: owner, operations: [read] }
  { allow: groups, groups: ["Admins"] }
]) {
  id: ID!
  owner: String
  userProgressId: ID! @index(name: "byUserProgress")
  achievementId: String!
  earnedAt: AWSDateTime!
  progress: Float!
  notificationSent: Boolean!
}

type UserBadge @model @auth(rules: [
  { allow: owner, operations: [read, update] }
  { allow: groups, groups: ["Admins"] }
]) {
  id: ID!
  owner: String
  userProgressId: ID! @index(name: "byUserProgress")
  badgeId: String!
  earnedAt: AWSDateTime!
  tier: BadgeTier!
  showcased: Boolean!
}

enum BadgeTier {
  BRONZE
  SILVER
  GOLD
  PLATINUM
}

type XPEvent @model @auth(rules: [
  { allow: owner, operations: [create, read] }
  { allow: groups, groups: ["Admins"] }
]) {
  id: ID!
  owner: String @index(name: "byOwner")
  source: XPSource!
  amount: Int!
  multiplier: Float!
  timestamp: AWSDateTime!
  metadata: AWSJSON
}

enum XPSource {
  QUESTION_CORRECT
  UNIT_COMPLETE
  WORD_LEARNED
  AUDIO_RECORDING
  DAILY_LOGIN
  STREAK_BONUS
  ACHIEVEMENT_EARNED
}

type Achievement @model @auth(rules: [
  { allow: public, operations: [read] }
  { allow: groups, groups: ["Admins"] }
]) {
  id: ID!
  category: AchievementCategory!
  name: String!
  description: String!
  criteria: AWSJSON!
  xpReward: Int!
  badgeId: String
  titleReward: String
  rarity: Rarity!
  icon: String!
}

enum AchievementCategory {
  LEARNING_MILESTONES
  CONSISTENCY_STREAKS
  ACCURACY_MASTERY
  AUDIO_PRONUNCIATION
  SOCIAL_COLLABORATIVE
  CREATIVE_EXPLORATION
  SPEED_EFFICIENCY
  SPECIAL_SEASONAL
  LONG_TERM_MASTERY
}

enum Rarity {
  COMMON
  RARE
  EPIC
  LEGENDARY
}
```

### Modified Models (Add XP tracking)

```graphql
# Grade model - add XP earned
type Grade @model {
  # ...existing fields...
  xpEarned: Int
  achievementsUnlocked: [String]
}

# Unit model - add XP metadata
type Unit @model {
  # ...existing fields...
  targetCompletionTime: Int # seconds
  baseXP: Int
  difficultyMultiplier: Float
}
```

## Implementation Notes

### Architecture Patterns

1. **React Context for Gamification State**
   - Create `GamificationContext` to manage user progress, achievements, badges
   - Prevent DataStore subscription duplication (follow existing patterns)
   - One subscription per model with client-side filtering

2. **Event-Driven XP Awards**
   - Listen to Grade saves (unit completion)
   - Listen to Word model changes (vocabulary learning)
   - Listen to File uploads (audio recordings)
   - Emit XPEvents to DataStore for audit trail

3. **Achievement Detection Service**
   - Background service checks achievements after each XPEvent
   - Use criteria pattern matching (not hard-coded checks)
   - Queue achievement notifications to avoid spam

4. **Real-Time Leaderboard Updates**
   - Use DataStore observeQuery for live updates
   - Cache leaderboard data with 5-minute TTL
   - Debounce rank recalculations

5. **Progress Persistence**
   - Save streak data daily (not on every activity)
   - Batch XPEvent writes (buffer up to 10 events or 30 seconds)
   - Use Optimistic Concurrency Control for UserProgress updates

### Performance Considerations

- **Lazy Load Achievements**: Don't fetch all 100+ achievements on page load
- **Virtualized Leaderboards**: Render only visible rows for long lists
- **Memoized Calculations**: Cache XP, level, and multiplier calculations
- **Debounced Animations**: Don't show confetti for every 10 XP gained
- **Background Sync**: Process achievement checks asynchronously

### Security Considerations

- All XP awards must be server-validated (use Lambda functions)
- Prevent XP farming (rate limiting, duplicate detection)
- Leaderboard data is read-only for non-admins
- Achievement criteria stored as JSON (not user-editable)
- Validate streak claims against server timestamps

## Edge Cases

### Boundary Conditions
- User earns multiple achievements simultaneously → Queue notifications
- XP overflow (Level 100+) → Cap at max level or allow infinite growth?
- Streak calculation across timezones → Use UTC for consistency
- Negative XP (penalties) → Min XP = 0, never go negative
- Level down scenarios → Disallow level regression

### Error Scenarios
- DataStore sync fails during achievement unlock → Retry with exponential backoff
- Achievement criteria JSON parse error → Log error, skip achievement
- Leaderboard query timeout → Show cached data with warning
- User deletes account → Cascade delete progress, preserve leaderboard history

### Invalid Input Handling
- Invalid achievement ID → Return empty array
- Negative XP amount → Throw error, log incident
- Future dates for streaks → Reject, use current server time
- Invalid leaderboard filter → Fall back to global/all-time

## Migration Strategy

### Phase 1: Schema & Data Layer
1. Add Amplify schema models
2. Run `amplify push`
3. Increment SCHEMA_VERSION in `pages/_app.js`
4. Seed initial achievements and badges

### Phase 2: Context & Services
1. Create GamificationContext
2. Implement XP calculation utilities
3. Add achievement detection service
4. Create streak management service

### Phase 3: UI Components
1. XP progress bar
2. Achievement notification modal
3. Badge showcase
4. Leaderboard table
5. Skill tree visualization

### Phase 4: Integration
1. Hook into existing Grade flow
2. Award XP on unit completion
3. Track vocabulary learning
4. Integrate with audio features

### Phase 5: Polish & Optimization
1. Animation and sound effects
2. Performance optimization
3. Analytics integration
4. A/B testing setup

## Related Documentation

- [GAMIFICATION_SYSTEM.md](./GAMIFICATION_SYSTEM.md) - Original design document
- [API.md](./API.md) - Current data models
- [DATASTORE_OPTIMIZATION_CHANGES.md](../DATASTORE_OPTIMIZATION_CHANGES.md) - Subscription patterns

## Open Questions

1. **XP Economy Balance**: What's the right XP-to-level curve? Too easy = no challenge, too hard = frustration
2. **Leaderboard Reset Frequency**: Weekly? Monthly? Never?
3. **Social Features Scope**: Friend system in Phase 1 or defer to Phase 2?
4. **Seasonal Events**: How to configure time-limited achievements?
5. **Mobile Responsiveness**: How do skill trees render on mobile?
6. **Accessibility**: How do screen readers handle badge animations?
7. **Internationalization**: Translate achievement names/descriptions?

## Success Metrics

### Engagement Metrics
- Daily Active Users (DAU) increase
- Average session duration
- Units completed per user per week
- Streak retention rate (day 7, day 30)

### Gamification Metrics
- Achievement unlock rate
- Badge collection rate
- Leaderboard participation rate
- XP distribution curve (are levels balanced?)

### Business Metrics
- Student retention rate
- Assignment completion rate
- Instructor satisfaction with engagement tools

## Next Steps

1. Review this specification with stakeholders
2. Create testing and validation guide
3. Break down into development phases
4. Begin Phase 1 implementation
