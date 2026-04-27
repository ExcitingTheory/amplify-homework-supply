/**
 * Leaderboard privacy utilities.
 *
 * Applies opt-out anonymization and cohort-scoping rules
 * before leaderboard data is shown to students.
 *
 * @module leaderboardPrivacy
 */

import type { LeaderboardEntry } from '../components/Leaderboard/LeaderboardTable'

const ANONYMOUS_NAME = 'Anonymous Student'

export interface PrivacyOptions {
  /** IDs of students who have opted out of showing their name. */
  optedOutStudentIds: Set<string>
  /** The current student's ID (always sees their own real name). */
  currentStudentId: string
  /** If true, the leaderboard is disabled by the instructor. */
  leaderboardDisabled?: boolean
}

/**
 * Anonymize leaderboard entries based on privacy rules:
 * 1. Opted-out students show as "Anonymous Student" (except to themselves)
 * 2. If leaderboard is disabled, returns an empty array
 */
export function applyLeaderboardPrivacy(
  entries: LeaderboardEntry[],
  options: PrivacyOptions,
): LeaderboardEntry[] {
  if (options.leaderboardDisabled) return []

  return entries.map((entry) => {
    if (
      options.optedOutStudentIds.has(entry.studentId) &&
      entry.studentId !== options.currentStudentId
    ) {
      return {
        ...entry,
        studentName: ANONYMOUS_NAME,
        avatarColor: '#9e9e9e',
      }
    }
    return entry
  })
}
