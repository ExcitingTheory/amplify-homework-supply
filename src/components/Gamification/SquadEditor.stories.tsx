import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { SquadEditor } from './SquadEditor'
import type { ArmorEditorConfig } from './ArmorEditor'
import { expect } from 'storybook/test'

const meta: Meta<typeof SquadEditor> = {
  title: '🏆 Gamification/Squads & Teams/Squad Editor',
  component: SquadEditor,
  parameters: {
    layout: 'padded',
  },
}

export default meta
type Story = StoryObj<typeof SquadEditor>

const EXISTING_CONFIG: ArmorEditorConfig = {
  shape: 'heater',
  fieldColor: '#c62828',
  fieldColor2: '#f9a825',
  division: 'halved',
  chargeId: 'mullet',
  chargeColor: '#f9a825',
  chargePosition: 'center',
  chargeScale: 1.25,
  charges: [
    {
      chargeId: 'mullet',
      chargeColor: '#f9a825',
      chargePosition: 'center',
      chargeScale: 1.25,
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
    },
  ],
}

/** New squad — placeholder name, default crest */
export const NewSquad: Story = {
  args: {
    squadName: 'New Squad',
    squadDescription: '',
    crestConfig: null,
    onSave: (data) => console.log('Save:', data),
    autoSaveDelay: 1500,
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
}

/** Existing squad with custom crest */
export const ExistingSquad: Story = {
  args: {
    squadName: 'Code Warriors',
    squadDescription: 'We write clean code and help each other grow.',
    crestConfig: EXISTING_CONFIG,
    onSave: (data) => console.log('Save:', data),
    autoSaveDelay: 1500,
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
}

/** Autosave disabled — manual save only */
export const ManualSaveOnly: Story = {
  args: {
    squadName: 'Phoenix Rising',
    squadDescription: 'Rising from the ashes of every failed test.',
    crestConfig: null,
    onSave: (data) => console.log('Save:', data),
    autoSaveDelay: 0,
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
}
