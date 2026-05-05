import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { GuildCrest } from './GuildCrest'

const meta: Meta<typeof GuildCrest> = {
  title: '🏆 Gamification/Guilds & Teams/Guild Crest',
  component: GuildCrest,
}
export default meta

type Story = StoryObj<typeof GuildCrest>

export const Default: Story = {
  args: { guildId: 'g1', guildName: 'Alpha Squad', totalXP: 1500 },
}

export const Large: Story = {
  args: { guildId: 'g2', guildName: 'Beta Team', totalXP: 3000, size: 'large' },
}

export const SmallNoName: Story = {
  args: { guildId: 'g3', guildName: 'Gamma', size: 'small', showName: false },
}
