/**
 * SkillDetailPanel — Shows details of a selected skill and provides
 * an action button to advance the skill status (AVAILABLE → IN_PROGRESS → MASTERED).
 *
 * @module SkillDetailPanel
 */

import React, { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import LockIcon from '@mui/icons-material/Lock'
import type { SkillNodeData, SkillStatus } from './SkillTree'

export interface SkillDetailPanelProps {
  skill: SkillNodeData | null
  onAdvance?: (skillId: string, newStatus: SkillStatus) => Promise<any>
  onClose?: () => void
}

const NEXT_STATUS: Partial<Record<SkillStatus, SkillStatus>> = {
  AVAILABLE: 'IN_PROGRESS',
  IN_PROGRESS: 'MASTERED',
}

const ACTION_LABELS: Partial<Record<SkillStatus, string>> = {
  AVAILABLE: 'Start Learning',
  IN_PROGRESS: 'Mark as Mastered',
}

export function SkillDetailPanel({ skill, onAdvance, onClose }: SkillDetailPanelProps) {
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

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        maxWidth: 320,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle1" fontWeight={700}>
          {skill.title}
        </Typography>
        <Chip
          label={skill.status}
          size="small"
          color={
            skill.status === 'MASTERED' ? 'success' :
            skill.status === 'IN_PROGRESS' ? 'warning' :
            skill.status === 'AVAILABLE' ? 'primary' : 'default'
          }
          sx={{ height: 22, fontSize: '0.75rem' }}
        />
      </Box>

      {skill.description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {skill.description}
        </Typography>
      )}

      {skill.xpReward != null && skill.xpReward > 0 && (
        <Typography variant="body2" sx={{ mb: 1.5 }}>
          Reward: <strong>+{skill.xpReward} XP</strong>
        </Typography>
      )}

      {skill.status === 'LOCKED' && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.disabled' }}>
          <LockIcon fontSize="small" />
          <Typography variant="body2">Complete prerequisites to unlock</Typography>
        </Box>
      )}

      {skill.status === 'MASTERED' && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'success.main' }}>
          <CheckCircleIcon fontSize="small" />
          <Typography variant="body2">Mastered!</Typography>
        </Box>
      )}

      {actionLabel && onAdvance && (
        <Button
          variant="contained"
          size="small"
          startIcon={loading ? <CircularProgress size={16} /> : <PlayArrowIcon />}
          onClick={handleAdvance}
          disabled={loading}
          sx={{ mt: 1.5 }}
          fullWidth
        >
          {actionLabel}
        </Button>
      )}

      {onClose && (
        <Button size="small" onClick={onClose} sx={{ mt: 1, display: 'block', mx: 'auto' }}>
          Close
        </Button>
      )}
    </Box>
  )
}
