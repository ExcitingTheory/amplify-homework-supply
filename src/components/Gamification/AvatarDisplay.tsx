/**
 * AvatarDisplay — Composite avatar component showing the DiceBear avatar
 * with streak count, level indicator, a settable badge (emoji + label),
 * and configurable border effects.
 *
 * @module AvatarDisplay
 */

import React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import WhatshotIcon from '@mui/icons-material/Whatshot'
import { DiceBearAvatar } from './DiceBearAvatar'
import { AvatarGlowRing, isGlowActive } from './AvatarGlowRing'
import type { AvatarStyleTier, AvatarOverrides } from './DiceBearAvatar'
import type { GlowRingConfig } from './AvatarGlowRing'
import type { LevelInfo } from '../../utils/xpCalculation'

// ============================================================================
// Types
// ============================================================================

/** Border effect style applied around the avatar */
export type AvatarBorderEffect =
  | 'none'
  | 'solid'
  | 'gradient'
  | 'pulse'
  | 'rainbow'
  | 'fire'
  | 'ice'
  | 'gold'
  | 'shadow'

/** A user-settable badge displayed at the bottom of the avatar */
export interface AvatarBadge {
  /** Emoji character to display */
  emoji: string
  /** Short label string displayed next to the emoji */
  label: string
}

export interface AvatarDisplayProps {
  /** Seed for DiceBear avatar generation */
  seed: string
  /** DiceBear style tier */
  style?: AvatarStyleTier
  /** Avatar size in pixels. Defaults to 64. */
  size?: number
  /** Current streak count (days). 0 hides the streak indicator. */
  streak?: number
  /** Level information from XP system */
  level?: LevelInfo
  /** Settable badge with emoji + label shown across the bottom */
  badge?: AvatarBadge | null
  /** Border effect around the avatar. Defaults to 'none'. */
  borderEffect?: AvatarBorderEffect
  /** Custom border color (used with 'solid' and 'gradient' effects) */
  borderColor?: string
  /** Secondary border color (used with 'gradient' effect) */
  borderColorSecondary?: string
  /** Optional glow ring config (overrides border effect when active) */
  glowRing?: GlowRingConfig | null
  /** Avatar customization overrides */
  overrides?: AvatarOverrides
  /** Optional click handler */
  onClick?: () => void
  /** Optional tooltip/label */
  label?: string
  /** Whether the avatar is locked */
  locked?: boolean
}

// ============================================================================
// Border effect styles
// ============================================================================

const BORDER_CONFIGS: Record<AvatarBorderEffect, (color?: string, secondary?: string) => Record<string, unknown>> = {
  none: () => ({}),
  solid: (color = '#1976d2') => ({
    border: `3px solid ${color}`,
  }),
  gradient: () => ({}), // Handled via AvatarGlowRing
  pulse: () => ({
    border: '3px solid #9c27b0',
    animation: 'avatarDisplayPulse 2s ease-in-out infinite',
    '@keyframes avatarDisplayPulse': {
      '0%, 100%': { boxShadow: '0 0 0 0 rgba(156, 39, 176, 0.4)' },
      '50%': { boxShadow: '0 0 0 8px rgba(156, 39, 176, 0)' },
    },
  }),
  rainbow: () => ({}), // Handled via AvatarGlowRing
  fire: () => ({
    border: '3px solid #ff4500',
    boxShadow: '0 0 8px rgba(255, 69, 0, 0.5), 0 0 16px rgba(255, 69, 0, 0.3)',
    animation: 'avatarDisplayFire 1.5s ease-in-out infinite alternate',
    '@keyframes avatarDisplayFire': {
      '0%': { boxShadow: '0 0 8px rgba(255, 69, 0, 0.5), 0 0 16px rgba(255, 69, 0, 0.3)' },
      '100%': { boxShadow: '0 0 12px rgba(255, 165, 0, 0.7), 0 0 24px rgba(255, 69, 0, 0.5)' },
    },
  }),
  ice: () => ({
    border: '3px solid #00bfff',
    boxShadow: '0 0 8px rgba(0, 191, 255, 0.4), 0 0 16px rgba(135, 206, 235, 0.2)',
  }),
  gold: () => ({
    border: '3px solid #ffd700',
    boxShadow: '0 0 6px rgba(255, 215, 0, 0.5), inset 0 0 4px rgba(255, 215, 0, 0.2)',
  }),
  shadow: () => ({
    border: '3px solid #424242',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), 0 2px 6px rgba(0, 0, 0, 0.3)',
  }),
}

/** Map border effects that need a glow ring to their ring config */
function getEffectGlowConfig(
  effect: AvatarBorderEffect,
  color?: string,
  secondary?: string,
): GlowRingConfig | null {
  if (effect === 'rainbow') {
    return {
      colors: ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd'],
      speed: 3,
      thickness: 3,
      active: true,
      expiresAt: null,
    }
  }
  if (effect === 'gradient') {
    return {
      colors: [color || '#ff6b6b', secondary || '#54a0ff'],
      speed: 6,
      thickness: 3,
      active: true,
      expiresAt: null,
    }
  }
  return null
}

// ============================================================================
// Component
// ============================================================================

export function AvatarDisplay({
  seed,
  style = 'simple',
  size = 64,
  streak = 0,
  level,
  badge,
  borderEffect = 'none',
  borderColor,
  borderColorSecondary,
  glowRing,
  overrides,
  onClick,
  label,
  locked = false,
}: AvatarDisplayProps) {
  const showGlow = glowRing && isGlowActive(glowRing)
  const effectGlow = getEffectGlowConfig(borderEffect, borderColor, borderColorSecondary)
  const activeGlow = showGlow ? glowRing! : effectGlow
  const borderStyles = activeGlow ? {} : BORDER_CONFIGS[borderEffect](borderColor, borderColorSecondary)

  // Total width including border effect space
  const containerSize = size + 16

  return (
    <Box
      sx={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0.5,
        position: 'relative',
        minWidth: containerSize,
      }}
    >
      {/* Streak indicator — 4 o'clock position */}
      {streak > 0 && (
        <Box
          sx={{
            position: 'absolute',
            top: '60%',
            right: -20,
            zIndex: 3,
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            bgcolor: 'background.paper',
            borderRadius: '10px',
            px: 0.5,
            py: '1px',
            boxShadow: 1,
            fontSize: '0.7rem',
          }}
        >
          <WhatshotIcon sx={{ fontSize: '0.85rem', color: streak >= 7 ? '#ff6d00' : '#ff9800' }} />
          <Typography variant="caption" sx={{ fontWeight: 700, lineHeight: 1 }}>
            {streak}
          </Typography>
        </Box>
      )}

      {/* Level indicator — 2 o'clock position */}
      {level && (
        <Box
          sx={{
            position: 'absolute',
            top: '28%',
            right: -18,
            zIndex: 3,
            bgcolor: 'background.paper',
            borderRadius: '10px',
            px: 0.5,
            py: '1px',
            boxShadow: 1,
          }}
        >
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, lineHeight: 1, fontSize: '0.65rem' }}
          >
            Lv.{level.level}
          </Typography>
        </Box>
      )}

      {/* Avatar with border effect */}
      <Box
        sx={{
          position: 'relative',
          borderRadius: '50%',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...(!activeGlow ? borderStyles : {}),
        }}
      >
        {activeGlow ? (
          <AvatarGlowRing size={size} config={activeGlow}>
            <DiceBearAvatar
              seed={seed}
              style={style}
              size={size}
              label={label}
              onClick={onClick}
              locked={locked}
              overrides={overrides}
            />
          </AvatarGlowRing>
        ) : (
          <DiceBearAvatar
            seed={seed}
            style={style}
            size={size}
            label={label}
            onClick={onClick}
            locked={locked}
            overrides={overrides}
          />
        )}
      </Box>

      {/* Badge strip — bottom */}
      {badge && (
        <Chip
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span role="img" aria-label="badge">{badge.emoji}</span>
              <span>{badge.label}</span>
            </Box>
          }
          size="small"
          sx={{
            mt: -1,
            height: 20,
            fontSize: '0.65rem',
            fontWeight: 600,
            '& .MuiChip-label': { px: 0.75 },
            bgcolor: 'action.selected',
            position: 'relative',
            zIndex: 2,
          }}
        />
      )}
    </Box>
  )
}

export default AvatarDisplay
