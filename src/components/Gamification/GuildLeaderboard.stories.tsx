import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { GuildLeaderboard } from './GuildLeaderboard'

const meta: Meta<typeof GuildLeaderboard> = {
  title: '🏆 Gamification/Guilds & Teams/Guild Leaderboard',
  component: GuildLeaderboard,
}
export default meta

type Story = StoryObj<typeof GuildLeaderboard>

export const Full: Story = {
  args: {
    guilds: [
      { id: 'g1', name: 'Alpha Squad', totalXP: 2500, memberCount: 5 },
      { id: 'g2', name: 'Beta Team', totalXP: 1800, memberCount: 4 },
      { id: 'g3', name: 'Gamma Force', totalXP: 1200, memberCount: 3 },
      { id: 'g4', name: 'Delta Unit', totalXP: 800, memberCount: 6 },
    ],
    myGuildId: 'g2',
  },
}

export const NoHighlight: Story = {
  args: {
    guilds: [
      { id: 'g1', name: 'Alpha', totalXP: 1000, memberCount: 3 },
      { id: 'g2', name: 'Beta', totalXP: 750, memberCount: 4 },
    ],
  },
}

export const Empty: Story = {
  args: { guilds: [] },
}
