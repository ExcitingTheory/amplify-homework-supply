/**
 * XP Projection & Level Balancing — Calculates total available XP from
 * assigned units in a section, projects achievable levels, computes drill
 * gaps, and offers an algorithmic tuner to balance the level curve against
 * available content.
 *
 * @module xpProjection
 */

import {
  XPReason,
  getXPForAction,
  getXPForActionWithConfig,
  generateLevelThresholds,
  getLevelInfo,
  LEVEL_DEFAULTS,
  type XPConfig,
  type LevelConfig,
  type LevelInfo,
} from './xpCalculation'

// ============================================================================
// Types
// ============================================================================

/** XP breakdown for a single unit when completed perfectly */
export interface UnitXPBreakdown {
  /** Base XP from submitting homework */
  submission: number
  /** XP from completing all blocks */
  allBlocks: number
  /** XP from on-time submission */
  onTime: number
  /** XP from perfect score (if achieved) */
  perfectScore: number
  /** XP from AI feedback revision */
  revision: number
  /** Total max XP from this unit */
  total: number
}

/** Summary of XP available in a section */
export interface SectionXPProjection {
  /** Number of assigned units */
  unitCount: number
  /** Total max XP from all assigned units (perfect performance) */
  totalAssignmentXP: number
  /** Per-unit breakdown */
  perUnitXP: UnitXPBreakdown
  /** Level achievable with just assignment XP */
  maxLevelFromAssignments: LevelInfo
  /** Per-level gap analysis */
  levelGaps: LevelGapAnalysis[]
  /** XP config used for the calculation */
  xpConfig?: XPConfig
}

/** Gap analysis for reaching a specific level */
export interface LevelGapAnalysis {
  /** Target level */
  level: number
  /** Label for this level */
  label: string
  /** XP required to reach this level */
  xpRequired: number
  /** Whether this level is reachable from assignments alone */
  reachableFromAssignments: boolean
  /** XP deficit (0 if reachable, positive if not) */
  xpDeficit: number
  /** Estimated drill sessions needed to close the gap (with diminishing returns) */
  drillSessionsNeeded: number
}

/** Tuning recommendation for balancing levels vs. content */
export interface LevelTuningResult {
  /** The recommended LevelConfig */
  recommendedConfig: Required<LevelConfig>
  /** What the level thresholds would be with this config */
  thresholds: { level: number; xpRequired: number; label: string }[]
  /** How many levels are fully reachable from assignments only */
  levelsReachableFromAssignments: number
  /** How many additional drill sessions per level gap (average) */
  avgDrillsPerLevelGap: number
  /** Whether a tuning was possible (false if constraints are contradictory) */
  feasible: boolean
  /** Human-readable explanation */
  explanation: string
}

/** Options for the level tuner */
export interface TuningOptions {
  /** Number of assigned units in the section */
  unitCount: number
  /** Desired maximum level students can reach */
  desiredMaxLevel: number
  /** Target: what fraction of levels should be reachable from assignments alone (0–1, default 0.7) */
  assignmentReachFraction?: number
  /** Maximum drill sessions considered reasonable per level gap (default 10) */
  maxDrillsPerGap?: number
  /** XP config (multipliers, etc.) */
  xpConfig?: XPConfig
}

// ============================================================================
// Constants
// ============================================================================

/** XP from drills with diminishing returns per day */
const DRILL_XP_SCHEDULE = [30, 15, 8, 5] // sessions 1, 2, 3, 4+ per day

// ============================================================================
// Core Calculations
// ============================================================================

/**
 * Calculate max XP available from a single unit (perfect performance).
 * Assumes: submitted, all blocks complete, on time, perfect score, one revision.
 */
export function getMaxXPPerUnit(xpConfig?: XPConfig): UnitXPBreakdown {
  const get = (reason: XPReason) => xpConfig
    ? getXPForActionWithConfig(reason, xpConfig)
    : getXPForAction(reason)

  const submission = get(XPReason.HOMEWORK_SUBMITTED)
  const allBlocks = get(XPReason.ALL_BLOCKS_COMPLETED)
  const onTime = get(XPReason.ON_TIME_SUBMISSION)
  const perfectScore = get(XPReason.PERFECT_SCORE)
  const revision = get(XPReason.AI_FEEDBACK_REVISED)

  return {
    submission,
    allBlocks,
    onTime,
    perfectScore,
    revision,
    total: submission + allBlocks + onTime + perfectScore + revision,
  }
}

/**
 * Calculate total XP from drill sessions with diminishing returns.
 * Returns total XP earned after `sessionCount` sessions (spread optimally across days).
 */
export function getDrillXP(sessionCount: number, xpConfig?: XPConfig): number {
  if (sessionCount <= 0) return 0

  const baseXP = xpConfig
    ? getXPForActionWithConfig(XPReason.PRACTICE_DRILL_COMPLETED, xpConfig)
    : getXPForAction(XPReason.PRACTICE_DRILL_COMPLETED)

  // Optimal strategy: spread sessions across days (1 per day = max XP)
  // But account for realistic bunching with diminishing returns
  const accuracyBonus = xpConfig
    ? getXPForActionWithConfig(XPReason.PRACTICE_DRILL_ACCURACY_BONUS, xpConfig)
    : getXPForAction(XPReason.PRACTICE_DRILL_ACCURACY_BONUS)

  // Assume optimal distribution: 1 session per day at full value + accuracy bonus
  // This gives the "minimum sessions needed" scenario
  return sessionCount * (baseXP + accuracyBonus)
}

/**
 * Calculate drill sessions needed to earn a specific XP amount.
 * Uses optimal (1/day) distribution for minimum session count.
 */
export function drillSessionsForXP(targetXP: number, xpConfig?: XPConfig): number {
  if (targetXP <= 0) return 0

  const baseXP = xpConfig
    ? getXPForActionWithConfig(XPReason.PRACTICE_DRILL_COMPLETED, xpConfig)
    : getXPForAction(XPReason.PRACTICE_DRILL_COMPLETED)

  const accuracyBonus = xpConfig
    ? getXPForActionWithConfig(XPReason.PRACTICE_DRILL_ACCURACY_BONUS, xpConfig)
    : getXPForAction(XPReason.PRACTICE_DRILL_ACCURACY_BONUS)

  const xpPerOptimalSession = baseXP + accuracyBonus
  if (xpPerOptimalSession <= 0) return Infinity

  return Math.ceil(targetXP / xpPerOptimalSession)
}

// ============================================================================
// Projection
// ============================================================================

/**
 * Project XP availability and level reachability for a section.
 */
export function projectSectionXP(
  unitCount: number,
  xpConfig?: XPConfig,
): SectionXPProjection {
  const perUnitXP = getMaxXPPerUnit(xpConfig)
  const totalAssignmentXP = perUnitXP.total * unitCount
  const levelConfig = xpConfig?.levelConfig
  const maxLevelFromAssignments = getLevelInfo(totalAssignmentXP, levelConfig)
  const thresholds = generateLevelThresholds(levelConfig)

  const levelGaps: LevelGapAnalysis[] = thresholds.map((t) => {
    const deficit = Math.max(0, t.xpRequired - totalAssignmentXP)
    return {
      level: t.level,
      label: t.label,
      xpRequired: t.xpRequired,
      reachableFromAssignments: deficit === 0,
      xpDeficit: deficit,
      drillSessionsNeeded: drillSessionsForXP(deficit, xpConfig),
    }
  })

  return {
    unitCount,
    totalAssignmentXP,
    perUnitXP,
    maxLevelFromAssignments,
    levelGaps,
    xpConfig,
  }
}

// ============================================================================
// Level Tuner — algorithmic balancing
// ============================================================================

/**
 * Tune the LevelConfig so that the desired max level is achievable
 * given the section's available content.
 *
 * Algorithm:
 * 1. Calculate total XP available from assignments
 * 2. Set maxLevel to desiredMaxLevel
 * 3. Binary-search for `xpPerLevel` and `levelScaling` such that:
 *    - `assignmentReachFraction` of levels are reachable from assignments alone
 *    - Remaining levels require ≤ `maxDrillsPerGap` drill sessions each
 * 4. Return the balanced config with explanation
 */
export function tuneLevelConfig(options: TuningOptions): LevelTuningResult {
  const {
    unitCount,
    desiredMaxLevel,
    assignmentReachFraction = 0.7,
    maxDrillsPerGap = 10,
    xpConfig,
  } = options

  const perUnitXP = getMaxXPPerUnit(xpConfig)
  const totalAssignmentXP = perUnitXP.total * unitCount

  if (unitCount <= 0 || desiredMaxLevel <= 1) {
    return {
      recommendedConfig: { maxLevel: Math.max(1, desiredMaxLevel), xpPerLevel: 150, levelScaling: 1.6 },
      thresholds: generateLevelThresholds({ maxLevel: desiredMaxLevel }),
      levelsReachableFromAssignments: desiredMaxLevel <= 1 ? 1 : 0,
      avgDrillsPerLevelGap: 0,
      feasible: false,
      explanation: 'Cannot tune: no units assigned or max level is 1.',
    }
  }

  // Target: levels 1..targetAssignmentLevel should be reachable from assignments
  const targetAssignmentLevel = Math.max(
    1,
    Math.floor(desiredMaxLevel * assignmentReachFraction),
  )

  // The highest level fully reachable needs xpRequired ≤ totalAssignmentXP
  // Work backwards: find xpPerLevel such that level `targetAssignmentLevel` requires ≤ totalAssignmentXP
  // Cumulative XP for level L = sum(xpPerLevel * scaling^(i-1), i=1..L-1)
  // We need this ≤ totalAssignmentXP

  // Binary search on xpPerLevel (scaling held constant first, then adjusted)
  let bestConfig: Required<LevelConfig> = {
    maxLevel: desiredMaxLevel,
    xpPerLevel: 150,
    levelScaling: 1.6,
  }

  // Try different scaling values and find the best xpPerLevel for each
  const scalingCandidates = [1.0, 1.2, 1.4, 1.6, 1.8, 2.0]
  let bestScore = -Infinity

  for (const scaling of scalingCandidates) {
    // For a given scaling, find xpPerLevel such that
    // cumulative XP at targetAssignmentLevel ≤ totalAssignmentXP
    // Cumulative = xpPerLevel * sum(scaling^(i-1), i=1..targetAssignmentLevel-1)
    const geometricSum = sumGeometric(scaling, targetAssignmentLevel - 1)
    if (geometricSum <= 0) continue

    const maxBase = totalAssignmentXP / geometricSum
    const xpPerLevel = Math.max(10, Math.floor(maxBase))

    const config: Required<LevelConfig> = { maxLevel: desiredMaxLevel, xpPerLevel, levelScaling: scaling }
    const thresholds = generateLevelThresholds(config)

    // Score: how well does this satisfy constraints?
    let reachable = 0
    let totalDrills = 0
    let maxDrillsForAny = 0
    const drillXPPerSession = getDrillXP(1, xpConfig)

    for (const t of thresholds) {
      if (t.xpRequired <= totalAssignmentXP) {
        reachable++
      } else {
        const deficit = t.xpRequired - totalAssignmentXP
        const drills = drillSessionsForXP(deficit, xpConfig)
        totalDrills += drills
        maxDrillsForAny = Math.max(maxDrillsForAny, drills)
      }
    }

    // Penalize if max drills exceeds limit
    const drillPenalty = maxDrillsForAny > maxDrillsPerGap
      ? (maxDrillsForAny - maxDrillsPerGap) * -10
      : 0

    // Reward more levels reachable from assignments
    const reachableScore = reachable * 10

    // Reward closeness to target assignment reach
    const reachDiff = Math.abs(reachable - targetAssignmentLevel)
    const reachScore = -reachDiff * 5

    const score = reachableScore + reachScore + drillPenalty

    if (score > bestScore) {
      bestScore = score
      bestConfig = config
    }
  }

  // Generate final analysis with best config
  const thresholds = generateLevelThresholds(bestConfig)
  let levelsReachable = 0
  let totalDrillGaps = 0
  let gapCount = 0

  for (const t of thresholds) {
    if (t.xpRequired <= totalAssignmentXP) {
      levelsReachable++
    } else {
      const deficit = t.xpRequired - totalAssignmentXP
      totalDrillGaps += drillSessionsForXP(deficit, xpConfig)
      gapCount++
    }
  }

  const avgDrills = gapCount > 0 ? Math.round(totalDrillGaps / gapCount) : 0
  const maxLevelXP = thresholds[thresholds.length - 1]?.xpRequired ?? 0
  const feasible = levelsReachable >= targetAssignmentLevel ||
    (maxLevelXP - totalAssignmentXP <= maxDrillsPerGap * getDrillXP(1, xpConfig) * gapCount)

  const explanation = [
    `With ${unitCount} units (${totalAssignmentXP} max XP from assignments):`,
    `• Levels 1–${levelsReachable} reachable from assignments alone`,
    levelsReachable < desiredMaxLevel
      ? `• Levels ${levelsReachable + 1}–${desiredMaxLevel} require practice drills (~${avgDrills} sessions avg)`
      : `• All levels reachable from assignments!`,
    `• Recommended curve: base=${bestConfig.xpPerLevel} XP, scaling=${bestConfig.levelScaling}×`,
  ].join('\n')

  return {
    recommendedConfig: bestConfig,
    thresholds,
    levelsReachableFromAssignments: levelsReachable,
    avgDrillsPerLevelGap: avgDrills,
    feasible,
    explanation,
  }
}

/**
 * Given a desired max level and total available XP, directly compute
 * the xpPerLevel that makes the max level require exactly that XP.
 * Useful for "auto-balance" where you want the curve to fit the content.
 */
export function computeXPPerLevelForTarget(
  totalAvailableXP: number,
  maxLevel: number,
  levelScaling: number = LEVEL_DEFAULTS.levelScaling,
): number {
  if (maxLevel <= 1 || totalAvailableXP <= 0) return LEVEL_DEFAULTS.xpPerLevel
  const geometricSum = sumGeometric(levelScaling, maxLevel - 1)
  if (geometricSum <= 0) return LEVEL_DEFAULTS.xpPerLevel
  return Math.max(10, Math.round(totalAvailableXP / geometricSum))
}

// ============================================================================
// Helpers
// ============================================================================

/** Sum of geometric series: sum(scaling^(i-1), i=1..n) */
function sumGeometric(scaling: number, n: number): number {
  if (n <= 0) return 0
  if (scaling === 1) return n
  return (Math.pow(scaling, n) - 1) / (scaling - 1)
}
