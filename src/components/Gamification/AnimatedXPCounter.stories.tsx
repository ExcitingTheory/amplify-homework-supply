import React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { AnimatedXPCounter } from './AnimatedXPCounter'

const meta: Meta<typeof AnimatedXPCounter> = {
  title: '🏆 Gamification/XP & Progression/Animated XP Counter',
  component: AnimatedXPCounter,
}
export default meta

type Story = StoryObj<typeof AnimatedXPCounter>

export const Default: Story = {
  args: { targetValue: 500 },
}

export const Large: Story = {
  args: { targetValue: 2500, variant: 'h4' },
}

export const Zero: Story = {
  args: { targetValue: 0 },
}
