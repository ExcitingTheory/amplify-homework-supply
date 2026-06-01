import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn } from 'storybook/test'
import { AvatarUnlockEditor } from './AvatarUnlockEditor'
import type { AvatarUnlockConfig } from './DiceBearAvatar'

const meta: Meta<typeof AvatarUnlockEditor> = {
  title: 'Gamification/AvatarUnlockEditor',
  component: AvatarUnlockEditor,
  parameters: {
    layout: 'centered',
  },
}

export default meta
type Story = StoryObj<typeof AvatarUnlockEditor>

export const Default: Story = {
  args: {
    onSave: fn(),
    sectionName: 'Spanish 101',
  },
}

export const WithCustomConfig: Story = {
  name: 'Custom Config',
  args: {
    config: {
      unlocks: [
        { minLevel: 1, tier: 'simple' },
        { minLevel: 3, tier: 'lorelei' },
        { minLevel: 5, tier: 'toonhead' },
        { minLevel: 7, tier: 'personas' },
      ],
      glowOnLevelUp: true,
    } satisfies AvatarUnlockConfig,
    onSave: fn(),
    sectionName: 'Biology AP',
  },
}

export const AllStylesUsed: Story = {
  name: 'All Styles Assigned',
  args: {
    config: {
      unlocks: [
        { minLevel: 1, tier: 'simple' },
        { minLevel: 2, tier: 'detailed' },
        { minLevel: 3, tier: 'toonhead' },
        { minLevel: 4, tier: 'lorelei' },
        { minLevel: 5, tier: 'notionists' },
        { minLevel: 6, tier: 'openpeeps' },
        { minLevel: 7, tier: 'personas' },
      ],
      glowOnLevelUp: false,
    } satisfies AvatarUnlockConfig,
    onSave: fn(),
  },
}

export const GlowDisabled: Story = {
  name: 'Glow Ring Disabled',
  args: {
    config: {
      unlocks: [
        { minLevel: 1, tier: 'simple' },
        { minLevel: 2, tier: 'detailed' },
      ],
      glowOnLevelUp: false,
    } satisfies AvatarUnlockConfig,
    onSave: fn(),
    sectionName: 'Math 200',
  },
}
