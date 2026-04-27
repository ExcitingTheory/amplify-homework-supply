/**
 * Workbook Presence Tests
 *
 * Tests for useBlockEditors, usePresenceUsers hooks and
 * WorkbookCollaborationProvider presence features (lastInteraction, cursor debounce)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { WorkbookCollaborationProvider } from '../WorkbookCollaborationProvider'
import { useBlockEditors, usePresenceUsers } from '../workbookHooks'

describe('Workbook Presence', () => {
  let provider: WorkbookCollaborationProvider

  beforeEach(() => {
    provider = new WorkbookCollaborationProvider({
      gradeId: 'test-grade-presence',
      user: {
        username: 'student@test.com',
        role: 'student',
        displayName: 'Test Student',
        color: '#3b82f6',
      },
      connect: false,
      persistence: false,
    })
  })

  afterEach(() => {
    provider?.destroy()
  })

  describe('lastInteraction in awareness', () => {
    it('sets lastInteraction on initialization', () => {
      const awareness = provider.getAwareness()
      const state = awareness.getLocalState()
      expect(state?.lastInteraction).toBeDefined()
      expect(typeof state?.lastInteraction).toBe('number')
    })

    it('updates lastInteraction on updateBlock', () => {
      const awareness = provider.getAwareness()
      const initialTimestamp = awareness.getLocalState()?.lastInteraction as number

      provider.updateBlock('block-1', { userAnswer: 'test' })

      const updatedTimestamp = awareness.getLocalState()?.lastInteraction as number
      expect(updatedTimestamp).toBeGreaterThanOrEqual(initialTimestamp)
    })
  })

  describe('useBlockEditors', () => {
    it('returns empty array when no other users', () => {
      const { result } = renderHook(() => useBlockEditors(provider, 'block-1'))
      expect(result.current).toEqual([])
    })

    it('returns empty array when provider is null', () => {
      const { result } = renderHook(() => useBlockEditors(null, 'block-1'))
      expect(result.current).toEqual([])
    })

    it('excludes the local client', () => {
      const { result } = renderHook(() => useBlockEditors(provider, 'block-1'))

      // Even after setting own cursor to block-1, should not appear in editors
      act(() => {
        const awareness = provider.getAwareness()
        const currentState = awareness.getLocalState()
        awareness.setLocalState({
          ...currentState,
          user: {
            ...currentState?.user,
            cursor: { blockId: 'block-1' },
          },
        })
      })

      expect(result.current).toEqual([])
    })

    it('returns users whose cursor matches blockId', () => {
      const { result } = renderHook(() => useBlockEditors(provider, 'block-1'))

      // Simulate another client by directly setting awareness state
      act(() => {
        const awareness = provider.getAwareness()
        const fakeClientId = 999
        ;(awareness as any).states.set(fakeClientId, {
          user: {
            username: 'tutor@test.com',
            displayName: 'Tutor',
            role: 'tutor',
            cursor: { blockId: 'block-1' },
          },
          lastInteraction: Date.now(),
        })
        // Trigger awareness change event
        awareness.emit('change', [{ added: [fakeClientId], removed: [], updated: [] }])
      })

      // Wait for state update
      waitFor(() => {
        expect(result.current.length).toBe(1)
        expect(result.current[0].username).toBe('tutor@test.com')
        expect(result.current[0].isIdle).toBe(false)
      })
    })

    it('marks users as idle when lastInteraction is old', () => {
      const { result } = renderHook(() => useBlockEditors(provider, 'block-1'))

      act(() => {
        const awareness = provider.getAwareness()
        const fakeClientId = 998
        ;(awareness as any).states.set(fakeClientId, {
          user: {
            username: 'idle@test.com',
            displayName: 'Idle User',
            role: 'student',
            cursor: { blockId: 'block-1' },
          },
          lastInteraction: Date.now() - 120000, // 2 minutes ago
        })
        awareness.emit('change', [{ added: [fakeClientId], removed: [], updated: [] }])
      })

      waitFor(() => {
        expect(result.current.length).toBe(1)
        expect(result.current[0].isIdle).toBe(true)
      })
    })
  })

  describe('usePresenceUsers', () => {
    it('includes the local user', () => {
      const { result } = renderHook(() => usePresenceUsers(provider))
      // Local user should be included
      expect(result.current.length).toBeGreaterThanOrEqual(1)
      const self = result.current.find((u) => u.username === 'student@test.com')
      expect(self).toBeDefined()
    })

    it('returns empty array when provider is null', () => {
      const { result } = renderHook(() => usePresenceUsers(null))
      expect(result.current).toEqual([])
    })

    it('updates when awareness changes', () => {
      const { result } = renderHook(() => usePresenceUsers(provider))

      const initialCount = result.current.length

      act(() => {
        const awareness = provider.getAwareness()
        const fakeClientId = 997
        ;(awareness as any).states.set(fakeClientId, {
          user: {
            username: 'peer@test.com',
            displayName: 'Peer',
            role: 'student',
          },
          lastInteraction: Date.now(),
        })
        awareness.emit('change', [{ added: [fakeClientId], removed: [], updated: [] }])
      })

      waitFor(() => {
        expect(result.current.length).toBe(initialCount + 1)
      })
    })
  })

  describe('Cursor debounce', () => {
    it('updateCursor debounces calls', async () => {
      vi.useFakeTimers()

      const awareness = provider.getAwareness()
      const spy = vi.spyOn(awareness, 'setLocalState')

      // Call updateCursor multiple times rapidly
      provider.updateCursor('block-1')
      provider.updateCursor('block-2')
      provider.updateCursor('block-3')

      // Should not have been called yet (debounced)
      const callsBefore = spy.mock.calls.length

      // Advance past debounce interval
      vi.advanceTimersByTime(350)

      // Should only see the last update
      const callsAfter = spy.mock.calls.length
      expect(callsAfter).toBeGreaterThan(callsBefore)

      // The final cursor should be block-3
      const lastCall = spy.mock.calls[spy.mock.calls.length - 1][0]
      expect(lastCall?.user?.cursor?.blockId).toBe('block-3')

      vi.useRealTimers()
    })
  })
})
