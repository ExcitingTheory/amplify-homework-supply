import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { LevelBadge } from './LevelBadge'

const meta: Meta<typeof LevelBadge> = {
  title: 'Gamification/LevelBadge',
  component: LevelBadge,
}
export default meta

type Story = StoryObj<typeof LevelBadge>

export const Beginner: Story = {
  args: {
    level: { level: 1, label: 'Beginner', xpRequired: 0, xpForNextLevel: 150, progress: 33 },
  },
}

export const Explorer: Story = {
  args: {
    level: { level: 2, label: 'Explorer', xpRequired: 150, xpForNextLevel: 400, progress: 60 },
  },
}

export const Practitioner: Story = {
  args: {
    level: { level: 3, label: 'Practitioner', xpRequired: 400, xpForNextLevel: 800, progress: 45 },
  },
}

export const Contributor: Story = {
  args: {
    level: { level: 4, label: 'Contributor', xpRequired: 800, xpForNextLevel: 1500, progress: 20 },
  },
}

export const Expert: Story = {
  args: {
    level: { level: 5, label: 'Expert', xpRequired: 1500, xpForNextLevel: 2500, progress: 80 },
  },
}

export const Master: Story = {
  args: {
    level: { level: 6, label: 'Master', xpRequired: 2500, xpForNextLevel: null, progress: 100 },
    showProgress: false,
  },
}

export const Small: Story = {
  args: {
    level: { level: 3, label: 'Practitioner', xpRequired: 400, xpForNextLevel: 800, progress: 55 },
    size: 'small',
  },
}

export const NoProgress: Story = {
  args: {
    level: { level: 4, label: 'Contributor', xpRequired: 800, xpForNextLevel: 1500, progress: 70 },
    showProgress: false,
  },
}
