/**
 * SkillDetailPanel — Shows details of a selected skill and provides
 * an action button to advance the skill status (AVAILABLE → IN_PROGRESS → MASTERED).
 * Also shows related units with completion progress bars and XP earned.
 *
 * @module SkillDetailPanel
 */

import React, { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import LinearProgress from '@mui/material/LinearProgress'
import Divider from '@mui/material/Divider'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import LockIcon from '@mui/icons-material/Lock'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import type { SkillNodeData, SkillStatus } from './SkillTree'

export interface UnitProgress {
  unitId: string
  unitName: string
  completionPercent: number
  highestGrade: number
  xpEarned: number
  href?: string
}

export interface SkillDetailPanelProps {
  skill: SkillNodeData | null
  onAdvance?: (skillId: string, newStatus: SkillStatus) => Promise<any>
  onClose?: () => void
  /** Related units with progress data */
  unitProgress?: UnitProgress[]
  /** All skills in the tree — used to show prerequisite names */
  allSkills?: SkillNodeData[]
  /** Total XP earned by the student */
  totalXP?: number
}

const NEXT_STATUS: Partial<Record<SkillStatus, SkillStatus>> = {
  AVAILABLE: 'IN_PROGRESS',
  IN_PROGRESS: 'MASTERED',
}

const ACTION_LABELS: Partial<Record<SkillStatus, string>> = {
  AVAILABLE: 'Start Learning',
  IN_PROGRESS: 'Mark as Mastered',
}

export function SkillDetailPanel({ skill, onAdvance, onClose, unitProgress = [], allSkills = [], totalXP }: SkillDetailPanelProps) {
  const [loading, setLoading] = useState(false)

  if (!skill) return null

  const nextStatus = NEXT_STATUS[skill.status]
  const actionLabel = ACTION_LABELS[skill.status]

  const handleAdvance = async () => {
    if (!nextStatus || !onAdvance) return
    setLoading(true)
    try {
      await onAdvance(skill.skillId, nextStatus)
    } finally {
      setLoading(false)
    }
  }

  // Resolve prerequisite names
  const prereqNames = (skill.prerequisites || [])
    .map((pid) => allSkills.find((s) => s.skillId === pid))
    .filter(Boolean) as SkillNodeData[]

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography variant="h6" fontWeight={700} sx={{ flex: 1 }}>
          {skill.title}
        </Typography>
        <Chip
          label={skill.status.replace('_', ' ')}
          size="small"
          color={
            skill.status === 'MASTERED' ? 'success' :
            skill.status === 'IN_PROGRESS' ? 'warning' :
            skill.status === 'AVAILABLE' ? 'primary' : 'default'
          }
          sx={{ height: 24, fontSize: '0.75rem', ml: 1 }}
        />
      </Box>

      {skill.description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {skill.description}
        </Typography>
      )}

      {/* XP Reward */}
      {skill.xpReward != null && skill.xpReward > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <EmojiEventsIcon sx={{ color: 'warning.main', fontSize: 20 }} />
          <Typography variant="body2">
            Reward: <strong>+{skill.xpReward} XP</strong>
          </Typography>
          {skill.status === 'MASTERED' && (
            <Chip label="Earned!" size="small" color="success" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
          )}
        </Box>
      )}

      {/* Status Messages */}
      {skill.status === 'LOCKED' && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.disabled', mb: 2 }}>
          <LockIcon fontSize="small" />
          <Typography variant="body2">Complete prerequisites to unlock</Typography>
        </Box>
      )}

      {skill.status === 'MASTERED' && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'success.main', mb: 2 }}>
          <CheckCircleIcon fontSize="small" />
          <Typography variant="body2">Mastered!</Typography>
        </Box>
      )}

      {/* Prerequisites */}
      {prereqNames.length > 0 && (
        <>
          <Divider sx={{ my: 1 }} />
          <Typography variant="overline" color="text.secondary" sx={{ mb: 0.5 }}>
            Prerequisites
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
            {prereqNames.map((prereq) => (
              <Chip
                key={prereq.skillId}
                label={prereq.title}
                size="small"
                icon={prereq.status === 'MASTERED' ? <CheckCircleIcon /> : <LockIcon />}
                color={prereq.status === 'MASTERED' ? 'success' : 'default'}
                variant="outlined"
                sx={{ fontSize: '0.75rem' }}
              />
            ))}
          </Box>
        </>
      )}

      {/* Related Units with Progress */}
      {unitProgress.length > 0 && (
        <>
          <Divider sx={{ my: 1 }} />
          <Typography variant="overline" color="text.secondary" sx={{ mb: 1 }}>
            Related Units
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
            {unitProgress.map((unit) => (
              <Box
                key={unit.unitId}
                component={unit.href ? 'a' : 'div'}
                href={unit.href}
                sx={{
                  p: 1.5,
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: unit.completionPercent >= 100 ? 'success.50' : 'background.default',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'box-shadow 0.2s',
                  '&:hover': unit.href ? { boxShadow: 2 } : {},
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                  <MenuBookIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>
                    {unit.unitName}
                  </Typography>
                  {unit.xpEarned > 0 && (
                    <Chip
                      label={`+${unit.xpEarned} XP`}
                      size="small"
                      sx={{ height: 18, fontSize: '0.65rem', bgcolor: 'warning.main', color: 'white' }}
                    />
                  )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(unit.completionPercent, 100)}
                    sx={{
                      flex: 1,
                      height: 8,
                      borderRadius: 4,
                      bgcolor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                      },
                    }}
                    color={unit.completionPercent >= 100 ? 'success' : unit.completionPercent >= 50 ? 'primary' : 'warning'}
                  />
                  <Typography variant="caption" fontWeight={600} sx={{ minWidth: 36, textAlign: 'right' }}>
                    {Math.round(unit.completionPercent)}%
                  </Typography>
                </Box>
                {unit.highestGrade > 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Best grade: {Math.round(unit.highestGrade)}%
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        </>
      )}

      {/* Total XP */}
      {totalXP != null && totalXP > 0 && (
        <>
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <EmojiEventsIcon sx={{ color: 'warning.main' }} />
            <Typography variant="body2">
              Total XP earned: <strong>{totalXP}</strong>
            </Typography>
          </Box>
        </>
      )}

      {/* Action Button */}
      {actionLabel && onAdvance && (
        <Button
          variant="contained"
          size="small"
          startIcon={loading ? <CircularProgress size={16} /> : <PlayArrowIcon />}
          onClick={handleAdvance}
          disabled={loading}
          sx={{ mt: 'auto', mb: 1 }}
          fullWidth
        >
          {actionLabel}
        </Button>
      )}

      {onClose && (
        <Button size="small" onClick={onClose} sx={{ display: 'block', mx: 'auto' }}>
          Close
        </Button>
      )}
    </Box>
  )
}
