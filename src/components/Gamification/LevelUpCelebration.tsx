"use client";
/* eslint-disable i18next/no-literal-string */
/**
 * LevelUpCelebration — Full-screen celebration modal triggered when a
 * student levels up. Fires confetti, shows the new level badge, and is
 * dismissible via button, Escape, or backdrop click.
 *
 * Respects reduced-motion preferences: confetti is skipped and the
 * entrance animation is replaced with a simple fade.
 *
 * @module LevelUpCelebration
 */

import React, { useEffect } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import Fade from '@mui/material/Fade'
import Typography from '@mui/material/Typography'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export interface LevelUpCelebrationProps {
  open: boolean
  newLevel: number
  newLabel: string
  onClose: () => void
}

export function LevelUpCelebration({
  open,
  newLevel,
  newLabel,
  onClose,
}: LevelUpCelebrationProps) {
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (open && !reducedMotion) {
      // Fire confetti burst
      // @ts-expect-error — canvas-confetti has no type declarations
      import('canvas-confetti')
        .then((mod) => {
          const confetti = (mod as any).default || mod
          // Double burst for celebration emphasis
          confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } })
          setTimeout(() => {
            confetti({ particleCount: 60, spread: 100, origin: { y: 0.6 } })
          }, 300)
        })
        .catch(() => { /* canvas-confetti unavailable */ })
    }
  }, [open, reducedMotion])

  // Auto-dismiss after 8 seconds if user doesn't interact
  useEffect(() => {
    if (!open) return
    const t = setTimeout(onClose, 8000)
    return () => clearTimeout(t)
  }, [open, onClose])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      TransitionComponent={Fade}
      transitionDuration={reducedMotion ? 0 : 400}
      slotProps={{
        paper: {
          sx: {
            overflow: 'visible',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.95) 0%, rgba(139,92,246,0.95) 100%)',
            color: '#fff',
            borderRadius: 4,
          },
        },
      }}
    >
      <Box
        sx={{
          textAlign: 'center',
          p: 5,
          position: 'relative',
          ...(!reducedMotion && {
            animation: 'levelUpEntrance 0.6s ease-out',
            '@keyframes levelUpEntrance': {
              '0%': { opacity: 0, transform: 'scale(0.8) translateY(20px)' },
              '60%': { opacity: 1, transform: 'scale(1.05) translateY(-5px)' },
              '100%': { transform: 'scale(1) translateY(0)' },
            },
          }),
        }}
      >
        {/* Level badge circle */}
        <Box
          sx={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            border: '4px solid rgba(255,255,255,0.4)',
            bgcolor: 'rgba(255,255,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2,
            ...(!reducedMotion && {
              animation: 'badgePulse 2s ease-in-out infinite',
              '@keyframes badgePulse': {
                '0%, 100%': { boxShadow: '0 0 0 0 rgba(255,255,255,0.3)' },
                '50%': { boxShadow: '0 0 0 12px rgba(255,255,255,0)' },
              },
            }),
          }}
        >
          <Typography variant="h2" sx={{ fontWeight: 900, fontSize: '2.5rem' }}>
            {newLevel}
          </Typography>
        </Box>

        <Typography
          variant="overline"
          sx={{ letterSpacing: 3, opacity: 0.8, display: 'block' }}
        >
          Level Up!
        </Typography>

        <Typography variant="h4" fontWeight={800} sx={{ mt: 1 }}>
          {newLabel}
        </Typography>

        <Typography variant="body1" sx={{ mt: 1.5, opacity: 0.85 }}>
          You reached level {newLevel}. Keep up the great work!
        </Typography>

        <Button
          variant="contained"
          onClick={onClose}
          sx={{
            mt: 3,
            bgcolor: 'rgba(255,255,255,0.2)',
            color: '#fff',
            fontWeight: 700,
            '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
            borderRadius: 3,
            px: 4,
          }}
        >
          Continue
        </Button>
      </Box>
    </Dialog>
  )
}

export default LevelUpCelebration
