import React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { BadgeCoinFlip } from './BadgeCoinFlip'
import { expect } from 'storybook/test'

const meta: Meta<typeof BadgeCoinFlip> = {
  title: '🏆 Gamification/Badges & Celebrations/Badge Coin Flip',
  component: BadgeCoinFlip,
}
export default meta

type Story = StoryObj<typeof BadgeCoinFlip>

export const Sharpshooter: Story = {
  args: {
    open: true,
    badgeType: 'SHARPSHOOTER',
    badgeName: 'Sharpshooter',
    badgeDescription: '3 perfect scores in a row',
    onClose: () => {},
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
}

export const FirstSteps: Story = {
  args: {
    open: true,
    badgeType: 'FIRST_SUBMISSION',
    badgeName: 'First Steps',
    badgeDescription: 'Submitted your first assignment',
    onClose: () => {},
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
}
