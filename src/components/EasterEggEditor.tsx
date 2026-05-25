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
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'

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

const TRIGGER_LABELS: Record<EasterEggTriggerType, string> = {
  KEYWORD: 'Keyword Sequence',
  SCHEDULE: 'Scheduled Window',
  SECRET_LINK: 'Hidden Link on Unit',
  ACHIEVEMENT: 'Achievement Condition',
}

const TRIGGER_HELP: Record<EasterEggTriggerType, string> = {
  KEYWORD: 'Students type a secret key sequence (case-insensitive) to discover this egg.',
  SCHEDULE: 'Automatically reveals to all students between start and end dates (ISO format: YYYY-MM-DDTHH:mm).',
  SECRET_LINK: 'A hidden icon appears on the selected unit\'s workbook page.',
  ACHIEVEMENT: 'Triggers when a student meets a metric condition (e.g., accuracy>=95).'
}

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
  const [triggerType, setTriggerType] = useState<EasterEggTriggerType>(
    initialData?.triggerType || 'KEYWORD'
  )
  const [triggerValue, setTriggerValue] = useState(initialData?.triggerValue || '')
  const [xpReward, setXpReward] = useState(initialData?.xpReward ?? 50)
  const [badgeId, setBadgeId] = useState(initialData?.badgeId || '')
  const [revealMessage, setRevealMessage] = useState(initialData?.revealMessage || '')
  const [active, setActive] = useState(initialData?.active ?? true)

  // Schedule-specific state (stored as JSON in triggerValue)
  const [scheduleStart, setScheduleStart] = useState<Date | null>(null)
  const [scheduleEnd, setScheduleEnd] = useState<Date | null>(null)

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
            start: scheduleStart.toISOString(),
            end: scheduleEnd.toISOString(),
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
              {initialData ? 'Edit Easter Egg' : 'Create Easter Egg'}
            </Typography>

            {/* Active toggle */}
            <FormControlLabel
              control={
                <Switch
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                />
              }
              label="Active"
            />

            {/* Trigger type selector */}
            <FormControl fullWidth>
              <InputLabel id="trigger-type-label">Trigger Type</InputLabel>
              <Select
                labelId="trigger-type-label"
                label="Trigger Type"
                value={triggerType}
                onChange={(e) => setTriggerType(e.target.value as EasterEggTriggerType)}
              >
                {Object.entries(TRIGGER_LABELS).map(([key, label]) => (
                  <MenuItem key={key} value={key}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Help text */}
            <Alert severity="info" icon={false}>
              {TRIGGER_HELP[triggerType]}
            </Alert>

            {/* Dynamic form fields based on trigger type */}
            {triggerType === 'KEYWORD' && (
              <TextField
                label="Keyword Sequence"
                value={triggerValue}
                onChange={(e) => setTriggerValue(e.target.value)}
                placeholder="e.g., konami, secret123"
                required
                helperText="Case-insensitive key sequence students must type"
              />
            )}

            {triggerType === 'SCHEDULE' && (
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Stack spacing={2}>
                  <DateTimePicker
                    label="Start Date"
                    value={scheduleStart}
                    onChange={(val) => setScheduleStart(val)}
                  />
                  <DateTimePicker
                    label="End Date"
                    value={scheduleEnd}
                    onChange={(val) => setScheduleEnd(val)}
                  />
                </Stack>
              </LocalizationProvider>
            )}

            {triggerType === 'SECRET_LINK' && (
              <Autocomplete
                options={availableUnits}
                getOptionLabel={(opt) => opt.name}
                value={availableUnits.find((u) => u.id === triggerValue) || null}
                onChange={(_, val) => setTriggerValue(val?.id || '')}
                renderInput={(params) => (
                  <TextField {...params} label="Target Unit" required />
                )}
              />
            )}

            {triggerType === 'ACHIEVEMENT' && (
              <Stack direction="row" spacing={1} alignItems="center">
                <FormControl sx={{ minWidth: 120 }}>
                  <InputLabel>Metric</InputLabel>
                  <Select
                    label="Metric"
                    value={achievementMetric}
                    onChange={(e) => setAchievementMetric(e.target.value)}
                  >
                    <MenuItem value="accuracy">Accuracy</MenuItem>
                    <MenuItem value="streak">Streak</MenuItem>
                    <MenuItem value="xp">XP</MenuItem>
                  </Select>
                </FormControl>
                <FormControl sx={{ minWidth: 80 }}>
                  <InputLabel>Op</InputLabel>
                  <Select
                    label="Op"
                    value={achievementComparator}
                    onChange={(e) => setAchievementComparator(e.target.value)}
                  >
                    <MenuItem value=">=">&gt;=</MenuItem>
                    <MenuItem value=">">&gt;</MenuItem>
                    <MenuItem value="=">=</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="Value"
                  type="number"
                  value={achievementValue}
                  onChange={(e) => setAchievementValue(e.target.value)}
                  sx={{ width: 100 }}
                />
              </Stack>
            )}

            {/* XP Reward */}
            <TextField
              label="XP Reward"
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
                  label="Associated Badge (optional)"
                  helperText="Award this badge when the egg is discovered"
                />
              )}
            />

            {/* Reveal message */}
            <TextField
              label="Reveal Message"
              value={revealMessage}
              onChange={(e) => setRevealMessage(e.target.value)}
              multiline
              rows={3}
              required
              placeholder="Message shown to the student when they discover the egg"
            />

            {/* Submit */}
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={!isValid || submitting}
            >
              {initialData ? 'Save Easter Egg' : 'Create Easter Egg'}
            </Button>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  )
}
