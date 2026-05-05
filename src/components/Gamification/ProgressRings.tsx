/**
 * ProgressRings — Circular progress indicators showing per-module completion.
 *
 * Renders 1–5 rings with milestone markers at 25%, 50%, 75%.
 *
 * @module ProgressRings
 */

import React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import StarIcon from '@mui/icons-material/Star'

export interface ModuleProgress {
  moduleId: string
  moduleName: string
  completionPercent: number
  totalWorkbooks: number
  completedWorkbooks: number
}

export interface ProgressRingsProps {
  modules: ModuleProgress[]
}

function getMilestoneStars(percent: number): number {
  if (percent >= 75) return 3
  if (percent >= 50) return 2
  if (percent >= 25) return 1
  return 0
}

function ProgressRing({ module }: { module: ModuleProgress }) {
  const stars = getMilestoneStars(module.completionPercent)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        {/* Background ring */}
        <CircularProgress
          variant="determinate"
          value={100}
          size={72}
          thickness={4}
          sx={{ color: 'action.disabledBackground' }}
        />
        {/* Foreground ring */}
        <CircularProgress
          variant="determinate"
          value={module.completionPercent}
          size={72}
          thickness={4}
          sx={{
            position: 'absolute',
            left: 0,
            color: module.completionPercent >= 100 ? 'success.main' : 'primary.main',
          }}
        />
        {/* Center text */}
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="caption" fontWeight={700} color="text.primary">
            {Math.round(module.completionPercent)}%
          </Typography>
        </Box>
      </Box>
      {/* Module name */}
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ maxWidth: 80, textAlign: 'center', lineHeight: 1.2 }}
      >
        {module.moduleName}
      </Typography>
      {/* Milestone stars */}
      {stars > 0 && (
        <Box sx={{ display: 'flex', gap: 0.25 }}>
          {Array.from({ length: stars }).map((_, i) => (
            <StarIcon key={i} sx={{ fontSize: 12, color: 'warning.main' }} />
          ))}
        </Box>
      )}
    </Box>
  )
}

export function ProgressRings({ modules }: ProgressRingsProps) {
  if (modules.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No modules started yet.
      </Typography>
    )
  }

  return (
    <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 2 }}>
      {modules.map((mod) => (
        <ProgressRing key={mod.moduleId} module={mod} />
      ))}
    </Stack>
  )
}

export default ProgressRings
