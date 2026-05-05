import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { BadgeIcon } from './BadgeIcon'
import { BADGE_REGISTRY, type BadgeVisualConfig } from './badgeRegistry'

const meta: Meta<typeof BadgeIcon> = {
  title: '🏆 Gamification/Badges & Celebrations/Badge Icon',
  component: BadgeIcon,
  argTypes: {
    size: { control: { type: 'range', min: 32, max: 120, step: 4 } },
    earned: { control: 'boolean' },
    animate: { control: 'boolean' },
    drawIcon: { control: 'boolean' },
    animationDelay: { control: { type: 'range', min: 0, max: 2, step: 0.1 } },
  },
}
export default meta

type Story = StoryObj<typeof BadgeIcon>

export const Default: Story = {
  args: {
    badgeType: 'FIRST_SUBMISSION',
    size: 64,
    earned: true,
    animate: true,
    drawIcon: true,
  },
}

export const Locked: Story = {
  args: {
    badgeType: 'PERFECTIONIST',
    size: 64,
    earned: false,
    animate: false,
  },
}

export const LargeEpic: Story = {
  args: {
    badgeType: 'TOP_OF_CLASS',
    size: 96,
    earned: true,
    animate: true,
    drawIcon: true,
  },
}

export const LegendaryBotWhisperer: Story = {
  args: {
    badgeType: 'BOT_WHISPERER_IV',
    size: 96,
    earned: true,
    animate: true,
    drawIcon: true,
  },
}

/** All registered badges in a grid — shows the full icon library */
export const AllBadges: Story = {
  render: () => (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 3, p: 2 }}>
      {Object.entries(BADGE_REGISTRY).map(([type, config], i) => (
        <Box key={type} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <BadgeIcon
            badgeType={type}
            size={64}
            earned
            animate
            drawIcon
            animationDelay={i * 0.1}
          />
          <Typography variant="caption" textAlign="center" sx={{ maxWidth: 80 }}>
            {config.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" fontSize="0.6rem">
            {config.rarity} · {config.shape}
          </Typography>
        </Box>
      ))}
    </Box>
  ),
}

/** Earned vs Locked comparison */
export const EarnedVsLocked: Story = {
  render: () => (
    <Box sx={{ display: 'flex', gap: 4, p: 2, flexWrap: 'wrap' }}>
      {['FIRST_SUBMISSION', 'SHARPSHOOTER', 'TOP_OF_CLASS', 'BOT_WHISPERER_IV', 'STREAK_30'].map((type) => (
        <Box key={type} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <BadgeIcon badgeType={type} size={64} earned animate drawIcon />
          <BadgeIcon badgeType={type} size={64} earned={false} />
          <Typography variant="caption">{BADGE_REGISTRY[type]?.name}</Typography>
        </Box>
      ))}
    </Box>
  ),
}

/** Size variants */
export const Sizes: Story = {
  render: () => (
    <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', p: 2 }}>
      {[32, 40, 48, 56, 64, 80, 96, 120].map((s) => (
        <BadgeIcon key={s} badgeType="DEEP_THINKER" size={s} earned animate drawIcon />
      ))}
    </Box>
  ),
}

/** Shape showcase */
export const Shapes: Story = {
  render: () => {
    const shapeExamples: Array<[string, string]> = [
      ['FIRST_SUBMISSION', 'circle'],
      ['QUICK_DRAW', 'hexagon'],
      ['SHARPSHOOTER', 'shield'],
      ['PERFECTIONIST', 'diamond'],
    ]
    return (
      <Box sx={{ display: 'flex', gap: 4, p: 2 }}>
        {shapeExamples.map(([type, shape]) => (
          <Box key={type} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <BadgeIcon badgeType={type} size={80} earned animate drawIcon />
            <Typography variant="caption">{shape}</Typography>
          </Box>
        ))}
      </Box>
    )
  },
}

/** Staggered animation showcase */
export const StaggeredGrid: Story = {
  render: () => (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, p: 2, maxWidth: 400 }}>
      {Object.keys(BADGE_REGISTRY).slice(0, 12).map((type, i) => (
        <Box key={type} sx={{ display: 'flex', justifyContent: 'center' }}>
          <BadgeIcon badgeType={type} size={56} earned animate drawIcon animationDelay={i * 0.15} />
        </Box>
      ))}
    </Box>
  ),
}

/** Bot Whisperer progression — shows tier escalation */
export const BotWhispererProgression: Story = {
  render: () => (
    <Box sx={{ display: 'flex', gap: 3, p: 2, alignItems: 'flex-end' }}>
      {['BOT_WHISPERER_I', 'BOT_WHISPERER_II', 'BOT_WHISPERER_III', 'BOT_WHISPERER_IV'].map((type, i) => (
        <Box key={type} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <BadgeIcon badgeType={type} size={56 + i * 8} earned animate drawIcon animationDelay={i * 0.3} />
          <Typography variant="caption">{BADGE_REGISTRY[type]?.name}</Typography>
        </Box>
      ))}
    </Box>
  ),
}
