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
  HOMEWORK_SUBMITTED = 'HOMEWORK_SUBMITTED',
  AI_FEEDBACK_REVISED = 'AI_FEEDBACK_REVISED',
  ALL_BLOCKS_COMPLETED = 'ALL_BLOCKS_COMPLETED',
  PEER_REVIEW_GIVEN = 'PEER_REVIEW_GIVEN',
  PEER_REVIEW_HOSTED = 'PEER_REVIEW_HOSTED',
  NAILED_IT = 'NAILED_IT',
  ON_TIME_SUBMISSION = 'ON_TIME_SUBMISSION',
  STREAK_3DAY = 'STREAK_3DAY',
  STREAK_7DAY = 'STREAK_7DAY',
  STREAK_14DAY = 'STREAK_14DAY',
  STREAK_30DAY = 'STREAK_30DAY',
  PERFECT_SCORE = 'PERFECT_SCORE',
  COMEBACK = 'COMEBACK',
  PERSONAL_BEST = 'PERSONAL_BEST',
  EASTER_EGG = 'EASTER_EGG',
  GUILD_CHALLENGE_BONUS = 'GUILD_CHALLENGE_BONUS',
}

export interface StudentXPLog {
  id: string
  studentId: string
  xpAmount: number
  reason: XPReason
  sourceId?: string
  createdAt: string
}

export interface LevelInfo {
  level: number
  label: string
  xpRequired: number
  xpForNextLevel: number | null
  progress: number // 0–100 percentage to next level
}

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
  [XPReason.GUILD_CHALLENGE_BONUS]: 100,
}

const LEVEL_THRESHOLDS: { level: number; xpRequired: number; label: string }[] = [
  { level: 1, xpRequired: 0, label: 'Beginner' },
  { level: 2, xpRequired: 150, label: 'Explorer' },
  { level: 3, xpRequired: 400, label: 'Practitioner' },
  { level: 4, xpRequired: 800, label: 'Contributor' },
  { level: 5, xpRequired: 1500, label: 'Expert' },
  { level: 6, xpRequired: 2500, label: 'Master' },
]

// ============================================================================
// Functions
// ============================================================================

/**
 * Calculate total XP from a log of XP entries.
 * Total is always derived, never stored as a mutable field.
 */
export function calculateTotalXP(logs: StudentXPLog[]): number {
  return logs.reduce((sum, log) => sum + log.xpAmount, 0)
}

/**
 * Get the XP amount awarded for a given action.
 */
export function getXPForAction(reason: XPReason): number {
  return XP_AMOUNTS[reason] ?? 0
}

/**
 * Calculate the level for a given total XP value.
 * Returns the highest level whose xpRequired threshold is met.
 */
export function calculateLevel(totalXP: number): number {
  let level = 1
  for (const threshold of LEVEL_THRESHOLDS) {
    if (totalXP >= threshold.xpRequired) {
      level = threshold.level
    } else {
      break
    }
  }
  return level
}

/**
 * Get detailed level info including label, progress to next level, etc.
 */
export function getLevelInfo(totalXP: number): LevelInfo {
  const level = calculateLevel(totalXP)
  const currentThreshold = LEVEL_THRESHOLDS.find((t) => t.level === level)!
  const nextThreshold = LEVEL_THRESHOLDS.find((t) => t.level === level + 1)

  let progress = 100
  if (nextThreshold) {
    const xpIntoLevel = totalXP - currentThreshold.xpRequired
    const xpNeeded = nextThreshold.xpRequired - currentThreshold.xpRequired
    progress = Math.min(100, Math.round((xpIntoLevel / xpNeeded) * 100))
  }

  return {
    level,
    label: currentThreshold.label,
    xpRequired: currentThreshold.xpRequired,
    xpForNextLevel: nextThreshold?.xpRequired ?? null,
    progress,
  }
}

/**
 * Get all level thresholds (for display purposes).
 */
export function getLevelThresholds() {
  return [...LEVEL_THRESHOLDS]
}
