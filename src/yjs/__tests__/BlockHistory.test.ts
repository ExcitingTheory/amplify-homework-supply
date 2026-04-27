/**
 * Block History Tests
 *
 * Tests for the history Y.Array tracking and the useBlockHistory hook.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { WorkbookCollaborationProvider } from '../WorkbookCollaborationProvider'
import { useBlockHistory } from '../workbookHooks'

describe('Block History', () => {
  let provider: WorkbookCollaborationProvider

  beforeEach(() => {
    provider = new WorkbookCollaborationProvider({
      gradeId: 'test-grade-history',
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

  describe('recordHistory / getBlockHistory', () => {
    it('pushes an entry to the history Y.Array', () => {
      provider.recordHistory('block-1', 'userAnswer', null, 'Hello')

      const history = provider.getBlockHistory('block-1')
      expect(history).toHaveLength(1)
      expect(history[0].fieldChanged).toBe('userAnswer')
      expect(history[0].oldValue).toBeNull()
      expect(history[0].newValue).toBe('Hello')
    })

    it('includes userId, displayName, timestamp', () => {
      provider.recordHistory('block-1', 'accuracy', 0, 85)

      const entry = provider.getBlockHistory('block-1')[0]
      expect(entry.userId).toBe('student@test.com')
      expect(entry.displayName).toBe('Test Student')
      expect(entry.timestamp).toBeDefined()
    })

    it('records multiple entries in chronological order', () => {
      provider.recordHistory('block-1', 'userAnswer', null, 'first')
      provider.recordHistory('block-1', 'userAnswer', 'first', 'second')
      provider.recordHistory('block-1', 'complete', false, true)

      const history = provider.getBlockHistory('block-1')
      expect(history).toHaveLength(3)
      expect(history[0].newValue).toBe('first')
      expect(history[1].newValue).toBe('second')
      expect(history[2].fieldChanged).toBe('complete')
    })

    it('histories are isolated per block', () => {
      provider.recordHistory('block-1', 'userAnswer', null, 'a')
      provider.recordHistory('block-2', 'userAnswer', null, 'b')

      expect(provider.getBlockHistory('block-1')).toHaveLength(1)
      expect(provider.getBlockHistory('block-2')).toHaveLength(1)
      expect(provider.getBlockHistory('block-3')).toHaveLength(0)
    })

    it('trims history to 50 entries', () => {
      for (let i = 0; i < 60; i++) {
        provider.recordHistory('block-1', 'attempt', i - 1, i)
      }

      const history = provider.getBlockHistory('block-1')
      expect(history).toHaveLength(50)
      // The oldest entries should have been dropped
      expect(history[0].newValue).toBe(10) // entries 0-9 trimmed
    })
  })

  describe('useBlockHistory hook', () => {
    it('returns entries for the specified block', () => {
      provider.recordHistory('block-1', 'userAnswer', null, 'test')

      const { result } = renderHook(() => useBlockHistory(provider, 'block-1'))
      expect(result.current.entries).toHaveLength(1)
    })

    it('updates reactively when history changes', async () => {
      const { result } = renderHook(() => useBlockHistory(provider, 'block-1'))

      expect(result.current.entries).toHaveLength(0)

      act(() => {
        provider.recordHistory('block-1', 'userAnswer', null, 'new value')
      })

      await waitFor(() => {
        expect(result.current.entries).toHaveLength(1)
      })
    })

    it('returns empty entries when provider is null', () => {
      const { result } = renderHook(() => useBlockHistory(null, 'block-1'))
      expect(result.current.entries).toEqual([])
    })

    it('returns entries in chronological order', () => {
      provider.recordHistory('block-1', 'a', null, '1')
      provider.recordHistory('block-1', 'b', null, '2')

      const { result } = renderHook(() => useBlockHistory(provider, 'block-1'))
      expect(result.current.entries[0].fieldChanged).toBe('a')
      expect(result.current.entries[1].fieldChanged).toBe('b')
    })
  })
})
