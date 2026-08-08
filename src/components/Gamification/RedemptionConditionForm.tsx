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
  label: string
  description: string
  fields: Array<'count' | 'percent' | 'hours' | 'period'>
}> = [
  {
    value: 'CONSECUTIVE_ON_TIME',
    label: 'Consecutive On-Time Submissions',
    description: 'Student must submit N assignments on time in a row',
    fields: ['count'],
  },
  {
    value: 'LOGIN_STREAK',
    label: 'Login Streak',
    description: 'Student must log in for N consecutive days',
    fields: ['count'],
  },
  {
    value: 'COMPLETE_ASSIGNMENT',
    label: 'Complete Any Assignment',
    description: 'Student must complete any pending assignment',
    fields: [],
  },
  {
    value: 'ACCURACY_ABOVE',
    label: 'Score Above Threshold',
    description: 'Student must score above N% on any assignment',
    fields: ['percent'],
  },
  {
    value: 'SCORE_ON_TOPIC',
    label: 'Score on Same Topic',
    description: 'Student must score above N% on the same topic/unit',
    fields: ['percent'],
  },
  {
    value: 'ACTIVITY_COUNT',
    label: 'Activity Count in Period',
    description: 'Student must complete N activities within a time period',
    fields: ['count', 'period'],
  },
  {
    value: 'BUILD_STREAK',
    label: 'Build New Streak',
    description: 'Student must build a new streak of N days',
    fields: ['count'],
  },
  {
    value: 'SUBMIT_ANY',
    label: 'Submit Anything',
    description: 'Student just needs to submit any work',
    fields: [],
  },
  {
    value: 'EARN_XP',
    label: 'Earn XP',
    description: 'Student must earn at least N XP',
    fields: ['count'],
  },
  {
    value: 'COMPLETE_DRILLS',
    label: 'Complete Practice Drills',
    description: 'Student must complete N practice drills',
    fields: ['count'],
  },
  {
    value: 'WAIT_PERIOD',
    label: 'Wait Period (Auto-Clear)',
    description: 'Badge auto-clears after N hours',
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
        <InputLabel>Redemption Condition</InputLabel>
        <Select
          value={selectedType}
          onChange={(e) => handleTypeChange(e.target.value)}
          label="Redemption Condition"
        >
          <MenuItem value="">
            <em>None (manual/time-based only)</em>
          </MenuItem>
          {CONDITION_TYPE_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {typeConfig && (
        <Box sx={{ mt: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            {typeConfig.description}
          </Typography>
          <Stack direction="row" spacing={1.5}>
            {typeConfig.fields.includes('count') && (
              <TextField
                size="small"
                type="number"
                label="Count"
                value={value?.count ?? 3}
                onChange={(e) => onChange({ ...value!, count: Math.max(1, Number(e.target.value)) })}
                InputProps={{ inputProps: { min: 1 } }}
                sx={{ width: 100 }}
                disabled={disabled}
                helperText={
                  typeConfig.value === 'EARN_XP' ? 'XP points' :
                  typeConfig.value === 'LOGIN_STREAK' || typeConfig.value === 'BUILD_STREAK' ? 'days' :
                  typeConfig.value === 'COMPLETE_DRILLS' ? 'drills' :
                  typeConfig.value === 'ACTIVITY_COUNT' ? 'activities' :
                  'submissions'
                }
              />
            )}
            {typeConfig.fields.includes('percent') && (
              <TextField
                size="small"
                type="number"
                label="Threshold"
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
                label="Hours"
                value={value?.hours ?? 24}
                onChange={(e) => onChange({ ...value!, hours: Math.max(1, Number(e.target.value)) })}
                InputProps={{
                  endAdornment: <InputAdornment position="end">hrs</InputAdornment>,
                  inputProps: { min: 1 },
                }}
                sx={{ width: 120 }}
                disabled={disabled}
              />
            )}
            {typeConfig.fields.includes('period') && (
              <FormControl size="small" sx={{ minWidth: 100 }} disabled={disabled}>
                <InputLabel>Period</InputLabel>
                <Select
                  value={value?.period || 'day'}
                  onChange={(e) => onChange({ ...value!, period: e.target.value as 'day' | 'week' })}
                  label="Period"
                >
                  <MenuItem value="day">Day</MenuItem>
                  <MenuItem value="week">Week</MenuItem>
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
