"use client";
/**
 * @fileoverview JoinPracticeDialog — Small dialog for joining a collaborative
 * practice session by room code. Shows a text field, join button, and
 * validation feedback.
 */

import React, { useState, useCallback } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Skeleton,
  Alert,
  Tabs,
  Tab,
  Box,
} from '@mui/material'
import GroupsIcon from '@mui/icons-material/Groups'
import { useTranslations } from 'next-intl'
import { getAmplifyClient } from '../../utils/amplifyClient'
import NotificationInvitations from '../Notifications/NotificationInvitations'

// ============================================================================
// Types
// ============================================================================

export interface JoinPracticeDialogProps {
  open: boolean
  onClose: () => void
  onJoin: (session: JoinedSessionInfo) => void
}

export interface JoinedSessionInfo {
  sessionId: string
  roomCode: string
  unitID: string
  unitName?: string
  blockCount: number
  maxParticipants: number
  participantCount: number
}

// ============================================================================
// Component
// ============================================================================

export default function JoinPracticeDialog({
  open,
  onClose,
  onJoin,
}: JoinPracticeDialogProps) {
  const t = useTranslations('components')
  const [roomCode, setRoomCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState(0)

  const handleRoomCodeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Uppercase, strip non-alphanumeric, limit to 8 chars
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)
    setRoomCode(value)
    setError(null)
  }, [])

  const handleJoin = useCallback(async () => {
    if (roomCode.length < 4) {
      setError(t('practiceDrill.join.codeTooShort'))
      return
    }

    setLoading(true)
    setError(null)

    try {
      const client = getAmplifyClient()

      // Look up PracticeSession by roomCode
      const { data: sessions, errors } = await client.models.PracticeSession
        .listPracticeSessionByRoomCode({ roomCode })

      if (errors && errors.length > 0) {
        throw new Error(errors[0]?.message || 'Failed to look up session')
      }

      // Find an active (non-complete) collaborative session
      const activeSession = (sessions || []).find(
        (s: any) => s != null && s.collaborative && !s.complete,
      )

      if (!activeSession) {
        setError(t('practiceDrill.join.notFound'))
        setLoading(false)
        return
      }

      // Check participant limit
      const participantIds: string[] = activeSession.participantIds
        ? (typeof activeSession.participantIds === 'string'
          ? JSON.parse(activeSession.participantIds)
          : activeSession.participantIds)
        : []
      const maxParticipants = activeSession.maxParticipants || 10

      if (participantIds.length >= maxParticipants) {
        setError(t('practiceDrill.join.full', {
          max: maxParticipants,
        }))
        setLoading(false)
        return
      }

      onJoin({
        sessionId: activeSession.id,
        roomCode,
        unitID: activeSession.unitID || '',
        blockCount: activeSession.blockCount || 0,
        maxParticipants,
        participantCount: participantIds.length,
      })

      // Reset state
      setRoomCode('')
      setError(null)
    } catch (err: any) {
      console.error('[JoinPracticeDialog] Error:', err)
      setError(err.message || t('practiceDrill.join.error'))
    } finally {
      setLoading(false)
    }
  }, [roomCode, onJoin, t])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && roomCode.length >= 4 && !loading) {
        handleJoin()
      }
    },
    [handleJoin, roomCode, loading],
  )

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      aria-labelledby="join-practice-dialog-title"
    >
      <DialogTitle id="join-practice-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <GroupsIcon color="primary" />
        {t('practiceDrill.join.title')}
      </DialogTitle>

      <DialogContent>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Tab label={t('practiceDrill.join.tabCode')} />
          <Tab label={t('practiceDrill.join.tabInvitations')} />
        </Tabs>

        {tab === 0 && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t('practiceDrill.join.description')}
            </Typography>

            <TextField
              autoFocus
              fullWidth
              label={t('practiceDrill.join.codeLabel')}
              value={roomCode}
              onChange={handleRoomCodeChange}
              onKeyDown={handleKeyDown}
              placeholder="ABC123"
              disabled={loading}
              inputProps={{
                maxLength: 8,
                style: {
                  textAlign: 'center',
                  fontSize: '1.5rem',
                  letterSpacing: '0.3em',
                  fontFamily: 'monospace',
                },
              }}
              sx={{ mb: 1 }}
            />

            {error && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {error}
              </Alert>
            )}
          </Box>
        )}

        {tab === 1 && (
          <NotificationInvitations
            types={['PRACTICE_SESSION_INVITE']}
            onJoin={(notification) => {
              const meta = notification.metadata
                ? (typeof notification.metadata === 'string'
                  ? JSON.parse(notification.metadata)
                  : notification.metadata)
                : {}
              if (meta.roomCode) {
                setRoomCode(meta.roomCode)
                setTab(0)
              }
            }}
            joinLabel={t('practiceDrill.join.joinButton')}
            emptyMessage={t('practiceDrill.join.noInvitations')}
          />
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          {t('practiceDrill.join.cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={handleJoin}
          disabled={roomCode.length < 4 || loading}
          startIcon={loading ? <Skeleton variant="circular" width={16} height={16} /> : <GroupsIcon />}
        >
          {loading
            ? t('practiceDrill.join.joining')
            : t('practiceDrill.join.joinButton')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
