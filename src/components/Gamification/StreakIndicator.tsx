/**
 * StreakIndicator — Shows a flame icon and current streak day count.
 * Displays nothing when streak is 0. Adds a glow effect at 7-day milestones.
 *
 * @module StreakIndicator
 */

import React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import WhatshotIcon from '@mui/icons-material/Whatshot'

export interface StreakIndicatorProps {
  /** Current streak count in days. */
  currentStreak: number
  /** Size variant. Defaults to 'medium'. */
  size?: 'small' | 'medium'
  /** When true, renders a zero-state indicator instead of returning null when streak is 0. */
  showEmpty?: boolean
}

export function StreakIndicator({ currentStreak, size = 'medium', showEmpty = false }: StreakIndicatorProps) {
  if (currentStreak <= 0 && !showEmpty) return null

  const isMilestone = currentStreak >= 7
  const isSmall = size === 'small'

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        ...(isMilestone && {
          filter: 'drop-shadow(0 0 6px rgba(255,152,0,0.6))',
          animation: 'pulse 2s ease-in-out infinite',
          '@keyframes pulse': {
            '0%, 100%': { filter: 'drop-shadow(0 0 6px rgba(255,152,0,0.6))' },
            '50%': { filter: 'drop-shadow(0 0 12px rgba(255,152,0,0.9))' },
          },
        }),
      }}
    >
      <WhatshotIcon
        sx={{
          color: isMilestone ? '#ff6d00' : '#ff9800',
          fontSize: isSmall ? '1rem' : '1.25rem',
        }}
      />
      <Typography
        variant={isSmall ? 'caption' : 'body2'}
        sx={{ fontWeight: 700, color: 'text.primary' }}
      >
        {currentStreak}
      </Typography>
    </Box>
  )
}

export default StreakIndicator
