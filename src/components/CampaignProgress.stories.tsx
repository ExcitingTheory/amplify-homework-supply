import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { CampaignProgress } from './CampaignProgress'

const meta: Meta<typeof CampaignProgress> = {
  title: '🏆 Gamification/Student/Campaign Progress',
  component: CampaignProgress,
}
export default meta

type Story = StoryObj<typeof CampaignProgress>

/** Active campaign in progress */
export const InProgress: Story = {
  args: {
    title: 'The Algorithm Dragon',
    setting: 'In a world where bugs roam free and code entropy threatens all, a brave team of developers must band together to defeat the Algorithm Dragon before it corrupts the entire codebase.',
    stakes: 'If the dragon wins, everyone loses a streak freeze and 50 XP!',
    currentXP: 1350,
    targetXP: 2000,
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    bonusMultiplier: 2.0,
    active: true,
    chapters: [
      { id: 'ch1', title: 'The Gathering', order: 1, completed: true, xpRequired: 200 },
      { id: 'ch2', title: 'Into the Bug Forest', order: 2, completed: true, xpRequired: 500 },
      { id: 'ch3', title: 'The Dragon\'s Lair', order: 3, completed: false, xpRequired: 1000 },
      { id: 'ch4', title: 'Final Battle', order: 4, completed: false, xpRequired: 2000 },
    ],
  },
}

/** Completed campaign */
export const Completed: Story = {
  args: {
    title: 'Sprint to Victory',
    setting: 'The sprint deadline approaches and only maximum effort will save the release.',
    currentXP: 1200,
    targetXP: 1000,
    active: false,
    chapters: [
      { id: 'ch1', title: 'Planning Phase', order: 1, completed: true },
      { id: 'ch2', title: 'Development Sprint', order: 2, completed: true },
      { id: 'ch3', title: 'Code Review', order: 3, completed: true },
    ],
  },
}

/** Urgent — deadline soon */
export const UrgentDeadline: Story = {
  args: {
    title: 'The Midnight Challenge',
    setting: 'Time is running out...',
    stakes: 'Miss the deadline and all progress resets!',
    currentXP: 750,
    targetXP: 1000,
    deadline: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours
    bonusMultiplier: 3.0,
    active: true,
  },
}

/** No chapters — simple progress bar only */
export const SimpleProgress: Story = {
  args: {
    title: 'Weekly XP Goal',
    currentXP: 450,
    targetXP: 1000,
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    active: true,
  },
}

/** Ended campaign */
export const EndedCampaign: Story = {
  args: {
    title: 'The Legacy Refactor',
    setting: 'An ancient codebase needs modern patterns.',
    stakes: 'Technical debt grows with each passing day.',
    currentXP: 3200,
    targetXP: 5000,
    active: false,
    chapters: [
      { id: 'ch1', title: 'Discovery', order: 1, completed: true },
      { id: 'ch2', title: 'Refactoring', order: 2, completed: true },
      { id: 'ch3', title: 'Testing', order: 3, completed: false },
      { id: 'ch4', title: 'Deployment', order: 4, completed: false },
    ],
  },
}
