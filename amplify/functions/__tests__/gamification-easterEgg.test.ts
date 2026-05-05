/**
 * Unit tests for the gamification handler — easter egg detection & discovery
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

describe('gamification handler — checkEasterEggs', () => {
  beforeEach(() => {
    vi.resetModules()
    mockGraphql.mockReset()
    process.env.API_ENDPOINT = 'http://localhost/graphql'
    process.env.AWS_REGION = 'us-east-1'
  })

  it('should return empty discovered array when no active easter eggs', async () => {
    mockGraphql.mockResolvedValueOnce({
      data: { listEasterEggs: { items: [] } },
    })

    const { handler } = await import('../gamification/handler')
    const result = await handler(
      {
        fieldName: 'checkEasterEggs',
        arguments: { studentId: 'student-1', submissionText: 'hello world' },
      },
      {} as any,
      vi.fn(),
    )

    expect(result.discovered).toEqual([])
  })

  it('should discover keyword-based easter egg on match', async () => {
    // Active eggs
    mockGraphql
      .mockResolvedValueOnce({
        data: {
          listEasterEggs: {
            items: [
              {
                id: 'egg-1',
                trigger: 'KEYWORD',
                triggerValue: 'photosynthesis',
                xpReward: 50,
                badgeId: null,
                revealMessage: 'You found a science secret!',
                active: true,
                _version: 1,
              },
            ],
          },
        },
      })
      // No existing discoveries
      .mockResolvedValueOnce({
        data: { listEasterEggDiscoveryByStudentId: { items: [] } },
      })
      // Create discovery
      .mockResolvedValueOnce({
        data: { createEasterEggDiscovery: { id: 'disc-1' } },
      })
      // awardXP: list existing XP logs
      .mockResolvedValueOnce({
        data: { listStudentXPLogByStudentId: { items: [] } },
      })
      // awardXP: create XP log
      .mockResolvedValueOnce({
        data: { createStudentXPLog: { id: 'xp-1', xpAmount: 50, _version: 1 } },
      })

    const { handler } = await import('../gamification/handler')
    const result = await handler(
      {
        fieldName: 'checkEasterEggs',
        arguments: {
          studentId: 'student-1',
          submissionText: 'I learned about photosynthesis today!',
        },
      },
      {} as any,
      vi.fn(),
    )

    expect(result.discovered).toHaveLength(1)
    expect(result.discovered[0].eggId).toBe('egg-1')
    expect(result.discovered[0].message).toBe('You found a science secret!')
    expect(result.discovered[0].xpReward).toBe(50)
  })

  it('should skip already-discovered eggs', async () => {
    mockGraphql
      .mockResolvedValueOnce({
        data: {
          listEasterEggs: {
            items: [
              {
                id: 'egg-1',
                trigger: 'KEYWORD',
                triggerValue: 'secret',
                xpReward: 25,
                revealMessage: 'Found it!',
                active: true,
                _version: 1,
              },
            ],
          },
        },
      })
      // Already discovered
      .mockResolvedValueOnce({
        data: {
          listEasterEggDiscoveryByStudentId: {
            items: [{ id: 'disc-1', studentId: 'student-1', eggId: 'egg-1' }],
          },
        },
      })

    const { handler } = await import('../gamification/handler')
    const result = await handler(
      {
        fieldName: 'checkEasterEggs',
        arguments: {
          studentId: 'student-1',
          submissionText: 'this has a secret keyword',
        },
      },
      {} as any,
      vi.fn(),
    )

    expect(result.discovered).toEqual([])
  })

  it('should be case-insensitive for keyword matching', async () => {
    mockGraphql
      .mockResolvedValueOnce({
        data: {
          listEasterEggs: {
            items: [
              {
                id: 'egg-2',
                trigger: 'KEYWORD',
                triggerValue: 'EUREKA',
                xpReward: 10,
                revealMessage: 'Eureka!',
                active: true,
                _version: 1,
              },
            ],
          },
        },
      })
      .mockResolvedValueOnce({
        data: { listEasterEggDiscoveryByStudentId: { items: [] } },
      })
      .mockResolvedValueOnce({
        data: { createEasterEggDiscovery: { id: 'disc-2' } },
      })
      .mockResolvedValueOnce({
        data: { listStudentXPLogByStudentId: { items: [] } },
      })
      .mockResolvedValueOnce({
        data: { createStudentXPLog: { id: 'xp-2', xpAmount: 10, _version: 1 } },
      })

    const { handler } = await import('../gamification/handler')
    const result = await handler(
      {
        fieldName: 'checkEasterEggs',
        arguments: {
          studentId: 'student-1',
          submissionText: 'I had a eureka moment!',
        },
      },
      {} as any,
      vi.fn(),
    )

    expect(result.discovered).toHaveLength(1)
    expect(result.discovered[0].eggId).toBe('egg-2')
  })
})

describe('gamification handler — discoverEasterEgg', () => {
  beforeEach(() => {
    vi.resetModules()
    mockGraphql.mockReset()
    process.env.API_ENDPOINT = 'http://localhost/graphql'
    process.env.AWS_REGION = 'us-east-1'
  })

  it('should return alreadyDiscovered true when egg already found', async () => {
    mockGraphql.mockResolvedValueOnce({
      data: {
        listEasterEggDiscoveryByStudentId: {
          items: [{ id: 'disc-1', studentId: 'student-1', eggId: 'egg-1' }],
        },
      },
    })

    const { handler } = await import('../gamification/handler')
    const result = await handler(
      {
        fieldName: 'discoverEasterEgg',
        arguments: { studentId: 'student-1', eggId: 'egg-1' },
      },
      {} as any,
      vi.fn(),
    )

    expect(result.alreadyDiscovered).toBe(true)
  })

  it('should create discovery and award XP for new egg', async () => {
    // Not yet discovered
    mockGraphql
      .mockResolvedValueOnce({
        data: { listEasterEggDiscoveryByStudentId: { items: [] } },
      })
      // Create discovery
      .mockResolvedValueOnce({
        data: { createEasterEggDiscovery: { id: 'disc-1' } },
      })
      // Fetch egg details
      .mockResolvedValueOnce({
        data: {
          listEasterEggs: {
            items: [
              {
                id: 'egg-1',
                trigger: 'UI_INTERACTION',
                xpReward: 100,
                revealMessage: 'Secret unlocked!',
                active: true,
                _version: 1,
              },
            ],
          },
        },
      })
      // awardXP: list existing
      .mockResolvedValueOnce({
        data: { listStudentXPLogByStudentId: { items: [] } },
      })
      // awardXP: create
      .mockResolvedValueOnce({
        data: { createStudentXPLog: { id: 'xp-1', xpAmount: 100, _version: 1 } },
      })

    const { handler } = await import('../gamification/handler')
    const result = await handler(
      {
        fieldName: 'discoverEasterEgg',
        arguments: { studentId: 'student-1', eggId: 'egg-1' },
      },
      {} as any,
      vi.fn(),
    )

    expect(result.alreadyDiscovered).toBe(false)
    expect(result.message).toBe('Secret unlocked!')
    expect(result.xpReward).toBe(100)
  })
})
