"use client";
/**
 * @fileoverview JoinWorkbookDialog — Dialog for instructors to join a student's
 * workbook session by entering the student's Grade ID or workbook link.
 * Navigates to /workbook/{unitId} on success.
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
import EditNoteIcon from '@mui/icons-material/EditNote'
import { useTranslations } from 'next-intl'
import { getAmplifyClient } from '../../utils/amplifyClient'
import NotificationInvitations from '../Notifications/NotificationInvitations'

// ============================================================================
// Types
// ============================================================================

export interface JoinWorkbookDialogProps {
  open: boolean
  onClose: () => void
  onJoin: (info: { unitId: string; gradeId: string }) => void
}

// ============================================================================
// Component
// ============================================================================

export default function JoinWorkbookDialog({
  open,
  onClose,
  onJoin,
}: JoinWorkbookDialogProps) {
  const t = useTranslations('components')
  const tCommon = useTranslations('common')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState(0)

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value.trim())
    setError(null)
  }, [])

  const handleJoin = useCallback(async () => {
    if (!input) {
      setError(t('workbook.joinDialog.emptyInput'))
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Extract ID from URL or use directly
      let unitId = input
      const urlMatch = input.match(/\/workbook\/([a-zA-Z0-9-]+)/)
      if (urlMatch) {
        unitId = urlMatch[1]
      }

      // Verify the unit exists
      const client = getAmplifyClient()
      const { data: unit, errors } = await client.models.Unit.get({ id: unitId })

      if (errors?.length || !unit) {
        setError(t('workbook.joinDialog.notFound'))
        setLoading(false)
        return
      }

      onJoin({ unitId: unit.id, gradeId: '' })
      setInput('')
      setError(null)
    } catch (err: any) {
      console.error('[JoinWorkbookDialog] Error:', err)
      setError(err.message || t('workbook.joinDialog.error'))
    } finally {
      setLoading(false)
    }
  }, [input, onJoin, t])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && input && !loading) {
        handleJoin()
      }
    },
    [handleJoin, input, loading],
  )

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      aria-labelledby="join-workbook-dialog-title"
    >
      <DialogTitle id="join-workbook-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <EditNoteIcon color="primary" />
        {t('workbook.joinDialog.title')}
      </DialogTitle>

      <DialogContent>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Tab label={t('workbook.joinDialog.tabLink')} />
          <Tab label={t('workbook.joinDialog.tabInvitations')} />
        </Tabs>

        {tab === 0 && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t('workbook.joinDialog.description')}
            </Typography>

            <TextField
              autoFocus
              fullWidth
              label={t('workbook.joinDialog.inputLabel')}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="https://...workbook/abc-123 or abc-123"
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
            types={['WORKBOOK_SESSION_INVITE']}
            onJoin={(notification) => {
              if (notification.linkPath) {
                const match = notification.linkPath.match(/\/workbook\/([a-zA-Z0-9-]+)/)
                if (match) {
                  onJoin({ unitId: match[1], gradeId: '' })
                  onClose()
                }
              }
            }}
            joinLabel={t('workbook.joinDialog.joinButton')}
            emptyMessage={t('workbook.joinDialog.noInvitations')}
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
          disabled={!input || loading}
          startIcon={loading ? <Skeleton variant="circular" width={16} height={16} /> : <EditNoteIcon />}
        >
          {loading
            ? t('workbook.joinDialog.joining')
            : t('workbook.joinDialog.joinButton')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
