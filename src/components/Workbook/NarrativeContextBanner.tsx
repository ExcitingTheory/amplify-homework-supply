"use client";
/**
 * NarrativeContextBanner — Displays the current campaign chapter's narrative
 * context (setting, stakes) at the top of a workbook, connecting the
 * assignment to the broader campaign storyline.
 *
 * Collapsible with localStorage persistence so students can dismiss it.
 *
 * @module NarrativeContextBanner
 */

import React, { useState, useCallback } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import LinearProgress from '@mui/material/LinearProgress'
import Chip from '@mui/material/Chip'
import Collapse from '@mui/material/Collapse'
import IconButton from '@mui/material/IconButton'
import AutoStoriesIcon from '@mui/icons-material/AutoStories'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import { useCampaign } from '@/context/gamificationContext'

const STORAGE_KEY = 'hw-narrative-banner-collapsed'

function getCollapsedState(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export interface NarrativeContextBannerProps {
  /** The unit ID of the current workbook — used to find the linked challenge */
  unitId: string
}

export function NarrativeContextBanner({ unitId }: NarrativeContextBannerProps) {
  const { activeChallenges, isLoading } = useCampaign()
  const [collapsed, setCollapsed] = useState(getCollapsedState)

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      try { localStorage.setItem(STORAGE_KEY, String(next)) } catch { /* noop */ }
      return next
    })
  }, [])

  if (isLoading) return null

  // Find the challenge that includes this unit in its linkedUnitIds
  const linkedChallenge = activeChallenges?.find(
    (c: any) => c.linkedUnitIds?.includes(unitId),
  )

  if (!linkedChallenge) return null

  const progressPercent = linkedChallenge.targetXP > 0
    ? Math.min(100, Math.round((linkedChallenge.currentXP / linkedChallenge.targetXP) * 100))
    : 0

  return (
    <Box
      role="complementary"
      aria-label="Campaign chapter context"
      sx={{
        mb: 2,
        p: 2,
        borderRadius: 2,
        bgcolor: 'action.hover',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AutoStoriesIcon sx={{ fontSize: '1.2rem', color: 'primary.main' }} />
        <Typography variant="subtitle2" fontWeight={700} sx={{ flex: 1 }}>
          {linkedChallenge.title}
        </Typography>
        {linkedChallenge.chapterOrder != null && (
          <Chip
            size="small"
            label={`Ch. ${linkedChallenge.chapterOrder}`}
            sx={{ height: 20, fontSize: '0.7rem' }}
          />
        )}
        <IconButton
          size="small"
          onClick={toggleCollapse}
          aria-label={collapsed ? 'Expand chapter context' : 'Collapse chapter context'}
          aria-expanded={!collapsed}
        >
          {collapsed ? <ExpandMoreIcon fontSize="small" /> : <ExpandLessIcon fontSize="small" />}
        </IconButton>
      </Box>

      <Collapse in={!collapsed}>
        {linkedChallenge.setting && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 0.5, fontStyle: 'italic' }}>
            {linkedChallenge.setting}
          </Typography>
        )}

        {linkedChallenge.stakes && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {linkedChallenge.stakes}
          </Typography>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LinearProgress
            variant="determinate"
            value={progressPercent}
            sx={{ flex: 1, height: 6, borderRadius: 3 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 60 }}>
            {linkedChallenge.currentXP}/{linkedChallenge.targetXP} XP
          </Typography>
        </Box>
      </Collapse>
    </Box>
  )
}

export default NarrativeContextBanner
