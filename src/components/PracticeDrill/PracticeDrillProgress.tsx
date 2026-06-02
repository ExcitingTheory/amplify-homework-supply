/**
 * @fileoverview PracticeDrillProgress — Progress bar and XP indicator
 * shown in the drill dialog header. Tracks blocks completed and running XP.
 */

import React from 'react'
import { Box, LinearProgress, Typography, Tooltip, Chip } from '@mui/material'
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects'
import BoltIcon from '@mui/icons-material/Bolt'
import { useTranslations } from 'next-intl'

// ============================================================================
// Types
// ============================================================================

export interface PracticeDrillProgressProps {
  /** Number of blocks completed so far */
  blocksCompleted: number
  /** Total number of blocks in this drill */
  blockCount: number
  /** XP earned so far this session */
  xpEarned: number
  /** Whether XP is diminished (show indicator) */
  xpDiminished?: boolean
  /** Current streak count */
  streakCount?: number
}

// ============================================================================
// Component
// ============================================================================

export default function PracticeDrillProgress({
  blocksCompleted,
  blockCount,
  xpEarned,
  xpDiminished = false,
  streakCount,
}: PracticeDrillProgressProps) {
  const t = useTranslations('components')
  const percent = blockCount > 0 ? Math.round((blocksCompleted / blockCount) * 100) : 0

  return (
    <Box sx={{ px: 2, py: 1 }}>
      {/* Progress bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <LinearProgress
          variant="determinate"
          value={percent}
          sx={{ flex: 1, height: 8, borderRadius: 4 }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 70, textAlign: 'right' }}>
          {blocksCompleted}/{blockCount} {t('practiceDrill.progress.questions')}
        </Typography>
      </Box>

      {/* XP and streak indicators */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Tooltip
          title={
            xpDiminished
              ? t('practiceDrill.progress.xpDiminishedTooltip')
              : t('practiceDrill.progress.xpTooltip')
          }
        >
          <Chip
            size="small"
            icon={<EmojiObjectsIcon />}
            label={`+${xpEarned} XP`}
            color={xpDiminished ? 'default' : 'primary'}
            variant="outlined"
          />
        </Tooltip>

        {streakCount != null && streakCount > 0 && (
          <Tooltip title={t('practiceDrill.progress.streakTooltip', { count: streakCount })}>
            <Chip
              size="small"
              icon={<BoltIcon />}
              label={streakCount}
              color="warning"
              variant="outlined"
            />
          </Tooltip>
        )}
      </Box>
    </Box>
  )
}
