/**
 * AIFeedbackSnackbar — Shows a Snackbar when AI feedback is received
 * by another user in the same collaborative session.
 *
 * Listens to the workbook provider's feedback Y.Map for changes
 * and shows a brief notification with the block that was updated.
 *
 * @module AIFeedbackSnackbar
 */

import React, { useEffect, useState, useCallback } from 'react'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import type { WorkbookCollaborationProvider } from '../../yjs/WorkbookCollaborationProvider'

export interface AIFeedbackSnackbarProps {
  provider: WorkbookCollaborationProvider | null
  currentUsername: string
}

interface FeedbackNotification {
  blockId: string
  message: string
}

export function AIFeedbackSnackbar({
  provider,
  currentUsername,
}: AIFeedbackSnackbarProps) {
  const [notification, setNotification] = useState<FeedbackNotification | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!provider) return

    const feedbackMap = provider.getMap('feedback')

    const handleFeedbackChange = (event: any) => {
      // Only notify for remote changes (not our own)
      if (event.transaction.local) return

      for (const [blockId] of event.changes.keys) {
        setNotification({
          blockId,
          message: `AI feedback received for block ${blockId.slice(0, 8)}...`,
        })
        setOpen(true)
      }
    }

    feedbackMap.observe(handleFeedbackChange)

    return () => {
      feedbackMap.unobserve(handleFeedbackChange)
    }
  }, [provider, currentUsername])

  const handleClose = useCallback(
    (_event?: React.SyntheticEvent | Event, reason?: string) => {
      if (reason === 'clickaway') return
      setOpen(false)
    },
    [],
  )

  return (
    <Snackbar
      open={open}
      autoHideDuration={5000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
    >
      <Alert
        onClose={handleClose}
        severity="info"
        variant="filled"
        icon={<AutoAwesomeIcon />}
        sx={{ width: '100%' }}
      >
        {notification?.message || 'AI feedback received'}
      </Alert>
    </Snackbar>
  )
}

export default AIFeedbackSnackbar
