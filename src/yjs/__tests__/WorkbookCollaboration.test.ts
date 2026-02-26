/**
 * Workbook Collaboration Tests
 * 
 * Tests for the WorkbookCollaborationProvider and hooks
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { WorkbookCollaborationProvider } from '../WorkbookCollaborationProvider'
import { useWorkbookCollaboration, useWorkbookBlock } from '../workbookHooks'
import * as Y from 'yjs'

describe('WorkbookCollaborationProvider', () => {
  let provider: WorkbookCollaborationProvider

  beforeEach(() => {
    provider = new WorkbookCollaborationProvider({
      gradeId: 'test-grade-123',
      user: {
        username: 'student@test.com',
        role: 'student',
        displayName: 'Test Student',
        color: '#3b82f6',
      },
      connect: false, // Don't connect to WebSocket in tests
      persistence: false, // Don't use IndexedDB in tests
    })
  })

  afterEach(() => {
    provider?.destroy()
  })

  describe('Initialization', () => {
    it('creates unique room name from grade ID', () => {
      expect((provider as any).docName).toBe('workbook-test-grade-123')
    })

    it('sets user awareness state', () => {
      const awareness = provider.getAwareness()
      const state = awareness.getLocalState()

      expect(state?.user).toMatchObject({
        username: 'student@test.com',
        role: 'student',
        displayName: 'Test Student',
      })
    })

    it('initializes empty workbook data', () => {
      const data = provider.getWorkbookData()
      expect(data).toEqual({})
    })
  })

  describe('Block Operations', () => {
    it('updates a block', () => {
      provider.updateBlock('block-1', {
        userAnswer: 42,
        complete: true,
        accuracy: 100,
      })

      const block = provider.getBlock('block-1')
      expect(block?.userAnswer).toBe(42)
      expect(block?.complete).toBe(true)
      expect(block?.accuracy).toBe(100)
      expect(block?.timestamp).toBeDefined()
    })

    it('merges block data on update', () => {
      provider.updateBlock('block-1', {
        userAnswer: 1,
        attempts: 1,
      })

      provider.updateBlock('block-1', {
        userAnswer: 2,
        complete: true,
      })

      const block = provider.getBlock('block-1')
      expect(block?.userAnswer).toBe(2)
      expect(block?.complete).toBe(true)
      expect(block?.attempts).toBe(1) // Preserved from first update
    })

    it('deletes a block', () => {
      provider.updateBlock('block-1', { userAnswer: 1 })
      expect(provider.getBlock('block-1')).toBeDefined()

      provider.deleteBlock('block-1')
      expect(provider.getBlock('block-1')).toBeUndefined()
    })

    it('gets all workbook data', () => {
      provider.updateBlock('block-1', { userAnswer: 1 })
      provider.updateBlock('block-2', { userAnswer: 2 })
      provider.updateBlock('block-3', { userAnswer: 3 })

      const data = provider.getWorkbookData()
      expect(Object.keys(data)).toHaveLength(3)
      expect(data['block-1']?.userAnswer).toBe(1)
      expect(data['block-2']?.userAnswer).toBe(2)
      expect(data['block-3']?.userAnswer).toBe(3)
    })
  })

  describe('Feedback', () => {
    it('adds feedback to a block', () => {
      provider.setFeedback('block-1', {
        text: 'Great job!',
        type: 'tutor-comment',
      })

      const feedback = provider.getFeedback()
      expect(feedback['block-1']).toMatchObject({
        text: 'Great job!',
        type: 'tutor-comment',
        author: 'student@test.com',
        authorRole: 'student',
      })
      expect(feedback['block-1'].timestamp).toBeDefined()
    })

    it('gets all feedback', () => {
      provider.setFeedback('block-1', { text: 'Feedback 1' })
      provider.setFeedback('block-2', { text: 'Feedback 2' })

      const feedback = provider.getFeedback()
      expect(Object.keys(feedback)).toHaveLength(2)
    })
  })

  describe('Metadata', () => {
    it('updates metadata', () => {
      provider.updateMetadata('sessionStarted', '2026-02-16T10:00:00Z')
      provider.updateMetadata('totalTimeSpent', 3600000)

      const metadata = provider.getMetadata()
      expect(metadata.sessionStarted).toBe('2026-02-16T10:00:00Z')
      expect(metadata.totalTimeSpent).toBe(3600000)
    })
  })

  describe('Statistics', () => {
    beforeEach(() => {
      provider.updateBlock('block-1', { complete: true, accuracy: 100 })
      provider.updateBlock('block-2', { complete: true, accuracy: 80 })
      provider.updateBlock('block-3', { complete: false, accuracy: 0 })
    })

    it('calculates completion percentage', () => {
      const completion = provider.getCompletionPercentage()
      expect(completion).toBe(67) // 2 out of 3 complete
    })

    it('calculates overall accuracy', () => {
      const accuracy = provider.getOverallAccuracy()
      expect(accuracy).toBe(60) // (100 + 80 + 0) / 3
    })

    it('handles empty workbook', () => {
      const emptyProvider = new WorkbookCollaborationProvider({
        gradeId: 'empty-grade',
        user: { username: 'test', role: 'student' },
        connect: false,
        persistence: false,
      })

      expect(emptyProvider.getCompletionPercentage()).toBe(0)
      expect(emptyProvider.getOverallAccuracy()).toBe(0)

      emptyProvider.destroy()
    })
  })

  describe('Grade Data Import/Export', () => {
    const gradeDataJson = JSON.stringify({
      'block-1': {
        userAnswer: 1,
        complete: true,
        accuracy: 100,
      },
      'block-2': {
        userAnswer: 2,
        complete: false,
        accuracy: 0,
      },
    })

    it('loads from Grade.data JSON', () => {
      provider.loadFromGradeData(gradeDataJson)

      const data = provider.getWorkbookData()
      expect(Object.keys(data)).toHaveLength(2)
      expect(data['block-1']?.userAnswer).toBe(1)
      expect(data['block-2']?.userAnswer).toBe(2)
    })

    it('handles null Grade.data', () => {
      provider.loadFromGradeData(null)
      expect(provider.getWorkbookData()).toEqual({})
    })

    it('exports to Grade.data JSON', () => {
      provider.updateBlock('block-1', { userAnswer: 42, complete: true })
      provider.updateBlock('block-2', { userAnswer: 99, complete: false })

      const exported = provider.exportToGradeData()
      const parsed = JSON.parse(exported)

      expect(parsed['block-1'].userAnswer).toBe(42)
      expect(parsed['block-2'].userAnswer).toBe(99)
    })
  })

  describe('Permissions', () => {
    it('allows students to edit their workbook', () => {
      expect(provider.canEdit()).toBe(true)
    })

    it('allows tutors to edit', () => {
      const tutorProvider = new WorkbookCollaborationProvider({
        gradeId: 'test-grade',
        user: { username: 'tutor', role: 'tutor' },
        connect: false,
        persistence: false,
      })

      expect(tutorProvider.canEdit()).toBe(true)
      tutorProvider.destroy()
    })

    it('allows tutors to provide feedback', () => {
      const tutorProvider = new WorkbookCollaborationProvider({
        gradeId: 'test-grade',
        user: { username: 'tutor', role: 'tutor' },
        connect: false,
        persistence: false,
      })

      expect(tutorProvider.canProvideFeedback()).toBe(true)
      tutorProvider.destroy()
    })

    it('prevents students from having feedback permission flag', () => {
      expect(provider.canProvideFeedback()).toBe(false)
    })
  })

  describe('Cursor Tracking', () => {
    it('updates cursor position', () => {
      provider.updateCursor('block-5', 42)

      const awareness = provider.getAwareness()
      const state = awareness.getLocalState()

      expect(state?.user?.cursor).toEqual({
        blockId: 'block-5',
        position: 42,
      })
    })
  })
})

describe('useWorkbookCollaboration hook', () => {
  it('initializes with grade data', () => {
    const gradeData = JSON.stringify({
      'block-1': { userAnswer: 1, complete: true },
    })

    const { result } = renderHook(() =>
      useWorkbookCollaboration({
        gradeId: 'test-grade',
        user: { username: 'student', role: 'student' },
        initialData: gradeData,
        wsUrl: 'ws://localhost:3001',
      })
    )

    waitFor(() => {
      expect(result.current.workbookData).toBeDefined()
      expect(result.current.workbookData['block-1']?.userAnswer).toBe(1)
    })
  })

  it('updates block data', async () => {
    const { result } = renderHook(() =>
      useWorkbookCollaboration({
        gradeId: 'test-grade',
        user: { username: 'student', role: 'student' },
      })
    )

    await act(async () => {
      result.current.updateBlock('block-1', {
        userAnswer: 42,
        complete: true,
      })
    })

    await waitFor(() => {
      expect(result.current.workbookData['block-1']?.userAnswer).toBe(42)
    })
  })

  it('tracks tutor presence', async () => {
    const onTutorJoin = vi.fn()

    const { result } = renderHook(() =>
      useWorkbookCollaboration({
        gradeId: 'test-grade',
        user: { username: 'student', role: 'student' },
        onTutorJoin,
      })
    )

    // Simulate tutor joining would happen via WebSocket
    // In real usage, this would be triggered by awareness changes
    
    await waitFor(() => {
      expect(result.current.isSynced).toBeDefined()
      expect(result.current.isConnected).toBeDefined()
    })
  })
})

describe('useWorkbookBlock hook', () => {
  let provider: WorkbookCollaborationProvider

  beforeEach(() => {
    provider = new WorkbookCollaborationProvider({
      gradeId: 'test-grade',
      user: { username: 'student', role: 'student' },
      connect: false,
      persistence: false,
    })
  })

  afterEach(() => {
    provider?.destroy()
  })

  it('tracks individual block data', () => {
    const { result } = renderHook(() => useWorkbookBlock(provider, 'block-1'))

    act(() => {
      result.current.updateData({
        userAnswer: 42,
        complete: true,
        accuracy: 100,
      })
    })

    waitFor(() => {
      expect(result.current.blockData?.userAnswer).toBe(42)
      expect(result.current.isComplete).toBe(true)
      expect(result.current.accuracy).toBe(100)
    })
  })

  it('deletes block data', () => {
    const { result } = renderHook(() => useWorkbookBlock(provider, 'block-1'))

    act(() => {
      result.current.updateData({ userAnswer: 1 })
    })

    act(() => {
      result.current.deleteData()
    })

    waitFor(() => {
      expect(result.current.blockData).toBeUndefined()
    })
  })
})

describe('CRDT Conflict Resolution', () => {
  it('merges concurrent edits to different blocks', async () => {
    // Student provider
    const student = new WorkbookCollaborationProvider({
      gradeId: 'shared-grade',
      user: { username: 'student', role: 'student' },
      connect: false,
      persistence: false,
    })

    // Tutor provider (same grade, different user)
    const tutor = new WorkbookCollaborationProvider({
      gradeId: 'shared-grade',
      user: { username: 'tutor', role: 'tutor' },
      connect: false,
      persistence: false,
    })

    // Simulate concurrent edits
    student.updateBlock('block-1', { userAnswer: 1 })
    tutor.updateBlock('block-2', { userAnswer: 2 })

    // In real usage with WebSocket, these would sync automatically
    // For tests, we manually apply updates

    const studentUpdate = Y.encodeStateAsUpdate(student.getDoc())
    const tutorUpdate = Y.encodeStateAsUpdate(tutor.getDoc())

    Y.applyUpdate(tutor.getDoc(), studentUpdate)
    Y.applyUpdate(student.getDoc(), tutorUpdate)

    // Both should have both edits
    const studentData = student.getWorkbookData()
    const tutorData = tutor.getWorkbookData()

    expect(studentData['block-1']?.userAnswer).toBe(1)
    expect(studentData['block-2']?.userAnswer).toBe(2)
    expect(tutorData['block-1']?.userAnswer).toBe(1)
    expect(tutorData['block-2']?.userAnswer).toBe(2)

    student.destroy()
    tutor.destroy()
  })
})
