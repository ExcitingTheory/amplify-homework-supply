/**
 * Unit tests for the gamification handler — personal best check
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

describe('gamification handler — checkPersonalBest', () => {
  beforeEach(() => {
    vi.resetModules()
    mockGraphql.mockReset()
    process.env.API_ENDPOINT = 'http://localhost/graphql'
    process.env.AWS_REGION = 'us-east-1'
  })

  it('should create a new PB record on first attempt', async () => {
    // No existing PBs
    mockGraphql
      .mockResolvedValueOnce({
        data: { listStudentPersonalBestByStudentId: { items: [] } },
      })
      // Create PB
      .mockResolvedValueOnce({
        data: {
          createStudentPersonalBest: {
            id: 'pb1',
            studentId: 'student-1',
            unitID: 'unit-1',
            bestScore: 85,
            achievedAt: '2026-04-26T10:00:00Z',
            _version: 1,
          },
        },
      })

    const { handler } = await import('../gamification/handler')
    const result = await handler(
      {
        fieldName: 'checkPersonalBest',
        arguments: { studentId: 'student-1', unitID: 'unit-1', score: 85 },
      },
      {} as any,
      vi.fn(),
    )

    expect(result.isNewBest).toBe(true)
    expect(result.firstAttempt).toBe(true)
    expect(result.bestScore).toBe(85)
    expect(result.previousBest).toBeNull()
  })

  it('should update PB when score is higher', async () => {
    // Existing PB of 80
    mockGraphql
      .mockResolvedValueOnce({
        data: {
          listStudentPersonalBestByStudentId: {
            items: [{
              id: 'pb1',
              studentId: 'student-1',
              unitID: 'unit-1',
              bestScore: 80,
              achievedAt: '2026-04-20T10:00:00Z',
              previousBest: null,
              _version: 1,
            }],
          },
        },
      })
      // Update PB
      .mockResolvedValueOnce({
        data: {
          updateStudentPersonalBest: {
            id: 'pb1',
            bestScore: 92,
            previousBest: 80,
            _version: 2,
          },
        },
      })
      // Award PERSONAL_BEST XP — check for existing logs
      .mockResolvedValueOnce({
        data: { listStudentXPLogByStudentId: { items: [] } },
      })
      // Create XP log
      .mockResolvedValueOnce({
        data: { createStudentXPLog: { id: 'xp1', xpAmount: 25 } },
      })
      // Fetch updated logs for total
      .mockResolvedValueOnce({
        data: { listStudentXPLogByStudentId: { items: [{ id: 'xp1', xpAmount: 25 }] } },
      })
      // Auto badge check
      .mockResolvedValueOnce({
        data: { listStudentXPLogByStudentId: { items: [{ id: 'xp1', xpAmount: 25, reason: 'PERSONAL_BEST' }] } },
      })
      .mockResolvedValueOnce({
        data: { listStudentBadgeByStudentId: { items: [] } },
      })

    const { handler } = await import('../gamification/handler')
    const result = await handler(
      {
        fieldName: 'checkPersonalBest',
        arguments: { studentId: 'student-1', unitID: 'unit-1', score: 92 },
      },
      {} as any,
      vi.fn(),
    )

    expect(result.isNewBest).toBe(true)
    expect(result.firstAttempt).toBe(false)
    expect(result.bestScore).toBe(92)
    expect(result.previousBest).toBe(80)
  })

  it('should not update when score is lower than PB', async () => {
    mockGraphql
      .mockResolvedValueOnce({
        data: {
          listStudentPersonalBestByStudentId: {
            items: [{
              id: 'pb1',
              studentId: 'student-1',
              unitID: 'unit-1',
              bestScore: 90,
              previousBest: 85,
              _version: 1,
            }],
          },
        },
      })

    const { handler } = await import('../gamification/handler')
    const result = await handler(
      {
        fieldName: 'checkPersonalBest',
        arguments: { studentId: 'student-1', unitID: 'unit-1', score: 75 },
      },
      {} as any,
      vi.fn(),
    )

    expect(result.isNewBest).toBe(false)
    expect(result.bestScore).toBe(90)
  })

  it('should not update when score equals PB', async () => {
    mockGraphql
      .mockResolvedValueOnce({
        data: {
          listStudentPersonalBestByStudentId: {
            items: [{
              id: 'pb1',
              studentId: 'student-1',
              unitID: 'unit-1',
              bestScore: 90,
              previousBest: 80,
              _version: 1,
            }],
          },
        },
      })

    const { handler } = await import('../gamification/handler')
    const result = await handler(
      {
        fieldName: 'checkPersonalBest',
        arguments: { studentId: 'student-1', unitID: 'unit-1', score: 90 },
      },
      {} as any,
      vi.fn(),
    )

    expect(result.isNewBest).toBe(false)
    expect(result.bestScore).toBe(90)
  })
})
