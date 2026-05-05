import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { UserAvatar } from './UserAvatar'
import SettingsContext from '../context/settingsContext'

const mockSettingsProvider = (avatarUrl?: string) => ({
  settings: avatarUrl ? { metadata: { avatarUrl } } : { metadata: {} },
  updateSettings: async () => {},
})

const meta: Meta<typeof UserAvatar> = {
  title: '🧩 UI Components/User Avatar',
  component: UserAvatar,
  decorators: [
    (Story) => (
      <SettingsContext.Provider value={mockSettingsProvider() as any}>
        <Story />
      </SettingsContext.Provider>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof UserAvatar>

export const Default: Story = {
  args: { size: 64 },
}

export const Small: Story = {
  args: { size: 32 },
}

export const Large: Story = {
  args: { size: 96 },
}

export const WithStreak: Story = {
  args: { size: 64, streak: 5 },
}

export const StreakMilestone: Story = {
  args: { size: 64, streak: 14 },
}

export const LargeWithStreak: Story = {
  args: { size: 96, streak: 7 },
}

export const SmallWithStreak: Story = {
  args: { size: 32, streak: 3 },
}

export const ZeroStreak: Story = {
  args: { size: 64, streak: 0 },
}

export const WithExternalSrc: Story = {
  args: {
    size: 64,
    src: 'https://i.pravatar.cc/128?img=12',
    streak: 10,
  },
  decorators: [
    (Story) => (
      <SettingsContext.Provider value={mockSettingsProvider() as any}>
        <Story />
      </SettingsContext.Provider>
    ),
  ],
}
