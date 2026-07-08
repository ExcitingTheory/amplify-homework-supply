"use client";
/**
 * ChapterUnlockCelebration — Brief overlay celebration triggered when a
 * campaign chapter is completed (currentXP >= targetXP). Shows the chapter
 * title with a narrative reveal and auto-dismisses.
 *
 * Respects reduced-motion: skips entrance animation.
 *
 * @module ChapterUnlockCelebration
 */

import React, { useEffect } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import Fade from '@mui/material/Fade'
import Typography from '@mui/material/Typography'
import AutoStoriesIcon from '@mui/icons-material/AutoStories'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export interface ChapterUnlockCelebrationProps {
  open: boolean
  chapterTitle: string
  chapterOrder?: number | null
  nextChapterTitle?: string | null
  onClose: () => void
}

export function ChapterUnlockCelebration({
  open,
  chapterTitle,
  chapterOrder,
  nextChapterTitle,
  onClose,
}: ChapterUnlockCelebrationProps) {
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (open && !reducedMotion) {
      // @ts-expect-error — canvas-confetti has no type declarations
      import('canvas-confetti')
        .then((mod) => {
          const confetti = (mod as any).default || mod
          // Smaller burst — chapter complete is less grand than level-up
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.55 }, colors: ['#ffd700', '#ff6b35', '#00c853'] })
        })
        .catch(() => { /* unavailable */ })
    }
  }, [open, reducedMotion])

  // Auto-dismiss after 6 seconds
  useEffect(() => {
    if (!open) return
    const t = setTimeout(onClose, 6000)
    return () => clearTimeout(t)
  }, [open, onClose])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      TransitionComponent={Fade}
      transitionDuration={reducedMotion ? 0 : 350}
      slotProps={{
        paper: {
          sx: {
            overflow: 'visible',
            background: 'linear-gradient(135deg, rgba(255,152,0,0.95) 0%, rgba(255,87,34,0.95) 100%)',
            color: '#fff',
            borderRadius: 4,
          },
        },
      }}
    >
      <Box
        sx={{
          textAlign: 'center',
          p: 4,
          ...(!reducedMotion && {
            animation: 'chapterReveal 0.5s ease-out',
            '@keyframes chapterReveal': {
              '0%': { opacity: 0, transform: 'scale(0.9)' },
              '100%': { opacity: 1, transform: 'scale(1)' },
            },
          }),
        }}
      >
        <EmojiEventsIcon sx={{ fontSize: '3.5rem', opacity: 0.9 }} />

        <Typography
          variant="overline"
          sx={{ letterSpacing: 2, opacity: 0.8, display: 'block', mt: 1 }}
        >
          Chapter Complete!
        </Typography>

        <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5 }}>
          {chapterOrder != null ? `Ch. ${chapterOrder}: ` : ''}
          {chapterTitle}
        </Typography>

        {nextChapterTitle && (
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <AutoStoriesIcon sx={{ fontSize: '1rem', opacity: 0.8 }} />
            <Typography variant="body2" sx={{ opacity: 0.85 }}>
              Next: {nextChapterTitle}
            </Typography>
          </Box>
        )}

        {!nextChapterTitle && (
          <Chip
            label="Campaign Complete!"
            sx={{ mt: 2, bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700 }}
          />
        )}

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
          {nextChapterTitle ? 'Onward!' : 'Celebrate!'}
        </Button>
      </Box>
    </Dialog>
  )
}

export default ChapterUnlockCelebration
