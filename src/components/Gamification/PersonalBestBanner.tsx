/**
 * PersonalBestBanner — Animated banner shown when a student beats their PB.
 *
 * @module PersonalBestBanner
 */

import React from 'react'
import Alert from '@mui/material/Alert'
import Collapse from '@mui/material/Collapse'
import Typography from '@mui/material/Typography'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'

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
  const improvement = previousBest != null ? Math.round(newScore - previousBest) : null

  return (
    <Collapse in={open}>
      <Alert
        severity="success"
        icon={<EmojiEventsIcon />}
        onClose={onClose}
        sx={{
          fontWeight: 600,
          border: '2px solid',
          borderColor: 'warning.main',
          mb: 2,
        }}
      >
        <Typography variant="subtitle2" fontWeight={700}>
          New Personal Best! 🏆
        </Typography>
        <Typography variant="body2">
          Score: {Math.round(newScore)}%
          {improvement != null && improvement > 0 && (
            <> — up {improvement} points from your previous best!</>
          )}
          {previousBest == null && <> — first recorded score for this unit!</>}
        </Typography>
      </Alert>
    </Collapse>
  )
}

export default PersonalBestBanner
