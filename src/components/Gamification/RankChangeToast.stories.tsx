import React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { RankChangeToast } from './RankChangeToast'
import { expect, within } from 'storybook/test'

const meta: Meta<typeof RankChangeToast> = {
  title: '🏆 Gamification/XP & Progression/Rank Change Toast',
  component: RankChangeToast,
}
export default meta

type Story = StoryObj<typeof RankChangeToast>

export const RankUp: Story = {
  args: { open: true, positionsChanged: 3, newRank: 2, onClose: () => {} },
  play: async ({ canvasElement }) => {
    const body = within(document.body)
    // Shows rank change amount and new rank
    await body.findByText(/3|#2|rank/i)
  },
}

export const RankDown: Story = {
  args: { open: true, positionsChanged: -1, newRank: 5, onClose: () => {} },
  play: async ({ canvasElement }) => {
    const body = within(document.body)
    await body.findByText(/5|rank/i)
  },
}

export const TopRank: Story = {
  args: { open: true, positionsChanged: 1, newRank: 1, onClose: () => {} },
  play: async ({ canvasElement }) => {
    const body = within(document.body)
    // #1 rank should have special display
    await body.findByText(/#1|1|rank/i)
  },
}
