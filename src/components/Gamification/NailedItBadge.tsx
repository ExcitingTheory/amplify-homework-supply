/**
 * NailedItBadge — Inline chip badge for workbook blocks that
 * received a "Nailed It" response from the AI.
 *
 * @module NailedItBadge
 */

import React from 'react'
import Chip from '@mui/material/Chip'
import StarIcon from '@mui/icons-material/Star'
import { useTranslations } from 'next-intl'

export interface NailedItBadgeProps {
  /** Size variant. Defaults to 'small'. */
  size?: 'small' | 'medium'
}

export function NailedItBadge({ size = 'small' }: NailedItBadgeProps) {
  const t = useTranslations('components')
  return (
    <Chip
      icon={<StarIcon />}
      label={t('nailedItBadge.label')}
      color="success"
      variant="filled"
      size={size}
      sx={{ fontWeight: 700, ml: 1 }}
    />
  )
}

export default NailedItBadge
