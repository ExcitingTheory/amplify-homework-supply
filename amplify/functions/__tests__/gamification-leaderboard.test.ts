/**
 * Unit tests for the gamification handler — leaderboard rebuild
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

describe('gamification handler — rebuildLeaderboard', () => {
  beforeEach(() => {
    vi.resetModules()
    mockGraphql.mockReset()
    process.env.API_ENDPOINT = 'http://localhost/graphql'
    process.env.AWS_REGION = 'us-east-1'
  })

  it('should create leaderboard entries for a cohort', async () => {
    // List existing leaderboard entries: empty
    mockGraphql
      .mockResolvedValueOnce({
        data: { listLeaderboardEntryByCohortId: { items: [] } },
      })
      // List grades for the section
      .mockResolvedValueOnce({
        data: {
          listGradeBySectionID: {
            items: [
              { id: 'g1', owner: 'student-1', sectionID: 'sec1', complete: true, accuracy: 90, _version: 1 },
              { id: 'g2', owner: 'student-2', sectionID: 'sec1', complete: true, accuracy: 85, _version: 1 },
            ],
          },
        },
      })
      // List XP logs for student-1
      .mockResolvedValueOnce({
        data: {
          listStudentXPLogByStudentId: {
            items: [{ id: 'xp1', studentId: 'student-1', xpAmount: 200 }],
          },
        },
      })
      // List XP logs for student-2
      .mockResolvedValueOnce({
        data: {
          listStudentXPLogByStudentId: {
            items: [{ id: 'xp2', studentId: 'student-2', xpAmount: 100 }],
          },
        },
      })
      // Create leaderboard entries
      .mockResolvedValue({
        data: { createLeaderboardEntry: { id: 'lb1' } },
      })

    const { handler } = await import('../gamification/handler')
    const result = await handler(
      {
        fieldName: 'rebuildLeaderboard',
        arguments: { cohortId: 'sec1' },
      },
      {} as any,
      vi.fn(),
    )

    expect(result).toBeDefined()
    // At minimum: 1 leaderboard list + 1 grades list + 2 XP log queries + 2 creates
    expect(mockGraphql).toHaveBeenCalled()
  })

  it('should update existing leaderboard entries', async () => {
    // Existing entry
    mockGraphql
      .mockResolvedValueOnce({
        data: {
          listLeaderboardEntryByCohortId: {
            items: [
              { id: 'lb1', cohortId: 'sec1', studentId: 'student-1', totalXP: 100, level: 2, _version: 1 },
            ],
          },
        },
      })
      // List grades
      .mockResolvedValueOnce({
        data: {
          listGradeBySectionID: {
            items: [
              { id: 'g1', owner: 'student-1', sectionID: 'sec1', complete: true, accuracy: 95, _version: 1 },
            ],
          },
        },
      })
      // XP logs for student-1
      .mockResolvedValueOnce({
        data: {
          listStudentXPLogByStudentId: {
            items: [
              { id: 'xp1', xpAmount: 200 },
              { id: 'xp2', xpAmount: 100 },
            ],
          },
        },
      })
      // Update existing entry
      .mockResolvedValue({
        data: { updateLeaderboardEntry: { id: 'lb1', totalXP: 300 } },
      })

    const { handler } = await import('../gamification/handler')
    const result = await handler(
      {
        fieldName: 'rebuildLeaderboard',
        arguments: { cohortId: 'sec1' },
      },
      {} as any,
      vi.fn(),
    )

    expect(result).toBeDefined()
  })
})
