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
import Popover from '@mui/material/Popover'
import Stack from '@mui/material/Stack'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import { BadgeIcon } from './BadgeIcon'
import { getBadgeConfig } from './badgeRegistry'
import { getAntiBadgeConfig } from './antiBadgeRegistry'
import type { AntiBadgeConfig } from './antiBadgeRegistry'

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
  // Avatar unlock badges
  | 'AVATAR_COLORS'
  | 'AVATAR_DETAILED'
  | 'AVATAR_ACCESSORIES'
  | 'AVATAR_PORTRAIT'
  // Bot Whisperer tiered badges
  | 'BOT_WHISPERER_I'
  | 'BOT_WHISPERER_II'
  | 'BOT_WHISPERER_III'
  | 'BOT_WHISPERER_IV'
  // Avatar powerup badges
  | 'AVATAR_GLOW'
  // Storybook documentation promo badges
  | 'DOCS_EXPLORER'
  | 'INSTRUCTOR_ONBOARD'
  | 'LEARNER_ONBOARD'
  | 'TRANSLATOR_ONBOARD'
  | 'A11Y_CHAMPION'
  | 'DOCS_CHAMPION'

interface BadgeDefinition {
  name: string
  description: string
}

const BADGE_DEFINITIONS: Record<BadgeType, BadgeDefinition> = {
  FIRST_SUBMISSION: { name: 'First Submission', description: 'Submitted your first homework' },
  GOOD_EYE: { name: 'Good Eye', description: 'Revised work after AI feedback' },
  QUICK_DRAW: { name: 'Quick Draw', description: 'Submitted before the due date' },
  SHARPSHOOTER: { name: 'Sharpshooter', description: 'Scored 90%+ on an assignment' },
  CONSISTENT: { name: 'Consistent', description: 'Maintained a 7-day streak' },
  TEAM_PLAYER: { name: 'Team Player', description: 'Completed a peer review' },
  DEEP_THINKER: { name: 'Deep Thinker', description: 'Completed all blocks in a unit' },
  TOP_OF_CLASS: { name: 'Top of Class', description: 'Reached #1 on the leaderboard' },
  PERFECTIONIST: { name: 'Perfectionist', description: 'Scored 100% on an assignment' },
  // Avatar unlock badges
  AVATAR_COLORS: { name: 'Color Unlocked', description: 'Reached Level 2 — unlock avatar color picker' },
  AVATAR_DETAILED: { name: 'New Look', description: 'Reached Level 3 — unlocked detailed avatar style' },
  AVATAR_ACCESSORIES: { name: 'Accessorized', description: 'Reached Level 4 — unlock avatar accessories' },
  AVATAR_PORTRAIT: { name: 'Portrait Mode', description: 'Reached Level 5 — unlocked portrait avatar style & full customizer' },
  // Bot Whisperer tiered badges
  BOT_WHISPERER_I: { name: 'Bot Whisperer I', description: 'Had your first real conversation with the AI tutor' },
  BOT_WHISPERER_II: { name: 'Bot Whisperer II', description: 'Earned Deep Thinker — upgraded your bot\'s style' },
  BOT_WHISPERER_III: { name: 'Bot Whisperer III', description: 'Used AI across 5 units — choose your bot\'s eyes & mouth' },
  BOT_WHISPERER_IV: { name: 'Bot Whisperer IV', description: 'AI mastery achieved — full bot customization unlocked' },
  // Avatar powerup badges
  AVATAR_GLOW: { name: 'Glow Ring', description: 'Level up! — rotating gradient ring around your avatar for 24 hours' },
  // Storybook documentation promo badges
  DOCS_EXPLORER: { name: 'Docs Explorer', description: 'Visited the Storybook documentation and started onboarding' },
  INSTRUCTOR_ONBOARD: { name: 'Instructor Certified', description: 'Completed the instructor onboarding in Storybook' },
  LEARNER_ONBOARD: { name: 'Learner Certified', description: 'Completed the learner onboarding in Storybook' },
  TRANSLATOR_ONBOARD: { name: 'Translator Certified', description: 'Completed the translator onboarding in Storybook' },
  A11Y_CHAMPION: { name: 'Accessibility Champion', description: 'Completed accessibility-related tasks in Storybook' },
  DOCS_CHAMPION: { name: 'Documentation Champion', description: 'Completed all onboarding paths — instructor, learner, and translator' },
}

const ALL_BADGE_TYPES: BadgeType[] = Object.keys(BADGE_DEFINITIONS) as BadgeType[]

export interface EarnedBadge {
  badgeType: BadgeType | string
  awardedAt: string
  /** The unit or entity ID this badge was earned in. */
  sourceId?: string | null
  /** Number of times this badge has been earned (from model count field). */
  count?: number
  /** Whether this is an anti-badge (earned for dubious achievements). */
  isAnti?: boolean
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
  // Split earned badges into regular and anti
  const regularEarned = earnedBadges.filter(b => !b.isAnti)
  const antiEarned = earnedBadges.filter(b => b.isAnti)

  const earnedSet = new Set(regularEarned.map(b => b.badgeType))

  // Count how many times each badge was earned — prefer model count field, fall back to array duplicates
  const earnedCounts = earnedBadges.reduce<Record<string, number>>((acc, b) => {
    const badgeCount = b.count && b.count > 1 ? b.count : 1
    acc[b.badgeType] = (acc[b.badgeType] || 0) + badgeCount
    return acc
  }, {})

  const badgesToShow = earnedOnly
    ? ALL_BADGE_TYPES.filter(type => earnedSet.has(type))
    : ALL_BADGE_TYPES

  // Popover state
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null)
  const [activeBadge, setActiveBadge] = React.useState<string | null>(null)
  const [activeIsAnti, setActiveIsAnti] = React.useState(false)

  const handleClick = (event: React.MouseEvent<HTMLElement>, type: string, isAnti = false) => {
    setAnchorEl(event.currentTarget)
    setActiveBadge(type)
    setActiveIsAnti(isAnti)
  }

  const handleClose = () => {
    setAnchorEl(null)
    setActiveBadge(null)
    setActiveIsAnti(false)
  }

  const activeDef = activeBadge && !activeIsAnti ? BADGE_DEFINITIONS[activeBadge as BadgeType] : null
  const activeAntiConfig = activeBadge && activeIsAnti ? getAntiBadgeConfig(activeBadge) : null
  const activeEarned = activeBadge ? earnedBadges.find(b => b.badgeType === activeBadge) : null
  const activeIsEarned = activeBadge
    ? (activeIsAnti ? antiEarned.some(b => b.badgeType === activeBadge) : earnedSet.has(activeBadge as BadgeType))
    : false
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
                }}
              >
                <BadgeIcon
                  badgeType={type}
                  size={56}
                  earned={isEarned}
                  animate={isEarned}
                  drawIcon={isEarned}
                />
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

      {/* Anti-badges section */}
      {antiEarned.length > 0 && (
        <>
          <Divider sx={{ my: 2 }}>
            <Chip
              label="Anti-Badges"
              size="small"
              color="error"
              variant="outlined"
              sx={{ fontWeight: 700, fontSize: '0.7rem' }}
            />
          </Divider>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: `repeat(${columns}, 1fr)`,
              gap: 1.5,
              justifyItems: 'center',
            }}
          >
            {antiEarned.map((badge) => {
              const config = getAntiBadgeConfig(badge.badgeType)
              const count = earnedCounts[badge.badgeType] || 1
              if (!config) return null

              return (
                <Tooltip key={badge.badgeType} title={config.name} arrow>
                  <Box
                    onClick={(e) => handleClick(e, badge.badgeType, true)}
                    sx={{
                      position: 'relative',
                      cursor: 'pointer',
                      border: '2px solid',
                      borderColor: 'error.main',
                      borderRadius: '50%',
                      p: 0.25,
                    }}
                  >
                    <BadgeIcon
                      config={config}
                      size={56}
                      earned
                      animate
                      drawIcon
                    />
                    {count > 1 && (
                      <Typography
                        variant="caption"
                        sx={{
                          position: 'absolute',
                          bottom: -2,
                          right: -2,
                          fontSize: '0.625rem',
                          fontWeight: 800,
                          color: 'error.main',
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
        </>
      )}

      {/* Detail popover */}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        slotProps={{ paper: { sx: { p: 2, maxWidth: 260, borderRadius: 2 } } }}
      >
        {activeDef && !activeIsAnti && (
          <Stack spacing={0.5} alignItems="center">
            <BadgeIcon
              badgeType={activeBadge!}
              size={48}
              earned={activeIsEarned}
              animate={false}
              drawIcon={false}
            />
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
        {activeAntiConfig && activeIsAnti && (
          <Stack spacing={0.5} alignItems="center">
            <BadgeIcon
              config={activeAntiConfig}
              size={48}
              earned
              animate={false}
              drawIcon={false}
            />
            <Typography variant="subtitle2" fontWeight={700} color="error.main">
              {activeAntiConfig.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" textAlign="center">
              {activeAntiConfig.description}
            </Typography>
            {activeAntiConfig.debuff.shameText && (
              <Typography variant="caption" fontStyle="italic" color="error" textAlign="center" sx={{ opacity: 0.8 }}>
                &ldquo;{activeAntiConfig.debuff.shameText}&rdquo;
              </Typography>
            )}
            {activeAntiConfig.debuff.xpMultiplier != null && (
              <Chip
                label={`XP ×${activeAntiConfig.debuff.xpMultiplier} for ${activeAntiConfig.debuff.xpMultiplierDurationHours || 24}h`}
                size="small"
                color="error"
                variant="outlined"
                sx={{ fontSize: '0.65rem' }}
              />
            )}
            {activeAntiConfig.debuff.temporaryTitle && (
              <Chip
                label={`Title: "${activeAntiConfig.debuff.temporaryTitle}"`}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.65rem' }}
              />
            )}
            {activeAntiConfig.redeemable && activeAntiConfig.redemptionHint && (
              <Typography variant="caption" color="success.main" textAlign="center" sx={{ mt: 0.5 }}>
                Redeemable: {activeAntiConfig.redemptionHint}
              </Typography>
            )}
            {activeIsEarned && activeEarned && (
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                Received {new Date(activeEarned.awardedAt).toLocaleDateString()}
              </Typography>
            )}
            {activeCount > 1 && (
              <Typography variant="caption" fontWeight={700} color="error.main">
                Received {activeCount} times
              </Typography>
            )}
          </Stack>
        )}
      </Popover>
    </>
  )
}

export default BadgeShelf
