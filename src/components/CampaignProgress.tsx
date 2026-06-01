/**
 * CampaignProgress — Student-facing campaign progression display.
 *
 * Shows chapter progression, XP progress bar, deadline countdown,
 * narrative text, and chapter order visualization.
 *
 * @module CampaignProgress
 */

import React, { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import LinearProgress from '@mui/material/LinearProgress'
import Chip from '@mui/material/Chip'
import Stepper from '@mui/material/Stepper'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import StepContent from '@mui/material/StepContent'
import Paper from '@mui/material/Paper'
import TimerIcon from '@mui/icons-material/Timer'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import WarningIcon from '@mui/icons-material/Warning'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

// ============================================================================
// Types
// ============================================================================

export interface CampaignChapter {
  id: string
  title: string
  order: number
  completed: boolean
  xpRequired?: number
}

export interface CampaignProgressProps {
  /** Campaign title */
  title: string
  /** Campaign narrative setting */
  setting?: string
  /** What's at stake */
  stakes?: string
  /** Current accumulated XP */
  currentXP: number
  /** Target XP to complete the campaign */
  targetXP: number
  /** ISO datetime deadline string */
  deadline?: string
  /** Bonus multiplier for contributions */
  bonusMultiplier?: number
  /** Chapters / checkpoints in order */
  chapters?: CampaignChapter[]
  /** Whether the campaign is still active */
  active?: boolean
}

// ============================================================================
// Helpers
// ============================================================================

function formatCountdown(deadline: string): { text: string; urgent: boolean } {
  const diff = new Date(deadline).getTime() - Date.now()
  if (diff <= 0) return { text: 'Campaign ended', urgent: true }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const urgent = days === 0 && hours < 12
  if (days > 0) return { text: `${days}d ${hours}h remaining`, urgent: false }
  if (hours > 0) return { text: `${hours}h ${minutes}m remaining`, urgent }
  return { text: `${minutes}m remaining`, urgent: true }
}

// ============================================================================
// Component
// ============================================================================

export function CampaignProgress({
  title,
  setting,
  stakes,
  currentXP,
  targetXP,
  deadline,
  bonusMultiplier,
  chapters = [],
  active = true,
}: CampaignProgressProps) {
  const [countdown, setCountdown] = useState<{ text: string; urgent: boolean }>({
    text: '',
    urgent: false,
  })

  const progress = targetXP > 0 ? Math.min(100, (currentXP / targetXP) * 100) : 0
  const isComplete = currentXP >= targetXP
  const sortedChapters = [...chapters].sort((a, b) => a.order - b.order)
  const activeChapterIndex = sortedChapters.findIndex((ch) => !ch.completed)

  // Live countdown
  useEffect(() => {
    if (!deadline) return
    setCountdown(formatCountdown(deadline))
    const interval = setInterval(() => {
      setCountdown(formatCountdown(deadline))
    }, 60_000)
    return () => clearInterval(interval)
  }, [deadline])

  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: isComplete ? 'success.main' : active ? 'primary.main' : 'grey.400',
        borderWidth: 2,
      }}
    >
      <CardContent>
        <Stack spacing={3}>
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1} alignItems="center">
              <EmojiEventsIcon color={isComplete ? 'success' : 'primary'} />
              <Typography variant="h6">{title}</Typography>
            </Stack>
            {!active && (
              <Chip label="Ended" color="default" size="small" />
            )}
            {bonusMultiplier && bonusMultiplier > 1 && active && (
              <Chip label={`×${bonusMultiplier} XP Bonus`} color="secondary" size="small" />
            )}
          </Stack>

          {/* Narrative setting */}
          {setting && (
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="body2" fontStyle="italic">
                {setting}
              </Typography>
            </Paper>
          )}

          {/* XP Progress bar */}
          <Box>
            <Stack direction="row" justifyContent="space-between" mb={0.5}>
              <Typography variant="body2" fontWeight="bold">
                {currentXP.toLocaleString()} / {targetXP.toLocaleString()} XP
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {Math.round(progress)}%
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={progress}
              color={isComplete ? 'success' : 'primary'}
              sx={{ height: 12, borderRadius: 6 }}
            />
          </Box>

          {/* Deadline countdown */}
          {deadline && (
            <Stack direction="row" spacing={1} alignItems="center">
              <TimerIcon
                fontSize="small"
                color={countdown.urgent ? 'error' : 'action'}
              />
              <Typography
                variant="body2"
                color={countdown.urgent ? 'error.main' : 'text.secondary'}
                fontWeight={countdown.urgent ? 'bold' : 'normal'}
              >
                {countdown.text}
              </Typography>
            </Stack>
          )}

          {/* Stakes */}
          {stakes && (
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <WarningIcon fontSize="small" color="warning" sx={{ mt: 0.3 }} />
              <Typography variant="body2" color="text.secondary">
                <strong>Stakes:</strong> {stakes}
              </Typography>
            </Stack>
          )}

          {/* Chapter progression */}
          {sortedChapters.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Chapter Progression
              </Typography>
              <Stepper
                activeStep={activeChapterIndex === -1 ? sortedChapters.length : activeChapterIndex}
                orientation="vertical"
              >
                {sortedChapters.map((chapter) => (
                  <Step key={chapter.id} completed={chapter.completed}>
                    <StepLabel
                      icon={
                        chapter.completed ? (
                          <CheckCircleIcon color="success" />
                        ) : undefined
                      }
                    >
                      <Typography variant="body2">
                        {chapter.title}
                        {chapter.xpRequired && !chapter.completed && (
                          <Typography
                            component="span"
                            variant="caption"
                            color="text.secondary"
                            ml={1}
                          >
                            ({chapter.xpRequired} XP needed)
                          </Typography>
                        )}
                      </Typography>
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>
          )}

          {/* Completion message */}
          {isComplete && (
            <Paper sx={{ p: 2, bgcolor: 'success.light', textAlign: 'center' }}>
              <Typography variant="h6" color="success.dark">
                🎉 Campaign Complete!
              </Typography>
            </Paper>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}
