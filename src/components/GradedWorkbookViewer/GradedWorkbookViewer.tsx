/**
 * GradedWorkbookViewer — Instructor view of a student's completed workbook.
 *
 * Renders the unit's Lexical content in read-only mode and overlays gutter
 * annotations on graded blocks showing wrong answers (including all attempts).
 * Includes a moderation status panel for flagged content review.
 *
 * @module GradedWorkbookViewer
 */

import * as React from 'react'
import { useMemo } from 'react'
import {
  Box,
  Paper,
  Typography,
  Chip,
  Divider,
  Alert,
  AlertTitle,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  LinearProgress,
  IconButton,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import ShieldIcon from '@mui/icons-material/Shield'
import HistoryIcon from '@mui/icons-material/History'
import CloseIcon from '@mui/icons-material/Close'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin'
import { ClickableLinkPlugin as LexicalClickableLinkPlugin } from '@lexical/react/LexicalClickableLinkPlugin'
import { HashtagPlugin } from '@lexical/react/LexicalHashtagPlugin'
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin'
import { TablePlugin } from '@lexical/react/LexicalTablePlugin'
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin'

import { AudioPlayerProvider } from '../Editor3/context/AudioPlayerContext'
import { AutocompleteProvider } from '../Editor3/context/SharedAutocompleteContext'
import { DndWrapper } from '../MeaningAssociationExercise/DndWrapper'
import LanguageEditorTheme from '../Editor3/config/LanguageEditorTheme'

import YouTubePlugin from '../Editor3/plugins/YouTubePlugin'
import WordBlockPlugin from '../Editor3/plugins/WordBlockPlugin'
import QuizPlugin from '../Editor3/plugins/QuizPlugin'
import MeaningAssociationPlugin from '../Editor3/plugins/MeaningAssociationPlugin'
import PlaylistPlugin from '../Editor3/plugins/PlaylistPlugin'
import PdfViewerPlugin from '../Editor3/plugins/PdfViewerPlugin'
import ImagesPlugin from '../Editor3/plugins/ImagesPlugin'
import AnswerPlugin from '../Editor3/plugins/AnswerPlugin'
import CustomAnswerPlugin from '../Editor3/plugins/CustomAnswerPlugin'

import { EditorNodes, ALL_TRANSFORMERS, onError } from '../Editor3/editorConfig'
import { GradedWorkbookStatePlugin } from './GradedWorkbookStatePlugin'
import { GutterAnnotations } from './GutterAnnotations'
import { ModerationPanel } from './ModerationPanel'

// ============================================================================
// Types
// ============================================================================

/** A single quiz question response */
export interface QuizResponse {
  selected: string
  correct: boolean
}

/** Block-level grade data for a quiz block */
export interface QuizBlockData {
  complete: boolean
  accuracy: number
  responses: Record<string, QuizResponse>
}

/** Block-level grade data for a meaning-association block */
export interface MeaningAssocBlockData {
  complete: boolean
  accuracy: number
  matches: Record<string, string>
}

/** Block-level grade data for a custom-answer block */
export interface CustomAnswerBlockData {
  complete: boolean
  accuracy: number
  userAnswer: string | null
  feedback?: string
  audioFileId?: string
  drawingFileId?: string
}

/** Block-level grade data for an answer (vocab) block */
export interface AnswerBlockData {
  complete: boolean
  accuracy: number
  responses: Record<string, {
    textAnswer?: string
    audioAnswer?: string
    audioFileId?: string
    accuracy?: number
  }>
}

/** Union of all block data types */
export type GradeBlockData = QuizBlockData | MeaningAssocBlockData | CustomAnswerBlockData | AnswerBlockData

/** A single grade attempt */
export interface GradeAttempt {
  id: string
  attempt?: number
  accuracy: number
  percentComplete: number
  complete: boolean
  data: Record<string, GradeBlockData>
  feedback?: {
    overall?: string
    blockFeedback?: Record<string, string>
    instructorNotes?: string
  }
  moderationStatus?: string | null
  moderationFlags?: Record<string, any> | null
  moderationCheckedAt?: string | null
  createdAt: string
  updatedAt: string
}

/** Moderation info */
export interface ModerationInfo {
  status: 'pending' | 'approved' | 'flagged' | null
  flags?: Record<string, any> | null
  checkedAt?: string | null
}

export interface GradedWorkbookViewerProps {
  /** Serialized Lexical JSON content of the unit (Unit.data) */
  contentJson: string
  /** The student's name for display */
  studentName: string
  /** All grade attempts for this student/unit (sorted newest first) */
  grades: GradeAttempt[]
  /** Moderation info (from latest grade or standalone) */
  moderation?: ModerationInfo | null
  /** Callback when instructor triggers a moderation action */
  onModerationAction?: (action: 'approve' | 'flag' | 'recheck', gradeId: string) => void
  /** Optional max height for the workbook content area */
  maxHeight?: string | number
}

// ============================================================================
// Component
// ============================================================================

export function GradedWorkbookViewer({
  contentJson,
  studentName,
  grades,
  moderation,
  onModerationAction,
  maxHeight,
}: GradedWorkbookViewerProps) {
  const [selectedAttempt, setSelectedAttempt] = React.useState(0)

  const currentGrade = grades[selectedAttempt]

  // Collect wrong answers across all attempts for gutter annotations
  const wrongAnswersByBlock = useMemo(() => {
    const result: Record<string, WrongAnswerAnnotation[]> = {}

    grades.forEach((grade, attemptIndex) => {
      if (!grade.data) return
      const attemptNum = grade.attempt || grades.length - attemptIndex

      Object.entries(grade.data).forEach(([blockId, blockData]) => {
        if (!result[blockId]) result[blockId] = []

        // Quiz blocks
        if ('responses' in blockData && 'accuracy' in blockData) {
          const quizData = blockData as QuizBlockData
          Object.entries(quizData.responses).forEach(([questionId, response]) => {
            if (!response.correct) {
              result[blockId].push({
                blockId,
                questionId,
                attemptNumber: attemptNum,
                wrongAnswer: response.selected,
                type: 'quiz',
                timestamp: grade.createdAt,
              })
            }
          })
        }

        // Meaning-association blocks — accuracy < 100 means some were wrong
        if ('matches' in blockData && !('responses' in blockData)) {
          const maData = blockData as MeaningAssocBlockData
          if (maData.accuracy < 100) {
            result[blockId].push({
              blockId,
              attemptNumber: attemptNum,
              type: 'meaning-association',
              accuracy: maData.accuracy,
              timestamp: grade.createdAt,
            })
          }
        }

        // Custom-answer blocks — accuracy < 100 or has feedback indicating issues
        if ('userAnswer' in blockData) {
          const caData = blockData as CustomAnswerBlockData
          if (caData.accuracy < 100 && caData.userAnswer) {
            result[blockId].push({
              blockId,
              attemptNumber: attemptNum,
              wrongAnswer: caData.userAnswer,
              feedback: caData.feedback,
              type: 'custom-answer',
              accuracy: caData.accuracy,
              timestamp: grade.createdAt,
            })
          }
        }
      })
    })

    return result
  }, [grades])

  const initialConfig = useMemo(
    () => ({
      namespace: 'GradedWorkbookViewer',
      theme: LanguageEditorTheme,
      onError,
      editable: false,
      editorState: null,
      nodes: [...EditorNodes],
    }),
    [],
  )

  const overallAccuracy = currentGrade?.accuracy ?? 0
  const accuracyColor = overallAccuracy >= 80 ? 'success' : overallAccuracy >= 60 ? 'warning' : 'error'

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
          <Box>
            <Typography variant="h6" component="h2">
              {studentName}&apos;s Workbook
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {grades.length} attempt{grades.length !== 1 ? 's' : ''} &middot; Latest: {currentGrade?.complete ? 'Complete' : 'In Progress'}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              icon={overallAccuracy >= 80 ? <CheckCircleOutlineIcon /> : <ErrorOutlineIcon />}
              label={`${Math.round(overallAccuracy)}% Accuracy`}
              color={accuracyColor}
              variant="outlined"
            />
            {currentGrade?.percentComplete != null && (
              <Chip
                label={`${Math.round(currentGrade.percentComplete)}% Complete`}
                variant="outlined"
                size="small"
              />
            )}
            {moderation && moderation.status === 'flagged' && (
              <Chip
                icon={<WarningAmberIcon />}
                label="Content Flagged"
                color="error"
                size="small"
              />
            )}
          </Stack>
        </Stack>

        {/* Attempt selector */}
        {grades.length > 1 && (
          <Box sx={{ mt: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <HistoryIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                Attempts:
              </Typography>
              {grades.map((grade, index) => (
                <Chip
                  key={grade.id}
                  label={`#${grade.attempt || grades.length - index} — ${Math.round(grade.accuracy)}%`}
                  size="small"
                  color={index === selectedAttempt ? 'primary' : 'default'}
                  variant={index === selectedAttempt ? 'filled' : 'outlined'}
                  onClick={() => setSelectedAttempt(index)}
                />
              ))}
            </Stack>
          </Box>
        )}
      </Paper>

      {/* Moderation Panel */}
      {moderation && (
        <ModerationPanel
          moderation={moderation}
          gradeId={currentGrade?.id || ''}
          onAction={onModerationAction}
        />
      )}

      {/* Main content area: Lexical workbook + gutter */}
      <Box sx={{ display: 'flex', flex: 1, minHeight: 0, gap: 2 }}>
        {/* Workbook content */}
        <Paper
          elevation={0}
          variant="outlined"
          sx={{
            flex: 1,
            overflow: 'auto',
            maxHeight: maxHeight || '70vh',
            position: 'relative',
          }}
        >
          <DndWrapper>
            <AutocompleteProvider>
              <AudioPlayerProvider>
                <LexicalComposer initialConfig={initialConfig}>
                  <CheckListPlugin />
                  <HashtagPlugin />
                  <HorizontalRulePlugin />
                  <ListPlugin />
                  <TabIndentationPlugin />
                  <MarkdownShortcutPlugin transformers={ALL_TRANSFORMERS} />
                  <TablePlugin />
                  <LexicalClickableLinkPlugin />
                  <YouTubePlugin />
                  <WordBlockPlugin />
                  <QuizPlugin />
                  <MeaningAssociationPlugin />
                  <PlaylistPlugin />
                  <PdfViewerPlugin />
                  <ImagesPlugin captionsEnabled={false} />
                  <AnswerPlugin />
                  <CustomAnswerPlugin />
                  <GradedWorkbookStatePlugin contentJson={contentJson} />

                  <RichTextPlugin
                    contentEditable={
                      <ContentEditable
                        aria-label={`${studentName}'s graded workbook`}
                        style={{
                          width: '100%',
                          padding: '1.5rem',
                          outline: 'none',
                          minHeight: '400px',
                        }}
                      />
                    }
                    placeholder={null}
                    ErrorBoundary={LexicalErrorBoundary}
                  />
                </LexicalComposer>
              </AudioPlayerProvider>
            </AutocompleteProvider>
          </DndWrapper>
        </Paper>

        {/* Gutter annotations sidebar */}
        <Box sx={{ width: 320, flexShrink: 0, overflow: 'auto', maxHeight: maxHeight || '70vh' }}>
          <GutterAnnotations
            wrongAnswersByBlock={wrongAnswersByBlock}
            currentAttempt={selectedAttempt}
            grades={grades}
          />
        </Box>
      </Box>

      {/* Feedback section */}
      {currentGrade?.feedback && (
        <Paper elevation={0} variant="outlined" sx={{ mt: 2, p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Feedback — Attempt #{currentGrade.attempt || grades.length - selectedAttempt}
          </Typography>
          {currentGrade.feedback.overall && (
            <Typography variant="body2" sx={{ mb: 1 }}>
              {currentGrade.feedback.overall}
            </Typography>
          )}
          {currentGrade.feedback.instructorNotes && (
            <Alert severity="info" sx={{ mt: 1 }}>
              <AlertTitle>Instructor Notes</AlertTitle>
              {currentGrade.feedback.instructorNotes}
            </Alert>
          )}
        </Paper>
      )}
    </Box>
  )
}

// ============================================================================
// Supporting types exported for sub-components
// ============================================================================

export interface WrongAnswerAnnotation {
  blockId: string
  questionId?: string
  attemptNumber: number
  wrongAnswer?: string
  feedback?: string
  type: 'quiz' | 'meaning-association' | 'custom-answer' | 'answer'
  accuracy?: number
  timestamp: string
}

export default GradedWorkbookViewer
