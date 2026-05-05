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
  Skeleton,
  Alert,
  Slide,
} from '@mui/material'
import type { TransitionProps } from '@mui/material/transitions'
import CloseIcon from '@mui/icons-material/Close'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { useTranslation } from 'next-i18next'
import PracticeDrillProgress from './PracticeDrillProgress'
import DrillGradeAdapter from './DrillGradeAdapter'
import CollaborativePresenceBar from './CollaborativePresenceBar'
import { Workbook } from '../Editor3/Workbook'
import { usePracticeDrill } from './usePracticeDrill'
import { usePracticeCollaboration } from '../../yjs/practiceCollaborationHooks'
import { previewXP } from '../../utils/practiceXPCalculator'
import type { DrillConfig } from './PracticeDrillConfigPopup'
import type { DrillStats } from './DrillGradeAdapter'

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
    completeDrill,
    reset,
  } = usePracticeDrill(unitName)

  const [drillStats, setDrillStats] = useState<DrillStats>({
    blocksCompleted: 0,
    accuracy: 0,
    complete: false,
  })
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
    setDrillStats({ blocksCompleted: 0, accuracy: 0, complete: false })
    setRoomCode('')
    onClose()
  }, [reset, onClose])

  const handleComplete = useCallback(async () => {
    await completeDrill()
  }, [completeDrill])

  const handleStatsChange = useCallback((stats: DrillStats) => {
    setDrillStats(stats)
  }, [])

  const xpPreview = previewXP(sessionsCompletedToday, drillStats.accuracy)
  const allCompleted = drillStats.complete && session.blocks.length > 0

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
          blocksCompleted={drillStats.blocksCompleted}
          blockCount={session.blocks.length}
          xpEarned={session.complete ? session.xpAwarded : xpPreview.total}
          xpDiminished={sessionsCompletedToday > 0}
        />
      )}

      <DialogContent dividers>
        {/* Loading state */}
        {generating && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 2 }}>
            <Skeleton variant="circular" width={48} height={48} />
            <Skeleton variant="text" width={240} height={24} />
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
                accuracy: drillStats.accuracy,
                xp: session.xpAwarded,
              })}
            </Typography>
          </Alert>
        )}

        {/* Workbook — renders via existing Lexical graded block plugins */}
        {!generating && session.blocks.length > 0 && (
          <DrillGradeAdapter
            sessionId={session.id || ''}
            blocks={session.blocks as import('./buildDrillEditorState').PracticeDrillBlock[]}
            onGradeChange={(_data, stats) => handleStatsChange(stats)}
          >
            <Workbook />
          </DrillGradeAdapter>
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
            startIcon={saving ? <Skeleton variant="circular" width={16} height={16} /> : <CheckCircleIcon />}
          >
            {t('practiceDrill.dialog.finish', 'Finish & Earn XP')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
