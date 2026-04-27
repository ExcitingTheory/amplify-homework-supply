import { describe, it, expect } from 'vitest'
import {
  calculateTotalXP,
  calculateLevel,
  getLevelInfo,
  getXPForAction,
  XPReason,
} from '../../src/utils/xpCalculation'

describe('xpCalculation', () => {
  describe('calculateTotalXP', () => {
    it('returns 0 for empty logs', () => {
      expect(calculateTotalXP([])).toBe(0)
    })

    it('sums xpAmount from all logs', () => {
      const logs = [
        { id: '1', studentId: 's1', xpAmount: 50, reason: XPReason.HOMEWORK_SUBMITTED, createdAt: '2025-01-01' },
        { id: '2', studentId: 's1', xpAmount: 25, reason: XPReason.AI_FEEDBACK_REVISED, createdAt: '2025-01-02' },
        { id: '3', studentId: 's1', xpAmount: 100, reason: XPReason.PERFECT_SCORE, createdAt: '2025-01-03' },
      ]
      expect(calculateTotalXP(logs)).toBe(175)
    })
  })

  describe('getXPForAction', () => {
    it('returns correct XP for HOMEWORK_SUBMITTED', () => {
      expect(getXPForAction(XPReason.HOMEWORK_SUBMITTED)).toBe(50)
    })

    it('returns correct XP for PERFECT_SCORE', () => {
      expect(getXPForAction(XPReason.PERFECT_SCORE)).toBe(100)
    })

    it('returns correct XP for STREAK_7DAY', () => {
      expect(getXPForAction(XPReason.STREAK_7DAY)).toBe(75)
    })
  })

  describe('calculateLevel', () => {
    it('returns level 1 for 0 XP', () => {
      expect(calculateLevel(0)).toBe(1)
    })

    it('returns level 1 for 149 XP', () => {
      expect(calculateLevel(149)).toBe(1)
    })

    it('returns level 2 at exactly 150 XP', () => {
      expect(calculateLevel(150)).toBe(2)
    })

    it('returns level 3 at 400 XP', () => {
      expect(calculateLevel(400)).toBe(3)
    })

    it('returns level 6 at 2500 XP', () => {
      expect(calculateLevel(2500)).toBe(6)
    })

    it('returns level 6 for very high XP', () => {
      expect(calculateLevel(99999)).toBe(6)
    })
  })

  describe('getLevelInfo', () => {
    it('returns Beginner info at 0 XP with 0% progress', () => {
      const info = getLevelInfo(0)
      expect(info.level).toBe(1)
      expect(info.label).toBe('Beginner')
      expect(info.xpRequired).toBe(0)
      expect(info.xpForNextLevel).toBe(150)
      expect(info.progress).toBe(0)
    })

    it('returns 50% progress halfway through level 1', () => {
      const info = getLevelInfo(75)
      expect(info.level).toBe(1)
      expect(info.progress).toBe(50)
    })

    it('returns Explorer at exactly 150 XP with 0% progress', () => {
      const info = getLevelInfo(150)
      expect(info.level).toBe(2)
      expect(info.label).toBe('Explorer')
      expect(info.progress).toBe(0)
    })

    it('returns Master at 2500 XP with null xpForNextLevel', () => {
      const info = getLevelInfo(2500)
      expect(info.level).toBe(6)
      expect(info.label).toBe('Master')
      expect(info.xpForNextLevel).toBeNull()
      expect(info.progress).toBe(100)
    })

    it('clamps progress to 100 max', () => {
      const info = getLevelInfo(2499)
      expect(info.progress).toBeLessThanOrEqual(100)
    })

    it('returns correct mid-level progress', () => {
      // Level 3: 400–800 XP. At 600 XP: (600-400)/(800-400) = 50%
      const info = getLevelInfo(600)
      expect(info.level).toBe(3)
      expect(info.label).toBe('Practitioner')
      expect(info.progress).toBe(50)
    })
  })
})
