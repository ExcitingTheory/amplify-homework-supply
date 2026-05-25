/**
 * ChallengeRecapCard — Displays AI-generated per-squad recap narratives
 * after a group challenge completes.
 *
 * Also provides a "Generate Recaps" trigger for instructors when recaps
 * haven't been generated yet.
 *
 * @module ChallengeRecapCard
 */

import React, { useState } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import { SquadMentionPill } from './SquadMentionPill'

// ============================================================================
// Types
// ============================================================================

export interface RecapEntry {
  squadId: string
  squadName: string
  recap: string
  rivalSquadId?: string
  rivalSquadName?: string
  /** "top" | "middle" | "bottom" */
  performance?: string
  generatedAt?: string
}

export interface ChallengeRecapCardProps {
  /** Challenge title for the header */
  challengeTitle: string
  /** Existing recap entries (empty = not generated yet) */
  recaps: RecapEntry[]
  /** Whether the current user is an instructor (shows generate button) */
  isInstructor?: boolean
  /** Called when instructor clicks generate. Should call generateChallengeRecaps action. */
  onGenerate?: () => void | Promise<void>
  /** Show loading state during generation */
  generating?: boolean
}

// ============================================================================
// Helpers
// ============================================================================

const PERFORMANCE_COLORS: Record<string, 'success' | 'warning' | 'default'> = {
  top: 'success',
  middle: 'warning',
  bottom: 'default',
}

const PERFORMANCE_LABELS: Record<string, string> = {
  top: '🏆 Champions',
  middle: '⚔️ Contenders',
  bottom: '💪 Underdogs',
}

// ============================================================================
// Component
// ============================================================================

export function ChallengeRecapCard({
  challengeTitle,
  recaps,
  isInstructor = false,
  onGenerate,
  generating = false,
}: ChallengeRecapCardProps) {
  const hasRecaps = recaps.length > 0

  // Group recaps by performance tier
  const grouped = {
    top: recaps.filter((r) => r.performance === 'top'),
    middle: recaps.filter((r) => r.performance === 'middle'),
    bottom: recaps.filter((r) => r.performance === 'bottom'),
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <EmojiEventsIcon color="primary" />
            <Typography variant="h6">Challenge Recap</Typography>
            <Chip label={challengeTitle} size="small" variant="outlined" />
          </Stack>

          {!hasRecaps && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                No recaps generated yet for this challenge.
              </Typography>
              {isInstructor && onGenerate && (
                <Button
                  variant="contained"
                  startIcon={generating ? <CircularProgress size={16} /> : <AutoFixHighIcon />}
                  onClick={onGenerate}
                  disabled={generating}
                  sx={{ mt: 1 }}
                >
                  {generating ? 'Generating Recaps...' : 'Generate Squad Recaps'}
                </Button>
              )}
            </Box>
          )}

          {hasRecaps && (
            <Stack spacing={2}>
              {(['top', 'middle', 'bottom'] as const).map((tier) => {
                const tierRecaps = grouped[tier]
                if (tierRecaps.length === 0) return null
                return (
                  <Box key={tier}>
                    <Typography variant="overline" color="text.secondary">
                      {PERFORMANCE_LABELS[tier]}
                    </Typography>
                    <Stack spacing={1}>
                      {tierRecaps.map((entry) => (
                        <Box
                          key={entry.squadId}
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: 'action.hover',
                            borderLeft: 4,
                            borderLeftColor:
                              tier === 'top' ? 'success.main' :
                              tier === 'middle' ? 'warning.main' : 'grey.400',
                          }}
                        >
                          <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                            <SquadMentionPill
                              squadId={entry.squadId}
                              squadName={entry.squadName}
                              size="small"
                            />
                            {entry.rivalSquadName && (
                              <>
                                <Typography variant="caption" color="text.secondary">
                                  vs
                                </Typography>
                                <SquadMentionPill
                                  squadId={entry.rivalSquadId || ''}
                                  squadName={entry.rivalSquadName}
                                  size="small"
                                />
                              </>
                            )}
                          </Stack>
                          <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                            {entry.recap}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                )
              })}

              {/* Regenerate option for instructor */}
              {isInstructor && onGenerate && (
                <>
                  <Divider />
                  <Button
                    variant="text"
                    size="small"
                    startIcon={generating ? <CircularProgress size={14} /> : <AutoFixHighIcon />}
                    onClick={onGenerate}
                    disabled={generating}
                  >
                    {generating ? 'Regenerating...' : 'Regenerate Recaps'}
                  </Button>
                </>
              )}
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}

export default ChallengeRecapCard
