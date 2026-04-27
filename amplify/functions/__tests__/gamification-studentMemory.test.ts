/**
 * Unit tests for the gamification handler — student memory operations
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

describe('gamification handler — upsertStudentMemory', () => {
  beforeEach(() => {
    vi.resetModules()
    mockGraphql.mockReset()
    process.env.API_ENDPOINT = 'http://localhost/graphql'
    process.env.AWS_REGION = 'us-east-1'
  })

  it('should create memory if none exists', async () => {
    // No existing memory
    mockGraphql
      .mockResolvedValueOnce({
        data: { listStudentMemoryByStudentId: { items: [] } },
      })
      // Create new memory
      .mockResolvedValueOnce({
        data: {
          createStudentMemory: {
            id: 'mem1',
            studentId: 's1',
            memoryMarkdown: '## Feedback\n- Good work on vocabulary.',
          },
        },
      })

    const { handler } = await import('../gamification/handler')
    const result = await handler(
      {
        fieldName: 'upsertStudentMemory',
        arguments: {
          studentId: 's1',
          feedbackMarkdown: '- Good work on vocabulary.',
          source: 'ai-feedback',
        },
      },
      {} as any,
      vi.fn(),
    )

    expect(result).toBeDefined()
    expect(mockGraphql).toHaveBeenCalledTimes(2)
  })

  it('should append to existing memory', async () => {
    mockGraphql
      .mockResolvedValueOnce({
        data: {
          listStudentMemoryByStudentId: {
            items: [
              {
                id: 'mem1',
                studentId: 's1',
                memoryMarkdown: '## Feedback\n- Old note',
                version: 1,
                _version: 1,
              },
            ],
          },
        },
      })
      // Update memory
      .mockResolvedValueOnce({
        data: {
          updateStudentMemory: {
            id: 'mem1',
            memoryMarkdown: '## Feedback\n- Old note\n- New feedback',
            version: 2,
          },
        },
      })

    const { handler } = await import('../gamification/handler')
    const result = await handler(
      {
        fieldName: 'upsertStudentMemory',
        arguments: {
          studentId: 's1',
          feedbackMarkdown: '- New feedback',
          source: 'ai-feedback',
        },
      },
      {} as any,
      vi.fn(),
    )

    expect(result).toBeDefined()
  })
})
