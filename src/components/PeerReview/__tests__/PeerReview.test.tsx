/**
 * Peer Review UI Component Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { PeerReviewChat } from '../PeerReviewChat'
import { RoomInvite } from '../RoomInvite'
import type { RoomMessage } from '../../../yjs/PeerReviewRoomProvider'

describe('PeerReviewChat', () => {
  const baseProps = {
    messages: [] as RoomMessage[],
    typingPeers: [],
    currentUsername: 'alice@test.com',
    isClosed: false,
    onSendMessage: vi.fn(),
    onTypingChange: vi.fn(),
  }

  it('renders empty state when no messages', () => {
    render(<PeerReviewChat {...baseProps} />)
    expect(screen.getByText(/No messages yet/)).toBeDefined()
  })

  it('renders chat messages', () => {
    const messages: RoomMessage[] = [
      {
        id: 'm1',
        author: 'bob@test.com',
        authorRole: 'student',
        displayName: 'Bob',
        content: 'Great work on Q3!',
        messageType: 'CHAT',
        createdAt: '2025-06-01T12:00:00Z',
      },
    ]
    render(<PeerReviewChat {...baseProps} messages={messages} />)
    expect(screen.getByText('Great work on Q3!')).toBeDefined()
    expect(screen.getByText('Bob')).toBeDefined()
  })

  it('renders system messages centered', () => {
    const messages: RoomMessage[] = [
      {
        id: 'm2',
        author: 'system',
        authorRole: 'system',
        content: 'Alice joined the room',
        messageType: 'SYSTEM',
        createdAt: '2025-06-01T12:00:00Z',
      },
    ]
    render(<PeerReviewChat {...baseProps} messages={messages} />)
    expect(screen.getByText('Alice joined the room')).toBeDefined()
  })

  it('renders AI messages with AI label', () => {
    const messages: RoomMessage[] = [
      {
        id: 'm3',
        author: 'ai',
        authorRole: 'assistant',
        content: 'Consider checking your formula.',
        messageType: 'AI_SUGGESTION',
        createdAt: '2025-06-01T12:00:00Z',
      },
    ]
    render(<PeerReviewChat {...baseProps} messages={messages} />)
    expect(screen.getByText('AI Assistant')).toBeDefined()
    expect(screen.getByText('Consider checking your formula.')).toBeDefined()
  })

  it('shows typing indicator', () => {
    render(
      <PeerReviewChat
        {...baseProps}
        typingPeers={[{ username: 'bob@test.com', role: 'student', displayName: 'Bob' }]}
      />,
    )
    expect(screen.getByText(/Bob is typing/)).toBeDefined()
  })

  it('shows multiple typing peers', () => {
    render(
      <PeerReviewChat
        {...baseProps}
        typingPeers={[
          { username: 'bob@test.com', role: 'student', displayName: 'Bob' },
          { username: 'carol@test.com', role: 'student', displayName: 'Carol' },
        ]}
      />,
    )
    expect(screen.getByText(/Bob, Carol are typing/)).toBeDefined()
  })

  it('calls onSendMessage when send button clicked', () => {
    const onSendMessage = vi.fn()
    render(<PeerReviewChat {...baseProps} onSendMessage={onSendMessage} />)

    const input = screen.getByPlaceholderText(/Type a message/)
    fireEvent.change(input, { target: { value: 'Hello!' } })
    fireEvent.click(screen.getByLabelText('actions.send'))

    expect(onSendMessage).toHaveBeenCalledWith('Hello!')
  })

  it('calls onSendMessage on Enter key', () => {
    const onSendMessage = vi.fn()
    render(<PeerReviewChat {...baseProps} onSendMessage={onSendMessage} />)

    const input = screen.getByPlaceholderText(/Type a message/)
    fireEvent.change(input, { target: { value: 'Hi there' } })
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false })

    expect(onSendMessage).toHaveBeenCalledWith('Hi there')
  })

  it('does not send empty messages', () => {
    const onSendMessage = vi.fn()
    render(<PeerReviewChat {...baseProps} onSendMessage={onSendMessage} />)

    fireEvent.click(screen.getByLabelText('actions.send'))
    expect(onSendMessage).not.toHaveBeenCalled()
  })

  it('shows closed state when room is closed', () => {
    render(<PeerReviewChat {...baseProps} isClosed={true} />)
    expect(screen.getByText(/review session has ended/)).toBeDefined()
    expect(screen.queryByPlaceholderText(/Type a message/)).toBeNull()
  })

  it('renders referenced block chip', () => {
    const messages: RoomMessage[] = [
      {
        id: 'm4',
        author: 'bob@test.com',
        authorRole: 'student',
        displayName: 'Bob',
        content: 'Look at this block',
        messageType: 'CHAT',
        referencedBlockId: 'block-q3',
        createdAt: '2025-06-01T12:00:00Z',
      },
    ]
    render(<PeerReviewChat {...baseProps} messages={messages} />)
    expect(screen.getByText('Block: block-q3')).toBeDefined()
  })
})

describe('RoomInvite', () => {
  const baseProps = {
    roomState: {
      id: 'room-1',
      gradeId: 'grade-1',
      ownerId: 'alice@test.com',
      status: 'OPEN' as const,
      invitedUserIds: [],
      createdAt: '2025-06-01T12:00:00Z',
    },
    onInvite: vi.fn(),
  }

  it('renders invite form', () => {
    render(<RoomInvite {...baseProps} />)
    expect(screen.getByText('Invite Peers')).toBeDefined()
    expect(screen.getByPlaceholderText(/username or email/)).toBeDefined()
    expect(screen.getByText('Invite')).toBeDefined()
  })

  it('calls onInvite with username', () => {
    const onInvite = vi.fn()
    render(<RoomInvite {...baseProps} onInvite={onInvite} />)

    const input = screen.getByPlaceholderText(/username or email/)
    fireEvent.change(input, { target: { value: 'bob@test.com' } })
    fireEvent.click(screen.getByText('Invite'))

    expect(onInvite).toHaveBeenCalledWith('bob@test.com')
  })

  it('clears input after invite', () => {
    render(<RoomInvite {...baseProps} onInvite={vi.fn()} />)

    const input = screen.getByPlaceholderText(/username or email/) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'bob@test.com' } })
    fireEvent.click(screen.getByText('Invite'))

    expect(input.value).toBe('')
  })

  it('shows invited user chips', () => {
    render(
      <RoomInvite
        {...baseProps}
        roomState={{
          ...baseProps.roomState,
          invitedUserIds: ['bob@test.com', 'carol@test.com'],
        }}
      />,
    )
    expect(screen.getByText('bob@test.com')).toBeDefined()
    expect(screen.getByText('carol@test.com')).toBeDefined()
  })

  it('does not submit empty input', () => {
    const onInvite = vi.fn()
    render(<RoomInvite {...baseProps} onInvite={onInvite} />)
    fireEvent.click(screen.getByText('Invite'))
    expect(onInvite).not.toHaveBeenCalled()
  })
})
