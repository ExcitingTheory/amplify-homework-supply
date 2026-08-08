import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn } from 'storybook/test'
import { SkillTreeEditor } from './SkillTreeEditor'

const mockUnits = [
  { id: 'u1', name: 'Intro to Variables' },
  { id: 'u2', name: 'Functions & Scope' },
  { id: 'u3', name: 'Async Programming' },
  { id: 'u4', name: 'Error Handling' },
  { id: 'u5', name: 'Data Structures' },
  { id: 'u6', name: 'Design Patterns' },
]

const mockSkills = [
  { id: 's1', title: 'Variables & Types' },
  { id: 's2', title: 'Control Flow' },
  { id: 's3', title: 'Functions Basics' },
]

const meta: Meta<typeof SkillTreeEditor> = {
  title: '🏆 Gamification/Instructor/Skill Tree Editor',
  component: SkillTreeEditor,
  args: {
    onSubmit: fn(),
    availableUnits: mockUnits,
    availableSkills: mockSkills,
  },
}
export default meta

type Story = StoryObj<typeof SkillTreeEditor>

/** Default empty form — create mode */
export const Default: Story = {  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
}

/** Editing an existing multi-unit skill */
export const EditExisting: Story = {
  args: {
    initialData: {
      title: 'Async Mastery',
      description: 'Master all asynchronous programming concepts',
      unitIds: ['u3', 'u4'],
      minimumAccuracy: 80,
      xpReward: 200,
      prerequisites: ['s3'],
    },
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
}

/** No units or skills available */
export const EmptySection: Story = {
  args: {
    availableUnits: [],
    availableSkills: [],
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
}

/** Submitting state */
export const Submitting: Story = {
  args: {
    submitting: true,
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
}

/** High accuracy requirement */
export const HighAccuracy: Story = {
  args: {
    initialData: {
      title: 'Perfectionist',
      unitIds: ['u1', 'u2', 'u3', 'u4', 'u5'],
      minimumAccuracy: 95,
      xpReward: 500,
      prerequisites: [],
    },
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
}
