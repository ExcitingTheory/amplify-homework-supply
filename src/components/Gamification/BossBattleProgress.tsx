/**
 * BossBattleProgress — Enhanced display for an active group challenge.
 * Shows progress bar, deadline countdown, top contributors, and toggle/delete actions.
 *
 * @module BossBattleProgress
 */

import React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import LinearProgress from '@mui/material/LinearProgress'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import IconButton from '@mui/material/IconButton'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Avatar from '@mui/material/Avatar'
import Tooltip from '@mui/material/Tooltip'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import PauseIcon from '@mui/icons-material/Pause'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'

// ============================================================================
// Types
// ============================================================================

export interface Contributor {
  studentId: string
  displayName: string
  xpContributed: number
}

export interface BossBattleProgressProps {
  id: string
  title: string
  currentXP: number
  targetXP: number
  active: boolean
  startDate?: string // ISO datetime
  deadline?: string // ISO datetime (end date)
  bonusMultiplier?: number
  setting?: string
  stakes?: string
  contributors?: Contributor[]
  onToggleActive?: (id: string, active: boolean) => void
  onDelete?: (id: string) => void
  onEdit?: (id: string) => void
}

// ============================================================================
// Helpers
// ============================================================================

function getTimeRemaining(deadline: string): string {
  const now = new Date()
  const end = new Date(deadline)
  const diffMs = end.getTime() - now.getTime()

  if (diffMs <= 0) return 'Expired'

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  if (days > 0) return `${days}d ${hours}h remaining`
  if (hours > 0) return `${hours}h remaining`

  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  return `${minutes}m remaining`
}

// ============================================================================
// Component
// ============================================================================

export function BossBattleProgress({
  id,
  title,
  currentXP,
  targetXP,
  active,
  startDate,
  deadline,
  bonusMultiplier,
  setting,
  stakes,
  contributors = [],
  onToggleActive,
  onDelete,
  onEdit,
}: BossBattleProgressProps) {
  const progress = targetXP > 0 ? Math.min((currentXP / targetXP) * 100, 100) : 0
  const isComplete = currentXP >= targetXP
  const timeRemaining = deadline ? getTimeRemaining(deadline) : null
  const isExpired = timeRemaining === 'Expired'
  const hasStarted = !startDate || new Date(startDate).getTime() <= Date.now()

  // Sort contributors by XP desc, take top 5
  const topContributors = [...contributors]
    .sort((a, b) => b.xpContributed - a.xpContributed)
    .slice(0, 5)

  return (
    <Card variant="outlined" sx={{ mb: 1, opacity: active ? 1 : 0.6 }}>
      <CardContent sx={{ pb: '12px !important' }}>
        {/* Header: Title + status chip + actions */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <Typography variant="subtitle2" fontWeight={600} sx={{ flex: 1 }}>
            {title}
          </Typography>

          {isComplete && (
            <Chip
              icon={<EmojiEventsIcon />}
              label="Complete!"
              size="small"
              color="success"
              sx={{ height: 22 }}
            />
          )}

          <Chip
            label={active ? 'Active' : 'Inactive'}
            size="small"
            color={active ? 'primary' : 'default'}
            sx={{ height: 22, fontSize: '0.65rem' }}
          />

          {bonusMultiplier && bonusMultiplier > 1 && (
            <Chip
              label={`×${bonusMultiplier}`}
              size="small"
              variant="outlined"
              sx={{ height: 22, fontSize: '0.65rem' }}
            />
          )}

          <Tooltip title={active ? 'Pause' : 'Activate'}>
            <IconButton
              size="small"
              onClick={() => onToggleActive?.(id, !active)}
              aria-label={active ? 'Pause battle' : 'Activate battle'}
            >
              {active ? <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={() => onDelete?.(id)}
              aria-label="Delete battle"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {onEdit && (
            <Tooltip title="Edit">
              <IconButton
                size="small"
                onClick={() => onEdit(id)}
                aria-label="Edit battle"
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>

        {/* Progress bar */}
        <Box sx={{ mb: 1 }}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              {currentXP.toLocaleString()} / {targetXP.toLocaleString()} XP
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {Math.round(progress)}%
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={progress}
            color={isComplete ? 'success' : isExpired ? 'error' : 'primary'}
            sx={{ height: 8, borderRadius: 1 }}
          />
        </Box>

        {/* Date range & countdown */}
        {(startDate || timeRemaining) && (
          <Stack direction="row" spacing={1} sx={{ mb: 1 }} flexWrap="wrap">
            {startDate && !hasStarted && (
              <Typography variant="caption" color="info.main">
                🚀 Starts {new Date(startDate).toLocaleDateString()}
              </Typography>
            )}
            {timeRemaining && (
              <Typography
                variant="caption"
                color={isExpired ? 'error.main' : 'text.secondary'}
              >
                {isExpired ? '⏰ Deadline passed' : `⏳ ${timeRemaining}`}
              </Typography>
            )}
          </Stack>
        )}

        {/* Narrative */}
        {setting && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontStyle: 'italic', mb: 0.5 }}>
            {setting}
          </Typography>
        )}
        {stakes && (
          <Typography variant="caption" color="warning.main" sx={{ display: 'block', mb: 1 }}>
            Stakes: {stakes}
          </Typography>
        )}

        {/* Top contributors */}
        {topContributors.length > 0 && (
          <Box>
            <Typography variant="caption" fontWeight={600} sx={{ display: 'block', mb: 0.5 }}>
              Top Contributors
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {topContributors.map((c) => (
                <Chip
                  key={c.studentId}
                  avatar={<Avatar sx={{ width: 20, height: 20, fontSize: '0.6rem' }}>{c.displayName?.[0] ?? '?'}</Avatar>}
                  label={`${c.displayName ?? 'Unknown'} (${c.xpContributed} XP)`}
                  size="small"
                  variant="outlined"
                  sx={{ height: 24, fontSize: '0.65rem' }}
                />
              ))}
            </Stack>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default BossBattleProgress
