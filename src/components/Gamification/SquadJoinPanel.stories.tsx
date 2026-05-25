import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import React from 'react'
import { SquadJoinPanel } from './SquadJoinPanel'

const meta: Meta<typeof SquadJoinPanel> = {
  title: '🏆 Gamification/Squads & Teams/Squad Join Panel',
  component: SquadJoinPanel,
  parameters: {
    layout: 'padded',
  },
}

export default meta
type Story = StoryObj<typeof SquadJoinPanel>

const MOCK_SQUADS = [
  { id: 'g1', name: 'Code Warriors', totalXP: 1200, memberCount: 4, description: 'We write clean code and help each other grow.' },
  { id: 'g2', name: 'Phoenix Rising', totalXP: 980, memberCount: 3, description: 'Rising from the ashes of every failed test.' },
  { id: 'g3', name: 'The Debuggers', totalXP: 750, memberCount: 5 },
]

const MOCK_MEMBERS = [
  { id: 'm1', studentId: 'student-1', role: 'LEADER' as const, displayName: 'Alice', joinedAt: '2026-03-15T10:00:00Z' },
  { id: 'm2', studentId: 'student-2', role: 'MEMBER' as const, displayName: 'Bob', joinedAt: '2026-03-16T14:00:00Z' },
  { id: 'm3', studentId: 'student-3', role: 'MEMBER' as const, displayName: 'Charlie', joinedAt: '2026-03-17T09:00:00Z' },
  { id: 'm4', studentId: 'student-4', role: 'MEMBER' as const, displayName: 'Diana', joinedAt: '2026-03-18T11:00:00Z' },
]

/** Not in a squad — browsing available squads */
export const BrowseSquads: Story = {
  args: {
    availableSquads: MOCK_SQUADS,
    mySquad: null,
    mySquadMembers: [],
    studentId: 'student-5',
    onJoinSquad: (id) => console.log('Join squad:', id),
    onLeaveSquad: () => console.log('Leave squad'),
    level: 3,
  },
}

/** Already in a squad — viewing membership */
export const InSquad: Story = {
  args: {
    availableSquads: MOCK_SQUADS,
    mySquad: MOCK_SQUADS[0],
    mySquadMembers: MOCK_MEMBERS,
    studentId: 'student-1', // leader
    onJoinSquad: (id) => console.log('Join squad:', id),
    onLeaveSquad: () => console.log('Leave squad'),
    level: 4,
  },
}

/** In a squad as a regular member (not leader) */
export const InSquadAsMember: Story = {
  args: {
    availableSquads: MOCK_SQUADS,
    mySquad: MOCK_SQUADS[0],
    mySquadMembers: MOCK_MEMBERS,
    studentId: 'student-2', // member
    onJoinSquad: (id) => console.log('Join squad:', id),
    onLeaveSquad: () => console.log('Leave squad'),
    level: 2,
  },
}

/** No squads available */
export const EmptyState: Story = {
  args: {
    availableSquads: [],
    mySquad: null,
    mySquadMembers: [],
    studentId: 'student-new',
    onJoinSquad: (id) => console.log('Join squad:', id),
    onLeaveSquad: () => console.log('Leave squad'),
    level: 1,
  },
}

/** Loading state */
export const Loading: Story = {
  args: {
    availableSquads: MOCK_SQUADS,
    mySquad: null,
    mySquadMembers: [],
    studentId: 'student-5',
    onJoinSquad: (id) => console.log('Join squad:', id),
    onLeaveSquad: () => console.log('Leave squad'),
    isLoading: true,
    level: 3,
  },
}
