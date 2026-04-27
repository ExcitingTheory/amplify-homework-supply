import { describe, it, expect } from 'vitest'
import {
  calculateTotalXP,
  calculateLevel,
  getXPForAction,
  getLevelInfo,
  XPReason,
  type StudentXPLog,
} from '../../utils/xpCalculation'

describe('xpCalculation', () => {
  // Helper to create a log entry
  function makeLog(xpAmount: number, reason: XPReason = XPReason.HOMEWORK_SUBMITTED): StudentXPLog {
    return {
      id: crypto.randomUUID(),
      studentId: 'student-1',
      xpAmount,
      reason,
      createdAt: new Date().toISOString(),
    }
  }

  describe('calculateTotalXP', () => {
    it('returns 0 for empty logs', () => {
      expect(calculateTotalXP([])).toBe(0)
    })

    it('sums all xpAmount values', () => {
      const logs = [makeLog(50), makeLog(25), makeLog(75)]
      expect(calculateTotalXP(logs)).toBe(150)
    })

    it('handles a single log entry', () => {
      expect(calculateTotalXP([makeLog(100)])).toBe(100)
    })
  })

  describe('getXPForAction', () => {
    it('returns 50 for HOMEWORK_SUBMITTED', () => {
      expect(getXPForAction(XPReason.HOMEWORK_SUBMITTED)).toBe(50)
    })

    it('returns 25 for AI_FEEDBACK_REVISED', () => {
      expect(getXPForAction(XPReason.AI_FEEDBACK_REVISED)).toBe(25)
    })

    it('returns 75 for ALL_BLOCKS_COMPLETED', () => {
      expect(getXPForAction(XPReason.ALL_BLOCKS_COMPLETED)).toBe(75)
    })

    it('returns 40 for PEER_REVIEW_GIVEN', () => {
      expect(getXPForAction(XPReason.PEER_REVIEW_GIVEN)).toBe(40)
    })

    it('returns 30 for PEER_REVIEW_HOSTED', () => {
      expect(getXPForAction(XPReason.PEER_REVIEW_HOSTED)).toBe(30)
    })

    it('returns 20 for NAILED_IT', () => {
      expect(getXPForAction(XPReason.NAILED_IT)).toBe(20)
    })

    it('returns 15 for ON_TIME_SUBMISSION', () => {
      expect(getXPForAction(XPReason.ON_TIME_SUBMISSION)).toBe(15)
    })

    it('returns 30 for STREAK_3DAY', () => {
      expect(getXPForAction(XPReason.STREAK_3DAY)).toBe(30)
    })

    it('returns 75 for STREAK_7DAY', () => {
      expect(getXPForAction(XPReason.STREAK_7DAY)).toBe(75)
    })

    it('returns 100 for PERFECT_SCORE', () => {
      expect(getXPForAction(XPReason.PERFECT_SCORE)).toBe(100)
    })
  })

  describe('calculateLevel', () => {
    it('returns level 1 for 0 XP', () => {
      expect(calculateLevel(0)).toBe(1)
    })

    it('returns level 1 for 149 XP (just below level 2)', () => {
      expect(calculateLevel(149)).toBe(1)
    })

    it('returns level 2 for exactly 150 XP', () => {
      expect(calculateLevel(150)).toBe(2)
    })

    it('returns level 3 for 400 XP', () => {
      expect(calculateLevel(400)).toBe(3)
    })

    it('returns level 4 for 800 XP', () => {
      expect(calculateLevel(800)).toBe(4)
    })

    it('returns level 5 for 1500 XP', () => {
      expect(calculateLevel(1500)).toBe(5)
    })

    it('returns level 6 for 2500 XP', () => {
      expect(calculateLevel(2500)).toBe(6)
    })

    it('returns level 6 for XP far above max threshold', () => {
      expect(calculateLevel(99999)).toBe(6)
    })
  })

  describe('getLevelInfo', () => {
    it('returns Beginner at 0 XP with 0% progress', () => {
      const info = getLevelInfo(0)
      expect(info.level).toBe(1)
      expect(info.label).toBe('Beginner')
      expect(info.progress).toBe(0)
      expect(info.xpForNextLevel).toBe(150)
    })

    it('returns correct progress within a level', () => {
      const info = getLevelInfo(75) // halfway through level 1 (0-150)
      expect(info.level).toBe(1)
      expect(info.progress).toBe(50)
    })

    it('returns 100% progress at max level', () => {
      const info = getLevelInfo(5000)
      expect(info.level).toBe(6)
      expect(info.label).toBe('Master')
      expect(info.progress).toBe(100)
      expect(info.xpForNextLevel).toBeNull()
    })

    it('returns correct info at level boundary', () => {
      const info = getLevelInfo(150)
      expect(info.level).toBe(2)
      expect(info.label).toBe('Explorer')
      expect(info.progress).toBe(0)
      expect(info.xpRequired).toBe(150)
      expect(info.xpForNextLevel).toBe(400)
    })
  })
})
