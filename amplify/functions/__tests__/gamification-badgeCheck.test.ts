/**
 * Unit tests for the gamification handler — badge check operations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('aws-amplify', () => ({
  Amplify: { configure: vi.fn() },
}))

// Mock AWS SDK credential provider to prevent IMDS timeout in tests
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

describe('gamification handler — checkBadges', () => {
  beforeEach(() => {
    vi.resetModules()
    mockGraphql.mockReset()
    process.env.API_ENDPOINT = 'http://localhost/graphql'
    process.env.AWS_REGION = 'us-east-1'
  })

  it('should award FIRST_SUBMISSION badge when student has a submission', async () => {
    // XP logs: one HOMEWORK_SUBMITTED
    mockGraphql
      .mockResolvedValueOnce({
        data: {
          listStudentXPLogByStudentId: {
            items: [{ id: 'xp1', xpAmount: 50, reason: 'HOMEWORK_SUBMITTED' }],
          },
        },
      })
      // Existing badges: none
      .mockResolvedValueOnce({
        data: { listStudentBadgeByStudentId: { items: [] } },
      })
      // Create badge
      .mockResolvedValueOnce({
        data: { createStudentBadge: { id: 'b1', badgeType: 'FIRST_SUBMISSION' } },
      })

    const { handler } = await import('../gamification/handler')
    const result = await handler(
      { fieldName: 'checkBadges', arguments: { studentId: 's1' } },
      {} as any,
      vi.fn(),
    )

    expect(result.newBadges).toContain('FIRST_SUBMISSION')
    expect(result.totalBadges).toBe(1)
  })

  it('should not re-award existing badges', async () => {
    mockGraphql
      .mockResolvedValueOnce({
        data: {
          listStudentXPLogByStudentId: {
            items: [{ id: 'xp1', xpAmount: 50, reason: 'HOMEWORK_SUBMITTED' }],
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          listStudentBadgeByStudentId: {
            items: [{ id: 'b1', badgeType: 'FIRST_SUBMISSION', awardedAt: '2025-01-01' }],
          },
        },
      })

    const { handler } = await import('../gamification/handler')
    const result = await handler(
      { fieldName: 'checkBadges', arguments: { studentId: 's1' } },
      {} as any,
      vi.fn(),
    )

    expect(result.newBadges).toEqual([])
    expect(result.totalBadges).toBe(1)
  })

  it('should award CONSISTENT badge for 7-day streak XP log', async () => {
    mockGraphql
      .mockResolvedValueOnce({
        data: {
          listStudentXPLogByStudentId: {
            items: [
              { id: 'xp1', xpAmount: 50, reason: 'HOMEWORK_SUBMITTED' },
              { id: 'xp2', xpAmount: 150, reason: 'STREAK_7DAY' },
            ],
          },
        },
      })
      .mockResolvedValueOnce({
        data: { listStudentBadgeByStudentId: { items: [] } },
      })
      // Two badge creates: FIRST_SUBMISSION and CONSISTENT
      .mockResolvedValue({
        data: { createStudentBadge: { id: 'b-new' } },
      })

    const { handler } = await import('../gamification/handler')
    const result = await handler(
      { fieldName: 'checkBadges', arguments: { studentId: 's1' } },
      {} as any,
      vi.fn(),
    )

    expect(result.newBadges).toContain('CONSISTENT')
    expect(result.newBadges).toContain('FIRST_SUBMISSION')
  })
})
