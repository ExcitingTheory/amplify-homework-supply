/**
 * EasterEggToast — Snackbar notification when a student discovers an Easter egg.
 *
 * @module EasterEggToast
 */

import React from 'react'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import SearchIcon from '@mui/icons-material/Search'

export interface EasterEggToastProps {
  open: boolean
  message: string
  xpReward: number
  onClose: () => void
  autoHideDuration?: number
}

export function EasterEggToast({
  open,
  message,
  xpReward,
  onClose,
  autoHideDuration = 4000,
}: EasterEggToastProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      onClose={onClose}
    >
      <Alert
        severity="info"
        icon={<SearchIcon />}
        onClose={onClose}
        sx={{ fontWeight: 600, border: '1px solid', borderColor: 'info.main' }}
      >
        🔍 Secret Unlocked! {message} (+{xpReward} XP)
      </Alert>
    </Snackbar>
  )
}

export default EasterEggToast
