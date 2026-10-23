/**
 * EasterEggEditor — Full editor for creating/editing Easter Eggs.
 *
 * Extends EasterEggForm with additional trigger types, active toggle, and badge association.
 *
 * @module EasterEggEditor
 */

import React, { useState } from 'react'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import Autocomplete from '@mui/material/Autocomplete'
import Typography from '@mui/material/Typography'
import InputAdornment from '@mui/material/InputAdornment'
import Alert from '@mui/material/Alert'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import SaveIcon from '@mui/icons-material/Save'
import { useTranslations } from 'next-intl'

// ============================================================================
// Types
// ============================================================================

export type EasterEggTriggerType =
  | 'KEYWORD'
  | 'SCHEDULE'
  | 'SECRET_LINK'
  | 'ACHIEVEMENT'

export interface BadgeOption {
  id: string
  title: string
}

export interface UnitOption {
  id: string
  name: string
}

export interface EasterEggEditorData {
  triggerType: EasterEggTriggerType
  triggerValue: string
  xpReward: number
  badgeId?: string
  revealMessage: string
  active: boolean
}

export interface EasterEggEditorProps {
  /** Initial data for editing (optional — omit for create mode) */
  initialData?: Partial<EasterEggEditorData>
  /** Available badges for badge association picker */
  availableBadges?: BadgeOption[]
  availableUnits?: UnitOption[]
  /** Called when form is submitted */
  onSubmit: (data: EasterEggEditorData) => void
  /** Disable during submission */
  submitting?: boolean
}

// ============================================================================
// Constants
// ============================================================================

const TRIGGER_TYPES: EasterEggTriggerType[] = [
  'KEYWORD',
  'SCHEDULE',
  'SECRET_LINK',
  'ACHIEVEMENT',
]

// ============================================================================
// Component
// ============================================================================

export function EasterEggEditor({
  initialData,
  availableBadges = [],
  availableUnits = [],
  onSubmit,
  submitting = false,
}: EasterEggEditorProps) {
  const t = useTranslations('components')
  const triggerLabels: Record<EasterEggTriggerType, string> = {
    KEYWORD: t('easterEggEditor.triggerLabelKeyword'),
    SCHEDULE: t('easterEggEditor.triggerLabelSchedule'),
    SECRET_LINK: t('easterEggEditor.triggerLabelSecretLink'),
    ACHIEVEMENT: t('easterEggEditor.triggerLabelAchievement'),
  }
  const triggerHelp: Record<EasterEggTriggerType, string> = {
    KEYWORD: t('easterEggEditor.triggerHelpKeyword'),
    SCHEDULE: t('easterEggEditor.triggerHelpSchedule'),
    SECRET_LINK: t('easterEggEditor.triggerHelpSecretLink'),
    ACHIEVEMENT: t('easterEggEditor.triggerHelpAchievement'),
  }
  const [triggerType, setTriggerType] = useState<EasterEggTriggerType>(
    initialData?.triggerType || 'KEYWORD'
  )
  const [triggerValue, setTriggerValue] = useState(initialData?.triggerValue || '')
  const [xpReward, setXpReward] = useState(initialData?.xpReward ?? 50)
  const [badgeId, setBadgeId] = useState(initialData?.badgeId || '')
  const [revealMessage, setRevealMessage] = useState(initialData?.revealMessage || '')
  const [active, setActive] = useState(initialData?.active ?? true)

  // Schedule-specific state (stored as JSON in triggerValue)
  const [scheduleStart, setScheduleStart] = useState('')
  const [scheduleEnd, setScheduleEnd] = useState('')

  // Achievement-specific
  const [achievementMetric, setAchievementMetric] = useState('accuracy')
  const [achievementComparator, setAchievementComparator] = useState('>=')
  const [achievementValue, setAchievementValue] = useState('95')

  const isValid =
    revealMessage.trim().length > 0 &&
    xpReward > 0 &&
    getTriggerValue().length > 0

  function getTriggerValue(): string {
    switch (triggerType) {
      case 'KEYWORD':
        return triggerValue
      case 'SCHEDULE':
        if (scheduleStart && scheduleEnd) {
          return JSON.stringify({
            start: new Date(scheduleStart).toISOString(),
            end: new Date(scheduleEnd).toISOString(),
          })
        }
        return triggerValue
      case 'SECRET_LINK':
        return triggerValue
      case 'ACHIEVEMENT':
        return `${achievementMetric}${achievementComparator}${achievementValue}`
      default:
        return triggerValue
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    onSubmit({
      triggerType,
      triggerValue: getTriggerValue(),
      xpReward,
      badgeId: badgeId || undefined,
      revealMessage,
      active,
    })
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <Typography variant="h6">
              {initialData ? t('easterEggEditor.editTitle') : t('easterEggEditor.createTitle')}
            </Typography>

            {/* Active toggle */}
            <FormControlLabel
              control={
                <Switch
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                />
              }
              label={t('easterEggEditor.activeLabel')}
            />

            {/* Trigger type selector */}
            <FormControl fullWidth>
              <InputLabel id="trigger-type-label">{t('easterEggEditor.triggerTypeLabel')}</InputLabel>
              <Select
                labelId="trigger-type-label"
                label={t('easterEggEditor.triggerTypeLabel')}
                value={triggerType}
                onChange={(e) => setTriggerType(e.target.value as EasterEggTriggerType)}
              >
                {TRIGGER_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {triggerLabels[type]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Help text */}
            <Alert severity="info" icon={false}>
              {triggerHelp[triggerType]}
            </Alert>

            {/* Dynamic form fields based on trigger type */}
            {triggerType === 'KEYWORD' && (
              <TextField
                label={t('easterEggEditor.keywordSequenceLabel')}
                value={triggerValue}
                onChange={(e) => setTriggerValue(e.target.value)}
                placeholder={t('easterEggEditor.keywordSequencePlaceholder')}
                required
                helperText={t('easterEggEditor.keywordSequenceHelper')}
              />
            )}

            {triggerType === 'SCHEDULE' && (
              <Stack spacing={2}>
                <TextField
                  label={t('easterEggEditor.startDateLabel')}
                  type="datetime-local"
                  value={scheduleStart}
                  onChange={(e) => setScheduleStart(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label={t('easterEggEditor.endDateLabel')}
                  type="datetime-local"
                  value={scheduleEnd}
                  onChange={(e) => setScheduleEnd(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>
            )}

            {triggerType === 'SECRET_LINK' && (
              <Autocomplete
                options={availableUnits}
                getOptionLabel={(opt) => opt.name}
                value={availableUnits.find((u) => u.id === triggerValue) || null}
                onChange={(_, val) => setTriggerValue(val?.id || '')}
                renderInput={(params) => (
                  <TextField {...params} label={t('easterEggEditor.targetUnitLabel')} required />
                )}
              />
            )}

            {triggerType === 'ACHIEVEMENT' && (
              <Stack direction="row" spacing={1} alignItems="center">
                <FormControl sx={{ minWidth: 120 }}>
                  <InputLabel>{t('easterEggEditor.metricLabel')}</InputLabel>
                  <Select
                    label={t('easterEggEditor.metricLabel')}
                    value={achievementMetric}
                    onChange={(e) => setAchievementMetric(e.target.value)}
                  >
                    <MenuItem value="accuracy">{t('easterEggEditor.metricAccuracy')}</MenuItem>
                    <MenuItem value="streak">{t('easterEggEditor.metricStreak')}</MenuItem>
                    <MenuItem value="xp">{t('easterEggEditor.metricXp')}</MenuItem>
                  </Select>
                </FormControl>
                <FormControl sx={{ minWidth: 80 }}>
                  <InputLabel>{t('easterEggEditor.operatorLabel')}</InputLabel>
                  <Select
                    label={t('easterEggEditor.operatorLabel')}
                    value={achievementComparator}
                    onChange={(e) => setAchievementComparator(e.target.value)}
                  >
                    <MenuItem value=">=">&gt;=</MenuItem>
                    <MenuItem value=">">&gt;</MenuItem>
                    <MenuItem value="=">=</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label={t('easterEggEditor.valueLabel')}
                  type="number"
                  value={achievementValue}
                  onChange={(e) => setAchievementValue(e.target.value)}
                  sx={{ width: 100 }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        {achievementMetric === 'accuracy' ? '%' :
                         achievementMetric === 'streak' ? t('easterEggEditor.unitDays') : t('easterEggEditor.unitXp')}
                      </InputAdornment>
                    ),
                  }}
                />
              </Stack>
            )}

            {/* XP Reward */}
            <TextField
              label={t('easterEggEditor.xpRewardLabel')}
              type="number"
              value={xpReward}
              onChange={(e) => setXpReward(Math.max(0, parseInt(e.target.value) || 0))}
              required
              InputProps={{
                startAdornment: <InputAdornment position="start">⚡</InputAdornment>,
              }}
            />

            {/* Badge association picker */}
            <Autocomplete
              options={availableBadges}
              getOptionLabel={(opt) => opt.title}
              value={availableBadges.find((b) => b.id === badgeId) || null}
              onChange={(_, val) => setBadgeId(val?.id || '')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('easterEggEditor.associatedBadgeLabel')}
                  helperText={t('easterEggEditor.associatedBadgeHelper')}
                />
              )}
            />

            {/* Reveal message */}
            <TextField
              label={t('easterEggEditor.revealMessageLabel')}
              value={revealMessage}
              onChange={(e) => setRevealMessage(e.target.value)}
              multiline
              rows={3}
              required
              placeholder={t('easterEggEditor.revealMessagePlaceholder')}
            />

            {/* Submit */}
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={!isValid || submitting}
            >
              {initialData ? t('easterEggEditor.saveButton') : t('easterEggEditor.createButton')}
            </Button>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  )
}
