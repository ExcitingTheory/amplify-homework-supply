/**
 * RedemptionConditionForm — Structured form for configuring anti-badge redemption conditions.
 *
 * Replaces freeform text hints with a switch/dropdown + numeric input that maps
 * to machine-evaluatable conditions. The Lambda automatically clears the anti-badge
 * when the condition is met.
 *
 * @module RedemptionConditionForm
 */

import React from 'react'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Stack from '@mui/material/Stack'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Typography from '@mui/material/Typography'
import InputAdornment from '@mui/material/InputAdornment'
import { useTranslations } from 'next-intl'
import type { RedemptionCondition, RedemptionConditionType } from './antiBadgeRegistry'

// ============================================================================
// Types
// ============================================================================

export interface RedemptionConditionFormProps {
  /** Current condition value */
  value: RedemptionCondition | null | undefined
  /** Called when condition changes */
  onChange: (condition: RedemptionCondition | null) => void
  /** Disable form inputs */
  disabled?: boolean
}

// ============================================================================
// Condition type metadata
// ============================================================================

const CONDITION_TYPE_OPTIONS: Array<{
  value: RedemptionConditionType
  fields: Array<'count' | 'percent' | 'hours' | 'period'>
}> = [
  {
    value: 'CONSECUTIVE_ON_TIME',
    fields: ['count'],
  },
  {
    value: 'LOGIN_STREAK',
    fields: ['count'],
  },
  {
    value: 'COMPLETE_ASSIGNMENT',
    fields: [],
  },
  {
    value: 'ACCURACY_ABOVE',
    fields: ['percent'],
  },
  {
    value: 'SCORE_ON_TOPIC',
    fields: ['percent'],
  },
  {
    value: 'ACTIVITY_COUNT',
    fields: ['count', 'period'],
  },
  {
    value: 'BUILD_STREAK',
    fields: ['count'],
  },
  {
    value: 'SUBMIT_ANY',
    fields: [],
  },
  {
    value: 'EARN_XP',
    fields: ['count'],
  },
  {
    value: 'COMPLETE_DRILLS',
    fields: ['count'],
  },
  {
    value: 'WAIT_PERIOD',
    fields: ['hours'],
  },
]

// ============================================================================
// Component
// ============================================================================

export function RedemptionConditionForm({
  value,
  onChange,
  disabled = false,
}: RedemptionConditionFormProps) {
  const t = useTranslations('components')
  const conditionText: Record<
    RedemptionConditionType,
    { label: string; description: string }
  > = {
    CONSECUTIVE_ON_TIME: {
      label: t('redemptionConditionForm.consecutiveOnTimeLabel'),
      description: t('redemptionConditionForm.consecutiveOnTimeDescription'),
    },
    LOGIN_STREAK: {
      label: t('redemptionConditionForm.loginStreakLabel'),
      description: t('redemptionConditionForm.loginStreakDescription'),
    },
    COMPLETE_ASSIGNMENT: {
      label: t('redemptionConditionForm.completeAssignmentLabel'),
      description: t('redemptionConditionForm.completeAssignmentDescription'),
    },
    ACCURACY_ABOVE: {
      label: t('redemptionConditionForm.accuracyAboveLabel'),
      description: t('redemptionConditionForm.accuracyAboveDescription'),
    },
    SCORE_ON_TOPIC: {
      label: t('redemptionConditionForm.scoreOnTopicLabel'),
      description: t('redemptionConditionForm.scoreOnTopicDescription'),
    },
    ACTIVITY_COUNT: {
      label: t('redemptionConditionForm.activityCountLabel'),
      description: t('redemptionConditionForm.activityCountDescription'),
    },
    BUILD_STREAK: {
      label: t('redemptionConditionForm.buildStreakLabel'),
      description: t('redemptionConditionForm.buildStreakDescription'),
    },
    SUBMIT_ANY: {
      label: t('redemptionConditionForm.submitAnyLabel'),
      description: t('redemptionConditionForm.submitAnyDescription'),
    },
    EARN_XP: {
      label: t('redemptionConditionForm.earnXpLabel'),
      description: t('redemptionConditionForm.earnXpDescription'),
    },
    COMPLETE_DRILLS: {
      label: t('redemptionConditionForm.completeDrillsLabel'),
      description: t('redemptionConditionForm.completeDrillsDescription'),
    },
    WAIT_PERIOD: {
      label: t('redemptionConditionForm.waitPeriodLabel'),
      description: t('redemptionConditionForm.waitPeriodDescription'),
    },
  }
  const selectedType = value?.type || ''
  const typeConfig = CONDITION_TYPE_OPTIONS.find((o) => o.value === selectedType)

  const handleTypeChange = (newType: string) => {
    if (!newType) {
      onChange(null)
      return
    }
    const config = CONDITION_TYPE_OPTIONS.find((o) => o.value === newType)
    if (!config) return

    const newCondition: RedemptionCondition = { type: newType as RedemptionConditionType }
    // Set sensible defaults
    if (config.fields.includes('count')) newCondition.count = 3
    if (config.fields.includes('percent')) newCondition.percent = 70
    if (config.fields.includes('hours')) newCondition.hours = 24
    if (config.fields.includes('period')) newCondition.period = 'day'
    onChange(newCondition)
  }

  return (
    <Box>
      <FormControl fullWidth size="small" disabled={disabled}>
        <InputLabel>{t('redemptionConditionForm.conditionLabel')}</InputLabel>
        <Select
          value={selectedType}
          onChange={(e) => handleTypeChange(e.target.value)}
          label={t('redemptionConditionForm.conditionLabel')}
        >
          <MenuItem value="">
            <em>{t('redemptionConditionForm.none')}</em>
          </MenuItem>
          {CONDITION_TYPE_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {conditionText[opt.value].label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {typeConfig && (
        <Box sx={{ mt: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            {conditionText[typeConfig.value].description}
          </Typography>
          <Stack direction="row" spacing={1.5}>
            {typeConfig.fields.includes('count') && (
              <TextField
                size="small"
                type="number"
                label={t('redemptionConditionForm.count')}
                value={value?.count ?? 3}
                onChange={(e) => onChange({ ...value!, count: Math.max(1, Number(e.target.value)) })}
                InputProps={{ inputProps: { min: 1 } }}
                sx={{ width: 100 }}
                disabled={disabled}
                helperText={
                  typeConfig.value === 'EARN_XP' ? t('redemptionConditionForm.unitXpPoints') :
                  typeConfig.value === 'LOGIN_STREAK' || typeConfig.value === 'BUILD_STREAK' ? t('redemptionConditionForm.unitDays') :
                  typeConfig.value === 'COMPLETE_DRILLS' ? t('redemptionConditionForm.unitDrills') :
                  typeConfig.value === 'ACTIVITY_COUNT' ? t('redemptionConditionForm.unitActivities') :
                  t('redemptionConditionForm.unitSubmissions')
                }
              />
            )}
            {typeConfig.fields.includes('percent') && (
              <TextField
                size="small"
                type="number"
                label={t('redemptionConditionForm.threshold')}
                value={value?.percent ?? 70}
                onChange={(e) => onChange({ ...value!, percent: Math.min(100, Math.max(1, Number(e.target.value))) })}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  inputProps: { min: 1, max: 100 },
                }}
                sx={{ width: 120 }}
                disabled={disabled}
              />
            )}
            {typeConfig.fields.includes('hours') && (
              <TextField
                size="small"
                type="number"
                label={t('redemptionConditionForm.hours')}
                value={value?.hours ?? 24}
                onChange={(e) => onChange({ ...value!, hours: Math.max(1, Number(e.target.value)) })}
                InputProps={{
                  endAdornment: <InputAdornment position="end">{t('redemptionConditionForm.hoursUnit')}</InputAdornment>,
                  inputProps: { min: 1 },
                }}
                sx={{ width: 120 }}
                disabled={disabled}
              />
            )}
            {typeConfig.fields.includes('period') && (
              <FormControl size="small" sx={{ minWidth: 100 }} disabled={disabled}>
                <InputLabel>{t('redemptionConditionForm.period')}</InputLabel>
                <Select
                  value={value?.period || 'day'}
                  onChange={(e) => onChange({ ...value!, period: e.target.value as 'day' | 'week' })}
                  label={t('redemptionConditionForm.period')}
                >
                  <MenuItem value="day">{t('redemptionConditionForm.periodDay')}</MenuItem>
                  <MenuItem value="week">{t('redemptionConditionForm.periodWeek')}</MenuItem>
                </Select>
              </FormControl>
            )}
          </Stack>
        </Box>
      )}
    </Box>
  )
}

export default RedemptionConditionForm
