/**
 * Unit tests for the gamification handler — XP award operations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock Amplify
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

describe('gamification handler — awardXP', () => {
  beforeEach(() => {
    vi.resetModules()
    mockGraphql.mockReset()
    process.env.API_ENDPOINT = 'http://localhost/graphql'
    process.env.AWS_REGION = 'us-east-1'
  })

  it('should export a handler function', async () => {
    const { handler } = await import('../gamification/handler')
    expect(handler).toBeDefined()
    expect(typeof handler).toBe('function')
  })

  it('should throw on unknown operation', async () => {
    const { handler } = await import('../gamification/handler')
    await expect(
      handler({ fieldName: 'unknownOp', arguments: {} }, {} as any, vi.fn()),
    ).rejects.toThrow('Unknown operation: unknownOp')
  })

  it('should reject invalid XP reason', async () => {
    const { handler } = await import('../gamification/handler')
    await expect(
      handler(
        { fieldName: 'awardXP', arguments: { studentId: 's1', reason: 'INVALID' }, identity: {} },
        {} as any,
        vi.fn(),
      ),
    ).rejects.toThrow('Invalid XP reason')
  })

  it('should award XP and return total', async () => {
    // First call: no existing logs (for duplicate check)
    mockGraphql
      .mockResolvedValueOnce({
        data: { listStudentXPLogByStudentId: { items: [] } },
      })
      // Create XP log
      .mockResolvedValueOnce({
        data: { createStudentXPLog: { id: 'xp1', xpAmount: 50 } },
      })
      // Fetch all logs for total
      .mockResolvedValueOnce({
        data: {
          listStudentXPLogByStudentId: {
            items: [{ id: 'xp1', xpAmount: 50, reason: 'HOMEWORK_SUBMITTED' }],
          },
        },
      })

    const { handler } = await import('../gamification/handler')
    const result = await handler(
      {
        fieldName: 'awardXP',
        arguments: { studentId: 's1', reason: 'HOMEWORK_SUBMITTED', referenceId: 'grade-1' },
        identity: { sub: 's1' },
      },
      {} as any,
      vi.fn(),
    )

    expect(result.alreadyAwarded).toBe(false)
    expect(result.xpAmount).toBe(50)
    expect(result.totalXP).toBe(50)
  })

  it('should prevent duplicate XP for same referenceId', async () => {
    mockGraphql.mockResolvedValueOnce({
      data: {
        listStudentXPLogByStudentId: {
          items: [
            { id: 'xp1', xpAmount: 50, reason: 'HOMEWORK_SUBMITTED', referenceId: 'grade-1' },
          ],
        },
      },
    })

    const { handler } = await import('../gamification/handler')
    const result = await handler(
      {
        fieldName: 'awardXP',
        arguments: { studentId: 's1', reason: 'HOMEWORK_SUBMITTED', referenceId: 'grade-1' },
        identity: { sub: 's1' },
      },
      {} as any,
      vi.fn(),
    )

    expect(result.alreadyAwarded).toBe(true)
    expect(result.xpAmount).toBe(0)
  })
})
