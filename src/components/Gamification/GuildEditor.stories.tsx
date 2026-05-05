import type { Meta, StoryObj } from '@storybook/react'
import { GuildEditor } from './GuildEditor'
import type { ArmorEditorConfig } from './ArmorEditor'

const meta: Meta<typeof GuildEditor> = {
  title: '🏆 Gamification/Guilds & Teams/Guild Editor',
  component: GuildEditor,
  parameters: {
    layout: 'padded',
  },
}

export default meta
type Story = StoryObj<typeof GuildEditor>

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

/** New guild — placeholder name, default crest */
export const NewGuild: Story = {
  args: {
    guildName: 'New Guild',
    guildDescription: '',
    crestConfig: null,
    onSave: (data) => console.log('Save:', data),
    autoSaveDelay: 1500,
  },
}

/** Existing guild with custom crest */
export const ExistingGuild: Story = {
  args: {
    guildName: 'Code Warriors',
    guildDescription: 'We write clean code and help each other grow.',
    crestConfig: EXISTING_CONFIG,
    onSave: (data) => console.log('Save:', data),
    autoSaveDelay: 1500,
  },
}

/** Autosave disabled — manual save only */
export const ManualSaveOnly: Story = {
  args: {
    guildName: 'Phoenix Rising',
    guildDescription: 'Rising from the ashes of every failed test.',
    crestConfig: null,
    onSave: (data) => console.log('Save:', data),
    autoSaveDelay: 0,
  },
}
