/**
 * AIFeedbackSnackbar — Shows a Snackbar when AI feedback is received
 * by another user in the same collaborative session.
 *
 * Listens to the workbook provider's feedback Y.Map for changes
 * and shows a brief notification with the block that was updated.
 *
 * @module AIFeedbackSnackbar
 */

import React, { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import type { WorkbookCollaborationProvider } from '../../yjs/WorkbookCollaborationProvider'
import { useEditorToast } from '../Editor3/context/EditorToastContext'

export interface AIFeedbackSnackbarProps {
  provider: WorkbookCollaborationProvider | null
  currentUsername: string
}

export function AIFeedbackSnackbar({
  provider,
  currentUsername,
}: AIFeedbackSnackbarProps) {
  const t = useTranslations('components')
  const { showToast } = useEditorToast()

  useEffect(() => {
    if (!provider) return

    const feedbackMap = provider.getMap('feedback')

    const handleFeedbackChange = (event: any) => {
      // Only notify for remote changes (not our own)
      if (event.transaction.local) return

      for (const [blockId] of event.changes.keys) {
        showToast({
          message: t('aiFeedbackSnackbar.receivedForBlock', {
            block: blockId.slice(0, 8),
          }),
          severity: 'info',
          autoHideDuration: 5000,
        })
      }
    }

    feedbackMap.observe(handleFeedbackChange)

    return () => {
      feedbackMap.unobserve(handleFeedbackChange)
    }
  }, [provider, currentUsername, showToast, t])

  return null
}

export default AIFeedbackSnackbar
