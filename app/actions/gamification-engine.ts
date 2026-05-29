"use server";

/**
 * Gamification Engine — Core Business Logic
 *
 * Ported from amplify/functions/gamification/handler.ts
 * Uses cookie-based Amplify Data Client instead of IAM GraphQL.
 *
 * All functions accept a `client` parameter (from getServerClient())
 * and implement the same logic as the Lambda handler.
 */

import { chatCompletion } from "./chat";

// ============================================================================
// XP Amount Constants
// ============================================================================

export const XP_AMOUNTS: Record<string, number> = {
  HOMEWORK_SUBMITTED: 50,
  AI_FEEDBACK_REVISED: 25,
  ALL_BLOCKS_COMPLETED: 75,
  PEER_REVIEW_GIVEN: 40,
  PEER_REVIEW_HOSTED: 30,
  PEER_REVIEW_TOP_REVIEWER: 60,
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
  SQUAD_CHALLENGE_BONUS: 100,
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

export function calculateLevel(
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
    reasonCounts: Record<string, number>;
  }) => boolean;
}

function rc(
  reasonCounts: Record<string, number>,
  xpLogs: any[],
  reason: string,
): number {
  if (Object.keys(reasonCounts).length > 0) {
    return reasonCounts[reason] || 0;
  }
  return xpLogs.filter((l: any) => l.reason === reason).length;
}

const BADGE_CRITERIA: BadgeCriteria[] = [
  {
    badgeType: "FIRST_SUBMISSION",
    check: ({ xpLogs, reasonCounts }) =>
      rc(reasonCounts, xpLogs, "HOMEWORK_SUBMITTED") >= 1,
  },
  {
    badgeType: "GOOD_EYE",
    check: ({ xpLogs, reasonCounts }) =>
      rc(reasonCounts, xpLogs, "AI_FEEDBACK_REVISED") >= 1,
  },
  {
    badgeType: "QUICK_DRAW",
    check: ({ xpLogs, reasonCounts }) =>
      rc(reasonCounts, xpLogs, "ON_TIME_SUBMISSION") >= 1,
  },
  {
    badgeType: "SHARPSHOOTER",
    check: ({ xpLogs, reasonCounts }) =>
      rc(reasonCounts, xpLogs, "PERFECT_SCORE") >= 3,
  },
  {
    badgeType: "CONSISTENT",
    check: ({ xpLogs, reasonCounts }) =>
      rc(reasonCounts, xpLogs, "STREAK_7DAY") >= 1,
  },
  {
    badgeType: "TEAM_PLAYER",
    check: ({ xpLogs, reasonCounts }) =>
      rc(reasonCounts, xpLogs, "PEER_REVIEW_GIVEN") >= 3,
  },
  {
    badgeType: "DEEP_THINKER",
    check: ({ xpLogs, reasonCounts }) =>
      rc(reasonCounts, xpLogs, "AI_FEEDBACK_REVISED") >= 5,
  },
  {
    badgeType: "TOP_OF_CLASS",
    check: ({ totalXP }) => totalXP >= 500,
  },
  {
    badgeType: "PERFECTIONIST",
    check: ({ xpLogs, reasonCounts }) =>
      rc(reasonCounts, xpLogs, "PERFECT_SCORE") >= 5,
  },
  {
    badgeType: "DRILL_MASTER",
    check: ({ xpLogs, reasonCounts }) =>
      rc(reasonCounts, xpLogs, "PRACTICE_DRILL_COMPLETED") >= 10,
  },
  {
    badgeType: "COMEBACK_KID",
    check: ({ xpLogs, reasonCounts }) =>
      rc(reasonCounts, xpLogs, "COMEBACK") >= 1,
  },
  {
    badgeType: "STREAK_14",
    check: ({ xpLogs, reasonCounts }) =>
      rc(reasonCounts, xpLogs, "STREAK_14DAY") >= 1,
  },
  {
    badgeType: "STREAK_30",
    check: ({ xpLogs, reasonCounts }) =>
      rc(reasonCounts, xpLogs, "STREAK_30DAY") >= 1,
  },
  {
    badgeType: "EASTER_EGG_HUNTER",
    check: ({ xpLogs, reasonCounts }) =>
      rc(reasonCounts, xpLogs, "EASTER_EGG") >= 3,
  },
  {
    badgeType: "PEER_REVIEW_CHAMPION",
    check: ({ xpLogs, reasonCounts }) =>
      rc(reasonCounts, xpLogs, "PEER_REVIEW_TOP_REVIEWER") >= 3,
  },
];

// ============================================================================
// Anti-Badge Criteria
// ============================================================================

interface AntiBadgeCriteria {
  badgeType: string;
  check: (context: {
    xpLogs: any[];
    badges: any[];
    totalXP: number;
    profile: any;
    reasonCounts?: Record<string, number>;
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
    check: ({ xpLogs, profile }) => {
      if (profile.maxFailedAttemptsOnSingleRef != null) {
        return profile.maxFailedAttemptsOnSingleRef >= 5;
      }
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
    check: ({ xpLogs, profile }) => {
      const timestamps: string[] = profile.recentSubmissionTimestamps || [];
      if (timestamps.length >= 3) {
        const sorted = timestamps
          .map((t: string) => new Date(t).getTime())
          .sort((a: number, b: number) => a - b);
        for (let i = 0; i < sorted.length - 2; i++) {
          if (sorted[i + 2] - sorted[i] < 60000) return true;
        }
      }
      if (timestamps.length === 0 && xpLogs.length > 0) {
        const submissions = xpLogs.filter(
          (l: any) => l.reason === "HOMEWORK_SUBMITTED",
        );
        if (submissions.length < 3) return false;
        const sorted = submissions
          .map((l: any) => new Date(l.createdAt).getTime())
          .sort((a: number, b: number) => a - b);
        for (let i = 0; i < sorted.length - 2; i++) {
          if (sorted[i + 2] - sorted[i] < 60000) return true;
        }
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
    check: ({ xpLogs, totalXP, profile }) => {
      if (profile.activeDaysCount != null) {
        return profile.activeDaysCount >= 5 && totalXP === 0;
      }
      const daySet = new Set(
        xpLogs.map((l: any) => l.createdAt?.split("T")[0]),
      );
      if (daySet.size < 5) return false;
      const sumXP = xpLogs.reduce(
        (s: number, l: any) => s + (l.xpAmount || 0),
        0,
      );
      return sumXP === 0 && xpLogs.length > 0;
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
    check: ({ xpLogs, totalXP, profile }) => {
      const submissions =
        profile.totalSubmissions != null
          ? profile.totalSubmissions
          : xpLogs.filter((l: any) => l.reason === "HOMEWORK_SUBMITTED").length;
      if (submissions < 5) return false;
      const avgXP = totalXP / submissions;
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
// Redemption Conditions
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

function evaluateRedemption(
  badgeType: string,
  context: { xpLogs: any[]; profile: any; badge: any },
): boolean {
  const condition = REDEMPTION_CONDITIONS[badgeType];
  if (!condition) return false;

  const { xpLogs, profile, badge } = context;
  const appliedAt = badge.awardedAt ? new Date(badge.awardedAt).getTime() : 0;

  switch (condition.type) {
    case "SUBMIT_ANY":
      return xpLogs.some(
        (l: any) =>
          l.reason === "HOMEWORK_SUBMITTED" &&
          new Date(l.createdAt).getTime() > appliedAt,
      );
    case "CONSECUTIVE_ON_TIME": {
      const threshold = condition.count || 3;
      const onTimeSubs = xpLogs.filter(
        (l: any) =>
          l.reason === "ON_TIME_SUBMISSION" &&
          new Date(l.createdAt).getTime() > appliedAt,
      );
      return onTimeSubs.length >= threshold;
    }
    case "LOGIN_STREAK":
      return (profile.currentStreak || 0) >= (condition.count || 3);
    case "BUILD_STREAK":
      return (profile.currentStreak || 0) >= (condition.count || 7);
    case "COMPLETE_ASSIGNMENT":
      return xpLogs.some(
        (l: any) =>
          l.reason === "HOMEWORK_SUBMITTED" &&
          new Date(l.createdAt).getTime() > appliedAt,
      );
    case "ACCURACY_ABOVE": {
      const threshold = condition.percent || 70;
      return xpLogs.some(
        (l: any) =>
          l.reason === "HOMEWORK_SUBMITTED" &&
          new Date(l.createdAt).getTime() > appliedAt &&
          (l.accuracy || 0) >= threshold,
      );
    }
    case "SCORE_ON_TOPIC": {
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
      const threshold = condition.count || 3;
      const periodMs =
        condition.period === "week"
          ? 7 * 24 * 60 * 60 * 1000
          : 24 * 60 * 60 * 1000;
      const windowStart = Date.now() - periodMs;
      const recentActivities = xpLogs.filter(
        (l: any) =>
          new Date(l.createdAt).getTime() > Math.max(appliedAt, windowStart) &&
          (l.xpAmount || 0) > 0,
      );
      return recentActivities.length >= threshold;
    }
    case "EARN_XP": {
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
      const threshold = condition.count || 3;
      const drills = xpLogs.filter(
        (l: any) =>
          l.reason === "PRACTICE_DRILL_COMPLETED" &&
          new Date(l.createdAt).getTime() > appliedAt,
      );
      return drills.length >= threshold;
    }
    case "WAIT_PERIOD": {
      const hours = condition.hours || 24;
      const elapsed = Date.now() - appliedAt;
      return elapsed >= hours * 60 * 60 * 1000;
    }
    default:
      return false;
  }
}

// ============================================================================
// Debuff Helpers
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
// Profile Helpers
// ============================================================================

async function getOrCreateStudentProfile(
  client: any,
  studentId: string,
  cohortId?: string,
): Promise<any> {
  const { data: profiles } = await client.models.StudentProfile.list({
    filter: { studentId: { eq: studentId } },
  });
  if (profiles && profiles.length > 0) return profiles[0];

  const { data: created } = await client.models.StudentProfile.create({
    studentId,
    cohortId: cohortId || null,
    totalXP: 0,
    level: 1,
    currentStreak: 0,
    longestStreak: 0,
    freezesRemaining: 0,
    freezesUsed: 0,
  });
  return created;
}

// ============================================================================
// awardXP — Creates an XP log entry and returns the new total
// ============================================================================

export async function engineAwardXP(
  client: any,
  args: {
    studentId: string;
    reason: string;
    referenceId?: string;
    cohortId?: string;
    unitID?: string;
    accuracy?: number;
    overrideAmount?: number;
  },
) {
  const {
    studentId,
    reason,
    referenceId,
    cohortId,
    unitID,
    accuracy,
    overrideAmount,
  } = args;
  let xpAmount = overrideAmount ?? XP_AMOUNTS[reason];
  if (!xpAmount) throw new Error(`Invalid XP reason: ${reason}`);

  // Load section XP config
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
      const { data: section } = await client.models.Section.get({
        id: cohortId,
      });
      if (section?.xpConfig) {
        xpConfig =
          typeof section.xpConfig === "string"
            ? JSON.parse(section.xpConfig)
            : section.xpConfig;
      }
    } catch (err) {
      console.warn("[gamification] Failed to load section xpConfig:", err);
    }
  }

  // If XP is disabled for this section, return early
  if (xpConfig.enabled === false) {
    return { alreadyAwarded: false, xpAmount: 0, totalXP: 0, xpDisabled: true };
  }

  // Apply per-action multiplier
  if (xpConfig.multipliers && xpConfig.multipliers[reason] !== undefined) {
    xpAmount = Math.round(xpAmount * xpConfig.multipliers[reason]);
  }

  // Apply active debuff XP multipliers
  if (cohortId) {
    try {
      const profile = await getOrCreateStudentProfile(
        client,
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

  if (xpAmount <= 0) {
    return { alreadyAwarded: false, xpAmount: 0, totalXP: 0, xpDisabled: true };
  }

  // Fetch all XP logs for duplicate check and diminishing returns
  const { data: allLogs } = await client.models.StudentXPLog.list({
    filter: { studentId: { eq: studentId } },
  });
  const validLogs = (allLogs || []).filter((l: any) => l != null);

  // Apply diminishing returns for practice drill XP
  if (
    reason === "PRACTICE_DRILL_COMPLETED" ||
    reason === "PRACTICE_DRILL_ACCURACY_BONUS"
  ) {
    const todayStr = new Date().toISOString().split("T")[0];
    const todayPracticeLogs = validLogs.filter(
      (l: any) => l.reason === reason && l.createdAt?.startsWith(todayStr),
    );
    xpAmount = calculatePracticeDrillXP(xpAmount, todayPracticeLogs.length);
  }

  // Prevent duplicate XP for same action+reference
  if (referenceId) {
    const duplicate = validLogs.find(
      (l: any) => l.reason === reason && l.referenceId === referenceId,
    );
    if (duplicate) {
      return {
        alreadyAwarded: true,
        xpAmount: 0,
        totalXP: validLogs.reduce((s: number, l: any) => s + l.xpAmount, 0),
      };
    }
  }

  // Enforce daily/weekly XP caps
  if (xpConfig.dailyCap && xpConfig.dailyCap > 0) {
    const todayStr = new Date().toISOString().split("T")[0];
    const todayXP = validLogs
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
        totalXP: validLogs.reduce((s: number, l: any) => s + l.xpAmount, 0),
        capReached: "daily",
      };
    }
    xpAmount = Math.min(xpAmount, xpConfig.dailyCap - todayXP);
  }

  if (xpConfig.weeklyCap && xpConfig.weeklyCap > 0) {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekStartISO = weekStart.toISOString();
    const weekXP = validLogs
      .filter(
        (l: any) =>
          l.createdAt >= weekStartISO && (!cohortId || l.cohortId === cohortId),
      )
      .reduce((s: number, l: any) => s + l.xpAmount, 0);
    if (weekXP >= xpConfig.weeklyCap) {
      return {
        alreadyAwarded: false,
        xpAmount: 0,
        totalXP: validLogs.reduce((s: number, l: any) => s + l.xpAmount, 0),
        capReached: "weekly",
      };
    }
    xpAmount = Math.min(xpAmount, xpConfig.weeklyCap - weekXP);
  }

  // Create XP log entry
  await client.models.StudentXPLog.create({
    studentId,
    xpAmount,
    reason,
    accuracy: accuracy != null ? accuracy : null,
    referenceId: referenceId || null,
    cohortId: cohortId || null,
    unitID: unitID || null,
  });

  const currentTotal = validLogs.reduce(
    (s: number, l: any) => s + l.xpAmount,
    0,
  );
  const totalXP = currentTotal + xpAmount;

  return { alreadyAwarded: false, xpAmount, totalXP };
}

// ============================================================================
// checkBadges — Evaluates badge criteria and awards new badges
// ============================================================================

export async function engineCheckBadges(
  client: any,
  args: { studentId: string; cohortId?: string; unitID?: string },
) {
  const { studentId, cohortId, unitID } = args;

  // Check section settings
  let badgesEnabled = true;
  let antiBadgesEnabled = true;
  if (cohortId) {
    try {
      const { data: section } = await client.models.Section.get({
        id: cohortId,
      });
      if (section?.badgesEnabled === false) badgesEnabled = false;
      if (section?.antiBadgesEnabled === false) antiBadgesEnabled = false;
    } catch {
      // Non-fatal
    }
  }

  if (!badgesEnabled) {
    return {
      newBadges: [],
      updatedBadges: [],
      newAntiBadges: [],
      redeemedBadges: [],
    };
  }

  // Fetch XP logs and profile
  const { data: xpLogs } = await client.models.StudentXPLog.list({
    filter: { studentId: { eq: studentId } },
  });
  const validLogs = (xpLogs || []).filter((l: any) => l != null);

  const profile = await getOrCreateStudentProfile(client, studentId, cohortId);

  const existingBadges: any[] = (() => {
    try {
      const raw = profile.badges;
      if (!raw) return [];
      return typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      return [];
    }
  })();
  const existingByType = new Map<string, any>(
    existingBadges.map((b: any) => [b.badgeType, b]),
  );
  const totalXP = validLogs.reduce(
    (s: number, l: any) => s + (l.xpAmount || 0),
    0,
  );
  const reasonCounts: Record<string, number> = {};
  for (const log of validLogs) {
    if (log.reason) {
      reasonCounts[log.reason] = (reasonCounts[log.reason] || 0) + 1;
    }
  }

  const newBadges: string[] = [];
  const updatedBadges: string[] = [];

  for (const criteria of BADGE_CRITERIA) {
    if (
      !criteria.check({
        xpLogs: validLogs,
        badges: existingBadges,
        totalXP,
        reasonCounts,
      })
    )
      continue;

    const existing = existingByType.get(criteria.badgeType);
    if (existing) {
      existing.count = (existing.count || 1) + 1;
      existing.awardedAt = new Date().toISOString();
      if (cohortId) existing.cohortId = cohortId;
      if (unitID) existing.unitID = unitID;
      updatedBadges.push(criteria.badgeType);
    } else {
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

  // Anti-badge check
  const newAntiBadges: string[] = [];
  const activeDebuffs: any[] = getActiveDebuffs(profile);

  if (antiBadgesEnabled) {
    for (const criteria of ANTI_BADGE_CRITERIA) {
      if (
        !criteria.check({
          xpLogs: validLogs,
          badges: existingBadges,
          totalXP,
          profile,
          reasonCounts,
        })
      )
        continue;

      const existing = existingByType.get(criteria.badgeType);
      if (existing) {
        existing.count = (existing.count || 1) + 1;
        existing.awardedAt = new Date().toISOString();
        if (cohortId) existing.cohortId = cohortId;
        refreshDebuff(activeDebuffs, criteria.badgeType, criteria.debuff);
      } else {
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
        applyDebuff(activeDebuffs, criteria.badgeType, criteria.debuff);
      }
    }
  }

  // Auto-redeem anti-badges
  const redeemedBadges: string[] = [];
  const badgesToRemove: Set<string> = new Set();
  for (const badge of existingBadges) {
    if (!badge.isAnti) continue;
    if (!REDEMPTION_CONDITIONS[badge.badgeType]) continue;
    if (
      evaluateRedemption(badge.badgeType, {
        xpLogs: validLogs,
        profile,
        badge,
      })
    ) {
      badgesToRemove.add(badge.badgeType);
      redeemedBadges.push(badge.badgeType);
      const debuffIdx = activeDebuffs.findIndex(
        (d) => d.badgeType === badge.badgeType,
      );
      if (debuffIdx >= 0) activeDebuffs.splice(debuffIdx, 1);
    }
  }
  if (badgesToRemove.size > 0) {
    for (let i = existingBadges.length - 1; i >= 0; i--) {
      if (badgesToRemove.has(existingBadges[i].badgeType)) {
        existingBadges.splice(i, 1);
      }
    }
  }

  // Apply streak freeze removal penalty
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
    badges: existingBadges,
    activeDebuffs: JSON.stringify(activeDebuffs),
    _version: profile._version ?? 1,
  };
  if (freezesPenalty > 0) {
    const currentFreezes = profile.freezesRemaining || 0;
    updateInput.freezesRemaining = Math.max(0, currentFreezes - freezesPenalty);
  }

  try {
    await client.models.StudentProfile.update(updateInput);
  } catch (err) {
    console.error("[gamification] checkBadges profile update error:", err);
  }

  // Create notifications for new badges
  try {
    for (const badgeType of newBadges) {
      await client.models.Notification.create({
        recipientId: studentId,
        type: "BADGE_EARNED",
        title: `Badge Earned: ${badgeType}`,
        body: `You've earned the "${badgeType}" badge!`,
        referenceId: badgeType,
        referenceType: "Badge",
        senderName: "System",
        linkPath: "/profile",
        linkLabel: "View Badges",
        metadata: JSON.stringify({ badgeType }),
      });
    }
    for (const badgeType of newAntiBadges) {
      await client.models.Notification.create({
        recipientId: studentId,
        type: "DEBUFF_APPLIED",
        title: `Debuff Applied: ${badgeType}`,
        body: `A debuff has been applied. Complete challenges to remove it!`,
        referenceId: badgeType,
        referenceType: "Badge",
        senderName: "System",
        linkPath: "/profile",
        linkLabel: "View Status",
        metadata: JSON.stringify({ badgeType }),
      });
    }
    for (const badgeType of redeemedBadges) {
      await client.models.Notification.create({
        recipientId: studentId,
        type: "DEBUFF_EXPIRED",
        title: `Debuff Removed: ${badgeType}`,
        body: `Your "${badgeType}" debuff has been redeemed. Great job!`,
        referenceId: badgeType,
        referenceType: "Badge",
        senderName: "System",
        metadata: JSON.stringify({ badgeType }),
      });
    }
  } catch (err) {
    console.warn("[gamification] Badge notification creation failed:", err);
  }

  return { newBadges, updatedBadges, newAntiBadges, redeemedBadges };
}

// ============================================================================
// updateStreak — Updates the student's activity streak
// ============================================================================

export async function engineUpdateStreak(
  client: any,
  args: { studentId: string },
) {
  const { studentId } = args;
  const today = new Date().toISOString().split("T")[0];

  const profile = await getOrCreateStudentProfile(client, studentId);
  const existingStreak = profile.currentStreak || 0;
  const existingLongest = profile.longestStreak || 0;
  const lastActivity = profile.lastActivityDate || null;
  let freezesRemaining = profile.freezesRemaining || 0;
  let freezesUsed = profile.freezesUsed || 0;

  if (!lastActivity && existingStreak === 0) {
    await client.models.StudentProfile.update({
      id: profile.id,
      currentStreak: 1,
      longestStreak: 1,
      lastActivityDate: today,
      freezesRemaining: 0,
      freezesUsed: 0,
      _version: profile._version ?? 1,
    });
    return { currentStreak: 1, longestStreak: 1, lastActivityDate: today };
  }

  if (lastActivity === today) {
    return {
      currentStreak: existingStreak,
      longestStreak: existingLongest,
      lastActivityDate: today,
    };
  }

  const lastDate = new Date(lastActivity);
  const todayDate = new Date(today);
  const diffDays = Math.floor(
    (todayDate.getTime() - lastDate.getTime()) / (86400 * 1000),
  );

  let newStreak: number;
  let comebackTriggered = false;
  let streakXPReason: string | null = null;

  if (diffDays === 1) {
    newStreak = existingStreak + 1;
  } else if (diffDays === 2 && freezesRemaining > 0) {
    newStreak = existingStreak + 1;
    freezesRemaining -= 1;
    freezesUsed += 1;
  } else if (diffDays > 7) {
    newStreak = 1;
    comebackTriggered = true;
  } else {
    newStreak = 1;
  }

  if (newStreak > 0 && newStreak % 7 === 0) {
    freezesRemaining += 1;
  }

  if (newStreak === 3) streakXPReason = "STREAK_3DAY";
  else if (newStreak === 7) streakXPReason = "STREAK_7DAY";
  else if (newStreak === 14) streakXPReason = "STREAK_14DAY";
  else if (newStreak === 30) streakXPReason = "STREAK_30DAY";

  const longestStreak = Math.max(existingLongest, newStreak);

  await client.models.StudentProfile.update({
    id: profile.id,
    currentStreak: newStreak,
    longestStreak,
    lastActivityDate: today,
    freezesRemaining,
    freezesUsed,
    _version: profile._version ?? 1,
  });

  // Award streak milestone XP
  if (streakXPReason) {
    try {
      await engineAwardXP(client, {
        studentId,
        reason: streakXPReason,
        referenceId: `streak-${newStreak}-${today}`,
      });
    } catch (err) {
      console.error("[gamification] streak milestone XP error:", err);
    }
    try {
      await client.models.Notification.create({
        recipientId: studentId,
        type: "STREAK_MILESTONE",
        title: `${newStreak}-Day Streak! 🔥`,
        body: `You've maintained a ${newStreak}-day study streak. Amazing dedication!`,
        referenceId: `streak-${newStreak}`,
        referenceType: "StudentProfile",
        senderName: "System",
        metadata: JSON.stringify({ streak: newStreak }),
      });
    } catch (err) {
      console.warn("[gamification] streak notification failed:", err);
    }
  }

  if (comebackTriggered) {
    try {
      await engineAwardXP(client, {
        studentId,
        reason: "COMEBACK",
        referenceId: `comeback-${today}`,
      });
    } catch (err) {
      console.error("[gamification] comeback XP error:", err);
    }
  }

  return {
    currentStreak: newStreak,
    longestStreak,
    lastActivityDate: today,
    comebackTriggered,
  };
}

// ============================================================================
// checkPersonalBest — Checks if a score beats the student's PB
// ============================================================================

export async function engineCheckPersonalBest(
  client: any,
  args: { studentId: string; unitID: string; score: number },
) {
  const { studentId, unitID, score } = args;

  const profile = await getOrCreateStudentProfile(client, studentId);
  const personalBests: any[] = (() => {
    try {
      const raw = profile.personalBests;
      if (!raw) return [];
      return typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      return [];
    }
  })();
  const existingPB = personalBests.find((pb: any) => pb.unitID === unitID);

  if (!existingPB) {
    personalBests.push({
      unitID,
      bestScore: score,
      achievedAt: new Date().toISOString(),
      previousBest: null,
    });
    await client.models.StudentProfile.update({
      id: profile.id,
      personalBests,
      _version: profile._version ?? 1,
    });
    return {
      isNewBest: true,
      firstAttempt: true,
      bestScore: score,
      previousBest: null,
    };
  }

  if (score > existingPB.bestScore) {
    existingPB.previousBest = existingPB.bestScore;
    existingPB.bestScore = score;
    existingPB.achievedAt = new Date().toISOString();

    await client.models.StudentProfile.update({
      id: profile.id,
      personalBests,
      _version: profile._version ?? 1,
    });

    const today = new Date().toISOString().split("T")[0];
    try {
      await engineAwardXP(client, {
        studentId,
        reason: "PERSONAL_BEST",
        referenceId: `pb-${unitID}-${today}`,
      });
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
// checkEasterEggs — Scans for easter eggs by trigger
// ============================================================================

export async function engineCheckEasterEggs(
  client: any,
  args: {
    studentId: string;
    submissionText: string;
    triggerType?: string;
    studentStats?: {
      lastAccuracy?: number;
      currentStreak?: number;
      totalXP?: number;
      level?: number;
      unitsCompleted?: number;
    };
  },
) {
  const { studentId, submissionText, triggerType, studentStats } = args;
  const filterType = triggerType || "KEYWORD";

  const { data: eggs } = await client.models.EasterEgg.list({
    filter: { active: { eq: true }, trigger: { eq: filterType } },
  });
  const validEggs = (eggs || []).filter((e: any) => e != null);

  if (validEggs.length === 0) return { discovered: [] };

  // Check already-discovered eggs via StudentProfile (students have read-only access to EasterEgg records)
  const profile = await getOrCreateStudentProfile(client, studentId);
  const profileEasterEggs: Array<{
    easterEggId: string;
    discoveredAt?: string;
    xpReward?: number;
  }> = profile.easterEggs || [];
  const discoveredIds = new Set<string>(
    profileEasterEggs.map((e: any) => e.easterEggId).filter(Boolean),
  );

  const discovered: Array<{
    eggId: string;
    message: string;
    xpReward: number;
  }> = [];
  const textLower = (submissionText || "").toLowerCase();
  const newDiscoveries: Array<{
    easterEggId: string;
    discoveredAt: string;
    xpReward: number;
  }> = [];

  for (const egg of validEggs) {
    if (discoveredIds.has(egg.id)) continue;

    let matched = false;

    if (egg.trigger === "KEYWORD") {
      matched = textLower.includes((egg.triggerValue || "").toLowerCase());
    } else if (egg.trigger === "SCHEDULE") {
      try {
        const { start, end } = JSON.parse(egg.triggerValue || "{}");
        const now = new Date().toISOString();
        matched = (!start || now >= start) && (!end || now <= end);
      } catch {
        matched = false;
      }
    } else if (egg.trigger === "ACHIEVEMENT") {
      // Condition string: "accuracy>=95", "streak>=7", "xp>=1000"
      if (studentStats) {
        matched = evaluateAchievementCondition(
          egg.triggerValue || "",
          studentStats,
        );
      }
    }
    // SECRET_LINK is handled via engineDiscoverEasterEgg directly

    if (matched) {
      if (egg.xpReward > 0) {
        try {
          await engineAwardXP(client, {
            studentId,
            reason: "EASTER_EGG",
            referenceId: `egg-${egg.id}`,
          });
        } catch (err) {
          console.error("[gamification] easter egg XP error:", err);
        }
      }

      newDiscoveries.push({
        easterEggId: egg.id,
        discoveredAt: new Date().toISOString(),
        xpReward: egg.xpReward || 0,
      });

      discovered.push({
        eggId: egg.id,
        message: egg.revealMessage,
        xpReward: egg.xpReward,
      });
    }
  }

  // Write all new discoveries to StudentProfile.easterEggs in one update
  // Students own their profile — this write is permitted
  if (newDiscoveries.length > 0) {
    try {
      await client.models.StudentProfile.update({
        id: profile.id,
        easterEggs: [...profileEasterEggs, ...newDiscoveries],
        _version: profile._version ?? 1,
      });
    } catch (err) {
      console.error("[gamification] profile easter egg update error:", err);
    }
  }

  return { discovered };
}

// ============================================================================
// discoverEasterEgg — Direct discovery for manual triggers
// ============================================================================

export async function engineDiscoverEasterEgg(
  client: any,
  args: { studentId: string; eggId: string },
) {
  const { studentId, eggId } = args;

  const { data: eggRecord } = await client.models.EasterEgg.get({ id: eggId });
  if (!eggRecord) return { error: "Easter egg not found" };

  // Check discovery status via StudentProfile (students have read-only access to EasterEgg records)
  const profile = await getOrCreateStudentProfile(client, studentId);
  const profileEasterEggs: Array<{
    easterEggId: string;
    discoveredAt?: string;
    xpReward?: number;
  }> = profile.easterEggs || [];
  const alreadyFound = profileEasterEggs.some(
    (e: any) => e.easterEggId === eggId,
  );

  if (alreadyFound) return { alreadyDiscovered: true };

  // Record discovery on StudentProfile (student owns this — write is permitted)
  try {
    await client.models.StudentProfile.update({
      id: profile.id,
      easterEggs: [
        ...profileEasterEggs,
        {
          easterEggId: eggId,
          discoveredAt: new Date().toISOString(),
          xpReward: eggRecord.xpReward || 0,
        },
      ],
      _version: profile._version ?? 1,
    });
  } catch (err) {
    console.error(
      "[gamification] discoverEasterEgg profile update error:",
      err,
    );
  }

  if (eggRecord.xpReward > 0) {
    try {
      await engineAwardXP(client, {
        studentId,
        reason: "EASTER_EGG",
        referenceId: `egg-${eggId}`,
      });
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
// updateSquadXP — Updates squad total and contributes to challenges
// ============================================================================

export async function engineUpdateSquadXP(
  client: any,
  args: { studentId: string; xpAmount: number },
) {
  const { studentId, xpAmount } = args;

  const profile = await getOrCreateStudentProfile(client, studentId);
  const cohortId = profile.cohortId;
  if (!cohortId) {
    return { updated: false, reason: "Student has no cohort" };
  }

  const { data: allSquads } = await client.models.Squad.list({
    filter: { cohortId: { eq: cohortId } },
  });
  const validSquads = (allSquads || []).filter((g: any) => g != null);

  const memberSquads = validSquads.filter((squad: any) => {
    const members = squad.members || [];
    return members.some((m: any) => m?.studentId === studentId);
  });

  if (memberSquads.length === 0) {
    return { updated: false, reason: "Student has no squad memberships" };
  }

  const updatedSquads: string[] = [];

  for (const squad of memberSquads) {
    const newTotal = (squad.totalXP || 0) + xpAmount;
    await client.models.Squad.update({
      id: squad.id,
      totalXP: newTotal,
      _version: squad._version ?? 1,
    });
    updatedSquads.push(squad.id);
    // Challenge rollup happens automatically via the DynamoDB Stream on any
    // StudentXPLog entry that carries cohortId. No explicit call needed here.
  }

  return { updated: true, squads: updatedSquads };
}

// ============================================================================
// contributeToChallenge — No-op; challenge rollup is stream-driven
//
// Students CANNOT write to GroupChallenge records (read-only auth rule).
// GroupChallenge.currentXP is updated exclusively by the leaderboardStream
// Lambda (IAM credentials) which triggers on every StudentXPLog INSERT that
// carries a cohortId. Any XP log created with cohortId set will automatically
// roll up into active challenges for that cohort.
//
// This function is kept for API compatibility with callers that pass cohortId
// explicitly. The actual contribution signal is the XP log from the student's
// original action (e.g. HOMEWORK_SUBMITTED) with cohortId set.
// ============================================================================

export async function engineContributeToChallenge(
  _client: any,
  _args: { studentId: string; cohortId: string; xpContributed: number },
): Promise<{ contributed: true }> {
  // Stream handler handles GroupChallenge rollup with IAM privileges.
  return { contributed: true };
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
  const accuracyFactor = Math.max(0, 1 - averageAccuracy / 100);
  const weaknessRatio = totalConcepts > 0 ? weakCount / totalConcepts : 0;
  const confusionFactor = Math.min(1, confusionCount / 5);
  const decayFactor = Math.min(1, daysSinceLastPractice / 7);
  return Math.min(
    1,
    accuracyFactor * 0.35 +
      weaknessRatio * 0.25 +
      confusionFactor * 0.2 +
      decayFactor * 0.2,
  );
}

export async function engineUpdateStudentUnitMemory(
  client: any,
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

  const { data: allEntries } = await client.models.StudentMemory.list({
    filter: { studentId: { eq: studentId } },
  });
  const validEntries = (allEntries || []).filter((e: any) => e != null);
  const existing = validEntries.find((e: any) => e.unitID === unitID);

  if (existing) {
    const prevWeak: ConceptEntry[] = existing.weakConcepts || [];
    const prevStrong: ConceptEntry[] = existing.strongConcepts || [];
    const prevPairs: ConfusionPair[] = existing.confusionPairs || [];
    const prevAccBySource: Record<string, number> =
      existing.accuracyBySource || {};
    const prevAttempts = existing.totalAttempts || 0;
    const prevAvgAcc = existing.averageAccuracy || 0;

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

    const strongSet = new Set(strongAreas);
    const filteredWeak = mergedWeak.filter((c) => !strongSet.has(c.concept));
    const weakSet = new Set(weakAreas);
    const filteredStrong = mergedStrong.filter((c) => !weakSet.has(c.concept));

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

    const mergedAccBySource = { ...prevAccBySource };
    for (const [src, acc] of Object.entries(incomingAccBySource)) {
      if (mergedAccBySource[src] !== undefined) {
        mergedAccBySource[src] =
          Math.round(((mergedAccBySource[src] + acc) / 2) * 100) / 100;
      } else {
        mergedAccBySource[src] = acc;
      }
    }

    const newAttempts = prevAttempts + 1;
    const newAvgAcc =
      Math.round(((prevAvgAcc * prevAttempts + accuracy) / newAttempts) * 100) /
      100;
    const totalConcepts = filteredWeak.length + filteredStrong.length;
    const reviewPriority = calculateReviewPriority(
      newAvgAcc,
      filteredWeak.length,
      totalConcepts,
      mergedPairs.length,
      0,
    );

    await client.models.StudentMemory.update({
      id: existing.id,
      weakConcepts: filteredWeak,
      strongConcepts: filteredStrong,
      confusionPairs: mergedPairs,
      accuracyBySource: mergedAccBySource,
      totalAttempts: newAttempts,
      averageAccuracy: newAvgAcc,
      reviewPriority,
      lastPracticedAt: timestamp,
      _version: existing._version ?? 1,
    });
  } else {
    const totalConcepts = weakAreas.length + strongAreas.length;
    const reviewPriority = calculateReviewPriority(
      accuracy,
      weakAreas.length,
      totalConcepts,
      incomingPairs.length,
      0,
    );

    await client.models.StudentMemory.create({
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
    });
  }

  // Sync to profile
  try {
    await syncUnitMemoriesToProfile(client, studentId);
  } catch (err) {
    console.error("[gamification] syncUnitMemoriesToProfile error:", err);
  }

  return { success: true };
}

async function syncUnitMemoriesToProfile(client: any, studentId: string) {
  const { data: allMemories } = await client.models.StudentMemory.list({
    filter: { studentId: { eq: studentId } },
  });
  const unitMemories = (allMemories || []).filter(
    (m: any) => m != null && m.unitID != null,
  );
  const profile = await getOrCreateStudentProfile(client, studentId);
  const unitMemoriesForProfile = unitMemories.map((m: any) => ({
    unitID: m.unitID,
    averageAccuracy: m.averageAccuracy || 0,
    totalAttempts: m.totalAttempts || 0,
    reviewPriority: m.reviewPriority || 0,
    lastPracticedAt: m.lastPracticedAt || "",
  }));
  await client.models.StudentProfile.update({
    id: profile.id,
    unitMemories: unitMemoriesForProfile,
    _version: profile._version ?? 1,
  });
}

// ============================================================================
// rebuildStudentMemoryProfile — Aggregate per-unit data into central profile
// ============================================================================

export async function engineRebuildStudentMemoryProfile(
  client: any,
  args: { studentId: string },
) {
  const { studentId } = args;

  const { data: allEntries } = await client.models.StudentMemory.list({
    filter: { studentId: { eq: studentId } },
  });
  const unitMemories = (allEntries || []).filter(
    (item: any) => item != null && item.unitID != null,
  );

  if (unitMemories.length === 0) {
    return { skipped: true, message: "No unit memories to aggregate" };
  }

  const weakMap = new Map<
    string,
    { concept: string; frequency: number; units: number }
  >();
  const strongMap = new Map<
    string,
    { concept: string; frequency: number; units: number }
  >();
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

  const topWeak = Array.from(weakMap.values())
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10);
  const topStrong = Array.from(strongMap.values())
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10);

  const sourceAvg: Record<string, number> = {};
  for (const [src, data] of Object.entries(sourceAccSums)) {
    sourceAvg[src] = Math.round((data.sum / data.count) * 100) / 100;
  }
  const dominantSourceWeakness =
    Object.entries(sourceAvg).sort(([, a], [, b]) => a - b)[0]?.[0] || null;

  const structuredProfile = {
    topWeakConcepts: topWeak,
    topStrongConcepts: topStrong,
    dominantSourceWeakness,
    sourceAverages: sourceAvg,
    unitsStudied: unitMemories.length,
    lastUpdated: new Date().toISOString(),
  };

  // Build markdown summary
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

  if (summaryMarkdown.length > 2000) {
    summaryMarkdown = summaryMarkdown.slice(0, 1997) + "...";
  }

  // Upsert StudentMemory (global, no unitID)
  const globalMemories = (allEntries || []).filter(
    (e: any) => e != null && !e.unitID,
  );
  const existingMem = globalMemories[0];

  if (existingMem) {
    await client.models.StudentMemory.update({
      id: existingMem.id,
      memoryMarkdown: summaryMarkdown,
      structuredProfile: JSON.stringify(structuredProfile),
      lastUpdatedBy: "profile-rebuild",
      version: (existingMem.version || 0) + 1,
      _version: existingMem._version ?? 1,
    });
  } else {
    await client.models.StudentMemory.create({
      studentId,
      memoryMarkdown: summaryMarkdown,
      structuredProfile: JSON.stringify(structuredProfile),
      lastUpdatedBy: "profile-rebuild",
      version: 1,
    });
  }

  return { updated: true, profile: structuredProfile };
}

// ============================================================================
// advanceSkillProgress — Advances skill with prerequisite checks
// ============================================================================

export async function engineAdvanceSkillProgress(
  client: any,
  args: { studentId: string; skillId: string; newStatus: string },
) {
  const { studentId, skillId, newStatus } = args;

  const validStatuses = ["LOCKED", "AVAILABLE", "IN_PROGRESS", "MASTERED"];
  if (!validStatuses.includes(newStatus)) {
    return { error: `Invalid status: ${newStatus}` };
  }

  const validTransitions: Record<string, string[]> = {
    LOCKED: ["AVAILABLE"],
    AVAILABLE: ["IN_PROGRESS"],
    IN_PROGRESS: ["MASTERED"],
  };

  const profile = await getOrCreateStudentProfile(client, studentId);
  const allProgress: any[] = (() => {
    try {
      const raw = profile.skillProgress;
      if (!raw) return [];
      return typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      return [];
    }
  })();
  const existing = allProgress.find((p: any) => p.skillId === skillId);
  const currentStatus = existing?.status || "LOCKED";

  if (!validTransitions[currentStatus]?.includes(newStatus)) {
    return { error: `Invalid transition: ${currentStatus} → ${newStatus}` };
  }

  if (existing) {
    existing.status = newStatus;
  } else {
    allProgress.push({ skillId, status: newStatus });
  }

  // Unlock dependents if MASTERED
  const unlocked: string[] = [];
  if (newStatus === "MASTERED") {
    const { data: skill } = await client.models.Skill.get({ id: skillId });
    const cohortId = skill?.cohortId;
    if (cohortId) {
      const { data: allSkills } = await client.models.Skill.list({
        filter: { cohortId: { eq: cohortId } },
      });
      const validSkills = (allSkills || []).filter((s: any) => s != null);

      for (const sk of validSkills) {
        const prereqs = sk.prerequisites
          ? typeof sk.prerequisites === "string"
            ? JSON.parse(sk.prerequisites)
            : sk.prerequisites
          : [];
        if (!prereqs.includes(skillId)) continue;

        const depProgress = allProgress.find((p: any) => p.skillId === sk.id);
        if (
          depProgress?.status === "AVAILABLE" ||
          depProgress?.status === "IN_PROGRESS" ||
          depProgress?.status === "MASTERED"
        ) {
          continue;
        }

        const allPrereqsMastered = prereqs.every((prereqId: string) => {
          if (prereqId === skillId) return true;
          const p = allProgress.find((pr: any) => pr.skillId === prereqId);
          return p?.status === "MASTERED";
        });

        if (allPrereqsMastered) {
          const depExisting = allProgress.find((p: any) => p.skillId === sk.id);
          if (depExisting) {
            depExisting.status = "AVAILABLE";
          } else {
            allProgress.push({ skillId: sk.id, status: "AVAILABLE" });
          }
          unlocked.push(sk.id);
        }
      }
    }
  }

  await client.models.StudentProfile.update({
    id: profile.id,
    skillProgress: allProgress,
    _version: profile._version ?? 1,
  });

  return { success: true, skillId, newStatus, unlocked };
}

// ============================================================================
// generateSkillTree — Uses AI to extract skills from unit content
// ============================================================================

function extractTextFromLexicalJSON(data: any): string {
  if (!data?.root?.children) return "";
  const parts: string[] = [];
  function walk(node: any) {
    if (!node) return;
    if (node.text) parts.push(node.text);
    if (node.prompt) parts.push(node.prompt);
    if (node.answer) parts.push(node.answer);
    if (node.phrase) parts.push(node.phrase);
    if (node.definition) parts.push(node.definition);
    if (Array.isArray(node.children)) {
      for (const child of node.children) walk(child);
    }
  }
  walk(data.root);
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

export async function engineGenerateSkillTree(
  client: any,
  args: { unitID: string; cohortId?: string },
) {
  const { unitID, cohortId } = args;

  const { data: unit } = await client.models.Unit.get({ id: unitID });
  if (!unit) throw new Error(`Unit not found: ${unitID}`);

  const lexicalData =
    typeof unit.data === "string" ? JSON.parse(unit.data) : unit.data;
  const unitText = extractTextFromLexicalJSON(lexicalData);

  // Fetch vocabulary
  const { data: unitWords } = await client.models.UnitWord.list({
    filter: { unitID: { eq: unitID } },
  });
  const words: string[] = [];
  for (const uw of unitWords || []) {
    if (uw?.word) {
      try {
        const { data: word } = await client.models.Word.get({
          id: uw.wordId || uw.word?.id,
        });
        if (word) words.push(`${word.word}: ${word.definition || ""}`);
      } catch {
        // Skip
      }
    }
  }

  // Fetch questions
  const { data: unitQuestions } = (await client.models.UnitQuestion?.list?.({
    filter: { unitID: { eq: unitID } },
  })) || { data: [] };
  const questions: string[] = [];
  for (const uq of unitQuestions || []) {
    if (uq?.question) {
      try {
        const { data: q } = await client.models.Question.get({
          id: uq.questionId || uq.question?.id,
        });
        if (q) questions.push(q.question);
      } catch {
        // Skip
      }
    }
  }

  // Build prompt
  const promptParts: string[] = [`# Unit: ${unit.name}`];
  if (unit.description) promptParts.push(`Description: ${unit.description}`);
  if (unitText) {
    const truncated =
      unitText.length > 6000 ? unitText.slice(0, 6000) + "..." : unitText;
    promptParts.push(`\n## Lesson Content\n${truncated}`);
  }
  if (words.length > 0) {
    promptParts.push(`\n## Vocabulary (${words.length} words)`);
    words.slice(0, 30).forEach((w) => promptParts.push(`- ${w}`));
  }
  if (questions.length > 0) {
    promptParts.push(`\n## Practice Questions (${questions.length})`);
    questions
      .slice(0, 15)
      .forEach((q, i) => promptParts.push(`${i + 1}. ${q}`));
  }
  promptParts.push(`\n## Instructions
Analyze the above lesson content and produce a skill tree with 4–10 skills.
Each skill should be a discrete, assessable learning outcome with prerequisites.
Return JSON: { "skills": [{ "title": "string", "description": "string", "prerequisites": ["title"], "xpReward": number }] }`);

  const content = await chatCompletion({
    messages: [
      {
        role: "system",
        content: `You are an instructional design expert. Analyze lesson content and produce a structured skill tree. Return ONLY valid JSON, no markdown fences.`,
      },
      { role: "user", content: promptParts.join("\n") },
    ],
    model: "gpt-4o",
    responseFormat: { type: "json_object" },
  });

  if (!content) throw new Error("Empty response from AI");
  const parsed = JSON.parse(content);
  const skillDefs: Array<{
    title: string;
    description: string;
    prerequisites: string[];
    xpReward: number;
  }> = parsed.skills || [];

  if (skillDefs.length === 0) {
    return { generated: false, reason: "No skills extracted", skills: [] };
  }

  const effectiveCohortId = cohortId || `unit-${unitID}`;

  // Delete existing skills for this cohort
  try {
    const { data: existingSkills } = await client.models.Skill.list({
      filter: { cohortId: { eq: effectiveCohortId } },
    });
    for (const skill of existingSkills || []) {
      if (skill) {
        await client.models.Skill.delete({
          id: skill.id,
          _version: skill._version ?? 1,
        });
      }
    }
  } catch (err) {
    console.warn("[gamification] Could not clean up existing skills:", err);
  }

  // Create skills — first pass
  const titleToId = new Map<string, string>();
  const createdSkills: any[] = [];

  for (const def of skillDefs) {
    const { data: created } = await client.models.Skill.create({
      title: def.title,
      description: def.description || null,
      prerequisites: JSON.stringify([]),
      xpReward: def.xpReward || 25,
      cohortId: effectiveCohortId,
      unitIds: [unitID],
      minimumAccuracy: 70,
    });
    if (created) {
      titleToId.set(def.title, created.id);
      createdSkills.push({ ...created, _prereqTitles: def.prerequisites });
    }
  }

  // Second pass: update prerequisites with real IDs
  for (const skill of createdSkills) {
    const prereqIds = (skill._prereqTitles || [])
      .map((title: string) => titleToId.get(title))
      .filter(Boolean);
    if (prereqIds.length > 0) {
      await client.models.Skill.update({
        id: skill.id,
        prerequisites: JSON.stringify(prereqIds),
        _version: skill._version ?? 1,
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

// ============================================================================
// rebuildLeaderboard — Rebuilds leaderboard fields on StudentProfile
// ============================================================================

export async function engineRebuildLeaderboard(
  client: any,
  args: { cohortId: string },
) {
  const { cohortId } = args;

  const { data: section } = await client.models.Section.get({ id: cohortId });
  if (section?.leaderboardEnabled === false) {
    return { updated: 0, total: 0 };
  }

  // Get all grades for this section
  const { data: grades } = await client.models.Grade.list({
    filter: { sectionID: { eq: cohortId } },
  });
  const validGrades = (grades || []).filter((g: any) => g != null);

  const studentIds = [
    ...new Set(validGrades.map((g: any) => g.owner).filter(Boolean)),
  ] as string[];

  // Fetch all XP logs for this cohort
  const { data: cohortXpLogs } = await client.models.StudentXPLog.list({
    filter: { cohortId: { eq: cohortId } },
  });
  const validXpLogs = (cohortXpLogs || []).filter((l: any) => l != null);

  // Group XP logs by studentId
  const xpLogsByStudent = new Map<string, any[]>();
  for (const log of validXpLogs) {
    if (!log?.studentId) continue;
    const existing = xpLogsByStudent.get(log.studentId) || [];
    existing.push(log);
    xpLogsByStudent.set(log.studentId, existing);
  }

  let updated = 0;

  for (const studentId of studentIds) {
    const xpLogs = xpLogsByStudent.get(studentId) || [];
    const totalXP = xpLogs.reduce((s: number, l: any) => s + l.xpAmount, 0);
    const level = calculateLevel(totalXP);
    const completedAssignments = validGrades.filter(
      (g: any) => g.owner === studentId && g.complete,
    ).length;
    const nailedItCount = xpLogs.filter(
      (l: any) => l.reason === "NAILED_IT",
    ).length;

    try {
      const profile = await getOrCreateStudentProfile(
        client,
        studentId,
        cohortId,
      );
      await client.models.StudentProfile.update({
        id: profile.id,
        totalXP,
        level,
        completedAssignments,
        nailedItCount,
        lastUpdated: new Date().toISOString(),
        _version: profile._version ?? 1,
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
// evaluateAchievementCondition — Internal helper for ACHIEVEMENT easter eggs
// ============================================================================

function evaluateAchievementCondition(condition: string, stats: any): boolean {
  const match = condition.match(/^(\w+)(>=|<=|>|<|==)(\d+)$/);
  if (!match) return false;

  const [, metric, operator, valueStr] = match;
  const threshold = Number(valueStr);

  let actual: number;
  switch (metric) {
    case "accuracy":
      actual = stats.lastAccuracy || 0;
      break;
    case "streak":
      actual = stats.currentStreak || 0;
      break;
    case "xp":
      actual = stats.totalXP || 0;
      break;
    case "level":
      actual = stats.level || 1;
      break;
    case "units_completed":
      actual = stats.unitsCompleted || 0;
      break;
    default:
      return false;
  }

  switch (operator) {
    case ">=":
      return actual >= threshold;
    case "<=":
      return actual <= threshold;
    case ">":
      return actual > threshold;
    case "<":
      return actual < threshold;
    case "==":
      return actual === threshold;
    default:
      return false;
  }
}

// ============================================================================
// grantCosmeticReward — Appends a cosmetic reward to StudentProfile
// ============================================================================

async function grantCosmeticReward(
  client: any,
  studentId: string,
  rewardCosmetic: string,
  sourceId: string,
): Promise<void> {
  const parts = rewardCosmetic.split(":");
  if (parts.length < 2) return;

  const type = parts[0];
  const value = parts.slice(1, parts.length > 2 ? -1 : undefined).join(":");
  const durationStr = parts.length > 2 ? parts[parts.length - 1] : null;

  let expiresAt: string | null = null;
  let durationHours: number | null = null;
  if (durationStr && durationStr !== "permanent") {
    const parsed = parseInt(durationStr, 10);
    if (!isNaN(parsed) && parsed > 0) {
      durationHours = parsed;
      expiresAt = new Date(Date.now() + parsed * 60 * 60 * 1000).toISOString();
    }
  }

  const profile = await getOrCreateStudentProfile(client, studentId);
  if (!profile) return;

  const existing = (profile.cosmeticRewards || []) as any[];
  const alreadyGranted = existing.some(
    (r: any) => r.sourceId === sourceId && r.type === type && r.value === value,
  );
  if (alreadyGranted) return;

  await client.models.StudentProfile.update({
    id: profile.id,
    cosmeticRewards: [
      ...existing,
      {
        type,
        value,
        durationHours,
        awardedAt: new Date().toISOString(),
        expiresAt,
        sourceId,
        label: `${type}: ${value}`,
      },
    ],
    _version: profile._version ?? 1,
  });
}

// ============================================================================
// grantChallengeBadge — Awards a custom badge from a challenge victory
// ============================================================================

async function grantChallengeBadge(
  client: any,
  studentId: string,
  badgeType: string,
  challengeId: string,
  cohortId: string,
): Promise<void> {
  const profile = await getOrCreateStudentProfile(client, studentId);
  if (!profile) return;

  const existingBadges = (profile.badges || []) as any[];
  const alreadyGranted = existingBadges.some(
    (b: any) =>
      b.badgeType === badgeType && b.sourceId === `challenge-${challengeId}`,
  );
  if (alreadyGranted) return;

  await client.models.StudentProfile.update({
    id: profile.id,
    badges: [
      ...existingBadges,
      {
        badgeType,
        sourceId: `challenge-${challengeId}`,
        awardedAt: new Date().toISOString(),
        cohortId,
      },
    ],
    _version: profile._version ?? 1,
  });
}

// ============================================================================
// engineCheckEasterEggs (ACHIEVEMENT branch) — exported via the main function above.
// Re-export of evaluateAchievementCondition for callers that pass studentStats.
// The main engineCheckEasterEggs already handles KEYWORD and SCHEDULE; ACHIEVEMENT
// is handled here by accepting optional studentStats and evaluating conditions.
// ============================================================================

// NOTE: engineCheckEasterEggs above is the correct function. The ACHIEVEMENT branch
// was missing — it is now added below as a companion export that can be called
// with stats when the caller has them available.
export { evaluateAchievementCondition };

// ============================================================================
// engineUpdateStudentMemory — Append raw feedback to StudentMemory.memoryMarkdown
// ============================================================================

export async function engineUpdateStudentMemory(
  client: any,
  args: { studentId: string; feedbackMarkdown: string; source: string },
) {
  const { studentId, feedbackMarkdown, source } = args;

  const { data: allEntries } = await client.models.StudentMemory.list({
    filter: { studentId: { eq: studentId } },
  });
  const validEntries = (allEntries || []).filter(
    (e: any) => e != null && !e.unitID,
  );
  const existing = validEntries[0] || null;

  const timestamp = new Date().toISOString();
  const newSection = `\n\n---\n### ${source} (${timestamp})\n${feedbackMarkdown}`;

  if (existing) {
    const updatedMarkdown = (existing.memoryMarkdown || "") + newSection;
    const { data: updated } = await client.models.StudentMemory.update({
      id: existing.id,
      memoryMarkdown: updatedMarkdown,
      lastUpdatedBy: source,
      version: (existing.version || 0) + 1,
      _version: existing._version ?? 1,
    });
    return updated;
  } else {
    const { data: created } = await client.models.StudentMemory.create({
      studentId,
      memoryMarkdown: `# Student Memory\n\nAutomatically maintained by AI feedback system.${newSection}`,
      lastUpdatedBy: source,
      version: 1,
    });
    return created;
  }
}

// ============================================================================
// engineBootstrapStudentMemory — One-time memory creation from activity history
// ============================================================================

const LEVELS_BOOTSTRAP = [
  { level: 1, xpRequired: 0, label: "Beginner" },
  { level: 2, xpRequired: 150, label: "Explorer" },
  { level: 3, xpRequired: 400, label: "Practitioner" },
  { level: 4, xpRequired: 800, label: "Contributor" },
  { level: 5, xpRequired: 1500, label: "Expert" },
  { level: 6, xpRequired: 2500, label: "Master" },
];

export async function engineBootstrapStudentMemory(
  client: any,
  args: { studentId: string },
) {
  const { studentId } = args;

  // Check if global memory already exists
  const { data: allEntries } = await client.models.StudentMemory.list({
    filter: { studentId: { eq: studentId } },
  });
  const existing = (allEntries || [])
    .filter((e: any) => e != null && !e.unitID)
    .find(Boolean);
  if (existing) {
    return { skipped: true, message: "Memory already exists for this student" };
  }

  // Gather XP logs for stats
  const { data: xpLogsData } = await client.models.StudentXPLog.list({
    filter: { studentId: { eq: studentId } },
  });
  const xpLogs = (xpLogsData || []).filter((l: any) => l != null);
  const totalXP = xpLogs.reduce((s: number, l: any) => s + l.xpAmount, 0);

  const level = (() => {
    let lvl = 1;
    for (const t of LEVELS_BOOTSTRAP) {
      if (totalXP >= t.xpRequired) lvl = t.level;
    }
    return lvl;
  })();
  const levelInfo =
    LEVELS_BOOTSTRAP.find((l) => l.level === level) || LEVELS_BOOTSTRAP[0];

  const profile = await getOrCreateStudentProfile(client, studentId);
  const badges = (profile.badges || []) as any[];
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

  const { data: created } = await client.models.StudentMemory.create({
    studentId,
    memoryMarkdown,
    lastUpdatedBy: "bootstrap",
    version: 1,
  });

  return { created: true, id: created?.id };
}

// ============================================================================
// engineRecomputeProgress — Recalculates StudentProfile.moduleProgress for one module
// ============================================================================

export async function engineRecomputeProgress(
  client: any,
  args: { studentId: string; moduleId: string },
) {
  const { studentId, moduleId } = args;

  const { data: gradesData } = await client.models.Grade.list({
    filter: { sectionID: { eq: moduleId } },
  });
  const allGrades = (gradesData || []).filter((g: any) => g != null);
  const studentGrades = allGrades.filter((g: any) => g.owner === studentId);
  const completedGrades = studentGrades.filter((g: any) => g.complete === true);

  const allOwners = new Set(allGrades.map((g: any) => g.owner).filter(Boolean));
  const totalWorkbooks = Math.max(
    studentGrades.length,
    Math.ceil(allGrades.length / Math.max(allOwners.size, 1)),
  );
  const completedWorkbooks = completedGrades.length;
  const completionPercent =
    totalWorkbooks > 0
      ? Math.round((completedWorkbooks / totalWorkbooks) * 100)
      : 0;

  const profile = await getOrCreateStudentProfile(client, studentId);
  const moduleProgress: any[] = (() => {
    try {
      return profile.moduleProgress ? JSON.parse(profile.moduleProgress) : [];
    } catch {
      return [];
    }
  })();

  const entry = {
    moduleId,
    completionPercent,
    totalWorkbooks,
    completedWorkbooks,
    lastUpdatedAt: new Date().toISOString(),
  };
  const existingIdx = moduleProgress.findIndex(
    (p: any) => p.moduleId === moduleId,
  );
  if (existingIdx >= 0) {
    moduleProgress[existingIdx] = entry;
  } else {
    moduleProgress.push(entry);
  }

  await client.models.StudentProfile.update({
    id: profile.id,
    moduleProgress: JSON.stringify(moduleProgress),
    _version: profile._version ?? 1,
  });

  return {
    ...entry,
    [existingIdx >= 0 ? "updated" : "created"]: true,
  };
}

// ============================================================================
// engineEvaluateSkillsForUnit — Evaluates skill mastery after a unit submission
// ============================================================================

export async function engineEvaluateSkillsForUnit(
  client: any,
  args: { studentId: string; unitId: string; cohortId?: string },
) {
  const { studentId, unitId, cohortId } = args;

  const cohortIds = cohortId
    ? [cohortId, `unit-${unitId}`]
    : [`unit-${unitId}`];

  let allSkills: any[] = [];
  for (const cid of cohortIds) {
    try {
      const { data: skillsData } = await client.models.Skill.list({
        filter: { cohortId: { eq: cid } },
      });
      allSkills.push(...(skillsData || []).filter((s: any) => s != null));
    } catch (err) {
      console.warn(
        `[gamification] Could not fetch skills for cohort ${cid}:`,
        err,
      );
    }
  }

  const relevantSkills = allSkills.filter((skill: any) => {
    const units: string[] = skill.unitIds || [];
    return units.includes(unitId);
  });

  if (relevantSkills.length === 0) {
    return { evaluated: 0, mastered: [], inProgress: [] };
  }

  const { data: gradesData } = await client.models.Grade.list({
    filter: { owner: { eq: studentId } },
  });
  const grades = (gradesData || []).filter((g: any) => g != null && g.complete);

  const unitAccuracyMap = new Map<string, number>();
  for (const grade of grades) {
    const current = unitAccuracyMap.get(grade.unitID) || 0;
    const acc = grade.accuracy || 0;
    if (acc > current) unitAccuracyMap.set(grade.unitID, acc);
  }

  const profile = await getOrCreateStudentProfile(client, studentId);
  const allProgress: any[] = (() => {
    try {
      return profile.skillProgress ? JSON.parse(profile.skillProgress) : [];
    } catch {
      return [];
    }
  })();

  const mastered: string[] = [];
  const inProgress: string[] = [];

  for (const skill of relevantSkills) {
    const requiredUnits: string[] = skill.unitIds || [];
    const minAccuracy = skill.minimumAccuracy || 70;

    let completedCount = 0;
    for (const reqUnit of requiredUnits) {
      if ((unitAccuracyMap.get(reqUnit) || 0) >= minAccuracy) completedCount++;
    }

    const existingProgress = allProgress.find(
      (p: any) => p.skillId === skill.id,
    );
    const currentStatus = existingProgress?.status || "LOCKED";

    if (completedCount === requiredUnits.length) {
      if (currentStatus !== "MASTERED") {
        if (existingProgress) {
          existingProgress.status = "MASTERED";
        } else {
          allProgress.push({ skillId: skill.id, status: "MASTERED" });
        }
        mastered.push(skill.id);

        if (skill.xpReward && skill.xpReward > 0) {
          try {
            await engineAwardXP(client, {
              studentId,
              reason: "ALL_BLOCKS_COMPLETED",
              referenceId: `skill-${skill.id}`,
              cohortId,
            });
          } catch (err) {
            console.warn("[gamification] Skill mastery XP error:", err);
          }
        }
      }
    } else if (completedCount > 0) {
      if (currentStatus === "LOCKED" || currentStatus === "AVAILABLE") {
        if (existingProgress) {
          existingProgress.status = "IN_PROGRESS";
        } else {
          allProgress.push({ skillId: skill.id, status: "IN_PROGRESS" });
        }
        inProgress.push(skill.id);
      }
    }
  }

  if (mastered.length > 0 || inProgress.length > 0) {
    await client.models.StudentProfile.update({
      id: profile.id,
      skillProgress: JSON.stringify(allProgress),
      _version: profile._version ?? 1,
    });

    for (const skillId of mastered) {
      try {
        await engineAdvanceSkillProgress(client, {
          studentId,
          skillId,
          newStatus: "MASTERED",
        });
      } catch (err) {
        console.warn("[gamification] Unlock dependents error:", err);
      }
    }
  }

  return { evaluated: relevantSkills.length, mastered, inProgress };
}

// ============================================================================
// engineClaimStorybookBadges — Awards Storybook onboarding persona badges
// ============================================================================

const PROMO_BADGE_TYPES = new Set([
  "DOCS_EXPLORER",
  "INSTRUCTOR_ONBOARD",
  "LEARNER_ONBOARD",
  "TRANSLATOR_ONBOARD",
  "A11Y_CHAMPION",
  "DOCS_CHAMPION",
]);

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
const INSTRUCTOR_TASK_COUNT = 8;
const LEARNER_TASK_COUNT = 7;
const TRANSLATOR_TASK_COUNT = 6;
const MAX_CLAIMS_PER_HOUR = 10;

export async function engineClaimStorybookBadges(
  client: any,
  args: {
    studentId: string;
    completedTasks: string[];
    completedPersonas: string[];
  },
) {
  const { studentId, completedTasks, completedPersonas } = args;

  if (!Array.isArray(completedTasks) || !Array.isArray(completedPersonas)) {
    throw new Error(
      "Invalid arguments: completedTasks and completedPersonas must be arrays",
    );
  }

  const validTasks = completedTasks.filter((t) => VALID_TASK_IDS.has(t));
  const validPersonas = completedPersonas.filter((p) => VALID_PERSONAS.has(p));

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

  const badgesToAward: string[] = [];
  if (validTasks.length > 0) badgesToAward.push("DOCS_EXPLORER");
  if (verifiedPersonas.has("instructor"))
    badgesToAward.push("INSTRUCTOR_ONBOARD");
  if (verifiedPersonas.has("learner")) badgesToAward.push("LEARNER_ONBOARD");
  if (verifiedPersonas.has("translator")) {
    badgesToAward.push("TRANSLATOR_ONBOARD");
    badgesToAward.push("A11Y_CHAMPION");
  }
  if (verifiedPersonas.size === 3) badgesToAward.push("DOCS_CHAMPION");

  if (badgesToAward.length === 0) {
    return {
      newBadges: [],
      updatedBadges: [],
      totalBadges: 0,
      message: "No badges earned yet",
    };
  }

  const profile = await getOrCreateStudentProfile(client, studentId);
  const existingBadges: any[] = (profile.badges || []) as any[];

  // Rate-limit check: max promo claims in last hour
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
    if (existingByType.has(badgeType)) {
      updatedBadges.push(badgeType);
    } else {
      existingBadges.push({
        badgeType,
        awardedAt: new Date().toISOString(),
        count: 1,
      });
      newBadges.push(badgeType);
    }
  }

  await client.models.StudentProfile.update({
    id: profile.id,
    badges: existingBadges,
    _version: profile._version ?? 1,
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
// engineApplyBattleStakes — Applies failure consequences to all cohort members
//
// NOTE: This function requires admin/IAM access because it writes to StudentProfile
// records owned by OTHER students. It can only be called by an admin/instructor
// server action using a privileged client (not the student's cookie-based client).
// Calling this with a student's cookie client will fail for all profiles except
// the calling student's own profile.
// ============================================================================

const BADGE_RARITY_MAP_BATTLE: Record<string, string> = {
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

interface BattleStakesInput {
  loseLevel?: boolean;
  loseXP?: boolean;
  xpLossAmount?: number;
  loseStreakFreeze?: boolean;
  resetStreak?: boolean;
  loseBadge?: boolean;
  loseBadgeByRarity?: boolean;
  badgeRarityTarget?: string;
  streakMissXPPenalty?: boolean;
  streakMissXPPerDay?: number;
  loseCosmetics?: boolean;
  cosmeticPenaltyDays?: number;
}

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

export async function engineApplyBattleStakes(
  client: any,
  args: { challengeId: string; cohortId: string },
) {
  const { challengeId, cohortId } = args;

  // Read the specific challenge record
  const { data: challengeData } = await client.models.GroupChallenge.get({
    id: challengeId,
  });
  if (!challengeData || challengeData.cohortId !== cohortId) {
    throw new Error(`Challenge ${challengeId} not found in cohort ${cohortId}`);
  }
  const challenge = challengeData;

  let stakes: BattleStakesInput;
  try {
    stakes = JSON.parse(challenge.stakes || "{}");
  } catch {
    throw new Error("Invalid stakes JSON on challenge");
  }

  // Only apply if challenge actually failed (deadline passed, target not met)
  if (challenge.currentXP >= challenge.targetXP) {
    return { applied: false, reason: "Challenge was completed successfully" };
  }

  const { data: profilesData } = await client.models.StudentProfile.list({
    filter: { cohortId: { eq: cohortId } },
  });
  const profiles = (profilesData || []).filter(
    (p: any) => p != null && !p._deleted,
  );

  if (profiles.length === 0) {
    return { applied: false, reason: "No student profiles found in cohort" };
  }

  const results: Array<{ studentId: string; consequences: string[] }> = [];
  const today = new Date();

  for (const profile of profiles) {
    const consequences: string[] = [];
    const updates: Record<string, any> = {
      id: profile.id,
      _version: profile._version ?? 1,
    };

    if (stakes.loseStreakFreeze) {
      const freezes = profile.freezesRemaining || 0;
      if (freezes > 0) {
        updates.freezesRemaining = freezes - 1;
        updates.freezesUsed = (profile.freezesUsed || 0) + 1;
        consequences.push("Lost a streak freeze");
      } else {
        consequences.push("No streak freeze to lose (skipped)");
      }
    }

    if (stakes.loseXP && (stakes.xpLossAmount ?? 0) > 0) {
      const currentXP = profile.totalXP || 0;
      const newXP = Math.max(0, currentXP - (stakes.xpLossAmount ?? 0));
      updates.totalXP = newXP;
      updates.level = calculateLevel(newXP);
      consequences.push(`Lost ${currentXP - newXP} XP`);
    }

    if (stakes.streakMissXPPenalty && (stakes.streakMissXPPerDay ?? 0) > 0) {
      const lastActivity = profile.lastActivityDate;
      if (lastActivity) {
        const lastDate = new Date(lastActivity);
        const missedDays = Math.max(
          0,
          Math.floor(
            (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
          ) - 1,
        );
        if (missedDays > 0) {
          const penalty = missedDays * (stakes.streakMissXPPerDay ?? 0);
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

    if (stakes.loseLevel) {
      const currentLevel = updates.level ?? profile.level ?? 1;
      if (currentLevel > 1) {
        updates.level = currentLevel - 1;
        consequences.push(`Dropped to level ${updates.level}`);
      } else {
        consequences.push("Already at level 1 (skipped)");
      }
    }

    if (stakes.resetStreak) {
      updates.currentStreak = 0;
      consequences.push("Streak reset to 0");
    }

    if (stakes.loseBadge) {
      try {
        const badges: any[] = (profile.badges || []) as any[];
        if (badges.length > 0) {
          badges.sort(
            (a: any, b: any) =>
              new Date(b.awardedAt).getTime() - new Date(a.awardedAt).getTime(),
          );
          const removed = badges.shift();
          updates.badges = badges;
          consequences.push(`Lost badge: ${removed.badgeType}`);
        } else {
          consequences.push("No badges to lose (skipped)");
        }
      } catch {
        consequences.push("Failed to process badges (skipped)");
      }
    }

    if (stakes.loseBadgeByRarity && stakes.badgeRarityTarget) {
      try {
        const badges: any[] = updates.badges
          ? updates.badges
          : ((profile.badges || []) as any[]);
        const targetRarity = stakes.badgeRarityTarget;
        const matchingIdx = badges.findIndex(
          (b: any) =>
            (BADGE_RARITY_MAP_BATTLE[b.badgeType] || "common") === targetRarity,
        );
        if (matchingIdx >= 0) {
          const removed = badges.splice(matchingIdx, 1)[0];
          updates.badges = badges;
          consequences.push(`Lost ${targetRarity} badge: ${removed.badgeType}`);
        } else {
          consequences.push(`No ${targetRarity} badge to lose (skipped)`);
        }
      } catch {
        consequences.push("Failed to process rarity badge removal (skipped)");
      }
    }

    if (stakes.loseCosmetics && (stakes.cosmeticPenaltyDays ?? 0) > 0) {
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
        penaltyExpiry.getDate() + (stakes.cosmeticPenaltyDays ?? 0),
      );
      updates.cosmeticPenalty = JSON.stringify({
        active: true,
        expiresAt: penaltyExpiry.toISOString(),
        reason: "boss_battle_failure",
        challengeId,
        border: randomBorder,
        flair: randomFlair,
        nameEffect: randomNameEffect,
      });
      consequences.push(
        `Cosmetics scrambled — flair: "${randomFlair}", border: ${randomBorder}, name: ${randomNameEffect} for ${stakes.cosmeticPenaltyDays} day(s)`,
      );
    }

    const hasUpdates = Object.keys(updates).length > 2;
    if (hasUpdates) {
      updates.lastUpdated = new Date().toISOString();
      await client.models.StudentProfile.update(updates);
    }

    results.push({ studentId: profile.studentId, consequences });
  }

  // Mark the challenge inactive (battle resolved)
  await client.models.GroupChallenge.update({
    id: challengeId,
    active: false,
    _version: challenge._version ?? 1,
  });

  return {
    applied: true,
    challengeId,
    cohortId,
    studentsAffected: results.length,
    results,
  };
}
