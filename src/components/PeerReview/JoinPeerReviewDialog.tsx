"use client";
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
  Skeleton,
  Alert,
  Tabs,
  Tab,
  Box,
} from '@mui/material'
import RateReviewIcon from '@mui/icons-material/RateReview'
import { useTranslations } from 'next-intl'
import { joinPeerReview as joinPeerReviewAction } from '../../../app/actions/section'
import NotificationInvitations from '../Notifications/NotificationInvitations'

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
  const t = useTranslations('components')
  const tCommon = useTranslations('common')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState(0)

  const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCode(e.target.value.trim())
    setError(null)
  }, [])

  const handleJoin = useCallback(async () => {
    if (!code) {
      setError(t('peerReview.joinDialog.emptyCode'))
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await joinPeerReviewAction(code)

      if (!result.success) {
        throw new Error(result.error || 'Failed to join peer review')
      }

      onJoin({ roomId: result.roomId! })
      setCode('')
      setError(null)
    } catch (err: any) {
      console.error('[JoinPeerReviewDialog] Error:', err)
      const message = err.message || t('peerReview.joinDialog.error')
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
        {t('peerReview.joinDialog.title')}
      </DialogTitle>

      <DialogContent>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Tab label={t('peerReview.joinDialog.tabCode')} />
          <Tab label={t('peerReview.joinDialog.tabInvitations')} />
        </Tabs>

        {tab === 0 && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t('peerReview.joinDialog.description')}
            </Typography>

            <TextField
              autoFocus
              fullWidth
              label={t('peerReview.joinDialog.codeLabel')}
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
          </Box>
        )}

        {tab === 1 && (
          <NotificationInvitations
            types={['PEER_REVIEW_INVITE']}
            onJoin={(notification) => {
              if (notification.linkPath) {
                const match = notification.linkPath.match(/\/review\/([a-zA-Z0-9-]+)/)
                if (match) {
                  onJoin({ roomId: match[1] })
                  onClose()
                }
              }
            }}
            joinLabel={t('peerReview.joinDialog.joinButton')}
            emptyMessage={t('peerReview.joinDialog.noInvitations')}
          />
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          {tCommon('actions.cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={handleJoin}
          disabled={!code || loading}
          startIcon={loading ? <Skeleton variant="circular" width={16} height={16} /> : <RateReviewIcon />}
        >
          {loading
            ? t('peerReview.joinDialog.joining')
            : t('peerReview.joinDialog.joinButton')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
