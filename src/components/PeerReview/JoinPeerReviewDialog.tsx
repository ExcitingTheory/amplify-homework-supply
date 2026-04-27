/**
 * @fileoverview JoinPeerReviewDialog — Dialog for joining a peer review room
 * by entering a review room code. Calls the joinPeerReview mutation and
 * navigates to the review page on success.
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
import RateReviewIcon from '@mui/icons-material/RateReview'
import { useTranslation } from 'next-i18next'
import { getAmplifyClient } from '../../utils/amplifyClient'

// ============================================================================
// Types
// ============================================================================

export interface JoinPeerReviewDialogProps {
  open: boolean
  onClose: () => void
  onJoin: (info: { roomId: string; gradeId?: string }) => void
}

// ============================================================================
// Component
// ============================================================================

export default function JoinPeerReviewDialog({
  open,
  onClose,
  onJoin,
}: JoinPeerReviewDialogProps) {
  const { t } = useTranslation('components')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCode(e.target.value.trim())
    setError(null)
  }, [])

  const handleJoin = useCallback(async () => {
    if (!code) {
      setError(t('peerReview.joinDialog.emptyCode', 'Please enter a review room code'))
      return
    }

    setLoading(true)
    setError(null)

    try {
      const client = getAmplifyClient()
      const { data, errors } = await client.mutations.joinPeerReview({ code })

      if (errors?.length) {
        throw new Error(errors[0]?.message || 'Failed to join peer review')
      }

      const result = typeof data === 'string' ? JSON.parse(data) : data

      if (!result?.success) {
        throw new Error(result?.error || result?.message || 'Failed to join peer review')
      }

      onJoin({ roomId: result.roomId, gradeId: result.gradeId })
      setCode('')
      setError(null)
    } catch (err: any) {
      console.error('[JoinPeerReviewDialog] Error:', err)
      const message = err.message || t('peerReview.joinDialog.error', 'Failed to join review')
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [code, onJoin, t])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && code && !loading) {
        handleJoin()
      }
    },
    [handleJoin, code, loading],
  )

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      aria-labelledby="join-peer-review-dialog-title"
    >
      <DialogTitle id="join-peer-review-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <RateReviewIcon color="primary" />
        {t('peerReview.joinDialog.title', 'Join Peer Review')}
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('peerReview.joinDialog.description', 'Enter the review room code shared by your classmate to join their peer review session.')}
        </Typography>

        <TextField
          autoFocus
          fullWidth
          label={t('peerReview.joinDialog.codeLabel', 'Review Room Code')}
          value={code}
          onChange={handleCodeChange}
          onKeyDown={handleKeyDown}
          placeholder="room-abc123"
          disabled={loading}
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
          {t('common:actions.cancel', 'Cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={handleJoin}
          disabled={!code || loading}
          startIcon={loading ? <CircularProgress size={16} /> : <RateReviewIcon />}
        >
          {loading
            ? t('peerReview.joinDialog.joining', 'Joining...')
            : t('peerReview.joinDialog.joinButton', 'Join Review')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
