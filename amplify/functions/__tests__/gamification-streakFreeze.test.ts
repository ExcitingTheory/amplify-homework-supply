/**
 * Unit tests for the gamification handler — streak freeze/comeback logic
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

describe('gamification handler — updateStreak (freeze/comeback)', () => {
  beforeEach(() => {
    vi.resetModules()
    mockGraphql.mockReset()
    process.env.API_ENDPOINT = 'http://localhost/graphql'
    process.env.AWS_REGION = 'us-east-1'
  })

  it('should create a new streak with freezesRemaining=0 for first activity', async () => {
    // No existing streak
    mockGraphql
      .mockResolvedValueOnce({
        data: { listStudentStreakByStudentId: { items: [] } },
      })
      // Create streak
      .mockResolvedValueOnce({
        data: {
          createStudentStreak: {
            id: 's1',
            studentId: 'student-1',
            currentStreak: 1,
            longestStreak: 1,
            lastActivityDate: '2026-04-26',
            freezesRemaining: 0,
            freezesUsed: 0,
            _version: 1,
          },
        },
      })

    const { handler } = await import('../gamification/handler')
    const result = await handler(
      { fieldName: 'updateStreak', arguments: { studentId: 'student-1' } },
      {} as any,
      vi.fn(),
    )

    expect(result.currentStreak).toBe(1)
    expect(result.freezesRemaining).toBe(0)
  })

  it('should use a freeze when student missed exactly 1 day', async () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 2) // 2 days ago
    const lastActivityDate = yesterday.toISOString().split('T')[0]

    mockGraphql
      .mockResolvedValueOnce({
        data: {
          listStudentStreakByStudentId: {
            items: [{
              id: 's1',
              studentId: 'student-1',
              currentStreak: 5,
              longestStreak: 5,
              lastActivityDate,
              freezesRemaining: 1,
              freezesUsed: 0,
              _version: 1,
            }],
          },
        },
      })
      // Update streak
      .mockResolvedValueOnce({
        data: {
          updateStudentStreak: {
            id: 's1',
            currentStreak: 6,
            longestStreak: 6,
            freezesRemaining: 0,
            freezesUsed: 1,
            _version: 2,
          },
        },
      })

    const { handler } = await import('../gamification/handler')
    const result = await handler(
      { fieldName: 'updateStreak', arguments: { studentId: 'student-1' } },
      {} as any,
      vi.fn(),
    )

    expect(result.freezeUsed).toBe(true)
  })

  it('should break the streak when missed 2+ days without freeze', async () => {
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    const lastActivityDate = threeDaysAgo.toISOString().split('T')[0]

    mockGraphql
      .mockResolvedValueOnce({
        data: {
          listStudentStreakByStudentId: {
            items: [{
              id: 's1',
              studentId: 'student-1',
              currentStreak: 10,
              longestStreak: 10,
              lastActivityDate,
              freezesRemaining: 0,
              freezesUsed: 0,
              _version: 1,
            }],
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          updateStudentStreak: {
            id: 's1',
            currentStreak: 1,
            longestStreak: 10,
            freezesRemaining: 0,
            freezesUsed: 0,
            _version: 2,
          },
        },
      })

    const { handler } = await import('../gamification/handler')
    const result = await handler(
      { fieldName: 'updateStreak', arguments: { studentId: 'student-1' } },
      {} as any,
      vi.fn(),
    )

    expect(result.currentStreak).toBe(1)
    expect(result.longestStreak).toBe(10)
  })

  it('should trigger comeback when returning after 7+ days', async () => {
    const tenDaysAgo = new Date()
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10)
    const lastActivityDate = tenDaysAgo.toISOString().split('T')[0]

    mockGraphql
      .mockResolvedValueOnce({
        data: {
          listStudentStreakByStudentId: {
            items: [{
              id: 's1',
              studentId: 'student-1',
              currentStreak: 5,
              longestStreak: 12,
              lastActivityDate,
              freezesRemaining: 0,
              freezesUsed: 0,
              _version: 1,
            }],
          },
        },
      })
      // Update streak
      .mockResolvedValueOnce({
        data: {
          updateStudentStreak: {
            id: 's1',
            currentStreak: 1,
            longestStreak: 12,
            freezesRemaining: 0,
            freezesUsed: 0,
            _version: 2,
          },
        },
      })
      // Comeback XP - check for existing logs (dedup)
      .mockResolvedValueOnce({
        data: { listStudentXPLogByStudentId: { items: [] } },
      })
      // Create comeback XP log
      .mockResolvedValueOnce({
        data: { createStudentXPLog: { id: 'xp1', xpAmount: 50, reason: 'COMEBACK' } },
      })
      // Fetch updated logs for total
      .mockResolvedValueOnce({
        data: { listStudentXPLogByStudentId: { items: [{ id: 'xp1', xpAmount: 50 }] } },
      })
      // Auto-checkBadges after awardXP
      .mockResolvedValueOnce({
        data: { listStudentXPLogByStudentId: { items: [{ id: 'xp1', xpAmount: 50, reason: 'COMEBACK' }] } },
      })
      .mockResolvedValueOnce({
        data: { listStudentBadgeByStudentId: { items: [] } },
      })
      .mockResolvedValueOnce({
        data: { createStudentBadge: { id: 'b1', badgeType: 'COMEBACK_KID' } },
      })

    const { handler } = await import('../gamification/handler')
    const result = await handler(
      { fieldName: 'updateStreak', arguments: { studentId: 'student-1' } },
      {} as any,
      vi.fn(),
    )

    expect(result.comebackTriggered).toBe(true)
    expect(result.currentStreak).toBe(1)
  })

  it('should award a freeze at 7-day milestone', async () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const lastActivityDate = yesterday.toISOString().split('T')[0]

    mockGraphql
      .mockResolvedValueOnce({
        data: {
          listStudentStreakByStudentId: {
            items: [{
              id: 's1',
              studentId: 'student-1',
              currentStreak: 6, // Will become 7
              longestStreak: 6,
              lastActivityDate,
              freezesRemaining: 0,
              freezesUsed: 0,
              _version: 1,
            }],
          },
        },
      })
      // Update streak (streak=7 so +1 freeze)
      .mockResolvedValueOnce({
        data: {
          updateStudentStreak: {
            id: 's1',
            currentStreak: 7,
            longestStreak: 7,
            freezesRemaining: 1,
            freezesUsed: 0,
            _version: 2,
          },
        },
      })
      // STREAK_7DAY XP award chain
      .mockResolvedValueOnce({
        data: { listStudentXPLogByStudentId: { items: [] } },
      })
      .mockResolvedValueOnce({
        data: { createStudentXPLog: { id: 'xp1', xpAmount: 75, reason: 'STREAK_7DAY' } },
      })
      .mockResolvedValueOnce({
        data: { listStudentXPLogByStudentId: { items: [{ id: 'xp1', xpAmount: 75 }] } },
      })
      // Auto badge check
      .mockResolvedValueOnce({
        data: { listStudentXPLogByStudentId: { items: [{ id: 'xp1', xpAmount: 75, reason: 'STREAK_7DAY' }] } },
      })
      .mockResolvedValueOnce({
        data: { listStudentBadgeByStudentId: { items: [] } },
      })
      .mockResolvedValueOnce({
        data: { createStudentBadge: { id: 'b1', badgeType: 'CONSISTENT' } },
      })

    const { handler } = await import('../gamification/handler')
    const result = await handler(
      { fieldName: 'updateStreak', arguments: { studentId: 'student-1' } },
      {} as any,
      vi.fn(),
    )

    // The update input should have had freezesRemaining: 1
    const updateCall = mockGraphql.mock.calls.find(
      (call: any) => call[0]?.query?.includes('updateStudentStreak'),
    )
    expect(updateCall).toBeDefined()
    const input = updateCall?.[0]?.variables?.input
    expect(input?.freezesRemaining).toBe(1)
    expect(input?.currentStreak).toBe(7)
  })
})
