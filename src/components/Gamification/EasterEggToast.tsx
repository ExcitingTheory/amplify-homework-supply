/**
 * EasterEggToast — Snackbar notification when a student discovers an Easter egg.
 *
 * @module EasterEggToast
 */

import React from 'react'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('components')
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
        {t('easterEggToast.message', { message, xpReward })}
      </Alert>
    </Snackbar>
  )
}

export default EasterEggToast
