/**
 * Unit tests for the gamification handler — progress recompute
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

describe('gamification handler — recomputeProgress', () => {
  beforeEach(() => {
    vi.resetModules()
    mockGraphql.mockReset()
    process.env.API_ENDPOINT = 'http://localhost/graphql'
    process.env.AWS_REGION = 'us-east-1'
  })

  it('should create progress record when none exists', async () => {
    // Grades for the module/section
    mockGraphql
      .mockResolvedValueOnce({
        data: {
          listGradeBySectionID: {
            items: [
              { id: 'g1', owner: 'student-1', sectionID: 'sec1', complete: true, accuracy: 90, _version: 1 },
              { id: 'g2', owner: 'student-1', sectionID: 'sec1', complete: true, accuracy: 85, _version: 1 },
              { id: 'g3', owner: 'student-1', sectionID: 'sec1', complete: false, accuracy: 0, _version: 1 },
              { id: 'g4', owner: 'student-2', sectionID: 'sec1', complete: true, accuracy: 88, _version: 1 },
            ],
          },
        },
      })
      // No existing progress records
      .mockResolvedValueOnce({
        data: { listStudentProgressByStudentId: { items: [] } },
      })
      // Create progress
      .mockResolvedValueOnce({
        data: {
          createStudentProgress: {
            id: 'p1',
            studentId: 'student-1',
            moduleId: 'sec1',
            completionPercent: 67,
            totalWorkbooks: 3,
            completedWorkbooks: 2,
            _version: 1,
          },
        },
      })

    const { handler } = await import('../gamification/handler')
    const result = await handler(
      {
        fieldName: 'recomputeProgress',
        arguments: { studentId: 'student-1', moduleId: 'sec1' },
      },
      {} as any,
      vi.fn(),
    )

    expect(result.created).toBe(true)
    expect(result.completedWorkbooks).toBe(2)
    expect(result.completionPercent).toBe(67)
  })

  it('should update existing progress record', async () => {
    mockGraphql
      .mockResolvedValueOnce({
        data: {
          listGradeBySectionID: {
            items: [
              { id: 'g1', owner: 'student-1', sectionID: 'sec1', complete: true, accuracy: 90, _version: 1 },
              { id: 'g2', owner: 'student-1', sectionID: 'sec1', complete: true, accuracy: 85, _version: 1 },
            ],
          },
        },
      })
      // Existing progress
      .mockResolvedValueOnce({
        data: {
          listStudentProgressByStudentId: {
            items: [{
              id: 'p1',
              studentId: 'student-1',
              moduleId: 'sec1',
              completionPercent: 50,
              totalWorkbooks: 2,
              completedWorkbooks: 1,
              _version: 1,
            }],
          },
        },
      })
      // Update
      .mockResolvedValueOnce({
        data: {
          updateStudentProgress: {
            id: 'p1',
            completionPercent: 100,
            totalWorkbooks: 2,
            completedWorkbooks: 2,
            _version: 2,
          },
        },
      })

    const { handler } = await import('../gamification/handler')
    const result = await handler(
      {
        fieldName: 'recomputeProgress',
        arguments: { studentId: 'student-1', moduleId: 'sec1' },
      },
      {} as any,
      vi.fn(),
    )

    expect(result.updated).toBe(true)
    expect(result.completionPercent).toBe(100)
    expect(result.completedWorkbooks).toBe(2)
  })

  it('should handle zero grades gracefully', async () => {
    mockGraphql
      .mockResolvedValueOnce({
        data: { listGradeBySectionID: { items: [] } },
      })
      .mockResolvedValueOnce({
        data: { listStudentProgressByStudentId: { items: [] } },
      })
      .mockResolvedValueOnce({
        data: {
          createStudentProgress: {
            id: 'p1',
            studentId: 'student-1',
            moduleId: 'sec1',
            completionPercent: 0,
            totalWorkbooks: 0,
            completedWorkbooks: 0,
            _version: 1,
          },
        },
      })

    const { handler } = await import('../gamification/handler')
    const result = await handler(
      {
        fieldName: 'recomputeProgress',
        arguments: { studentId: 'student-1', moduleId: 'sec1' },
      },
      {} as any,
      vi.fn(),
    )

    expect(result.created).toBe(true)
    expect(result.completionPercent).toBe(0)
  })
})
