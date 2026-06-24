import React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn } from 'storybook/test'
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
