/**
 * AvatarGlowRing — Animated rotating gradient ring that encircles an avatar.
 *
 * Renders a conic-gradient border that continuously rotates, with a soft
 * outer glow that pulses. The gradient colors are user-configurable.
 *
 * Activated by the AVATAR_GLOW badge (earned on level-up) for a limited
 * duration, or permanently via easter egg.
 *
 * @module AvatarGlowRing
 */

import React from 'react'
import Box from '@mui/material/Box'

// ============================================================================
// Types
// ============================================================================

export interface GlowRingConfig {
  /** Gradient stop colors (minimum 2). Defaults to rainbow. */
  colors: string[]
  /** Duration of one full rotation in seconds. Defaults to 4. */
  speed?: number
  /** Ring thickness in px. Defaults to 3. */
  thickness?: number
  /** Whether the ring is currently active/visible */
  active: boolean
  /** ISO timestamp when the glow expires (null = permanent) */
  expiresAt?: string | null
}

export interface AvatarGlowRingProps {
  /** The avatar element to wrap */
  children: React.ReactNode
  /** Avatar size in px — used to size the ring */
  size: number
  /** Glow ring configuration */
  config: GlowRingConfig
}

// ============================================================================
// Default colors
// ============================================================================

export const DEFAULT_GLOW_COLORS = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd']

export const GLOW_COLOR_PRESETS: Record<string, string[]> = {
  rainbow: ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd'],
  fire: ['#ff4500', '#ff6347', '#ffa500', '#ffd700', '#ff4500'],
  ice: ['#00bfff', '#87ceeb', '#e0ffff', '#4169e1', '#00bfff'],
  aurora: ['#00ff87', '#60efff', '#ff00e5', '#00ff87'],
  sunset: ['#ff6b35', '#f7c59f', '#efefd0', '#ff6b35'],
  ocean: ['#0077b6', '#00b4d8', '#90e0ef', '#caf0f8', '#0077b6'],
  neon: ['#39ff14', '#ff073a', '#00fff7', '#f2ea02', '#39ff14'],
}

/** Duration of the level-up glow powerup (24 hours in ms) */
export const GLOW_LEVEL_UP_DURATION_MS = 24 * 60 * 60 * 1000

// ============================================================================
// Helpers
// ============================================================================

/** Check whether a glow ring config is currently active (not expired) */
export function isGlowActive(config: GlowRingConfig | null | undefined): boolean {
  if (!config?.active) return false
  if (!config.expiresAt) return true // permanent
  return new Date(config.expiresAt).getTime() > Date.now()
}

/** Build a conic-gradient CSS string from color stops */
function buildConicGradient(colors: string[]): string {
  if (colors.length < 2) return `conic-gradient(${colors[0] || '#fff'}, ${colors[0] || '#fff'})`
  // Distribute colors evenly and repeat the first to close the loop
  const stops = [...colors, colors[0]]
  const step = 360 / (stops.length - 1)
  const cssStops = stops.map((c, i) => `${c} ${Math.round(step * i)}deg`).join(', ')
  return `conic-gradient(${cssStops})`
}

// Unique ID counter for SVG filter deduplication
let glowIdCounter = 0

// ============================================================================
// Component
// ============================================================================

export function AvatarGlowRing({ children, size, config }: AvatarGlowRingProps) {
  const active = isGlowActive(config)
  const idRef = React.useRef(++glowIdCounter)

  if (!active) {
    // No ring — just render the avatar directly
    return <>{children}</>
  }

  const {
    colors = DEFAULT_GLOW_COLORS,
    speed = 4,
    thickness = 3,
  } = config

  const ringSize = size + thickness * 2 + 4 // avatar + ring + small gap
  const gradient = buildConicGradient(colors)
  const glowColor = colors[0] || '#fff'
  const filterId = `glow-blur-${idRef.current}`

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: ringSize,
        height: ringSize,
      }}
    >
      {/* SVG filter for the glow effect */}
      <svg width={0} height={0} style={{ position: 'absolute' }}>
        <defs>
          <filter id={filterId}>
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* Rotating gradient ring */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: gradient,
          filter: `url(#${filterId})`,
          animation: `avatarGlowSpin ${speed}s linear infinite`,
          '@keyframes avatarGlowSpin': {
            '0%': { transform: 'rotate(0deg)' },
            '100%': { transform: 'rotate(360deg)' },
          },
        }}
      />

      {/* Pulsing outer glow */}
      <Box
        sx={{
          position: 'absolute',
          inset: -2,
          borderRadius: '50%',
          boxShadow: `0 0 ${size * 0.15}px ${glowColor}40, 0 0 ${size * 0.3}px ${glowColor}20`,
          animation: `avatarGlowPulse ${speed * 0.75}s ease-in-out infinite alternate`,
          '@keyframes avatarGlowPulse': {
            '0%': { opacity: 0.6 },
            '100%': { opacity: 1 },
          },
        }}
      />

      {/* Inner mask — creates the "ring" by covering the center */}
      <Box
        sx={{
          position: 'absolute',
          inset: `${thickness + 2}px`,
          borderRadius: '50%',
          bgcolor: 'background.paper',
        }}
      />

      {/* Avatar content — centered on top */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          display: 'inline-flex',
          borderRadius: '50%',
        }}
      >
        {children}
      </Box>
    </Box>
  )
}

export default AvatarGlowRing
