/**
 * @fileoverview PracticeDrillWorkbook — Stripped-down Lexical workbook for
 * practice drills. Renders AI-generated blocks with audio play buttons and
 * pronunciation record buttons. No editing, no toolbar, no presence.
 */

import React, { useMemo } from 'react'
import { Box, Typography, Divider, Chip, Tooltip } from '@mui/material'
import GroupsIcon from '@mui/icons-material/Groups'
import { useTranslation } from 'next-i18next'
import DrillAudioButton from './DrillAudioButton'
import DrillRecordButton from './DrillRecordButton'
import PracticeDrillDocRef from './PracticeDrillDocRef'
import type { VerifyResult } from './DrillRecordButton'

// ============================================================================
// Types
// ============================================================================

interface PracticeDrillBlock {
  type: string
  instruction: string
  sourceItemId: string
  sourceType: string
  expectedAnswer?: string
  choices?: { choice: string; correct: boolean }[]
  pairs?: { term: string; definition: string }[]
  hint?: string
  audio?: {
    instruction?: string
    expectedAnswer?: string
    choices?: Record<string, string>
    pairs?: Record<string, string>
    hint?: string
  }
  pronunciation?: {
    enabled: boolean
    targetText: string
    targetLanguage?: string
    maxAttempts?: number
  }
  documentRef?: { filename: string; page: number | string }
}

interface BlockAnswer {
  complete: boolean
  accuracy: number
  userAnswer?: string
}

export interface PracticeDrillWorkbookProps {
  blocks: PracticeDrillBlock[]
  answers: Record<string, BlockAnswer>
  sessionId: string
  onSubmitAnswer: (blockId: string, answer: BlockAnswer) => void
  onPronunciationResult?: (blockId: string, result: VerifyResult) => void
  /** Whether this is a collaborative session */
  collaborative?: boolean
  /** Group stats (when collaborative) */
  groupStats?: import('../../yjs/PracticeCollaborationProvider').GroupStats
  /** Get anonymized group accuracy for a specific block */
  getBlockGroupAccuracy?: (blockId: string) => number | undefined
}

// ============================================================================
// Block Renderers
// ============================================================================

function QuizBlock({
  block,
  blockId,
  answer,
  sessionId,
  onSubmit,
  onPronunciationResult,
}: {
  block: PracticeDrillBlock
  blockId: string
  answer?: BlockAnswer
  sessionId: string
  onSubmit: (blockId: string, answer: BlockAnswer) => void
  onPronunciationResult?: (blockId: string, result: VerifyResult) => void
}) {
  const { t } = useTranslation('components')
  const [selected, setSelected] = React.useState<number | null>(null)
  const submitted = answer?.complete

  const handleSelect = (index: number) => {
    if (submitted) return
    setSelected(index)
    const choice = block.choices?.[index]
    if (choice) {
      onSubmit(blockId, {
        complete: true,
        accuracy: choice.correct ? 100 : 0,
        userAnswer: choice.choice,
      })
    }
  }

  return (
    <Box sx={{ mb: 3 }}>
      {block.documentRef && (
        <PracticeDrillDocRef filename={block.documentRef.filename} page={block.documentRef.page} />
      )}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
        <Typography variant="body1" fontWeight={500}>
          {block.instruction}
        </Typography>
        {block.audio?.instruction && (
          <DrillAudioButton audio={block.audio.instruction} label={t('practiceDrill.audio.playQuestion', 'Play question')} />
        )}
        {block.pronunciation?.enabled && (
          <DrillRecordButton
            targetText={block.pronunciation.targetText}
            targetLanguage={block.pronunciation.targetLanguage}
            blockId={`${blockId}-pron`}
            sessionId={sessionId}
            onResult={(result) => onPronunciationResult?.(blockId, result)}
          />
        )}
      </Box>
      {block.choices?.map((choice, i) => {
        const isSelected = selected === i
        const isCorrect = choice.correct
        const showResult = submitted

        return (
          <Box
            key={i}
            onClick={() => handleSelect(i)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              p: 1.5,
              mb: 0.5,
              borderRadius: 1,
              border: '1px solid',
              borderColor: showResult
                ? isCorrect ? 'success.main' : isSelected ? 'error.main' : 'divider'
                : isSelected ? 'primary.main' : 'divider',
              bgcolor: showResult
                ? isCorrect ? 'success.lighter' : isSelected ? 'error.lighter' : 'transparent'
                : isSelected ? 'action.selected' : 'transparent',
              cursor: submitted ? 'default' : 'pointer',
              '&:hover': submitted ? {} : { bgcolor: 'action.hover' },
            }}
          >
            <Typography variant="body2" sx={{ flex: 1 }}>
              {choice.choice}
            </Typography>
            {block.audio?.choices?.[choice.choice] && (
              <DrillAudioButton
                audio={block.audio.choices[choice.choice]}
                label={t('practiceDrill.audio.playChoice', 'Play choice')}
              />
            )}
          </Box>
        )
      })}
    </Box>
  )
}

function AnswerBlock({
  block,
  blockId,
  answer,
  sessionId,
  onSubmit,
  onPronunciationResult,
}: {
  block: PracticeDrillBlock
  blockId: string
  answer?: BlockAnswer
  sessionId: string
  onSubmit: (blockId: string, answer: BlockAnswer) => void
  onPronunciationResult?: (blockId: string, result: VerifyResult) => void
}) {
  const { t } = useTranslation('components')
  const [inputValue, setInputValue] = React.useState('')
  const submitted = answer?.complete

  const handleSubmit = async () => {
    if (!inputValue.trim()) return

    // Simple comparison for now — can be enhanced with verifyShortAnswer
    const expected = (block.expectedAnswer || '').toLowerCase().trim()
    const userAnswer = inputValue.toLowerCase().trim()
    const correct = expected === userAnswer || expected.includes(userAnswer) || userAnswer.includes(expected)

    onSubmit(blockId, {
      complete: true,
      accuracy: correct ? 100 : 0,
      userAnswer: inputValue,
    })
  }

  return (
    <Box sx={{ mb: 3 }}>
      {block.documentRef && (
        <PracticeDrillDocRef filename={block.documentRef.filename} page={block.documentRef.page} />
      )}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
        <Typography variant="body1" fontWeight={500}>
          {block.instruction}
        </Typography>
        {block.audio?.instruction && (
          <DrillAudioButton audio={block.audio.instruction} label={t('practiceDrill.audio.playQuestion', 'Play question')} />
        )}
        {block.pronunciation?.enabled && (
          <DrillRecordButton
            targetText={block.pronunciation.targetText}
            targetLanguage={block.pronunciation.targetLanguage}
            blockId={`${blockId}-pron`}
            sessionId={sessionId}
            onResult={(result) => onPronunciationResult?.(blockId, result)}
          />
        )}
      </Box>

      {block.hint && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          {t('practiceDrill.hint', 'Hint')}: {block.hint}
          {block.audio?.hint && (
            <DrillAudioButton audio={block.audio.hint} label="Play hint" size="small" />
          )}
        </Typography>
      )}

      <Box sx={{ display: 'flex', gap: 1 }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          disabled={submitted}
          placeholder={t('practiceDrill.answerPlaceholder', 'Type your answer...')}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 4,
            border: '1px solid',
            borderColor: submitted
              ? answer?.accuracy === 100 ? '#4caf50' : '#f44336'
              : '#ccc',
            fontSize: 14,
          }}
        />
      </Box>

      {submitted && block.expectedAnswer && (
        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="caption" color={answer?.accuracy === 100 ? 'success.main' : 'error.main'}>
            {t('practiceDrill.expectedAnswer', 'Expected')}: {block.expectedAnswer}
          </Typography>
          {block.audio?.expectedAnswer && (
            <DrillAudioButton audio={block.audio.expectedAnswer} label="Play answer" size="small" />
          )}
        </Box>
      )}
    </Box>
  )
}

function MeaningAssociationBlock({
  block,
  blockId,
  answer,
  sessionId,
  onSubmit,
  onPronunciationResult,
}: {
  block: PracticeDrillBlock
  blockId: string
  answer?: BlockAnswer
  sessionId: string
  onSubmit: (blockId: string, answer: BlockAnswer) => void
  onPronunciationResult?: (blockId: string, result: VerifyResult) => void
}) {
  const { t } = useTranslation('components')
  const pairs = block.pairs || []
  const [matches, setMatches] = React.useState<Record<string, string>>({})
  const [selectedTerm, setSelectedTerm] = React.useState<string | null>(null)
  const submitted = answer?.complete

  // Shuffle definitions for the matching exercise
  const shuffledDefs = useMemo(
    () => pairs.map((p) => p.definition).sort(() => Math.random() - 0.5),
    [pairs],
  )

  const handleDefClick = (def: string) => {
    if (!selectedTerm || submitted) return
    const newMatches = { ...matches, [selectedTerm]: def }
    setMatches(newMatches)
    setSelectedTerm(null)

    // Check if all pairs are matched
    if (Object.keys(newMatches).length === pairs.length) {
      const correct = pairs.filter((p) => newMatches[p.term] === p.definition).length
      onSubmit(blockId, {
        complete: true,
        accuracy: Math.round((correct / pairs.length) * 100),
        userAnswer: JSON.stringify(newMatches),
      })
    }
  }

  return (
    <Box sx={{ mb: 3 }}>
      {block.documentRef && (
        <PracticeDrillDocRef filename={block.documentRef.filename} page={block.documentRef.page} />
      )}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
        <Typography variant="body1" fontWeight={500}>
          {block.instruction}
        </Typography>
        {block.audio?.instruction && (
          <DrillAudioButton audio={block.audio.instruction} label="Play instruction" />
        )}
      </Box>

      <Box sx={{ display: 'flex', gap: 2 }}>
        {/* Terms column */}
        <Box sx={{ flex: 1 }}>
          {pairs.map((pair) => (
            <Box
              key={pair.term}
              onClick={() => !submitted && setSelectedTerm(pair.term)}
              sx={{
                p: 1,
                mb: 0.5,
                borderRadius: 1,
                border: '1px solid',
                borderColor: selectedTerm === pair.term ? 'primary.main' : 'divider',
                bgcolor: selectedTerm === pair.term ? 'action.selected' : 'transparent',
                cursor: submitted ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <Typography variant="body2">{pair.term}</Typography>
              {block.audio?.pairs?.[pair.term] && (
                <DrillAudioButton audio={block.audio.pairs[pair.term]} label="Play term" />
              )}
              {block.pronunciation?.enabled && (
                <DrillRecordButton
                  targetText={pair.term}
                  targetLanguage={block.pronunciation.targetLanguage}
                  blockId={`${blockId}-${pair.term}`}
                  sessionId={sessionId}
                  onResult={(result) => onPronunciationResult?.(blockId, result)}
                />
              )}
            </Box>
          ))}
        </Box>

        {/* Definitions column */}
        <Box sx={{ flex: 1 }}>
          {shuffledDefs.map((def) => (
            <Box
              key={def}
              onClick={() => handleDefClick(def)}
              sx={{
                p: 1,
                mb: 0.5,
                borderRadius: 1,
                border: '1px solid',
                borderColor: Object.values(matches).includes(def) ? 'success.main' : 'divider',
                bgcolor: Object.values(matches).includes(def) ? 'success.lighter' : 'transparent',
                cursor: submitted ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <Typography variant="body2">{def}</Typography>
              {block.audio?.pairs?.[def] && (
                <DrillAudioButton audio={block.audio.pairs[def]} label="Play definition" />
              )}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export default function PracticeDrillWorkbook({
  blocks,
  answers,
  sessionId,
  onSubmitAnswer,
  onPronunciationResult,
  collaborative = false,
  groupStats,
  getBlockGroupAccuracy,
}: PracticeDrillWorkbookProps) {
  const { t } = useTranslation('components')

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
    <Box sx={{ p: 2 }}>
      {blocks.map((block, index) => {
        const blockId = block.sourceItemId || `block-${index}`
        const answer = answers[blockId]
        const commonProps = {
          block,
          blockId,
          answer,
          sessionId,
          onSubmit: onSubmitAnswer,
          onPronunciationResult,
        }

        return (
          <React.Fragment key={blockId}>
            {index > 0 && <Divider sx={{ my: 2 }} />}

            {/* Collaborative group accuracy indicator per block */}
            {collaborative && answer?.complete && getBlockGroupAccuracy && (() => {
              const groupAccuracy = getBlockGroupAccuracy(blockId)
              return groupAccuracy !== undefined ? (
                <Tooltip title={t('practiceDrill.collab.blockGroupAccuracy', 'Average group accuracy for this question')}>
                  <Chip
                    icon={<GroupsIcon />}
                    size="small"
                    label={t('practiceDrill.collab.groupScore', 'Group: {{accuracy}}%', {
                      accuracy: Math.round(groupAccuracy),
                    })}
                    variant="outlined"
                    color={groupAccuracy >= 80 ? 'success' : groupAccuracy >= 50 ? 'warning' : 'default'}
                    sx={{ mb: 1 }}
                  />
                </Tooltip>
              ) : null
            })()}

            {block.type === 'quiz' && <QuizBlock {...commonProps} />}
            {block.type === 'answer' && <AnswerBlock {...commonProps} />}
            {block.type === 'meaning-association' && <MeaningAssociationBlock {...commonProps} />}
            {block.type === 'custom-answer' && <AnswerBlock {...commonProps} />}
          </React.Fragment>
        )
      })}
    </Box>
  )
}
