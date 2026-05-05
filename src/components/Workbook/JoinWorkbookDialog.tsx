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
} from '@mui/material'
import EditNoteIcon from '@mui/icons-material/EditNote'
import { useTranslation } from 'next-i18next'
import { getAmplifyClient } from '../../utils/amplifyClient'

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
  const { t } = useTranslation('components')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value.trim())
    setError(null)
  }, [])

  const handleJoin = useCallback(async () => {
    if (!input) {
      setError(t('workbook.joinDialog.emptyInput', 'Please enter a workbook link or unit ID'))
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
        setError(t('workbook.joinDialog.notFound', 'No workbook found with that ID'))
        setLoading(false)
        return
      }

      onJoin({ unitId: unit.id, gradeId: '' })
      setInput('')
      setError(null)
    } catch (err: any) {
      console.error('[JoinWorkbookDialog] Error:', err)
      setError(err.message || t('workbook.joinDialog.error', 'Failed to find workbook'))
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
        {t('workbook.joinDialog.title', 'Join Workbook Session')}
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('workbook.joinDialog.description', 'Paste a workbook link or enter a unit ID to join a student\'s workbook as an instructor.')}
        </Typography>

        <TextField
          autoFocus
          fullWidth
          label={t('workbook.joinDialog.inputLabel', 'Workbook link or Unit ID')}
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
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          {t('common:actions.cancel', 'Cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={handleJoin}
          disabled={!input || loading}
          startIcon={loading ? <Skeleton variant="circular" width={16} height={16} /> : <EditNoteIcon />}
        >
          {loading
            ? t('workbook.joinDialog.joining', 'Finding...')
            : t('workbook.joinDialog.joinButton', 'Join Workbook')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
