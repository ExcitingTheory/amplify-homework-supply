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
import * as loreleiNeutral from '@dicebear/lorelei-neutral'
import * as notionists from '@dicebear/notionists'
import * as openPeeps from '@dicebear/open-peeps'
import * as personas from '@dicebear/personas'
import { AvatarGlowRing, isGlowActive } from './AvatarGlowRing'
import type { GlowRingConfig } from './AvatarGlowRing'

// ============================================================================
// Types
// ============================================================================

/** DiceBear style tier — unlocked progressively via XP */
export type AvatarStyleTier = 'simple' | 'detailed' | 'toonhead' | 'lorelei' | 'notionists' | 'openpeeps' | 'personas'

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
  /** Optional glow ring configuration (earned via AVATAR_GLOW badge) */
  glowRing?: GlowRingConfig | null
}

// ============================================================================
// Style config — maps tier to DiceBear style collection + metadata
// ============================================================================

const STYLE_CONFIG: Record<AvatarStyleTier, { displayName: string; description: string }> = {
  simple:     { displayName: 'Avataaars Neutral', description: 'Clean neutral character avatars' },
  detailed:   { displayName: 'Avataaars', description: 'Full-featured character avatars' },
  toonhead:   { displayName: 'Toon Head', description: 'Animated-series character portraits' },
  lorelei:    { displayName: 'Lorelei', description: 'Soft pencil-sketch style portraits' },
  notionists: { displayName: 'Notionists', description: 'Minimalist line-art characters' },
  openpeeps:  { displayName: 'Open Peeps', description: 'Hand-drawn illustration people' },
  personas:   { displayName: 'Personas', description: 'Colorful geometric character avatars' },
}

/** Maps style tier to its DiceBear collection module */
const STYLE_MAP: Record<AvatarStyleTier, Parameters<typeof createAvatar>[0]> = {
  simple: avataaarsNeutral,
  detailed: avataaars,
  toonhead: toonHead,
  lorelei: loreleiNeutral,
  notionists: notionists,
  openpeeps: openPeeps,
  personas: personas,
}

// ============================================================================
// Avatar unlock configuration — instructor-customizable per section
// ============================================================================

/** A single level → style unlock mapping */
export interface AvatarUnlockEntry {
  /** Minimum level required to unlock this style */
  minLevel: number
  /** The DiceBear style tier unlocked at this level */
  tier: AvatarStyleTier
}

/** Instructor-configurable avatar unlock schedule */
export interface AvatarUnlockConfig {
  /** Ordered list of level → style unlock mappings (highest level first) */
  unlocks: AvatarUnlockEntry[]
  /** Whether the glow ring powerup is enabled on level-up */
  glowOnLevelUp?: boolean
  /** Per-feature-set unlock levels (within each style) */
  featureUnlockLevels?: FeatureUnlockLevels
}

/** Configurable level offsets at which feature sets become available (relative to style unlock level) */
export interface FeatureUnlockLevels {
  /** Levels after style unlock at which hair color, clothes color, hair/top, and clothing unlock. Default 2. */
  hairAndClothing?: number
  /** Levels after style unlock at which facial hair and accessories unlock. Default 3. */
  accessories?: number
}

/** All available style tiers for the instructor to choose from */
export const ALL_AVATAR_STYLES: AvatarStyleTier[] = [
  'simple', 'detailed', 'toonhead', 'lorelei', 'notionists', 'openpeeps', 'personas',
]

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
  glowRing,
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

  const showGlow = glowRing && isGlowActive(glowRing)

  const wrapGlow = (node: React.ReactElement) =>
    showGlow ? (
      <AvatarGlowRing size={size} config={glowRing!}>
        {node}
      </AvatarGlowRing>
    ) : node

  if (label) {
    return (
      <Tooltip title={locked ? `${label} (Locked)` : label}>
        {wrapGlow(avatar)}
      </Tooltip>
    )
  }

  return wrapGlow(avatar)
}

// ============================================================================
// Utility: get the style tier for a given level
// ============================================================================

/** Default level → style unlock schedule (used when no instructor config) */
const DEFAULT_LEVEL_TIERS: AvatarUnlockEntry[] = [
  { minLevel: 3, tier: 'toonhead' },
  { minLevel: 2, tier: 'detailed' },
  { minLevel: 1, tier: 'simple' },
]

/** @deprecated Use DEFAULT_LEVEL_TIERS instead */
const LEVEL_TIERS = DEFAULT_LEVEL_TIERS

/** Returns the highest style tier unlocked at a given level. */
export function getUnlockedStyleTier(level: number, config?: AvatarUnlockConfig | null): AvatarStyleTier {
  const tiers = config?.unlocks?.length ? config.unlocks : DEFAULT_LEVEL_TIERS
  // Ensure sorted descending by minLevel for correct lookup
  const sorted = [...tiers].sort((a, b) => b.minLevel - a.minLevel)
  for (const entry of sorted) {
    if (level >= entry.minLevel) return entry.tier
  }
  return sorted[sorted.length - 1]?.tier ?? 'simple'
}

/** Returns all unlocked style tiers at a given level. */
export function getUnlockedStyles(level: number, config?: AvatarUnlockConfig | null): AvatarStyleTier[] {
  const tiers = config?.unlocks?.length ? config.unlocks : DEFAULT_LEVEL_TIERS
  return tiers.filter((entry) => level >= entry.minLevel).map((e) => e.tier)
}

/** Returns all style tiers with their locked/unlocked status at a given level. */
export function getStyleTierStatus(level: number, config?: AvatarUnlockConfig | null): Array<{ tier: AvatarStyleTier; unlocked: boolean; displayName: string }> {
  const tiers = config?.unlocks?.length ? config.unlocks : DEFAULT_LEVEL_TIERS
  return [...tiers].sort((a, b) => a.minLevel - b.minLevel).map((entry) => ({
    tier: entry.tier,
    unlocked: level >= entry.minLevel,
    displayName: STYLE_CONFIG[entry.tier]?.displayName ?? entry.tier,
  }))
}

export { STYLE_CONFIG }

export default DiceBearAvatar
