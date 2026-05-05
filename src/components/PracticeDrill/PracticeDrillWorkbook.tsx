/**
 * @fileoverview PracticeDrillWorkbook — Renders AI-generated drill blocks
 * using the existing Lexical Workbook plugins (QuizPlugin, AnswerPlugin,
 * MeaningAssociationPlugin, CustomAnswerPlugin) instead of custom renderers.
 *
 * Uses buildDrillEditorState to produce Lexical JSON and DrillGradeAdapter
 * to bridge the grade/saveGrade interface for the existing graded components.
 */

import React, { useMemo, useContext, useCallback } from 'react'
import { Box, Typography, Chip, Tooltip } from '@mui/material'
import GroupsIcon from '@mui/icons-material/Groups'
import { useTranslation } from 'next-i18next'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin'
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'

// Existing workbook plugins — the graded block renderers
import QuizPlugin from '../Editor3/plugins/QuizPlugin'
import AnswerPlugin from '../Editor3/plugins/AnswerPlugin'
import MeaningAssociationPlugin from '../Editor3/plugins/MeaningAssociationPlugin'
import CustomAnswerPlugin from '../Editor3/plugins/CustomAnswerPlugin'
import WordBlockPlugin from '../Editor3/plugins/WordBlockPlugin'
import ImagesPlugin from '../Editor3/plugins/ImagesPlugin'
import LanguageEditorTheme from '../Editor3/config/LanguageEditorTheme'
import { EditorNodes } from '../Editor3/editorConfig'
import { DndWrapper } from '../MeaningAssociationExercise/DndWrapper'
import { AudioPlayerProvider } from '../Editor3/context/AudioPlayerContext'

// Drill-specific
import DrillStatePlugin from './DrillStatePlugin'
import DrillGradeAdapter from './DrillGradeAdapter'
import type { DrillStats } from './DrillGradeAdapter'
import { buildDrillEditorState } from './buildDrillEditorState'
import type { PracticeDrillBlock } from './buildDrillEditorState'
import DictionaryContext from '../../context/dictionaryContext'

// ============================================================================
// Types
// ============================================================================

export interface PracticeDrillWorkbookProps {
  blocks: PracticeDrillBlock[]
  sessionId: string
  /** Called when graded block state changes */
  onStatsChange?: (stats: DrillStats) => void
  /** Whether this is a collaborative session */
  collaborative?: boolean
  /** Group stats (when collaborative) */
  groupStats?: import('../../yjs/PracticeCollaborationProvider').GroupStats
}

// ============================================================================
// Error handler
// ============================================================================

function onError(error: Error) {
  console.error('[PracticeDrillWorkbook] Lexical error:', error)
}

// ============================================================================
// Main Component
// ============================================================================

export default function PracticeDrillWorkbook({
  blocks,
  sessionId,
  onStatsChange,
  collaborative = false,
  groupStats,
}: PracticeDrillWorkbookProps) {
  const { t } = useTranslation('components')
  const { wordMapId: dictionary } = useContext(DictionaryContext)

  // Build Lexical editor state from drill blocks
  const editorStateJSON = useMemo(
    () => (blocks.length > 0 ? buildDrillEditorState(blocks, dictionary) : null),
    [blocks, dictionary],
  )

  // Count graded blocks for the adapter
  const gradedBlockCount = useMemo(
    () => blocks.filter((b) => ['quiz', 'answer', 'meaning-association', 'custom-answer'].includes(b.type)).length,
    [blocks],
  )

  const handleGradeChange = useCallback(
    (_gradeData: Record<string, any>, stats: DrillStats) => {
      onStatsChange?.(stats)
    },
    [onStatsChange],
  )

  // Memoize config to prevent recreation
  const initialConfig = useMemo(
    () => ({
      namespace: 'PracticeDrillWorkbook',
      theme: LanguageEditorTheme,
      onError,
      editable: false,
      editorState: null,
      nodes: [...EditorNodes],
    }),
    [],
  )

  if (blocks.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">
          {t('practiceDrill.workbook.noBlocks', 'No practice blocks generated.')}
        </Typography>
      </Box>
    )
  }

  return (
    <DrillGradeAdapter
      sessionId={sessionId}
      blocks={blocks}
      onGradeChange={handleGradeChange}
    >
      <DndWrapper>
        <AudioPlayerProvider>
          <LexicalComposer initialConfig={initialConfig}>
            {/* Load drill content into the editor */}
            <DrillStatePlugin editorStateJSON={editorStateJSON} />

            {/* Existing workbook plugins render the graded blocks */}
            <CheckListPlugin />
            <HorizontalRulePlugin />
            <ListPlugin />
            <WordBlockPlugin />
            <QuizPlugin />
            <AnswerPlugin />
            <MeaningAssociationPlugin />
            <CustomAnswerPlugin />
            <ImagesPlugin captionsEnabled={false} />

            {/* Collaborative header */}
            {collaborative && groupStats && (
              <Box sx={{ px: 2, pt: 1 }}>
                <Tooltip title={t('practiceDrill.collab.groupProgress', 'Group practice progress')}>
                  <Chip
                    icon={<GroupsIcon />}
                    size="small"
                    label={t('practiceDrill.collab.participants', '{{count}} participants', {
                      count: groupStats.totalParticipants,
                    })}
                    variant="outlined"
                    sx={{ mb: 1 }}
                  />
                </Tooltip>
              </Box>
            )}

            <RichTextPlugin
              contentEditable={
                <Box sx={{ p: 2 }}>
                  <ContentEditable
                    data-lexical-editor="true"
                    aria-label={t('practiceDrill.workbook.label', 'Practice drill content')}
                    style={{
                      width: '100%',
                      minHeight: '200px',
                      outline: 'none',
                    }}
                  />
                </Box>
              }
              placeholder={null}
              ErrorBoundary={LexicalErrorBoundary}
            />
          </LexicalComposer>
        </AudioPlayerProvider>
      </DndWrapper>
    </DrillGradeAdapter>
  )
}
