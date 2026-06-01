import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, within } from 'storybook/test'
import { BossBattleCard } from './BossBattleCard'

const meta: Meta<typeof BossBattleCard> = {
  title: '🏆 Gamification/Squads & Teams/Boss Battle Card',
  component: BossBattleCard,
  tags: ['autodocs'],
}
export default meta

type Story = StoryObj<typeof BossBattleCard>

const defaultPhases = [
  { id: 'p1', title: 'Core Questions', description: 'Answer fundamental algorithm questions', status: 'COMPLETED' as const, targetXP: 500, currentXP: 500 },
  { id: 'p2', title: 'Code Review', description: 'Review and improve peer solutions', status: 'ACTIVE' as const, targetXP: 300, currentXP: 150, requiredRoles: ['Reviewer', 'Tester'] },
  { id: 'p3', title: 'Final Challenge', description: 'Solve the optimization puzzle', status: 'LOCKED' as const, targetXP: 200, currentXP: 0 },
]

export const Active: Story = {
  args: {
    title: 'The Algorithm Dragon',
    narrative: 'A fearsome dragon guards the sorting algorithms. Only by mastering Big-O can your squad defeat it.',
    phases: defaultPhases,
    totalHP: 1000,
    totalDamage: 650,
    active: true,
    bonusMultiplier: 2.0,
    currentUserRole: 'Reviewer',
    contributors: [
      { userId: 'u1', displayName: 'Alice', xpContributed: 250 },
      { userId: 'u2', displayName: 'Bob', xpContributed: 200 },
      { userId: 'u3', displayName: 'Charlie', xpContributed: 150 },
      { userId: 'u4', displayName: 'Diana', xpContributed: 50 },
    ],
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
}

export const Defeated: Story = {
  args: {
    title: 'The Memory Leak Hydra',
    narrative: 'The hydra has been vanquished! All memory leaks have been plugged.',
    phases: defaultPhases.map((p) => ({ ...p, status: 'COMPLETED' as const, currentXP: p.targetXP })),
    totalHP: 1000,
    totalDamage: 1000,
    active: true,
    bonusMultiplier: 2.0,
  },
}

export const SinglePhase: Story = {
  args: {
    title: 'Sprint Challenge',
    phases: [{ id: 'p1', title: 'Complete All Tasks', description: 'Submit all assignments', status: 'ACTIVE' as const, targetXP: 500, currentXP: 200 }],
    totalHP: 500,
    totalDamage: 200,
    active: true,
  },
}

/** Interaction: verify multi-phase stepper, HP bar, and contributor display */
export const ActiveInteraction: Story = {
  args: {
    title: 'The Algorithm Dragon',
    narrative: 'A fearsome dragon guards the sorting algorithms.',
    phases: defaultPhases,
    totalHP: 1000,
    totalDamage: 650,
    active: true,
    bonusMultiplier: 2.0,
    currentUserRole: 'Reviewer',
    contributors: [
      { userId: 'u1', displayName: 'Alice', xpContributed: 250 },
      { userId: 'u2', displayName: 'Bob', xpContributed: 200 },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Title is rendered
    await expect(canvas.getByText('The Algorithm Dragon')).toBeInTheDocument()

    // Narrative text is rendered
    await expect(canvas.getByText(/fearsome dragon/)).toBeInTheDocument()

    // HP progress bar exists
    const progressBar = canvas.getByRole('progressbar')
    await expect(progressBar).toBeInTheDocument()

    // Phase labels are in the stepper
    await expect(canvas.getByText('Core Questions')).toBeInTheDocument()
    await expect(canvas.getByText('Code Review')).toBeInTheDocument()
    await expect(canvas.getByText('Final Challenge')).toBeInTheDocument()

    // Current phase detail shows active phase
    await expect(canvas.getByText(/Review and improve/)).toBeInTheDocument()

    // Bonus multiplier chip
    await expect(canvas.getByText(/2x/)).toBeInTheDocument()
  },
}
