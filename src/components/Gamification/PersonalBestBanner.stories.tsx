import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { PersonalBestBanner } from './PersonalBestBanner'

const meta: Meta<typeof PersonalBestBanner> = {
  title: '🏆 Gamification/XP & Progression/Personal Best Banner',
  component: PersonalBestBanner,
}
export default meta

type Story = StoryObj<typeof PersonalBestBanner>

export const Improvement: Story = {
  args: { open: true, newScore: 92, previousBest: 85, onClose: () => {} },
}

export const FirstAttempt: Story = {
  args: { open: true, newScore: 78, previousBest: null, onClose: () => {} },
}

export const PerfectScore: Story = {
  args: { open: true, newScore: 100, previousBest: 95, onClose: () => {} },
}
