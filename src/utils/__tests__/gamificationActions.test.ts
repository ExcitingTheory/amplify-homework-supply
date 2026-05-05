/**
 * Unit tests for gamificationActions.ts — frontend mutation wrappers
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the Amplify client
const mockMutations: any = {}
vi.mock('../amplifyClient', () => ({
  getAmplifyClient: () => ({ mutations: mockMutations }),
}))

describe('gamificationActions', () => {
  beforeEach(() => {
    vi.resetModules()
    Object.keys(mockMutations).forEach((k) => delete mockMutations[k])
  })

  // ==========================================================================
  // awardXPAndCheck
  // ==========================================================================
  describe('awardXPAndCheck', () => {
    it('returns parsed XP result and fires badge/streak/guild calls', async () => {
      mockMutations.awardXP = vi.fn().mockResolvedValue({
        data: JSON.stringify({ alreadyAwarded: false, xpAmount: 50, totalXP: 250 }),
        errors: null,
      })
      mockMutations.checkBadges = vi.fn().mockResolvedValue({})
      mockMutations.updateStreak = vi.fn().mockResolvedValue({})
      mockMutations.updateGuildXP = vi.fn().mockResolvedValue({})

      const { awardXPAndCheck } = await import('../gamificationActions')
      const result = await awardXPAndCheck('student-1', 'HOMEWORK_SUBMITTED', 'grade-1')

      expect(result).toEqual({ alreadyAwarded: false, xpAmount: 50, totalXP: 250 })
      expect(mockMutations.awardXP).toHaveBeenCalledWith({
        studentId: 'student-1',
        reason: 'HOMEWORK_SUBMITTED',
        referenceId: 'grade-1',
      })
      expect(mockMutations.checkBadges).toHaveBeenCalledWith({ studentId: 'student-1' })
      expect(mockMutations.updateStreak).toHaveBeenCalledWith({ studentId: 'student-1' })
      // Guild XP should fire because xpAmount > 0 and not already awarded
      expect(mockMutations.updateGuildXP).toHaveBeenCalledWith({ studentId: 'student-1', xpAmount: 50 })
    })

    it('returns null on awardXP errors', async () => {
      mockMutations.awardXP = vi.fn().mockResolvedValue({
        data: null,
        errors: [{ message: 'Auth error' }],
      })
      mockMutations.checkBadges = vi.fn().mockResolvedValue({})
      mockMutations.updateStreak = vi.fn().mockResolvedValue({})

      const { awardXPAndCheck } = await import('../gamificationActions')
      const result = await awardXPAndCheck('student-1', 'HOMEWORK_SUBMITTED')

      expect(result).toBeNull()
    })

    it('returns null on thrown exception', async () => {
      mockMutations.awardXP = vi.fn().mockRejectedValue(new Error('Network error'))

      const { awardXPAndCheck } = await import('../gamificationActions')
      const result = await awardXPAndCheck('student-1', 'HOMEWORK_SUBMITTED')

      expect(result).toBeNull()
    })

    it('skips guild XP when already awarded', async () => {
      mockMutations.awardXP = vi.fn().mockResolvedValue({
        data: { alreadyAwarded: true, xpAmount: 0, totalXP: 250 },
        errors: null,
      })
      mockMutations.checkBadges = vi.fn().mockResolvedValue({})
      mockMutations.updateStreak = vi.fn().mockResolvedValue({})
      mockMutations.updateGuildXP = vi.fn().mockResolvedValue({})

      const { awardXPAndCheck } = await import('../gamificationActions')
      await awardXPAndCheck('student-1', 'HOMEWORK_SUBMITTED', 'grade-1')

      expect(mockMutations.updateGuildXP).not.toHaveBeenCalled()
    })

    it('handles badge/streak failures gracefully (fire-and-forget)', async () => {
      mockMutations.awardXP = vi.fn().mockResolvedValue({
        data: { alreadyAwarded: false, xpAmount: 50, totalXP: 100 },
        errors: null,
      })
      mockMutations.checkBadges = vi.fn().mockRejectedValue(new Error('badge fail'))
      mockMutations.updateStreak = vi.fn().mockRejectedValue(new Error('streak fail'))
      mockMutations.updateGuildXP = vi.fn().mockRejectedValue(new Error('guild fail'))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { awardXPAndCheck } = await import('../gamificationActions')
      const result = await awardXPAndCheck('student-1', 'HOMEWORK_SUBMITTED')

      // Main result should still be returned even when fire-and-forget calls fail
      expect(result).toEqual({ alreadyAwarded: false, xpAmount: 50, totalXP: 100 })

      // Wait for fire-and-forget promises to settle
      await new Promise((r) => setTimeout(r, 10))
      consoleSpy.mockRestore()
    })
  })

  // ==========================================================================
  // checkPersonalBest
  // ==========================================================================
  describe('checkPersonalBest', () => {
    it('returns parsed personal best result', async () => {
      mockMutations.checkPersonalBest = vi.fn().mockResolvedValue({
        data: JSON.stringify({ isNewBest: true, firstAttempt: false, bestScore: 95, previousBest: 88 }),
        errors: null,
      })

      const { checkPersonalBest } = await import('../gamificationActions')
      const result = await checkPersonalBest('student-1', 'unit-1', 95)

      expect(result).toEqual({ isNewBest: true, firstAttempt: false, bestScore: 95, previousBest: 88 })
      expect(mockMutations.checkPersonalBest).toHaveBeenCalledWith({
        studentId: 'student-1',
        unitID: 'unit-1',
        score: 95,
      })
    })

    it('returns null on errors', async () => {
      mockMutations.checkPersonalBest = vi.fn().mockResolvedValue({
        data: null,
        errors: [{ message: 'fail' }],
      })

      const { checkPersonalBest } = await import('../gamificationActions')
      const result = await checkPersonalBest('student-1', 'unit-1', 50)

      expect(result).toBeNull()
    })

    it('returns null on exception', async () => {
      mockMutations.checkPersonalBest = vi.fn().mockRejectedValue(new Error('boom'))

      const { checkPersonalBest } = await import('../gamificationActions')
      const result = await checkPersonalBest('student-1', 'unit-1', 50)

      expect(result).toBeNull()
    })
  })

  // ==========================================================================
  // checkEasterEggs
  // ==========================================================================
  describe('checkEasterEggs', () => {
    it('returns discovered eggs', async () => {
      mockMutations.checkEasterEggs = vi.fn().mockResolvedValue({
        data: { discovered: [{ eggId: 'egg-1', message: 'Found it!', xpReward: 25 }] },
        errors: null,
      })

      const { checkEasterEggs } = await import('../gamificationActions')
      const result = await checkEasterEggs('student-1', 'photosynthesis is cool')

      expect(result!.discovered).toHaveLength(1)
      expect(result!.discovered[0].eggId).toBe('egg-1')
    })

    it('passes triggerType when specified', async () => {
      mockMutations.checkEasterEggs = vi.fn().mockResolvedValue({
        data: { discovered: [] },
        errors: null,
      })

      const { checkEasterEggs } = await import('../gamificationActions')
      await checkEasterEggs('student-1', '', 'TIME_BASED')

      expect(mockMutations.checkEasterEggs).toHaveBeenCalledWith({
        studentId: 'student-1',
        submissionText: '',
        triggerType: 'TIME_BASED',
      })
    })

    it('returns null on errors', async () => {
      mockMutations.checkEasterEggs = vi.fn().mockResolvedValue({
        data: null,
        errors: [{ message: 'fail' }],
      })

      const { checkEasterEggs } = await import('../gamificationActions')
      expect(await checkEasterEggs('s1', 'text')).toBeNull()
    })
  })

  // ==========================================================================
  // discoverEasterEgg
  // ==========================================================================
  describe('discoverEasterEgg', () => {
    it('returns discovery result', async () => {
      mockMutations.discoverEasterEgg = vi.fn().mockResolvedValue({
        data: { alreadyDiscovered: false, message: 'Secret!', xpReward: 50 },
        errors: null,
      })

      const { discoverEasterEgg } = await import('../gamificationActions')
      const result = await discoverEasterEgg('student-1', 'egg-1')

      expect(result).toEqual({ alreadyDiscovered: false, message: 'Secret!', xpReward: 50 })
      expect(mockMutations.discoverEasterEgg).toHaveBeenCalledWith({
        studentId: 'student-1',
        eggId: 'egg-1',
      })
    })

    it('returns already discovered', async () => {
      mockMutations.discoverEasterEgg = vi.fn().mockResolvedValue({
        data: JSON.stringify({ alreadyDiscovered: true }),
        errors: null,
      })

      const { discoverEasterEgg } = await import('../gamificationActions')
      const result = await discoverEasterEgg('student-1', 'egg-1')

      expect(result!.alreadyDiscovered).toBe(true)
    })

    it('returns null on exception', async () => {
      mockMutations.discoverEasterEgg = vi.fn().mockRejectedValue(new Error('net'))

      const { discoverEasterEgg } = await import('../gamificationActions')
      expect(await discoverEasterEgg('s1', 'e1')).toBeNull()
    })
  })

  // ==========================================================================
  // updateUnitMemoryAndRebuild
  // ==========================================================================
  describe('updateUnitMemoryAndRebuild', () => {
    it('calls updateStudentUnitMemoryFromGrade then rebuilds profile', async () => {
      mockMutations.updateStudentUnitMemoryFromGrade = vi.fn().mockResolvedValue({
        data: {},
        errors: null,
      })
      mockMutations.rebuildStudentMemoryProfile = vi.fn().mockResolvedValue({})

      const { updateUnitMemoryAndRebuild } = await import('../gamificationActions')
      await updateUnitMemoryAndRebuild(
        'student-1', 'unit-1', 85,
        ['grammar'], ['vocabulary'],
      )

      expect(mockMutations.updateStudentUnitMemoryFromGrade).toHaveBeenCalledWith(
        expect.objectContaining({
          studentId: 'student-1',
          unitID: 'unit-1',
          accuracy: 85,
          weakAreas: ['grammar'],
          strongAreas: ['vocabulary'],
        }),
      )
      expect(mockMutations.rebuildStudentMemoryProfile).toHaveBeenCalledWith({ studentId: 'student-1' })
    })

    it('skips rebuild if update returns errors', async () => {
      mockMutations.updateStudentUnitMemoryFromGrade = vi.fn().mockResolvedValue({
        errors: [{ message: 'fail' }],
      })
      mockMutations.rebuildStudentMemoryProfile = vi.fn().mockResolvedValue({})

      const { updateUnitMemoryAndRebuild } = await import('../gamificationActions')
      await updateUnitMemoryAndRebuild('s1', 'u1', 50, [], [])

      expect(mockMutations.rebuildStudentMemoryProfile).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // generateSkillTree
  // ==========================================================================
  describe('generateSkillTree', () => {
    it('returns parsed skill tree result', async () => {
      mockMutations.generateSkillTree = vi.fn().mockResolvedValue({
        data: JSON.stringify({
          generated: true,
          unitID: 'unit-1',
          cohortId: 'unit-unit-1',
          skillCount: 3,
          skills: [
            { id: 's1', title: 'Skill 1', description: 'desc', xpReward: 25, prerequisites: [] },
          ],
        }),
        errors: null,
      })

      const { generateSkillTree } = await import('../gamificationActions')
      const result = await generateSkillTree('unit-1')

      expect(result).toEqual(
        expect.objectContaining({ generated: true, unitID: 'unit-1', skillCount: 3 }),
      )
      expect(mockMutations.generateSkillTree).toHaveBeenCalledWith({
        unitID: 'unit-1',
        cohortId: null,
      })
    })

    it('passes cohortId when provided', async () => {
      mockMutations.generateSkillTree = vi.fn().mockResolvedValue({
        data: { generated: true, skillCount: 1, skills: [] },
        errors: null,
      })

      const { generateSkillTree } = await import('../gamificationActions')
      await generateSkillTree('unit-1', 'cohort-abc')

      expect(mockMutations.generateSkillTree).toHaveBeenCalledWith({
        unitID: 'unit-1',
        cohortId: 'cohort-abc',
      })
    })

    it('returns null on errors', async () => {
      mockMutations.generateSkillTree = vi.fn().mockResolvedValue({
        data: null,
        errors: [{ message: 'fail' }],
      })

      const { generateSkillTree } = await import('../gamificationActions')
      expect(await generateSkillTree('unit-1')).toBeNull()
    })

    it('returns null on exception', async () => {
      mockMutations.generateSkillTree = vi.fn().mockRejectedValue(new Error('timeout'))

      const { generateSkillTree } = await import('../gamificationActions')
      expect(await generateSkillTree('unit-1')).toBeNull()
    })
  })
})
