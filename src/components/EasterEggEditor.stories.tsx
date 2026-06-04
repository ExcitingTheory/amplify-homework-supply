import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn } from 'storybook/test'
import { EasterEggEditor } from './EasterEggEditor'

const mockBadges = [
  { id: 'b1', title: 'Perfect Score' },
  { id: 'b2', title: 'Speed Demon' },
  { id: 'b3', title: 'Night Owl' },
]

const mockUnits = [
  { id: 'u1', name: 'Intro to Variables' },
  { id: 'u2', name: 'Functions & Scope' },
  { id: 'u3', name: 'Async Programming' },
]

const meta: Meta<typeof EasterEggEditor> = {
  title: '🏆 Gamification/Instructor/Easter Egg Editor',
  component: EasterEggEditor,
  tags: ['autodocs'],
  args: {
    onSubmit: fn(),
    availableBadges: mockBadges,
    availableUnits: mockUnits,
  },
}
export default meta

type Story = StoryObj<typeof EasterEggEditor>

/** Default empty form — create mode */
export const Default: Story = {}

/** Editing an existing keyword egg */
export const EditKeywordEgg: Story = {
  args: {
    initialData: {
      triggerType: 'KEYWORD',
      triggerValue: 'konami',
      xpReward: 100,
      revealMessage: 'You found the secret code!',
      active: true,
    },
  },
}

/** Schedule trigger type */
export const ScheduleTrigger: Story = {
  args: {
    initialData: {
      triggerType: 'SCHEDULE',
      triggerValue: '',
      xpReward: 50,
      revealMessage: 'Happy holidays!',
      active: true,
    },
  },
}

/** Achievement trigger type */
export const AchievementTrigger: Story = {
  args: {
    initialData: {
      triggerType: 'ACHIEVEMENT',
      triggerValue: 'accuracy>=95',
      xpReward: 200,
      revealMessage: 'Amazing accuracy!',
      active: true,
    },
  },
}

/** Inactive egg */
export const InactiveEgg: Story = {
  args: {
    initialData: {
      triggerType: 'KEYWORD',
      triggerValue: 'oldcode',
      xpReward: 25,
      revealMessage: 'This egg is retired.',
      active: false,
    },
  },
}

/** Submitting state */
export const Submitting: Story = {
  args: {
    submitting: true,
  },
}
