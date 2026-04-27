/**
 * Tests for leaderboard privacy / anonymization utilities
 */

import { describe, it, expect } from 'vitest'
import { applyLeaderboardPrivacy } from '../leaderboardPrivacy'

const baseEntries = [
  { studentId: 's1', studentName: 'Alice', avatarColor: '#f00', totalXP: 500, level: 3, currentStreak: 5 },
  { studentId: 's2', studentName: 'Bob', avatarColor: '#0f0', totalXP: 400, level: 2, currentStreak: 0 },
  { studentId: 's3', studentName: 'Charlie', avatarColor: '#00f', totalXP: 300, level: 2, currentStreak: 2 },
]

describe('applyLeaderboardPrivacy', () => {
  it('should return entries unchanged when no one opted out', () => {
    const result = applyLeaderboardPrivacy(baseEntries, {
      optedOutStudentIds: new Set(),
      currentStudentId: 's1',
    })
    expect(result).toEqual(baseEntries)
  })

  it('should anonymize opted-out student names', () => {
    const result = applyLeaderboardPrivacy(baseEntries, {
      optedOutStudentIds: new Set(['s2']),
      currentStudentId: 's1',
    })

    expect(result[0].studentName).toBe('Alice')
    expect(result[1].studentName).toBe('Anonymous Student')
    expect(result[1].avatarColor).toBe('#9e9e9e')
    expect(result[2].studentName).toBe('Charlie')
  })

  it('should still show real name to the opted-out student themselves', () => {
    const result = applyLeaderboardPrivacy(baseEntries, {
      optedOutStudentIds: new Set(['s2']),
      currentStudentId: 's2',
    })

    // s2 is viewing — they see their own real name
    expect(result[1].studentName).toBe('Bob')
    expect(result[1].avatarColor).toBe('#0f0')
  })

  it('should return empty array when leaderboard is disabled', () => {
    const result = applyLeaderboardPrivacy(baseEntries, {
      optedOutStudentIds: new Set(),
      currentStudentId: 's1',
      leaderboardDisabled: true,
    })

    expect(result).toEqual([])
  })

  it('should anonymize multiple opted-out students', () => {
    const result = applyLeaderboardPrivacy(baseEntries, {
      optedOutStudentIds: new Set(['s1', 's3']),
      currentStudentId: 's2',
    })

    expect(result[0].studentName).toBe('Anonymous Student')
    expect(result[1].studentName).toBe('Bob')
    expect(result[2].studentName).toBe('Anonymous Student')
  })

  it('should preserve XP and level data for anonymized entries', () => {
    const result = applyLeaderboardPrivacy(baseEntries, {
      optedOutStudentIds: new Set(['s2']),
      currentStudentId: 's1',
    })

    expect(result[1].totalXP).toBe(400)
    expect(result[1].level).toBe(2)
    expect(result[1].currentStreak).toBe(0)
  })
})
