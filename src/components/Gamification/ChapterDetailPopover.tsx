"use client";
/**
 * ChapterDetailPopover — Shows campaign chapter narrative details
 * (setting, stakes, progress) when a chapter chip is clicked.
 *
 * @module ChapterDetailPopover
 */

import React from 'react'
import Box from '@mui/material/Box'
import LinearProgress from '@mui/material/LinearProgress'
import Popover from '@mui/material/Popover'
import Typography from '@mui/material/Typography'
import AutoStoriesIcon from '@mui/icons-material/AutoStories'

export interface ChapterDetailPopoverProps {
  anchorEl: HTMLElement | null
  onClose: () => void
  chapter: {
    title?: string
    chapterOrder?: number | null
    setting?: string | null
    stakes?: string | null
    currentXP?: number
    targetXP?: number
    linkedUnitIds?: string[] | null
  } | null
}

export function ChapterDetailPopover({ anchorEl, onClose, chapter }: ChapterDetailPopoverProps) {
  if (!chapter) return null

  const progressPercent = chapter.targetXP && chapter.targetXP > 0
    ? Math.min(100, Math.round(((chapter.currentXP || 0) / chapter.targetXP) * 100))
    : 0

  return (
    <Popover
      open={!!anchorEl}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      slotProps={{ paper: { sx: { maxWidth: 360, p: 2 } } }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <AutoStoriesIcon sx={{ fontSize: '1.1rem', color: 'primary.main' }} />
        <Typography variant="subtitle2" fontWeight={700}>
          {chapter.chapterOrder != null ? `Chapter ${chapter.chapterOrder}: ` : ''}
          {chapter.title}
        </Typography>
      </Box>

      {chapter.setting && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontStyle: 'italic' }}>
          {chapter.setting}
        </Typography>
      )}

      {chapter.stakes && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          <strong>Stakes:</strong> {chapter.stakes}
        </Typography>
      )}

      {chapter.targetXP != null && chapter.targetXP > 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">Progress</Typography>
            <Typography variant="caption" color="text.secondary">
              {chapter.currentXP || 0}/{chapter.targetXP} XP ({progressPercent}%)
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progressPercent}
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>
      )}

      {chapter.linkedUnitIds && chapter.linkedUnitIds.length > 0 && (
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1 }}>
          {chapter.linkedUnitIds.length} linked unit{chapter.linkedUnitIds.length !== 1 ? 's' : ''}
        </Typography>
      )}
    </Popover>
  )
}

export default ChapterDetailPopover
