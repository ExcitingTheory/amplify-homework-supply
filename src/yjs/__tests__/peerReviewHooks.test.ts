/**
 * Peer Review Hooks Tests
 *
 * Tests for usePeerReviewRoom, useRoomMessages, useRoomPeers hooks.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { PeerReviewRoomProvider } from '../PeerReviewRoomProvider'
import { useRoomMessages, useRoomPeers } from '../peerReviewHooks'

describe('Peer Review Hooks', () => {
  let provider: PeerReviewRoomProvider

  beforeEach(() => {
    provider = new PeerReviewRoomProvider({
      roomId: 'room-hooks',
      gradeId: 'grade-456',
      user: {
        username: 'alice@test.com',
        role: 'student',
        displayName: 'Alice',
      },
      connect: false,
      persistence: false,
    })
  })

  afterEach(() => {
    provider?.destroy()
  })

  describe('useRoomMessages', () => {
    it('returns empty array initially', () => {
      const { result } = renderHook(() => useRoomMessages(provider))
      expect(result.current).toEqual([])
    })

    it('updates when messages are added', async () => {
      const { result } = renderHook(() => useRoomMessages(provider))

      act(() => {
        provider.sendMessage('Hello!')
      })

      await waitFor(() => {
        expect(result.current).toHaveLength(1)
        expect(result.current[0].content).toBe('Hello!')
      })
    })

    it('returns empty array for null provider', () => {
      const { result } = renderHook(() => useRoomMessages(null))
      expect(result.current).toEqual([])
    })

    it('returns messages with correct structure', async () => {
      const { result } = renderHook(() => useRoomMessages(provider))

      act(() => {
        provider.sendMessage('Test message', 'CHAT', 'block-1')
      })

      await waitFor(() => {
        const msg = result.current[0]
        expect(msg.id).toBeDefined()
        expect(msg.author).toBe('alice@test.com')
        expect(msg.displayName).toBe('Alice')
        expect(msg.content).toBe('Test message')
        expect(msg.messageType).toBe('CHAT')
        expect(msg.referencedBlockId).toBe('block-1')
        expect(msg.createdAt).toBeDefined()
      })
    })
  })

  describe('useRoomPeers', () => {
    it('returns empty array when no other users', () => {
      const { result } = renderHook(() => useRoomPeers(provider))
      expect(result.current).toEqual([])
    })

    it('returns empty for null provider', () => {
      const { result } = renderHook(() => useRoomPeers(null))
      expect(result.current).toEqual([])
    })

    it('excludes self from peer list', () => {
      const { result } = renderHook(() => useRoomPeers(provider))
      // Local user should not appear in peers
      const self = result.current.find((p) => p.username === 'alice@test.com')
      expect(self).toBeUndefined()
    })

    it('updates when a peer connects', async () => {
      const { result } = renderHook(() => useRoomPeers(provider))

      act(() => {
        const awareness = provider.getAwareness()
        const fakeClientId = 888
        ;(awareness as any).states.set(fakeClientId, {
          user: {
            username: 'bob@test.com',
            role: 'student',
            displayName: 'Bob',
          },
          typing: false,
        })
        awareness.emit('change', [{ added: [fakeClientId], removed: [], updated: [] }])
      })

      await waitFor(() => {
        expect(result.current).toHaveLength(1)
        expect(result.current[0].username).toBe('bob@test.com')
      })
    })
  })
})
