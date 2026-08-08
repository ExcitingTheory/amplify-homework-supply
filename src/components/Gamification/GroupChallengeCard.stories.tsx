import React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { GroupChallengeCard } from './GroupChallengeCard'
import { expect } from 'storybook/test'

const meta: Meta<typeof GroupChallengeCard> = {
  title: '🏆 Gamification/Squads & Teams/Group Challenge Card',
  component: GroupChallengeCard,
}
export default meta

type Story = StoryObj<typeof GroupChallengeCard>

export const Active: Story = {
  args: { title: 'Weekly Sprint', targetXP: 1000, currentXP: 600, active: true, bonusMultiplier: 1.5 },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
}

export const Completed: Story = {
  args: { title: 'Finish Line', targetXP: 500, currentXP: 500, active: false, bonusMultiplier: 2 },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
}

export const WithDeadline: Story = {
  args: {
    title: 'Timed Sprint',
    targetXP: 800,
    currentXP: 200,
    active: true,
    deadline: new Date(Date.now() + 2 * 86400000).toISOString(),
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
}

export const JustStarted: Story = {
  args: { title: 'New Challenge', targetXP: 2000, currentXP: 0, active: true },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
}
