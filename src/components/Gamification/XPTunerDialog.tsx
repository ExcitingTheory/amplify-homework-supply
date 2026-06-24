/**
 * XPTunerDialog — Instructor dialog for tuning XP multipliers per interaction type
 * for a specific section. Allows scaling each XP reward category independently.
 *
 * @module XPTunerDialog
 */

import React, { useState, useEffect, useMemo } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Slider from '@mui/material/Slider'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import RestoreIcon from '@mui/icons-material/Restore'
import TuneIcon from '@mui/icons-material/Tune'
import TextField from '@mui/material/TextField'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import Alert from '@mui/material/Alert'
import { XPReason, LEVEL_DEFAULTS, generateLevelThresholds } from '../../utils/xpCalculation'
import type { LevelConfig } from '../../utils/xpCalculation'
import type { AvatarUnlockConfig } from './DiceBearAvatar'
import type { ThemeUnlockConfig } from './ThemeUnlockEditor'
import { SectionXPGauge } from './SectionXPGauge'

// ============================================================================
// Types
// ============================================================================

/** Per-action multiplier overrides */
export type XPMultipliers = Partial<Record<XPReason, number>>

/** Full XP tuner configuration stored on Section.xpConfig */
export interface XPTunerConfig {
  /** Per-action multiplier overrides (default 1.0) */
  multipliers?: XPMultipliers
  /** Daily XP cap per student (0 = unlimited) */
  dailyCap?: number
  /** Weekly XP cap per student (0 = unlimited) */
  weeklyCap?: number
  /** Whether XP is enabled for this section */
  enabled?: boolean
  /** Leveling curve configuration */
  levelConfig?: LevelConfig
  /** Avatar style unlock schedule — which styles unlock at which levels */
  avatarUnlocks?: AvatarUnlockConfig
  /** Theme unlock schedule — which cosmetic themes unlock at which levels */
  themeUnlocks?: ThemeUnlockConfig
}

// Stable default to avoid infinite render loops from new {} on each render
const EMPTY_CONFIG: XPTunerConfig = {}

/** @deprecated Use XPTunerConfig instead */
export type XPMultiplierConfig = XPTunerConfig

export interface XPTunerDialogProps {
  /** Whether the dialog is open */
  open: boolean
  /** Close callback */
  onClose: () => void
  /** Current tuner config (from section settings) */
  config?: XPTunerConfig
  /** Called when the instructor saves new config */
  onSave: (config: XPTunerConfig) => void
  /** Section name (for display) */
  sectionName?: string
  /** Number of assigned units in the section (for XP projection) */
  unitCount?: number
}

// ============================================================================
// Constants
// ============================================================================

/** Base XP amounts per interaction (mirrors xpCalculation.ts) */
const BASE_XP: Record<XPReason, number> = {
  [XPReason.HOMEWORK_SUBMITTED]: 50,
  [XPReason.AI_FEEDBACK_REVISED]: 25,
  [XPReason.ALL_BLOCKS_COMPLETED]: 75,
  [XPReason.PEER_REVIEW_GIVEN]: 40,
  [XPReason.PEER_REVIEW_HOSTED]: 30,
  [XPReason.NAILED_IT]: 20,
  [XPReason.ON_TIME_SUBMISSION]: 15,
  [XPReason.STREAK_3DAY]: 30,
  [XPReason.STREAK_7DAY]: 75,
  [XPReason.STREAK_14DAY]: 150,
  [XPReason.STREAK_30DAY]: 300,
  [XPReason.PERFECT_SCORE]: 100,
  [XPReason.COMEBACK]: 50,
  [XPReason.PERSONAL_BEST]: 25,
  [XPReason.EASTER_EGG]: 30,
  [XPReason.SQUAD_CHALLENGE_BONUS]: 100,
  [XPReason.PRACTICE_DRILL_COMPLETED]: 30,
  [XPReason.PRACTICE_DRILL_ACCURACY_BONUS]: 15,
  [XPReason.PEER_REVIEW_TOP_REVIEWER]: 50,
}

/** Human-readable labels for each XP reason */
const REASON_LABELS: Record<XPReason, string> = {
  [XPReason.HOMEWORK_SUBMITTED]: 'Homework Submitted',
  [XPReason.AI_FEEDBACK_REVISED]: 'AI Feedback Revised',
  [XPReason.ALL_BLOCKS_COMPLETED]: 'All Blocks Completed',
  [XPReason.PEER_REVIEW_GIVEN]: 'Peer Review Given',
  [XPReason.PEER_REVIEW_HOSTED]: 'Peer Review Hosted',
  [XPReason.NAILED_IT]: 'Nailed It',
  [XPReason.ON_TIME_SUBMISSION]: 'On-Time Submission',
  [XPReason.STREAK_3DAY]: '3-Day Streak',
  [XPReason.STREAK_7DAY]: '7-Day Streak',
  [XPReason.STREAK_14DAY]: '14-Day Streak',
  [XPReason.STREAK_30DAY]: '30-Day Streak',
  [XPReason.PERFECT_SCORE]: 'Perfect Score',
  [XPReason.COMEBACK]: 'Comeback',
  [XPReason.PERSONAL_BEST]: 'Personal Best',
  [XPReason.EASTER_EGG]: 'Easter Egg',
  [XPReason.SQUAD_CHALLENGE_BONUS]: 'Squad Challenge Bonus',
  [XPReason.PRACTICE_DRILL_COMPLETED]: 'Practice Drill Completed',
  [XPReason.PRACTICE_DRILL_ACCURACY_BONUS]: 'Practice Drill Accuracy Bonus',
  [XPReason.PEER_REVIEW_TOP_REVIEWER]: 'Top Reviewer',
}

/** Grouped categories for better organization */
interface CategoryGroup {
  label: string
  reasons: XPReason[]
}

const CATEGORIES: CategoryGroup[] = [
  {
    label: 'Submissions',
    reasons: [
      XPReason.HOMEWORK_SUBMITTED,
      XPReason.ALL_BLOCKS_COMPLETED,
      XPReason.ON_TIME_SUBMISSION,
      XPReason.AI_FEEDBACK_REVISED,
    ],
  },
  {
    label: 'Streaks',
    reasons: [
      XPReason.STREAK_3DAY,
      XPReason.STREAK_7DAY,
      XPReason.STREAK_14DAY,
      XPReason.STREAK_30DAY,
    ],
  },
  {
    label: 'Achievements',
    reasons: [
      XPReason.PERFECT_SCORE,
      XPReason.NAILED_IT,
      XPReason.COMEBACK,
      XPReason.PERSONAL_BEST,
    ],
  },
  {
    label: 'Social & Events',
    reasons: [
      XPReason.PEER_REVIEW_GIVEN,
      XPReason.PEER_REVIEW_HOSTED,
      XPReason.SQUAD_CHALLENGE_BONUS,
      XPReason.EASTER_EGG,
    ],
  },
  {
    label: 'Practice Drills',
    reasons: [
      XPReason.PRACTICE_DRILL_COMPLETED,
      XPReason.PRACTICE_DRILL_ACCURACY_BONUS,
    ],
  },
]

/** Slider marks */
const SLIDER_MARKS = [
  { value: 0, label: '0×' },
  { value: 0.5, label: '0.5×' },
  { value: 1, label: '1×' },
  { value: 2, label: '2×' },
  { value: 3, label: '3×' },
  { value: 5, label: '5×' },
]

// ============================================================================
// Component
// ============================================================================

export function XPTunerDialog({
  open,
  onClose,
  config = EMPTY_CONFIG,
  onSave,
  sectionName,
  unitCount = 0,
}: XPTunerDialogProps) {
  // Local draft state for editing
  const [draftMultipliers, setDraftMultipliers] = useState<XPMultipliers>({})
  const [draftDailyCap, setDraftDailyCap] = useState<number>(0)
  const [draftWeeklyCap, setDraftWeeklyCap] = useState<number>(0)
  const [draftEnabled, setDraftEnabled] = useState<boolean>(true)
  const [draftMaxLevel, setDraftMaxLevel] = useState<number>(LEVEL_DEFAULTS.maxLevel)
  const [draftXpPerLevel, setDraftXpPerLevel] = useState<number>(LEVEL_DEFAULTS.xpPerLevel)
  const [draftLevelScaling, setDraftLevelScaling] = useState<number>(LEVEL_DEFAULTS.levelScaling)

  // Reset draft when dialog opens
  useEffect(() => {
    if (open) {
      setDraftMultipliers({ ...(config.multipliers || {}) })
      setDraftDailyCap(config.dailyCap ?? 0)
      setDraftWeeklyCap(config.weeklyCap ?? 0)
      setDraftEnabled(config.enabled !== false)
      setDraftMaxLevel(config.levelConfig?.maxLevel ?? LEVEL_DEFAULTS.maxLevel)
      setDraftXpPerLevel(config.levelConfig?.xpPerLevel ?? LEVEL_DEFAULTS.xpPerLevel)
      setDraftLevelScaling(config.levelConfig?.levelScaling ?? LEVEL_DEFAULTS.levelScaling)
    }
  }, [open, config])

  const getMultiplier = (reason: XPReason): number => {
    return draftMultipliers[reason] ?? 1
  }

  const setMultiplier = (reason: XPReason, value: number) => {
    setDraftMultipliers((prev) => ({ ...prev, [reason]: value }))
  }

  const handleResetAll = () => {
    setDraftMultipliers({})
    setDraftDailyCap(0)
    setDraftWeeklyCap(0)
    setDraftEnabled(true)
    setDraftMaxLevel(LEVEL_DEFAULTS.maxLevel)
    setDraftXpPerLevel(LEVEL_DEFAULTS.xpPerLevel)
    setDraftLevelScaling(LEVEL_DEFAULTS.levelScaling)
  }

  const handleResetCategory = (reasons: XPReason[]) => {
    setDraftMultipliers((prev) => {
      const next = { ...prev }
      for (const reason of reasons) {
        delete next[reason]
      }
      return next
    })
  }

  const handleSave = () => {
    // Only save non-default multipliers
    const cleanedMultipliers: XPMultipliers = {}
    for (const [key, value] of Object.entries(draftMultipliers)) {
      if (value !== undefined && value !== 1) {
        cleanedMultipliers[key as XPReason] = value
      }
    }

    const result: XPTunerConfig = {}
    if (Object.keys(cleanedMultipliers).length > 0) {
      result.multipliers = cleanedMultipliers
    }
    if (draftDailyCap > 0) result.dailyCap = draftDailyCap
    if (draftWeeklyCap > 0) result.weeklyCap = draftWeeklyCap
    if (!draftEnabled) result.enabled = false

    // Only persist level config when non-default
    const isDefaultLevelConfig =
      draftMaxLevel === LEVEL_DEFAULTS.maxLevel &&
      draftXpPerLevel === LEVEL_DEFAULTS.xpPerLevel &&
      draftLevelScaling === LEVEL_DEFAULTS.levelScaling
    if (!isDefaultLevelConfig) {
      result.levelConfig = {
        maxLevel: draftMaxLevel,
        xpPerLevel: draftXpPerLevel,
        levelScaling: draftLevelScaling,
      }
    }

    onSave(result)
    onClose()
  }

  // Calculate if anything has changed from current config
  const hasChanges = useMemo(() => {
    const currentMultipliers = config.multipliers || {}
    const allReasons = Object.values(XPReason)
    const multipliersChanged = allReasons.some((reason) => {
      const current = currentMultipliers[reason] ?? 1
      const next = draftMultipliers[reason] ?? 1
      return current !== next
    })
    const capsChanged =
      (config.dailyCap ?? 0) !== draftDailyCap ||
      (config.weeklyCap ?? 0) !== draftWeeklyCap
    const enabledChanged = (config.enabled !== false) !== draftEnabled
    const levelChanged =
      (config.levelConfig?.maxLevel ?? LEVEL_DEFAULTS.maxLevel) !== draftMaxLevel ||
      (config.levelConfig?.xpPerLevel ?? LEVEL_DEFAULTS.xpPerLevel) !== draftXpPerLevel ||
      (config.levelConfig?.levelScaling ?? LEVEL_DEFAULTS.levelScaling) !== draftLevelScaling
    return multipliersChanged || capsChanged || enabledChanged || levelChanged
  }, [draftMultipliers, draftDailyCap, draftWeeklyCap, draftEnabled, draftMaxLevel, draftXpPerLevel, draftLevelScaling, config])

  // Count non-default settings
  const customCount = useMemo(() => {
    let count = Object.values(XPReason).filter((r) => {
      const val = draftMultipliers[r]
      return val !== undefined && val !== 1
    }).length
    if (draftDailyCap > 0) count++
    if (draftWeeklyCap > 0) count++
    if (!draftEnabled) count++
    if (draftMaxLevel !== LEVEL_DEFAULTS.maxLevel) count++
    if (draftXpPerLevel !== LEVEL_DEFAULTS.xpPerLevel) count++
    if (draftLevelScaling !== LEVEL_DEFAULTS.levelScaling) count++
    return count
  }, [draftMultipliers, draftDailyCap, draftWeeklyCap, draftEnabled, draftMaxLevel, draftXpPerLevel, draftLevelScaling])

  // Generate preview thresholds for the level config section
  const previewThresholds = useMemo(() => {
    return generateLevelThresholds({
      maxLevel: draftMaxLevel,
      xpPerLevel: draftXpPerLevel,
      levelScaling: draftLevelScaling,
    })
  }, [draftMaxLevel, draftXpPerLevel, draftLevelScaling])

  // Pick a few milestone levels for the preview table
  const previewMilestones = useMemo(() => {
    if (previewThresholds.length <= 8) return previewThresholds
    const milestones: typeof previewThresholds = []
    const max = previewThresholds.length
    // Always show first, last, and ~6 evenly spaced
    const indices = [0, 1]
    const step = Math.max(1, Math.floor((max - 1) / 6))
    for (let i = step; i < max - 1; i += step) {
      if (!indices.includes(i)) indices.push(i)
    }
    if (!indices.includes(max - 1)) indices.push(max - 1)
    indices.sort((a, b) => a - b)
    for (const idx of indices) milestones.push(previewThresholds[idx])
    return milestones
  }, [previewThresholds])

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TuneIcon color="primary" />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" component="span">
            XP Tuner
          </Typography>
          {sectionName && (
            <Typography variant="body2" color="text.secondary">
              {sectionName}
            </Typography>
          )}
        </Box>
        {customCount > 0 && (
          <Chip
            label={`${customCount} custom`}
            size="small"
            color="primary"
            variant="outlined"
          />
        )}
        <Tooltip title="Reset all to defaults">
          <IconButton onClick={handleResetAll} size="small">
            <RestoreIcon />
          </IconButton>
        </Tooltip>
      </DialogTitle>

      <DialogContent dividers sx={{ pb: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Adjust XP multipliers for each interaction type. A multiplier of 0× disables XP for that action, while higher values reward students more.
        </Typography>

        {/* ---- XP Enable Toggle ---- */}
        <FormControlLabel
          control={
            <Switch
              checked={draftEnabled}
              onChange={(_, checked) => setDraftEnabled(checked)}
            />
          }
          label="XP Enabled"
          sx={{ mb: 1 }}
        />

        {!draftEnabled && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            XP is disabled for this section. Students will not earn any XP.
          </Alert>
        )}

        {/* ---- XP Caps ---- */}
        <Box sx={{ mb: 3, opacity: draftEnabled ? 1 : 0.5, pointerEvents: draftEnabled ? 'auto' : 'none' }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
            XP Caps
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Limit how much XP a student can earn per day or week to control leveling pace. Set to 0 for unlimited.
          </Typography>
          <Stack direction="row" spacing={2}>
            <TextField
              type="number"
              size="small"
              label="Daily cap"
              value={draftDailyCap}
              onChange={(e) => setDraftDailyCap(Math.max(0, parseInt(e.target.value) || 0))}
              inputProps={{ min: 0, step: 25 }}
              helperText={draftDailyCap > 0 ? `Max ${draftDailyCap} XP/day` : 'Unlimited'}
              sx={{ flex: 1 }}
            />
            <TextField
              type="number"
              size="small"
              label="Weekly cap"
              value={draftWeeklyCap}
              onChange={(e) => setDraftWeeklyCap(Math.max(0, parseInt(e.target.value) || 0))}
              inputProps={{ min: 0, step: 50 }}
              helperText={draftWeeklyCap > 0 ? `Max ${draftWeeklyCap} XP/week` : 'Unlimited'}
              sx={{ flex: 1 }}
            />
          </Stack>
          <Divider sx={{ mt: 2 }} />
        </Box>

        {/* ---- Leveling ---- */}
        <Box sx={{ mb: 3, opacity: draftEnabled ? 1 : 0.5, pointerEvents: draftEnabled ? 'auto' : 'none' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ flex: 1 }}>
              Leveling
            </Typography>
            <Tooltip title="Reset leveling to defaults">
              <IconButton
                size="small"
                onClick={() => {
                  setDraftMaxLevel(LEVEL_DEFAULTS.maxLevel)
                  setDraftXpPerLevel(LEVEL_DEFAULTS.xpPerLevel)
                  setDraftLevelScaling(LEVEL_DEFAULTS.levelScaling)
                }}
              >
                <RestoreIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Configure how many levels students can reach and how fast they progress.
            Avatar style tiers unlock at 33% and 66% of max level.
          </Typography>

          <Stack spacing={2.5}>
            {/* Max Level */}
            <Box>
              <Typography variant="body2" gutterBottom>
                Max Level: <strong>{draftMaxLevel}</strong>
              </Typography>
              <Slider
                value={draftMaxLevel}
                onChange={(_, value) => setDraftMaxLevel(value as number)}
                min={2}
                max={99}
                step={1}
                marks={[
                  { value: 2, label: '2' },
                  { value: 6, label: '6' },
                  { value: 25, label: '25' },
                  { value: 50, label: '50' },
                  { value: 99, label: '99' },
                ]}
                valueLabelDisplay="auto"
                size="small"
                sx={{ '& .MuiSlider-markLabel': { fontSize: '0.65rem' } }}
              />
            </Box>

            {/* XP per Level & Scaling */}
            <Stack direction="row" spacing={2}>
              <TextField
                type="number"
                size="small"
                label="Base XP per level"
                value={draftXpPerLevel}
                onChange={(e) => setDraftXpPerLevel(Math.max(1, parseInt(e.target.value) || 1))}
                inputProps={{ min: 1, step: 25 }}
                helperText={`XP needed for level 2`}
                sx={{ flex: 1 }}
              />
              <TextField
                type="number"
                size="small"
                label="Level scaling"
                value={draftLevelScaling}
                onChange={(e) => {
                  const v = parseFloat(e.target.value)
                  if (!isNaN(v)) setDraftLevelScaling(Math.max(1, Math.min(3, v)))
                }}
                inputProps={{ min: 1, max: 3, step: 0.1 }}
                helperText={draftLevelScaling === 1 ? 'Linear' : `${draftLevelScaling}× per level`}
                sx={{ flex: 1 }}
              />
            </Stack>

            {/* Level Preview Table */}
            <Box sx={{ bgcolor: 'action.hover', borderRadius: 1, p: 1.5 }}>
              <Typography variant="caption" fontWeight={600} gutterBottom sx={{ display: 'block', mb: 0.5 }}>
                Level Preview
              </Typography>
              <Box
                component="table"
                sx={{
                  width: '100%',
                  fontSize: '0.75rem',
                  '& td, & th': { px: 1, py: 0.25, textAlign: 'left' },
                  '& th': { fontWeight: 600, color: 'text.secondary' },
                }}
              >
                <thead>
                  <tr>
                    <th>Level</th>
                    <th>XP Required</th>
                    <th>Title</th>
                  </tr>
                </thead>
                <tbody>
                  {previewMilestones.map((t) => (
                    <tr key={t.level}>
                      <td>{t.level}</td>
                      <td>{t.xpRequired.toLocaleString()}</td>
                      <td>{t.label}</td>
                    </tr>
                  ))}
                </tbody>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Total XP for max level: {previewThresholds[previewThresholds.length - 1]?.xpRequired.toLocaleString() ?? 0}
              </Typography>
            </Box>

            {/* XP Projection Gauge */}
            {unitCount > 0 && (
              <Box sx={{ mt: 2, p: 1.5, bgcolor: 'background.default', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                <SectionXPGauge
                  unitCount={unitCount}
                  xpConfig={{
                    multipliers: draftMultipliers,
                    dailyCap: draftDailyCap,
                    weeklyCap: draftWeeklyCap,
                    enabled: draftEnabled,
                    levelConfig: {
                      maxLevel: draftMaxLevel,
                      xpPerLevel: draftXpPerLevel,
                      levelScaling: draftLevelScaling,
                    },
                  }}
                  desiredMaxLevel={draftMaxLevel}
                  showTuner={true}
                  onApplyTuning={(tuned) => {
                    setDraftMaxLevel(tuned.maxLevel ?? LEVEL_DEFAULTS.maxLevel)
                    setDraftXpPerLevel(tuned.xpPerLevel ?? LEVEL_DEFAULTS.xpPerLevel)
                    setDraftLevelScaling(tuned.levelScaling ?? LEVEL_DEFAULTS.levelScaling)
                  }}
                />
              </Box>
            )}
          </Stack>

          <Divider sx={{ mt: 2 }} />
        </Box>

        {/* ---- Per-Action Multipliers ---- */}
        <Stack spacing={3} sx={{ opacity: draftEnabled ? 1 : 0.5, pointerEvents: draftEnabled ? 'auto' : 'none' }}>
          {CATEGORIES.map((category) => (
            <Box key={category.label}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ flex: 1 }}>
                  {category.label}
                </Typography>
                <Tooltip title={`Reset ${category.label} to defaults`}>
                  <IconButton
                    size="small"
                    onClick={() => handleResetCategory(category.reasons)}
                  >
                    <RestoreIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>

              <Stack spacing={2}>
                {category.reasons.map((reason) => {
                  const multiplier = getMultiplier(reason)
                  const baseXP = BASE_XP[reason]
                  const effectiveXP = Math.round(baseXP * multiplier)
                  const isCustom = multiplier !== 1

                  return (
                    <Box key={reason}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.5 }}>
                        <Typography variant="body2" fontWeight={isCustom ? 600 : 400}>
                          {REASON_LABELS[reason]}
                        </Typography>
                        <Typography
                          variant="body2"
                          color={multiplier === 0 ? 'error' : isCustom ? 'primary' : 'text.secondary'}
                          fontWeight={isCustom ? 600 : 400}
                        >
                          {effectiveXP} XP
                          {isCustom && (
                            <Typography component="span" variant="caption" sx={{ ml: 0.5 }}>
                              ({multiplier}×)
                            </Typography>
                          )}
                        </Typography>
                      </Box>
                      <Slider
                        value={multiplier}
                        onChange={(_, value) => setMultiplier(reason, value as number)}
                        min={0}
                        max={5}
                        step={0.25}
                        marks={SLIDER_MARKS}
                        valueLabelDisplay="auto"
                        valueLabelFormat={(v) => `${v}×`}
                        size="small"
                        sx={{
                          color: multiplier === 0 ? 'error.main' : undefined,
                          '& .MuiSlider-markLabel': { fontSize: '0.65rem' },
                        }}
                      />
                    </Box>
                  )
                })}
              </Stack>

              <Divider sx={{ mt: 2 }} />
            </Box>
          ))}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!hasChanges}
        >
          Save XP Settings
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default XPTunerDialog

// ============================================================================
// Inline variant (for accordion body — no dialog wrapper)
// ============================================================================

export interface XPTunerInlineProps {
  /** Current tuner config (from section settings) */
  config?: XPTunerConfig
  /** Called when the instructor saves new config */
  onSave: (config: XPTunerConfig) => void
  /** Section name (for display) */
  sectionName?: string
  /** Number of assigned units in the section (for XP projection) */
  unitCount?: number
}

export function XPTunerInline({
  config = EMPTY_CONFIG,
  onSave,
  sectionName,
  unitCount = 0,
}: XPTunerInlineProps) {
  const [draftMultipliers, setDraftMultipliers] = useState<XPMultipliers>({})
  const [draftDailyCap, setDraftDailyCap] = useState<number>(0)
  const [draftWeeklyCap, setDraftWeeklyCap] = useState<number>(0)
  const [draftEnabled, setDraftEnabled] = useState<boolean>(true)
  const [draftMaxLevel, setDraftMaxLevel] = useState<number>(LEVEL_DEFAULTS.maxLevel)
  const [draftXpPerLevel, setDraftXpPerLevel] = useState<number>(LEVEL_DEFAULTS.xpPerLevel)
  const [draftLevelScaling, setDraftLevelScaling] = useState<number>(LEVEL_DEFAULTS.levelScaling)

  // Sync draft from config on mount / config change
  useEffect(() => {
    setDraftMultipliers({ ...(config.multipliers || {}) })
    setDraftDailyCap(config.dailyCap ?? 0)
    setDraftWeeklyCap(config.weeklyCap ?? 0)
    setDraftEnabled(config.enabled !== false)
    setDraftMaxLevel(config.levelConfig?.maxLevel ?? LEVEL_DEFAULTS.maxLevel)
    setDraftXpPerLevel(config.levelConfig?.xpPerLevel ?? LEVEL_DEFAULTS.xpPerLevel)
    setDraftLevelScaling(config.levelConfig?.levelScaling ?? LEVEL_DEFAULTS.levelScaling)
  }, [config])

  const getMultiplier = (reason: XPReason): number => draftMultipliers[reason] ?? 1
  const setMultiplier = (reason: XPReason, value: number) => {
    setDraftMultipliers((prev) => ({ ...prev, [reason]: value }))
  }

  const handleResetAll = () => {
    setDraftMultipliers({})
    setDraftDailyCap(0)
    setDraftWeeklyCap(0)
    setDraftEnabled(true)
    setDraftMaxLevel(LEVEL_DEFAULTS.maxLevel)
    setDraftXpPerLevel(LEVEL_DEFAULTS.xpPerLevel)
    setDraftLevelScaling(LEVEL_DEFAULTS.levelScaling)
  }

  const handleResetCategory = (reasons: XPReason[]) => {
    setDraftMultipliers((prev) => {
      const next = { ...prev }
      for (const reason of reasons) delete next[reason]
      return next
    })
  }

  const handleSave = () => {
    const cleanedMultipliers: XPMultipliers = {}
    for (const [key, value] of Object.entries(draftMultipliers)) {
      if (value !== undefined && value !== 1) {
        cleanedMultipliers[key as XPReason] = value
      }
    }
    const result: XPTunerConfig = {}
    if (Object.keys(cleanedMultipliers).length > 0) result.multipliers = cleanedMultipliers
    if (draftDailyCap > 0) result.dailyCap = draftDailyCap
    if (draftWeeklyCap > 0) result.weeklyCap = draftWeeklyCap
    if (!draftEnabled) result.enabled = false
    const isDefaultLevelConfig =
      draftMaxLevel === LEVEL_DEFAULTS.maxLevel &&
      draftXpPerLevel === LEVEL_DEFAULTS.xpPerLevel &&
      draftLevelScaling === LEVEL_DEFAULTS.levelScaling
    if (!isDefaultLevelConfig) {
      result.levelConfig = { maxLevel: draftMaxLevel, xpPerLevel: draftXpPerLevel, levelScaling: draftLevelScaling }
    }
    onSave(result)
  }

  const hasChanges = useMemo(() => {
    const currentMultipliers = config.multipliers || {}
    const allReasons = Object.values(XPReason)
    const multipliersChanged = allReasons.some((r) => (currentMultipliers[r] ?? 1) !== (draftMultipliers[r] ?? 1))
    const capsChanged = (config.dailyCap ?? 0) !== draftDailyCap || (config.weeklyCap ?? 0) !== draftWeeklyCap
    const enabledChanged = (config.enabled !== false) !== draftEnabled
    const levelChanged =
      (config.levelConfig?.maxLevel ?? LEVEL_DEFAULTS.maxLevel) !== draftMaxLevel ||
      (config.levelConfig?.xpPerLevel ?? LEVEL_DEFAULTS.xpPerLevel) !== draftXpPerLevel ||
      (config.levelConfig?.levelScaling ?? LEVEL_DEFAULTS.levelScaling) !== draftLevelScaling
    return multipliersChanged || capsChanged || enabledChanged || levelChanged
  }, [draftMultipliers, draftDailyCap, draftWeeklyCap, draftEnabled, draftMaxLevel, draftXpPerLevel, draftLevelScaling, config])

  const customCount = useMemo(() => {
    let count = Object.values(XPReason).filter((r) => {
      const val = draftMultipliers[r]
      return val !== undefined && val !== 1
    }).length
    if (draftDailyCap > 0) count++
    if (draftWeeklyCap > 0) count++
    if (!draftEnabled) count++
    if (draftMaxLevel !== LEVEL_DEFAULTS.maxLevel) count++
    if (draftXpPerLevel !== LEVEL_DEFAULTS.xpPerLevel) count++
    if (draftLevelScaling !== LEVEL_DEFAULTS.levelScaling) count++
    return count
  }, [draftMultipliers, draftDailyCap, draftWeeklyCap, draftEnabled, draftMaxLevel, draftXpPerLevel, draftLevelScaling])

  const previewThresholds = useMemo(() => {
    return generateLevelThresholds({ maxLevel: draftMaxLevel, xpPerLevel: draftXpPerLevel, levelScaling: draftLevelScaling })
  }, [draftMaxLevel, draftXpPerLevel, draftLevelScaling])

  const previewMilestones = useMemo(() => {
    if (previewThresholds.length <= 8) return previewThresholds
    const milestones: typeof previewThresholds = []
    const max = previewThresholds.length
    const indices = [0, 1]
    const step = Math.max(1, Math.floor((max - 1) / 6))
    for (let i = step; i < max - 1; i += step) {
      if (!indices.includes(i)) indices.push(i)
    }
    if (!indices.includes(max - 1)) indices.push(max - 1)
    indices.sort((a, b) => a - b)
    for (const idx of indices) milestones.push(previewThresholds[idx])
    return milestones
  }, [previewThresholds])

  return (
    <Box>
      {/* Header with reset */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box sx={{ flex: 1 }}>
          {sectionName && (
            <Typography variant="body2" color="text.secondary">
              {sectionName}
            </Typography>
          )}
        </Box>
        {customCount > 0 && (
          <Chip label={`${customCount} custom`} size="small" color="primary" variant="outlined" sx={{ mr: 1 }} />
        )}
        <Tooltip title="Reset all to defaults">
          <IconButton onClick={handleResetAll} size="small">
            <RestoreIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Adjust XP multipliers for each interaction type. A multiplier of 0× disables XP for that action, while higher values reward students more.
      </Typography>

      {/* XP Enable Toggle */}
      <FormControlLabel
        control={<Switch checked={draftEnabled} onChange={(_, checked) => setDraftEnabled(checked)} />}
        label="XP Enabled"
        sx={{ mb: 1 }}
      />

      {!draftEnabled && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          XP is disabled for this section. Students will not earn any XP.
        </Alert>
      )}

      {/* XP Caps */}
      <Box sx={{ mb: 3, opacity: draftEnabled ? 1 : 0.5, pointerEvents: draftEnabled ? 'auto' : 'none' }}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>XP Caps</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Limit how much XP a student can earn per day or week to control leveling pace. Set to 0 for unlimited.
        </Typography>
        <Stack direction="row" spacing={2}>
          <TextField
            type="number" size="small" label="Daily cap" value={draftDailyCap}
            onChange={(e) => setDraftDailyCap(Math.max(0, parseInt(e.target.value) || 0))}
            inputProps={{ min: 0, step: 25 }}
            helperText={draftDailyCap > 0 ? `Max ${draftDailyCap} XP/day` : 'Unlimited'}
            sx={{ flex: 1 }}
          />
          <TextField
            type="number" size="small" label="Weekly cap" value={draftWeeklyCap}
            onChange={(e) => setDraftWeeklyCap(Math.max(0, parseInt(e.target.value) || 0))}
            inputProps={{ min: 0, step: 50 }}
            helperText={draftWeeklyCap > 0 ? `Max ${draftWeeklyCap} XP/week` : 'Unlimited'}
            sx={{ flex: 1 }}
          />
        </Stack>
        <Divider sx={{ mt: 2 }} />
      </Box>

      {/* Leveling */}
      <Box sx={{ mb: 3, opacity: draftEnabled ? 1 : 0.5, pointerEvents: draftEnabled ? 'auto' : 'none' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ flex: 1 }}>Leveling</Typography>
          <Tooltip title="Reset leveling to defaults">
            <IconButton
              size="small"
              onClick={() => {
                setDraftMaxLevel(LEVEL_DEFAULTS.maxLevel)
                setDraftXpPerLevel(LEVEL_DEFAULTS.xpPerLevel)
                setDraftLevelScaling(LEVEL_DEFAULTS.levelScaling)
              }}
            >
              <RestoreIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Configure how many levels students can reach and how fast they progress.
          Avatar style tiers unlock at 33% and 66% of max level.
        </Typography>

        <Stack spacing={2.5}>
          {/* Max Level */}
          <Box>
            <Typography variant="body2" gutterBottom>Max Level: <strong>{draftMaxLevel}</strong></Typography>
            <Slider
              value={draftMaxLevel}
              onChange={(_, value) => setDraftMaxLevel(value as number)}
              min={2} max={99} step={1}
              marks={[{ value: 2, label: '2' }, { value: 6, label: '6' }, { value: 25, label: '25' }, { value: 50, label: '50' }, { value: 99, label: '99' }]}
              valueLabelDisplay="auto" size="small"
              sx={{ '& .MuiSlider-markLabel': { fontSize: '0.65rem' } }}
            />
          </Box>

          {/* XP per Level & Scaling */}
          <Stack direction="row" spacing={2}>
            <TextField
              type="number" size="small" label="Base XP per level" value={draftXpPerLevel}
              onChange={(e) => setDraftXpPerLevel(Math.max(1, parseInt(e.target.value) || 1))}
              inputProps={{ min: 1, step: 25 }}
              helperText={`XP needed for level 2`}
              sx={{ flex: 1 }}
            />
            <TextField
              type="number" size="small" label="Level scaling" value={draftLevelScaling}
              onChange={(e) => {
                const v = parseFloat(e.target.value)
                if (!isNaN(v)) setDraftLevelScaling(Math.max(1, Math.min(3, v)))
              }}
              inputProps={{ min: 1, max: 3, step: 0.1 }}
              helperText={draftLevelScaling === 1 ? 'Linear' : `${draftLevelScaling}× per level`}
              sx={{ flex: 1 }}
            />
          </Stack>

          {/* Level Preview Table */}
          <Box sx={{ bgcolor: 'action.hover', borderRadius: 1, p: 1.5 }}>
            <Typography variant="caption" fontWeight={600} gutterBottom sx={{ display: 'block', mb: 0.5 }}>
              Level Preview
            </Typography>
            <Box
              component="table"
              sx={{
                width: '100%', fontSize: '0.75rem',
                '& td, & th': { px: 1, py: 0.25, textAlign: 'left' },
                '& th': { fontWeight: 600, color: 'text.secondary' },
              }}
            >
              <thead>
                <tr><th>Level</th><th>XP Required</th><th>Title</th></tr>
              </thead>
              <tbody>
                {previewMilestones.map((t) => (
                  <tr key={t.level}><td>{t.level}</td><td>{t.xpRequired.toLocaleString()}</td><td>{t.label}</td></tr>
                ))}
              </tbody>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              Total XP for max level: {previewThresholds[previewThresholds.length - 1]?.xpRequired.toLocaleString() ?? 0}
            </Typography>
          </Box>

          {/* XP Projection Gauge */}
          {unitCount > 0 && (
            <Box sx={{ mt: 2, p: 1.5, bgcolor: 'background.default', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
              <SectionXPGauge
                unitCount={unitCount}
                xpConfig={{
                  multipliers: draftMultipliers,
                  dailyCap: draftDailyCap,
                  weeklyCap: draftWeeklyCap,
                  enabled: draftEnabled,
                  levelConfig: { maxLevel: draftMaxLevel, xpPerLevel: draftXpPerLevel, levelScaling: draftLevelScaling },
                }}
                desiredMaxLevel={draftMaxLevel}
                showTuner={true}
                onApplyTuning={(tuned) => {
                  setDraftMaxLevel(tuned.maxLevel ?? LEVEL_DEFAULTS.maxLevel)
                  setDraftXpPerLevel(tuned.xpPerLevel ?? LEVEL_DEFAULTS.xpPerLevel)
                  setDraftLevelScaling(tuned.levelScaling ?? LEVEL_DEFAULTS.levelScaling)
                }}
              />
            </Box>
          )}
        </Stack>

        <Divider sx={{ mt: 2 }} />
      </Box>

      {/* Per-Action Multipliers */}
      <Stack spacing={3} sx={{ opacity: draftEnabled ? 1 : 0.5, pointerEvents: draftEnabled ? 'auto' : 'none' }}>
        {CATEGORIES.map((category) => (
          <Box key={category.label}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ flex: 1 }}>{category.label}</Typography>
              <Tooltip title={`Reset ${category.label} to defaults`}>
                <IconButton size="small" onClick={() => handleResetCategory(category.reasons)}>
                  <RestoreIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Stack spacing={2}>
              {category.reasons.map((reason) => {
                const multiplier = getMultiplier(reason)
                const baseXP = BASE_XP[reason]
                const effectiveXP = Math.round(baseXP * multiplier)
                const isCustom = multiplier !== 1
                return (
                  <Box key={reason}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.5 }}>
                      <Typography variant="body2" fontWeight={isCustom ? 600 : 400}>{REASON_LABELS[reason]}</Typography>
                      <Typography
                        variant="body2"
                        color={multiplier === 0 ? 'error' : isCustom ? 'primary' : 'text.secondary'}
                        fontWeight={isCustom ? 600 : 400}
                      >
                        {effectiveXP} XP
                        {isCustom && (
                          <Typography component="span" variant="caption" sx={{ ml: 0.5 }}>({multiplier}×)</Typography>
                        )}
                      </Typography>
                    </Box>
                    <Slider
                      value={multiplier}
                      onChange={(_, value) => setMultiplier(reason, value as number)}
                      min={0} max={5} step={0.25}
                      marks={SLIDER_MARKS}
                      valueLabelDisplay="auto"
                      valueLabelFormat={(v) => `${v}×`}
                      size="small"
                      sx={{ color: multiplier === 0 ? 'error.main' : undefined, '& .MuiSlider-markLabel': { fontSize: '0.65rem' } }}
                    />
                  </Box>
                )
              })}
            </Stack>
            <Divider sx={{ mt: 2 }} />
          </Box>
        ))}
      </Stack>

      {/* Save button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={handleSave} variant="contained" disabled={!hasChanges}>
          Save XP Settings
        </Button>
      </Box>
    </Box>
  )
}
