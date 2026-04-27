/**
 * LevelBadge — Displays a student's current level as an education-themed
 * icon with an XP progress bar toward the next level.
 *
 * @module LevelBadge
 */

import React from 'react'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import LinearProgress from '@mui/material/LinearProgress'
import Chip from '@mui/material/Chip'
import AutoStoriesIcon from '@mui/icons-material/AutoStories'
import TravelExploreIcon from '@mui/icons-material/TravelExplore'
import HistoryEduIcon from '@mui/icons-material/HistoryEdu'
import Diversity3Icon from '@mui/icons-material/Diversity3'
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects'
import SchoolIcon from '@mui/icons-material/School'
import type { LevelInfo } from '../../utils/xpCalculation'

export interface LevelBadgeProps {
  /** Level information from XP context. */
  level: LevelInfo
  /** Whether to show the progress bar. Defaults to true. */
  showProgress?: boolean
  /** Size variant. Defaults to 'medium'. */
  size?: 'small' | 'medium'
}

const LEVEL_COLORS: Record<number, string> = {
  1: '#9e9e9e',   // Beginner - grey
  2: '#4caf50',   // Explorer - green
  3: '#2196f3',   // Practitioner - blue
  4: '#9c27b0',   // Contributor - purple
  5: '#ff9800',   // Expert - orange
  6: '#f44336',   // Master - red
}

const LEVEL_ICONS: Record<number, React.ReactElement> = {
  1: <AutoStoriesIcon fontSize="small" />,     // Beginner — open book
  2: <TravelExploreIcon fontSize="small" />,   // Explorer — globe search
  3: <HistoryEduIcon fontSize="small" />,      // Practitioner — quill
  4: <Diversity3Icon fontSize="small" />,      // Contributor — group
  5: <EmojiObjectsIcon fontSize="small" />,    // Expert — lightbulb
  6: <SchoolIcon fontSize="small" />,          // Master — graduation cap
}

export function LevelBadge({ level, showProgress = true, size = 'medium' }: LevelBadgeProps) {
  const color = LEVEL_COLORS[level.level] || LEVEL_COLORS[1]
  const icon = LEVEL_ICONS[level.level] || LEVEL_ICONS[1]
  const isSmall = size === 'small'

  const tooltipText = level.xpForNextLevel !== null
    ? `Lvl. ${level.level} · ${level.label} — ${level.progress}% to Lvl. ${level.level + 1}`
    : `Lvl. ${level.level} · ${level.label}`

  return (
    <Tooltip title={tooltipText} arrow>
      <Box sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
        <Chip
          icon={icon}
          label={`Lvl. ${level.level}`}
          size={isSmall ? 'small' : 'medium'}
          sx={{
            bgcolor: color,
            color: '#fff',
            fontWeight: 700,
            fontSize: isSmall ? '0.75rem' : '0.875rem',
            '& .MuiChip-icon': { color: '#fff' },
          }}
        />
        {showProgress && level.xpForNextLevel !== null && (
          <Box sx={{ width: '100%', minWidth: isSmall ? 60 : 100 }}>
            <LinearProgress
              variant="determinate"
              value={level.progress}
              sx={{
                height: isSmall ? 4 : 6,
                borderRadius: 3,
                bgcolor: 'action.hover',
                '& .MuiLinearProgress-bar': { bgcolor: color },
              }}
            />
          </Box>
        )}
      </Box>
    </Tooltip>
  )
}

export default LevelBadge
