/**
 * SquadCrest — Composes a deterministic heraldic mini-crest for a squad via the
 * shared `Medallion` primitive: a shield silhouette, a division/tinctures picked
 * from the squadId, a metallic rim keyed to totalXP, and a centered charge
 * (initials in a serif by default, or an optional icon device).
 *
 * @module SquadCrest
 */

import React, { useMemo } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { IconType } from 'react-icons'
import { Medallion } from './Medallion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import {
  pickTinctures,
  pickDivision,
  metalForTier,
  readableInk,
} from '@/themes/heraldry'

export interface SquadCrestProps {
  squadId: string
  squadName: string
  totalXP?: number
  size?: 'small' | 'medium' | 'large'
  showName?: boolean
  /** Optional deterministic charge device drawn in place of initials. */
  chargeIcon?: IconType
}

const SIZE_MAP = {
  small: 40,
  medium: 64,
  large: 96,
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('')
}

export function SquadCrest({
  squadId,
  squadName,
  totalXP,
  size = 'medium',
  showName = true,
  chargeIcon: ChargeIcon,
}: SquadCrestProps) {
  const reducedMotion = useReducedMotion()
  const px = SIZE_MAP[size]
  const initials = useMemo(() => getInitials(squadName), [squadName])
  const { field, charge } = useMemo(() => pickTinctures(squadId), [squadId])
  const division = useMemo(() => pickDivision(squadId), [squadId])
  const metal = useMemo(() => metalForTier(totalXP ?? 0), [totalXP])
  const ink = useMemo(() => readableInk(field.main), [field])

  const chargeNode = ChargeIcon ? (
    <ChargeIcon
      size={Math.round(px * 0.44)}
      color={charge.light}
      style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.35))' }}
    />
  ) : (
    <Typography
      component="span"
      sx={{
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontWeight: 700,
        fontSize: px * 0.4,
        lineHeight: 1,
        color: ink,
        textShadow: '0 1px 1px rgba(0,0,0,0.25)',
      }}
    >
      {initials}
    </Typography>
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
      <Medallion
        shape="shield"
        size={px}
        rimMetal={metal}
        fieldColor={field.main}
        divisionColor={charge.main}
        division={division}
        charge={chargeNode}
        ariaLabel={`${squadName} squad crest`}
        reducedMotion={reducedMotion}
      />
      {showName && (
        <Typography variant="subtitle2" sx={{ fontWeight: 600, textAlign: 'center' }}>
          {squadName}
        </Typography>
      )}
      {totalXP != null && (
        <Typography variant="caption" color="text.secondary">
          {totalXP.toLocaleString()} XP
        </Typography>
      )}
    </Box>
  )
}

export default SquadCrest

