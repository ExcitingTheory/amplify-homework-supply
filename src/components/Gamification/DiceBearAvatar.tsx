/**
 * DiceBearAvatar — Generates and displays a DiceBear SVG avatar
 * from a seed string. Supports multiple style sets that unlock
 * at XP milestones.
 *
 * Uses `@dicebear/core` + style packages to generate inline SVG
 * entirely client-side — no external API calls.
 *
 * @module DiceBearAvatar
 */

import React, { useMemo } from 'react'
import Avatar from '@mui/material/Avatar'
import Tooltip from '@mui/material/Tooltip'
import { createAvatar } from '@dicebear/core'
import * as avataaarsNeutral from '@dicebear/avataaars-neutral'
import * as avataaars from '@dicebear/avataaars'
import * as toonHead from '@dicebear/toon-head'

// ============================================================================
// Types
// ============================================================================

/** DiceBear style tier — unlocked progressively via XP */
export type AvatarStyleTier = 'simple' | 'detailed' | 'toonhead'

export interface AvatarOverrides {
  backgroundColor?: string[]
  skinColor?: string[]
  hairColor?: string[]
  // Avataaars (detailed) options
  clothesColor?: string[]
  clothing?: string[]
  top?: string[]
  eyebrows?: string[]
  eyes?: string[]
  mouth?: string[]
  facialHair?: string[]
  facialHairProbability?: number
  accessories?: string[]
  accessoriesProbability?: number
  // Toon Head options
  hair?: string[]
  beard?: string[]
  beardProbability?: number
  clothes?: string[]
  rearHair?: string[]
  rearHairProbability?: number
}

export interface DiceBearAvatarProps {
  /** Seed for deterministic avatar generation (e.g. studentId, username) */
  seed: string
  /** DiceBear style to render. Defaults to 'simple'. */
  style?: AvatarStyleTier
  /** Size in pixels */
  size?: number
  /** Optional tooltip label */
  label?: string
  /** Optional click handler */
  onClick?: () => void
  /** Whether this avatar is "locked" (greyed out, not yet unlocked) */
  locked?: boolean
  /** Optional customization overrides */
  overrides?: AvatarOverrides
}

// ============================================================================
// Style config — maps tier to DiceBear style collection + metadata
// ============================================================================

const STYLE_CONFIG: Record<AvatarStyleTier, { displayName: string; description: string }> = {
  simple:   { displayName: 'Avataaars Neutral', description: 'Clean neutral character avatars' },
  detailed: { displayName: 'Avataaars', description: 'Full-featured character avatars' },
  toonhead: { displayName: 'Toon Head', description: 'Animated-series character portraits' },
}

/** Maps style tier to its DiceBear collection module */
const STYLE_MAP: Record<AvatarStyleTier, Parameters<typeof createAvatar>[0]> = {
  simple: avataaarsNeutral,
  detailed: avataaars,
  toonhead: toonHead,
}

// ============================================================================
// Component
// ============================================================================

export function DiceBearAvatar({
  seed,
  style = 'simple',
  size = 48,
  label,
  onClick,
  locked = false,
  overrides,
}: DiceBearAvatarProps) {
  const dataUri = useMemo(
    () => {
      const options: Record<string, unknown> = { seed, size }
      if (overrides) {
        Object.entries(overrides).forEach(([key, value]) => {
          if (value !== undefined) options[key] = value
        })
      }
      const avatar = createAvatar(STYLE_MAP[style], options)
      return avatar.toDataUri()
    },
    [seed, style, size, overrides],
  )

  const avatar = (
    <Avatar
      src={dataUri}
      alt={label || seed}
      onClick={onClick}
      sx={{
        width: size,
        height: size,
        cursor: onClick ? 'pointer' : 'default',
        filter: locked ? 'grayscale(100%) opacity(0.4)' : 'none',
        transition: 'filter 0.3s ease',
        '&:hover': onClick
          ? { filter: locked ? 'grayscale(100%) opacity(0.5)' : 'brightness(1.1)' }
          : undefined,
      }}
    />
  )

  if (label) {
    return (
      <Tooltip title={locked ? `${label} (Locked)` : label}>
        {avatar}
      </Tooltip>
    )
  }

  return avatar
}

// ============================================================================
// Utility: get the style tier for a given level
// ============================================================================

const LEVEL_TIERS: Array<{ minLevel: number; tier: AvatarStyleTier }> = [
  { minLevel: 3, tier: 'toonhead' },
  { minLevel: 2, tier: 'detailed' },
  { minLevel: 1, tier: 'simple' },
]

/** Returns the highest style tier unlocked at a given level. */
export function getUnlockedStyleTier(level: number): AvatarStyleTier {
  for (const entry of LEVEL_TIERS) {
    if (level >= entry.minLevel) return entry.tier
  }
  return 'simple'
}

/** Returns all unlocked style tiers at a given level. */
export function getUnlockedStyles(level: number): AvatarStyleTier[] {
  return LEVEL_TIERS.filter((entry) => level >= entry.minLevel).map((e) => e.tier)
}

/** Returns all style tiers with their locked/unlocked status at a given level. */
export function getStyleTierStatus(level: number): Array<{ tier: AvatarStyleTier; unlocked: boolean; displayName: string }> {
  return LEVEL_TIERS.slice().reverse().map((entry) => ({
    tier: entry.tier,
    unlocked: level >= entry.minLevel,
    displayName: STYLE_CONFIG[entry.tier].displayName,
  }))
}

export { STYLE_CONFIG }

export default DiceBearAvatar
