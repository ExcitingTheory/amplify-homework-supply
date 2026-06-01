import React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { ContentUnlockAnimation } from './ContentUnlockAnimation'

const meta: Meta<typeof ContentUnlockAnimation> = {
  title: '🏆 Gamification/XP & Progression/Content Unlock Animation',
  component: ContentUnlockAnimation,
}
export default meta

type Story = StoryObj<typeof ContentUnlockAnimation>

export const Playing: Story = {
  args: { show: true, title: 'Advanced Biology' },
}

export const Idle: Story = {
  args: { show: false, title: 'Advanced Biology' },
}
