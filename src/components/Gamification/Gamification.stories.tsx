import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { NailedItBadge } from './NailedItBadge'
import { NailedItCelebration } from './NailedItCelebration'
import { XPToast } from './XPToast'
import { HomeworkXPSummary } from './HomeworkXPSummary'
import { NailedItWall } from './NailedItWall'

// =============================================================================
// NailedItBadge Stories
// =============================================================================

const badgeMeta: Meta<typeof NailedItBadge> = {
  title: 'Gamification/NailedItBadge',
  component: NailedItBadge,
}
export default badgeMeta

type BadgeStory = StoryObj<typeof NailedItBadge>

export const Default: BadgeStory = {
  args: {
    reason: 'Exceptional analysis of photosynthesis!',
  },
}

export const CustomSize: BadgeStory = {
  args: {
    reason: 'Perfect score on vocabulary quiz',
    size: 64,
  },
}

// =============================================================================
// NailedItCelebration Stories
// =============================================================================

const celebrationMeta: Meta<typeof NailedItCelebration> = {
  title: 'Gamification/NailedItCelebration',
  component: NailedItCelebration,
}

export const CelebrationOpen: StoryObj<typeof NailedItCelebration> = {
  render: () => (
    <NailedItCelebration
      open={true}
      reason="You showed deep understanding of cell biology!"
      xpAwarded={20}
      onClose={() => {}}
    />
  ),
  parameters: { ...celebrationMeta },
}

// =============================================================================
// XPToast Stories
// =============================================================================

const xpToastMeta: Meta<typeof XPToast> = {
  title: 'Gamification/XPToast',
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
  title: 'Gamification/HomeworkXPSummary',
  component: HomeworkXPSummary,
}

export const XPSummaryStory: StoryObj<typeof HomeworkXPSummary> = {
  render: () => (
    <HomeworkXPSummary
      xpEarned={[
        { reason: 'Homework submitted', amount: 50 },
        { reason: 'All blocks complete', amount: 100 },
        { reason: 'On-time submission', amount: 15 },
      ]}
      totalXP={1250}
      level={{ level: 5, label: 'Scholar', xpRequired: 1000, xpForNextLevel: 2000, progress: 25 }}
    />
  ),
  parameters: { ...xpSummaryMeta },
}

// =============================================================================
// NailedItWall Stories
// =============================================================================

const wallMeta: Meta<typeof NailedItWall> = {
  title: 'Gamification/NailedItWall',
  component: NailedItWall,
}

export const WallStory: StoryObj<typeof NailedItWall> = {
  render: () => (
    <NailedItWall
      entries={[
        { id: '1', studentName: 'Alice', reason: 'Perfect photosynthesis analysis', awardedAt: new Date().toISOString(), unitName: 'Biology 101' },
        { id: '2', studentName: 'Bob', reason: 'Excellent vocabulary usage', awardedAt: new Date(Date.now() - 86400000).toISOString(), unitName: 'French Basics' },
        { id: '3', studentName: 'Charlie', reason: 'Deep understanding of water cycle', awardedAt: new Date(Date.now() - 172800000).toISOString(), unitName: 'Earth Science' },
      ]}
    />
  ),
  parameters: { ...wallMeta },
}
