/**
 * Unit tests for the peer review AI handler
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('aws-amplify', () => ({
  Amplify: { configure: vi.fn() },
}))

const mockGraphql = vi.fn()
vi.mock('aws-amplify/data', () => ({
  generateClient: () => ({ graphql: mockGraphql }),
}))

// Mock global fetch for OpenAI calls
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('peerReviewAI handler', () => {
  beforeEach(() => {
    vi.resetModules()
    mockGraphql.mockReset()
    mockFetch.mockReset()
    process.env.API_ENDPOINT = 'http://localhost/graphql'
    process.env.AWS_REGION = 'us-east-1'
    process.env.OPENAI_API_KEY = 'test-key'
  })

  it('should export a handler function', async () => {
    const { handler } = await import('../peerReviewAI/handler')
    expect(handler).toBeDefined()
    expect(typeof handler).toBe('function')
  })

  it('should throw on unknown fieldName', async () => {
    const { handler } = await import('../peerReviewAI/handler')
    await expect(
      handler({ fieldName: 'unknownOp', arguments: {} }, {} as any, vi.fn()),
    ).rejects.toThrow()
  })

  it('handleAIMention should fetch room context and call OpenAI', async () => {
    // GetHomeworkRoom
    mockGraphql
      .mockResolvedValueOnce({
        data: {
          getHomeworkRoom: {
            id: 'room1',
            gradeId: 'g1',
            ownerId: 'student-1',
            status: 'IN_PROGRESS',
            _version: 1,
          },
        },
      })
      // GetGrade
      .mockResolvedValueOnce({
        data: {
          getGrade: {
            id: 'g1',
            unitID: 'u1',
            data: '{}',
            accuracy: 80,
            complete: false,
            owner: 'student-1',
            _version: 1,
          },
        },
      })
      // GetUnit
      .mockResolvedValueOnce({
        data: {
          getUnit: {
            id: 'u1',
            name: 'Biology 101',
            description: 'Cell structure',
            data: '{}',
            _version: 1,
          },
        },
      })
      // GetStudentMemory
      .mockResolvedValueOnce({
        data: {
          listStudentMemoryByStudentId: {
            items: [{ id: 'mem1', studentId: 'student-1', memoryMarkdown: '## Notes', _version: 1 }],
          },
        },
      })

    // OpenAI response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'AI says: Great question about mitosis!' } }],
      }),
    })

    const { handler } = await import('../peerReviewAI/handler')
    const result = await handler(
      {
        fieldName: 'handleAIMention',
        arguments: { roomId: 'room1', message: 'What is mitosis?', chatHistory: '' },
      },
      {} as any,
      vi.fn(),
    )

    expect(result).toBeDefined()
    expect(mockFetch).toHaveBeenCalledTimes(1)
    // Verify OpenAI was called with correct endpoint
    expect(mockFetch.mock.calls[0][0]).toContain('openai.com')
  })

  it('generateReviewSummary should save summary to room', async () => {
    // GetHomeworkRoom
    mockGraphql
      .mockResolvedValueOnce({
        data: {
          getHomeworkRoom: {
            id: 'room1',
            gradeId: 'g1',
            ownerId: 'student-1',
            status: 'IN_PROGRESS',
            _version: 1,
          },
        },
      })
      // GetGrade
      .mockResolvedValueOnce({
        data: {
          getGrade: {
            id: 'g1',
            unitID: 'u1',
            data: '{}',
            accuracy: 90,
            complete: true,
            owner: 'student-1',
            _version: 1,
          },
        },
      })
      // UpdateHomeworkRoom with summary
      .mockResolvedValueOnce({
        data: {
          updateHomeworkRoom: {
            id: 'room1',
            status: 'REVIEW_COMPLETE',
            aiReviewSummary: 'Great peer review session.',
            _version: 2,
          },
        },
      })

    // OpenAI response for summary
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Great peer review session.' } }],
      }),
    })

    const { handler } = await import('../peerReviewAI/handler')
    const result = await handler(
      {
        fieldName: 'generateReviewSummary',
        arguments: { roomId: 'room1', chatLog: 'Student: looks good\nPeer: agree!' },
      },
      {} as any,
      vi.fn(),
    )

    expect(result).toBeDefined()
  })
})
