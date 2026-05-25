import React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { StreakIndicator } from './StreakIndicator'

const meta: Meta<typeof StreakIndicator> = {
  title: '🏆 Gamification/Streaks/Streak Indicator',
  component: StreakIndicator,
}
export default meta

type Story = StoryObj<typeof StreakIndicator>

export const Active5Day: Story = {
  args: { currentStreak: 5 },
}

export const NoStreak: Story = {
  args: { currentStreak: 0 },
}

export const Milestone7Day: Story = {
  args: { currentStreak: 7 },
}

export const LongStreak: Story = {
  args: { currentStreak: 30 },
}

export const SmallSize: Story = {
  args: { currentStreak: 3, size: 'small' },
}
