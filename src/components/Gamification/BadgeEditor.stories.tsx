import React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn, expect, userEvent, within } from 'storybook/test'
import { BadgeEditor } from './BadgeEditor'

const meta: Meta<typeof BadgeEditor> = {
  title: '🏆 Gamification/Instructor/Badge Editor',
  component: BadgeEditor,
}
export default meta

type Story = StoryObj<typeof BadgeEditor>

export const Default: Story = {
  args: {
    overrides: [],
    customBadges: [],
    onOverrideChange: fn(),
    onOverrideReset: fn(),
    onAddCustomBadge: fn(),
    onDeleteCustomBadge: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Click "New Badge" to open the create form
    const newBadgeBtn = await canvas.findByRole('button', { name: /New Badge/i })
    await userEvent.click(newBadgeBtn)
    // Form should now be visible — Cancel becomes available
    await expect(await canvas.findByRole('button', { name: /Cancel/i })).toBeInTheDocument()
  },
}

export const WithCustomBadges: Story = {
  args: {
    overrides: [{ badgeType: 'HOMEWORK_SUBMITTED', threshold: 5, rarity: 'rare' }],
    customBadges: [
      {
        id: 'custom-1',
        name: 'Star Reader',
        description: 'Awarded for reading 10 homework assignments',
        event: 'HOMEWORK_SUBMITTED',
        threshold: 10,
        rarity: 'epic',
      },
    ],
    onOverrideChange: fn(),
    onOverrideReset: fn(),
    onAddCustomBadge: fn(),
    onDeleteCustomBadge: fn(),
  },
}
