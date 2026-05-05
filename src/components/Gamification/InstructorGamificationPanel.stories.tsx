import type { Meta, StoryObj } from '@storybook/react'
import { expect, userEvent, within } from 'storybook/test'
import { InstructorGamificationPanel } from './InstructorGamificationPanel'

const meta: Meta<typeof InstructorGamificationPanel> = {
  title: '🏆 Gamification/Instructor/Instructor Gamification Panel',
  component: InstructorGamificationPanel,
  tags: ['autodocs'],
}
export default meta

type Story = StoryObj<typeof InstructorGamificationPanel>

export const Empty: Story = {
  args: {},
}

export const WithData: Story = {
  args: {
    skills: [
      { id: 's1', title: 'Variables & Types', xpReward: 100 },
      { id: 's2', title: 'Functions', xpReward: 150, prerequisites: ['s1'] },
      { id: 's3', title: 'Async/Await', xpReward: 200, prerequisites: ['s2'] },
    ],
    campaigns: [
      { id: 'c1', title: 'Operation Syntax Storm', setting: 'A world where code is law.' },
    ],
    guilds: [
      { id: 'g1', name: 'Code Warriors', memberCount: 5 },
      { id: 'g2', name: 'Bug Busters', memberCount: 4 },
    ],
    easterEggs: [
      { id: 'e1', type: 'CLICK' as const, message: 'Found the hidden bug!', xpReward: 50 },
      { id: 'e2', type: 'KEYWORD' as const, message: 'Typed the secret word!', xpReward: 75, keyword: 'konami' },
    ],
    bossBattles: [
      { id: 'b1', title: 'The Algorithm Dragon', totalHP: 1000, phaseCount: 3, active: true },
    ],
  },
}

/** Interaction: expand accordions and verify CRUD forms */
export const AccordionInteraction: Story = {
  args: {
    skills: [
      { id: 's1', title: 'Variables & Types', xpReward: 100 },
    ],
    campaigns: [],
    guilds: [],
    easterEggs: [],
    bossBattles: [],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Title renders
    await expect(canvas.getByText('Gamification Admin')).toBeInTheDocument()

    // All 5 accordion sections present
    await expect(canvas.getByText(/Skill Tree \(/)).toBeInTheDocument()
    await expect(canvas.getByText(/Campaign \(/)).toBeInTheDocument()
    await expect(canvas.getByText(/Guilds \(/)).toBeInTheDocument()
    await expect(canvas.getByText(/Easter Eggs \(/)).toBeInTheDocument()
    await expect(canvas.getByText(/Boss Battles \(/)).toBeInTheDocument()

    // Expand Skill Tree accordion
    await userEvent.click(canvas.getByText(/Skill Tree \(/))

    // Should see the existing skill
    await expect(canvas.getByText('Variables & Types')).toBeInTheDocument()

    // Should see the add form fields
    await expect(canvas.getByLabelText(/Skill title/i)).toBeInTheDocument()

    // Expand Campaign accordion
    await userEvent.click(canvas.getByText(/Campaign \(/))
    await expect(canvas.getByLabelText(/Campaign title/i)).toBeInTheDocument()
  },
}
