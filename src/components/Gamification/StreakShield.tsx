"use client";
/**
 * StreakShield — Shows remaining streak freezes as a heraldic shield medallion
 * (shared Medallion finish). Clicking reveals a tooltip explaining the mechanic.
 *
 * @module StreakShield
 */

import React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Tooltip from '@mui/material/Tooltip'
import { Medallion } from './Medallion'
import { HERALDRY, metalForTier } from '@/themes/heraldry'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export interface StreakShieldProps {
  /** Number of streak freezes remaining. */
  freezesRemaining: number
  /** Total freezes used historically. */
  freezesUsed?: number
  /** Size variant. Defaults to 'medium'. */
  size?: 'small' | 'medium'
  /** When true, renders a zero-state indicator instead of returning null when there are no freezes. */
  showEmpty?: boolean
}

export function StreakShield({ freezesRemaining, freezesUsed = 0, size = 'medium', showEmpty = false }: StreakShieldProps) {
  const reducedMotion = useReducedMotion()
  if (freezesRemaining <= 0 && freezesUsed <= 0 && !showEmpty) return null

  const isSmall = size === 'small'
  const px = isSmall ? 30 : 42
  const active = freezesRemaining > 0

  // Active shields read as azure with a progression rim; depleted reads sable/bronze.
  const field = active ? HERALDRY.tinctures.azure : HERALDRY.tinctures.sable
  const metal = active ? metalForTier(freezesRemaining * 2500) : HERALDRY.metals.bronze

  const charge = (
    <Typography
      component="span"
      sx={{
        fontWeight: 800,
        fontSize: px * 0.42,
        lineHeight: 1,
        color: active ? '#f5f5f5' : 'rgba(245,245,245,0.6)',
        textShadow: '0 1px 1px rgba(0,0,0,0.45)',
      }}
    >
      {freezesRemaining}
    </Typography>
  )

  return (
    <Tooltip
      title={`Streak Shields protect your streak if you miss a day. You have ${freezesRemaining} remaining. Earn 1 shield every 7-day streak.`}
      arrow
    >
      <Box sx={{ display: 'inline-flex', alignItems: 'center', cursor: 'help' }}>
        <Medallion
          shape="shield"
          size={px}
          rimMetal={metal}
          fieldColor={field.main}
          charge={charge}
          ariaLabel={`${freezesRemaining} streak shields remaining`}
          reducedMotion={reducedMotion}
        />
      </Box>
    </Tooltip>
  )
}

export default StreakShield
