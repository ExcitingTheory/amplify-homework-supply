import React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { StorybookPromoPanel } from './StorybookPromoPanel'

const meta: Meta<typeof StorybookPromoPanel> = {
  title: '🏆 Gamification/Instructor/Storybook Promo Panel',
  component: StorybookPromoPanel,
  parameters: {
    layout: 'centered',
  },
}
export default meta

type Story = StoryObj<typeof StorybookPromoPanel>

export const Default: Story = {
  args: {
    storybookUrl: 'http://localhost:6006',
    earnedBadgeTypes: new Set(),
  },
}

export const SomeBadgesEarned: Story = {
  args: {
    storybookUrl: 'http://localhost:6006',
    earnedBadgeTypes: new Set(['DOCS_EXPLORER', 'INSTRUCTOR_ONBOARD']),
  },
}

export const AllBadgesEarned: Story = {
  args: {
    storybookUrl: 'http://localhost:6006',
    earnedBadgeTypes: new Set([
      'DOCS_EXPLORER',
      'INSTRUCTOR_ONBOARD',
      'LEARNER_ONBOARD',
      'TRANSLATOR_ONBOARD',
      'A11Y_CHAMPION',
      'DOCS_CHAMPION',
    ]),
  },
}
