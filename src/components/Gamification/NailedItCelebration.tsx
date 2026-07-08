/**
 * NailedItCelebration — Full-screen celebration modal triggered on
 * the first "Nailed It" event per session.
 *
 * @module NailedItCelebration
 */

import React, { useEffect } from 'react'
import Dialog from '@mui/material/Dialog'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export interface NailedItCelebrationProps {
  open: boolean
  nailedItReason: string
  onClose: () => void
}

export function NailedItCelebration({
  open,
  nailedItReason,
  onClose,
}: NailedItCelebrationProps) {
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (open && !reducedMotion) {
      // Dynamically import canvas-confetti to avoid SSR issues
      // @ts-expect-error — canvas-confetti has no type declarations
      import('canvas-confetti')
        .then((mod) => {
          const confetti = mod.default || mod
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } })
        })
        .catch(() => {
          // canvas-confetti not installed — skip silently
        })
    }
  }, [open, reducedMotion])

  return (
    <Dialog open={open} maxWidth="xs" fullWidth onClose={onClose}>
      <Box sx={{ textAlign: 'center', p: 4 }}>
        <Typography variant="h1" sx={{ fontSize: '4rem' }}>
          🎯
        </Typography>
        <Typography variant="h5" fontWeight={700} mt={2}>
          Nailed It!
        </Typography>
        <Typography variant="body1" color="text.secondary" mt={1}>
          {nailedItReason}
        </Typography>
        <Chip
          label="+20 XP"
          color="success"
          sx={{ mt: 2, fontSize: '1rem', p: 1 }}
        />
        <Button variant="contained" fullWidth sx={{ mt: 3 }} onClick={onClose}>
          Keep Going
        </Button>
      </Box>
    </Dialog>
  )
}

export default NailedItCelebration
