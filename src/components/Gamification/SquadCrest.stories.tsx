import React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { SquadCrest } from './SquadCrest'
import { expect, within } from 'storybook/test'

const meta: Meta<typeof SquadCrest> = {
  title: '🏆 Gamification/Squads & Teams/Squad Crest',
  component: SquadCrest,
}
export default meta

type Story = StoryObj<typeof SquadCrest>

export const Default: Story = {
  args: { squadId: 'g1', squadName: 'Alpha Squad', totalXP: 1500 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Crest renders with squad name
    await canvas.findByText(/Alpha Squad/)
    // Avatar shows initials
    await canvas.findByText('AS')
  },
}

export const Large: Story = {
  args: { squadId: 'g2', squadName: 'Beta Team', totalXP: 3000, size: 'large' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByText(/Beta Team/)
    await canvas.findByText('BT')
  },
}

export const SmallNoName: Story = {
  args: { squadId: 'g3', squadName: 'Gamma', size: 'small', showName: false },
  play: async ({ canvasElement }) => {
    // Squad name not visible when showName=false
    expect(canvasElement.textContent).not.toContain('Gamma')
    // But avatar initials still render
    const avatar = canvasElement.querySelector('.MuiAvatar-root')
    expect(avatar).not.toBeNull()
  },
}
