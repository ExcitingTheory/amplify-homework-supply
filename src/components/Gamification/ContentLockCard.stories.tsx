import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { ContentLockCard } from './ContentLockCard'

const meta: Meta<typeof ContentLockCard> = {
  title: '🏆 Gamification/XP & Progression/Content Lock Card',
  component: ContentLockCard,
}
export default meta

type Story = StoryObj<typeof ContentLockCard>

export const LockedByXP: Story = {
  args: { title: 'Advanced Module', isLocked: true, requiredXP: 500, currentXP: 200 },
}

export const LockedByBadge: Story = {
  args: { title: 'Expert Content', isLocked: true, requiredBadge: 'Sharpshooter' },
}

export const LockedByCompletion: Story = {
  args: { title: 'Final Project', isLocked: true, requiredCompletion: 75, currentCompletion: 50 },
}

export const Unlocked: Story = {
  render: () => (
    <ContentLockCard title="Bonus Content" isLocked={false}>
      <div style={{ padding: 16 }}>This content is now available!</div>
    </ContentLockCard>
  ),
}
