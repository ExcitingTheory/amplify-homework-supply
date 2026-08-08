import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn } from 'storybook/test'
import { GroupChallengeEditor } from './GroupChallengeEditor'

const meta: Meta<typeof GroupChallengeEditor> = {
  title: '🏆 Gamification/Instructor/Group Challenge Editor',
  component: GroupChallengeEditor,
  args: {
    onSubmit: fn(),
  },
}
export default meta

type Story = StoryObj<typeof GroupChallengeEditor>

/** Default empty form — create mode */
export const Default: Story = {  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
}

/** Editing an existing challenge with progress */
export const EditWithProgress: Story = {
  args: {
    initialData: {
      title: 'The Algorithm Dragon',
      targetXP: 2000,
      currentXP: 1350,
      deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      bonusMultiplier: 2.0,
      setting: 'A world where bugs rule the codebase and only teamwork can defeat them.',
      stakes: 'If the dragon wins, everyone loses a streak freeze!',
      systemPromptSeed: 'You are a narrator for an epic coding quest.',
      active: true,
    },
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
}

/** Challenge with expired deadline */
export const ExpiredDeadline: Story = {
  args: {
    initialData: {
      title: 'The Legacy Refactor',
      targetXP: 5000,
      currentXP: 4200,
      deadline: new Date(Date.now() - 1000).toISOString(),
      bonusMultiplier: 1.5,
      active: false,
    },
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
}

/** Completed challenge */
export const CompletedChallenge: Story = {
  args: {
    initialData: {
      title: 'Sprint to Victory',
      targetXP: 1000,
      currentXP: 1200,
      bonusMultiplier: 1.5,
      active: false,
    },
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
}

/** Submitting state */
export const Submitting: Story = {
  args: {
    submitting: true,
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
}
