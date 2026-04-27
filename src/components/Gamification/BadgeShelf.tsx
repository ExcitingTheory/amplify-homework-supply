/**
 * BadgeShelf — Grid display of achievement badges.
 * Earned badges show in full color; unearned badges are grayed out with a lock overlay.
 *
 * @module BadgeShelf
 */

import React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Tooltip from '@mui/material/Tooltip'
import Avatar from '@mui/material/Avatar'
import Popover from '@mui/material/Popover'
import Stack from '@mui/material/Stack'
import LockIcon from '@mui/icons-material/Lock'

export type BadgeType =
  | 'FIRST_SUBMISSION'
  | 'GOOD_EYE'
  | 'QUICK_DRAW'
  | 'SHARPSHOOTER'
  | 'CONSISTENT'
  | 'TEAM_PLAYER'
  | 'DEEP_THINKER'
  | 'TOP_OF_CLASS'
  | 'PERFECTIONIST'

interface BadgeDefinition {
  emoji: string
  name: string
  description: string
}

const BADGE_DEFINITIONS: Record<BadgeType, BadgeDefinition> = {
  FIRST_SUBMISSION: { emoji: '🎯', name: 'First Submission', description: 'Submitted your first homework' },
  GOOD_EYE: { emoji: '👁️', name: 'Good Eye', description: 'Revised work after AI feedback' },
  QUICK_DRAW: { emoji: '⚡', name: 'Quick Draw', description: 'Submitted before the due date' },
  SHARPSHOOTER: { emoji: '🎯', name: 'Sharpshooter', description: 'Scored 90%+ on an assignment' },
  CONSISTENT: { emoji: '📅', name: 'Consistent', description: 'Maintained a 7-day streak' },
  TEAM_PLAYER: { emoji: '🤝', name: 'Team Player', description: 'Completed a peer review' },
  DEEP_THINKER: { emoji: '🧠', name: 'Deep Thinker', description: 'Completed all blocks in a unit' },
  TOP_OF_CLASS: { emoji: '🏆', name: 'Top of Class', description: 'Reached #1 on the leaderboard' },
  PERFECTIONIST: { emoji: '💎', name: 'Perfectionist', description: 'Scored 100% on an assignment' },
}

const ALL_BADGE_TYPES: BadgeType[] = Object.keys(BADGE_DEFINITIONS) as BadgeType[]

export interface EarnedBadge {
  badgeType: BadgeType
  awardedAt: string
  /** The unit or entity ID this badge was earned in. */
  sourceId?: string | null
}

export interface BadgeShelfProps {
  /** Array of badges the student has earned. */
  earnedBadges: EarnedBadge[]
  /** Number of columns in the grid. Defaults to 3. */
  columns?: number
  /** When true, only earned badges are rendered (unearned are hidden). Defaults to false. */
  earnedOnly?: boolean
}

export function BadgeShelf({ earnedBadges, columns = 3, earnedOnly = false }: BadgeShelfProps) {
  const earnedSet = new Set(earnedBadges.map(b => b.badgeType))

  // Count how many times each badge was earned
  const earnedCounts = earnedBadges.reduce<Record<string, number>>((acc, b) => {
    acc[b.badgeType] = (acc[b.badgeType] || 0) + 1
    return acc
  }, {})

  const badgesToShow = earnedOnly
    ? ALL_BADGE_TYPES.filter(type => earnedSet.has(type))
    : ALL_BADGE_TYPES

  // Popover state
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null)
  const [activeBadge, setActiveBadge] = React.useState<BadgeType | null>(null)

  const handleClick = (event: React.MouseEvent<HTMLElement>, type: BadgeType) => {
    setAnchorEl(event.currentTarget)
    setActiveBadge(type)
  }

  const handleClose = () => {
    setAnchorEl(null)
    setActiveBadge(null)
  }

  const activeDef = activeBadge ? BADGE_DEFINITIONS[activeBadge] : null
  const activeEarned = activeBadge ? earnedBadges.find(b => b.badgeType === activeBadge) : null
  const activeIsEarned = activeBadge ? earnedSet.has(activeBadge) : false
  const activeCount = activeBadge ? (earnedCounts[activeBadge] || 0) : 0

  return (
    <>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: 1.5,
          justifyItems: 'center',
        }}
      >
        {badgesToShow.map((type) => {
          const def = BADGE_DEFINITIONS[type]
          const isEarned = earnedSet.has(type)
          const count = earnedCounts[type] || 0

          return (
            <Tooltip key={type} title={def.name} arrow>
              <Box
                onClick={(e) => handleClick(e, type)}
                sx={{
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: isEarned ? 'scale(1.1)' : 'none' },
                }}
              >
                <Avatar
                  sx={{
                    width: 56,
                    height: 56,
                    fontSize: '1.5rem',
                    bgcolor: isEarned ? 'action.selected' : 'action.disabledBackground',
                    opacity: isEarned ? 1 : 0.5,
                    border: isEarned ? '2px solid' : 'none',
                    borderColor: 'primary.main',
                  }}
                >
                  {isEarned ? def.emoji : <LockIcon sx={{ fontSize: '1.25rem', color: 'text.disabled' }} />}
                </Avatar>
                {isEarned && count > 1 && (
                  <Typography
                    variant="caption"
                    sx={{
                      position: 'absolute',
                      bottom: -2,
                      right: -2,
                      fontSize: '0.625rem',
                      fontWeight: 800,
                      color: 'primary.main',
                      bgcolor: 'background.paper',
                      borderRadius: '50%',
                      width: 18,
                      height: 18,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 1,
                      lineHeight: 1,
                    }}
                  >
                    ×{count}
                  </Typography>
                )}
              </Box>
            </Tooltip>
          )
        })}
      </Box>

      {/* Detail popover */}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        slotProps={{ paper: { sx: { p: 2, maxWidth: 240, borderRadius: 2 } } }}
      >
        {activeDef && (
          <Stack spacing={0.5} alignItems="center">
            <Typography sx={{ fontSize: '2rem', lineHeight: 1 }}>{activeDef.emoji}</Typography>
            <Typography variant="subtitle2" fontWeight={700}>{activeDef.name}</Typography>
            <Typography variant="caption" color="text.secondary" textAlign="center">
              {activeDef.description}
            </Typography>
            {activeIsEarned && activeEarned && (
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                Earned {new Date(activeEarned.awardedAt).toLocaleDateString()}
              </Typography>
            )}
            {activeIsEarned && activeCount > 1 && (
              <Typography variant="caption" fontWeight={700} color="primary.main">
                Earned {activeCount} times
              </Typography>
            )}
            {!activeIsEarned && (
              <Typography variant="caption" color="text.disabled" fontStyle="italic">
                Locked
              </Typography>
            )}
          </Stack>
        )}
      </Popover>
    </>
  )
}

export default BadgeShelf
