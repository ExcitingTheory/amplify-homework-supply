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
import type { UnitOption } from './SkillForm'

// ============================================================================
// Types
// ============================================================================

export type EasterEggTriggerType = 'KEYWORD' | 'SCHEDULE' | 'SECRET_LINK' | 'ACHIEVEMENT'

export type AchievementMetric = 'accuracy' | 'streak' | 'xp'
export type AchievementComparator = '>=' | '>' | '='

export interface EasterEggFormData {
  type: EasterEggTriggerType
  message: string
  xpReward: number
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
  /** Disable form during submission */
  submitting?: boolean
}

// ============================================================================
// Constants
// ============================================================================

const TRIGGER_LABELS: Record<EasterEggTriggerType, string> = {
  KEYWORD: 'Keyword Sequence',
  SCHEDULE: 'Scheduled Window',
  SECRET_LINK: 'Hidden Link on Unit',
  ACHIEVEMENT: 'Achievement Condition',
}

const TRIGGER_HELP: Record<EasterEggTriggerType, string> = {
  KEYWORD: 'Students type a secret key sequence (case-insensitive) to discover this egg.',
  SCHEDULE: 'Automatically reveals to all students within the date window.',
  SECRET_LINK: 'A hidden icon appears on the selected unit\'s workbook page.',
  ACHIEVEMENT: 'Triggers automatically when a student meets the condition after any XP/grade event.',
}

const METRICS: AchievementMetric[] = ['accuracy', 'streak', 'xp']
const COMPARATORS: AchievementComparator[] = ['>=', '>', '=']

// ============================================================================
// Component
// ============================================================================

export function EasterEggForm({
  onSubmit,
  availableUnits = [],
  submitting = false,
}: EasterEggFormProps) {
  const [type, setType] = useState<EasterEggTriggerType>('KEYWORD')
  const [message, setMessage] = useState('')
  const [xpReward, setXpReward] = useState(50)

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
    setMetric('accuracy')
    setComparator('>=')
    setThreshold(95)
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Stack spacing={2}>
        {/* Trigger type selector */}
        <FormControl size="small" fullWidth>
          <InputLabel>Trigger Type</InputLabel>
          <Select
            value={type}
            label="Trigger Type"
            onChange={(e) => setType(e.target.value as EasterEggTriggerType)}
            disabled={submitting}
          >
            {(Object.keys(TRIGGER_LABELS) as EasterEggTriggerType[]).map((t) => (
              <MenuItem key={t} value={t}>{TRIGGER_LABELS[t]}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Help text for selected type */}
        <Typography variant="caption" color="text.secondary" sx={{ mt: -1 }}>
          {TRIGGER_HELP[type]}
        </Typography>

        {/* ---- Type-conditional fields ---- */}

        {type === 'KEYWORD' && (
          <TextField
            size="small"
            label="Keyword / Sequence"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            required
            fullWidth
            placeholder='e.g. "konami" or "xyzzy"'
            helperText="Case-insensitive. Students type this sequence anywhere on the page."
            disabled={submitting}
          />
        )}

        {type === 'SCHEDULE' && (
          <Stack direction="row" spacing={1}>
            <TextField
              size="small"
              label="Reveal Start"
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
              label="Reveal End"
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
                label="Target Unit"
                required
                placeholder="Select unit where icon appears"
              />
            )}
            disabled={submitting}
            noOptionsText="No units available"
          />
        )}

        {type === 'ACHIEVEMENT' && (
          <Stack direction="row" spacing={1} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 110 }}>
              <InputLabel>Metric</InputLabel>
              <Select
                value={metric}
                label="Metric"
                onChange={(e) => setMetric(e.target.value as AchievementMetric)}
                disabled={submitting}
              >
                <MenuItem value="accuracy">Accuracy %</MenuItem>
                <MenuItem value="streak">Streak Days</MenuItem>
                <MenuItem value="xp">Total XP</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 70 }}>
              <InputLabel>Op</InputLabel>
              <Select
                value={comparator}
                label="Op"
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
              label="Value"
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
          label="Reveal Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          fullWidth
          multiline
          rows={2}
          placeholder="You found a secret! 🥚"
          disabled={submitting}
        />

        <TextField
          size="small"
          label="XP Reward"
          type="number"
          value={xpReward}
          onChange={(e) => setXpReward(Number(e.target.value))}
          InputProps={{
            startAdornment: <InputAdornment position="start">XP</InputAdornment>,
            inputProps: { min: 0 },
          }}
          sx={{ width: 150 }}
          disabled={submitting}
        />

        <Button
          type="submit"
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          disabled={!isValid || submitting}
        >
          {submitting ? 'Creating...' : 'Add Easter Egg'}
        </Button>
      </Stack>
    </Box>
  )
}

export default EasterEggForm
