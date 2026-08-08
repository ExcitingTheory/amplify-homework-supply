import React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { RankChangeToast } from './RankChangeToast'
import { expect } from 'storybook/test'

const meta: Meta<typeof RankChangeToast> = {
  title: '🏆 Gamification/XP & Progression/Rank Change Toast',
  component: RankChangeToast,
}
export default meta

type Story = StoryObj<typeof RankChangeToast>

export const RankUp: Story = {
  args: { open: true, positionsChanged: 3, newRank: 2, onClose: () => {} },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
}

export const RankDown: Story = {
  args: { open: true, positionsChanged: -1, newRank: 5, onClose: () => {} },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
}

export const TopRank: Story = {
  args: { open: true, positionsChanged: 1, newRank: 1, onClose: () => {} },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
}
