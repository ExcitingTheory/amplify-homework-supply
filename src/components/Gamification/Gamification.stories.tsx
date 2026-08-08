import React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { NailedItBadge } from './NailedItBadge'
import { NailedItCelebration } from './NailedItCelebration'
import { XPToast } from './XPToast'
import { HomeworkXPSummary } from './HomeworkXPSummary'
import { NailedItWall } from './NailedItWall'
import { expect } from 'storybook/test'

// =============================================================================
// NailedItBadge Stories
// =============================================================================

const badgeMeta: Meta<typeof NailedItBadge> = {
  title: '🏆 Gamification/Badges & Celebrations/Nailed-It Badge',
  component: NailedItBadge,
}
export default badgeMeta

type BadgeStory = StoryObj<typeof NailedItBadge>

export const Default: BadgeStory = {
  args: {},
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
}

export const CustomSize: BadgeStory = {
  args: {
    size: 'medium',
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
}

// =============================================================================
// NailedItCelebration Stories
// =============================================================================

const celebrationMeta: Meta<typeof NailedItCelebration> = {
  title: '🏆 Gamification/Badges & Celebrations/Nailed-It Celebration',
  component: NailedItCelebration,
}

export const CelebrationOpen: StoryObj<typeof NailedItCelebration> = {
  render: () => (
    <NailedItCelebration
      open={true}
      nailedItReason="You showed deep understanding of cell biology!"
      onClose={() => {}}
    />
  ),
  parameters: { ...celebrationMeta },
}

// =============================================================================
// XPToast Stories
// =============================================================================

const xpToastMeta: Meta<typeof XPToast> = {
  title: '🏆 Gamification/XP & Progression/XP Toast',
  component: XPToast,
}

export const XPToastOpen: StoryObj<typeof XPToast> = {
  render: () => (
    <XPToast
      open={true}
      xpAmount={50}
      xpReason="Homework submitted"
      onClose={() => {}}
    />
  ),
  parameters: { ...xpToastMeta },
}

// =============================================================================
// HomeworkXPSummary Stories
// =============================================================================

const xpSummaryMeta: Meta<typeof HomeworkXPSummary> = {
  title: '🏆 Gamification/XP & Progression/Homework XP Summary',
  component: HomeworkXPSummary,
}

export const XPSummaryStory: StoryObj<typeof HomeworkXPSummary> = {
  render: () => (
    <HomeworkXPSummary
      lineItems={[
        { label: 'Homework submitted', xp: 50 },
        { label: 'All blocks complete', xp: 100 },
        { label: 'On-time submission', xp: 15 },
      ]}
      totalXP={165}
      cumulativeXP={1250}
    />
  ),
  parameters: { ...xpSummaryMeta },
}

// =============================================================================
// NailedItWall Stories
// =============================================================================

const wallMeta: Meta<typeof NailedItWall> = {
  title: '🏆 Gamification/Badges & Celebrations/Nailed-It Wall',
  component: NailedItWall,
}

export const WallStory: StoryObj<typeof NailedItWall> = {
  render: () => (
    <NailedItWall
      blocks={[
        { id: '1', question: 'Explain the process of photosynthesis', nailedItReason: 'Perfect photosynthesis analysis', homeworkTitle: 'Biology 101', createdAt: new Date().toISOString() },
        { id: '2', question: 'Describe French seasonal vocabulary', nailedItReason: 'Excellent vocabulary usage', homeworkTitle: 'French Basics', createdAt: new Date(Date.now() - 86400000).toISOString() },
        { id: '3', question: 'How does the water cycle work?', nailedItReason: 'Deep understanding of water cycle', homeworkTitle: 'Earth Science', createdAt: new Date(Date.now() - 172800000).toISOString() },
      ]}
    />
  ),
  parameters: { ...wallMeta },
}
