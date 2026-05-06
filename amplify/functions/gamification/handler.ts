/**
 * Gamification Handler
 *
 * Manages XP awards, badge checks, streaks, leaderboard rebuilds,
 * and student memory updates.
 *
 * All operations use IAM-authenticated GraphQL to read/write DynamoDB models.
 */

import type { Handler } from "aws-lambda";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { fromEnv } from "@aws-sdk/credential-providers";

// ============================================================================
// GraphQL Queries & Mutations
// ============================================================================

const CREATE_XP_LOG = `mutation CreateStudentXPLog($input: CreateStudentXPLogInput!) {
  createStudentXPLog(input: $input) { id studentId xpAmount accuracy reason referenceId cohortId unitID _version _lastChangedAt _deleted }
}`;

const LIST_XP_LOGS_BY_STUDENT = `query ListXPLogsByStudent($studentId: String!) {
  listStudentXPLogByStudentId(studentId: $studentId) {
    items { id studentId xpAmount accuracy reason referenceId cohortId unitID createdAt _version _lastChangedAt _deleted }
  }
}`;

const LIST_XP_LOGS_BY_COHORT = `query ListXPLogsByCohort($cohortId: String!) {
  listStudentXPLogByCohortId(cohortId: $cohortId) {
    items { id studentId xpAmount accuracy reason referenceId cohortId unitID createdAt _version _lastChangedAt _deleted }
  }
}`;

// NOTE: StudentBadge, StudentStreak, StudentPersonalBest, StudentProgress,
// LeaderboardEntry, StudentSkillProgress, EasterEggDiscovery, GuildMembership,
// GuildPost, Campaign, GroupChallengeContribution, ContentLock, InstructorInsight
// models have been REMOVED. All their data now lives on StudentProfile or embedded
// in their parent aggregate models (EasterEgg.discoveries, Guild.members, etc.).

// Easter egg queries/mutations
const LIST_ACTIVE_EASTER_EGGS = `query ListActiveEasterEggs {
  listEasterEggs(filter: { active: { eq: true } }) {
    items { id trigger triggerValue xpReward badgeId revealMessage active _version _lastChangedAt _deleted }
  }
}`;

// Guild queries/mutations (GuildMembership model removed - members embedded in Guild.members)

const GET_GUILD = `query GetGuild($id: ID!) {
  getGuild(id: $id) { id name cohortId totalXP members _version _lastChangedAt _deleted }
}`;

const UPDATE_GUILD = `mutation UpdateGuild($input: UpdateGuildInput!) {
  updateGuild(input: $input) { id name totalXP _version _lastChangedAt _deleted }
}`;

const LIST_GUILDS_BY_COHORT = `query ListGuildsByCohort($cohortId: String!) {
  listGuildByCohortId(cohortId: $cohortId) {
    items { id name cohortId totalXP members _version _lastChangedAt _deleted }
  }
}`;

// Group challenge queries/mutations
const LIST_ACTIVE_CHALLENGES_BY_COHORT = `query ListChallengesByCohort($cohortId: String!) {
  listGroupChallengeByCohortId(cohortId: $cohortId) {
    items { id cohortId title targetXP currentXP deadline active bonusMultiplier contributions _version _lastChangedAt _deleted }
  }
}`;

const UPDATE_CHALLENGE = `mutation UpdateChallenge($input: UpdateGroupChallengeInput!) {
  updateGroupChallenge(input: $input) { id currentXP _version _lastChangedAt _deleted }
}`;

// CREATE_CONTRIBUTION removed - contributions embedded in GroupChallenge.contributions

const GET_STUDENT_MEMORY = `query GetStudentMemory($studentId: String!) {
  listStudentMemoryByStudentId(studentId: $studentId) {
    items { id studentId memoryMarkdown structuredProfile lastUpdatedBy version _version _lastChangedAt _deleted }
  }
}`;

const CREATE_STUDENT_MEMORY = `mutation CreateStudentMemory($input: CreateStudentMemoryInput!) {
  createStudentMemory(input: $input) { id studentId memoryMarkdown structuredProfile _version _lastChangedAt _deleted }
}`;

const UPDATE_STUDENT_MEMORY = `mutation UpdateStudentMemory($input: UpdateStudentMemoryInput!) {
  updateStudentMemory(input: $input) { id studentId memoryMarkdown structuredProfile version _version _lastChangedAt _deleted }
}`;

// StudentMemory queries/mutations (unit memories use unitID filter)
const LIST_UNIT_MEMORY_BY_STUDENT = `query ListUnitMemoryByStudent($studentId: String!) {
  listStudentMemoryByStudentId(studentId: $studentId) {
    items {
      id studentId unitID weakConcepts strongConcepts confusionPairs
      accuracyBySource totalAttempts averageAccuracy reviewPriority lastPracticedAt _version _lastChangedAt _deleted }
  }
}`;

const LIST_UNIT_MEMORY_BY_UNIT = `query ListUnitMemoryByUnit($unitID: String!) {
  listStudentMemoryByUnitID(unitID: $unitID) {
    items {
      id studentId unitID weakConcepts strongConcepts
      accuracyBySource totalAttempts averageAccuracy reviewPriority lastPracticedAt _version _lastChangedAt _deleted }
  }
}`;

const CREATE_UNIT_MEMORY = `mutation CreateStudentMemory($input: CreateStudentMemoryInput!) {
  createStudentMemory(input: $input) {
    id studentId unitID weakConcepts strongConcepts confusionPairs
    accuracyBySource totalAttempts averageAccuracy reviewPriority lastPracticedAt _version _lastChangedAt _deleted }
}`;

const UPDATE_UNIT_MEMORY = `mutation UpdateStudentMemory($input: UpdateStudentMemoryInput!) {
  updateStudentMemory(input: $input) {
    id studentId unitID weakConcepts strongConcepts confusionPairs
    accuracyBySource totalAttempts averageAccuracy reviewPriority lastPracticedAt _version _lastChangedAt _deleted }
}`;

const LIST_XP_LOGS_FOR_COHORT = `query ListXPLogsByCohortId($cohortId: String!) {
  listStudentXPLogByCohortId(cohortId: $cohortId) {
    items { id studentId xpAmount reason cohortId _version _lastChangedAt _deleted }
  }
}`;

// Leaderboard now on StudentProfile - no separate model

const LIST_GRADES_BY_SECTION = `query ListGradesBySectionID($sectionID: String!) {
  listGradeBySectionID(sectionID: $sectionID) {
    items { id owner sectionID complete accuracy _version _lastChangedAt _deleted }
  }
}`;

const GET_SECTION = `query GetSection($id: ID!) {
  getSection(id: $id) { id leaderboardEnabled xpConfig _version _lastChangedAt _deleted }
}`;

const GET_SETTINGS_BY_OWNER = `query GetSettings($owner: String!) {
  listSettings(filter: { owner: { eq: $owner } }) {
    items { id owner leaderboardOptIn _version _lastChangedAt _deleted }
  }
}`;

// Skill tree generation queries/mutations
const GET_UNIT = `query GetUnit($id: ID!) {
  getUnit(id: $id) { id name description data _version _lastChangedAt _deleted }
}`;

const LIST_UNIT_WORDS = `query ListUnitWords($unitID: String!) {
  listUnitWordByUnitID(unitID: $unitID) {
    items { word { id word phonetic definition _version _lastChangedAt _deleted } }
  }
}`;

const LIST_QUESTION_UNITS = `query ListQuestionUnits($unitID: String!) {
  listQuestionUnitByUnitID(unitID: $unitID) {
    items { question { id question answer _version _lastChangedAt _deleted } }
  }
}`;

const LIST_UNIT_DOCUMENTS = `query ListUnitDocuments($unitID: String!) {
  listUnitDocumentByUnitID(unitID: $unitID) {
    items { document { id parsedContents { items { id objectivesJSON _version _lastChangedAt _deleted } } _version _lastChangedAt _deleted } }
  }
}`;

const LIST_SKILLS_BY_COHORT = `query ListSkillsByCohort($cohortId: String!) {
  listSkillByCohort(cohortId: $cohortId) {
    items { id title description prerequisites xpReward _version _lastChangedAt _deleted }
  }
}`;

const CREATE_SKILL = `mutation CreateSkill($input: CreateSkillInput!) {
  createSkill(input: $input) { id title description prerequisites xpReward cohortId _version _lastChangedAt _deleted }
}`;

const DELETE_SKILL = `mutation DeleteSkill($input: DeleteSkillInput!) {
  deleteSkill(input: $input) { id _version _lastChangedAt _deleted }
}`;

// StudentProfile aggregate queries/mutations
const GET_STUDENT_PROFILE = `query GetStudentProfile($studentId: String!) {
  listStudentProfileByStudentId(studentId: $studentId) {
    items {
      id studentId cohortId studentName totalXP level
      currentStreak longestStreak lastActivityDate freezesRemaining freezesUsed
      badges moduleProgress personalBests skillProgress unitMemories activeDebuffs
      completedAssignments nailedItCount lastUpdated _version _lastChangedAt _deleted }
  }
}`;

const CREATE_STUDENT_PROFILE = `mutation CreateStudentProfile($input: CreateStudentProfileInput!) {
  createStudentProfile(input: $input) { id studentId _version _lastChangedAt _deleted }
}`;

const UPDATE_STUDENT_PROFILE = `mutation UpdateStudentProfile($input: UpdateStudentProfileInput!) {
  updateStudentProfile(input: $input) {
    id studentId totalXP level currentStreak longestStreak
    badges moduleProgress personalBests skillProgress unitMemories cosmeticPenalty activeDebuffs freezesRemaining _version _lastChangedAt _deleted }
}`;

// StudentSkillProgress removed - skill progress now on StudentProfile.skillProgress

// StudentProfile list by cohort (for leaderboard rebuild)
const LIST_PROFILES_BY_COHORT = `query ListProfilesByCohort($cohortId: String!) {
  listStudentProfileByCohortId(cohortId: $cohortId) {
    items {
      id studentId cohortId studentName totalXP level
      currentStreak longestStreak completedAssignments nailedItCount lastUpdated _version _lastChangedAt _deleted }
  }
}`;

// EasterEgg update (for embedded discoveries)
const GET_EASTER_EGG = `query GetEasterEgg($id: ID!) {
  getEasterEgg(id: $id) { id trigger triggerValue xpReward badgeId revealMessage active discoveries _version _lastChangedAt _deleted }
}`;

const UPDATE_EASTER_EGG = `mutation UpdateEasterEgg($input: UpdateEasterEggInput!) {
  updateEasterEgg(input: $input) { id discoveries _version _lastChangedAt _deleted }
}`;

// GroupChallenge update (for embedded contributions)
const UPDATE_CHALLENGE_WITH_CONTRIBUTIONS = `mutation UpdateGroupChallenge($input: UpdateGroupChallengeInput!) {
  updateGroupChallenge(input: $input) { id currentXP contributions _version _lastChangedAt _deleted }
}`;

// ============================================================================
// XP Amount Constants
// ============================================================================

const XP_AMOUNTS: Record<string, number> = {
  HOMEWORK_SUBMITTED: 50,
  AI_FEEDBACK_REVISED: 25,
  ALL_BLOCKS_COMPLETED: 75,
  PEER_REVIEW_GIVEN: 40,
  PEER_REVIEW_HOSTED: 30,
  NAILED_IT: 20,
  ON_TIME_SUBMISSION: 15,
  STREAK_3DAY: 30,
  STREAK_7DAY: 75,
  STREAK_14DAY: 150,
  STREAK_30DAY: 300,
  PERFECT_SCORE: 100,
  COMEBACK: 50,
  PERSONAL_BEST: 25,
  EASTER_EGG: 30,
  GUILD_CHALLENGE_BONUS: 100,
  PRACTICE_DRILL_COMPLETED: 30,
  PRACTICE_DRILL_ACCURACY_BONUS: 15,
};

// ============================================================================
// Practice Drill Diminishing Returns
// ============================================================================

const PRACTICE_DIMINISH_FACTOR = 0.5;
const PRACTICE_FLOOR_XP = 5;

function calculatePracticeDrillXP(
  baseXP: number,
  sessionsToday: number,
): number {
  return Math.max(
    PRACTICE_FLOOR_XP,
    Math.floor(baseXP * Math.pow(PRACTICE_DIMINISH_FACTOR, sessionsToday)),
  );
}

// ============================================================================
// Level Thresholds
// ============================================================================

const LEVELS = [
  { level: 1, xpRequired: 0, label: "Beginner" },
  { level: 2, xpRequired: 150, label: "Explorer" },
  { level: 3, xpRequired: 400, label: "Practitioner" },
  { level: 4, xpRequired: 800, label: "Contributor" },
  { level: 5, xpRequired: 1500, label: "Expert" },
  { level: 6, xpRequired: 2500, label: "Master" },
];

const LEVEL_DEFAULTS = { maxLevel: 6, xpPerLevel: 150, levelScaling: 1.6 };

/**
 * Generate level thresholds from a level config.
 * Gap(N→N+1) = xpPerLevel × levelScaling^(N-1)
 */
function generateLevelThresholds(config?: {
  maxLevel?: number;
  xpPerLevel?: number;
  levelScaling?: number;
}): { level: number; xpRequired: number }[] {
  const max = Math.min(
    99,
    Math.max(1, config?.maxLevel ?? LEVEL_DEFAULTS.maxLevel),
  );
  const base = Math.max(1, config?.xpPerLevel ?? LEVEL_DEFAULTS.xpPerLevel);
  const scaling = Math.max(
    1,
    config?.levelScaling ?? LEVEL_DEFAULTS.levelScaling,
  );

  const thresholds: { level: number; xpRequired: number }[] = [];
  let cumulative = 0;

  for (let lvl = 1; lvl <= max; lvl++) {
    thresholds.push({ level: lvl, xpRequired: Math.round(cumulative) });
    if (lvl < max) {
      cumulative += base * Math.pow(scaling, lvl - 1);
    }
  }
  return thresholds;
}

function calculateLevel(
  totalXP: number,
  levelConfig?: {
    maxLevel?: number;
    xpPerLevel?: number;
    levelScaling?: number;
  },
): number {
  const thresholds = levelConfig
    ? generateLevelThresholds(levelConfig)
    : LEVELS;
  let level = 1;
  for (const l of thresholds) {
    if (totalXP >= l.xpRequired) level = l.level;
  }
  return level;
}

// ============================================================================
// Badge Criteria
// ============================================================================

interface BadgeCriteria {
  badgeType: string;
  check: (context: {
    xpLogs: any[];
    badges: any[];
    totalXP: number;
  }) => boolean;
}

const BADGE_CRITERIA: BadgeCriteria[] = [
  {
    badgeType: "FIRST_SUBMISSION",
    check: ({ xpLogs }) =>
      xpLogs.some((l: any) => l.reason === "HOMEWORK_SUBMITTED"),
  },
  {
    badgeType: "GOOD_EYE",
    check: ({ xpLogs }) =>
      xpLogs.some((l: any) => l.reason === "AI_FEEDBACK_REVISED"),
  },
  {
    badgeType: "QUICK_DRAW",
    check: ({ xpLogs }) =>
      xpLogs.some((l: any) => l.reason === "ON_TIME_SUBMISSION"),
  },
  {
    badgeType: "SHARPSHOOTER",
    check: ({ xpLogs }) =>
      xpLogs.filter((l: any) => l.reason === "PERFECT_SCORE").length >= 3,
  },
  {
    badgeType: "CONSISTENT",
    check: ({ xpLogs }) => xpLogs.some((l: any) => l.reason === "STREAK_7DAY"),
  },
  {
    badgeType: "TEAM_PLAYER",
    check: ({ xpLogs }) =>
      xpLogs.filter((l: any) => l.reason === "PEER_REVIEW_GIVEN").length >= 3,
  },
  {
    badgeType: "DEEP_THINKER",
    check: ({ xpLogs }) =>
      xpLogs.filter((l: any) => l.reason === "AI_FEEDBACK_REVISED").length >= 5,
  },
  {
    badgeType: "TOP_OF_CLASS",
    check: ({ xpLogs, totalXP }) =>
      // Approximation: awarded if student is high XP (500+). Full check requires leaderboard query.
      totalXP >= 500,
  },
  {
    badgeType: "PERFECTIONIST",
    check: ({ xpLogs }) =>
      xpLogs.filter((l: any) => l.reason === "PERFECT_SCORE").length >= 5,
  },
  {
    badgeType: "DRILL_MASTER",
    check: ({ xpLogs }) =>
      xpLogs.filter((l: any) => l.reason === "PRACTICE_DRILL_COMPLETED")
        .length >= 10,
  },
  {
    badgeType: "COMEBACK_KID",
    check: ({ xpLogs }) => xpLogs.some((l: any) => l.reason === "COMEBACK"),
  },
  {
    badgeType: "STREAK_14",
    check: ({ xpLogs }) => xpLogs.some((l: any) => l.reason === "STREAK_14DAY"),
  },
  {
    badgeType: "STREAK_30",
    check: ({ xpLogs }) => xpLogs.some((l: any) => l.reason === "STREAK_30DAY"),
  },
  {
    badgeType: "EASTER_EGG_HUNTER",
    check: ({ xpLogs }) =>
      xpLogs.filter((l: any) => l.reason === "EASTER_EGG").length >= 3,
  },
];

// ============================================================================
// Anti-Badge Criteria — badges of shame with debuffs
// ============================================================================

interface AntiBadgeCriteria {
  badgeType: string;
  check: (context: {
    xpLogs: any[];
    badges: any[];
    totalXP: number;
    profile: any;
  }) => boolean;
  debuff: {
    xpMultiplier?: number;
    xpMultiplierDurationHours?: number;
    streakFreezesRemoved?: number;
    avatarDowngrade?: string;
    shameText?: string;
    temporaryTitle?: string;
    cosmeticDurationHours?: number;
    extraDrills?: number;
    hideFromLeaderboard?: boolean;
    hideFromLeaderboardHours?: number;
  };
  redeemable: boolean;
}

const ANTI_BADGE_CRITERIA: AntiBadgeCriteria[] = [
  {
    badgeType: "CONSISTENTLY_WRONG",
    check: ({ xpLogs }) => {
      // Same referenceId with 0 XP (failed attempts) 5+ times
      const failMap = new Map<string, number>();
      for (const l of xpLogs) {
        if (l.xpAmount === 0 && l.referenceId) {
          failMap.set(l.referenceId, (failMap.get(l.referenceId) || 0) + 1);
        }
      }
      return Array.from(failMap.values()).some((c) => c >= 5);
    },
    debuff: {
      extraDrills: 2,
      temporaryTitle: "🔄 Consistently Wrong™",
      cosmeticDurationHours: 24,
      shameText:
        "Wrong answers given with such confidence they almost became right.",
    },
    redeemable: true,
  },
  {
    badgeType: "STREAK_BREAKER",
    check: ({ profile }) => {
      // Broke a 14+ day streak (longest > 14 but current is 0)
      return (
        (profile.longestStreak || 0) >= 14 && (profile.currentStreak || 0) === 0
      );
    },
    debuff: {
      streakFreezesRemoved: 2,
      xpMultiplier: 0.7,
      xpMultiplierDurationHours: 48,
      temporaryTitle: "💔 Streak Breaker",
      cosmeticDurationHours: 48,
      shameText:
        "14 days of dedication, shattered. Your streak didn't die — it was murdered.",
    },
    redeemable: true,
  },
  {
    badgeType: "SPEED_RUN_SCHOLAR",
    check: ({ xpLogs }) => {
      // Any homework submitted within 30 seconds of session start (check for very fast submissions)
      const submissions = xpLogs.filter(
        (l: any) => l.reason === "HOMEWORK_SUBMITTED",
      );
      if (submissions.length < 3) return false;
      // Check if 3+ submissions happened within 1 minute of each other (speed-running)
      const sorted = submissions
        .map((l: any) => new Date(l.createdAt).getTime())
        .sort((a: number, b: number) => a - b);
      for (let i = 0; i < sorted.length - 2; i++) {
        if (sorted[i + 2] - sorted[i] < 60000) return true; // 3 in 1 minute
      }
      return false;
    },
    debuff: {
      xpMultiplier: 0.5,
      xpMultiplierDurationHours: 6,
      temporaryTitle: "⚡ Speed Run Scholar",
      cosmeticDurationHours: 12,
      shameText: "Any% homework speedrun, no glitches (but also no reading).",
    },
    redeemable: true,
  },
  {
    badgeType: "THE_GHOST",
    check: ({ profile }) => {
      // No activity for 7+ days (lastActivityDate is old)
      if (!profile.lastActivityDate) return false;
      const lastActive = new Date(profile.lastActivityDate).getTime();
      const daysSince = (Date.now() - lastActive) / (1000 * 60 * 60 * 24);
      return daysSince >= 7;
    },
    debuff: {
      streakFreezesRemoved: 1,
      temporaryTitle: "👻 The Ghost",
      cosmeticDurationHours: 48,
      shameText:
        "They say if you whisper their username three times, they still won't log in.",
    },
    redeemable: true,
  },
  {
    badgeType: "XP_ZERO_HERO",
    check: ({ xpLogs }) => {
      // Has 10+ sessions (logs on 10+ distinct days) but at least one day with 0 XP earned
      const daySet = new Set(
        xpLogs.map((l: any) => l.createdAt?.split("T")[0]),
      );
      if (daySet.size < 5) return false;
      // Check if total XP across all logs is suspiciously low relative to sessions
      const totalXP = xpLogs.reduce(
        (s: number, l: any) => s + (l.xpAmount || 0),
        0,
      );
      return totalXP === 0 && xpLogs.length > 0;
    },
    debuff: {
      temporaryTitle: "🦸 Zero Hero",
      cosmeticDurationHours: 72,
      shameText:
        "In a system designed to give you points for breathing near homework, you earned none. Respect.",
    },
    redeemable: true,
  },
  {
    badgeType: "MINIMALLY_VIABLE_STUDENT",
    check: ({ xpLogs, totalXP }) => {
      // Consistently low accuracy — many submissions but low XP per submission
      const submissions = xpLogs.filter(
        (l: any) => l.reason === "HOMEWORK_SUBMITTED",
      );
      if (submissions.length < 5) return false;
      const avgXP = totalXP / submissions.length;
      // If average XP is less than half the base amount, they're barely passing
      return avgXP < 5;
    },
    debuff: {
      xpMultiplier: 0.85,
      xpMultiplierDurationHours: 48,
      temporaryTitle: "📉 MVP (Minimum Viable Participant)",
      cosmeticDurationHours: 48,
      shameText:
        "You found the exact minimum effort threshold. Engineers call this optimization. Teachers call it something else.",
    },
    redeemable: true,
  },
];

// ============================================================================
// Redemption Condition Types & Evaluation
// ============================================================================

type RedemptionConditionType =
  | "CONSECUTIVE_ON_TIME"
  | "LOGIN_STREAK"
  | "COMPLETE_ASSIGNMENT"
  | "ACCURACY_ABOVE"
  | "ACTIVITY_COUNT"
  | "BUILD_STREAK"
  | "SUBMIT_ANY"
  | "EARN_XP"
  | "COMPLETE_DRILLS"
  | "WAIT_PERIOD"
  | "SCORE_ON_TOPIC";

interface RedemptionCondition {
  type: RedemptionConditionType;
  count?: number;
  percent?: number;
  hours?: number;
  period?: "day" | "week";
}

/** Map badge types to their structured redemption conditions */
const REDEMPTION_CONDITIONS: Record<string, RedemptionCondition> = {
  FASHIONABLY_LATE: { type: "CONSECUTIVE_ON_TIME", count: 3 },
  THE_GHOST: { type: "LOGIN_STREAK", count: 3 },
  HOMEWORK_ATE_MY_DOG: { type: "COMPLETE_ASSIGNMENT" },
  SPEED_RUN_SCHOLAR: { type: "SUBMIT_ANY" },
  CONSISTENTLY_WRONG: { type: "ACCURACY_ABOVE", percent: 50 },
  COPY_PASTE_CONNOISSEUR: { type: "SUBMIT_ANY" },
  LEADERBOARD_LURKER: { type: "WAIT_PERIOD", hours: 24 },
  PROCRASTINATION_PRODIGY: { type: "ACTIVITY_COUNT", count: 3, period: "day" },
  SELECTIVE_AMNESIA: { type: "SUBMIT_ANY" },
  SYLLABUS_SKEPTIC: { type: "SUBMIT_ANY" },
  EXTRA_CREDIT_ADDICT: { type: "COMPLETE_ASSIGNMENT" },
  AI_WHISPERER_GONE_WRONG: { type: "SUBMIT_ANY" },
  STREAK_BREAKER: { type: "BUILD_STREAK", count: 7 },
  THE_DRILL_DODGER: { type: "COMPLETE_DRILLS", count: 3 },
  TAB_SURFER: { type: "COMPLETE_ASSIGNMENT" },
  LOREM_IPSUM_LAUREATE: { type: "SUBMIT_ANY" },
  XP_ZERO_HERO: { type: "EARN_XP", count: 1 },
  DUNNING_KRUGER_AWARD: { type: "SCORE_ON_TOPIC", percent: 80 },
  THE_TUTORIAL_SKIPPER: { type: "COMPLETE_ASSIGNMENT" },
  INFINITE_LOOP_LEARNER: { type: "SUBMIT_ANY" },
  MINIMALLY_VIABLE_STUDENT: { type: "ACCURACY_ABOVE", percent: 90 },
  EMPTY_CANVAS_ARTIST: { type: "SUBMIT_ANY" },
  BUG_REPORT_OR_EXCUSE: { type: "SUBMIT_ANY" },
};

/**
 * Evaluate whether a redemption condition is met for a given anti-badge.
 * Returns true if the badge should be automatically cleared.
 */
function evaluateRedemption(
  badgeType: string,
  context: {
    xpLogs: any[];
    profile: any;
    badge: any; // The anti-badge entry (has appliedAt, count, etc.)
  },
): boolean {
  const condition = REDEMPTION_CONDITIONS[badgeType];
  if (!condition) return false;

  const { xpLogs, profile, badge } = context;
  const appliedAt = badge.awardedAt ? new Date(badge.awardedAt).getTime() : 0;

  switch (condition.type) {
    case "SUBMIT_ANY": {
      // Any submission after the badge was awarded
      return xpLogs.some(
        (l: any) =>
          l.reason === "HOMEWORK_SUBMITTED" &&
          new Date(l.createdAt).getTime() > appliedAt,
      );
    }

    case "CONSECUTIVE_ON_TIME": {
      // N on-time submissions after badge award
      const threshold = condition.count || 3;
      const onTimeSubs = xpLogs.filter(
        (l: any) =>
          l.reason === "ON_TIME_SUBMISSION" &&
          new Date(l.createdAt).getTime() > appliedAt,
      );
      return onTimeSubs.length >= threshold;
    }

    case "LOGIN_STREAK": {
      // Current streak >= N (means they logged in N consecutive days)
      const threshold = condition.count || 3;
      return (profile.currentStreak || 0) >= threshold;
    }

    case "BUILD_STREAK": {
      // Current streak >= N
      const threshold = condition.count || 7;
      return (profile.currentStreak || 0) >= threshold;
    }

    case "COMPLETE_ASSIGNMENT": {
      // Any homework submission after badge was awarded (same as SUBMIT_ANY but for clarity)
      return xpLogs.some(
        (l: any) =>
          l.reason === "HOMEWORK_SUBMITTED" &&
          new Date(l.createdAt).getTime() > appliedAt,
      );
    }

    case "ACCURACY_ABOVE": {
      // Any submission with XP above threshold (high xp = high accuracy)
      const threshold = condition.percent || 70;
      // Check recent grades via XP logs — XP > 0 with high amount indicates accuracy
      // We use the raw accuracy from logs if available, otherwise check xpAmount threshold
      return xpLogs.some(
        (l: any) =>
          l.reason === "HOMEWORK_SUBMITTED" &&
          new Date(l.createdAt).getTime() > appliedAt &&
          (l.accuracy || 0) >= threshold,
      );
    }

    case "SCORE_ON_TOPIC": {
      // Same as ACCURACY_ABOVE but checks for same unitID as the badge
      const threshold = condition.percent || 80;
      const badgeUnitID = badge.unitID;
      return xpLogs.some(
        (l: any) =>
          l.reason === "HOMEWORK_SUBMITTED" &&
          new Date(l.createdAt).getTime() > appliedAt &&
          (l.accuracy || 0) >= threshold &&
          (!badgeUnitID || l.unitID === badgeUnitID),
      );
    }

    case "ACTIVITY_COUNT": {
      // N activities within the period (day/week) after badge award
      const threshold = condition.count || 3;
      const periodMs =
        condition.period === "week"
          ? 7 * 24 * 60 * 60 * 1000
          : 24 * 60 * 60 * 1000;
      const now = Date.now();
      const windowStart = now - periodMs;
      const recentActivities = xpLogs.filter(
        (l: any) =>
          new Date(l.createdAt).getTime() > Math.max(appliedAt, windowStart) &&
          (l.xpAmount || 0) > 0,
      );
      return recentActivities.length >= threshold;
    }

    case "EARN_XP": {
      // Earned at least N XP since badge was awarded
      const threshold = condition.count || 1;
      const earnedSince = xpLogs
        .filter(
          (l: any) =>
            new Date(l.createdAt).getTime() > appliedAt &&
            (l.xpAmount || 0) > 0,
        )
        .reduce((sum: number, l: any) => sum + (l.xpAmount || 0), 0);
      return earnedSince >= threshold;
    }

    case "COMPLETE_DRILLS": {
      // N practice drill completions after badge award
      const threshold = condition.count || 3;
      const drills = xpLogs.filter(
        (l: any) =>
          l.reason === "PRACTICE_DRILL_COMPLETED" &&
          new Date(l.createdAt).getTime() > appliedAt,
      );
      return drills.length >= threshold;
    }

    case "WAIT_PERIOD": {
      // Automatic: enough time has passed since badge award
      const hours = condition.hours || 24;
      const elapsed = Date.now() - appliedAt;
      return elapsed >= hours * 60 * 60 * 1000;
    }

    default:
      return false;
  }
}

// ============================================================================
// Configure Amplify (once)
// ============================================================================

let client: any = null;

function getClient() {
  if (!client) {
    Amplify.configure(
      {
        API: {
          GraphQL: {
            endpoint: process.env.API_ENDPOINT || "",
            region: process.env.AWS_REGION || "us-east-1",
            defaultAuthMode: "iam",
          },
        },
      },
      {
        Auth: {
          credentialsProvider: {
            getCredentialsAndIdentityId: async () => ({
              credentials: await fromEnv()(),
            }),
            clearCredentialsAndIdentityId: () => {},
          },
        },
      },
    );
    client = generateClient({ authMode: "iam" });
  }
  return client;
}

// ============================================================================
// Handler
// ============================================================================

export const handler: Handler = async (event) => {
  const { fieldName, arguments: args, identity } = event;
  const gqlClient = getClient();

  try {
    switch (fieldName) {
      case "awardXP":
        return await handleAwardXP(gqlClient, args, identity);
      case "checkBadges":
        return await handleCheckBadges(gqlClient, args);
      case "updateStreak":
        return await handleUpdateStreak(gqlClient, args);
      case "rebuildLeaderboard":
        return await handleRebuildLeaderboard(gqlClient, args);
      case "upsertStudentMemory":
        return await handleUpdateStudentMemory(gqlClient, args);
      case "bootstrapStudentMemory":
        return await handleBootstrapStudentMemory(gqlClient, args);
      case "updateStudentUnitMemoryFromGrade":
        return await handleUpdateStudentUnitMemory(gqlClient, args);
      case "rebuildStudentMemoryProfile":
        return await handleRebuildStudentMemoryProfile(gqlClient, args);
      case "checkPersonalBest":
        return await handleCheckPersonalBest(gqlClient, args);
      case "recomputeProgress":
        return await handleRecomputeProgress(gqlClient, args);
      case "checkEasterEggs":
        return await handleCheckEasterEggs(gqlClient, args);
      case "discoverEasterEgg":
        return await handleDiscoverEasterEgg(gqlClient, args);
      case "updateGuildXP":
        return await handleUpdateGuildXP(gqlClient, args);
      case "contributeToChallenge":
        return await handleContributeToChallenge(gqlClient, args);
      case "generateSkillTree":
        return await handleGenerateSkillTree(gqlClient, args);
      case "advanceSkillProgress":
        return await handleAdvanceSkillProgress(gqlClient, args);
      case "claimStorybookBadges":
        return await handleClaimStorybookBadges(gqlClient, args, identity);
      case "applyBattleStakes":
        return await handleApplyBattleStakes(gqlClient, args);
      default:
        throw new Error(`Unknown operation: ${fieldName}`);
    }
  } catch (error: any) {
    console.error(`[gamification] ${fieldName} error:`, error);
    throw error;
  }
};

// ============================================================================
// awardXP — Creates an XP log entry and returns the new total
// ============================================================================

async function handleAwardXP(
  gqlClient: any,
  args: {
    studentId: string;
    reason: string;
    referenceId?: string;
    cohortId?: string;
    unitID?: string;
    accuracy?: number;
  },
  identity: any,
) {
  const { studentId, reason, referenceId, cohortId, unitID, accuracy } = args;
  let xpAmount = XP_AMOUNTS[reason];
  if (!xpAmount) throw new Error(`Invalid XP reason: ${reason}`);

  // ---- Load section XP config (multipliers + caps + levels) ----
  let xpConfig: {
    multipliers?: Record<string, number>;
    dailyCap?: number;
    weeklyCap?: number;
    enabled?: boolean;
    levelConfig?: {
      maxLevel?: number;
      xpPerLevel?: number;
      levelScaling?: number;
    };
  } = {};
  if (cohortId) {
    try {
      const { data: sectionData } = await gqlClient.graphql({
        query: GET_SECTION,
        variables: { id: cohortId },
      });
      const rawConfig = sectionData?.getSection?.xpConfig;
      if (rawConfig) {
        xpConfig =
          typeof rawConfig === "string" ? JSON.parse(rawConfig) : rawConfig;
      }
    } catch (err) {
      console.warn("[gamification] Failed to load section xpConfig:", err);
    }
  }

  // If XP is disabled for this section, return early
  if (xpConfig.enabled === false) {
    return { alreadyAwarded: false, xpAmount: 0, totalXP: 0, xpDisabled: true };
  }

  // Apply per-action multiplier from section config
  if (xpConfig.multipliers && xpConfig.multipliers[reason] !== undefined) {
    xpAmount = Math.round(xpAmount * xpConfig.multipliers[reason]);
  }

  // Apply active debuff XP multipliers from anti-badges
  if (cohortId) {
    try {
      const profile = await getOrCreateStudentProfile(
        gqlClient,
        studentId,
        cohortId,
      );
      const activeDebuffs = getActiveDebuffs(profile);
      for (const debuff of activeDebuffs) {
        if (debuff.xpMultiplier !== undefined && debuff.xpMultiplier < 1) {
          xpAmount = Math.round(xpAmount * debuff.xpMultiplier);
        }
      }
    } catch (err) {
      console.warn("[gamification] Failed to check debuffs:", err);
    }
  }

  // If multiplier reduced to 0, skip award
  if (xpAmount <= 0) {
    return { alreadyAwarded: false, xpAmount: 0, totalXP: 0, xpDisabled: true };
  }

  // Fetch logs upfront — needed for both duplicate check and diminishing returns
  const { data: allLogsResult } = await gqlClient.graphql({
    query: LIST_XP_LOGS_BY_STUDENT,
    variables: { studentId },
  });
  const allLogs = allLogsResult?.listStudentXPLogByStudentId?.items || [];

  // Apply diminishing returns for practice drill XP reasons
  if (
    reason === "PRACTICE_DRILL_COMPLETED" ||
    reason === "PRACTICE_DRILL_ACCURACY_BONUS"
  ) {
    const todayStr = new Date().toISOString().split("T")[0];
    const todayPracticeLogs = allLogs.filter(
      (l: any) => l.reason === reason && l.createdAt?.startsWith(todayStr),
    );
    xpAmount = calculatePracticeDrillXP(xpAmount, todayPracticeLogs.length);
  }

  // Prevent duplicate XP for same action+reference
  if (referenceId) {
    const duplicate = allLogs.find(
      (l: any) => l.reason === reason && l.referenceId === referenceId,
    );
    if (duplicate) {
      return {
        alreadyAwarded: true,
        xpAmount: 0,
        totalXP: allLogs.reduce((s: number, l: any) => s + l.xpAmount, 0),
      };
    }
  }

  // ---- Enforce daily/weekly XP caps ----
  if (xpConfig.dailyCap && xpConfig.dailyCap > 0) {
    const todayStr = new Date().toISOString().split("T")[0];
    const todayXP = allLogs
      .filter(
        (l: any) =>
          l.createdAt?.startsWith(todayStr) &&
          (!cohortId || l.cohortId === cohortId),
      )
      .reduce((s: number, l: any) => s + l.xpAmount, 0);
    if (todayXP >= xpConfig.dailyCap) {
      return {
        alreadyAwarded: false,
        xpAmount: 0,
        totalXP: allLogs.reduce((s: number, l: any) => s + l.xpAmount, 0),
        capReached: "daily",
      };
    }
    // Clamp to remaining daily allowance
    xpAmount = Math.min(xpAmount, xpConfig.dailyCap - todayXP);
  }

  if (xpConfig.weeklyCap && xpConfig.weeklyCap > 0) {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Sunday
    weekStart.setHours(0, 0, 0, 0);
    const weekStartISO = weekStart.toISOString();
    const weekXP = allLogs
      .filter(
        (l: any) =>
          l.createdAt >= weekStartISO && (!cohortId || l.cohortId === cohortId),
      )
      .reduce((s: number, l: any) => s + l.xpAmount, 0);
    if (weekXP >= xpConfig.weeklyCap) {
      return {
        alreadyAwarded: false,
        xpAmount: 0,
        totalXP: allLogs.reduce((s: number, l: any) => s + l.xpAmount, 0),
        capReached: "weekly",
      };
    }
    xpAmount = Math.min(xpAmount, xpConfig.weeklyCap - weekXP);
  }

  // Create log entry
  await gqlClient.graphql({
    query: CREATE_XP_LOG,
    variables: {
      input: {
        studentId,
        xpAmount,
        reason,
        accuracy: accuracy != null ? accuracy : null,
        referenceId: referenceId || null,
        cohortId: cohortId || null,
        unitID: unitID || null,
      },
    },
  });

  // Calculate new total (re-fetch to include the newly created log)
  const { data: updatedLogsResult } = await gqlClient.graphql({
    query: LIST_XP_LOGS_BY_STUDENT,
    variables: { studentId },
  });
  const totalXP = (
    updatedLogsResult?.listStudentXPLogByStudentId?.items || []
  ).reduce((sum: number, l: any) => sum + l.xpAmount, 0);

  // Sync totalXP + level to StudentProfile
  try {
    const profile = await getOrCreateStudentProfile(
      gqlClient,
      studentId,
      cohortId,
    );
    const newLevel = calculateLevel(totalXP, xpConfig.levelConfig);
    await gqlClient.graphql({
      query: UPDATE_STUDENT_PROFILE,
      variables: {
        input: {
          id: profile.id,
          totalXP,
          level: newLevel,
          _version: profile._version,
        },
      },
    });
  } catch (err) {
    console.error("[gamification] syncXPToProfile error:", err);
  }

  // Auto-check badges after awarding XP
  try {
    await handleCheckBadges(gqlClient, { studentId, cohortId, unitID });
  } catch (err) {
    console.error("[gamification] Auto-checkBadges after awardXP failed:", err);
  }

  return { alreadyAwarded: false, xpAmount, totalXP };
}

// ============================================================================
// Debuff Helpers — manage active debuff state on StudentProfile
// ============================================================================

interface ActiveDebuff {
  badgeType: string;
  appliedAt: string;
  expiresAt: string;
  xpMultiplier?: number;
  temporaryTitle?: string;
  shameText?: string;
  avatarDowngrade?: string;
  hideFromLeaderboard?: boolean;
  extraDrills?: number;
}

/** Parse and filter active (non-expired) debuffs from the profile */
function getActiveDebuffs(profile: any): ActiveDebuff[] {
  try {
    const raw =
      typeof profile.activeDebuffs === "string"
        ? JSON.parse(profile.activeDebuffs || "[]")
        : profile.activeDebuffs || [];
    const now = Date.now();
    return raw.filter(
      (d: ActiveDebuff) => new Date(d.expiresAt).getTime() > now,
    );
  } catch {
    return [];
  }
}

/** Add a new debuff from an anti-badge */
function applyDebuff(
  debuffs: ActiveDebuff[],
  badgeType: string,
  debuffConfig: AntiBadgeCriteria["debuff"],
): void {
  const durationHours = debuffConfig.cosmeticDurationHours || 24;
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + durationHours * 60 * 60 * 1000,
  ).toISOString();

  debuffs.push({
    badgeType,
    appliedAt: now.toISOString(),
    expiresAt,
    xpMultiplier: debuffConfig.xpMultiplier,
    temporaryTitle: debuffConfig.temporaryTitle,
    shameText: debuffConfig.shameText,
    avatarDowngrade: debuffConfig.avatarDowngrade,
    hideFromLeaderboard: debuffConfig.hideFromLeaderboard,
    extraDrills: debuffConfig.extraDrills,
  });
}

/** Refresh an existing debuff's expiry (for repeated offenses) */
function refreshDebuff(
  debuffs: ActiveDebuff[],
  badgeType: string,
  debuffConfig: AntiBadgeCriteria["debuff"],
): void {
  const durationHours = debuffConfig.cosmeticDurationHours || 24;
  const expiresAt = new Date(
    Date.now() + durationHours * 60 * 60 * 1000,
  ).toISOString();

  const existing = debuffs.find((d) => d.badgeType === badgeType);
  if (existing) {
    existing.expiresAt = expiresAt;
    existing.appliedAt = new Date().toISOString();
  } else {
    applyDebuff(debuffs, badgeType, debuffConfig);
  }
}

// ============================================================================
// checkBadges — Evaluates badge criteria and awards new badges
// ============================================================================

async function handleCheckBadges(
  gqlClient: any,
  args: { studentId: string; cohortId?: string; unitID?: string },
) {
  const { studentId, cohortId, unitID } = args;

  // Fetch XP logs and existing badges from StudentProfile
  const [xpResult, profile] = await Promise.all([
    gqlClient.graphql({
      query: LIST_XP_LOGS_BY_STUDENT,
      variables: { studentId },
    }),
    getOrCreateStudentProfile(gqlClient, studentId, cohortId),
  ]);

  const xpLogs = xpResult?.data?.listStudentXPLogByStudentId?.items || [];
  const existingBadges: any[] = (() => {
    try {
      return JSON.parse(profile.badges || "[]");
    } catch {
      return [];
    }
  })();
  const existingByType = new Map<string, any>(
    existingBadges.map((b: any) => [b.badgeType, b]),
  );
  const totalXP = xpLogs.reduce((s: number, l: any) => s + l.xpAmount, 0);

  const newBadges: string[] = [];
  const updatedBadges: string[] = [];

  for (const criteria of BADGE_CRITERIA) {
    if (!criteria.check({ xpLogs, badges: existingBadges, totalXP })) continue;

    const existing = existingByType.get(criteria.badgeType);
    if (existing) {
      // Badge already earned — increment count
      existing.count = (existing.count || 1) + 1;
      existing.awardedAt = new Date().toISOString();
      if (cohortId) existing.cohortId = cohortId;
      if (unitID) existing.unitID = unitID;
      updatedBadges.push(criteria.badgeType);
    } else {
      // First time earning this badge
      const newBadge = {
        badgeType: criteria.badgeType,
        awardedAt: new Date().toISOString(),
        cohortId: cohortId || null,
        unitID: unitID || null,
        count: 1,
      };
      existingBadges.push(newBadge);
      existingByType.set(criteria.badgeType, newBadge);
      newBadges.push(criteria.badgeType);
    }
  }

  // ---- Check anti-badge criteria ----
  const newAntiBadges: string[] = [];
  const activeDebuffs: any[] = getActiveDebuffs(profile);

  for (const criteria of ANTI_BADGE_CRITERIA) {
    if (!criteria.check({ xpLogs, badges: existingBadges, totalXP, profile }))
      continue;

    const existing = existingByType.get(criteria.badgeType);
    if (existing) {
      // Anti-badge already earned — increment count, refresh debuff
      existing.count = (existing.count || 1) + 1;
      existing.awardedAt = new Date().toISOString();
      if (cohortId) existing.cohortId = cohortId;
      // Refresh debuff duration
      refreshDebuff(activeDebuffs, criteria.badgeType, criteria.debuff);
    } else {
      // First time earning this anti-badge
      const antiBadge = {
        badgeType: criteria.badgeType,
        awardedAt: new Date().toISOString(),
        cohortId: cohortId || null,
        unitID: unitID || null,
        count: 1,
        isAnti: true,
      };
      existingBadges.push(antiBadge);
      existingByType.set(criteria.badgeType, antiBadge);
      newAntiBadges.push(criteria.badgeType);
      // Apply debuff
      applyDebuff(activeDebuffs, criteria.badgeType, criteria.debuff);
    }
  }

  // ---- Auto-redeem anti-badges whose conditions are now met ----
  const redeemedBadges: string[] = [];
  const badgesToRemove: Set<string> = new Set();

  for (const badge of existingBadges) {
    if (!badge.isAnti) continue;
    if (!REDEMPTION_CONDITIONS[badge.badgeType]) continue;

    const isRedeemed = evaluateRedemption(badge.badgeType, {
      xpLogs,
      profile,
      badge,
    });

    if (isRedeemed) {
      badgesToRemove.add(badge.badgeType);
      redeemedBadges.push(badge.badgeType);
      // Also remove the associated debuff
      const debuffIdx = activeDebuffs.findIndex(
        (d) => d.badgeType === badge.badgeType,
      );
      if (debuffIdx >= 0) activeDebuffs.splice(debuffIdx, 1);
    }
  }

  // Remove redeemed anti-badges from the badges array
  if (badgesToRemove.size > 0) {
    for (let i = existingBadges.length - 1; i >= 0; i--) {
      if (badgesToRemove.has(existingBadges[i].badgeType)) {
        existingBadges.splice(i, 1);
      }
    }
    // Also remove from the map
    for (const bt of badgesToRemove) {
      existingByType.delete(bt);
    }
    console.log(
      `[gamification] Auto-redeemed ${redeemedBadges.length} anti-badges:`,
      redeemedBadges,
    );
  }

  // Apply streak freeze removal from new anti-badge debuffs
  let freezesPenalty = 0;
  for (const ab of newAntiBadges) {
    const criteria = ANTI_BADGE_CRITERIA.find((c) => c.badgeType === ab);
    if (criteria?.debuff.streakFreezesRemoved) {
      freezesPenalty += criteria.debuff.streakFreezesRemoved;
    }
  }

  // Write updated badges + debuffs to StudentProfile
  const updateInput: any = {
    id: profile.id,
    badges: JSON.stringify(existingBadges),
    activeDebuffs: JSON.stringify(activeDebuffs),
    _version: profile._version,
  };
  if (freezesPenalty > 0) {
    const currentFreezes = profile.freezesRemaining || 0;
    updateInput.freezesRemaining = Math.max(0, currentFreezes - freezesPenalty);
  }

  try {
    await gqlClient.graphql({
      query: UPDATE_STUDENT_PROFILE,
      variables: { input: updateInput },
    });
  } catch (err) {
    console.error(
      "[gamification] handleCheckBadges profile update error:",
      err,
    );
  }

  return {
    newBadges,
    updatedBadges,
    newAntiBadges,
    redeemedBadges,
    totalBadges: existingBadges.length,
  };
}

// ============================================================================
// updateStreak — Updates the student's activity streak
// ============================================================================

async function handleUpdateStreak(gqlClient: any, args: { studentId: string }) {
  const { studentId } = args;
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  // Read streak data from StudentProfile
  const profile = await getOrCreateStudentProfile(gqlClient, studentId);
  const existingStreak = profile.currentStreak || 0;
  const existingLongest = profile.longestStreak || 0;
  const lastActivity = profile.lastActivityDate || null;
  let freezesRemaining = profile.freezesRemaining || 0;
  let freezesUsed = profile.freezesUsed || 0;

  if (!lastActivity && existingStreak === 0) {
    // First activity ever — write streak to profile
    await gqlClient.graphql({
      query: UPDATE_STUDENT_PROFILE,
      variables: {
        input: {
          id: profile.id,
          currentStreak: 1,
          longestStreak: 1,
          lastActivityDate: today,
          freezesRemaining: 0,
          freezesUsed: 0,
          _version: profile._version,
        },
      },
    });
    return { currentStreak: 1, longestStreak: 1, lastActivityDate: today };
  }

  // Already active today
  if (lastActivity === today) {
    return {
      currentStreak: existingStreak,
      longestStreak: existingLongest,
      lastActivityDate: today,
    };
  }

  // Check days since last activity
  const lastDate = new Date(lastActivity);
  const todayDate = new Date(today);
  const diffDays = Math.floor(
    (todayDate.getTime() - lastDate.getTime()) / (86400 * 1000),
  );

  let newStreak: number;
  let comebackTriggered = false;
  let streakXPReason: string | null = null;

  if (diffDays === 1) {
    // Consecutive day
    newStreak = existingStreak + 1;
  } else if (diffDays === 2 && freezesRemaining > 0) {
    // Missed exactly 1 day — use a freeze
    newStreak = existingStreak + 1;
    freezesRemaining -= 1;
    freezesUsed += 1;
  } else if (diffDays > 7) {
    // Comeback — student returned after extended absence
    newStreak = 1;
    comebackTriggered = true;
  } else {
    // Streak broken (missed 2+ days without freeze)
    newStreak = 1;
  }

  // Award streak freeze at 7-day milestones
  if (newStreak > 0 && newStreak % 7 === 0) {
    freezesRemaining += 1;
  }

  // Determine streak milestone XP
  if (newStreak === 3) streakXPReason = "STREAK_3DAY";
  else if (newStreak === 7) streakXPReason = "STREAK_7DAY";
  else if (newStreak === 14) streakXPReason = "STREAK_14DAY";
  else if (newStreak === 30) streakXPReason = "STREAK_30DAY";

  const longestStreak = Math.max(existingLongest, newStreak);

  // Write updated streak directly to StudentProfile
  await gqlClient.graphql({
    query: UPDATE_STUDENT_PROFILE,
    variables: {
      input: {
        id: profile.id,
        currentStreak: newStreak,
        longestStreak,
        lastActivityDate: today,
        freezesRemaining,
        freezesUsed,
        _version: profile._version,
      },
    },
  });

  // Award streak milestone XP (fire-and-forget)
  if (streakXPReason) {
    try {
      await handleAwardXP(
        gqlClient,
        {
          studentId,
          reason: streakXPReason,
          referenceId: `streak-${newStreak}-${today}`,
        },
        null,
      );
    } catch (err) {
      console.error("[gamification] streak milestone XP error:", err);
    }
  }

  // Award comeback XP if triggered
  if (comebackTriggered) {
    try {
      await handleAwardXP(
        gqlClient,
        { studentId, reason: "COMEBACK", referenceId: `comeback-${today}` },
        null,
      );
    } catch (err) {
      console.error("[gamification] comeback XP error:", err);
    }
  }

  return {
    currentStreak: newStreak,
    longestStreak,
    lastActivityDate: today,
    comebackTriggered,
    freezeUsed: diffDays === 2 && freezesRemaining < profile.freezesRemaining,
  };
}

// ============================================================================
// rebuildLeaderboard — Rebuilds leaderboard fields on StudentProfile for a cohort
// ============================================================================

async function handleRebuildLeaderboard(
  gqlClient: any,
  args: { cohortId: string },
) {
  const { cohortId } = args;

  // Check if leaderboard is enabled for this section
  const { data: sectionResult } = await gqlClient.graphql({
    query: GET_SECTION,
    variables: { id: cohortId },
  });
  const section = sectionResult?.getSection;
  if (section?.leaderboardEnabled === false) {
    return { updated: 0, created: 0, total: 0 };
  }

  // Get all grades for this section to find student IDs
  const { data: gradesResult } = await gqlClient.graphql({
    query: LIST_GRADES_BY_SECTION,
    variables: { sectionID: cohortId },
  });
  const grades = gradesResult?.listGradeBySectionID?.items || [];

  // Unique students
  const studentIds = [
    ...new Set(grades.map((g: any) => g.owner).filter(Boolean)),
  ] as string[];

  // Fetch all XP logs for this cohort in one query
  const { data: cohortXpResult } = await gqlClient.graphql({
    query: LIST_XP_LOGS_FOR_COHORT,
    variables: { cohortId },
  });
  const allCohortXpLogs =
    cohortXpResult?.listStudentXPLogByCohortId?.items || [];

  // Group XP logs by studentId
  const xpLogsByStudent = new Map<string, any[]>();
  for (const log of allCohortXpLogs) {
    if (!log?.studentId) continue;
    const existing = xpLogsByStudent.get(log.studentId) || [];
    existing.push(log);
    xpLogsByStudent.set(log.studentId, existing);
  }

  let updated = 0;

  for (const studentId of studentIds) {
    // Get XP total for this cohort only
    const xpLogs = xpLogsByStudent.get(studentId) || [];
    const totalXP = xpLogs.reduce((s: number, l: any) => s + l.xpAmount, 0);

    const level = calculateLevel(totalXP);
    const completedAssignments = grades.filter(
      (g: any) => g.owner === studentId && g.complete,
    ).length;

    // Count nailed-it XP awards
    const nailedItCount = xpLogs.filter(
      (l: any) => l.reason === "NAILED_IT",
    ).length;

    // Update StudentProfile with computed leaderboard fields
    try {
      const profile = await getOrCreateStudentProfile(
        gqlClient,
        studentId,
        cohortId,
      );
      await gqlClient.graphql({
        query: UPDATE_STUDENT_PROFILE,
        variables: {
          input: {
            id: profile.id,
            totalXP,
            level,
            completedAssignments,
            nailedItCount,
            lastUpdated: new Date().toISOString(),
            _version: profile._version,
          },
        },
      });
      updated++;
    } catch (err) {
      console.error(
        `[gamification] rebuildLeaderboard(${studentId}) error:`,
        err,
      );
    }
  }

  return { updated, total: studentIds.length };
}

// ============================================================================
// updateStudentMemory — Appends AI feedback to student's memory markdown
// ============================================================================

async function handleUpdateStudentMemory(
  gqlClient: any,
  args: { studentId: string; feedbackMarkdown: string; source: string },
) {
  const { studentId, feedbackMarkdown, source } = args;

  const { data: memResult } = await gqlClient.graphql({
    query: GET_STUDENT_MEMORY,
    variables: { studentId },
  });
  const entries = memResult?.listStudentMemoryByStudentId?.items || [];
  const existing = entries[0];

  const timestamp = new Date().toISOString();
  const newSection = `\n\n---\n### ${source} (${timestamp})\n${feedbackMarkdown}`;

  if (existing) {
    const updatedMarkdown = existing.memoryMarkdown + newSection;
    const { data: updated } = await gqlClient.graphql({
      query: UPDATE_STUDENT_MEMORY,
      variables: {
        input: {
          id: existing.id,
          memoryMarkdown: updatedMarkdown,
          lastUpdatedBy: source,
          version: (existing.version || 0) + 1,
          _version: existing._version,
        },
      },
    });
    return updated.updateStudentMemory;
  } else {
    const { data: created } = await gqlClient.graphql({
      query: CREATE_STUDENT_MEMORY,
      variables: {
        input: {
          studentId,
          memoryMarkdown: `# Student Memory\n\nAutomatically maintained by AI feedback system.${newSection}`,
          lastUpdatedBy: source,
          version: 1,
        },
      },
    });
    return created.createStudentMemory;
  }
}

// ============================================================================
// bootstrapStudentMemory — One-time memory generation for existing students
// ============================================================================

const LIST_ALL_GRADES = `query ListGrades($nextToken: String) {
  listGrades(limit: 1000, nextToken: $nextToken) {
    items { id owner accuracy complete data _version _lastChangedAt _deleted }
    nextToken
  }
}`;

async function handleBootstrapStudentMemory(
  gqlClient: any,
  args: { studentId: string },
) {
  const { studentId } = args;

  // Check if memory already exists
  const { data: memResult } = await gqlClient.graphql({
    query: GET_STUDENT_MEMORY,
    variables: { studentId },
  });
  const existing = memResult?.listStudentMemoryByStudentId?.items?.[0];
  if (existing) {
    return { skipped: true, message: "Memory already exists for this student" };
  }

  // Fetch all grades for this student
  const { data: xpResult } = await gqlClient.graphql({
    query: LIST_XP_LOGS_BY_STUDENT,
    variables: { studentId },
  });
  const xpLogs = xpResult?.listStudentXPLogByStudentId?.items || [];
  const totalXP = xpLogs.reduce((s: number, l: any) => s + l.xpAmount, 0);
  const level = calculateLevel(totalXP);
  const levelInfo = LEVELS.find((l) => l.level === level) || LEVELS[0];

  // Get badges from StudentProfile
  const profile = await getOrCreateStudentProfile(gqlClient, studentId);
  const badges: any[] = (() => {
    try {
      return JSON.parse(profile.badges || "[]");
    } catch {
      return [];
    }
  })();

  // Count submissions and nailed-its
  const submissions = xpLogs.filter(
    (l: any) => l.reason === "HOMEWORK_SUBMITTED",
  ).length;
  const nailedIts = xpLogs.filter((l: any) => l.reason === "NAILED_IT").length;
  const revisions = xpLogs.filter(
    (l: any) => l.reason === "AI_FEEDBACK_REVISED",
  ).length;
  const peerReviews = xpLogs.filter(
    (l: any) =>
      l.reason === "PEER_REVIEW_GIVEN" || l.reason === "PEER_REVIEW_HOSTED",
  ).length;

  // Build initial memory document
  const memoryMarkdown = `# Student Memory: ${studentId}
Last Updated: ${new Date().toISOString()}

## Learning Profile
- Current Level: ${levelInfo.label} (Level ${level})
- Total XP: ${totalXP}
- Assignments Submitted: ${submissions}
- Revisions After Feedback: ${revisions}
- Peer Reviews: ${peerReviews}

## Achievements
${badges.length > 0 ? badges.map((b: any) => `- ${b.badgeType} (${b.awardedAt})`).join("\n") : "- No badges earned yet"}

## Nailed It Moments
${nailedIts > 0 ? `- ${nailedIts} blocks flagged as excellent by AI` : "- None yet"}

## Notes for AI Tutor
- This memory was auto-generated from existing activity history.
- Observe the student's responses to build a more detailed profile over time.
`;

  const { data: created } = await gqlClient.graphql({
    query: CREATE_STUDENT_MEMORY,
    variables: {
      input: {
        studentId,
        memoryMarkdown,
        lastUpdatedBy: "bootstrap",
        version: 1,
      },
    },
  });

  return { created: true, id: created.createStudentMemory.id };
}

// ============================================================================
// updateStudentUnitMemory — Incremental merge of per-unit learning data
// ============================================================================

interface ConceptEntry {
  concept: string;
  sourceType: string;
  frequency: number;
  lastSeen: string;
}

interface ConfusionPair {
  item1: string;
  item2: string;
  frequency: number;
}

const WEAK_THRESHOLD = 70;
const STRONG_THRESHOLD = 90;
const REVIEW_PRIORITY_DECAY_DAYS = 7;

function mergeConceptLists(
  existing: ConceptEntry[],
  incoming: string[],
  sourceType: string,
  timestamp: string,
): ConceptEntry[] {
  const map = new Map<string, ConceptEntry>();
  for (const e of existing) {
    map.set(e.concept, e);
  }
  for (const concept of incoming) {
    const prev = map.get(concept);
    if (prev) {
      map.set(concept, {
        ...prev,
        frequency: prev.frequency + 1,
        lastSeen: timestamp,
      });
    } else {
      map.set(concept, {
        concept,
        sourceType,
        frequency: 1,
        lastSeen: timestamp,
      });
    }
  }
  return Array.from(map.values());
}

function calculateReviewPriority(
  averageAccuracy: number,
  weakCount: number,
  totalConcepts: number,
  confusionCount: number,
  daysSinceLastPractice: number,
): number {
  // Accuracy factor: lower accuracy = higher priority (0-1 scale, inverted)
  const accuracyFactor = Math.max(0, 1 - averageAccuracy / 100);
  // Weakness ratio: more weak concepts relative to total = higher priority
  const weaknessRatio = totalConcepts > 0 ? weakCount / totalConcepts : 0;
  // Confusion factor: more confusion pairs = higher priority (capped at 1)
  const confusionFactor = Math.min(1, confusionCount / 5);
  // Spaced repetition decay: more days since practice = higher priority (capped at 1)
  const decayFactor = Math.min(
    1,
    daysSinceLastPractice / REVIEW_PRIORITY_DECAY_DAYS,
  );

  return Math.min(
    1,
    accuracyFactor * 0.35 +
      weaknessRatio * 0.25 +
      confusionFactor * 0.2 +
      decayFactor * 0.2,
  );
}

async function handleUpdateStudentUnitMemory(
  gqlClient: any,
  args: {
    studentId: string;
    unitID: string;
    accuracy: number;
    weakAreas: string[];
    strongAreas: string[];
    confusionPairs?: ConfusionPair[];
    accuracyBySource?: Record<string, number>;
    sourceType?: string;
  },
) {
  const {
    studentId,
    unitID,
    accuracy,
    weakAreas = [],
    strongAreas = [],
    confusionPairs: incomingPairs = [],
    accuracyBySource: incomingAccBySource = {},
    sourceType = "practice",
  } = args;

  const timestamp = new Date().toISOString();

  // Fetch existing unit memory
  const { data: listResult } = await gqlClient.graphql({
    query: LIST_UNIT_MEMORY_BY_STUDENT,
    variables: { studentId },
  });
  const allEntries = listResult?.listStudentMemoryByStudentId?.items || [];
  const existing = allEntries.find((e: any) => e.unitID === unitID);

  if (existing) {
    // Merge concepts
    const prevWeak: ConceptEntry[] = existing.weakConcepts
      ? JSON.parse(JSON.stringify(existing.weakConcepts))
      : [];
    const prevStrong: ConceptEntry[] = existing.strongConcepts
      ? JSON.parse(JSON.stringify(existing.strongConcepts))
      : [];
    const prevPairs: ConfusionPair[] = existing.confusionPairs
      ? JSON.parse(JSON.stringify(existing.confusionPairs))
      : [];
    const prevAccBySource: Record<string, number> = existing.accuracyBySource
      ? JSON.parse(JSON.stringify(existing.accuracyBySource))
      : {};
    const prevAttempts = existing.totalAttempts || 0;
    const prevAvgAcc = existing.averageAccuracy || 0;

    // Merge weak/strong concepts with frequency tracking
    const mergedWeak = mergeConceptLists(
      prevWeak,
      weakAreas,
      sourceType,
      timestamp,
    );
    const mergedStrong = mergeConceptLists(
      prevStrong,
      strongAreas,
      sourceType,
      timestamp,
    );

    // Remove concepts from weak if they're now strong (student improved)
    const strongSet = new Set(strongAreas);
    const filteredWeak = mergedWeak.filter((c) => !strongSet.has(c.concept));

    // Remove concepts from strong if they're now weak (student regressed)
    const weakSet = new Set(weakAreas);
    const filteredStrong = mergedStrong.filter((c) => !weakSet.has(c.concept));

    // Merge confusion pairs
    const pairMap = new Map<string, ConfusionPair>();
    for (const p of prevPairs) {
      pairMap.set(`${p.item1}|${p.item2}`, p);
    }
    for (const p of incomingPairs) {
      const key = `${p.item1}|${p.item2}`;
      const prev = pairMap.get(key);
      if (prev) {
        pairMap.set(key, { ...prev, frequency: prev.frequency + p.frequency });
      } else {
        pairMap.set(key, p);
      }
    }
    const mergedPairs = Array.from(pairMap.values());

    // Rolling average for accuracy by source
    const mergedAccBySource = { ...prevAccBySource };
    for (const [src, acc] of Object.entries(incomingAccBySource)) {
      if (mergedAccBySource[src] !== undefined) {
        mergedAccBySource[src] =
          Math.round(((mergedAccBySource[src] + acc) / 2) * 100) / 100;
      } else {
        mergedAccBySource[src] = acc;
      }
    }

    // Running average accuracy
    const newAttempts = prevAttempts + 1;
    const newAvgAcc =
      Math.round(((prevAvgAcc * prevAttempts + accuracy) / newAttempts) * 100) /
      100;

    // Days since now (0, since we just practiced)
    const totalConcepts = filteredWeak.length + filteredStrong.length;
    const reviewPriority = calculateReviewPriority(
      newAvgAcc,
      filteredWeak.length,
      totalConcepts,
      mergedPairs.length,
      0,
    );

    const { data: updated } = await gqlClient.graphql({
      query: UPDATE_UNIT_MEMORY,
      variables: {
        input: {
          id: existing.id,
          weakConcepts: filteredWeak,
          strongConcepts: filteredStrong,
          confusionPairs: mergedPairs,
          accuracyBySource: mergedAccBySource,
          totalAttempts: newAttempts,
          averageAccuracy: newAvgAcc,
          reviewPriority,
          lastPracticedAt: timestamp,
          _version: existing._version,
        },
      },
    });
    // Sync to StudentProfile
    try {
      await syncUnitMemoriesToProfile(gqlClient, studentId);
    } catch (err) {
      console.error("[gamification] syncUnitMemoriesToProfile error:", err);
    }
    return updated.updateStudentMemory;
  } else {
    // Create new unit memory
    const totalConcepts = weakAreas.length + strongAreas.length;
    const reviewPriority = calculateReviewPriority(
      accuracy,
      weakAreas.length,
      totalConcepts,
      incomingPairs.length,
      0,
    );

    const { data: created } = await gqlClient.graphql({
      query: CREATE_UNIT_MEMORY,
      variables: {
        input: {
          studentId,
          unitID,
          weakConcepts: weakAreas.map((c) => ({
            concept: c,
            sourceType,
            frequency: 1,
            lastSeen: timestamp,
          })),
          strongConcepts: strongAreas.map((c) => ({
            concept: c,
            sourceType,
            frequency: 1,
            lastSeen: timestamp,
          })),
          confusionPairs: incomingPairs,
          accuracyBySource: incomingAccBySource,
          totalAttempts: 1,
          averageAccuracy: accuracy,
          reviewPriority,
          lastPracticedAt: timestamp,
        },
      },
    });
    // Sync to StudentProfile
    try {
      await syncUnitMemoriesToProfile(gqlClient, studentId);
    } catch (err) {
      console.error(
        "[gamification] syncUnitMemoriesToProfile (create) error:",
        err,
      );
    }
    return created.createStudentMemory;
  }
}

// ============================================================================
// rebuildStudentMemoryProfile — Aggregate per-unit data into central profile
// ============================================================================

const MAX_TOP_CONCEPTS = 10;
const MAX_TREND_POINTS = 20;
const MAX_MEMORY_MARKDOWN_LENGTH = 2000;

async function handleRebuildStudentMemoryProfile(
  gqlClient: any,
  args: { studentId: string },
) {
  const { studentId } = args;

  // Fetch all StudentMemory records (per-unit) for this student
  const { data: unitMemResult } = await gqlClient.graphql({
    query: LIST_UNIT_MEMORY_BY_STUDENT,
    variables: { studentId },
  });
  const unitMemories = (
    unitMemResult?.listStudentMemoryByStudentId?.items || []
  ).filter((item: any) => item != null && item.unitID != null);

  if (unitMemories.length === 0) {
    return { skipped: true, message: "No unit memories to aggregate" };
  }

  // Aggregate weak concepts across all units by frequency
  const weakMap = new Map<
    string,
    { concept: string; frequency: number; units: number }
  >();
  const strongMap = new Map<
    string,
    { concept: string; frequency: number; units: number }
  >();

  // Aggregate accuracy by source across all units
  const sourceAccSums: Record<string, { sum: number; count: number }> = {};

  for (const um of unitMemories) {
    const weak: ConceptEntry[] = um.weakConcepts || [];
    for (const w of weak) {
      const prev = weakMap.get(w.concept);
      if (prev) {
        weakMap.set(w.concept, {
          concept: w.concept,
          frequency: prev.frequency + w.frequency,
          units: prev.units + 1,
        });
      } else {
        weakMap.set(w.concept, {
          concept: w.concept,
          frequency: w.frequency,
          units: 1,
        });
      }
    }

    const strong: ConceptEntry[] = um.strongConcepts || [];
    for (const s of strong) {
      const prev = strongMap.get(s.concept);
      if (prev) {
        strongMap.set(s.concept, {
          concept: s.concept,
          frequency: prev.frequency + s.frequency,
          units: prev.units + 1,
        });
      } else {
        strongMap.set(s.concept, {
          concept: s.concept,
          frequency: s.frequency,
          units: 1,
        });
      }
    }

    const accBySrc: Record<string, number> = um.accuracyBySource || {};
    for (const [src, acc] of Object.entries(accBySrc)) {
      if (!sourceAccSums[src]) sourceAccSums[src] = { sum: 0, count: 0 };
      sourceAccSums[src].sum += acc;
      sourceAccSums[src].count += 1;
    }
  }

  // Sort by frequency descending, take top N
  const topWeak = Array.from(weakMap.values())
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, MAX_TOP_CONCEPTS);
  const topStrong = Array.from(strongMap.values())
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, MAX_TOP_CONCEPTS);

  // Determine dominant source weakness
  const sourceAvg: Record<string, number> = {};
  for (const [src, data] of Object.entries(sourceAccSums)) {
    sourceAvg[src] = Math.round((data.sum / data.count) * 100) / 100;
  }
  const dominantSourceWeakness =
    Object.entries(sourceAvg).sort(([, a], [, b]) => a - b)[0]?.[0] || null;

  // Build accuracy trend (sorted by lastPracticedAt)
  const accuracyTrend = unitMemories
    .filter((um: any) => um.lastPracticedAt && um.averageAccuracy != null)
    .sort(
      (a: any, b: any) =>
        new Date(a.lastPracticedAt).getTime() -
        new Date(b.lastPracticedAt).getTime(),
    )
    .slice(-MAX_TREND_POINTS)
    .map((um: any) => ({
      unitID: um.unitID,
      accuracy: um.averageAccuracy,
      date: um.lastPracticedAt,
    }));

  // Build structured profile
  const structuredProfile = {
    topWeakConcepts: topWeak,
    topStrongConcepts: topStrong,
    accuracyTrend,
    dominantSourceWeakness,
    sourceAverages: sourceAvg,
    unitsStudied: unitMemories.length,
    lastUpdated: new Date().toISOString(),
  };

  // Build capped markdown summary for chat context
  const weakBullets = topWeak
    .slice(0, 5)
    .map((w) => `- ${w.concept} (×${w.frequency})`)
    .join("\n");
  const strongBullets = topStrong
    .slice(0, 5)
    .map((s) => `- ${s.concept} (×${s.frequency})`)
    .join("\n");
  const sourceLine = Object.entries(sourceAvg)
    .map(([s, a]) => `${s}: ${a}%`)
    .join(", ");

  let summaryMarkdown = `## Cross-Unit Summary (auto-generated)\n`;
  summaryMarkdown += `Units studied: ${unitMemories.length} | Dominant weakness: ${dominantSourceWeakness || "none"}\n\n`;
  if (weakBullets) summaryMarkdown += `### Needs Review\n${weakBullets}\n\n`;
  if (strongBullets) summaryMarkdown += `### Strengths\n${strongBullets}\n\n`;
  if (sourceLine) summaryMarkdown += `### By Source\n${sourceLine}\n`;

  // Truncate if needed
  if (summaryMarkdown.length > MAX_MEMORY_MARKDOWN_LENGTH) {
    summaryMarkdown =
      summaryMarkdown.slice(0, MAX_MEMORY_MARKDOWN_LENGTH - 3) + "...";
  }

  // Upsert StudentMemory with the profile
  const { data: memResult } = await gqlClient.graphql({
    query: GET_STUDENT_MEMORY,
    variables: { studentId },
  });
  const existingMem = memResult?.listStudentMemoryByStudentId?.items?.[0];

  if (existingMem) {
    const { data: updated } = await gqlClient.graphql({
      query: UPDATE_STUDENT_MEMORY,
      variables: {
        input: {
          id: existingMem.id,
          memoryMarkdown: summaryMarkdown,
          structuredProfile: JSON.stringify(structuredProfile),
          lastUpdatedBy: "profile-rebuild",
          version: (existingMem.version || 0) + 1,
          _version: existingMem._version,
        },
      },
    });
    return { updated: true, profile: structuredProfile };
  } else {
    const { data: created } = await gqlClient.graphql({
      query: CREATE_STUDENT_MEMORY,
      variables: {
        input: {
          studentId,
          memoryMarkdown: summaryMarkdown,
          structuredProfile: JSON.stringify(structuredProfile),
          lastUpdatedBy: "profile-rebuild",
          version: 1,
        },
      },
    });
    return {
      created: true,
      id: created.createStudentMemory.id,
      profile: structuredProfile,
    };
  }
}

// ============================================================================
// checkPersonalBest — Checks if a score beats the student's PB for a unit
// ============================================================================

async function handleCheckPersonalBest(
  gqlClient: any,
  args: { studentId: string; unitID: string; score: number },
) {
  const { studentId, unitID, score } = args;

  // Read personal bests from StudentProfile
  const profile = await getOrCreateStudentProfile(gqlClient, studentId);
  const personalBests: any[] = (() => {
    try {
      return JSON.parse(profile.personalBests || "[]");
    } catch {
      return [];
    }
  })();
  const existingPB = personalBests.find((pb: any) => pb.unitID === unitID);

  if (!existingPB) {
    // First score for this unit — add PB entry
    personalBests.push({
      unitID,
      bestScore: score,
      achievedAt: new Date().toISOString(),
      previousBest: null,
    });

    await gqlClient.graphql({
      query: UPDATE_STUDENT_PROFILE,
      variables: {
        input: {
          id: profile.id,
          personalBests: JSON.stringify(personalBests),
          _version: profile._version,
        },
      },
    });

    return {
      isNewBest: true,
      firstAttempt: true,
      bestScore: score,
      previousBest: null,
    };
  }

  if (score > existingPB.bestScore) {
    // New personal best! Update in-place
    existingPB.previousBest = existingPB.bestScore;
    existingPB.bestScore = score;
    existingPB.achievedAt = new Date().toISOString();

    await gqlClient.graphql({
      query: UPDATE_STUDENT_PROFILE,
      variables: {
        input: {
          id: profile.id,
          personalBests: JSON.stringify(personalBests),
          _version: profile._version,
        },
      },
    });

    // Award PB XP (deduplicated by unit+date)
    const today = new Date().toISOString().split("T")[0];
    try {
      await handleAwardXP(
        gqlClient,
        {
          studentId,
          reason: "PERSONAL_BEST",
          referenceId: `pb-${unitID}-${today}`,
        },
        null,
      );
    } catch (err) {
      console.error("[gamification] personal best XP error:", err);
    }

    return {
      isNewBest: true,
      firstAttempt: false,
      bestScore: score,
      previousBest: existingPB.previousBest,
    };
  }

  return {
    isNewBest: false,
    firstAttempt: false,
    bestScore: existingPB.bestScore,
    previousBest: existingPB.previousBest,
  };
}

// ============================================================================
// recomputeProgress — Recalculates completion % for a student's module
// ============================================================================

async function handleRecomputeProgress(
  gqlClient: any,
  args: { studentId: string; moduleId: string },
) {
  const { studentId, moduleId } = args;

  // Get all grades for this module (moduleId = sectionID in this context)
  const { data: gradesResult } = await gqlClient.graphql({
    query: LIST_GRADES_BY_SECTION,
    variables: { sectionID: moduleId },
  });
  const allGrades = gradesResult?.listGradeBySectionID?.items || [];

  // Filter to this student's grades
  const studentGrades = allGrades.filter((g: any) => g.owner === studentId);
  const completedGrades = studentGrades.filter((g: any) => g.complete === true);

  // Count total assignments for module (unique assignment IDs in all grades)
  const allAssignmentOwners = new Set(
    allGrades.map((g: any) => g.owner).filter(Boolean),
  );
  const totalWorkbooks = Math.max(
    studentGrades.length,
    Math.ceil(allGrades.length / Math.max(allAssignmentOwners.size, 1)),
  );
  const completedWorkbooks = completedGrades.length;
  const completionPercent =
    totalWorkbooks > 0
      ? Math.round((completedWorkbooks / totalWorkbooks) * 100)
      : 0;

  // Read existing moduleProgress from StudentProfile, upsert entry
  const profile = await getOrCreateStudentProfile(gqlClient, studentId);
  const moduleProgress: any[] = (() => {
    try {
      return JSON.parse(profile.moduleProgress || "[]");
    } catch {
      return [];
    }
  })();

  const existingIdx = moduleProgress.findIndex(
    (p: any) => p.moduleId === moduleId,
  );
  const entry = {
    moduleId,
    completionPercent,
    totalWorkbooks,
    completedWorkbooks,
    lastUpdatedAt: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    moduleProgress[existingIdx] = entry;
  } else {
    moduleProgress.push(entry);
  }

  await gqlClient.graphql({
    query: UPDATE_STUDENT_PROFILE,
    variables: {
      input: {
        id: profile.id,
        moduleProgress: JSON.stringify(moduleProgress),
        _version: profile._version,
      },
    },
  });

  return { ...entry, [existingIdx >= 0 ? "updated" : "created"]: true };
}

// ============================================================================
// checkEasterEggs — Scans submission text for keyword-based easter eggs
// ============================================================================

async function handleCheckEasterEggs(
  gqlClient: any,
  args: { studentId: string; submissionText: string; triggerType?: string },
) {
  const { studentId, submissionText, triggerType } = args;
  const filterType = triggerType || "KEYWORD";

  // Fetch active easter eggs
  const { data: eggResult } = await gqlClient.graphql({
    query: LIST_ACTIVE_EASTER_EGGS,
  });
  const eggs = (eggResult?.listEasterEggs?.items || []).filter(
    (e: any) => e != null && e.trigger === filterType,
  );

  if (eggs.length === 0) return { discovered: [] };

  // Build set of already-discovered egg IDs from EasterEgg.discoveries arrays
  const discoveredIds = new Set<string>();
  for (const egg of eggs) {
    const discoveriesArr = egg.discoveries || [];
    for (const d of discoveriesArr) {
      if (d?.studentId === studentId) discoveredIds.add(egg.id);
    }
  }

  const discovered: Array<{
    eggId: string;
    message: string;
    xpReward: number;
  }> = [];
  const textLower = (submissionText || "").toLowerCase();

  for (const egg of eggs) {
    if (discoveredIds.has(egg.id)) continue;

    let matched = false;

    if (egg.trigger === "KEYWORD") {
      matched = textLower.includes((egg.triggerValue || "").toLowerCase());
    } else if (egg.trigger === "TIME_BASED") {
      const now = new Date();
      const hourStr = `${String(now.getUTCHours()).padStart(2, "0")}:${String(now.getUTCMinutes()).padStart(2, "0")}`;
      const parts = (egg.triggerValue || "").split("-");
      if (parts.length === 2) {
        matched = hourStr >= parts[0] && hourStr <= parts[1];
      }
    }

    if (matched) {
      // Embed discovery in EasterEgg.discoveries array
      try {
        const existingDiscoveries = egg.discoveries || [];
        existingDiscoveries.push({
          studentId,
          discoveredAt: new Date().toISOString(),
        });
        await gqlClient.graphql({
          query: UPDATE_EASTER_EGG,
          variables: {
            input: {
              id: egg.id,
              discoveries: existingDiscoveries,
              _version: egg._version,
            },
          },
        });
      } catch (err) {
        console.error("[gamification] embed discovery error:", err);
      }

      // Award XP
      if (egg.xpReward > 0) {
        try {
          await handleAwardXP(
            gqlClient,
            { studentId, reason: "EASTER_EGG", referenceId: `egg-${egg.id}` },
            null,
          );
        } catch (err) {
          console.error("[gamification] easter egg XP error:", err);
        }
      }

      discovered.push({
        eggId: egg.id,
        message: egg.revealMessage,
        xpReward: egg.xpReward,
      });
    }
  }

  return { discovered };
}

// ============================================================================
// discoverEasterEgg — Direct discovery for UI_INTERACTION or manual triggers
// ============================================================================

async function handleDiscoverEasterEgg(
  gqlClient: any,
  args: { studentId: string; eggId: string },
) {
  const { studentId, eggId } = args;

  // Read egg and check if already discovered via EasterEgg.discoveries
  const { data: eggData } = await gqlClient.graphql({
    query: GET_EASTER_EGG,
    variables: { id: eggId },
  });
  const eggRecord = eggData?.getEasterEgg;
  if (!eggRecord) {
    return { error: "Easter egg not found" };
  }

  const discoveries = eggRecord.discoveries || [];
  const alreadyFound = discoveries.some((d: any) => d?.studentId === studentId);

  if (alreadyFound) {
    return { alreadyDiscovered: true };
  }

  // Embed discovery in EasterEgg.discoveries array
  discoveries.push({ studentId, discoveredAt: new Date().toISOString() });
  await gqlClient.graphql({
    query: UPDATE_EASTER_EGG,
    variables: {
      input: { id: eggRecord.id, discoveries, _version: eggRecord._version },
    },
  });

  if (eggRecord.xpReward > 0) {
    try {
      await handleAwardXP(
        gqlClient,
        { studentId, reason: "EASTER_EGG", referenceId: `egg-${eggId}` },
        null,
      );
    } catch (err) {
      console.error("[gamification] discoverEasterEgg XP error:", err);
    }
  }

  return {
    alreadyDiscovered: false,
    message: eggRecord.revealMessage || "Secret found!",
    xpReward: eggRecord.xpReward || 0,
  };
}

// ============================================================================
// updateGuildXP — Recalculates a guild's total XP from member XP logs
// ============================================================================

async function handleUpdateGuildXP(
  gqlClient: any,
  args: { studentId: string; xpAmount: number },
) {
  const { studentId, xpAmount } = args;

  // Find guild(s) this student belongs to via StudentProfile.cohortId + Guild.members
  const profile = await getOrCreateStudentProfile(gqlClient, studentId);
  const cohortId = profile.cohortId;
  if (!cohortId) {
    return { updated: false, reason: "Student has no cohort" };
  }

  const { data: guildsResult } = await gqlClient.graphql({
    query: LIST_GUILDS_BY_COHORT,
    variables: { cohortId },
  });
  const allGuilds = (guildsResult?.listGuildByCohortId?.items || []).filter(
    (g: any) => g != null,
  );

  // Find guilds where this student is a member
  const memberGuilds = allGuilds.filter((guild: any) => {
    const members = guild.members || [];
    return members.some((m: any) => m?.studentId === studentId);
  });

  if (memberGuilds.length === 0) {
    return { updated: false, reason: "Student has no guild memberships" };
  }

  const updatedGuilds: string[] = [];

  for (const guild of memberGuilds) {
    const newTotal = (guild.totalXP || 0) + xpAmount;

    await gqlClient.graphql({
      query: UPDATE_GUILD,
      variables: {
        input: {
          id: guild.id,
          totalXP: newTotal,
          _version: guild._version,
        },
      },
    });

    updatedGuilds.push(guild.id);

    // Check active group challenges for this guild's cohort
    try {
      await handleContributeToChallenge(gqlClient, {
        studentId,
        cohortId: guild.cohortId,
        xpContributed: xpAmount,
      });
    } catch (err) {
      console.error("[gamification] auto-contribute to challenge error:", err);
    }
  }

  return { updated: true, guilds: updatedGuilds };
}

// ============================================================================
// contributeToChallenge — Records XP contribution to active group challenges
// ============================================================================

async function handleContributeToChallenge(
  gqlClient: any,
  args: { studentId: string; cohortId: string; xpContributed: number },
) {
  const { studentId, cohortId, xpContributed } = args;

  // Find active challenges for this cohort
  const { data: challengeResult } = await gqlClient.graphql({
    query: LIST_ACTIVE_CHALLENGES_BY_COHORT,
    variables: { cohortId },
  });
  const challenges = (
    challengeResult?.listGroupChallengeByCohortId?.items || []
  ).filter((c: any) => c != null && c.active === true);

  if (challenges.length === 0) {
    return { contributed: false, reason: "No active challenges" };
  }

  const contributions: Array<{
    challengeId: string;
    newTotal: number;
    goalReached: boolean;
  }> = [];

  for (const challenge of challenges) {
    // Check deadline
    if (challenge.deadline && new Date(challenge.deadline) < new Date()) {
      continue; // expired
    }

    // Update challenge total + embed contribution in aggregate array
    const newTotal = (challenge.currentXP || 0) + xpContributed;
    const goalReached = newTotal >= challenge.targetXP;
    const existingContributions = challenge.contributions || [];
    const updatedContributions = [
      ...existingContributions,
      { studentId, xpContributed, contributedAt: new Date().toISOString() },
    ];

    await gqlClient.graphql({
      query: UPDATE_CHALLENGE_WITH_CONTRIBUTIONS,
      variables: {
        input: {
          id: challenge.id,
          currentXP: newTotal,
          active: goalReached ? false : true,
          contributions: updatedContributions,
          _version: challenge._version,
        },
      },
    });

    // If goal reached, award bonus to the contributing student
    if (goalReached) {
      try {
        await handleAwardXP(
          gqlClient,
          {
            studentId,
            reason: "GUILD_CHALLENGE_BONUS",
            referenceId: `challenge-${challenge.id}`,
          },
          null,
        );
      } catch (err) {
        console.error("[gamification] challenge bonus XP error:", err);
      }
    }

    contributions.push({
      challengeId: challenge.id,
      newTotal,
      goalReached,
    });
  }

  return { contributed: true, contributions };
}

// ============================================================================
// advanceSkillProgress — Advances a student's skill status with prerequisite checks
// ============================================================================

async function handleAdvanceSkillProgress(
  gqlClient: any,
  args: { studentId: string; skillId: string; newStatus: string },
) {
  const { studentId, skillId, newStatus } = args;

  // Validate status value
  const validStatuses = ["LOCKED", "AVAILABLE", "IN_PROGRESS", "MASTERED"];
  if (!validStatuses.includes(newStatus)) {
    return { error: `Invalid status: ${newStatus}` };
  }

  // Validate transition
  const validTransitions: Record<string, string[]> = {
    LOCKED: ["AVAILABLE"],
    AVAILABLE: ["IN_PROGRESS"],
    IN_PROGRESS: ["MASTERED"],
  };

  // Get current skill progress from StudentProfile
  const profile = await getOrCreateStudentProfile(gqlClient, studentId);
  const allProgress: any[] = (() => {
    try {
      return JSON.parse(profile.skillProgress || "[]");
    } catch {
      return [];
    }
  })();
  const existing = allProgress.find((p: any) => p.skillId === skillId);
  const currentStatus = existing?.status || "LOCKED";

  if (!validTransitions[currentStatus]?.includes(newStatus)) {
    return { error: `Invalid transition: ${currentStatus} → ${newStatus}` };
  }

  // Update in-memory skillProgress array
  if (existing) {
    existing.status = newStatus;
  } else {
    allProgress.push({ skillId, status: newStatus });
  }

  // If MASTERED, unlock dependent skills
  const unlocked: string[] = [];
  if (newStatus === "MASTERED") {
    // Get the skill's cohort to find all skills in this tree
    const { data: skillResult } = await gqlClient.graphql({
      query: `query GetSkill($id: ID!) { getSkill(id: $id) { id cohortId _version _lastChangedAt _deleted } }`,
      variables: { id: skillId },
    });
    const cohortId = skillResult?.getSkill?.cohortId;
    if (cohortId) {
      const { data: skillsResult } = await gqlClient.graphql({
        query: LIST_SKILLS_BY_COHORT,
        variables: { cohortId },
      });
      const allSkills = skillsResult?.listSkillByCohort?.items || [];

      // Find skills that have this skillId as a prerequisite
      for (const skill of allSkills) {
        const prereqs = skill.prerequisites || [];
        if (!prereqs.includes(skillId)) continue;

        // Check if ALL prerequisites are MASTERED
        const depProgress = allProgress.find(
          (p: any) => p.skillId === skill.id,
        );
        if (
          depProgress?.status === "AVAILABLE" ||
          depProgress?.status === "IN_PROGRESS" ||
          depProgress?.status === "MASTERED"
        ) {
          continue; // Already unlocked or beyond
        }

        const allPrereqsMastered = prereqs.every((prereqId: string) => {
          if (prereqId === skillId) return true; // The one we just mastered
          const p = allProgress.find((pr: any) => pr.skillId === prereqId);
          return p?.status === "MASTERED";
        });

        if (allPrereqsMastered) {
          // Unlock this dependent skill in-memory
          const depExisting = allProgress.find(
            (p: any) => p.skillId === skill.id,
          );
          if (depExisting) {
            depExisting.status = "AVAILABLE";
          } else {
            allProgress.push({ skillId: skill.id, status: "AVAILABLE" });
          }
          unlocked.push(skill.id);
        }
      }
    }
  }

  // Write updated skillProgress to StudentProfile
  await gqlClient.graphql({
    query: UPDATE_STUDENT_PROFILE,
    variables: {
      input: {
        id: profile.id,
        skillProgress: JSON.stringify(allProgress),
        _version: profile._version,
      },
    },
  });

  return { success: true, skillId, newStatus, unlocked };
}

// ============================================================================
// StudentProfile helpers — sync to aggregate model alongside legacy writes
// ============================================================================

async function getOrCreateStudentProfile(
  gqlClient: any,
  studentId: string,
  cohortId?: string,
): Promise<any> {
  const { data: profileResult } = await gqlClient.graphql({
    query: GET_STUDENT_PROFILE,
    variables: { studentId },
  });
  const profiles = profileResult?.listStudentProfileByStudentId?.items || [];
  if (profiles.length > 0) return profiles[0];

  // Create new profile
  const { data: created } = await gqlClient.graphql({
    query: CREATE_STUDENT_PROFILE,
    variables: {
      input: {
        studentId,
        cohortId: cohortId || null,
        totalXP: 0,
        level: 1,
        currentStreak: 0,
        longestStreak: 0,
        freezesRemaining: 0,
        freezesUsed: 0,
      },
    },
  });
  return created?.createStudentProfile;
}

function upsertInArray<T extends Record<string, any>>(
  array: T[] | null | undefined,
  item: T,
  matchKey: keyof T,
): T[] {
  const arr = [...(array || [])];
  const idx = arr.findIndex((e) => e[matchKey] === item[matchKey]);
  if (idx >= 0) {
    arr[idx] = { ...arr[idx], ...item };
  } else {
    arr.push(item);
  }
  return arr;
}

// syncPersonalBestsToProfile and syncModuleProgressToProfile REMOVED
// — handleCheckPersonalBest and handleRecomputeProgress now write directly to StudentProfile

async function syncUnitMemoriesToProfile(gqlClient: any, studentId: string) {
  const { data: memResult } = await gqlClient.graphql({
    query: LIST_UNIT_MEMORY_BY_STUDENT,
    variables: { studentId },
  });
  const allMemories = (
    memResult?.listStudentMemoryByStudentId?.items || []
  ).filter((m: any) => m != null && m.unitID != null);
  const profile = await getOrCreateStudentProfile(gqlClient, studentId);
  const unitMemoriesForProfile = allMemories.map((m: any) => ({
    unitID: m.unitID,
    averageAccuracy: m.averageAccuracy || 0,
    totalAttempts: m.totalAttempts || 0,
    reviewPriority: m.reviewPriority || 0,
    lastPracticedAt: m.lastPracticedAt || "",
  }));
  await gqlClient.graphql({
    query: UPDATE_STUDENT_PROFILE,
    variables: {
      input: {
        id: profile.id,
        unitMemories: unitMemoriesForProfile,
        _version: profile._version,
      },
    },
  });
}

// ============================================================================
// generateSkillTree — Uses GPT-4o to extract skills from unit content
// ============================================================================

/**
 * Walk a Lexical JSON tree and extract all text content.
 * Handles nested paragraph, heading, text, list, quote nodes.
 */
function extractTextFromLexicalJSON(data: any): string {
  if (!data?.root?.children) return "";

  const parts: string[] = [];

  function walk(node: any) {
    if (!node) return;
    if (node.text) {
      parts.push(node.text);
    }
    // Custom nodes that carry text-like content
    if (node.prompt) parts.push(node.prompt);
    if (node.answer) parts.push(node.answer);
    if (node.phrase) parts.push(node.phrase);
    if (node.definition) parts.push(node.definition);

    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        walk(child);
      }
    }
  }

  walk(data.root);
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

let openaiInstance: any = null;

async function getOpenAI(): Promise<any> {
  if (!openaiInstance) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY environment variable not set");
    const OpenAI = (await import("openai")).default;
    openaiInstance = new OpenAI({ apiKey });
  }
  return openaiInstance;
}

async function handleGenerateSkillTree(
  gqlClient: any,
  args: { unitID: string; cohortId?: string },
) {
  const { unitID, cohortId } = args;

  // 1. Fetch unit content
  const { data: unitResult } = await gqlClient.graphql({
    query: GET_UNIT,
    variables: { id: unitID },
  });
  const unit = unitResult?.getUnit;
  if (!unit) throw new Error(`Unit not found: ${unitID}`);

  // Parse Lexical JSON
  const lexicalData =
    typeof unit.data === "string" ? JSON.parse(unit.data) : unit.data;
  const unitText = extractTextFromLexicalJSON(lexicalData);

  // 2. Fetch related vocabulary
  const { data: wordsResult } = await gqlClient.graphql({
    query: LIST_UNIT_WORDS,
    variables: { unitID },
  });
  const words = (wordsResult?.listUnitWordByUnitID?.items || [])
    .filter((i: any) => i?.word)
    .map((i: any) => `${i.word.word}: ${i.word.definition || ""}`);

  // 3. Fetch related questions
  const { data: questionsResult } = await gqlClient.graphql({
    query: LIST_QUESTION_UNITS,
    variables: { unitID },
  });
  const questions = (questionsResult?.listQuestionUnitByUnitID?.items || [])
    .filter((i: any) => i?.question)
    .map((i: any) => i.question.question);

  // 4. Fetch learning objectives from parsed documents (if any)
  let objectives: string[] = [];
  try {
    const { data: docsResult } = await gqlClient.graphql({
      query: LIST_UNIT_DOCUMENTS,
      variables: { unitID },
    });
    const docs = docsResult?.listUnitDocumentByUnitID?.items || [];
    for (const doc of docs) {
      const parsedContents = doc?.document?.parsedContents?.items || [];
      for (const pc of parsedContents) {
        if (pc?.objectivesJSON) {
          const parsed =
            typeof pc.objectivesJSON === "string"
              ? JSON.parse(pc.objectivesJSON)
              : pc.objectivesJSON;
          if (Array.isArray(parsed)) {
            for (const obj of parsed) {
              if (obj?.objective) objectives.push(obj.objective);
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn("[gamification] Could not fetch unit documents:", err);
  }

  // 5. Build prompt for GPT-4o
  const prompt = buildSkillTreePrompt(
    unit.name,
    unit.description,
    unitText,
    words,
    questions,
    objectives,
  );

  // 6. Call GPT-4o
  const openai = await getOpenAI();
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are an instructional design expert. Analyze lesson content and produce a structured skill tree. Each skill should be a discrete, assessable learning outcome. Skills should form a prerequisite graph — foundational skills are unlocked first, advanced skills depend on earlier ones. Return ONLY valid JSON, no markdown fences.`,
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response from GPT-4o");

  const parsed = JSON.parse(content);
  const skillDefs: Array<{
    title: string;
    description: string;
    prerequisites: string[];
    xpReward: number;
  }> = parsed.skills || [];

  if (skillDefs.length === 0) {
    return {
      generated: false,
      reason: "No skills extracted from content",
      skills: [],
    };
  }

  // 7. Delete existing skills for this cohort+unit pattern (optional cleanup)
  const effectiveCohortId = cohortId || `unit-${unitID}`;

  try {
    const { data: existingResult } = await gqlClient.graphql({
      query: LIST_SKILLS_BY_COHORT,
      variables: { cohortId: effectiveCohortId },
    });
    const existing = (existingResult?.listSkillByCohort?.items || []).filter(
      (s: any) => s != null,
    );
    for (const skill of existing) {
      await gqlClient.graphql({
        query: DELETE_SKILL,
        variables: { input: { id: skill.id, _version: skill._version } },
      });
    }
  } catch (err) {
    console.warn("[gamification] Could not clean up existing skills:", err);
  }

  // 8. Create Skill records — first pass: create all skills and collect IDs
  const titleToId = new Map<string, string>();
  const createdSkills: any[] = [];

  for (const def of skillDefs) {
    const { data: createResult } = await gqlClient.graphql({
      query: CREATE_SKILL,
      variables: {
        input: {
          title: def.title,
          description: def.description || null,
          prerequisites: JSON.stringify([]), // placeholder — updated in second pass
          xpReward: def.xpReward || 25,
          cohortId: effectiveCohortId,
        },
      },
    });
    const created = createResult?.createSkill;
    if (created) {
      titleToId.set(def.title, created.id);
      createdSkills.push({ ...created, _prereqTitles: def.prerequisites });
    }
  }

  // 9. Second pass: update prerequisites with real IDs
  for (const skill of createdSkills) {
    const prereqIds = (skill._prereqTitles || [])
      .map((title: string) => titleToId.get(title))
      .filter(Boolean);

    if (prereqIds.length > 0) {
      await gqlClient.graphql({
        query: `mutation UpdateSkill($input: UpdateSkillInput!) {
          updateSkill(input: $input) { id prerequisites _version _lastChangedAt _deleted }
        }`,
        variables: {
          input: {
            id: skill.id,
            prerequisites: JSON.stringify(prereqIds),
            _version: skill._version,
          },
        },
      });
    }
  }

  return {
    generated: true,
    unitID,
    cohortId: effectiveCohortId,
    skillCount: createdSkills.length,
    skills: createdSkills.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      xpReward: s.xpReward,
      prerequisites: (s._prereqTitles || [])
        .map((t: string) => titleToId.get(t))
        .filter(Boolean),
    })),
  };
}

function buildSkillTreePrompt(
  unitName: string,
  unitDescription: string | null,
  unitText: string,
  words: string[],
  questions: string[],
  objectives: string[],
): string {
  const parts: string[] = [];

  parts.push(`# Unit: ${unitName}`);
  if (unitDescription) parts.push(`Description: ${unitDescription}`);

  if (objectives.length > 0) {
    parts.push(`\n## Learning Objectives (from source documents)`);
    objectives.forEach((o, i) => parts.push(`${i + 1}. ${o}`));
  }

  if (unitText) {
    // Truncate to ~6000 chars to stay within token budget
    const truncated =
      unitText.length > 6000 ? unitText.slice(0, 6000) + "..." : unitText;
    parts.push(`\n## Lesson Content\n${truncated}`);
  }

  if (words.length > 0) {
    parts.push(`\n## Vocabulary (${words.length} words)`);
    words.slice(0, 30).forEach((w) => parts.push(`- ${w}`));
    if (words.length > 30) parts.push(`... and ${words.length - 30} more`);
  }

  if (questions.length > 0) {
    parts.push(`\n## Practice Questions (${questions.length})`);
    questions.slice(0, 15).forEach((q, i) => parts.push(`${i + 1}. ${q}`));
    if (questions.length > 15)
      parts.push(`... and ${questions.length - 15} more`);
  }

  parts.push(`\n## Instructions
Analyze the above lesson content and produce a skill tree with 4–10 skills.

Each skill should:
- Be a discrete, assessable learning outcome (not just a topic)
- Have a clear title (e.g. "Identify parts of a cell" not just "Cells")
- Have a brief description
- List prerequisite skill titles (by exact title string) that must be mastered first
- Have an XP reward (15–100, higher for harder/synthesis skills)

The first 1–2 skills should have no prerequisites (entry points).
Later skills should build on earlier ones, forming a directed acyclic graph.

Return JSON:
{
  "skills": [
    {
      "title": "string",
      "description": "string",
      "prerequisites": ["title of prerequisite skill"],
      "xpReward": number
    }
  ]
}`);

  return parts.join("\n");
}

// ============================================================================
// claimStorybookBadges — Validate claims and award promo badges
// Identity comes from the Cognito JWT (verified by AppSync).
// ============================================================================

/** Valid promo badge types */
const PROMO_BADGE_TYPES = new Set([
  "DOCS_EXPLORER",
  "INSTRUCTOR_ONBOARD",
  "LEARNER_ONBOARD",
  "TRANSLATOR_ONBOARD",
  "A11Y_CHAMPION",
  "DOCS_CHAMPION",
]);

/** Known valid onboarding task IDs — must match .storybook/code/onboarding-tasks.ts */
const VALID_TASK_IDS = new Set([
  "instructor-setup-class",
  "instructor-create-unit",
  "instructor-add-quiz",
  "instructor-create-vocabulary",
  "instructor-create-assignment",
  "instructor-view-grades",
  "instructor-use-ai-assistant",
  "instructor-learn-shortcuts",
  "learner-join-class",
  "learner-view-assignments",
  "learner-complete-assignment",
  "learner-review-feedback",
  "learner-practice-vocabulary",
  "learner-use-chat-help",
  "learner-learn-shortcuts",
  "secret-keyboard-master",
  "secret-speed-demon",
  "secret-achievement-hunter",
  "secret-shortcut-evangelist",
  "translator-language-switcher",
  "translator-translation-panel",
  "translator-locale-files",
  "translator-component-context",
  "translator-test-rtl",
  "translator-pluralization",
]);

const VALID_PERSONAS = new Set(["instructor", "learner", "translator"]);

/** Tasks required per persona (including shared 'all' tasks counted per-persona) */
const INSTRUCTOR_TASK_COUNT = 8;
const LEARNER_TASK_COUNT = 7;
const TRANSLATOR_TASK_COUNT = 6;

/** Rate limit: max claims per hour per user */
const MAX_CLAIMS_PER_HOUR = 10;

async function handleClaimStorybookBadges(
  gqlClient: any,
  args: { completedTasks: string[]; completedPersonas: string[] },
  identity: any,
) {
  // Extract student ID from the Cognito identity (AppSync already verified the JWT)
  const studentId =
    identity?.username ||
    identity?.claims?.["cognito:username"] ||
    identity?.sub;
  if (!studentId) {
    throw new Error("Authentication required — could not resolve identity");
  }

  const { completedTasks, completedPersonas } = args;

  if (!Array.isArray(completedTasks) || !Array.isArray(completedPersonas)) {
    throw new Error(
      "Invalid arguments: completedTasks and completedPersonas must be arrays",
    );
  }

  // Validate all task IDs are known (reject fabricated task IDs)
  const validTasks = completedTasks.filter((t) => VALID_TASK_IDS.has(t));
  const validPersonas = completedPersonas.filter((p) => VALID_PERSONAS.has(p));

  // Sanity check: persona claims must match task counts
  // A persona can only be "complete" if enough valid tasks are claimed
  const instructorTasks = validTasks.filter((t) => t.startsWith("instructor-"));
  const learnerTasks = validTasks.filter((t) => t.startsWith("learner-"));
  const translatorTasks = validTasks.filter((t) => t.startsWith("translator-"));

  const verifiedPersonas = new Set<string>();
  if (
    validPersonas.includes("instructor") &&
    instructorTasks.length >= INSTRUCTOR_TASK_COUNT
  ) {
    verifiedPersonas.add("instructor");
  }
  if (
    validPersonas.includes("learner") &&
    learnerTasks.length >= LEARNER_TASK_COUNT
  ) {
    verifiedPersonas.add("learner");
  }
  if (
    validPersonas.includes("translator") &&
    translatorTasks.length >= TRANSLATOR_TASK_COUNT
  ) {
    verifiedPersonas.add("translator");
  }

  // Determine which badges to award based on verified claims
  const badgesToAward: string[] = [];

  // DOCS_EXPLORER: any task started
  if (validTasks.length > 0) {
    badgesToAward.push("DOCS_EXPLORER");
  }

  // Persona-specific badges
  if (verifiedPersonas.has("instructor"))
    badgesToAward.push("INSTRUCTOR_ONBOARD");
  if (verifiedPersonas.has("learner")) badgesToAward.push("LEARNER_ONBOARD");
  if (verifiedPersonas.has("translator"))
    badgesToAward.push("TRANSLATOR_ONBOARD");

  // A11Y_CHAMPION: translator completed (has a11y-related tasks like RTL testing)
  if (verifiedPersonas.has("translator")) badgesToAward.push("A11Y_CHAMPION");

  // DOCS_CHAMPION: all three personas complete
  if (verifiedPersonas.size === 3) badgesToAward.push("DOCS_CHAMPION");

  if (badgesToAward.length === 0) {
    return {
      newBadges: [],
      updatedBadges: [],
      totalBadges: 0,
      message: "No badges earned yet",
    };
  }

  // Read existing badges from StudentProfile
  const profile = await getOrCreateStudentProfile(gqlClient, studentId);
  const existingBadges: any[] = (() => {
    try {
      return JSON.parse(profile.badges || "[]");
    } catch {
      return [];
    }
  })();

  // Simple rate check: if too many promo badges were updated in the last hour, reject
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
  const recentPromoClaims = existingBadges.filter(
    (b: any) => PROMO_BADGE_TYPES.has(b.badgeType) && b.awardedAt > oneHourAgo,
  );
  if (recentPromoClaims.length >= MAX_CLAIMS_PER_HOUR) {
    throw new Error("Too many badge claims — please try again later");
  }

  const existingByType = new Map(
    existingBadges.map((b: any) => [b.badgeType, b]),
  );

  const newBadges: string[] = [];
  const updatedBadges: string[] = [];

  for (const badgeType of badgesToAward) {
    const existing = existingByType.get(badgeType);

    if (existing) {
      // Already have this badge — skip (idempotent, no increment for promo badges)
      updatedBadges.push(badgeType);
    } else {
      // Award new badge — add to profile badges array
      existingBadges.push({
        badgeType,
        awardedAt: new Date().toISOString(),
        count: 1,
      });
      newBadges.push(badgeType);
    }
  }

  // Write updated badges to StudentProfile
  await gqlClient.graphql({
    query: UPDATE_STUDENT_PROFILE,
    variables: {
      input: {
        id: profile.id,
        badges: JSON.stringify(existingBadges),
        _version: profile._version,
      },
    },
  });

  return {
    newBadges,
    updatedBadges,
    totalBadges: existingBadges.length,
    message:
      newBadges.length > 0
        ? `Awarded ${newBadges.length} new badge(s): ${newBadges.join(", ")}`
        : "All badges already claimed",
  };
}

// ============================================================================
// applyBattleStakes — Applies consequences to all cohort members on battle failure
// ============================================================================

interface BattleStakesInput {
  loseLevel: boolean;
  loseXP: boolean;
  xpLossAmount: number;
  loseStreakFreeze: boolean;
  resetStreak: boolean;
  loseBadge: boolean;
  loseBadgeByRarity: boolean;
  badgeRarityTarget: string; // 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  streakMissXPPenalty: boolean;
  streakMissXPPerDay: number;
  loseCosmetics: boolean;
  cosmeticPenaltyDays: number;
}

// Badge rarity classification based on badge type difficulty
const BADGE_RARITY_MAP: Record<string, string> = {
  FIRST_SUBMISSION: "common",
  QUICK_DRAW: "common",
  GOOD_EYE: "uncommon",
  TEAM_PLAYER: "uncommon",
  CONSISTENT: "uncommon",
  SHARPSHOOTER: "rare",
  DEEP_THINKER: "rare",
  DRILL_MASTER: "rare",
  COMEBACK_KID: "rare",
  PERFECTIONIST: "epic",
  TOP_OF_CLASS: "epic",
  STREAK_14: "epic",
  STREAK_30: "legendary",
  EASTER_EGG_HUNTER: "legendary",
};

const RARITY_ORDER = ["common", "uncommon", "rare", "epic", "legendary"];

// Cosmetic scramble options (avatar color is NOT affected)
const SCRAMBLE_BORDERS = [
  "dashed",
  "dotted",
  "double",
  "ridge",
  "groove",
  "none",
];
const SCRAMBLE_FLAIRS = [
  "🐛 Bug Collector",
  "🪨 Pet Rock Owner",
  "🧦 Odd Sock Enthusiast",
  "🥔 Couch Potato",
  "🦆 Rubber Duck Debugger",
  "🌵 Prickly Personality",
  "🍄 Fungi Specialist",
  "🪣 Bucket Head",
];
const SCRAMBLE_NAME_EFFECTS = [
  "reversed",
  "uppercase",
  "alternating",
  "leetspeak",
];

async function handleApplyBattleStakes(
  gqlClient: any,
  args: { challengeId: string; cohortId: string },
) {
  const { challengeId, cohortId } = args;

  // Fetch the challenge to get stakes
  const { data: challengeResult } = await gqlClient.graphql({
    query: LIST_ACTIVE_CHALLENGES_BY_COHORT,
    variables: { cohortId },
  });
  const challenges = challengeResult?.listGroupChallengeByCohortId?.items || [];
  const challenge = challenges.find(
    (c: any) => c.id === challengeId && !c._deleted,
  );
  if (!challenge) {
    throw new Error(`Challenge ${challengeId} not found in cohort ${cohortId}`);
  }

  // Parse stakes JSON
  let stakes: BattleStakesInput;
  try {
    stakes = JSON.parse(challenge.stakes || "{}");
  } catch {
    throw new Error("Invalid stakes JSON on challenge");
  }

  // Check that the challenge actually failed (deadline passed, target not met)
  if (challenge.currentXP >= challenge.targetXP) {
    return { applied: false, reason: "Challenge was completed successfully" };
  }

  // Fetch all student profiles in this cohort
  const { data: profilesResult } = await gqlClient.graphql({
    query: LIST_PROFILES_BY_COHORT,
    variables: { cohortId },
  });
  const profiles =
    profilesResult?.listStudentProfileByCohortId?.items?.filter(
      (p: any) => p && !p._deleted,
    ) || [];

  if (profiles.length === 0) {
    return { applied: false, reason: "No student profiles found in cohort" };
  }

  const results: Array<{ studentId: string; consequences: string[] }> = [];

  for (const profile of profiles) {
    const consequences: string[] = [];
    const updates: Record<string, any> = {
      id: profile.id,
      _version: profile._version,
    };

    // Lose a streak freeze
    if (stakes.loseStreakFreeze) {
      const freezesRemaining = profile.freezesRemaining || 0;
      if (freezesRemaining > 0) {
        updates.freezesRemaining = freezesRemaining - 1;
        updates.freezesUsed = (profile.freezesUsed || 0) + 1;
        consequences.push("Lost a streak freeze");
      } else {
        consequences.push("No streak freeze to lose (skipped)");
      }
    }

    // Lose XP points
    if (stakes.loseXP && stakes.xpLossAmount > 0) {
      const currentXP = profile.totalXP || 0;
      const newXP = Math.max(0, currentXP - stakes.xpLossAmount);
      updates.totalXP = newXP;
      updates.level = calculateLevel(newXP);
      consequences.push(`Lost ${currentXP - newXP} XP`);
    }

    // Missed streaks cost XP — penalize per day of missed streak
    if (stakes.streakMissXPPenalty && stakes.streakMissXPPerDay > 0) {
      const lastActivity = profile.lastActivityDate;
      if (lastActivity) {
        const lastDate = new Date(lastActivity);
        const today = new Date();
        const missedDays = Math.max(
          0,
          Math.floor(
            (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
          ) - 1,
        );
        if (missedDays > 0) {
          const penalty = missedDays * stakes.streakMissXPPerDay;
          const currentXP = updates.totalXP ?? profile.totalXP ?? 0;
          const newXP = Math.max(0, currentXP - penalty);
          updates.totalXP = newXP;
          updates.level = calculateLevel(newXP);
          consequences.push(
            `Lost ${currentXP - newXP} XP for ${missedDays} missed streak day(s)`,
          );
        } else {
          consequences.push("No missed streak days (skipped)");
        }
      }
    }

    // Lose a level (independent of XP loss — forces level down by 1)
    if (stakes.loseLevel) {
      const currentLevel = updates.level ?? profile.level ?? 1;
      if (currentLevel > 1) {
        updates.level = currentLevel - 1;
        // Also adjust XP to match the top of the new level (prevent immediate re-level)
        const currentXP = updates.totalXP ?? profile.totalXP ?? 0;
        if (
          currentXP >=
          (LEVELS.find((l) => l.level === currentLevel)?.xpRequired ?? 0)
        ) {
          const nextLevelThreshold =
            LEVELS.find((l) => l.level === currentLevel)?.xpRequired ?? 0;
          updates.totalXP = Math.min(currentXP, nextLevelThreshold - 1);
        }
        consequences.push(`Dropped to level ${updates.level}`);
      } else {
        consequences.push("Already at level 1 (skipped)");
      }
    }

    // Reset streak
    if (stakes.resetStreak) {
      updates.currentStreak = 0;
      consequences.push("Streak reset to 0");
    }

    // Lose most recent badge
    if (stakes.loseBadge) {
      try {
        const badges: any[] = JSON.parse(profile.badges || "[]");
        if (badges.length > 0) {
          badges.sort(
            (a: any, b: any) =>
              new Date(b.awardedAt).getTime() - new Date(a.awardedAt).getTime(),
          );
          const removed = badges.shift();
          updates.badges = JSON.stringify(badges);
          consequences.push(`Lost badge: ${removed.badgeType}`);
        } else {
          consequences.push("No badges to lose (skipped)");
        }
      } catch {
        consequences.push("Failed to parse badges (skipped)");
      }
    }

    // Lose a badge of a specific rarity
    if (stakes.loseBadgeByRarity && stakes.badgeRarityTarget) {
      try {
        const badges: any[] = updates.badges
          ? JSON.parse(updates.badges)
          : JSON.parse(profile.badges || "[]");
        const targetRarity = stakes.badgeRarityTarget;
        // Find badges matching the target rarity
        const matchingIdx = badges.findIndex(
          (b: any) =>
            (BADGE_RARITY_MAP[b.badgeType] || "common") === targetRarity,
        );
        if (matchingIdx >= 0) {
          const removed = badges.splice(matchingIdx, 1)[0];
          updates.badges = JSON.stringify(badges);
          consequences.push(`Lost ${targetRarity} badge: ${removed.badgeType}`);
        } else {
          consequences.push(`No ${targetRarity} badge to lose (skipped)`);
        }
      } catch {
        consequences.push(
          "Failed to parse badges for rarity removal (skipped)",
        );
      }
    }

    // Scramble cosmetics — mess with name display, border, and flair (NOT avatar color)
    if (stakes.loseCosmetics && stakes.cosmeticPenaltyDays > 0) {
      const randomBorder =
        SCRAMBLE_BORDERS[Math.floor(Math.random() * SCRAMBLE_BORDERS.length)];
      const randomFlair =
        SCRAMBLE_FLAIRS[Math.floor(Math.random() * SCRAMBLE_FLAIRS.length)];
      const randomNameEffect =
        SCRAMBLE_NAME_EFFECTS[
          Math.floor(Math.random() * SCRAMBLE_NAME_EFFECTS.length)
        ];
      const penaltyExpiry = new Date();
      penaltyExpiry.setDate(
        penaltyExpiry.getDate() + stakes.cosmeticPenaltyDays,
      );
      const cosmeticPenalty = {
        active: true,
        expiresAt: penaltyExpiry.toISOString(),
        reason: "boss_battle_failure",
        challengeId,
        // Scrambled settings (avatar color untouched)
        border: randomBorder,
        flair: randomFlair,
        nameEffect: randomNameEffect,
      };
      updates.cosmeticPenalty = JSON.stringify(cosmeticPenalty);
      consequences.push(
        `Cosmetics scrambled — flair: "${randomFlair}", border: ${randomBorder}, name: ${randomNameEffect} for ${stakes.cosmeticPenaltyDays} day(s)`,
      );
    }

    // Apply updates if there are any real changes
    const hasUpdates = Object.keys(updates).length > 2; // more than just id + _version
    if (hasUpdates) {
      updates.lastUpdated = new Date().toISOString();
      await gqlClient.graphql({
        query: UPDATE_STUDENT_PROFILE,
        variables: { input: updates },
      });
    }

    results.push({ studentId: profile.studentId, consequences });
  }

  // Mark the challenge as inactive (battle resolved)
  await gqlClient.graphql({
    query: UPDATE_CHALLENGE,
    variables: {
      input: {
        id: challengeId,
        active: false,
        _version: challenge._version,
      },
    },
  });

  return {
    applied: true,
    challengeId,
    cohortId,
    studentsAffected: results.length,
    results,
  };
}
