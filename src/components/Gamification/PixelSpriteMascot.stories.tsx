import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import Box from '@mui/material/Box'
import { PixelSpriteMascot } from './PixelSpriteMascot'

const meta: Meta<typeof PixelSpriteMascot> = {
  title: '🏆 Gamification/Easter Eggs/Pixel Sprite Mascot',
  component: PixelSpriteMascot,
  argTypes: {
    stage: { control: { type: 'range', min: 1, max: 5 } },
    size: { control: { type: 'range', min: 32, max: 200 } },
  },
}

export default meta
type Story = StoryObj<typeof PixelSpriteMascot>

export const Default: Story = {
  args: {
    seed: 'student-abc-123',
    stage: 1,
    size: 64,
    label: 'Hatchling',
  },
}

export const AllStages: Story = {
  render: () => (
    <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-end', flexWrap: 'wrap' }}>
      {[1, 2, 3, 4, 5].map((stage) => (
        <PixelSpriteMascot
          key={stage}
          seed="student-abc-123"
          stage={stage}
          size={48 + stage * 12}
          label={`Stage ${stage}`}
          tooltip={`Level ${stage} evolution`}
        />
      ))}
    </Box>
  ),
}

export const DifferentSeeds: Story = {
  render: () => (
    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
      {['alice', 'bob', 'charlie', 'diana', 'eve', 'frank'].map((name) => (
        <PixelSpriteMascot
          key={name}
          seed={name}
          stage={3}
          size={64}
          label={name}
        />
      ))}
    </Box>
  ),
}

export const Sleeping: Story = {
  args: {
    seed: 'student-abc-123',
    stage: 3,
    size: 80,
    label: 'Zzz...',
    sleeping: true,
    tooltip: 'Streak broken — mascot is sleeping',
  },
}

export const SquadPet: Story = {
  args: {
    seed: 'squad-phoenix-squad',
    stage: 4,
    size: 96,
    label: 'Squad Pet',
    tooltip: 'Phoenix Squad mascot (Stage 4)',
  },
}

export const BossMonster: Story = {
  args: {
    seed: 'challenge-boss-final',
    stage: 5,
    size: 128,
    label: 'Final Boss',
    tooltip: 'Defeat this boss to earn bonus XP!',
  },
}
