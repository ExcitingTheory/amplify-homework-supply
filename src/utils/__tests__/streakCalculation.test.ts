import { describe, it, expect } from 'vitest'
import {
  updateStreak,
  isStreakStale,
  resetStreak,
  checkStreakMilestone,
  daysBetween,
  toDateString,
  type StudentStreak,
} from '../../utils/streakCalculation'

describe('streakCalculation', () => {
  function makeStreak(overrides: Partial<StudentStreak> = {}): StudentStreak {
    return {
      id: 'streak-1',
      studentId: 'student-1',
      currentStreak: 1,
      longestStreak: 1,
      lastActivityDate: '2026-04-10',
      ...overrides,
    }
  }

  describe('daysBetween', () => {
    it('returns 0 for the same date', () => {
      expect(daysBetween('2026-04-10', '2026-04-10')).toBe(0)
    })

    it('returns 1 for consecutive days', () => {
      expect(daysBetween('2026-04-10', '2026-04-11')).toBe(1)
    })

    it('handles order-independent comparison', () => {
      expect(daysBetween('2026-04-15', '2026-04-10')).toBe(5)
    })
  })

  describe('toDateString', () => {
    it('formats a date as YYYY-MM-DD in UTC', () => {
      const date = new Date('2026-04-15T14:30:00Z')
      expect(toDateString(date, 'UTC')).toBe('2026-04-15')
    })

    it('handles timezone where date differs from UTC', () => {
      // 11:59 PM in America/New_York on April 15 = April 16 UTC
      const date = new Date('2026-04-16T03:59:00Z')
      expect(toDateString(date, 'America/New_York')).toBe('2026-04-15')
    })
  })

  describe('updateStreak', () => {
    it('creates a new streak with currentStreak=1 when no streak exists', () => {
      const result = updateStreak(null, '2026-04-10', 'student-1')
      expect(result.currentStreak).toBe(1)
      expect(result.longestStreak).toBe(1)
      expect(result.lastActivityDate).toBe('2026-04-10')
    })

    it('does not change streak for same-day activity', () => {
      const streak = makeStreak({ currentStreak: 3, lastActivityDate: '2026-04-10' })
      const result = updateStreak(streak, '2026-04-10', 'student-1')
      expect(result.currentStreak).toBe(3)
      expect(result.lastActivityDate).toBe('2026-04-10')
    })

    it('increments streak for consecutive days', () => {
      const streak = makeStreak({ currentStreak: 3, longestStreak: 5, lastActivityDate: '2026-04-10' })
      const result = updateStreak(streak, '2026-04-11', 'student-1')
      expect(result.currentStreak).toBe(4)
      expect(result.lastActivityDate).toBe('2026-04-11')
    })

    it('updates longestStreak when current exceeds it', () => {
      const streak = makeStreak({ currentStreak: 5, longestStreak: 5, lastActivityDate: '2026-04-10' })
      const result = updateStreak(streak, '2026-04-11', 'student-1')
      expect(result.currentStreak).toBe(6)
      expect(result.longestStreak).toBe(6)
    })

    it('does not decrease longestStreak', () => {
      const streak = makeStreak({ currentStreak: 2, longestStreak: 10, lastActivityDate: '2026-04-10' })
      const result = updateStreak(streak, '2026-04-11', 'student-1')
      expect(result.longestStreak).toBe(10)
    })

    it('resets currentStreak to 1 when gap > 1 day', () => {
      const streak = makeStreak({ currentStreak: 5, longestStreak: 5, lastActivityDate: '2026-04-10' })
      const result = updateStreak(streak, '2026-04-13', 'student-1')
      expect(result.currentStreak).toBe(1)
      expect(result.longestStreak).toBe(5) // Never decreases
    })
  })

  describe('isStreakStale', () => {
    it('returns false if lastActivity is today', () => {
      const streak = makeStreak({ lastActivityDate: '2026-04-15' })
      expect(isStreakStale(streak, '2026-04-15')).toBe(false)
    })

    it('returns false if lastActivity is yesterday', () => {
      const streak = makeStreak({ lastActivityDate: '2026-04-14' })
      expect(isStreakStale(streak, '2026-04-15')).toBe(false)
    })

    it('returns true if lastActivity is before yesterday', () => {
      const streak = makeStreak({ lastActivityDate: '2026-04-13' })
      expect(isStreakStale(streak, '2026-04-15')).toBe(true)
    })
  })

  describe('resetStreak', () => {
    it('sets currentStreak to 0', () => {
      const streak = makeStreak({ currentStreak: 7 })
      const result = resetStreak(streak)
      expect(result.currentStreak).toBe(0)
    })

    it('preserves longestStreak', () => {
      const streak = makeStreak({ currentStreak: 7, longestStreak: 12 })
      const result = resetStreak(streak)
      expect(result.longestStreak).toBe(12)
    })
  })

  describe('checkStreakMilestone', () => {
    it('returns 3 when crossing the 3-day threshold', () => {
      expect(checkStreakMilestone(2, 3)).toBe(3)
    })

    it('returns 7 when crossing the 7-day threshold', () => {
      expect(checkStreakMilestone(6, 7)).toBe(7)
    })

    it('returns null when no milestone crossed', () => {
      expect(checkStreakMilestone(4, 5)).toBeNull()
    })

    it('returns null when already past milestone', () => {
      expect(checkStreakMilestone(3, 4)).toBeNull()
    })

    it('returns 3 when jumping from 0 to 3', () => {
      expect(checkStreakMilestone(0, 3)).toBe(3)
    })
  })
})
