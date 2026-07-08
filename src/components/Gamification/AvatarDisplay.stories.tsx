import React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { AvatarDisplay } from './AvatarDisplay'
import type { AvatarBorderEffect } from './AvatarDisplay'
import Box from '@mui/material/Box'

const meta: Meta<typeof AvatarDisplay> = {
  title: '🏆 Gamification/Avatars & Cosmetics/Avatar Display',
  component: AvatarDisplay,
  argTypes: {
    borderEffect: {
      control: 'select',
      options: ['none', 'solid', 'gradient', 'pulse', 'rainbow', 'fire', 'ice', 'gold', 'shadow'],
    },
    size: { control: { type: 'range', min: 32, max: 128, step: 8 } },
    streak: { control: { type: 'number', min: 0 } },
  },
}
export default meta

type Story = StoryObj<typeof AvatarDisplay>

export const Default: Story = {
  args: {
    seed: 'student-123',
    size: 64,
    streak: 5,
    level: { level: 3, label: 'Practitioner', xpRequired: 400, xpForNextLevel: 800, progress: 65 },
    badge: { emoji: '🎯', label: 'Sharpshooter' },
    borderEffect: 'solid',
  },
}

export const WithGlowRing: Story = {
  args: {
    seed: 'glow-student',
    size: 72,
    streak: 14,
    level: { level: 5, label: 'Expert', xpRequired: 1500, xpForNextLevel: 2500, progress: 40 },
    badge: { emoji: '✨', label: 'Star Pupil' },
    borderEffect: 'none',
    glowRing: {
      colors: ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff'],
      speed: 4,
      thickness: 3,
      active: true,
      expiresAt: null,
    },
  },
}

export const FireBorder: Story = {
  args: {
    seed: 'fire-lord',
    size: 64,
    streak: 30,
    level: { level: 6, label: 'Master', xpRequired: 2500, xpForNextLevel: null, progress: 100 },
    badge: { emoji: '🔥', label: 'On Fire' },
    borderEffect: 'fire',
  },
}

export const IceBorder: Story = {
  args: {
    seed: 'ice-queen',
    size: 64,
    streak: 3,
    level: { level: 2, label: 'Explorer', xpRequired: 150, xpForNextLevel: 400, progress: 20 },
    badge: { emoji: '❄️', label: 'Chill Mode' },
    borderEffect: 'ice',
  },
}

export const GoldBorder: Story = {
  args: {
    seed: 'gold-standard',
    size: 64,
    streak: 21,
    level: { level: 4, label: 'Contributor', xpRequired: 800, xpForNextLevel: 1500, progress: 80 },
    badge: { emoji: '👑', label: 'Top Scorer' },
    borderEffect: 'gold',
  },
}

export const RainbowBorder: Story = {
  args: {
    seed: 'rainbow-warrior',
    size: 64,
    streak: 10,
    level: { level: 3, label: 'Practitioner', xpRequired: 400, xpForNextLevel: 800, progress: 50 },
    badge: { emoji: '🌈', label: 'Diverse' },
    borderEffect: 'rainbow',
  },
}

export const NoBadge: Story = {
  args: {
    seed: 'no-badge',
    size: 64,
    streak: 2,
    level: { level: 1, label: 'Beginner', xpRequired: 0, xpForNextLevel: 150, progress: 10 },
    badge: null,
    borderEffect: 'none',
  },
}

export const Minimal: Story = {
  args: {
    seed: 'minimal-user',
    size: 48,
    streak: 0,
    borderEffect: 'none',
  },
}

const sampleCrestSvg = `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="crestGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#3f51b5" />
      <stop offset="100%" stop-color="#26c6da" />
    </linearGradient>
  </defs>
  <circle cx="50" cy="50" r="48" fill="url(#crestGrad)" />
  <path d="M50 20 L68 38 L50 80 L32 38 Z" fill="#ffffff" fill-opacity="0.95" />
</svg>
`

export const WithGuildCrest: Story = {
  args: {
    seed: 'guild-student',
    size: 72,
    streak: 8,
    level: { level: 4, label: 'Contributor', xpRequired: 800, xpForNextLevel: 1500, progress: 55 },
    borderEffect: 'solid',
    guildName: 'Iron Dragons',
    guildId: 'guild-iron-dragons',
    guildCrestSvg: sampleCrestSvg,
  },
}

/** All border effects side by side for comparison */
export const AllBorderEffects: Story = {
  render: () => {
    const effects: AvatarBorderEffect[] = ['none', 'solid', 'gradient', 'pulse', 'rainbow', 'fire', 'ice', 'gold', 'shadow']
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, p: 2 }}>
        {effects.map((effect) => (
          <Box key={effect} sx={{ textAlign: 'center' }}>
            <AvatarDisplay
              seed={`demo-${effect}`}
              size={56}
              streak={7}
              level={{ level: 3, label: 'Practitioner', xpRequired: 400, xpForNextLevel: 800, progress: 50 }}
              badge={{ emoji: '⭐', label: effect }}
              borderEffect={effect}
            />
          </Box>
        ))}
      </Box>
    )
  },
}
