/**
 * Tests for PeerReviewInvitations and OpenPeerReviewButton components.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import { PeerReviewInvitations, PeerReviewInvitation } from '../PeerReviewInvitations'
import { OpenPeerReviewButton } from '../OpenPeerReviewButton'

// ============================================================================
// PeerReviewInvitations
// ============================================================================

describe('PeerReviewInvitations', () => {
  const mockInvitations: PeerReviewInvitation[] = [
    {
      id: 'room-1',
      gradeId: 'grade-1',
      ownerId: 'alice',
      ownerDisplayName: 'Alice',
      unitName: 'Biology Chapter 3',
      status: 'OPEN',
      createdAt: '2026-04-15T10:00:00Z',
    },
    {
      id: 'room-2',
      gradeId: 'grade-2',
      ownerId: 'bob',
      ownerDisplayName: 'Bob',
      unitName: 'Chemistry Lab',
      status: 'IN_REVIEW',
    },
    {
      id: 'room-3',
      gradeId: 'grade-3',
      ownerId: 'carol',
      status: 'REVIEW_COMPLETE',
    },
  ]

  it('renders active invitations and hides completed ones', () => {
    const onJoin = vi.fn()
    render(
      <PeerReviewInvitations invitations={mockInvitations} onJoinReview={onJoin} />,
    )

    expect(screen.getByText('Biology Chapter 3')).toBeDefined()
    expect(screen.getByText('Chemistry Lab')).toBeDefined()
    // REVIEW_COMPLETE should be filtered out
    expect(screen.queryByText('From: carol')).toBeNull()
  })

  it('shows the invitation count badge', () => {
    const onJoin = vi.fn()
    render(
      <PeerReviewInvitations invitations={mockInvitations} onJoinReview={onJoin} />,
    )

    // 2 active invitations
    expect(screen.getByText('2')).toBeDefined()
  })

  it('calls onJoinReview with room ID when Join button clicked', () => {
    const onJoin = vi.fn()
    render(
      <PeerReviewInvitations invitations={mockInvitations} onJoinReview={onJoin} />,
    )

    const joinButtons = screen.getAllByText('Join Review')
    fireEvent.click(joinButtons[0])
    expect(onJoin).toHaveBeenCalledWith('room-1')
  })

  it('renders nothing when no active invitations', () => {
    const onJoin = vi.fn()
    const { container } = render(
      <PeerReviewInvitations
        invitations={[{ ...mockInvitations[2] }]} // only completed
        onJoinReview={onJoin}
      />,
    )

    expect(container.innerHTML).toBe('')
  })

  it('renders nothing when invitations array is empty', () => {
    const onJoin = vi.fn()
    const { container } = render(
      <PeerReviewInvitations invitations={[]} onJoinReview={onJoin} />,
    )

    expect(container.innerHTML).toBe('')
  })

  it('shows status chips with correct labels', () => {
    const onJoin = vi.fn()
    render(
      <PeerReviewInvitations invitations={mockInvitations} onJoinReview={onJoin} />,
    )

    expect(screen.getByText('Open')).toBeDefined()
    expect(screen.getByText('In Progress')).toBeDefined()
  })

  it('shows owner display name or fallback to ownerId', () => {
    const invitations: PeerReviewInvitation[] = [
      {
        id: 'room-4',
        gradeId: 'grade-4',
        ownerId: 'user123',
        unitName: 'Math Quiz',
        status: 'OPEN',
      },
    ]
    const onJoin = vi.fn()
    render(
      <PeerReviewInvitations invitations={invitations} onJoinReview={onJoin} />,
    )

    // Falls back to ownerId when no displayName
    expect(screen.getByText('From: user123')).toBeDefined()
  })
})

// ============================================================================
// OpenPeerReviewButton
// ============================================================================

describe('OpenPeerReviewButton', () => {
  it('renders the button', () => {
    const onCreate = vi.fn().mockResolvedValue('room-new')
    render(
      <OpenPeerReviewButton gradeId="grade-1" onCreateRoom={onCreate} />,
    )

    expect(screen.getByText('Open for Peer Review')).toBeDefined()
  })

  it('opens dialog on click', () => {
    const onCreate = vi.fn().mockResolvedValue('room-new')
    render(
      <OpenPeerReviewButton gradeId="grade-1" onCreateRoom={onCreate} />,
    )

    fireEvent.click(screen.getByText('Open for Peer Review'))
    expect(screen.getByText('Open Peer Review')).toBeDefined()
    expect(screen.getByText('Create Room')).toBeDefined()
  })

  it('calls onCreateRoom with gradeId and invited users', async () => {
    const onCreate = vi.fn().mockResolvedValue('room-new')
    const onCreated = vi.fn()
    render(
      <OpenPeerReviewButton
        gradeId="grade-1"
        onCreateRoom={onCreate}
        onRoomCreated={onCreated}
      />,
    )

    // Open dialog
    fireEvent.click(screen.getByText('Open for Peer Review'))
    // Click Create Room (no invites yet)
    fireEvent.click(screen.getByText('Create Room'))

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith('grade-1', [])
      expect(onCreated).toHaveBeenCalledWith('room-new')
    })
  })

  it('shows error if room creation fails', async () => {
    const onCreate = vi.fn().mockRejectedValue(new Error('Network error'))
    render(
      <OpenPeerReviewButton gradeId="grade-1" onCreateRoom={onCreate} />,
    )

    fireEvent.click(screen.getByText('Open for Peer Review'))
    fireEvent.click(screen.getByText('Create Room'))

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeDefined()
    })
  })

  it('is disabled when disabled prop is true', () => {
    const onCreate = vi.fn().mockResolvedValue('room-new')
    render(
      <OpenPeerReviewButton gradeId="grade-1" onCreateRoom={onCreate} disabled />,
    )

    const button = screen.getByText('Open for Peer Review').closest('button')
    expect(button?.disabled).toBe(true)
  })
})
