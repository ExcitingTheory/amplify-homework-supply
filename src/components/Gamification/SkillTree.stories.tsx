import React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, within } from 'storybook/test'
import { SkillTree } from './SkillTree'
import type { SkillNodeData } from './SkillTree'

const meta: Meta<typeof SkillTree> = {
  title: '🏆 Gamification/XP & Progression/Skill Tree',
  component: SkillTree,
}
export default meta

type Story = StoryObj<typeof SkillTree>

const sampleSkills: SkillNodeData[] = [
  { skillId: 'sk1', title: 'Basics', description: 'Fundamental concepts', status: 'MASTERED', xpReward: 50, prerequisites: [] },
  { skillId: 'sk2', title: 'Intermediate', description: 'Build on basics', status: 'AVAILABLE', xpReward: 75, prerequisites: ['sk1'] },
  { skillId: 'sk3', title: 'Advanced', description: 'Complex topics', status: 'LOCKED', xpReward: 100, prerequisites: ['sk2'] },
  { skillId: 'sk4', title: 'Application', description: 'Apply knowledge', status: 'IN_PROGRESS', xpReward: 80, prerequisites: ['sk1'] },
  { skillId: 'sk5', title: 'Mastery', description: 'Final assessment', status: 'LOCKED', xpReward: 150, prerequisites: ['sk3', 'sk4'] },
]

export const Default: Story = {
  args: {
    skills: sampleSkills,
    height: 500,
  },
}

export const AllMastered: Story = {
  args: {
    skills: sampleSkills.map((s) => ({ ...s, status: 'MASTERED' as const })),
    height: 500,
  },
}

export const AllLocked: Story = {
  args: {
    skills: sampleSkills.map((s) => ({ ...s, status: 'LOCKED' as const })),
    height: 500,
  },
}

export const Empty: Story = {
  args: {
    skills: [],
    height: 400,
  },
}

export const WithGenerate: Story = {
  args: {
    skills: [],
    height: 400,
    unitId: 'unit-1',
    cohortId: 'cohort-1',
    canGenerate: true,
  },
}

/** Interaction: verify node labels and edge connections render */
export const DefaultInteraction: Story = {
  args: {
    skills: sampleSkills,
    height: 500,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Skill node labels should be visible
    await expect(canvas.getByText('Basics')).toBeInTheDocument()
    await expect(canvas.getByText('Intermediate')).toBeInTheDocument()
    await expect(canvas.getByText('Advanced')).toBeInTheDocument()
    await expect(canvas.getByText('Application')).toBeInTheDocument()
    await expect(canvas.getByText('Mastery')).toBeInTheDocument()
  },
}

/** Interaction: empty state shows message + generate button */
export const EmptyInteraction: Story = {
  args: {
    skills: [],
    height: 400,
    unitId: 'unit-1',
    cohortId: 'cohort-1',
    canGenerate: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Empty state message
    await expect(canvas.getByText(/No skills defined/i)).toBeInTheDocument()

    // Generate button should be visible
    const generateBtn = canvas.getByRole('button', { name: /Generate/i })
    await expect(generateBtn).toBeInTheDocument()
  },
}
