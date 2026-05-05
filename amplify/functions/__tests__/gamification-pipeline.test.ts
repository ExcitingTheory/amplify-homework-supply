/**
 * Integration test: Full XP pipeline flow through the Lambda handler
 *
 * Tests the realistic sequence:
 *   awardXP → checkBadges → updateStreak → checkPersonalBest → updateGuildXP → contributeToChallenge
 *
 * Each call is independent but this test verifies they chain correctly
 * with the same mocked GraphQL layer.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock Amplify
vi.mock('aws-amplify', () => ({
  Amplify: { configure: vi.fn() },
}))

vi.mock('@aws-sdk/credential-providers', () => ({
  fromEnv: vi.fn(() => vi.fn().mockResolvedValue({
    accessKeyId: 'test',
    secretAccessKey: 'test',
  })),
}))

const mockGraphql = vi.fn()
vi.mock('aws-amplify/data', () => ({
  generateClient: () => ({ graphql: mockGraphql }),
}))

describe('gamification handler — full XP pipeline integration', () => {
  beforeEach(() => {
    vi.resetModules()
    mockGraphql.mockReset()
    process.env.API_ENDPOINT = 'http://localhost/graphql'
    process.env.AWS_REGION = 'us-east-1'
  })

  it('completes the full award → badge → streak → personalBest → guild → challenge pipeline', async () => {
    const { handler } = await import('../gamification/handler')

    // =====================================================================
    // Step 1: awardXP — no existing logs, create new log, return total
    // =====================================================================
    mockGraphql
      // Existing logs check (for dedup by referenceId)
      .mockResolvedValueOnce({
        data: { listStudentXPLogByStudentId: { items: [] } },
      })
      // Create XP log
      .mockResolvedValueOnce({
        data: {
          createStudentXPLog: {
            id: 'xp-1', studentId: 'student-1', xpAmount: 50, reason: 'HOMEWORK_SUBMITTED', _version: 1,
          },
        },
      })
      // List all XP for total calc
      .mockResolvedValueOnce({
        data: {
          listStudentXPLogByStudentId: {
            items: [{ xpAmount: 50 }],
          },
        },
      })

    const xpResult = await handler(
      { fieldName: 'awardXP', arguments: { studentId: 'student-1', reason: 'HOMEWORK_SUBMITTED', referenceId: 'grade-1' }, identity: { sub: 'student-1' } },
      {} as any, vi.fn(),
    )

    expect(xpResult).toEqual(
      expect.objectContaining({ alreadyAwarded: false, xpAmount: 50, totalXP: 50 }),
    )

    // =====================================================================
    // Step 2: checkBadges — student now has 50 XP total, not enough for FIRST_100_XP
    // =====================================================================
    mockGraphql.mockReset()
    mockGraphql
      // List XP logs for total
      .mockResolvedValueOnce({
        data: { listStudentXPLogByStudentId: { items: [{ xpAmount: 50 }] } },
      })
      // List existing badges
      .mockResolvedValueOnce({
        data: { listStudentBadgeByStudentId: { items: [] } },
      })

    const badgeResult = await handler(
      { fieldName: 'checkBadges', arguments: { studentId: 'student-1' } },
      {} as any, vi.fn(),
    )

    expect(badgeResult).toEqual(
      expect.objectContaining({ newBadges: expect.any(Array), totalBadges: expect.any(Number) }),
    )

    // =====================================================================
    // Step 3: updateStreak — first activity, should create new streak
    // =====================================================================
    mockGraphql.mockReset()
    mockGraphql
      // GET_STREAK — no existing streak
      .mockResolvedValueOnce({
        data: { listStudentStreakByStudentId: { items: [] } },
      })
      // CREATE_STREAK
      .mockResolvedValueOnce({
        data: {
          createStudentStreak: {
            id: 'streak-1', studentId: 'student-1', currentStreak: 1, longestStreak: 1,
            lastActivityDate: new Date().toISOString().split('T')[0],
            freezesRemaining: 1, freezesUsed: 0, _version: 1,
          },
        },
      })

    const streakResult = await handler(
      { fieldName: 'updateStreak', arguments: { studentId: 'student-1' } },
      {} as any, vi.fn(),
    )

    expect(streakResult).toEqual(
      expect.objectContaining({ currentStreak: 1, longestStreak: 1 }),
    )

    // =====================================================================
    // Step 4: checkPersonalBest — first attempt at this unit
    // =====================================================================
    mockGraphql.mockReset()
    mockGraphql
      // List personal bests — none yet
      .mockResolvedValueOnce({
        data: { listStudentPersonalBestByStudentId: { items: [] } },
      })
      // Create personal best
      .mockResolvedValueOnce({
        data: {
          createStudentPersonalBest: {
            id: 'pb-1', studentId: 'student-1', unitID: 'unit-1',
            bestScore: 85, previousBest: null, _version: 1,
          },
        },
      })

    const pbResult = await handler(
      { fieldName: 'checkPersonalBest', arguments: { studentId: 'student-1', unitID: 'unit-1', score: 85 } },
      {} as any, vi.fn(),
    )

    expect(pbResult).toEqual(
      expect.objectContaining({ isNewBest: true, firstAttempt: true, bestScore: 85 }),
    )

    // =====================================================================
    // Step 5: updateGuildXP — student has guild membership
    // =====================================================================
    mockGraphql.mockReset()
    mockGraphql
      // List guild memberships by student
      .mockResolvedValueOnce({
        data: { listGuildMembershipByStudentId: { items: [{ guildId: 'guild-1' }] } },
      })
      // Get guild
      .mockResolvedValueOnce({
        data: { getGuild: { id: 'guild-1', cohortId: 'c1', totalXP: 200, _version: 3 } },
      })
      // Update guild
      .mockResolvedValueOnce({
        data: { updateGuild: { id: 'guild-1', totalXP: 250, _version: 4 } },
      })
      // handleContributeToChallenge auto-call: no active challenges
      .mockResolvedValueOnce({
        data: { listGroupChallengeByCohortId: { items: [] } },
      })

    const guildResult = await handler(
      { fieldName: 'updateGuildXP', arguments: { studentId: 'student-1', xpAmount: 50 } },
      {} as any, vi.fn(),
    )

    expect(guildResult).toEqual(
      expect.objectContaining({ updated: true, guilds: ['guild-1'] }),
    )

    // =====================================================================
    // Step 6: contributeToChallenge — active challenge exists
    // =====================================================================
    mockGraphql.mockReset()
    mockGraphql
      // List active challenges by cohort
      .mockResolvedValueOnce({
        data: { listGroupChallengeByCohortId: { items: [{ id: 'ch-1', cohortId: 'c1', currentXP: 100, targetXP: 500, active: true, _version: 2 }] } },
      })
      // Create contribution
      .mockResolvedValueOnce({
        data: { createGroupChallengeContribution: { id: 'contrib-1' } },
      })
      // Update challenge
      .mockResolvedValueOnce({
        data: { updateGroupChallenge: { id: 'ch-1', currentXP: 150, _version: 3 } },
      })

    const challengeResult = await handler(
      { fieldName: 'contributeToChallenge', arguments: { studentId: 'student-1', cohortId: 'c1', xpContributed: 50 } },
      {} as any, vi.fn(),
    )

    expect(challengeResult).toEqual(
      expect.objectContaining({
        contributions: expect.arrayContaining([
          expect.objectContaining({ challengeId: 'ch-1', newTotal: 150, goalReached: false }),
        ]),
      }),
    )
  })

  it('handles pipeline where awardXP detects duplicate', async () => {
    const { handler } = await import('../gamification/handler')

    // Existing log with same referenceId and reason → alreadyAwarded
    mockGraphql.mockResolvedValueOnce({
      data: {
        listStudentXPLogByStudentId: {
          items: [{ referenceId: 'grade-1', reason: 'HOMEWORK_SUBMITTED', xpAmount: 50 }],
        },
      },
    })

    const xpResult = await handler(
      { fieldName: 'awardXP', arguments: { studentId: 'student-1', reason: 'HOMEWORK_SUBMITTED', referenceId: 'grade-1' }, identity: { sub: 'student-1' } },
      {} as any, vi.fn(),
    )

    expect(xpResult).toEqual(
      expect.objectContaining({ alreadyAwarded: true, xpAmount: 0, totalXP: 50 }),
    )
  })

  it('handles updateGuildXP when student has no guild', async () => {
    const { handler } = await import('../gamification/handler')

    mockGraphql.mockResolvedValueOnce({
      data: { listGuildMembershipByStudentId: { items: [] } },
    })

    const result = await handler(
      { fieldName: 'updateGuildXP', arguments: { studentId: 'student-1', xpAmount: 50 } },
      {} as any, vi.fn(),
    )

    expect(result).toEqual(
      expect.objectContaining({ updated: false, reason: 'Student has no guild memberships' }),
    )
  })

  it('handles contributeToChallenge when no active challenges exist', async () => {
    const { handler } = await import('../gamification/handler')

    mockGraphql.mockResolvedValueOnce({
      data: { listGroupChallengeByCohortId: { items: [] } },
    })

    const result = await handler(
      { fieldName: 'contributeToChallenge', arguments: { studentId: 'student-1', cohortId: 'c1', xpContributed: 50 } },
      {} as any, vi.fn(),
    )

    expect(result).toEqual(
      expect.objectContaining({ contributed: false, reason: 'No active challenges' }),
    )
  })
})
