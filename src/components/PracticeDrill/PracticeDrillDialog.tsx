/**
 * @fileoverview PracticeDrillDialog — Full-screen dialog wrapper for practice
 * drills. Contains PracticeDrillProgress header + PracticeDrillWorkbook body.
 * Orchestrates the full drill lifecycle via usePracticeDrill.
 */

import React, { useCallback, useState, useContext } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Slide,
} from '@mui/material'
import type { TransitionProps } from '@mui/material/transitions'
import CloseIcon from '@mui/icons-material/Close'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { useTranslation } from 'next-i18next'
import PracticeDrillProgress from './PracticeDrillProgress'
import PracticeDrillWorkbook from './PracticeDrillWorkbook'
import CollaborativePresenceBar from './CollaborativePresenceBar'
import { usePracticeDrill } from './usePracticeDrill'
import { usePracticeCollaboration } from '../../yjs/practiceCollaborationHooks'
import { previewXP } from '../../utils/practiceXPCalculator'
import type { DrillConfig } from './PracticeDrillConfigPopup'
import type { VerifyResult } from './DrillRecordButton'

// ============================================================================
// Transition
// ============================================================================

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />
})

// ============================================================================
// Types
// ============================================================================

export interface PracticeDrillDialogProps {
  open: boolean
  onClose: () => void
  unitId: string
  unitName?: string
  config: DrillConfig
  sessionsCompletedToday?: number
  /** Username of the current user (required for collaborative mode) */
  username?: string
  /** Display name of the current user */
  displayName?: string
  /** Pre-existing session ID for joining collaborative sessions */
  joinSessionId?: string
  /** Room code when joining an existing session */
  joinRoomCode?: string
}

// ============================================================================
// Component
// ============================================================================

export default function PracticeDrillDialog({
  open,
  onClose,
  unitId,
  unitName = '',
  config,
  sessionsCompletedToday = 0,
  username = '',
  displayName = '',
  joinSessionId,
  joinRoomCode,
}: PracticeDrillDialogProps) {
  const { t } = useTranslation('components')
  const {
    session,
    generating,
    saving,
    error,
    generateDrill,
    submitAnswer,
    completeDrill,
    reset,
  } = usePracticeDrill(unitName)

  const [pronunciationResults, setPronunciationResults] = useState<Record<string, VerifyResult>>({})
  const [roomCode, setRoomCode] = useState(joinRoomCode || '')

  const isCollaborative = config.collaborative === true || !!joinSessionId
  const effectiveSessionId = joinSessionId || session.id || ''

  // Collaborative hook — only active when in collaborative mode with a session
  const collab = usePracticeCollaboration(
    isCollaborative && effectiveSessionId && username
      ? {
          sessionId: effectiveSessionId,
          user: { username, displayName: displayName || username },
        }
      : null,
  )

  // Start generation when dialog opens with blocks not yet loaded
  React.useEffect(() => {
    if (open && session.blocks.length === 0 && !generating && !error && !joinSessionId) {
      generateDrill(unitId, config)
    }
  }, [open, session.blocks.length, generating, error, generateDrill, unitId, config, joinSessionId])

  // Generate room code for new collaborative sessions
  React.useEffect(() => {
    if (isCollaborative && session.id && !roomCode) {
      const code = session.id.slice(0, 6).toUpperCase()
      setRoomCode(code)
      // Update PracticeSession record with roomCode and collaborative flag
      const client = (async () => {
        try {
          const { getAmplifyClient } = await import('../../utils/amplifyClient')
          const c = getAmplifyClient()
          await c.models.PracticeSession.update({
            id: session.id!,
            collaborative: true,
            roomCode: code,
            maxParticipants: config.maxParticipants || 5,
            participantIds: JSON.stringify([username]),
          })
        } catch (err) {
          console.error('[PracticeDrillDialog] Failed to set room code:', err)
        }
      })()
    }
  }, [isCollaborative, session.id, roomCode, config.maxParticipants, username])

  const handleClose = useCallback(() => {
    reset()
    setPronunciationResults({})
    setRoomCode('')
    onClose()
  }, [reset, onClose])

  const handleComplete = useCallback(async () => {
    await completeDrill()
  }, [completeDrill])

  const handlePronunciationResult = useCallback((blockId: string, result: VerifyResult) => {
    setPronunciationResults((prev) => ({
      ...prev,
      [blockId]: result,
    }))
  }, [])

  // Wrap submitAnswer to also sync via Yjs in collaborative mode
  const handleSubmitAnswer = useCallback(
    (blockId: string, answer: { complete: boolean; accuracy: number; userAnswer?: string }) => {
      submitAnswer(blockId, answer)
      if (isCollaborative) {
        collab.submitBlockAnswer(blockId, answer)
        collab.setActiveBlock(blockId)
      }
    },
    [submitAnswer, isCollaborative, collab],
  )

  const xpPreview = previewXP(sessionsCompletedToday, session.accuracy)
  const allCompleted = session.blocksCompleted === session.blocks.length && session.blocks.length > 0

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen
      TransitionComponent={Transition}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 6 }}>
        <Typography variant="h6" sx={{ flex: 1 }}>
          {unitName ? `${t('practiceDrill.dialog.title', 'Practice')}: ${unitName}` : t('practiceDrill.dialog.title', 'Practice')}
        </Typography>
        <IconButton
          onClick={handleClose}
          aria-label={t('practiceDrill.dialog.close', 'Close')}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Collaborative presence bar */}
      {isCollaborative && effectiveSessionId && (
        <CollaborativePresenceBar
          participants={collab.participants}
          currentUser={{ username, displayName: displayName || username }}
          groupStats={collab.groupStats}
          ownProgress={collab.ownProgress}
          roomCode={roomCode}
          isConnected={collab.isConnected}
        />
      )}

      {/* Progress header */}
      {session.blocks.length > 0 && (
        <PracticeDrillProgress
          blocksCompleted={session.blocksCompleted}
          blockCount={session.blocks.length}
          xpEarned={session.complete ? session.xpAwarded : xpPreview.total}
          xpDiminished={sessionsCompletedToday > 0}
        />
      )}

      <DialogContent dividers>
        {/* Loading state */}
        {generating && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 2 }}>
            <CircularProgress />
            <Typography color="text.secondary">
              {t('practiceDrill.dialog.generating', 'Generating practice questions...')}
            </Typography>
          </Box>
        )}

        {/* Error state */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
            <Button size="small" onClick={() => generateDrill(unitId, config)} sx={{ ml: 1 }}>
              {t('practiceDrill.dialog.retry', 'Retry')}
            </Button>
          </Alert>
        )}

        {/* Completion state */}
        {session.complete && (
          <Alert
            severity="success"
            icon={<CheckCircleIcon />}
            sx={{ mb: 2 }}
          >
            <Typography variant="subtitle1" fontWeight={600}>
              {t('practiceDrill.dialog.complete', 'Drill Complete!')}
            </Typography>
            <Typography variant="body2">
              {t('practiceDrill.dialog.completeSummary', 'Accuracy: {{accuracy}}% — XP earned: +{{xp}}', {
                accuracy: session.accuracy,
                xp: session.xpAwarded,
              })}
            </Typography>
          </Alert>
        )}

        {/* Workbook */}
        {!generating && session.blocks.length > 0 && (
          <PracticeDrillWorkbook
            blocks={session.blocks}
            answers={session.answers}
            sessionId={session.id || ''}
            onSubmitAnswer={handleSubmitAnswer}
            onPronunciationResult={handlePronunciationResult}
            collaborative={isCollaborative}
            groupStats={isCollaborative ? collab.groupStats : undefined}
            getBlockGroupAccuracy={
              isCollaborative
                ? (blockId: string) => collab.groupStats.blockAccuracies[blockId]
                : undefined
            }
          />
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          {session.complete
            ? t('practiceDrill.dialog.done', 'Done')
            : t('practiceDrill.dialog.cancel', 'Cancel')}
        </Button>
        {!session.complete && allCompleted && (
          <Button
            variant="contained"
            onClick={handleComplete}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} /> : <CheckCircleIcon />}
          >
            {t('practiceDrill.dialog.finish', 'Finish & Earn XP')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
