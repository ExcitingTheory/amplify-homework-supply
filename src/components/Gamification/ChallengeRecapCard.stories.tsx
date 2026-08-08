import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { ChallengeRecapCard } from './ChallengeRecapCard'
import { fn } from 'storybook/test'

const mockRecaps = [
  {
    squadId: 'squad-1',
    squadName: 'Iron Dragons',
    recap: 'The Iron Dragons stormed the battlefield with the ferocity of a thousand debugging sessions, leaving nothing but clean code in their wake.',
    rivalSquadId: 'squad-5',
    rivalSquadName: 'Quantum Foxes',
    performance: 'top' as const,
  },
  {
    squadId: 'squad-5',
    squadName: 'Quantum Foxes',
    recap: 'The Quantum Foxes put up a valiant fight, their XP contributions flickering like unstable qubits — impressive, but just shy of the Iron Dragons.',
    rivalSquadId: 'squad-1',
    rivalSquadName: 'Iron Dragons',
    performance: 'top' as const,
  },
  {
    squadId: 'squad-2',
    squadName: 'Pixel Wolves',
    recap: 'The Pixel Wolves howled at the scoreboard as the Code Serpents slithered past them in the final hours. Next time, wolves.',
    rivalSquadId: 'squad-3',
    rivalSquadName: 'Code Serpents',
    performance: 'middle' as const,
  },
  {
    squadId: 'squad-3',
    squadName: 'Code Serpents',
    recap: 'Ssssilent but deadly, the Code Serpents coiled around third place with the determination of a recursive function that refuses to terminate.',
    rivalSquadId: 'squad-2',
    rivalSquadName: 'Pixel Wolves',
    performance: 'middle' as const,
  },
  {
    squadId: 'squad-4',
    squadName: 'Binary Phoenixes',
    recap: 'The Binary Phoenixes crashed spectacularly — but as their name suggests, they\'ll rise from the ashes. Next challenge is theirs.',
    rivalSquadId: 'squad-3',
    rivalSquadName: 'Code Serpents',
    performance: 'bottom' as const,
  },
]

const meta: Meta<typeof ChallengeRecapCard> = {
  title: '🏆 Gamification/Badges & Celebrations/Challenge Recap Card',
  component: ChallengeRecapCard,
  args: {
    challengeTitle: 'The Algorithm Dragon',
    recaps: mockRecaps,
    isInstructor: true,
    onGenerate: fn(),
    generating: false,
  },
}

export default meta
type Story = StoryObj<typeof ChallengeRecapCard>

export const WithRecaps: Story = {  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
}

export const NoRecaps: Story = {
  args: {
    recaps: [],
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
}

export const NoRecapsLearnerView: Story = {
  args: {
    recaps: [],
    isInstructor: false,
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
}

export const Generating: Story = {
  args: {
    recaps: [],
    generating: true,
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
}

export const LearnerView: Story = {
  args: {
    isInstructor: false,
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
}
