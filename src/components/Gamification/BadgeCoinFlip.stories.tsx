import React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { BadgeCoinFlip } from './BadgeCoinFlip'

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
}

export const FirstSteps: Story = {
  args: {
    open: true,
    badgeType: 'FIRST_SUBMISSION',
    badgeName: 'First Steps',
    badgeDescription: 'Submitted your first assignment',
    onClose: () => {},
  },
}
