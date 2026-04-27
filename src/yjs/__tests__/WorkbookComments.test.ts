/**
 * Workbook Comments Tests
 *
 * Tests the commentsMap Y.Map CRUD operations, the useWorkbookComments hook,
 * and multi-user comment sync via Y.Doc state exchange.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { WorkbookCollaborationProvider } from '../WorkbookCollaborationProvider'
import { useWorkbookComments } from '../workbookHooks'
import * as Y from 'yjs'

describe('Workbook Comments', () => {
  let provider: WorkbookCollaborationProvider

  beforeEach(() => {
    provider = new WorkbookCollaborationProvider({
      gradeId: 'test-grade-comments',
      user: {
        username: 'instructor@test.com',
        role: 'instructor',
        displayName: 'Test Instructor',
        color: '#ef4444',
      },
      connect: false,
      persistence: false,
    })
  })

  afterEach(() => {
    provider?.destroy()
  })

  describe('CommentThread CRUD', () => {
    it('adds a comment thread to the commentsMap', () => {
      const thread = provider.addComment('block-1', 'Great work on this section!')

      expect(thread.id).toBeDefined()
      expect(thread.blockId).toBe('block-1')
      expect(thread.text).toBe('Great work on this section!')
      expect(thread.author).toBe('instructor@test.com')
      expect(thread.authorRole).toBe('instructor')
      expect(thread.resolved).toBe(false)
      expect(thread.replies).toEqual([])
    })

    it('getComments returns all threads', () => {
      provider.addComment('block-1', 'Comment 1')
      provider.addComment('block-2', 'Comment 2')
      provider.addComment('block-1', 'Comment 3')

      const allComments = provider.getComments()
      expect(allComments).toHaveLength(3)
    })

    it('getComments filters by blockId', () => {
      provider.addComment('block-1', 'Comment 1')
      provider.addComment('block-2', 'Comment 2')
      provider.addComment('block-1', 'Comment 3')

      const block1Comments = provider.getComments('block-1')
      expect(block1Comments).toHaveLength(2)
      expect(block1Comments.every((c) => c.blockId === 'block-1')).toBe(true)
    })

    it('replyToComment adds a reply to a thread', () => {
      const thread = provider.addComment('block-1', 'Original comment')
      const threadKey = `block-1-${thread.id}`

      provider.replyToComment(threadKey, 'This is a reply')

      const updated = provider.getComments('block-1')
      const updatedThread = updated.find((t) => t.id === thread.id)!
      expect(updatedThread.replies).toHaveLength(1)
      expect(updatedThread.replies[0].text).toBe('This is a reply')
      expect(updatedThread.replies[0].author).toBe('instructor@test.com')
    })

    it('resolveThread sets resolved to true', () => {
      const thread = provider.addComment('block-1', 'Needs fixing')
      const threadKey = `block-1-${thread.id}`

      provider.resolveThread(threadKey, true)

      const comments = provider.getComments('block-1')
      const resolved = comments.find((t) => t.id === thread.id)!
      expect(resolved.resolved).toBe(true)
    })

    it('resolveThread can unresolved a thread', () => {
      const thread = provider.addComment('block-1', 'Comment')
      const threadKey = `block-1-${thread.id}`

      provider.resolveThread(threadKey, true)
      provider.resolveThread(threadKey, false)

      const comments = provider.getComments('block-1')
      expect(comments.find((t) => t.id === thread.id)!.resolved).toBe(false)
    })
  })

  describe('useWorkbookComments hook', () => {
    it('returns only threads for the specified block', () => {
      provider.addComment('block-1', 'Comment A')
      provider.addComment('block-2', 'Comment B')

      const { result } = renderHook(() => useWorkbookComments(provider, 'block-1'))

      expect(result.current.threads).toHaveLength(1)
      expect(result.current.threads[0].text).toBe('Comment A')
    })

    it('updates reactively when commentsMap changes', async () => {
      const { result } = renderHook(() => useWorkbookComments(provider, 'block-1'))

      expect(result.current.threads).toHaveLength(0)

      act(() => {
        provider.addComment('block-1', 'New comment!')
      })

      await waitFor(() => {
        expect(result.current.threads).toHaveLength(1)
        expect(result.current.threads[0].text).toBe('New comment!')
      })
    })

    it('returns empty threads when provider is null', () => {
      const { result } = renderHook(() => useWorkbookComments(null, 'block-1'))
      expect(result.current.threads).toEqual([])
    })

    it('provides addComment function', () => {
      const { result } = renderHook(() => useWorkbookComments(provider, 'block-1'))

      act(() => {
        result.current.addComment('Added via hook')
      })

      expect(result.current.threads).toHaveLength(1)
    })
  })

  describe('Multi-user comment sync', () => {
    it('syncs comments between two providers via Y.Doc state exchange', () => {
      const providerB = new WorkbookCollaborationProvider({
        gradeId: 'test-grade-comments',
        user: {
          username: 'student@test.com',
          role: 'student',
          displayName: 'Test Student',
          color: '#3b82f6',
        },
        connect: false,
        persistence: false,
      })

      try {
        // Provider A adds a comment
        provider.addComment('block-1', 'Instructor feedback')

        // Sync state from A to B
        const stateA = Y.encodeStateAsUpdate(provider.getDoc())
        Y.applyUpdate(providerB.getDoc(), stateA)

        // Provider B should see the comment
        const commentsOnB = providerB.getComments('block-1')
        expect(commentsOnB).toHaveLength(1)
        expect(commentsOnB[0].text).toBe('Instructor feedback')

        // Provider B adds a comment
        providerB.addComment('block-1', 'Student question')

        // Sync state from B back to A
        const stateB = Y.encodeStateAsUpdate(providerB.getDoc())
        Y.applyUpdate(provider.getDoc(), stateB)

        // Provider A should see both comments
        const commentsOnA = provider.getComments('block-1')
        expect(commentsOnA).toHaveLength(2)
      } finally {
        providerB.destroy()
      }
    })

    it('concurrent comments from both providers merge without conflict', () => {
      const providerB = new WorkbookCollaborationProvider({
        gradeId: 'test-grade-comments',
        user: {
          username: 'student@test.com',
          role: 'student',
          displayName: 'Test Student',
          color: '#3b82f6',
        },
        connect: false,
        persistence: false,
      })

      try {
        // Both add comments independently (before sync)
        provider.addComment('block-1', 'From A')
        providerB.addComment('block-1', 'From B')

        // Cross-sync
        const stateA = Y.encodeStateAsUpdate(provider.getDoc())
        const stateB = Y.encodeStateAsUpdate(providerB.getDoc())
        Y.applyUpdate(providerB.getDoc(), stateA)
        Y.applyUpdate(provider.getDoc(), stateB)

        // Both should have both comments
        expect(provider.getComments('block-1')).toHaveLength(2)
        expect(providerB.getComments('block-1')).toHaveLength(2)
      } finally {
        providerB.destroy()
      }
    })
  })
})
