import React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn, expect, userEvent, within } from 'storybook/test'
import { SkillDetailPanel, type UnitProgress } from './SkillDetailPanel'
import type { SkillNodeData } from './SkillTree'

const meta: Meta<typeof SkillDetailPanel> = {
  title: '🏆 Gamification/Skill Tree/Skill Detail Panel',
  component: SkillDetailPanel,
}
export default meta

type Story = StoryObj<typeof SkillDetailPanel>

const sampleSkill: SkillNodeData = {
  skillId: 'skill-1',
  title: 'Basic Greetings',
  description: 'Learn common greetings and introductions in the target language.',
  status: 'IN_PROGRESS',
  xpReward: 50,
  prerequisites: ['skill-0'],
}

const allSkills: SkillNodeData[] = [
  { skillId: 'skill-0', title: 'Alphabet', status: 'MASTERED', xpReward: 25 },
  sampleSkill,
  { skillId: 'skill-2', title: 'Numbers', status: 'LOCKED', xpReward: 50, prerequisites: ['skill-1'] },
]

const unitProgress: UnitProgress[] = [
  { unitId: 'u1', unitName: 'Lesson 1', completionPercent: 100, highestGrade: 95, xpEarned: 40 },
  { unitId: 'u2', unitName: 'Lesson 2', completionPercent: 60, highestGrade: 78, xpEarned: 20 },
]

export const InProgress: Story = {
  args: {
    skill: sampleSkill,
    onAdvance: fn(),
    onClose: fn(),
    unitProgress,
    allSkills,
    totalXP: 340,
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    // The advance button text depends on skill status: IN_PROGRESS → "Mark Mastered" (or similar)
    const advanceBtn = await canvas.findByRole('button', { name: /Mastered|Start|Advance|Mark/i })
    await userEvent.click(advanceBtn)
    await expect(args.onAdvance).toHaveBeenCalledWith('skill-1', expect.any(String))
  },
}

export const Mastered: Story = {
  args: {
    skill: { ...sampleSkill, status: 'MASTERED' },
    onAdvance: fn(),
    onClose: fn(),
    allSkills,
    totalXP: 500,
  },
}

export const Locked: Story = {
  args: {
    skill: { skillId: 'skill-2', title: 'Numbers', status: 'LOCKED', xpReward: 50, prerequisites: ['skill-1'] },
    onAdvance: fn(),
    onClose: fn(),
    allSkills,
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    // Advance button should not be visible for LOCKED skills
    const advanceBtns = canvas.queryAllByRole('button', { name: /Mastered|Start|Advance/i })
    await expect(advanceBtns).toHaveLength(0)
    // Close button should be present
    const closeBtn = await canvas.findByRole('button', { name: /Close/i })
    await userEvent.click(closeBtn)
    await expect(args.onClose).toHaveBeenCalled()
  },
}
