import type { Meta, StoryObj } from '@storybook/react'
import { expect, userEvent, within } from 'storybook/test'
import { fn } from 'storybook/test'
import { BossBattleProgress } from './BossBattleProgress'

const meta: Meta<typeof BossBattleProgress> = {
  title: '🏆 Gamification/Instructor/Boss Battle Progress',
  component: BossBattleProgress,
  tags: ['autodocs'],
  args: {
    onToggleActive: fn(),
    onDelete: fn(),
  },
}
export default meta

type Story = StoryObj<typeof BossBattleProgress>

/** Active battle at 50% progress */
export const HalfProgress: Story = {
  args: {
    id: 'boss-1',
    title: 'The Algorithm Dragon',
    currentXP: 500,
    targetXP: 1000,
    active: true,
    bonusMultiplier: 1.5,
    setting: 'A fortress of infinite loops and recursive nightmares.',
    stakes: 'If the team fails, everyone loses a streak freeze.',
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    contributors: [
      { studentId: 's1', displayName: 'Alice', xpContributed: 200 },
      { studentId: 's2', displayName: 'Bob', xpContributed: 150 },
      { studentId: 's3', displayName: 'Charlie', xpContributed: 100 },
      { studentId: 's4', displayName: 'Diana', xpContributed: 50 },
    ],
  },
}

/** Nearly complete — 95% */
export const NearlyComplete: Story = {
  args: {
    id: 'boss-2',
    title: 'The Syntax Serpent',
    currentXP: 950,
    targetXP: 1000,
    active: true,
    bonusMultiplier: 2.0,
    deadline: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(), // 1 hour
    contributors: [
      { studentId: 's1', displayName: 'Alice', xpContributed: 400 },
      { studentId: 's2', displayName: 'Bob', xpContributed: 350 },
      { studentId: 's3', displayName: 'Charlie', xpContributed: 200 },
    ],
  },
}

/** Completed battle */
export const Completed: Story = {
  args: {
    id: 'boss-3',
    title: 'The Memory Leak Monster',
    currentXP: 1200,
    targetXP: 1000,
    active: true,
    bonusMultiplier: 1.5,
    contributors: [
      { studentId: 's1', displayName: 'Alice', xpContributed: 500 },
      { studentId: 's2', displayName: 'Bob', xpContributed: 400 },
      { studentId: 's3', displayName: 'Charlie', xpContributed: 300 },
    ],
  },
}

/** Expired deadline */
export const Expired: Story = {
  args: {
    id: 'boss-4',
    title: 'The Deadline Demon',
    currentXP: 300,
    targetXP: 1000,
    active: true,
    deadline: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    setting: 'Time has run out in the Clock Tower...',
  },
}

/** Inactive/paused battle */
export const Inactive: Story = {
  args: {
    id: 'boss-5',
    title: 'The Paused Phantom',
    currentXP: 200,
    targetXP: 800,
    active: false,
    bonusMultiplier: 1.5,
  },
}

/** Minimal — no narrative, no contributors, no deadline */
export const Minimal: Story = {
  args: {
    id: 'boss-6',
    title: 'Quick Challenge',
    currentXP: 100,
    targetXP: 500,
    active: true,
  },
}

/** Interaction: toggle active state */
export const ToggleActive: Story = {
  args: {
    id: 'boss-1',
    title: 'Toggle Test',
    currentXP: 500,
    targetXP: 1000,
    active: true,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    const pauseBtn = canvas.getByLabelText('Pause battle')
    await userEvent.click(pauseBtn)

    await expect(args.onToggleActive).toHaveBeenCalledWith('boss-1', false)
  },
}

/** Interaction: delete battle */
export const DeleteBattle: Story = {
  args: {
    id: 'boss-1',
    title: 'Delete Test',
    currentXP: 500,
    targetXP: 1000,
    active: true,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    const deleteBtn = canvas.getByLabelText('Delete battle')
    await userEvent.click(deleteBtn)

    await expect(args.onDelete).toHaveBeenCalledWith('boss-1')
  },
}
