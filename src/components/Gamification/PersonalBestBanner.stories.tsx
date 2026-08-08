import React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { PersonalBestBanner } from './PersonalBestBanner'
import { expect } from 'storybook/test'

const meta: Meta<typeof PersonalBestBanner> = {
  title: '🏆 Gamification/XP & Progression/Personal Best Banner',
  component: PersonalBestBanner,
}
export default meta

type Story = StoryObj<typeof PersonalBestBanner>

export const Improvement: Story = {
  args: { open: true, newScore: 92, previousBest: 85, onClose: () => {} },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
}

export const FirstAttempt: Story = {
  args: { open: true, newScore: 78, previousBest: null, onClose: () => {} },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
}

export const PerfectScore: Story = {
  args: { open: true, newScore: 100, previousBest: 95, onClose: () => {} },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
}
