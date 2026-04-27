/**
 * PeerReviewRoomProvider Tests
 *
 * Tests room lifecycle, messages, state, and multi-user sync.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PeerReviewRoomProvider } from '../PeerReviewRoomProvider'
import * as Y from 'yjs'

describe('PeerReviewRoomProvider', () => {
  let provider: PeerReviewRoomProvider

  beforeEach(() => {
    provider = new PeerReviewRoomProvider({
      roomId: 'room-abc',
      gradeId: 'grade-123',
      user: {
        username: 'alice@test.com',
        role: 'student',
        displayName: 'Alice',
        color: '#3b82f6',
      },
      connect: false,
      persistence: false,
    })
  })

  afterEach(() => {
    provider?.destroy()
  })

  describe('Initialization', () => {
    it('creates doc with name review-{roomId}', () => {
      expect((provider as any).docName).toBe('review-room-abc')
    })

    it('initializes awareness with user, typing, viewingBlockId', () => {
      const awareness = provider.getAwareness()
      const state = awareness.getLocalState()
      expect(state?.user).toMatchObject({ username: 'alice@test.com' })
      expect(state?.typing).toBe(false)
      expect(state?.viewingBlockId).toBeNull()
    })
  })

  describe('Room State', () => {
    it('initializeRoom sets all state fields', () => {
      provider.initializeRoom('alice@test.com')

      const state = provider.getRoomState()
      expect(state.id).toBe('room-abc')
      expect(state.gradeId).toBe('grade-123')
      expect(state.ownerId).toBe('alice@test.com')
      expect(state.status).toBe('OPEN')
      expect(state.invitedUserIds).toEqual([])
      expect(state.createdAt).toBeDefined()
    })

    it('inviteUser adds userId to invitedUserIds', () => {
      provider.initializeRoom('alice@test.com')
      provider.inviteUser('bob@test.com')
      provider.inviteUser('carol@test.com')

      const state = provider.getRoomState()
      expect(state.invitedUserIds).toContain('bob@test.com')
      expect(state.invitedUserIds).toContain('carol@test.com')
    })

    it('inviteUser does not duplicate userIds', () => {
      provider.initializeRoom('alice@test.com')
      provider.inviteUser('bob@test.com')
      provider.inviteUser('bob@test.com')

      expect(provider.getRoomState().invitedUserIds).toHaveLength(1)
    })

    it('closeRoom sets status to REVIEW_COMPLETE', () => {
      provider.initializeRoom('alice@test.com')
      provider.closeRoom()

      const state = provider.getRoomState()
      expect(state.status).toBe('REVIEW_COMPLETE')
      expect(state.closedAt).toBeDefined()
    })

    it('isClosed returns correct value', () => {
      provider.initializeRoom('alice@test.com')
      expect(provider.isClosed()).toBe(false)

      provider.closeRoom()
      expect(provider.isClosed()).toBe(true)
    })
  })

  describe('Messages', () => {
    it('sendMessage appends to messages Y.Array', () => {
      const msg = provider.sendMessage('Hello everyone!')

      expect(msg.id).toBeDefined()
      expect(msg.author).toBe('alice@test.com')
      expect(msg.content).toBe('Hello everyone!')
      expect(msg.messageType).toBe('CHAT')

      const messages = provider.getMessages()
      expect(messages).toHaveLength(1)
    })

    it('getMessages returns all messages in order', () => {
      provider.sendMessage('First')
      provider.sendMessage('Second')
      provider.sendMessage('Third')

      const messages = provider.getMessages()
      expect(messages).toHaveLength(3)
      expect(messages[0].content).toBe('First')
      expect(messages[1].content).toBe('Second')
      expect(messages[2].content).toBe('Third')
    })

    it('supports different message types', () => {
      provider.sendMessage('User joined', 'SYSTEM')
      provider.sendMessage('AI says...', 'AI_SUGGESTION')

      const messages = provider.getMessages()
      expect(messages[0].messageType).toBe('SYSTEM')
      expect(messages[1].messageType).toBe('AI_SUGGESTION')
    })

    it('supports referencedBlockId', () => {
      provider.sendMessage('Look at Q3', 'CHAT', 'block-q3')

      expect(provider.getMessages()[0].referencedBlockId).toBe('block-q3')
    })
  })

  describe('Awareness', () => {
    it('setTyping updates typing state', () => {
      provider.setTyping(true)
      const state = provider.getAwareness().getLocalState()
      expect(state?.typing).toBe(true)

      provider.setTyping(false)
      expect(provider.getAwareness().getLocalState()?.typing).toBe(false)
    })

    it('setViewingBlock updates viewingBlockId', () => {
      provider.setViewingBlock('block-5')
      expect(provider.getAwareness().getLocalState()?.viewingBlockId).toBe('block-5')

      provider.setViewingBlock(null)
      expect(provider.getAwareness().getLocalState()?.viewingBlockId).toBeNull()
    })
  })

  describe('Multi-user sync', () => {
    it('syncs messages between two providers via Y.Doc state exchange', () => {
      const providerB = new PeerReviewRoomProvider({
        roomId: 'room-abc',
        gradeId: 'grade-123',
        user: {
          username: 'bob@test.com',
          role: 'student',
          displayName: 'Bob',
        },
        connect: false,
        persistence: false,
      })

      try {
        provider.sendMessage('Hello from Alice')

        // Sync A → B
        const stateA = Y.encodeStateAsUpdate(provider.getDoc())
        Y.applyUpdate(providerB.getDoc(), stateA)

        expect(providerB.getMessages()).toHaveLength(1)
        expect(providerB.getMessages()[0].content).toBe('Hello from Alice')

        // B replies
        providerB.sendMessage('Hello from Bob')

        // Sync B → A
        const stateB = Y.encodeStateAsUpdate(providerB.getDoc())
        Y.applyUpdate(provider.getDoc(), stateB)

        expect(provider.getMessages()).toHaveLength(2)
      } finally {
        providerB.destroy()
      }
    })

    it('concurrent messages merge correctly (CRDT ordering)', () => {
      const providerB = new PeerReviewRoomProvider({
        roomId: 'room-abc',
        gradeId: 'grade-123',
        user: {
          username: 'bob@test.com',
          role: 'student',
          displayName: 'Bob',
        },
        connect: false,
        persistence: false,
      })

      try {
        // Both send independently
        provider.sendMessage('From Alice')
        providerB.sendMessage('From Bob')

        // Cross-sync
        const stateA = Y.encodeStateAsUpdate(provider.getDoc())
        const stateB = Y.encodeStateAsUpdate(providerB.getDoc())
        Y.applyUpdate(providerB.getDoc(), stateA)
        Y.applyUpdate(provider.getDoc(), stateB)

        // Both should have both messages
        expect(provider.getMessages()).toHaveLength(2)
        expect(providerB.getMessages()).toHaveLength(2)

        // Order should be consistent across both
        const aMsgs = provider.getMessages().map((m) => m.content)
        const bMsgs = providerB.getMessages().map((m) => m.content)
        expect(aMsgs).toEqual(bMsgs)
      } finally {
        providerB.destroy()
      }
    })

    it('room state changes sync between providers', () => {
      const providerB = new PeerReviewRoomProvider({
        roomId: 'room-abc',
        gradeId: 'grade-123',
        user: {
          username: 'bob@test.com',
          role: 'student',
          displayName: 'Bob',
        },
        connect: false,
        persistence: false,
      })

      try {
        provider.initializeRoom('alice@test.com')
        provider.inviteUser('bob@test.com')

        // Sync A → B
        const stateA = Y.encodeStateAsUpdate(provider.getDoc())
        Y.applyUpdate(providerB.getDoc(), stateA)

        const roomState = providerB.getRoomState()
        expect(roomState.ownerId).toBe('alice@test.com')
        expect(roomState.invitedUserIds).toContain('bob@test.com')
      } finally {
        providerB.destroy()
      }
    })
  })
})
