/**
 * BadgeCoinFlip — CSS 3D coin-flip animation for badge awards.
 *
 * Shows a spinning coin that resolves to the badge emoji.
 *
 * @module BadgeCoinFlip
 */

import React, { useEffect, useState } from 'react'
import Dialog from '@mui/material/Dialog'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import { BadgeIcon } from './BadgeIcon'

export interface BadgeCoinFlipProps {
  open: boolean
  /** @deprecated Use badgeType instead */
  badgeEmoji?: string
  /** Badge type key for rendering the BadgeIcon */
  badgeType?: string
  badgeName: string
  badgeDescription: string
  onClose: () => void
}

export function BadgeCoinFlip({
  open,
  badgeEmoji,
  badgeType,
  badgeName,
  badgeDescription,
  onClose,
}: BadgeCoinFlipProps) {
  const [flipped, setFlipped] = useState(false)

  useEffect(() => {
    if (open) {
      setFlipped(false)
      const timer = setTimeout(() => setFlipped(true), 100)
      return () => clearTimeout(timer)
    }
  }, [open])

  return (
    <Dialog open={open} maxWidth="xs" fullWidth onClose={onClose}>
      <Box sx={{ textAlign: 'center', p: 4 }}>
        <Box
          sx={{
            perspective: '600px',
            mb: 2,
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              mx: 'auto',
              position: 'relative',
              transformStyle: 'preserve-3d',
              transition: 'transform 0.8s ease-out',
              transform: flipped ? 'rotateY(720deg)' : 'rotateY(0deg)',
            }}
          >
            {/* Front (coin) */}
            <Box
              sx={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                bgcolor: 'warning.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backfaceVisibility: 'hidden',
                fontSize: '2.5rem',
              }}
            >
              {badgeType ? (
                <BadgeIcon badgeType={badgeType} size={64} earned animate={flipped} drawIcon={flipped} />
              ) : (
                badgeEmoji
              )}
            </Box>
          </Box>
        </Box>

        <Typography variant="h6" fontWeight={700} sx={{ mt: 2 }}>
          Badge Earned!
        </Typography>
        <Typography variant="subtitle1" fontWeight={600} color="primary.main">
          {badgeName}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {badgeDescription}
        </Typography>

        <Button variant="contained" onClick={onClose} sx={{ mt: 3 }}>
          Awesome!
        </Button>
      </Box>
    </Dialog>
  )
}

export default BadgeCoinFlip
