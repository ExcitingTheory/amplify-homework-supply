import React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { EasterEggToast } from './EasterEggToast'

const meta: Meta<typeof EasterEggToast> = {
  title: '🏆 Gamification/Easter Eggs/Easter Egg Toast',
  component: EasterEggToast,
}
export default meta

type Story = StoryObj<typeof EasterEggToast>

export const Found: Story = {
  args: { open: true, message: 'You found the hidden treasure!', xpReward: 30, onClose: () => {} },
}

export const HighReward: Story = {
  args: { open: true, message: 'Secret passage discovered!', xpReward: 100, onClose: () => {} },
}
