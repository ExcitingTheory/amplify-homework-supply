/**
 * StreakShield — Shows remaining streak freezes with a shield icon.
 * Clicking reveals a tooltip explaining the mechanic.
 *
 * @module StreakShield
 */

import React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Tooltip from '@mui/material/Tooltip'
import ShieldIcon from '@mui/icons-material/Shield'

export interface StreakShieldProps {
  /** Number of streak freezes remaining. */
  freezesRemaining: number
  /** Total freezes used historically. */
  freezesUsed?: number
  /** Size variant. Defaults to 'medium'. */
  size?: 'small' | 'medium'
}

export function StreakShield({ freezesRemaining, freezesUsed = 0, size = 'medium' }: StreakShieldProps) {
  if (freezesRemaining <= 0 && freezesUsed <= 0) return null

  const isSmall = size === 'small'

  return (
    <Tooltip
      title={`Streak Shields protect your streak if you miss a day. You have ${freezesRemaining} remaining. Earn 1 shield every 7-day streak.`}
      arrow
    >
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          cursor: 'help',
        }}
      >
        <ShieldIcon
          sx={{
            fontSize: isSmall ? '1rem' : '1.25rem',
            color: freezesRemaining > 0 ? 'info.main' : 'action.disabled',
          }}
        />
        <Typography
          variant={isSmall ? 'caption' : 'body2'}
          sx={{ fontWeight: 700, color: 'text.primary' }}
        >
          {freezesRemaining}
        </Typography>
      </Box>
    </Tooltip>
  )
}

export default StreakShield
