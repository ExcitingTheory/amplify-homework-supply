/**
 * PeerReviewRoomProvider — Specialized Yjs provider for peer review chat rooms.
 *
 * Each peer review room is a Yjs document (`review-{roomId}`) with:
 * - `roomState` Y.Map — room metadata, status, invites
 * - `messages` Y.Array — append-only chat messages
 *
 * Awareness carries: { user, typing, viewingBlockId }
 *
 * @module PeerReviewRoomProvider
 */

import * as Y from 'yjs'
import { YjsDocProvider, YjsProviderConfig } from './YjsProvider'

// ============================================================================
// Types
// ============================================================================

export type RoomStatus = 'OPEN' | 'IN_REVIEW' | 'REVIEW_COMPLETE'

export type MessageType = 'CHAT' | 'SYSTEM' | 'AI_SUGGESTION'

export interface PeerReviewUser {
  username: string
  role: string
  displayName?: string
  color?: string
}

export interface PeerReviewRoomConfig extends Omit<YjsProviderConfig, 'docName'> {
  roomId: string
  gradeId: string
  user: PeerReviewUser
  wsUrl?: string
}

export interface RoomMessage {
  id: string
  author: string
  authorRole: string
  displayName?: string
  content: string
  messageType: MessageType
  referencedBlockId?: string
  createdAt: string
}

export interface RoomState {
  id: string
  gradeId: string
  ownerId: string
  status: RoomStatus
  invitedUserIds: string[]
  createdAt: string
  closedAt?: string
}

// ============================================================================
// Provider
// ============================================================================

export class PeerReviewRoomProvider extends YjsDocProvider {
  private roomId: string
  private gradeId: string
  private user: PeerReviewUser
  private roomStateMap: Y.Map<any>
  private messagesArray: Y.Array<RoomMessage>

  constructor(config: PeerReviewRoomConfig) {
    const docName = `review-${config.roomId}`

    super({
      ...config,
      docName,
    })

    this.roomId = config.roomId
    this.gradeId = config.gradeId
    this.user = config.user

    this.roomStateMap = this.getMap('roomState') as Y.Map<any>
    this.messagesArray = this.getDoc().getArray<RoomMessage>('messages')

    this.initializeAwareness()
  }

  // ========================================================================
  // Awareness
  // ========================================================================

  private initializeAwareness(): void {
    const awareness = this.getAwareness()
    awareness.setLocalState({
      user: this.user,
      typing: false,
      viewingBlockId: null,
    })
  }

  /**
   * Set the local user's typing indicator state.
   */
  setTyping(typing: boolean): void {
    const awareness = this.getAwareness()
    const currentState = awareness.getLocalState()
    awareness.setLocalState({
      ...currentState,
      typing,
    })
  }

  /**
   * Set which block the local user is currently viewing.
   */
  setViewingBlock(blockId: string | null): void {
    const awareness = this.getAwareness()
    const currentState = awareness.getLocalState()
    awareness.setLocalState({
      ...currentState,
      viewingBlockId: blockId,
    })
  }

  // ========================================================================
  // Room State
  // ========================================================================

  /**
   * Initialize room state (called by room creator).
   */
  initializeRoom(ownerId: string): void {
    this.roomStateMap.set('id', this.roomId)
    this.roomStateMap.set('gradeId', this.gradeId)
    this.roomStateMap.set('ownerId', ownerId)
    this.roomStateMap.set('status', 'OPEN' as RoomStatus)
    this.roomStateMap.set('invitedUserIds', [])
    this.roomStateMap.set('createdAt', new Date().toISOString())
  }

  /**
   * Get the current room state.
   */
  getRoomState(): RoomState {
    return {
      id: this.roomStateMap.get('id') || this.roomId,
      gradeId: this.roomStateMap.get('gradeId') || this.gradeId,
      ownerId: this.roomStateMap.get('ownerId') || '',
      status: (this.roomStateMap.get('status') as RoomStatus) || 'OPEN',
      invitedUserIds: this.roomStateMap.get('invitedUserIds') || [],
      createdAt: this.roomStateMap.get('createdAt') || '',
      closedAt: this.roomStateMap.get('closedAt'),
    }
  }

  /**
   * Invite a user to the room (adds to invitedUserIds).
   */
  inviteUser(userId: string): void {
    const current = this.roomStateMap.get('invitedUserIds') || []
    if (!current.includes(userId)) {
      this.roomStateMap.set('invitedUserIds', [...current, userId])
    }
  }

  /**
   * Close the room — sets status to REVIEW_COMPLETE.
   */
  closeRoom(): void {
    this.roomStateMap.set('status', 'REVIEW_COMPLETE' as RoomStatus)
    this.roomStateMap.set('closedAt', new Date().toISOString())
  }

  /**
   * Check if the room is closed.
   */
  isClosed(): boolean {
    return this.getRoomState().status === 'REVIEW_COMPLETE'
  }

  // ========================================================================
  // Messages
  // ========================================================================

  /**
   * Send a chat message.
   */
  sendMessage(
    content: string,
    messageType: MessageType = 'CHAT',
    referencedBlockId?: string,
  ): RoomMessage {
    const message: RoomMessage = {
      id: crypto.randomUUID(),
      author: this.user.username,
      authorRole: this.user.role,
      displayName: this.user.displayName,
      content,
      messageType,
      referencedBlockId,
      createdAt: new Date().toISOString(),
    }

    this.messagesArray.push([message])
    return message
  }

  /**
   * Get all messages in the room.
   */
  getMessages(): RoomMessage[] {
    return Array.from(this.messagesArray)
  }

  /**
   * Get the messages Y.Array for observation in hooks.
   */
  getMessagesArray(): Y.Array<RoomMessage> {
    return this.messagesArray
  }

  /**
   * Get the room state Y.Map for observation in hooks.
   */
  getRoomStateMap(): Y.Map<any> {
    return this.roomStateMap
  }

  /**
   * Get the room ID.
   */
  getRoomId(): string {
    return this.roomId
  }
}
