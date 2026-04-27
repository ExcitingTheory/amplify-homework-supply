/**
 * @fileoverview PracticeDrillConfigPopup — Source selection and configuration
 * popup shown before starting a practice drill. Lets students toggle content
 * sources (vocabulary, questions, text, documents) and set question count.
 * All switches default to ON. At least one source must be enabled.
 */

import React, { useState, useMemo } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  Button,
  LinearProgress,
  FormControl,
  InputLabel,
  Chip,
} from '@mui/material'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import QuizIcon from '@mui/icons-material/Quiz'
import TextSnippetIcon from '@mui/icons-material/TextSnippet'
import DescriptionIcon from '@mui/icons-material/Description'
import GroupsIcon from '@mui/icons-material/Groups'
import { useTranslation } from 'next-i18next'

// ============================================================================
// Types
// ============================================================================

export interface DrillSourceConfig {
  vocabulary: boolean
  questions: boolean
  text: boolean
  documents: boolean
}

export interface CoverageSnapshot {
  vocabulary: { total: number; covered: number }
  questions: { total: number; covered: number }
  text: { total: number; covered: number }
  documents: { total: number; covered: number }
}

export interface DrillConfig {
  sources: DrillSourceConfig
  count: number
  drillType: string
  collaborative?: boolean
  roomCode?: string
  maxParticipants?: number
}

export interface PracticeDrillConfigPopupProps {
  open: boolean
  onClose: () => void
  onStart: (config: DrillConfig) => void
  unitName: string
  vocabularyCount: number
  questionCount: number
  textBlockCount: number
  documentCount: number
  coverageSnapshot?: CoverageSnapshot
  initialSources?: Partial<DrillSourceConfig>
  initialDrillType?: string
  loading?: boolean
}

// ============================================================================
// Source row data
// ============================================================================

interface SourceRowConfig {
  key: keyof DrillSourceConfig
  icon: React.ReactNode
  labelKey: string
  descriptionKey: string
  countSuffix: string
}

const SOURCE_ROWS: SourceRowConfig[] = [
  {
    key: 'vocabulary',
    icon: <MenuBookIcon />,
    labelKey: 'practiceDrill.config.vocabulary',
    descriptionKey: 'practiceDrill.config.vocabularyDesc',
    countSuffix: 'w',
  },
  {
    key: 'questions',
    icon: <QuizIcon />,
    labelKey: 'practiceDrill.config.questions',
    descriptionKey: 'practiceDrill.config.questionsDesc',
    countSuffix: 'q',
  },
  {
    key: 'text',
    icon: <TextSnippetIcon />,
    labelKey: 'practiceDrill.config.text',
    descriptionKey: 'practiceDrill.config.textDesc',
    countSuffix: 'b',
  },
  {
    key: 'documents',
    icon: <DescriptionIcon />,
    labelKey: 'practiceDrill.config.documents',
    descriptionKey: 'practiceDrill.config.documentsDesc',
    countSuffix: 'd',
  },
]

const COUNT_OPTIONS = [5, 10, 15, 20]

// ============================================================================
// Component
// ============================================================================

export default function PracticeDrillConfigPopup({
  open,
  onClose,
  onStart,
  unitName,
  vocabularyCount,
  questionCount,
  textBlockCount,
  documentCount,
  coverageSnapshot,
  initialSources,
  initialDrillType,
  loading = false,
}: PracticeDrillConfigPopupProps) {
  const { t } = useTranslation('components')

  // Source counts map
  const sourceCounts: Record<keyof DrillSourceConfig, number> = useMemo(
    () => ({
      vocabulary: vocabularyCount,
      questions: questionCount,
      text: textBlockCount,
      documents: documentCount,
    }),
    [vocabularyCount, questionCount, textBlockCount, documentCount],
  )

  // Source toggles — default all to ON, disable those with 0 items
  const [sources, setSources] = useState<DrillSourceConfig>(() => ({
    vocabulary: initialSources?.vocabulary ?? vocabularyCount > 0,
    questions: initialSources?.questions ?? questionCount > 0,
    text: initialSources?.text ?? textBlockCount > 0,
    documents: initialSources?.documents ?? documentCount > 0,
  }))

  const [count, setCount] = useState(10)
  const [drillType, setDrillType] = useState(initialDrillType ?? 'mixed')
  const [collaborative, setCollaborative] = useState(false)
  const [maxParticipants, setMaxParticipants] = useState(5)

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setSources({
        vocabulary: initialSources?.vocabulary ?? vocabularyCount > 0,
        questions: initialSources?.questions ?? questionCount > 0,
        text: initialSources?.text ?? textBlockCount > 0,
        documents: initialSources?.documents ?? documentCount > 0,
      })
      setCount(10)
      setDrillType(initialDrillType ?? 'mixed')
      setCollaborative(false)
      setMaxParticipants(5)
    }
  }, [open, vocabularyCount, questionCount, textBlockCount, documentCount, initialSources, initialDrillType])

  const handleToggle = (key: keyof DrillSourceConfig) => {
    if (sourceCounts[key] === 0) return
    setSources((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const atLeastOneEnabled = Object.values(sources).some(Boolean)

  // Coverage calculation
  const coverageTotals = useMemo(() => {
    if (!coverageSnapshot) return null
    let total = 0
    let covered = 0
    for (const key of Object.keys(sources) as (keyof DrillSourceConfig)[]) {
      if (sources[key] && coverageSnapshot[key]) {
        total += coverageSnapshot[key].total
        covered += coverageSnapshot[key].covered
      }
    }
    return { total, covered, percent: total > 0 ? Math.round((covered / total) * 100) : 0 }
  }, [sources, coverageSnapshot])

  const handleStart = () => {
    onStart({ sources, count, drillType, collaborative, maxParticipants: collaborative ? maxParticipants : undefined })
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="practice-drill-config-title"
    >
      <DialogTitle id="practice-drill-config-title">
        {t('practiceDrill.config.title', 'Practice: {{unitName}}', { unitName })}
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('practiceDrill.config.subtitle', 'Choose what to practice:')}
        </Typography>

        {/* Source toggles */}
        {SOURCE_ROWS.map((row) => {
          const itemCount = sourceCounts[row.key]
          const isDisabled = itemCount === 0
          const isEnabled = sources[row.key]
          const coverage = coverageSnapshot?.[row.key]

          return (
            <Box
              key={row.key}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 1.5,
                mb: 1,
                borderRadius: 1,
                border: '1px solid',
                borderColor: isEnabled ? 'primary.main' : 'divider',
                opacity: isDisabled ? 0.5 : 1,
                bgcolor: isEnabled ? 'action.selected' : 'transparent',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                <Box sx={{ color: isEnabled ? 'primary.main' : 'text.secondary' }}>
                  {row.icon}
                </Box>
                <Box>
                  <Typography variant="body1" fontWeight={500}>
                    {t(row.labelKey, row.key)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t(row.descriptionKey, '')}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {coverage && (
                  <Chip
                    size="small"
                    label={`${coverage.covered}/${coverage.total}`}
                    color={coverage.covered === coverage.total ? 'success' : 'default'}
                    variant="outlined"
                  />
                )}
                <Chip
                  size="small"
                  label={`${itemCount}${row.countSuffix}`}
                  variant="outlined"
                />
                <Switch
                  checked={isEnabled}
                  onChange={() => handleToggle(row.key)}
                  disabled={isDisabled}
                  inputProps={{
                    'aria-label': t(row.labelKey, row.key),
                  }}
                />
              </Box>
            </Box>
          )
        })}

        {/* Coverage progress */}
        {coverageTotals && coverageTotals.total > 0 && (
          <Box sx={{ mt: 2, mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {t('practiceDrill.config.coverage', 'Coverage: {{covered}}/{{total}} items practiced ({{percent}}%)', {
                covered: coverageTotals.covered,
                total: coverageTotals.total,
                percent: coverageTotals.percent,
              })}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={coverageTotals.percent}
              sx={{ mt: 0.5, height: 8, borderRadius: 4 }}
            />
          </Box>
        )}

        {/* Question count selector */}
        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="drill-count-label">
              {t('practiceDrill.config.questionCount', 'Number of questions')}
            </InputLabel>
            <Select
              labelId="drill-count-label"
              value={count}
              label={t('practiceDrill.config.questionCount', 'Number of questions')}
              onChange={(e) => setCount(Number(e.target.value))}
            >
              {COUNT_OPTIONS.map((n) => (
                <MenuItem key={n} value={n}>{n}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="drill-type-label">
              {t('practiceDrill.config.drillType', 'Drill type')}
            </InputLabel>
            <Select
              labelId="drill-type-label"
              value={drillType}
              label={t('practiceDrill.config.drillType', 'Drill type')}
              onChange={(e) => setDrillType(e.target.value)}
            >
              <MenuItem value="mixed">{t('practiceDrill.config.mixed', 'Mixed')}</MenuItem>
              <MenuItem value="vocabulary">{t('practiceDrill.config.vocabularyType', 'Vocabulary')}</MenuItem>
              <MenuItem value="comprehension">{t('practiceDrill.config.comprehension', 'Comprehension')}</MenuItem>
              <MenuItem value="review">{t('practiceDrill.config.review', 'Review mistakes')}</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Study Together toggle */}
        <Box
          sx={{
            mt: 2,
            p: 1.5,
            borderRadius: 1,
            border: '1px solid',
            borderColor: collaborative ? 'primary.main' : 'divider',
            bgcolor: collaborative ? 'action.selected' : 'transparent',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <GroupsIcon color={collaborative ? 'primary' : 'action'} />
              <Box>
                <Typography variant="body1" fontWeight={500}>
                  {t('practiceDrill.config.studyTogether', 'Study Together')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('practiceDrill.config.studyTogetherDesc', 'Practice with classmates in real-time. A room code will be created to share.')}
                </Typography>
              </Box>
            </Box>
            <Switch
              checked={collaborative}
              onChange={() => setCollaborative((prev) => !prev)}
              inputProps={{ 'aria-label': t('practiceDrill.config.studyTogether', 'Study Together') }}
            />
          </Box>

          {collaborative && (
            <Box sx={{ mt: 1.5, pl: 5 }}>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel id="max-participants-label">
                  {t('practiceDrill.config.maxParticipants', 'Max participants')}
                </InputLabel>
                <Select
                  labelId="max-participants-label"
                  value={maxParticipants}
                  label={t('practiceDrill.config.maxParticipants', 'Max participants')}
                  onChange={(e) => setMaxParticipants(Number(e.target.value))}
                >
                  {[2, 3, 5, 8, 10].map((n) => (
                    <MenuItem key={n} value={n}>{n}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
        </Box>

        {/* Warning if no sources */}
        {!atLeastOneEnabled && (
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            {t('practiceDrill.config.noSourcesWarning', 'Enable at least one content source to start practicing.')}
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          {t('practiceDrill.config.cancel', 'Cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={handleStart}
          disabled={!atLeastOneEnabled || loading}
        >
          {loading
            ? t('practiceDrill.config.generating', 'Generating...')
            : t('practiceDrill.config.start', 'Start Practice')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
