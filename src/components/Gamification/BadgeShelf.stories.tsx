import React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { BadgeShelf } from './BadgeShelf'
import type { EarnedBadge } from './BadgeShelf'
import { expect } from 'storybook/test'

const meta: Meta<typeof BadgeShelf> = {
  title: '🏆 Gamification/Badges & Celebrations/Badge Shelf',
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
  // Avatar unlock badges
  { badgeType: 'AVATAR_COLORS', awardedAt: '2025-04-05T10:00:00Z' },
  { badgeType: 'AVATAR_DETAILED', awardedAt: '2025-04-10T10:00:00Z' },
  { badgeType: 'AVATAR_ACCESSORIES', awardedAt: '2025-04-15T10:00:00Z' },
  { badgeType: 'AVATAR_PORTRAIT', awardedAt: '2025-04-20T10:00:00Z' },
  // Bot Whisperer badges
  { badgeType: 'BOT_WHISPERER_I', awardedAt: '2025-02-05T10:00:00Z' },
  { badgeType: 'BOT_WHISPERER_II', awardedAt: '2025-03-15T10:00:00Z' },
  { badgeType: 'BOT_WHISPERER_III', awardedAt: '2025-04-08T10:00:00Z' },
  { badgeType: 'BOT_WHISPERER_IV', awardedAt: '2025-04-25T10:00:00Z' },
]

export const AllEarned: Story = {
  args: {
    earnedBadges: allBadges,
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
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
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
}

export const Empty: Story = {
  args: {
    earnedBadges: [],
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
}

export const TwoColumns: Story = {
  args: {
    earnedBadges: allBadges.slice(0, 4),
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
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
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
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
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
}

export const EarnedOnlyEmpty: Story = {
  args: {
    earnedBadges: [],
    earnedOnly: true,
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
}

/** Mid-game student: some avatar unlocks earned, Bot Whisperer progression started. */
export const AvatarProgression: Story = {
  args: {
    earnedBadges: [
      { badgeType: 'FIRST_SUBMISSION', awardedAt: '2025-01-15T10:00:00Z' },
      { badgeType: 'CONSISTENT', awardedAt: '2025-02-15T09:00:00Z' },
      // Avatar: reached L3 (colors + detailed style unlocked)
      { badgeType: 'AVATAR_COLORS', awardedAt: '2025-02-20T10:00:00Z' },
      { badgeType: 'AVATAR_DETAILED', awardedAt: '2025-03-01T10:00:00Z' },
      // Bot: Whisperer I + II earned so far
      { badgeType: 'BOT_WHISPERER_I', awardedAt: '2025-02-05T10:00:00Z' },
      { badgeType: 'BOT_WHISPERER_II', awardedAt: '2025-03-15T10:00:00Z' },
    ],
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
}
