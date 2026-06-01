/**
 * SectionXPGauge — Visualizes XP availability vs. level requirements for a section.
 *
 * Shows:
 * - Total available XP from assigned units
 * - Which levels are reachable from assignments alone
 * - Drill sessions needed to bridge gaps to higher levels
 * - Optional auto-tune suggestion
 *
 * @module SectionXPGauge
 */

import React, { useMemo } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import LinearProgress from '@mui/material/LinearProgress'
import Chip from '@mui/material/Chip'
import Tooltip from '@mui/material/Tooltip'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter'
import TuneIcon from '@mui/icons-material/Tune'
import AutoStoriesIcon from '@mui/icons-material/AutoStories'
import {
  projectSectionXP,
  tuneLevelConfig,
  type SectionXPProjection,
  type LevelTuningResult,
  type TuningOptions,
} from '../../utils/xpProjection'
import type { XPConfig, LevelConfig } from '../../utils/xpCalculation'

// ============================================================================
// Types
// ============================================================================

export interface SectionXPGaugeProps {
  /** Number of assigned units in the section */
  unitCount: number
  /** XP config (multipliers, level config, etc.) from the section */
  xpConfig?: XPConfig
  /** Desired max level (from instructor gamification settings). Defaults to level config maxLevel or 6. */
  desiredMaxLevel?: number
  /** Callback when instructor accepts a tuning suggestion */
  onApplyTuning?: (config: LevelConfig) => void
  /** Whether to show the auto-tune suggestion panel */
  showTuner?: boolean
}

// ============================================================================
// Component
// ============================================================================

export function SectionXPGauge({
  unitCount,
  xpConfig,
  desiredMaxLevel,
  onApplyTuning,
  showTuner = true,
}: SectionXPGaugeProps) {
  const maxLevel = desiredMaxLevel ?? xpConfig?.levelConfig?.maxLevel ?? 6

  const projection = useMemo(
    () => projectSectionXP(unitCount, xpConfig),
    [unitCount, xpConfig],
  )

  const tuning = useMemo<LevelTuningResult | null>(() => {
    if (!showTuner) return null
    const options: TuningOptions = {
      unitCount,
      desiredMaxLevel: maxLevel,
      xpConfig,
    }
    return tuneLevelConfig(options)
  }, [unitCount, maxLevel, xpConfig, showTuner])

  const maxThresholdXP = projection.levelGaps[projection.levelGaps.length - 1]?.xpRequired || 1
  const assignmentFillPercent = Math.min(100, (projection.totalAssignmentXP / maxThresholdXP) * 100)

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <AutoStoriesIcon color="primary" fontSize="small" />
        <Typography variant="subtitle2" fontWeight={700}>
          Section XP Projection
        </Typography>
        <Chip
          label={`${unitCount} unit${unitCount !== 1 ? 's' : ''}`}
          size="small"
          variant="outlined"
        />
      </Box>

      {/* Total XP bar */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            Max XP from assignments
          </Typography>
          <Typography variant="caption" fontWeight={700}>
            {projection.totalAssignmentXP} / {maxThresholdXP} XP
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={assignmentFillPercent}
          sx={{
            height: 10,
            borderRadius: 5,
            bgcolor: 'action.hover',
            '& .MuiLinearProgress-bar': {
              borderRadius: 5,
              bgcolor: assignmentFillPercent >= 100 ? 'success.main' : 'primary.main',
            },
          }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          {projection.perUnitXP.total} XP per unit (perfect completion)
        </Typography>
      </Box>

      {/* Level gap analysis */}
      <Typography variant="caption" fontWeight={700} sx={{ mb: 1, display: 'block' }}>
        Level Reachability
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 2 }}>
        {projection.levelGaps.map((gap) => (
          <Box
            key={gap.level}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 1,
              py: 0.5,
              borderRadius: 1,
              bgcolor: gap.reachableFromAssignments ? 'success.50' : 'warning.50',
              border: '1px solid',
              borderColor: gap.reachableFromAssignments ? 'success.200' : 'warning.200',
            }}
          >
            {gap.reachableFromAssignments ? (
              <CheckCircleIcon sx={{ fontSize: '1rem', color: 'success.main' }} />
            ) : (
              <FitnessCenterIcon sx={{ fontSize: '1rem', color: 'warning.main' }} />
            )}
            <Typography variant="caption" sx={{ minWidth: 40, fontWeight: 700 }}>
              Lv.{gap.level}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
              {gap.label} — {gap.xpRequired} XP
            </Typography>
            {gap.reachableFromAssignments ? (
              <Chip label="Assignments" size="small" color="success" variant="outlined" sx={{ height: 20, fontSize: '0.6rem' }} />
            ) : (
              <Tooltip title={`${gap.xpDeficit} XP deficit → ~${gap.drillSessionsNeeded} drill sessions (1/day optimal)`}>
                <Chip
                  icon={<FitnessCenterIcon sx={{ fontSize: '0.7rem !important' }} />}
                  label={`+${gap.drillSessionsNeeded} drills`}
                  size="small"
                  color="warning"
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.6rem' }}
                />
              </Tooltip>
            )}
          </Box>
        ))}
      </Box>

      {/* Summary alert */}
      {projection.maxLevelFromAssignments.level < maxLevel ? (
        <Alert severity="info" sx={{ mb: 2, '& .MuiAlert-message': { fontSize: '0.75rem' } }}>
          Students can reach <strong>Level {projection.maxLevelFromAssignments.level}</strong> from
          assignments alone. Levels {projection.maxLevelFromAssignments.level + 1}–{maxLevel} require
          practice drills.
        </Alert>
      ) : (
        <Alert severity="success" sx={{ mb: 2, '& .MuiAlert-message': { fontSize: '0.75rem' } }}>
          All {maxLevel} levels are achievable from assignments alone!
        </Alert>
      )}

      {/* Tuner suggestion */}
      {showTuner && tuning && (
        <>
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <TuneIcon fontSize="small" color="secondary" />
            <Typography variant="caption" fontWeight={700}>
              Auto-Tune Suggestion
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-line', mb: 1, display: 'block' }}>
            {tuning.explanation}
          </Typography>
          {onApplyTuning && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<TuneIcon />}
              onClick={() => onApplyTuning(tuning.recommendedConfig)}
              sx={{ textTransform: 'none', fontSize: '0.75rem' }}
            >
              Apply Balanced Config (base={tuning.recommendedConfig.xpPerLevel}, scale={tuning.recommendedConfig.levelScaling}×)
            </Button>
          )}
        </>
      )}
    </Box>
  )
}

export default SectionXPGauge
