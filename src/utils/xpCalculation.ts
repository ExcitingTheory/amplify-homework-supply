/**
 * XP (Experience Points) calculation utilities for the gamification system.
 *
 * XP is derived from an append-only log of StudentXPLog entries.
 * Total XP is never stored as a mutable field — it is always calculated from the log.
 *
 * @module xpCalculation
 */

// ============================================================================
// Types
// ============================================================================

export enum XPReason {
  HOMEWORK_SUBMITTED = "HOMEWORK_SUBMITTED",
  AI_FEEDBACK_REVISED = "AI_FEEDBACK_REVISED",
  ALL_BLOCKS_COMPLETED = "ALL_BLOCKS_COMPLETED",
  PEER_REVIEW_GIVEN = "PEER_REVIEW_GIVEN",
  PEER_REVIEW_HOSTED = "PEER_REVIEW_HOSTED",
  PEER_REVIEW_TOP_REVIEWER = "PEER_REVIEW_TOP_REVIEWER",
  NAILED_IT = "NAILED_IT",
  ON_TIME_SUBMISSION = "ON_TIME_SUBMISSION",
  STREAK_3DAY = "STREAK_3DAY",
  STREAK_7DAY = "STREAK_7DAY",
  STREAK_14DAY = "STREAK_14DAY",
  STREAK_30DAY = "STREAK_30DAY",
  PERFECT_SCORE = "PERFECT_SCORE",
  COMEBACK = "COMEBACK",
  PERSONAL_BEST = "PERSONAL_BEST",
  EASTER_EGG = "EASTER_EGG",
  SQUAD_CHALLENGE_BONUS = "SQUAD_CHALLENGE_BONUS",
  PRACTICE_DRILL_COMPLETED = "PRACTICE_DRILL_COMPLETED",
  PRACTICE_DRILL_ACCURACY_BONUS = "PRACTICE_DRILL_ACCURACY_BONUS",
}

export interface StudentXPLog {
  id: string;
  studentId: string;
  xpAmount: number;
  reason: XPReason;
  sourceId?: string;
  createdAt: string;
}

export interface LevelInfo {
  level: number;
  label: string;
  xpRequired: number;
  xpForNextLevel: number | null;
  progress: number; // 0–100 percentage to next level
}

export interface XPConfig {
  multipliers?: Partial<Record<XPReason, number>>;
  dailyCap?: number;
  weeklyCap?: number;
  enabled?: boolean;
  levelConfig?: LevelConfig;
}

/** Configuration for the leveling curve */
export interface LevelConfig {
  /** Maximum achievable level (1–99, default 6) */
  maxLevel?: number;
  /** Base XP required for level 2 (default 150) */
  xpPerLevel?: number;
  /** Each subsequent level costs this × the previous gap (1.0 = linear, default 1.6) */
  levelScaling?: number;
}

/** Defaults matching the original hardcoded 6-level system */
export const LEVEL_DEFAULTS = {
  maxLevel: 6,
  xpPerLevel: 150,
  levelScaling: 1.6,
} as const;

// ============================================================================
// Constants
// ============================================================================

const XP_AMOUNTS: Record<XPReason, number> = {
  [XPReason.HOMEWORK_SUBMITTED]: 50,
  [XPReason.AI_FEEDBACK_REVISED]: 25,
  [XPReason.ALL_BLOCKS_COMPLETED]: 75,
  [XPReason.PEER_REVIEW_GIVEN]: 40,
  [XPReason.PEER_REVIEW_HOSTED]: 30,
  [XPReason.NAILED_IT]: 20,
  [XPReason.ON_TIME_SUBMISSION]: 15,
  [XPReason.STREAK_3DAY]: 30,
  [XPReason.STREAK_7DAY]: 75,
  [XPReason.STREAK_14DAY]: 150,
  [XPReason.STREAK_30DAY]: 300,
  [XPReason.PERFECT_SCORE]: 100,
  [XPReason.COMEBACK]: 50,
  [XPReason.PERSONAL_BEST]: 25,
  [XPReason.EASTER_EGG]: 30,
  [XPReason.SQUAD_CHALLENGE_BONUS]: 100,
  [XPReason.PRACTICE_DRILL_COMPLETED]: 30,
  [XPReason.PRACTICE_DRILL_ACCURACY_BONUS]: 15,
};

const LEVEL_THRESHOLDS: { level: number; xpRequired: number; label: string }[] =
  [
    { level: 1, xpRequired: 0, label: "Beginner" },
    { level: 2, xpRequired: 150, label: "Explorer" },
    { level: 3, xpRequired: 400, label: "Practitioner" },
    { level: 4, xpRequired: 800, label: "Contributor" },
    { level: 5, xpRequired: 1500, label: "Expert" },
    { level: 6, xpRequired: 2500, label: "Master" },
  ];

/** Labels assigned by progress fraction through the level range */
const LEVEL_LABEL_TIERS: { fraction: number; label: string }[] = [
  { fraction: 0, label: "Beginner" },
  { fraction: 0.1, label: "Novice" },
  { fraction: 0.2, label: "Explorer" },
  { fraction: 0.35, label: "Practitioner" },
  { fraction: 0.5, label: "Journeyman" },
  { fraction: 0.65, label: "Contributor" },
  { fraction: 0.8, label: "Expert" },
  { fraction: 0.9, label: "Master" },
  { fraction: 1.0, label: "Legend" },
];

/**
 * Generate level thresholds from a LevelConfig.
 * Each level gap increases by the scaling factor:
 *   Gap(N→N+1) = xpPerLevel × levelScaling^(N-1)
 */
export function generateLevelThresholds(
  config?: LevelConfig,
): { level: number; xpRequired: number; label: string }[] {
  const max = Math.min(
    99,
    Math.max(1, config?.maxLevel ?? LEVEL_DEFAULTS.maxLevel),
  );
  const base = Math.max(1, config?.xpPerLevel ?? LEVEL_DEFAULTS.xpPerLevel);
  const scaling = Math.max(
    1,
    config?.levelScaling ?? LEVEL_DEFAULTS.levelScaling,
  );

  const thresholds: { level: number; xpRequired: number; label: string }[] = [];
  let cumulative = 0;

  for (let lvl = 1; lvl <= max; lvl++) {
    const fraction = max <= 1 ? 0 : (lvl - 1) / (max - 1);
    // Find the highest label tier that this level qualifies for
    let label = "Beginner";
    for (const tier of LEVEL_LABEL_TIERS) {
      if (fraction >= tier.fraction) label = tier.label;
    }

    thresholds.push({ level: lvl, xpRequired: Math.round(cumulative), label });

    if (lvl < max) {
      // Gap from this level to next
      const gap = base * Math.pow(scaling, lvl - 1);
      cumulative += gap;
    }
  }

  return thresholds;
}

// ============================================================================
// Functions
// ============================================================================

/**
 * Calculate total XP from a log of XP entries.
 * Total is always derived, never stored as a mutable field.
 */
export function calculateTotalXP(logs: StudentXPLog[]): number {
  return logs.reduce((sum, log) => sum + log.xpAmount, 0);
}

/**
 * Get the XP amount awarded for a given action.
 */
export function getXPForAction(reason: XPReason): number {
  return XP_AMOUNTS[reason] ?? 0;
}

/**
 * Get the XP amount for an action with section-level config applied.
 * Returns 0 if XP is disabled or multiplier is 0.
 */
export function getXPForActionWithConfig(
  reason: XPReason,
  config?: XPConfig,
): number {
  if (config?.enabled === false) return 0;
  let amount = XP_AMOUNTS[reason] ?? 0;
  if (config?.multipliers?.[reason] !== undefined) {
    amount = Math.round(amount * config.multipliers[reason]!);
  }
  return Math.max(0, amount);
}

/**
 * Calculate the level for a given total XP value.
 * Returns the highest level whose xpRequired threshold is met.
 * When a LevelConfig is provided, generates thresholds dynamically.
 */
export function calculateLevel(
  totalXP: number,
  levelConfig?: LevelConfig,
): number {
  const thresholds = levelConfig
    ? generateLevelThresholds(levelConfig)
    : LEVEL_THRESHOLDS;
  let level = 1;
  for (const threshold of thresholds) {
    if (totalXP >= threshold.xpRequired) {
      level = threshold.level;
    } else {
      break;
    }
  }
  return level;
}

/**
 * Get detailed level info including label, progress to next level, etc.
 */
export function getLevelInfo(
  totalXP: number,
  levelConfig?: LevelConfig,
): LevelInfo {
  const thresholds = levelConfig
    ? generateLevelThresholds(levelConfig)
    : LEVEL_THRESHOLDS;
  const level = calculateLevel(totalXP, levelConfig);
  const currentThreshold = thresholds.find((t) => t.level === level)!;
  const nextThreshold = thresholds.find((t) => t.level === level + 1);

  let progress = 100;
  if (nextThreshold) {
    const xpIntoLevel = totalXP - currentThreshold.xpRequired;
    const xpNeeded = nextThreshold.xpRequired - currentThreshold.xpRequired;
    progress = Math.min(100, Math.round((xpIntoLevel / xpNeeded) * 100));
  }

  return {
    level,
    label: currentThreshold.label,
    xpRequired: currentThreshold.xpRequired,
    xpForNextLevel: nextThreshold?.xpRequired ?? null,
    progress,
  };
}

/**
 * Get all level thresholds (for display purposes).
 * When a LevelConfig is provided, generates thresholds dynamically.
 */
export function getLevelThresholds(levelConfig?: LevelConfig) {
  return levelConfig
    ? generateLevelThresholds(levelConfig)
    : [...LEVEL_THRESHOLDS];
}

/**
 * Get LevelInfo using explicit thresholds from DB (PlatformSettings.levelThresholds).
 * Falls back to default behaviour when thresholds are null/empty.
 */
export function getLevelInfoWithThresholds(
  totalXP: number,
  dbThresholds?: { level: number; xpRequired: number; title?: string }[] | null,
): LevelInfo {
  if (!dbThresholds || dbThresholds.length === 0) {
    return getLevelInfo(totalXP);
  }
  const sorted = [...dbThresholds].sort((a, b) => a.level - b.level);
  // Map DB format to internal format
  const thresholds = sorted.map((t) => ({
    level: t.level,
    xpRequired: t.xpRequired,
    label: t.title || `Level ${t.level}`,
  }));

  let level = 1;
  for (const threshold of thresholds) {
    if (totalXP >= threshold.xpRequired) {
      level = threshold.level;
    } else {
      break;
    }
  }

  const currentThreshold =
    thresholds.find((t) => t.level === level) || thresholds[0];
  const nextThreshold = thresholds.find((t) => t.level === level + 1);

  let progress = 100;
  if (nextThreshold) {
    const xpIntoLevel = totalXP - currentThreshold.xpRequired;
    const xpNeeded = nextThreshold.xpRequired - currentThreshold.xpRequired;
    progress =
      xpNeeded > 0
        ? Math.min(100, Math.round((xpIntoLevel / xpNeeded) * 100))
        : 100;
  }

  return {
    level,
    label: currentThreshold.label,
    xpRequired: currentThreshold.xpRequired,
    xpForNextLevel: nextThreshold?.xpRequired ?? null,
    progress,
  };
}

/**
 * Calculate total XP with multipliers applied per reason.
 * Used for section-scoped XP when PlatformSettings.xpMultipliers is configured.
 */
export function calculateMultipliedXP(
  logs: { xpAmount: number; reason?: string }[],
  multipliers?: Record<string, number> | null,
): number {
  if (!multipliers || Object.keys(multipliers).length === 0) {
    return calculateTotalXP(logs as StudentXPLog[]);
  }
  return logs.reduce((sum, log) => {
    const mult =
      log.reason && multipliers[log.reason] !== undefined
        ? multipliers[log.reason]
        : 1;
    return sum + Math.round(log.xpAmount * mult);
  }, 0);
}
