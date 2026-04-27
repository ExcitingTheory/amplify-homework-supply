import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import { AvatarEditor } from './AvatarEditor'
import SettingsContext from '../context/settingsContext'

const mockSettingsProvider = (avatarUrl?: string) => ({
  settings: avatarUrl ? { metadata: { avatarUrl } } : { metadata: {} },
  updateSettings: fn().mockResolvedValue(undefined),
})

const meta: Meta<typeof AvatarEditor> = {
  title: 'Components/AvatarEditor',
  component: AvatarEditor,
  args: {
    onSave: fn(),
  },
  decorators: [
    (Story) => (
      <SettingsContext.Provider value={mockSettingsProvider() as any}>
        <Story />
      </SettingsContext.Provider>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
}
export default meta

type Story = StoryObj<typeof AvatarEditor>

/** Default state — no avatar set. Shows upload and generate buttons. */
export const Default: Story = {}

/** With an existing avatar passed via prop (shows remove button too). */
export const WithAvatar: Story = {
  args: {
    avatarUrl: 'https://i.pravatar.cc/256?img=12',
  },
  decorators: [
    (Story) => (
      <SettingsContext.Provider
        value={mockSettingsProvider('https://i.pravatar.cc/256?img=12') as any}
      >
        <Story />
      </SettingsContext.Provider>
    ),
  ],
}

/** With a different avatar image. */
export const WithAvatarAlt: Story = {
  args: {
    avatarUrl: 'https://i.pravatar.cc/256?img=32',
  },
  decorators: [
    (Story) => (
      <SettingsContext.Provider
        value={mockSettingsProvider('https://i.pravatar.cc/256?img=32') as any}
      >
        <Story />
      </SettingsContext.Provider>
    ),
  ],
}
