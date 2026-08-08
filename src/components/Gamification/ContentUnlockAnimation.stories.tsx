import React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { ContentUnlockAnimation } from './ContentUnlockAnimation'
import { expect } from 'storybook/test'

const meta: Meta<typeof ContentUnlockAnimation> = {
  title: '🏆 Gamification/XP & Progression/Content Unlock Animation',
  component: ContentUnlockAnimation,
}
export default meta

type Story = StoryObj<typeof ContentUnlockAnimation>

export const Playing: Story = {
  args: { show: true, title: 'Advanced Biology' },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
}

export const Idle: Story = {
  args: { show: false, title: 'Advanced Biology' },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
}
