import React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { StreakShield } from './StreakShield'
import { expect } from 'storybook/test'

const meta: Meta<typeof StreakShield> = {
  title: '🏆 Gamification/Streaks/Streak Shield',
  component: StreakShield,
}
export default meta

type Story = StoryObj<typeof StreakShield>

export const WithFreezes: Story = {
  args: { freezesRemaining: 3, freezesUsed: 1 },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
}

export const NoFreezes: Story = {
  args: { freezesRemaining: 0, freezesUsed: 2 },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
}

export const SmallSize: Story = {
  args: { freezesRemaining: 2, size: 'small' },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
}
