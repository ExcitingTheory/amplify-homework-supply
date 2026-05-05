import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { GuildJoinPanel } from './GuildJoinPanel'

const meta: Meta<typeof GuildJoinPanel> = {
  title: '🏆 Gamification/Guilds & Teams/Guild Join Panel',
  component: GuildJoinPanel,
  parameters: {
    layout: 'padded',
  },
}

export default meta
type Story = StoryObj<typeof GuildJoinPanel>

const MOCK_GUILDS = [
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

/** Not in a guild — browsing available guilds */
export const BrowseGuilds: Story = {
  args: {
    availableGuilds: MOCK_GUILDS,
    myGuild: null,
    myGuildMembers: [],
    studentId: 'student-5',
    onJoinGuild: (id) => console.log('Join guild:', id),
    onLeaveGuild: () => console.log('Leave guild'),
    level: 3,
  },
}

/** Already in a guild — viewing membership */
export const InGuild: Story = {
  args: {
    availableGuilds: MOCK_GUILDS,
    myGuild: MOCK_GUILDS[0],
    myGuildMembers: MOCK_MEMBERS,
    studentId: 'student-1', // leader
    onJoinGuild: (id) => console.log('Join guild:', id),
    onLeaveGuild: () => console.log('Leave guild'),
    level: 4,
  },
}

/** In a guild as a regular member (not leader) */
export const InGuildAsMember: Story = {
  args: {
    availableGuilds: MOCK_GUILDS,
    myGuild: MOCK_GUILDS[0],
    myGuildMembers: MOCK_MEMBERS,
    studentId: 'student-2', // member
    onJoinGuild: (id) => console.log('Join guild:', id),
    onLeaveGuild: () => console.log('Leave guild'),
    level: 2,
  },
}

/** No guilds available */
export const EmptyState: Story = {
  args: {
    availableGuilds: [],
    myGuild: null,
    myGuildMembers: [],
    studentId: 'student-new',
    onJoinGuild: (id) => console.log('Join guild:', id),
    onLeaveGuild: () => console.log('Leave guild'),
    level: 1,
  },
}

/** Loading state */
export const Loading: Story = {
  args: {
    availableGuilds: MOCK_GUILDS,
    myGuild: null,
    myGuildMembers: [],
    studentId: 'student-5',
    onJoinGuild: (id) => console.log('Join guild:', id),
    onLeaveGuild: () => console.log('Leave guild'),
    isLoading: true,
    level: 3,
  },
}
