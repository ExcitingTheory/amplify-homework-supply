/**
 * EasterEggForm — Creation form for Easter Eggs with type-conditional fields.
 *
 * Trigger types (from the Gamification Improvements Plan):
 * - KEYWORD:     Global keypress sequence (e.g. "konami")
 * - SCHEDULE:    Auto-triggers within a date window (start + end ISO dates)
 * - SECRET_LINK: Hidden icon on a unit's workbook page (select target unit)
 * - ACHIEVEMENT: Evaluated after XP/grade events (metric + comparator + value)
 *
 * @module EasterEggForm
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
import Autocomplete from '@mui/material/Autocomplete'
import Typography from '@mui/material/Typography'
import InputAdornment from '@mui/material/InputAdornment'
import AddIcon from '@mui/icons-material/Add'
import { useTranslations } from 'next-intl'
import type { UnitOption } from './SkillForm'

// ============================================================================
// Types
// ============================================================================

export type EasterEggTriggerType = 'KEYWORD' | 'SCHEDULE' | 'SECRET_LINK' | 'ACHIEVEMENT'

export type AchievementMetric = 'accuracy' | 'streak' | 'xp'
export type AchievementComparator = '>=' | '>' | '='

export interface BadgeOption {
  id: string
  title: string
}

export interface EasterEggFormData {
  type: EasterEggTriggerType
  message: string
  xpReward: number
  /** Optional badge to award on discovery */
  badgeId?: string
  /** KEYWORD: the key sequence to type */
  keyword?: string
  /** SCHEDULE: ISO date string for window start */
  scheduleStart?: string
  /** SCHEDULE: ISO date string for window end */
  scheduleEnd?: string
  /** SECRET_LINK: the unit ID where the hidden icon appears */
  secretLinkUnitId?: string
  /** ACHIEVEMENT: e.g. "accuracy>=95" */
  achievementRule?: string
}

export interface EasterEggFormProps {
  /** Called when form is submitted with valid data */
  onSubmit: (data: EasterEggFormData) => void
  /** Available units for SECRET_LINK target */
  availableUnits?: UnitOption[]
  /** Available badges to award on discovery */
  availableBadges?: BadgeOption[]
  /** Disable form during submission */
  submitting?: boolean
}

// ============================================================================
// Constants
// ============================================================================

const TRIGGER_TYPES: EasterEggTriggerType[] = ['KEYWORD', 'SCHEDULE', 'SECRET_LINK', 'ACHIEVEMENT']

const METRICS: AchievementMetric[] = ['accuracy', 'streak', 'xp']
const COMPARATORS: AchievementComparator[] = ['>=', '>', '=']

// ============================================================================
// Component
// ============================================================================

export function EasterEggForm({
  onSubmit,
  availableUnits = [],
  availableBadges = [],
  submitting = false,
}: EasterEggFormProps) {
  const t = useTranslations('components')
  const triggerLabels: Record<EasterEggTriggerType, string> = {
    KEYWORD: t('easterEggForm.triggerKeyword'),
    SCHEDULE: t('easterEggForm.triggerSchedule'),
    SECRET_LINK: t('easterEggForm.triggerSecretLink'),
    ACHIEVEMENT: t('easterEggForm.triggerAchievement'),
  }
  const triggerHelp: Record<EasterEggTriggerType, string> = {
    KEYWORD: t('easterEggForm.helpKeyword'),
    SCHEDULE: t('easterEggForm.helpSchedule'),
    SECRET_LINK: t('easterEggForm.helpSecretLink'),
    ACHIEVEMENT: t('easterEggForm.helpAchievement'),
  }
  const [type, setType] = useState<EasterEggTriggerType>('KEYWORD')
  const [message, setMessage] = useState('')
  const [xpReward, setXpReward] = useState(50)
  const [selectedBadge, setSelectedBadge] = useState<BadgeOption | null>(null)

  // KEYWORD fields
  const [keyword, setKeyword] = useState('')

  // SCHEDULE fields
  const [scheduleStart, setScheduleStart] = useState('')
  const [scheduleEnd, setScheduleEnd] = useState('')

  // SECRET_LINK fields
  const [selectedUnit, setSelectedUnit] = useState<UnitOption | null>(null)

  // ACHIEVEMENT fields
  const [metric, setMetric] = useState<AchievementMetric>('accuracy')
  const [comparator, setComparator] = useState<AchievementComparator>('>=')
  const [threshold, setThreshold] = useState<number | ''>(95)

  const isValid = (() => {
    if (!message.trim()) return false
    switch (type) {
      case 'KEYWORD':
        return keyword.trim().length > 0
      case 'SCHEDULE':
        return scheduleStart.length > 0 && scheduleEnd.length > 0
      case 'SECRET_LINK':
        return selectedUnit !== null
      case 'ACHIEVEMENT':
        return typeof threshold === 'number' && threshold > 0
      default:
        return false
    }
  })()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return

    const data: EasterEggFormData = {
      type,
      message: message.trim(),
      xpReward,
      badgeId: selectedBadge?.id || undefined,
    }

    switch (type) {
      case 'KEYWORD':
        data.keyword = keyword.trim().toLowerCase()
        break
      case 'SCHEDULE':
        data.scheduleStart = scheduleStart
        data.scheduleEnd = scheduleEnd
        break
      case 'SECRET_LINK':
        data.secretLinkUnitId = selectedUnit!.id
        break
      case 'ACHIEVEMENT':
        data.achievementRule = `${metric}${comparator}${threshold}`
        break
    }

    onSubmit(data)

    // Reset form
    setMessage('')
    setXpReward(50)
    setKeyword('')
    setScheduleStart('')
    setScheduleEnd('')
    setSelectedUnit(null)
    setSelectedBadge(null)
    setMetric('accuracy')
    setComparator('>=')
    setThreshold(95)
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Stack spacing={2}>
        {/* Trigger type selector */}
        <FormControl size="small" fullWidth>
          <InputLabel>{t('easterEggForm.triggerType')}</InputLabel>
          <Select
            value={type}
            label={t('easterEggForm.triggerType')}
            onChange={(e) => setType(e.target.value as EasterEggTriggerType)}
            disabled={submitting}
          >
            {TRIGGER_TYPES.map((triggerType) => (
              <MenuItem key={triggerType} value={triggerType}>{triggerLabels[triggerType]}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Help text for selected type */}
        <Typography variant="caption" color="text.secondary" sx={{ mt: -1 }}>
          {triggerHelp[type]}
        </Typography>

        {/* ---- Type-conditional fields ---- */}

        {type === 'KEYWORD' && (
          <TextField
            size="small"
            label={t('easterEggForm.keywordLabel')}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            required
            fullWidth
            placeholder={t('easterEggForm.keywordPlaceholder')}
            helperText={t('easterEggForm.keywordHelper')}
            disabled={submitting}
          />
        )}

        {type === 'SCHEDULE' && (
          <Stack direction="row" spacing={1}>
            <TextField
              size="small"
              label={t('easterEggForm.revealStart')}
              type="datetime-local"
              value={scheduleStart}
              onChange={(e) => setScheduleStart(e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
              sx={{ flex: 1 }}
              disabled={submitting}
            />
            <TextField
              size="small"
              label={t('easterEggForm.revealEnd')}
              type="datetime-local"
              value={scheduleEnd}
              onChange={(e) => setScheduleEnd(e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
              sx={{ flex: 1 }}
              disabled={submitting}
            />
          </Stack>
        )}

        {type === 'SECRET_LINK' && (
          <Autocomplete
            options={availableUnits}
            value={selectedUnit}
            onChange={(_, value) => setSelectedUnit(value)}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(opt, val) => opt.id === val.id}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                label={t('easterEggForm.targetUnit')}
                required
                placeholder={t('easterEggForm.targetUnitPlaceholder')}
              />
            )}
            disabled={submitting}
            noOptionsText={t('easterEggForm.noUnits')}
          />
        )}

        {type === 'ACHIEVEMENT' && (
          <Stack direction="row" spacing={1} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 110 }}>
              <InputLabel>{t('easterEggForm.metric')}</InputLabel>
              <Select
                value={metric}
                label={t('easterEggForm.metric')}
                onChange={(e) => setMetric(e.target.value as AchievementMetric)}
                disabled={submitting}
              >
                <MenuItem value="accuracy">{t('easterEggForm.metricAccuracy')}</MenuItem>
                <MenuItem value="streak">{t('easterEggForm.metricStreak')}</MenuItem>
                <MenuItem value="xp">{t('easterEggForm.metricXp')}</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 70 }}>
              <InputLabel>{t('easterEggForm.operator')}</InputLabel>
              <Select
                value={comparator}
                label={t('easterEggForm.operator')}
                onChange={(e) => setComparator(e.target.value as AchievementComparator)}
                disabled={submitting}
              >
                {COMPARATORS.map((c) => (
                  <MenuItem key={c} value={c}>{c}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              size="small"
              label={t('easterEggForm.value')}
              type="number"
              value={threshold}
              onChange={(e) => {
                const val = e.target.value
                setThreshold(val === '' ? '' : Number(val))
              }}
              required
              InputProps={{
                inputProps: { min: 1 },
                endAdornment: metric === 'accuracy' ? (
                  <InputAdornment position="end">%</InputAdornment>
                ) : undefined,
              }}
              sx={{ flex: 1 }}
              disabled={submitting}
            />
          </Stack>
        )}

        {/* ---- Common fields ---- */}

        <TextField
          size="small"
          label={t('easterEggForm.revealMessage')}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          fullWidth
          multiline
          rows={2}
          placeholder={t('easterEggForm.revealMessagePlaceholder')}
          disabled={submitting}
        />

        <TextField
          size="small"
          label={t('easterEggForm.xpReward')}
          type="number"
          value={xpReward}
          onChange={(e) => setXpReward(Number(e.target.value))}
          InputProps={{
            startAdornment: <InputAdornment position="start">{t('easterEggForm.xpUnit')}</InputAdornment>,
            inputProps: { min: 0 },
          }}
          sx={{ width: 150 }}
          disabled={submitting}
        />

        {availableBadges.length > 0 && (
          <Autocomplete
            options={availableBadges}
            value={selectedBadge}
            onChange={(_, value) => setSelectedBadge(value)}
            getOptionLabel={(option) => option.title}
            isOptionEqualToValue={(opt, val) => opt.id === val.id}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                label={t('easterEggForm.awardBadge')}
                placeholder={t('easterEggForm.awardBadgePlaceholder')}
              />
            )}
            disabled={submitting}
            noOptionsText={t('easterEggForm.noBadges')}
          />
        )}

        <Button
          type="submit"
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          disabled={!isValid || submitting}
        >
          {submitting ? t('easterEggForm.creating') : t('easterEggForm.addEasterEgg')}
        </Button>
      </Stack>
    </Box>
  )
}

export default EasterEggForm
