/**
 * XPToast — Lightweight snackbar notification for XP awards.
 *
 * @module XPToast
 */

import React from 'react'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects'

export interface XPToastProps {
  open: boolean
  xpAmount: number
  xpReason: string
  onClose: () => void
  autoHideDuration?: number
}

export function XPToast({
  open,
  xpAmount,
  xpReason,
  onClose,
  autoHideDuration = 2500,
}: XPToastProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      onClose={onClose}
    >
      <Alert severity="success" icon={<EmojiObjectsIcon />} sx={{ fontWeight: 600 }}>
        +{xpAmount} XP — {xpReason}
      </Alert>
    </Snackbar>
  )
}

export default XPToast
