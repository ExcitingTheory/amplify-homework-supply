import React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import PracticeDrillProgress from './PracticeDrillProgress'
import type { PracticeDrillProgressProps } from './PracticeDrillProgress'

const meta: Meta<PracticeDrillProgressProps> = {
  title: '🎯 Practice Drills/Progress',
  component: PracticeDrillProgress,
  argTypes: {
    blocksCompleted: { control: { type: 'range', min: 0, max: 20 } },
    blockCount: { control: { type: 'range', min: 1, max: 20 } },
    xpEarned: { control: { type: 'number' } },
    xpDiminished: { control: 'boolean' },
    streakCount: { control: { type: 'number' } },
  },
}

export default meta
type Story = StoryObj<PracticeDrillProgressProps>

export const Default: Story = {
  args: {
    blocksCompleted: 3,
    blockCount: 10,
    xpEarned: 25,
    xpDiminished: false,
  },
}

export const HalfComplete: Story = {
  args: {
    blocksCompleted: 5,
    blockCount: 10,
    xpEarned: 30,
    xpDiminished: false,
    streakCount: 3,
  },
}

export const AllComplete: Story = {
  args: {
    blocksCompleted: 10,
    blockCount: 10,
    xpEarned: 45,
    xpDiminished: false,
    streakCount: 7,
  },
}

export const DiminishedXP: Story = {
  args: {
    blocksCompleted: 2,
    blockCount: 10,
    xpEarned: 8,
    xpDiminished: true,
  },
}

export const WithStreak: Story = {
  args: {
    blocksCompleted: 0,
    blockCount: 10,
    xpEarned: 0,
    xpDiminished: false,
    streakCount: 14,
  },
}
