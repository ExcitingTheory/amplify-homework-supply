import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Tooltip from '@mui/material/Tooltip'
import { BadgeIcon } from './BadgeIcon'
import {
  ANTI_BADGE_REGISTRY,
  type AntiBadgeConfig,
} from './antiBadgeRegistry'

/**
 * Anti-Badges — sardonic badges of shame with debuffs.
 *
 * These are the "achievements" nobody asked for: punishments wrapped in
 * glitter, educational puns taken too far, and pointed commentary on
 * the very concept of gamifying homework.
 */
const meta: Meta = {
  title: 'Gamification/Anti-Badges',
  parameters: {
    layout: 'padded',
  },
}
export default meta

// ── Helper: render a single anti-badge card ────────────────────────────

function AntiBadgeCard({
  badgeKey,
  config,
}: {
  badgeKey: string
  config: AntiBadgeConfig
}) {
  const debuff = config.debuff
  return (
    <Card
      variant="outlined"
      sx={{
        maxWidth: 340,
        borderColor: 'error.main',
        borderWidth: 1.5,
        bgcolor: 'grey.50',
      }}
    >
      <CardContent>
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <BadgeIcon config={config} size={64} earned />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={700}>
              {config.name}
            </Typography>
            <Chip
              label={config.rarity}
              size="small"
              color={
                config.rarity === 'legendary'
                  ? 'warning'
                  : config.rarity === 'epic'
                    ? 'secondary'
                    : config.rarity === 'rare'
                      ? 'primary'
                      : 'default'
              }
              sx={{ height: 18, fontSize: '0.6rem', mt: 0.25, mb: 0.5 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {config.description}
            </Typography>
          </Box>
        </Stack>

        {/* Debuff chips */}
        <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 1.5 }}>
          {debuff.xpMultiplier !== undefined && (
            <Chip
              label={`${debuff.xpMultiplier}× XP (${debuff.xpMultiplierDurationHours}h)`}
              size="small"
              color="error"
              variant="outlined"
              sx={{ height: 20, fontSize: '0.6rem' }}
            />
          )}
          {debuff.streakFreezesRemoved && (
            <Chip
              label={`-${debuff.streakFreezesRemoved} streak freeze`}
              size="small"
              color="error"
              variant="outlined"
              sx={{ height: 20, fontSize: '0.6rem' }}
            />
          )}
          {debuff.extraDrills && (
            <Chip
              label={`+${debuff.extraDrills} drill${debuff.extraDrills > 1 ? 's' : ''}`}
              size="small"
              color="warning"
              variant="outlined"
              sx={{ height: 20, fontSize: '0.6rem' }}
            />
          )}
          {debuff.avatarDowngrade && (
            <Chip
              label="avatar downgrade"
              size="small"
              color="error"
              variant="outlined"
              sx={{ height: 20, fontSize: '0.6rem' }}
            />
          )}
          {debuff.hideFromLeaderboard && (
            <Chip
              label={`hidden ${debuff.hideFromLeaderboardHours}h`}
              size="small"
              color="warning"
              variant="outlined"
              sx={{ height: 20, fontSize: '0.6rem' }}
            />
          )}
          {debuff.temporaryTitle && (
            <Chip
              label={debuff.temporaryTitle}
              size="small"
              sx={{ height: 20, fontSize: '0.6rem' }}
            />
          )}
        </Stack>

        {/* Shame text */}
        {debuff.shameText && (
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mt: 1,
              fontStyle: 'italic',
              color: 'text.secondary',
              lineHeight: 1.4,
            }}
          >
            &ldquo;{debuff.shameText}&rdquo;
          </Typography>
        )}

        {/* Redemption */}
        {config.redeemable && config.redemptionHint && (
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mt: 0.5,
              color: 'success.main',
              fontWeight: 600,
            }}
          >
            🔓 {config.redemptionHint}
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}

// ── Stories ──────────────────────────────────────────────────────────────

/** All anti-badges in a gallery grid */
export const Gallery: StoryObj = {
  render: () => (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
        🏴 Anti-Badge Hall of Shame
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Badges you earn by doing things wrong, doing nothing at all, or
        caring too much about this very system. Each comes with a debuff —
        because consequences should at least be funny.
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 2,
        }}
      >
        {Object.entries(ANTI_BADGE_REGISTRY).map(([key, config]) => (
          <AntiBadgeCard key={key} badgeKey={key} config={config} />
        ))}
      </Box>
    </Box>
  ),
}

/** Just the icons in a shelf layout */
export const IconShelf: StoryObj = {
  render: () => (
    <Box>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
        Anti-Badge Icon Shelf
      </Typography>
      <Stack direction="row" flexWrap="wrap" gap={1.5}>
        {Object.entries(ANTI_BADGE_REGISTRY).map(([key, config]) => (
          <Tooltip key={key} title={`${config.name}: ${config.description}`} arrow>
            <Box>
              <BadgeIcon config={config} size={56} earned />
            </Box>
          </Tooltip>
        ))}
      </Stack>
    </Box>
  ),
}

/** Locked (greyed out) anti-badges — how they look before you've "earned" them */
export const LockedState: StoryObj = {
  render: () => (
    <Box>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
        Locked Anti-Badges
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        You haven&apos;t messed up enough to earn these. Yet.
      </Typography>
      <Stack direction="row" flexWrap="wrap" gap={1.5}>
        {Object.entries(ANTI_BADGE_REGISTRY).map(([key, config]) => (
          <Tooltip key={key} title={`??? — Do something wrong to find out`} arrow>
            <Box>
              <BadgeIcon config={config} size={56} earned={false} />
            </Box>
          </Tooltip>
        ))}
      </Stack>
    </Box>
  ),
}

/** The 4th-wall-breaking meta badges only */
export const MetaBadges: StoryObj = {
  render: () => {
    const metaKeys = [
      'BADGE_COLLECTOR_ANONYMOUS',
      'GAMIFICATION_VICTIM',
      'SKINNER_BOX_RESIDENT',
      'ACHIEVEMENT_UNLOCKED_UNLOCKED',
      'ENGAGEMENT_METRICS',
      'NOTIFICATION_JUNKIE',
      'XP_ZERO_HERO',
    ]
    return (
      <Box>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
          🎭 Meta & 4th Wall Breakers
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Badges that know they&apos;re badges. Achievements that question the
          very nature of achievements. We&apos;re all just pigeons in a
          Skinner box now.
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 2,
          }}
        >
          {metaKeys.map((key) => {
            const config = ANTI_BADGE_REGISTRY[key]
            return config ? (
              <AntiBadgeCard key={key} badgeKey={key} config={config} />
            ) : null
          })}
        </Box>
      </Box>
    )
  },
}
