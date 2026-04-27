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
  CircularProgress,
  Alert,
} from '@mui/material'
import GroupsIcon from '@mui/icons-material/Groups'
import { useTranslation } from 'next-i18next'
import { getAmplifyClient } from '../../utils/amplifyClient'

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
  const { t } = useTranslation('components')
  const [roomCode, setRoomCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRoomCodeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Uppercase, strip non-alphanumeric, limit to 8 chars
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)
    setRoomCode(value)
    setError(null)
  }, [])

  const handleJoin = useCallback(async () => {
    if (roomCode.length < 4) {
      setError(t('practiceDrill.join.codeTooShort', 'Room code must be at least 4 characters'))
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
        setError(t('practiceDrill.join.notFound', 'No active session found with that code'))
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
        setError(t('practiceDrill.join.full', 'This session is full ({{max}} participants max)', {
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
      setError(err.message || t('practiceDrill.join.error', 'Failed to join session'))
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
        {t('practiceDrill.join.title', 'Join Study Session')}
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('practiceDrill.join.description', 'Enter the room code shared by your study group to join their practice session.')}
        </Typography>

        <TextField
          autoFocus
          fullWidth
          label={t('practiceDrill.join.codeLabel', 'Room Code')}
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
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          {t('practiceDrill.join.cancel', 'Cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={handleJoin}
          disabled={roomCode.length < 4 || loading}
          startIcon={loading ? <CircularProgress size={16} /> : <GroupsIcon />}
        >
          {loading
            ? t('practiceDrill.join.joining', 'Joining...')
            : t('practiceDrill.join.joinButton', 'Join Session')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
