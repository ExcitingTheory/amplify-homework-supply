/**
 * RankChangeToast — Slide-in notification when a student's leaderboard rank changes.
 *
 * @module RankChangeToast
 */

import React from 'react'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'

export interface RankChangeToastProps {
  open: boolean
  /** Positive = moved up, negative = moved down */
  positionsChanged: number
  newRank: number
  onClose: () => void
  autoHideDuration?: number
}

export function RankChangeToast({
  open,
  positionsChanged,
  newRank,
  onClose,
  autoHideDuration = 3000,
}: RankChangeToastProps) {
  const movedUp = positionsChanged > 0
  const icon = movedUp ? <TrendingUpIcon /> : <TrendingDownIcon />
  const severity = movedUp ? 'success' : 'info'
  const message = movedUp
    ? `+${positionsChanged} positions on leaderboard! Now #${newRank} 🚀`
    : `Dropped ${Math.abs(positionsChanged)} position${Math.abs(positionsChanged) > 1 ? 's' : ''} — now #${newRank}`

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      onClose={onClose}
    >
      <Alert severity={severity} icon={icon} sx={{ fontWeight: 600 }}>
        {message}
      </Alert>
    </Snackbar>
  )
}

export default RankChangeToast
