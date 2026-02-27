/**
 * Example: Student Workbook with Tutor Collaboration
 * 
 * Demonstrates how to use the Workbook Collaboration feature
 * for real-time student-tutor interaction.
 */

import React, { useContext, useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Chip,
  LinearProgress,
  Avatar,
  AvatarGroup,
  IconButton,
  Tooltip,
} from '@mui/material'
import {
  CheckCircle as CheckIcon,
  RadioButtonUnchecked as UncheckedIcon,
  Person as PersonIcon,
  Wifi as ConnectedIcon,
  WifiOff as DisconnectedIcon,
} from '@mui/icons-material'
import {
  useWorkbookCollaboration,
  useWorkbookBlock,
  useWorkbookStats,
  useTutorPresence,
} from '@/yjs/workbookHooks'
import UnitContext from '@/context/unitContext'
import { DataStore } from '@aws-amplify/datastore'
import { Grade } from '@/models'

interface WorkbookProps {
  gradeId: string
  unitId: string
}

/**
 * Main Workbook Component
 * 
 * Shows the student's workbook with real-time collaboration features
 */
export function CollaborativeWorkbook({ gradeId, unitId }: WorkbookProps) {
  const { session, grade } = useContext(UnitContext)
  const [showTutorNotification, setShowTutorNotification] = useState(false)

  // Initialize collaborative workbook
  const {
    provider,
    workbookData,
    updateBlock,
    activeTutors,
    connectedUsers,
    isSynced,
    isConnected,
    getCompletionPercentage,
    getOverallAccuracy,
  } = useWorkbookCollaboration({
    gradeId,
    user: {
      username: session.username || '',
      role: 'student',
      displayName: session.user?.name || session.username || '',
      color: '#3b82f6', // Blue for students
    },
    initialData: grade?.data,
    onTutorJoin: (tutor) => {
      setShowTutorNotification(true)
      console.log(`Tutor ${tutor.displayName} joined to help!`)
    },
    onTutorLeave: (tutor) => {
      console.log(`Tutor ${tutor.displayName} left`)
    },
    onSyncToGrade: async (data, feedback) => {
      // Sync to DataStore
      if (!grade) return

      try {
        const parsed = JSON.parse(data)
        const blocks = Object.values(parsed)
        
        // Calculate metrics
        const complete = blocks.every((b: any) => b.complete)
        const percentComplete = Math.round(
          (blocks.filter((b: any) => b.complete).length / blocks.length) * 100
        )
        const accuracy = Math.round(
          blocks.reduce((sum: number, b: any) => sum + (b.accuracy || 0), 0) / blocks.length
        )

        await DataStore.save(
          Grade.copyOf(grade, (updated) => {
            updated.data = data
            updated.feedback = JSON.stringify(feedback)
            updated.complete = complete
            updated.percentComplete = percentComplete
            updated.accuracy = accuracy
          })
        )

        console.log('[Workbook] Synced to Grade.data')
      } catch (error) {
        console.error('[Workbook] Error syncing to Grade:', error)
      }
    },
  })

  const stats = useWorkbookStats(provider)

  return (
    <Box sx={{ p: 2 }}>
      {/* Tutor Presence Notification */}
      {showTutorNotification && activeTutors.length > 0 && (
        <Alert
          severity="info"
          onClose={() => setShowTutorNotification(false)}
          sx={{ mb: 2 }}
        >
          <Typography variant="body2">
            <strong>{activeTutors.map((t) => t.displayName).join(', ')}</strong>{' '}
            {activeTutors.length === 1 ? 'is' : 'are'} helping you with this assignment
          </Typography>
        </Alert>
      )}

      {/* Header with Progress and Connection Status */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5">Your Workbook</Typography>

            <Box display="flex" gap={1} alignItems="center">
              {/* Connected Users */}
              {connectedUsers.length > 0 && (
                <Tooltip title={connectedUsers.map((u) => u.displayName).join(', ')}>
                  <AvatarGroup max={3} sx={{ cursor: 'pointer' }}>
                    {connectedUsers.map((user, i) => (
                      <Avatar
                        key={i}
                        sx={{
                          bgcolor: user.color || '#666',
                          width: 32,
                          height: 32,
                          fontSize: '0.875rem',
                        }}
                      >
                        {user.displayName?.[0] || user.username[0]}
                      </Avatar>
                    ))}
                  </AvatarGroup>
                </Tooltip>
              )}

              {/* Connection Status */}
              <Tooltip title={isConnected ? 'Connected' : 'Disconnected'}>
                <IconButton size="small">
                  {isConnected ? (
                    <ConnectedIcon color="success" />
                  ) : (
                    <DisconnectedIcon color="disabled" />
                  )}
                </IconButton>
              </Tooltip>

              {/* Sync Status */}
              {!isSynced && isConnected && (
                <Chip label="Syncing..." size="small" color="warning" />
              )}
            </Box>
          </Box>

          {/* Progress Bar */}
          <Box mb={1}>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="body2" color="text.secondary">
                Progress
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {stats.completedBlocks} / {stats.totalBlocks} ({stats.completion}%)
              </Typography>
            </Box>
            <LinearProgress variant="determinate" value={stats.completion} />
          </Box>

          {/* Accuracy */}
          <Box display="flex" gap={1}>
            <Chip
              label={`${stats.accuracy}% accuracy`}
              color={stats.accuracy >= 80 ? 'success' : stats.accuracy >= 60 ? 'warning' : 'error'}
              size="small"
            />
            {stats.averageAttempts > 0 && (
              <Chip
                label={`${stats.averageAttempts} avg attempts`}
                variant="outlined"
                size="small"
              />
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Workbook Blocks */}
      <Box display="flex" flexDirection="column" gap={2}>
        {Object.keys(workbookData).map((blockId) => (
          <WorkbookBlockExample
            key={blockId}
            blockId={blockId}
            updateBlock={updateBlock}
          />
        ))}
      </Box>
    </Box>
  )
}

/**
 * Individual Workbook Block
 * 
 * Shows a single quiz/answer block with tutor cursor indicators
 */
interface BlockProps {
  blockId: string
  provider?: any
  updateBlock: (id: string, data: any) => void
}

function WorkbookBlockExample({ blockId, provider, updateBlock }: BlockProps) {
  const { blockData, isComplete, accuracy } = useWorkbookBlock(provider, blockId)
  const tutorsOnBlock = useTutorPresence(provider, blockId)

  const handleAnswer = (answer: number) => {
    // Simulate quiz answer
    const isCorrect = answer === 2 // Assume correct answer is option 2
    
    updateBlock(blockId, {
      userAnswer: answer,
      complete: true,
      accuracy: isCorrect ? 100 : 0,
      attempts: (blockData?.attempts || 0) + 1,
    })
  }

  return (
    <Card sx={{ position: 'relative' }}>
      <CardContent>
        {/* Tutor Cursors */}
        {tutorsOnBlock.length > 0 && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              display: 'flex',
              gap: 0.5,
            }}
          >
            {tutorsOnBlock.map((tutor, i) => (
              <Tooltip key={i} title={`${tutor.displayName} is viewing this block`}>
                <Avatar
                  sx={{
                    bgcolor: tutor.color || '#f59e0b',
                    width: 24,
                    height: 24,
                    fontSize: '0.75rem',
                  }}
                >
                  <PersonIcon fontSize="small" />
                </Avatar>
              </Tooltip>
            ))}
          </Box>
        )}

        {/* Block Header */}
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          {isComplete ? (
            <CheckIcon color="success" />
          ) : (
            <UncheckedIcon color="disabled" />
          )}
          <Typography variant="h6">Question {blockId.split('-').pop()}</Typography>
        </Box>

        {/* Question Content */}
        <Typography variant="body1" mb={2}>
          What is the correct translation of "Hello"?
        </Typography>

        {/* Answer Options */}
        <Box display="flex" flexDirection="column" gap={1}>
          {['さようなら', 'ありがとう', 'こんにちは', 'おはよう'].map((option, index) => (
            <Box
              key={index}
              onClick={() => !isComplete && handleAnswer(index)}
              sx={{
                p: 1.5,
                border: '2px solid',
                borderColor:
                  blockData?.userAnswer === index
                    ? accuracy === 100
                      ? 'success.main'
                      : 'error.main'
                    : 'divider',
                borderRadius: 1,
                cursor: isComplete ? 'default' : 'pointer',
                bgcolor:
                  blockData?.userAnswer === index
                    ? accuracy === 100
                      ? 'success.lighter'
                      : 'error.lighter'
                    : 'background.paper',
                '&:hover': !isComplete
                  ? {
                      bgcolor: 'action.hover',
                    }
                  : {},
              }}
            >
              <Typography>{option}</Typography>
            </Box>
          ))}
        </Box>

        {/* Feedback */}
        {blockData?.feedback && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">{blockData.feedback}</Typography>
          </Alert>
        )}

        {/* Stats */}
        {isComplete && (
          <Box display="flex" gap={1} mt={2}>
            <Chip
              label={`${accuracy}% accuracy`}
              color={accuracy === 100 ? 'success' : 'error'}
              size="small"
            />
            {blockData?.attempts && blockData.attempts > 1 && (
              <Chip
                label={`${blockData.attempts} attempts`}
                variant="outlined"
                size="small"
              />
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default CollaborativeWorkbook
