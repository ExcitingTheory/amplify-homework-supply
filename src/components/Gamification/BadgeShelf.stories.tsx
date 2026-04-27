import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { BadgeShelf } from './BadgeShelf'
import type { EarnedBadge } from './BadgeShelf'

const meta: Meta<typeof BadgeShelf> = {
  title: 'Gamification/BadgeShelf',
  component: BadgeShelf,
}
export default meta

type Story = StoryObj<typeof BadgeShelf>

const allBadges: EarnedBadge[] = [
  { badgeType: 'FIRST_SUBMISSION', awardedAt: '2025-01-15T10:00:00Z' },
  { badgeType: 'GOOD_EYE', awardedAt: '2025-01-20T14:30:00Z' },
  { badgeType: 'QUICK_DRAW', awardedAt: '2025-02-01T08:00:00Z' },
  { badgeType: 'SHARPSHOOTER', awardedAt: '2025-02-10T11:00:00Z' },
  { badgeType: 'CONSISTENT', awardedAt: '2025-02-15T09:00:00Z' },
  { badgeType: 'TEAM_PLAYER', awardedAt: '2025-03-01T16:00:00Z' },
  { badgeType: 'DEEP_THINKER', awardedAt: '2025-03-10T12:00:00Z' },
  { badgeType: 'TOP_OF_CLASS', awardedAt: '2025-03-20T10:00:00Z' },
  { badgeType: 'PERFECTIONIST', awardedAt: '2025-04-01T15:00:00Z' },
]

export const AllEarned: Story = {
  args: {
    earnedBadges: allBadges,
  },
}

export const PartiallyEarned: Story = {
  args: {
    earnedBadges: [
      { badgeType: 'FIRST_SUBMISSION', awardedAt: '2025-01-15T10:00:00Z' },
      { badgeType: 'GOOD_EYE', awardedAt: '2025-01-20T14:30:00Z' },
      { badgeType: 'TEAM_PLAYER', awardedAt: '2025-02-01T08:00:00Z' },
    ],
  },
}

export const Empty: Story = {
  args: {
    earnedBadges: [],
  },
}

export const TwoColumns: Story = {
  args: {
    earnedBadges: allBadges.slice(0, 4),
    columns: 2,
  },
}

export const EarnedOnly: Story = {
  args: {
    earnedBadges: [
      { badgeType: 'FIRST_SUBMISSION', awardedAt: '2025-01-15T10:00:00Z' },
      { badgeType: 'GOOD_EYE', awardedAt: '2025-01-20T14:30:00Z' },
      { badgeType: 'TEAM_PLAYER', awardedAt: '2025-02-01T08:00:00Z' },
    ],
    earnedOnly: true,
  },
}

export const WithMultipliers: Story = {
  args: {
    earnedBadges: [
      { badgeType: 'FIRST_SUBMISSION', awardedAt: '2025-01-15T10:00:00Z', sourceId: 'unit-a' },
      { badgeType: 'FIRST_SUBMISSION', awardedAt: '2025-02-01T10:00:00Z', sourceId: 'unit-b' },
      { badgeType: 'FIRST_SUBMISSION', awardedAt: '2025-03-01T10:00:00Z', sourceId: 'unit-c' },
      { badgeType: 'GOOD_EYE', awardedAt: '2025-01-20T14:30:00Z', sourceId: 'unit-a' },
      { badgeType: 'GOOD_EYE', awardedAt: '2025-02-20T14:30:00Z', sourceId: 'unit-b' },
      { badgeType: 'PERFECTIONIST', awardedAt: '2025-04-01T15:00:00Z', sourceId: 'unit-a' },
    ],
    earnedOnly: true,
  },
}

export const EarnedOnlyEmpty: Story = {
  args: {
    earnedBadges: [],
    earnedOnly: true,
  },
}
