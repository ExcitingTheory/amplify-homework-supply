import React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { SquadCrest } from './SquadCrest'

const meta: Meta<typeof SquadCrest> = {
  title: '🏆 Gamification/Squads & Teams/Squad Crest',
  component: SquadCrest,
}
export default meta

type Story = StoryObj<typeof SquadCrest>

export const Default: Story = {
  args: { squadId: 'g1', squadName: 'Alpha Squad', totalXP: 1500 },
}

export const Large: Story = {
  args: { squadId: 'g2', squadName: 'Beta Team', totalXP: 3000, size: 'large' },
}

export const SmallNoName: Story = {
  args: { squadId: 'g3', squadName: 'Gamma', size: 'small', showName: false },
}
