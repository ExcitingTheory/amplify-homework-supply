/**
 * Unit tests for the gamification handler — guild XP and group challenges
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

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

describe('gamification handler — updateGuildXP', () => {
  beforeEach(() => {
    vi.resetModules()
    mockGraphql.mockReset()
    process.env.API_ENDPOINT = 'http://localhost/graphql'
    process.env.AWS_REGION = 'us-east-1'
  })

  it('should return not updated when student has no guild memberships', async () => {
    mockGraphql.mockResolvedValueOnce({
      data: { listGuildMembershipByStudentId: { items: [] } },
    })

    const { handler } = await import('../gamification/handler')
    const result = await handler(
      {
        fieldName: 'updateGuildXP',
        arguments: { studentId: 'student-1', xpAmount: 50 },
      },
      {} as any,
      vi.fn(),
    )

    expect(result.updated).toBe(false)
    expect(result.reason).toContain('no guild')
  })

  it('should update guild totalXP and return guild IDs', async () => {
    // Student has one membership
    mockGraphql
      .mockResolvedValueOnce({
        data: {
          listGuildMembershipByStudentId: {
            items: [{ id: 'mem-1', guildId: 'guild-1', studentId: 'student-1', role: 'MEMBER', _version: 1 }],
          },
        },
      })
      // Get guild
      .mockResolvedValueOnce({
        data: {
          getGuild: { id: 'guild-1', name: 'Alpha Squad', cohortId: 'cohort-1', totalXP: 200, _version: 3 },
        },
      })
      // Update guild
      .mockResolvedValueOnce({
        data: { updateGuild: { id: 'guild-1', totalXP: 250, _version: 4 } },
      })
      // contributeToChallenge: no active challenges
      .mockResolvedValueOnce({
        data: { listGroupChallengeByCohortId: { items: [] } },
      })

    const { handler } = await import('../gamification/handler')
    const result = await handler(
      {
        fieldName: 'updateGuildXP',
        arguments: { studentId: 'student-1', xpAmount: 50 },
      },
      {} as any,
      vi.fn(),
    )

    expect(result.updated).toBe(true)
    expect(result.guilds).toContain('guild-1')
    // Verify guild update call with correct totalXP
    const updateCall = mockGraphql.mock.calls.find(
      (call: any) => typeof call[0]?.query === 'string' && call[0].query.includes('updateGuild'),
    )
    expect(updateCall).toBeDefined()
    expect(updateCall![0].variables.input.totalXP).toBe(250)
  })
})

describe('gamification handler — contributeToChallenge', () => {
  beforeEach(() => {
    vi.resetModules()
    mockGraphql.mockReset()
    process.env.API_ENDPOINT = 'http://localhost/graphql'
    process.env.AWS_REGION = 'us-east-1'
  })

  it('should return not contributed when no active challenges', async () => {
    mockGraphql.mockResolvedValueOnce({
      data: { listGroupChallengeByCohortId: { items: [] } },
    })

    const { handler } = await import('../gamification/handler')
    const result = await handler(
      {
        fieldName: 'contributeToChallenge',
        arguments: { studentId: 'student-1', cohortId: 'cohort-1', xpContributed: 30 },
      },
      {} as any,
      vi.fn(),
    )

    expect(result.contributed).toBe(false)
    expect(result.reason).toContain('No active challenges')
  })

  it('should record contribution and update challenge currentXP', async () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString()

    mockGraphql
      // Active challenge
      .mockResolvedValueOnce({
        data: {
          listGroupChallengeByCohortId: {
            items: [
              {
                id: 'ch-1',
                cohortId: 'cohort-1',
                title: 'Weekly Sprint',
                targetXP: 1000,
                currentXP: 800,
                deadline: futureDate,
                active: true,
                bonusMultiplier: 1.5,
                _version: 2,
              },
            ],
          },
        },
      })
      // Create contribution
      .mockResolvedValueOnce({
        data: { createGroupChallengeContribution: { id: 'contrib-1' } },
      })
      // Update challenge
      .mockResolvedValueOnce({
        data: { updateGroupChallenge: { id: 'ch-1', currentXP: 830, _version: 3 } },
      })

    const { handler } = await import('../gamification/handler')
    const result = await handler(
      {
        fieldName: 'contributeToChallenge',
        arguments: { studentId: 'student-1', cohortId: 'cohort-1', xpContributed: 30 },
      },
      {} as any,
      vi.fn(),
    )

    expect(result.contributed).toBe(true)
    expect(result.contributions).toHaveLength(1)
    expect(result.contributions[0].challengeId).toBe('ch-1')
    expect(result.contributions[0].newTotal).toBe(830)
    expect(result.contributions[0].goalReached).toBe(false)
  })

  it('should mark goalReached and award bonus when target met', async () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString()

    mockGraphql
      // Active challenge - near goal
      .mockResolvedValueOnce({
        data: {
          listGroupChallengeByCohortId: {
            items: [
              {
                id: 'ch-2',
                cohortId: 'cohort-1',
                title: 'Finish Line',
                targetXP: 500,
                currentXP: 480,
                deadline: futureDate,
                active: true,
                bonusMultiplier: 2,
                _version: 5,
              },
            ],
          },
        },
      })
      // Create contribution
      .mockResolvedValueOnce({
        data: { createGroupChallengeContribution: { id: 'contrib-2' } },
      })
      // Update challenge (now inactive because goal reached)
      .mockResolvedValueOnce({
        data: { updateGroupChallenge: { id: 'ch-2', currentXP: 500, _version: 6 } },
      })
      // awardXP bonus: list existing
      .mockResolvedValueOnce({
        data: { listStudentXPLogByStudentId: { items: [] } },
      })
      // awardXP bonus: create
      .mockResolvedValueOnce({
        data: { createStudentXPLog: { id: 'xp-bonus', xpAmount: 50, _version: 1 } },
      })

    const { handler } = await import('../gamification/handler')
    const result = await handler(
      {
        fieldName: 'contributeToChallenge',
        arguments: { studentId: 'student-1', cohortId: 'cohort-1', xpContributed: 20 },
      },
      {} as any,
      vi.fn(),
    )

    expect(result.contributed).toBe(true)
    expect(result.contributions[0].goalReached).toBe(true)
    expect(result.contributions[0].newTotal).toBe(500)

    // Verify challenge was deactivated
    const updateCall = mockGraphql.mock.calls.find(
      (call: any) => typeof call[0]?.query === 'string' && call[0].query.includes('updateGroupChallenge'),
    )
    expect(updateCall).toBeDefined()
    expect(updateCall![0].variables.input.active).toBe(false)
  })

  it('should skip expired challenges', async () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString()

    mockGraphql
      .mockResolvedValueOnce({
        data: {
          listGroupChallengeByCohortId: {
            items: [
              {
                id: 'ch-expired',
                cohortId: 'cohort-1',
                title: 'Expired Challenge',
                targetXP: 1000,
                currentXP: 500,
                deadline: pastDate,
                active: true,
                _version: 1,
              },
            ],
          },
        },
      })

    const { handler } = await import('../gamification/handler')
    const result = await handler(
      {
        fieldName: 'contributeToChallenge',
        arguments: { studentId: 'student-1', cohortId: 'cohort-1', xpContributed: 50 },
      },
      {} as any,
      vi.fn(),
    )

    expect(result.contributed).toBe(true)
    expect(result.contributions).toEqual([])
  })
})
