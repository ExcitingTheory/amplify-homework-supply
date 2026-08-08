import React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn, expect, userEvent, within } from 'storybook/test'
import { ContentLockCard } from './ContentLockCard'

const meta: Meta<typeof ContentLockCard> = {
  title: '🏆 Gamification/XP & Progression/Content Lock Card',
  component: ContentLockCard,
}
export default meta

type Story = StoryObj<typeof ContentLockCard>

export const LockedByXP: Story = {
  args: { title: 'Advanced Module', isLocked: true, requiredXP: 500, currentXP: 200 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByText('Advanced Module')
    // Lock indicator shows XP requirement
    await canvas.findByText(/500|XP/i)
  },
}

export const LockedByBadge: Story = {
  args: { title: 'Expert Content', isLocked: true, requiredBadge: 'Sharpshooter' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByText('Expert Content')
    await canvas.findByText(/Sharpshooter/i)
  },
}

export const LockedByCompletion: Story = {
  args: { title: 'Final Project', isLocked: true, requiredCompletion: 75, currentCompletion: 50 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByText('Final Project')
    await canvas.findByText(/75|completion/i)
  },
}

export const Unlocked: Story = {
  render: () => (
    <ContentLockCard title="Bonus Content" isLocked={false}>
      <div style={{ padding: 16 }}>This content is now available!</div>
    </ContentLockCard>
  ),
  play: async ({ canvasElement }) => {
    // Verify the card renders with its child content
    expect(canvasElement.textContent).toMatch(/now available/i)
  },
}
