/**
 * PixelSpriteMascot — Renders a procedurally generated pixel creature
 * that evolves visually as the student levels up.
 *
 * Seed determines the creature shape (deterministic from studentId/guildId).
 * Stage controls visual complexity (maps to player level tiers).
 *
 * @module PixelSpriteMascot
 */

import React, { useMemo } from 'react'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { generatePixelSpriteSvg } from '../../utils/generatePixelSprite'

export interface PixelSpriteMascotProps {
  /** Deterministic seed (e.g. studentId, guildId) */
  seed: string
  /** Evolution stage 1-5, maps to level tiers */
  stage?: number
  /** Display size in px (the SVG scales to fit) */
  size?: number
  /** Label shown below the sprite */
  label?: string
  /** Whether the creature is "sleeping" (greyed out — streak broken) */
  sleeping?: boolean
  /** Tooltip text */
  tooltip?: string
  /** Click handler */
  onClick?: () => void
}

const STAGE_LABELS = ['Hatchling', 'Juvenile', 'Adult', 'Elder', 'Legendary']

export function PixelSpriteMascot({
  seed,
  stage = 1,
  size = 64,
  label,
  sleeping = false,
  tooltip,
  onClick,
}: PixelSpriteMascotProps) {
  const svg = useMemo(() => generatePixelSpriteSvg(seed, stage, 4), [seed, stage])

  const content = (
    <Box
      sx={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0.5,
        cursor: onClick ? 'pointer' : 'default',
        filter: sleeping ? 'grayscale(100%) opacity(0.5)' : 'none',
        transition: 'filter 0.3s, transform 0.2s',
        '&:hover': onClick
          ? { transform: 'scale(1.1)' }
          : sleeping
            ? {}
            : { transform: 'translateY(-2px)' },
      }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={tooltip || label || `Pixel mascot (stage ${stage})`}
    >
      <Box
        sx={{
          width: size,
          height: size,
          '& svg': { width: '100%', height: '100%' },
        }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      {label && (
        <Typography variant="caption" sx={{ fontWeight: 600, textAlign: 'center' }}>
          {label}
        </Typography>
      )}
    </Box>
  )

  if (tooltip) {
    return <Tooltip title={tooltip}>{content}</Tooltip>
  }

  return content
}

export { STAGE_LABELS }
export default PixelSpriteMascot
