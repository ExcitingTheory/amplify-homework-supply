/**
 * PersonalBestBanner — Animated banner shown when a student beats their PB.
 *
 * @module PersonalBestBanner
 */

import React from 'react'
import Alert from '@mui/material/Alert'
import Collapse from '@mui/material/Collapse'
import Typography from '@mui/material/Typography'
import { useTranslations } from 'next-intl'
import BadgeIcon from './BadgeIcon'

export interface PersonalBestBannerProps {
  open: boolean
  newScore: number
  previousBest: number | null
  onClose: () => void
}

export function PersonalBestBanner({
  open,
  newScore,
  previousBest,
  onClose,
}: PersonalBestBannerProps) {
  const t = useTranslations('components')
  const improvement = previousBest != null ? Math.round(newScore - previousBest) : null

  return (
    <Collapse in={open}>
      <Alert
        severity="success"
        icon={<BadgeIcon badgeType="TOP_OF_CLASS" size={32} earned animate />}
        onClose={onClose}
        sx={{
          fontWeight: 600,
          border: '2px solid',
          borderColor: 'warning.main',
          mb: 2,
        }}
      >
        <Typography variant="subtitle2" fontWeight={700}>
          {t('personalBestBanner.title')}
        </Typography>
        <Typography variant="body2">
          {improvement != null && improvement > 0
            ? t('personalBestBanner.scoreImproved', { score: Math.round(newScore), improvement })
            : previousBest == null
              ? t('personalBestBanner.scoreFirst', { score: Math.round(newScore) })
              : t('personalBestBanner.score', { score: Math.round(newScore) })}
        </Typography>
      </Alert>
    </Collapse>
  )
}

export default PersonalBestBanner
