/**
 * Streak calculation utilities for the gamification system.
 *
 * Tracks daily submission/engagement streaks per student.
 * A streak increments when a student engages on consecutive calendar days.
 *
 * @module streakCalculation
 */

// ============================================================================
// Types
// ============================================================================

export interface StudentStreak {
  id: string
  studentId: string
  currentStreak: number
  longestStreak: number
  lastActivityDate: string // YYYY-MM-DD format
}

// ============================================================================
// Functions
// ============================================================================

/**
 * Normalize a Date to YYYY-MM-DD string in a given timezone.
 * Defaults to UTC if no timezone is provided.
 */
export function toDateString(date: Date, timeZone: string = 'UTC'): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const year = parts.find((p) => p.type === 'year')!.value
  const month = parts.find((p) => p.type === 'month')!.value
  const day = parts.find((p) => p.type === 'day')!.value
  return `${year}-${month}-${day}`
}

/**
 * Calculate the difference in calendar days between two YYYY-MM-DD date strings.
 */
export function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA + 'T00:00:00Z')
  const b = new Date(dateB + 'T00:00:00Z')
  const diffMs = Math.abs(a.getTime() - b.getTime())
  return Math.round(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Update a streak based on new activity.
 *
 * - If activity is on the same day as lastActivityDate, no change.
 * - If activity is the next consecutive day, increment currentStreak.
 * - If activity is more than 1 day after lastActivityDate, reset currentStreak to 1.
 *
 * longestStreak never decreases.
 *
 * @param streak - The current streak record. If null, creates a new streak.
 * @param activityDate - The date of the new activity (YYYY-MM-DD).
 * @param studentId - The student ID for new streak creation.
 * @returns Updated streak record.
 */
export function updateStreak(
  streak: StudentStreak | null,
  activityDate: string,
  studentId: string,
): StudentStreak {
  if (!streak) {
    return {
      id: '', // Caller assigns the real ID
      studentId,
      currentStreak: 1,
      longestStreak: 1,
      lastActivityDate: activityDate,
    }
  }

  const gap = daysBetween(streak.lastActivityDate, activityDate)

  // Same day — no change
  if (gap === 0) {
    return streak
  }

  // Consecutive day — increment
  if (gap === 1) {
    const newCurrent = streak.currentStreak + 1
    return {
      ...streak,
      currentStreak: newCurrent,
      longestStreak: Math.max(streak.longestStreak, newCurrent),
      lastActivityDate: activityDate,
    }
  }

  // Gap > 1 day — reset streak
  return {
    ...streak,
    currentStreak: 1,
    lastActivityDate: activityDate,
    // longestStreak never decreases
  }
}

/**
 * Check if a streak should be reset (used by the daily cron Lambda).
 *
 * A streak is stale if lastActivityDate is before yesterday.
 *
 * @param streak - The streak to check.
 * @param today - Today's date string (YYYY-MM-DD).
 * @returns true if the streak should be reset to 0.
 */
export function isStreakStale(streak: StudentStreak, today: string): boolean {
  const gap = daysBetween(streak.lastActivityDate, today)
  return gap > 1
}

/**
 * Reset a stale streak (sets currentStreak to 0 but preserves longestStreak).
 */
export function resetStreak(streak: StudentStreak): StudentStreak {
  return {
    ...streak,
    currentStreak: 0,
  }
}

/**
 * Check if a streak has reached a milestone that awards XP.
 * @returns The milestone reached, or null if no milestone.
 */
export function checkStreakMilestone(
  previousStreak: number,
  newStreak: number
): 3 | 7 | null {
  if (previousStreak < 3 && newStreak >= 3) return 3
  if (previousStreak < 7 && newStreak >= 7) return 7
  return null
}
