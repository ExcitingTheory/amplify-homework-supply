/**
 * @fileoverview CollaborativePresenceBar — Shows participant avatars, group
 * stats, and connection status for collaborative practice sessions.
 * Sits between the progress bar and the workbook content.
 */

import React from 'react'
import {
  Box,
  Typography,
  AvatarGroup,
  Avatar,
  Chip,
  Tooltip,
  Divider,
} from '@mui/material'
import GroupsIcon from '@mui/icons-material/Groups'
import WifiIcon from '@mui/icons-material/Wifi'
import WifiOffIcon from '@mui/icons-material/WifiOff'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { useTranslations } from 'next-intl'
import type { PracticeUser, GroupStats, ParticipantProgress } from '../../yjs/PracticeCollaborationProvider'

// ============================================================================
// Types
// ============================================================================

export interface CollaborativePresenceBarProps {
  /** Active participants from awareness (excluding self) */
  participants: PracticeUser[]
  /** Current user info */
  currentUser: PracticeUser
  /** Anonymized group stats */
  groupStats: GroupStats
  /** Own progress */
  ownProgress: ParticipantProgress
  /** Room code to display and copy */
  roomCode: string
  /** WebSocket connection status */
  isConnected: boolean
}

// ============================================================================
// Helpers
// ============================================================================

/** Deterministic color from username */
function stringToColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const h = Math.abs(hash % 360)
  return `hsl(${h}, 65%, 50%)`
}

function getInitials(user: PracticeUser): string {
  const name = user.displayName || user.username || '?'
  return name
    .split(/[\s_.-]+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

// ============================================================================
// Component
// ============================================================================

export default function CollaborativePresenceBar({
  participants,
  currentUser,
  groupStats,
  ownProgress,
  roomCode,
  isConnected,
}: CollaborativePresenceBarProps) {
  const t = useTranslations('components')
  const [copied, setCopied] = React.useState(false)

  const allParticipants = [currentUser, ...participants]

  const handleCopyCode = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(roomCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback — silent fail
    }
  }, [roomCode])

  return (
    <Box
      sx={{
        px: 2,
        py: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        bgcolor: 'action.hover',
        borderBottom: '1px solid',
        borderColor: 'divider',
        flexWrap: 'wrap',
      }}
    >
      {/* Connection indicator */}
      <Tooltip title={isConnected
        ? t('practiceDrill.collab.connected', 'Connected')
        : t('practiceDrill.collab.disconnected', 'Disconnected')}
      >
        {isConnected
          ? <WifiIcon fontSize="small" color="success" />
          : <WifiOffIcon fontSize="small" color="error" />}
      </Tooltip>

      {/* Participant avatars */}
      <AvatarGroup
        max={6}
        sx={{
          '& .MuiAvatar-root': { width: 28, height: 28, fontSize: '0.75rem' },
        }}
      >
        {allParticipants.map((p) => (
          <Tooltip key={p.username} title={p.displayName || p.username}>
            <Avatar
              sx={{
                bgcolor: p.color || stringToColor(p.username),
                width: 28,
                height: 28,
                fontSize: '0.75rem',
              }}
            >
              {getInitials(p)}
            </Avatar>
          </Tooltip>
        ))}
      </AvatarGroup>

      {/* Participant count */}
      <Typography variant="caption" color="text.secondary">
        {t('practiceDrill.collab.participants', {
          count: allParticipants.length,
        })}
      </Typography>

      <Divider orientation="vertical" flexItem />

      {/* Group accuracy */}
      {groupStats.totalParticipants > 0 && (
        <Tooltip title={t('practiceDrill.collab.groupAccuracyTip', 'Average accuracy across all participants')}>
          <Chip
            icon={<GroupsIcon />}
            size="small"
            label={t('practiceDrill.collab.groupAccuracy', {
              accuracy: Math.round(groupStats.averageAccuracy),
            })}
            variant="outlined"
            color={groupStats.averageAccuracy >= 80 ? 'success' : groupStats.averageAccuracy >= 50 ? 'warning' : 'default'}
          />
        </Tooltip>
      )}

      {/* Room code */}
      <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Tooltip title={copied
          ? t('practiceDrill.collab.copied', 'Copied!')
          : t('practiceDrill.collab.copyCode', 'Copy room code to share')}
        >
          <Chip
            icon={<ContentCopyIcon />}
            size="small"
            label={roomCode}
            onClick={handleCopyCode}
            variant="outlined"
            sx={{
              fontFamily: 'monospace',
              letterSpacing: '0.1em',
              cursor: 'pointer',
            }}
          />
        </Tooltip>
      </Box>
    </Box>
  )
}
