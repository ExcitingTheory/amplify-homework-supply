import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { JoinByCode } from './JoinByCode'
import { RoomInvite } from './RoomInvite'
import { PeerReviewInvitations } from './PeerReviewInvitations'
import type { PeerReviewInvitation } from './PeerReviewInvitations'
import { PeerReviewChat } from './PeerReviewChat'

// =============================================================================
// JoinByCode Stories
// =============================================================================

const joinMeta: Meta<typeof JoinByCode> = {
  title: 'PeerReview/JoinByCode',
  component: JoinByCode,
}
export default joinMeta

type JoinStory = StoryObj<typeof JoinByCode>

export const Default: JoinStory = {
  args: {
    onJoin: async (code: string) => {
      await new Promise((r) => setTimeout(r, 1000))
      return { roomId: 'mock-room-id', message: `Joined room with code ${code}` }
    },
  },
}

export const WithError: JoinStory = {
  args: {
    onJoin: async () => {
      await new Promise((r) => setTimeout(r, 500))
      throw new Error('Room not found or code expired')
    },
  },
}

// =============================================================================
// RoomInvite Stories
// =============================================================================

const inviteMeta: Meta<typeof RoomInvite> = {
  title: 'PeerReview/RoomInvite',
  component: RoomInvite,
}

export const RoomInviteStandalone: StoryObj<typeof RoomInvite> = {
  render: () => (
    <RoomInvite
      invitedUsers={['alice', 'bob', 'charlie']}
      onRemove={(user) => console.log('Remove:', user)}
    />
  ),
  parameters: { ...inviteMeta },
}

// =============================================================================
// PeerReviewInvitations Stories
// =============================================================================

const invitationsMeta: Meta<typeof PeerReviewInvitations> = {
  title: 'PeerReview/PeerReviewInvitations',
  component: PeerReviewInvitations,
}

const sampleInvitations: PeerReviewInvitation[] = [
  { roomId: 'room-1', gradeId: 'grade-1', ownerId: 'alice', ownerName: 'Alice', unitName: 'Biology 101', status: 'OPEN' },
  { roomId: 'room-2', gradeId: 'grade-2', ownerId: 'bob', ownerName: 'Bob', unitName: 'French Basics', status: 'IN_REVIEW' },
]

export const InvitationsStory: StoryObj<typeof PeerReviewInvitations> = {
  render: () => (
    <PeerReviewInvitations
      invitations={sampleInvitations}
      onJoinReview={(roomId) => console.log('Join:', roomId)}
    />
  ),
  parameters: { ...invitationsMeta },
}

export const NoInvitations: StoryObj<typeof PeerReviewInvitations> = {
  render: () => (
    <PeerReviewInvitations invitations={[]} onJoinReview={() => {}} />
  ),
  parameters: { ...invitationsMeta },
}

// =============================================================================
// PeerReviewChat Stories
// =============================================================================

const chatMeta: Meta<typeof PeerReviewChat> = {
  title: 'PeerReview/PeerReviewChat',
  component: PeerReviewChat,
}

export const ChatStory: StoryObj<typeof PeerReviewChat> = {
  render: () => (
    <PeerReviewChat
      messages={[
        { id: '1', author: 'alice', displayName: 'Alice', text: 'I think the answer for Q3 should mention osmosis.', timestamp: new Date(Date.now() - 120000).toISOString() },
        { id: '2', author: 'bob', displayName: 'Bob', text: 'Good point! I also noticed the diagram labels are switched.', timestamp: new Date(Date.now() - 60000).toISOString() },
        { id: '3', author: 'alice', displayName: 'Alice', text: '@AI Can you explain the difference between osmosis and diffusion?', timestamp: new Date().toISOString() },
      ]}
      onSendMessage={(text) => console.log('Send:', text)}
      currentUsername="bob"
    />
  ),
  parameters: { ...chatMeta },
}
