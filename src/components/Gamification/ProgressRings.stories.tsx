import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { ProgressRings } from './ProgressRings'

const meta: Meta<typeof ProgressRings> = {
  title: '🏆 Gamification/XP & Progression/Progress Rings',
  component: ProgressRings,
}
export default meta

type Story = StoryObj<typeof ProgressRings>

export const MultipleModules: Story = {
  args: {
    modules: [
      { moduleId: 'm1', moduleName: 'Foundations', completionPercent: 75, totalWorkbooks: 4, completedWorkbooks: 3 },
      { moduleId: 'm2', moduleName: 'Advanced', completionPercent: 25, totalWorkbooks: 8, completedWorkbooks: 2 },
      { moduleId: 'm3', moduleName: 'Projects', completionPercent: 100, totalWorkbooks: 3, completedWorkbooks: 3 },
    ],
  },
}

export const SingleModule: Story = {
  args: {
    modules: [
      { moduleId: 'm1', moduleName: 'Spanish Verbs', completionPercent: 50, totalWorkbooks: 6, completedWorkbooks: 3 },
    ],
  },
}

export const Empty: Story = {
  args: { modules: [] },
}
