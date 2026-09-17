/**
 * Heraldry tincture & metal palette + deterministic pickers.
 *
 * Provides a curated, theme-safe set of heraldic tinctures (field/charge colors)
 * and metal ramps (rims) plus pure, deterministic pickers keyed off a seed
 * (e.g. a squadId). Output reads as a "designed crest" rather than a random
 * generated avatar. All values are static hex so they render crisp at any size
 * and stay legible across every app theme + dark mode.
 *
 * @module heraldry
 */

export interface Tincture {
  name: string
  /** Primary fill */
  main: string
  /** Darker stop (shadows / depth) */
  shade: string
  /** Lighter stop (highlights) */
  light: string
}

export interface MetalRamp {
  name: string
  /** Top specular stop of the rim */
  light: string
  /** Mid tone of the rim */
  mid: string
  /** Bottom shadow stop of the rim */
  dark: string
}

// ============================================================================
// Palette
// ============================================================================

export const HERALDRY = {
  tinctures: {
    or: { name: 'or', main: '#e0a91f', shade: '#a97c0c', light: '#f4d276' },
    argent: { name: 'argent', main: '#d5dbe2', shade: '#a5aeb8', light: '#f2f5f8' },
    gules: { name: 'gules', main: '#b12a2f', shade: '#7a171b', light: '#d6595d' },
    azure: { name: 'azure', main: '#1f4e9c', shade: '#12356e', light: '#587fc2' },
    vert: { name: 'vert', main: '#2d7a4d', shade: '#1a5233', light: '#5da679' },
    sable: { name: 'sable', main: '#262b31', shade: '#111417', light: '#4d565f' },
    purpure: { name: 'purpure', main: '#6b2d8e', shade: '#471c60', light: '#9758b8' },
  },
  metals: {
    bronze: { name: 'bronze', light: '#e6b98f', mid: '#a86b34', dark: '#6d4018' },
    silver: { name: 'silver', light: '#f4f6f9', mid: '#c1c9d2', dark: '#868f9a' },
    gold: { name: 'gold', light: '#fbe9a6', mid: '#dfb63f', dark: '#a17b16' },
    platinum: { name: 'platinum', light: '#f8fbff', mid: '#d6dde8', dark: '#9facbd' },
  },
} as const

export type TinctureKey = keyof typeof HERALDRY.tinctures
export type MetalKey = keyof typeof HERALDRY.metals

export type HeraldicDivision = 'plain' | 'per-pale' | 'per-fess' | 'chevron' | 'bend'

const TINCTURE_KEYS = Object.keys(HERALDRY.tinctures) as TinctureKey[]
const DIVISIONS: HeraldicDivision[] = ['plain', 'per-pale', 'per-fess', 'chevron', 'bend']

// Ascending metal tiers keyed to a magnitude (XP-scale). Highest first.
const METAL_TIERS: Array<{ min: number; key: MetalKey }> = [
  { min: 15000, key: 'platinum' },
  { min: 5000, key: 'gold' },
  { min: 1000, key: 'silver' },
  { min: 0, key: 'bronze' },
]

// ============================================================================
// Deterministic helpers
// ============================================================================

/** Stable 32-bit-ish hash of a seed string. Always non-negative. */
export function hashSeed(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
    hash |= 0
  }
  return Math.abs(hash)
}

/**
 * Pick a field + charge tincture from a seed. The charge is always a different
 * tincture than the field so the crest reads with contrast.
 */
export function pickTinctures(seed: string): { field: Tincture; charge: Tincture } {
  const h = hashSeed(seed)
  const fieldIdx = h % TINCTURE_KEYS.length
  const chargeOffset = 1 + ((h >> 3) % (TINCTURE_KEYS.length - 1))
  const chargeIdx = (fieldIdx + chargeOffset) % TINCTURE_KEYS.length
  return {
    field: HERALDRY.tinctures[TINCTURE_KEYS[fieldIdx]],
    charge: HERALDRY.tinctures[TINCTURE_KEYS[chargeIdx]],
  }
}

/** Pick a heraldic division (ordinary) from a seed. */
export function pickDivision(seed: string): HeraldicDivision {
  const h = hashSeed(seed)
  return DIVISIONS[(h >> 5) % DIVISIONS.length]
}

/** Map an XP-scale magnitude to a metal ramp for the rim (visible progression). */
export function metalForTier(xpOrLevel: number): MetalRamp {
  const v = Number.isFinite(xpOrLevel) ? Math.max(0, xpOrLevel) : 0
  const tier = METAL_TIERS.find((t) => v >= t.min) ?? METAL_TIERS[METAL_TIERS.length - 1]
  return HERALDRY.metals[tier.key]
}

/**
 * Return a legible ink color (near-black or near-white) for text/charges laid
 * over the given background hex, using WCAG relative luminance.
 */
export function readableInk(hexColor: string): string {
  const hex = hexColor.replace('#', '')
  const full =
    hex.length === 3
      ? hex
          .split('')
          .map((c) => c + c)
          .join('')
      : hex
  const r = parseInt(full.slice(0, 2), 16) / 255
  const g = parseInt(full.slice(2, 4), 16) / 255
  const b = parseInt(full.slice(4, 6), 16) / 255
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
  const lum = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
  return lum > 0.45 ? '#1a1a1a' : '#f5f5f5'
}
