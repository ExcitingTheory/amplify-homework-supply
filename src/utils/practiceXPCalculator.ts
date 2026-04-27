/**
 * @fileoverview practiceXPCalculator — Diminishing returns XP calculation
 * for practice drill sessions. Shared between Lambda (gamification handler)
 * and UI (preview in drill dialog).
 */

// ============================================================================
// Constants
// ============================================================================

const BASE_XP = 30
const DIMINISH_FACTOR = 0.5
const FLOOR_XP = 5

const ACCURACY_BONUSES: { threshold: number; bonus: number }[] = [
  { threshold: 90, bonus: 15 },
  { threshold: 80, bonus: 10 },
  { threshold: 70, bonus: 5 },
]

// ============================================================================
// Core calculation
// ============================================================================

/**
 * Calculate XP for a practice drill session with diminishing returns.
 * Each completed session per unit per day reduces XP by 50%, floored at 5.
 *
 * @param sessionsCompletedToday - Number of practice sessions already completed today (0 = first)
 * @returns XP amount to award
 */
export function calculateDrillXP(sessionsCompletedToday: number): number {
  return Math.max(FLOOR_XP, Math.floor(BASE_XP * Math.pow(DIMINISH_FACTOR, sessionsCompletedToday)))
}

/**
 * Calculate accuracy bonus XP.
 *
 * @param accuracy - Overall accuracy 0-100
 * @param bonusSessionsToday - Number of accuracy bonus awards today (for its own diminishing curve)
 * @returns Bonus XP amount
 */
export function calculateAccuracyBonus(accuracy: number, bonusSessionsToday: number = 0): number {
  const bonus = ACCURACY_BONUSES.find((b) => accuracy >= b.threshold)
  if (!bonus) return 0
  return Math.max(FLOOR_XP, Math.floor(bonus.bonus * Math.pow(DIMINISH_FACTOR, bonusSessionsToday)))
}

/**
 * Preview XP for display in the drill dialog header.
 * Shows what the student will earn upon completion.
 *
 * @param sessionsCompletedToday - Sessions completed today
 * @param estimatedAccuracy - Estimated/current accuracy
 * @returns { drillXP, accuracyBonus, total }
 */
export function previewXP(
  sessionsCompletedToday: number,
  estimatedAccuracy: number = 0,
): { drillXP: number; accuracyBonus: number; total: number } {
  const drillXP = calculateDrillXP(sessionsCompletedToday)
  const accuracyBonus = calculateAccuracyBonus(estimatedAccuracy, sessionsCompletedToday)
  return {
    drillXP,
    accuracyBonus,
    total: drillXP + accuracyBonus,
  }
}
