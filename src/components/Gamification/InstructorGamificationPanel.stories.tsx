import type { Meta, StoryObj } from '@storybook/react'
import { expect, userEvent, within } from 'storybook/test'
import { fn } from 'storybook/test'
import { InstructorGamificationPanel } from './InstructorGamificationPanel'

const mockSections = [
  { id: 'sec-1', name: 'Period 1 - Biology', description: 'MWF 8:00am', studentCount: 25 },
  { id: 'sec-2', name: 'Period 3 - Chemistry', description: 'TTh 10:30am', studentCount: 30 },
]

const mockUnits = [
  { id: 'u1', name: 'Intro to Variables' },
  { id: 'u2', name: 'Functions & Scope' },
  { id: 'u3', name: 'Async Programming' },
]

const meta: Meta<typeof InstructorGamificationPanel> = {
  title: '🏆 Gamification/Instructor/Instructor Gamification Panel',
  component: InstructorGamificationPanel,
  tags: ['autodocs'],
  args: {
    onSectionChange: fn(),
    onAddSkill: fn(),
    onDeleteSkill: fn(),
    onGenerateSkillTree: fn(),
    onSaveCampaign: fn(),
    onDeleteCampaign: fn(),
    onCreateGuild: fn(),
    onDeleteGuild: fn(),
    onAddEasterEgg: fn(),
    onDeleteEasterEgg: fn(),
    onAddBoss: fn(),
    onDeleteBoss: fn(),
    onToggleBossActive: fn(),
    onSaveXPConfig: fn(),
    onToggleLinearLock: fn(),
    onUpdateUnitLock: fn(),
    onClearUnitLock: fn(),
  },
}
export default meta

type Story = StoryObj<typeof InstructorGamificationPanel>

export const Empty: Story = {
  args: {
    sections: mockSections,
    availableUnits: mockUnits,
  },
}

export const WithData: Story = {
  args: {
    sections: mockSections,
    selectedSectionId: 'sec-1',
    availableUnits: mockUnits,
    skills: [
      { id: 's1', title: 'Variables & Types', xpReward: 100, unitIds: ['u1'], minimumAccuracy: 70 },
      { id: 's2', title: 'Functions', xpReward: 150, prerequisites: ['s1'], unitIds: ['u2'], minimumAccuracy: 75 },
      { id: 's3', title: 'Async/Await', xpReward: 200, prerequisites: ['s2'], unitIds: ['u3'] },
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
      {
        id: 'b1',
        title: 'The Algorithm Dragon',
        targetXP: 1000,
        currentXP: 650,
        active: true,
        bonusMultiplier: 1.5,
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        setting: 'Deep in the recursion caves...',
        contributors: [
          { studentId: 's1', displayName: 'Alice', xpContributed: 300 },
          { studentId: 's2', displayName: 'Bob', xpContributed: 200 },
          { studentId: 's3', displayName: 'Charlie', xpContributed: 150 },
        ],
      },
    ],
    xpConfig: {
      multipliers: {
        HOMEWORK_SUBMITTED: 2,
        STREAK_7DAY: 1.5,
        PERFECT_SCORE: 3,
      },
      dailyCap: 300,
    },
    linearLockEnabled: true,
    unitLockRequirements: {
      'u2': { requiredXP: 200, requiredBadgeId: 'FIRST_SUBMISSION' },
      'u3': { requiredXP: 500, requiredModuleCompletion: 80 },
    },
    customBadges: [
      {
        id: 'cb1',
        name: 'Grammar Guru',
        description: 'Master of grammar rules',
        event: 'PERFECT_SCORE',
        threshold: 5,
        rarity: 'epic' as const,
        visual: {
          iconName: 'GiSpellBook',
          iconLib: 'gi',
          shape: 'shield' as const,
          bgColor: '#673ab7',
          gradient: {
            type: 'linear' as const,
            angle: '135deg',
            stops: [
              { color: '#9c27b0', position: '0%' },
              { color: '#4a148c', position: '100%' },
            ],
          },
          iconColor: '#ffd700',
          animation: 'glow' as const,
        },
        buffs: {
          xpMultiplier: 1.5,
          xpMultiplierDurationHours: 24,
          streakFreezes: 2,
        },
      },
    ],
  },
}

/** Interaction: expand accordions and verify CRUD forms */
export const AccordionInteraction: Story = {
  args: {
    sections: mockSections,
    selectedSectionId: 'sec-1',
    availableUnits: mockUnits,
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

    // Section selector present
    await expect(canvas.getByLabelText(/Section/i)).toBeInTheDocument()

    // All 6 accordion sections present
    await expect(canvas.getByText(/XP Tuner/)).toBeInTheDocument()
    await expect(canvas.getByText(/Skill Tree \(/)).toBeInTheDocument()
    await expect(canvas.getByText(/Campaign \(/)).toBeInTheDocument()
    await expect(canvas.getByText(/Guilds \(/)).toBeInTheDocument()
    await expect(canvas.getByText(/Easter Eggs \(/)).toBeInTheDocument()
    await expect(canvas.getByText(/Boss Battles \(/)).toBeInTheDocument()

    // Expand Skill Tree accordion
    await userEvent.click(canvas.getByText(/Skill Tree \(/))

    // Should see the existing skill
    await expect(canvas.getByText('Variables & Types')).toBeInTheDocument()

    // Should see the multi-field form
    await expect(canvas.getByLabelText(/Skill Title/i)).toBeInTheDocument()
    await expect(canvas.getByLabelText(/Description/i)).toBeInTheDocument()

    // Expand Boss Battles accordion
    await userEvent.click(canvas.getByText(/Boss Battles \(/))
    await expect(canvas.getByLabelText(/Title/i)).toBeInTheDocument()
    await expect(canvas.getByLabelText(/Target XP/i)).toBeInTheDocument()
  },
}
