/**
 * XPToast — Lightweight snackbar notification for XP awards.
 *
 * @module XPToast
 */

import React from 'react'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects'
import { useTranslations } from 'next-intl'

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
  const t = useTranslations('components')
  return (
    <>
      {/* Visually-hidden live region so screen readers announce XP gains */}
      <span
        aria-live="polite"
        aria-atomic="true"
        style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}
      >
        {open ? t('xpToast.message', { xpAmount, xpReason }) : ''}
      </span>
      <Snackbar
        open={open}
        autoHideDuration={autoHideDuration}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        onClose={onClose}
      >
        <Alert severity="success" icon={<EmojiObjectsIcon />} sx={{ fontWeight: 600 }}>
          {t('xpToast.message', { xpAmount, xpReason })}
        </Alert>
      </Snackbar>
    </>
  )
}

export default XPToast
