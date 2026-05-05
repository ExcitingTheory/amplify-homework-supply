/**
 * GutterAnnotations — Sidebar panel showing wrong answers per graded block.
 *
 * Displays all incorrect responses across multiple attempts, grouped by block,
 * with visual indicators for attempt number and accuracy trends.
 */

import * as React from 'react'
import {
  Box,
  Typography,
  Paper,
  Chip,
  Stack,
  Divider,
  Collapse,
  IconButton,
  Tooltip,
  alpha,
} from '@mui/material'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import QuizIcon from '@mui/icons-material/Quiz'
import CompareArrowsIcon from '@mui/icons-material/CompareArrows'
import EditNoteIcon from '@mui/icons-material/EditNote'
import MicIcon from '@mui/icons-material/Mic'
import type { WrongAnswerAnnotation, GradeAttempt } from './GradedWorkbookViewer'

// ============================================================================
// Types
// ============================================================================

interface GutterAnnotationsProps {
  wrongAnswersByBlock: Record<string, WrongAnswerAnnotation[]>
  currentAttempt: number
  grades: GradeAttempt[]
}

// ============================================================================
// Block type icons and labels
// ============================================================================

const BLOCK_TYPE_CONFIG: Record<string, { icon: React.ReactNode; label: string }> = {
  quiz: { icon: <QuizIcon fontSize="small" />, label: 'Quiz' },
  'meaning-association': { icon: <CompareArrowsIcon fontSize="small" />, label: 'Matching' },
  'custom-answer': { icon: <EditNoteIcon fontSize="small" />, label: 'Written Response' },
  answer: { icon: <MicIcon fontSize="small" />, label: 'Vocabulary' },
}

// ============================================================================
// Component
// ============================================================================

export function GutterAnnotations({
  wrongAnswersByBlock,
  currentAttempt,
  grades,
}: GutterAnnotationsProps) {
  const [expandedBlocks, setExpandedBlocks] = React.useState<Set<string>>(new Set())

  const blockIds = Object.keys(wrongAnswersByBlock)
  const totalWrongCount = Object.values(wrongAnswersByBlock).reduce(
    (sum, annotations) => sum + annotations.length,
    0,
  )

  const toggleBlock = (blockId: string) => {
    setExpandedBlocks((prev) => {
      const next = new Set(prev)
      if (next.has(blockId)) {
        next.delete(blockId)
      } else {
        next.add(blockId)
      }
      return next
    })
  }

  if (blockIds.length === 0) {
    return (
      <Paper
        elevation={0}
        variant="outlined"
        sx={{ p: 2, textAlign: 'center' }}
      >
        <Typography variant="body2" color="text.secondary">
          No incorrect answers to display.
        </Typography>
      </Paper>
    )
  }

  return (
    <Paper elevation={0} variant="outlined" sx={{ p: 0, overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ p: 1.5, bgcolor: 'error.50', borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <ErrorOutlineIcon color="error" fontSize="small" />
          <Typography variant="subtitle2">
            Wrong Answers
          </Typography>
          <Chip
            label={totalWrongCount}
            size="small"
            color="error"
            variant="outlined"
          />
        </Stack>
        <Typography variant="caption" color="text.secondary">
          Across {grades.length} attempt{grades.length !== 1 ? 's' : ''}
        </Typography>
      </Box>

      {/* Block annotations */}
      <Box sx={{ maxHeight: '60vh', overflow: 'auto' }}>
        {blockIds.map((blockId) => {
          const annotations = wrongAnswersByBlock[blockId]
          const isExpanded = expandedBlocks.has(blockId)
          const blockType = annotations[0]?.type || 'quiz'
          const config = BLOCK_TYPE_CONFIG[blockType] || BLOCK_TYPE_CONFIG.quiz

          // Group by attempt
          const byAttempt = annotations.reduce<Record<number, WrongAnswerAnnotation[]>>(
            (acc, ann) => {
              if (!acc[ann.attemptNumber]) acc[ann.attemptNumber] = []
              acc[ann.attemptNumber].push(ann)
              return acc
            },
            {},
          )

          return (
            <Box key={blockId}>
              {/* Block header */}
              <Box
                sx={{
                  px: 1.5,
                  py: 1,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  '&:hover': { bgcolor: 'action.hover' },
                }}
                onClick={() => toggleBlock(blockId)}
              >
                {config.icon}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={500} noWrap>
                    {config.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {blockId}
                  </Typography>
                </Box>
                <Chip
                  label={annotations.length}
                  size="small"
                  color="error"
                  variant="filled"
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
                <IconButton size="small">
                  {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                </IconButton>
              </Box>

              {/* Expanded detail */}
              <Collapse in={isExpanded}>
                <Box sx={{ px: 1.5, pb: 1.5 }}>
                  {Object.entries(byAttempt)
                    .sort(([a], [b]) => Number(b) - Number(a))
                    .map(([attemptNum, attemptAnnotations]) => (
                      <Box
                        key={attemptNum}
                        sx={{
                          mb: 1,
                          p: 1,
                          borderRadius: 1,
                          bgcolor: (theme) => alpha(theme.palette.error.main, 0.04),
                          border: 1,
                          borderColor: 'divider',
                        }}
                      >
                        <Typography variant="caption" fontWeight={600} color="text.secondary">
                          Attempt #{attemptNum}
                        </Typography>

                        {attemptAnnotations.map((annotation, idx) => (
                          <AnnotationItem key={idx} annotation={annotation} />
                        ))}
                      </Box>
                    ))}
                </Box>
              </Collapse>
              <Divider />
            </Box>
          )
        })}
      </Box>
    </Paper>
  )
}

// ============================================================================
// AnnotationItem — individual wrong answer display
// ============================================================================

function AnnotationItem({ annotation }: { annotation: WrongAnswerAnnotation }) {
  switch (annotation.type) {
    case 'quiz':
      return (
        <Box sx={{ mt: 0.5, pl: 1, borderLeft: 2, borderColor: 'error.main' }}>
          <Typography variant="caption" color="error.main" fontWeight={500}>
            Q: {annotation.questionId}
          </Typography>
          <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
            &ldquo;{annotation.wrongAnswer}&rdquo;
          </Typography>
        </Box>
      )

    case 'meaning-association':
      return (
        <Box sx={{ mt: 0.5, pl: 1, borderLeft: 2, borderColor: 'warning.main' }}>
          <Typography variant="caption" color="warning.dark">
            Accuracy: {annotation.accuracy}%
          </Typography>
        </Box>
      )

    case 'custom-answer':
      return (
        <Box sx={{ mt: 0.5, pl: 1, borderLeft: 2, borderColor: 'error.main' }}>
          <Typography variant="body2" sx={{ fontStyle: 'italic' }} noWrap>
            &ldquo;{annotation.wrongAnswer}&rdquo;
          </Typography>
          {annotation.feedback && (
            <Typography variant="caption" color="text.secondary">
              Feedback: {annotation.feedback}
            </Typography>
          )}
          {annotation.accuracy != null && (
            <Chip
              label={`${annotation.accuracy}%`}
              size="small"
              color="warning"
              variant="outlined"
              sx={{ mt: 0.5, height: 18, fontSize: '0.65rem' }}
            />
          )}
        </Box>
      )

    case 'answer':
      return (
        <Box sx={{ mt: 0.5, pl: 1, borderLeft: 2, borderColor: 'error.main' }}>
          <Typography variant="caption" color="error.main">
            Vocab response incorrect
          </Typography>
          {annotation.wrongAnswer && (
            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
              &ldquo;{annotation.wrongAnswer}&rdquo;
            </Typography>
          )}
        </Box>
      )

    default:
      return null
  }
}
