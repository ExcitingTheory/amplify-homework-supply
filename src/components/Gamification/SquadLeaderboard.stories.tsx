import React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { SquadLeaderboard } from './SquadLeaderboard'
import { expect } from 'storybook/test'

const meta: Meta<typeof SquadLeaderboard> = {
  title: '🏆 Gamification/Squads & Teams/Squad Leaderboard',
  component: SquadLeaderboard,
}
export default meta

type Story = StoryObj<typeof SquadLeaderboard>

export const Full: Story = {
  args: {
    squads: [
      { id: 'g1', name: 'Alpha Squad', totalXP: 2500, memberCount: 5 },
      { id: 'g2', name: 'Beta Team', totalXP: 1800, memberCount: 4 },
      { id: 'g3', name: 'Gamma Force', totalXP: 1200, memberCount: 3 },
      { id: 'g4', name: 'Delta Unit', totalXP: 800, memberCount: 6 },
    ],
    mySquadId: 'g2',
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
}

export const NoHighlight: Story = {
  args: {
    squads: [
      { id: 'g1', name: 'Alpha', totalXP: 1000, memberCount: 3 },
      { id: 'g2', name: 'Beta', totalXP: 750, memberCount: 4 },
    ],
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
}

export const Empty: Story = {
  args: { squads: [] },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
}
