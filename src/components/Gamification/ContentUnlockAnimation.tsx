"use client";
/**
 * ContentUnlockAnimation — Shows a padlock-open + shimmer animation
 * when content transitions from locked to unlocked.
 *
 * @module ContentUnlockAnimation
 */

import React, { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export interface ContentUnlockAnimationProps {
  /** Whether the unlock animation should play */
  show: boolean
  /** Content title that was unlocked */
  title: string
  /** Called after the animation completes */
  onComplete?: () => void
}

export function ContentUnlockAnimation({
  show,
  title,
  onComplete,
}: ContentUnlockAnimationProps) {
  const [phase, setPhase] = useState<'idle' | 'shake' | 'open' | 'shimmer' | 'done'>('idle')
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (!show) {
      setPhase('idle')
      return
    }

    // Skip animation — go straight to done after a brief flash
    if (reducedMotion) {
      setPhase('open')
      const t = setTimeout(() => {
        setPhase('done')
        onComplete?.()
      }, 800)
      return () => clearTimeout(t)
    }

    setPhase('shake')

    const t1 = setTimeout(() => setPhase('open'), 600)
    const t2 = setTimeout(() => setPhase('shimmer'), 1200)
    const t3 = setTimeout(() => {
      setPhase('done')
      onComplete?.()
    }, 2400)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [show, onComplete, reducedMotion])

  if (phase === 'idle' || phase === 'done') return null

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        bgcolor: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        pointerEvents: 'none',
      }}
    >
      <Box
        sx={{
          fontSize: '4rem',
          ...(reducedMotion
            ? {}
            : {
                animation:
                  phase === 'shake'
                    ? 'unlockShake 0.5s ease-in-out'
                    : phase === 'open'
                      ? 'unlockOpen 0.5s ease-out forwards'
                      : phase === 'shimmer'
                        ? 'unlockShimmer 1s ease-out forwards'
                        : 'none',
                '@keyframes unlockShake': {
                  '0%, 100%': { transform: 'rotate(0deg)' },
                  '20%': { transform: 'rotate(-10deg)' },
                  '40%': { transform: 'rotate(10deg)' },
                  '60%': { transform: 'rotate(-10deg)' },
                  '80%': { transform: 'rotate(10deg)' },
                },
                '@keyframes unlockOpen': {
                  '0%': { transform: 'scale(1)', opacity: 1 },
                  '50%': { transform: 'scale(1.3)', opacity: 1 },
                  '100%': { transform: 'scale(1.5)', opacity: 0.8 },
                },
                '@keyframes unlockShimmer': {
                  '0%': { transform: 'scale(1.5)', opacity: 0.8, filter: 'brightness(1)' },
                  '50%': { transform: 'scale(2)', opacity: 1, filter: 'brightness(2)' },
                  '100%': { transform: 'scale(1)', opacity: 0, filter: 'brightness(1)' },
                },
              }),
        }}
      >
        <LockOpenIcon sx={{ fontSize: 'inherit', color: 'warning.main' }} />
      </Box>

      {(phase === 'open' || phase === 'shimmer') && (
        <Typography
          variant="h4"
          sx={{
            color: 'white',
            fontWeight: 700,
            mt: 2,
            textAlign: 'center',
            ...(reducedMotion
              ? {}
              : {
                  animation: 'fadeInUp 0.6s ease-out',
                  '@keyframes fadeInUp': {
                    '0%': { opacity: 0, transform: 'translateY(20px)' },
                    '100%': { opacity: 1, transform: 'translateY(0)' },
                  },
                }),
          }}
        >
          🔓 {title} Unlocked!
        </Typography>
      )}
    </Box>
  )
}

export default ContentUnlockAnimation
