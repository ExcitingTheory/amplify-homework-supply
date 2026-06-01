import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import React from 'react'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { DiceBearAvatar, getStyleTierStatus } from './DiceBearAvatar'
import type { AvatarStyleTier } from './DiceBearAvatar'

const meta: Meta<typeof DiceBearAvatar> = {
  title: '🏆 Gamification/Avatars & Cosmetics/DiceBear Avatar',
  component: DiceBearAvatar,
  tags: ['autodocs'],
}
export default meta

type Story = StoryObj<typeof DiceBearAvatar>

export const Default: Story = {
  args: { seed: 'student-123', size: 64 },
}

export const AllStyles: Story = {
  render: () => (
    <Stack direction="row" spacing={2} alignItems="center">
      {(['simple', 'detailed', 'toonhead'] as AvatarStyleTier[]).map((style) => (
        <Stack key={style} alignItems="center" spacing={0.5}>
          <DiceBearAvatar seed="demo-user" style={style} size={64} />
          <Typography variant="caption">{style}</Typography>
        </Stack>
      ))}
    </Stack>
  ),
}

export const LockedVsUnlocked: Story = {
  render: () => (
    <Stack direction="row" spacing={2}>
      <DiceBearAvatar seed="user-1" size={48} label="Unlocked" />
      <DiceBearAvatar seed="user-1" size={48} label="Locked" locked />
    </Stack>
  ),
}

export const TierProgression: Story = {
  render: () => {
    const tiers = getStyleTierStatus(4)
    return (
      <Stack direction="row" spacing={2} alignItems="center">
        {tiers.map((t) => (
          <Stack key={t.tier} alignItems="center" spacing={0.5}>
            <DiceBearAvatar seed="progression" style={t.tier} size={48} locked={!t.unlocked} />
            <Typography variant="caption">{t.displayName} {t.unlocked ? '✓' : '🔒'}</Typography>
          </Stack>
        ))}
      </Stack>
    )
  },
}

export const DifferentSeeds: Story = {
  render: () => (
    <Stack direction="row" spacing={1}>
      {['alice', 'bob', 'charlie', 'diana', 'eve'].map((name) => (
        <DiceBearAvatar key={name} seed={name} size={40} label={name} />
      ))}
    </Stack>
  ),
}
