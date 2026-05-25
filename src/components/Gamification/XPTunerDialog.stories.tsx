import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { XPTunerDialog } from './XPTunerDialog'
import { XPReason } from '../../utils/xpCalculation'
import { fn } from 'storybook/test'

const meta: Meta<typeof XPTunerDialog> = {
  title: 'Gamification/XPTunerDialog',
  component: XPTunerDialog,
  parameters: {
    layout: 'centered',
  },
  args: {
    open: true,
    onClose: fn(),
    onSave: fn(),
  },
}

export default meta
type Story = StoryObj<typeof XPTunerDialog>

/** Default state — all multipliers at 1×, no caps */
export const Default: Story = {
  args: {
    sectionName: 'Biology 101 — Fall 2026',
  },
}

/** With some custom multipliers already set */
export const WithCustomMultipliers: Story = {
  args: {
    sectionName: 'Advanced Spanish — Spring 2026',
    config: {
      multipliers: {
        [XPReason.HOMEWORK_SUBMITTED]: 2,
        [XPReason.STREAK_7DAY]: 1.5,
        [XPReason.STREAK_30DAY]: 3,
        [XPReason.PERFECT_SCORE]: 2.5,
        [XPReason.PEER_REVIEW_GIVEN]: 0,
        [XPReason.EASTER_EGG]: 0.5,
      },
    },
  },
}

/** With daily and weekly XP caps */
export const WithCaps: Story = {
  args: {
    sectionName: 'Controlled Progression — History 301',
    config: {
      multipliers: {
        [XPReason.HOMEWORK_SUBMITTED]: 1.5,
      },
      dailyCap: 200,
      weeklyCap: 800,
    },
  },
}

/** XP fully disabled */
export const XPDisabled: Story = {
  args: {
    sectionName: 'No XP Section',
    config: {
      enabled: false,
    },
  },
}

/** Double XP event — all at 2× with high caps */
export const DoubleXP: Story = {
  args: {
    sectionName: 'Double XP Week — Math 201',
    config: {
      multipliers: Object.fromEntries(
        Object.values(XPReason).map((r) => [r, 2])
      ) as Record<XPReason, number>,
      dailyCap: 500,
    },
  },
}

/** No section name provided */
export const NoSectionName: Story = {
  args: {
    config: {
      multipliers: {
        [XPReason.ON_TIME_SUBMISSION]: 3,
      },
      weeklyCap: 1000,
    },
  },
}

/** Custom leveling curve — 20 levels, fast early progression */
export const CustomLeveling: Story = {
  args: {
    sectionName: 'RPG Mode — History 101',
    config: {
      multipliers: {
        [XPReason.HOMEWORK_SUBMITTED]: 1.5,
        [XPReason.PERFECT_SCORE]: 3,
      },
      levelConfig: {
        maxLevel: 20,
        xpPerLevel: 100,
        levelScaling: 1.3,
      },
    },
  },
}

/** Max levels capped at 99 with steep scaling */
export const MaxLevels: Story = {
  args: {
    sectionName: 'Endgame — CS 490',
    config: {
      dailyCap: 1000,
      weeklyCap: 5000,
      levelConfig: {
        maxLevel: 99,
        xpPerLevel: 200,
        levelScaling: 2.0,
      },
    },
  },
}
