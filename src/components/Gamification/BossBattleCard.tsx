/**
 * BossBattleCard — Full boss battle UI with role-based phase progression,
 * narrative flavor, and contribution tracking.
 *
 * Extends GroupChallengeCard with multi-phase boss encounters:
 * - Phase 1: Core questions (all roles)
 * - Phase 2: Tests / code review (specialist roles)
 * - Phase 3: Final challenge (unlocked when prior phases complete)
 *
 * @module BossBattleCard
 */

import React from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import LinearProgress from '@mui/material/LinearProgress'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Stepper from '@mui/material/Stepper'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import Avatar from '@mui/material/Avatar'
import Tooltip from '@mui/material/Tooltip'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import TimerIcon from '@mui/icons-material/Timer'
import ShieldIcon from '@mui/icons-material/Shield'
import SportsKabaddiIcon from '@mui/icons-material/SportsKabaddi'

// ============================================================================
// Types
// ============================================================================

export type BossPhaseStatus = 'LOCKED' | 'ACTIVE' | 'COMPLETED'

export interface BossPhase {
  id: string
  title: string
  description: string
  status: BossPhaseStatus
  targetXP: number
  currentXP: number
  /** Roles that can contribute to this phase */
  requiredRoles?: string[]
}

export interface BossContributor {
  userId: string
  displayName: string
  avatarUrl?: string
  xpContributed: number
  role?: string
}

export interface BossBattleCardProps {
  /** Boss encounter title */
  title: string
  /** Narrative description */
  narrative?: string
  /** Battle phases */
  phases: BossPhase[]
  /** Total boss HP (sum of all phase targets) */
  totalHP: number
  /** Total damage dealt (sum of all contributions) */
  totalDamage: number
  /** Deadline */
  deadline?: string
  /** Whether the boss is active */
  active: boolean
  /** Bonus multiplier on victory */
  bonusMultiplier?: number
  /** Top contributors */
  contributors?: BossContributor[]
  /** Max contributors to show */
  maxContributorsShown?: number
  /** Current user's role */
  currentUserRole?: string
}

// ============================================================================
// Helpers
// ============================================================================

function formatTimeRemaining(deadline: string): string {
  const diff = new Date(deadline).getTime() - Date.now()
  if (diff <= 0) return 'Expired'
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}d ${hours % 24}h left`
  return `${hours}h left`
}

function getActivePhaseIndex(phases: BossPhase[]): number {
  const idx = phases.findIndex((p) => p.status === 'ACTIVE')
  return idx >= 0 ? idx : phases.length
}

// ============================================================================
// Component
// ============================================================================

export function BossBattleCard({
  title,
  narrative,
  phases,
  totalHP,
  totalDamage,
  deadline,
  active,
  bonusMultiplier = 2.0,
  contributors = [],
  maxContributorsShown = 5,
  currentUserRole,
}: BossBattleCardProps) {
  const overallProgress = totalHP > 0 ? Math.min(100, Math.round((totalDamage / totalHP) * 100)) : 0
  const defeated = totalDamage >= totalHP
  const activePhaseIdx = getActivePhaseIndex(phases)

  return (
    <Card
      variant="outlined"
      sx={{
        opacity: active ? 1 : 0.7,
        border: defeated ? '2px solid' : '1px solid',
        borderColor: defeated ? 'success.main' : 'divider',
        background: active
          ? 'linear-gradient(135deg, rgba(211,47,47,0.04) 0%, rgba(156,39,176,0.04) 100%)'
          : undefined,
      }}
    >
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SportsKabaddiIcon color={defeated ? 'success' : 'error'} />
            <Typography variant="h6" fontWeight={700}>
              {title}
            </Typography>
          </Box>
          <Stack direction="row" spacing={0.5}>
            {bonusMultiplier > 1 && (
              <Chip
                label={`${bonusMultiplier}× bonus`}
                size="small"
                color="warning"
                sx={{ height: 22, fontSize: '0.75rem' }}
              />
            )}
            {currentUserRole && (
              <Chip
                icon={<ShieldIcon sx={{ fontSize: 14 }} />}
                label={currentUserRole}
                size="small"
                variant="outlined"
                sx={{ height: 22, fontSize: '0.75rem' }}
              />
            )}
          </Stack>
        </Box>

        {/* Narrative */}
        {narrative && (
          <Typography
            variant="body2"
            sx={{ fontStyle: 'italic', color: 'text.secondary', mb: 1.5, lineHeight: 1.5 }}
          >
            &ldquo;{narrative}&rdquo;
          </Typography>
        )}

        {/* Overall HP bar */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              {defeated ? '💀 Defeated!' : `Boss HP: ${totalDamage.toLocaleString()} / ${totalHP.toLocaleString()}`}
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {overallProgress}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={overallProgress}
            color={defeated ? 'success' : 'error'}
            sx={{ height: 12, borderRadius: 6 }}
          />
        </Box>

        {/* Phase stepper */}
        {phases.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Stepper activeStep={activePhaseIdx} alternativeLabel>
              {phases.map((phase) => (
                <Step key={phase.id} completed={phase.status === 'COMPLETED'}>
                  <StepLabel
                    optional={
                      <Typography variant="caption" color="text.secondary">
                        {phase.currentXP}/{phase.targetXP} XP
                      </Typography>
                    }
                  >
                    {phase.title}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
        )}

        {/* Active phase detail */}
        {phases[activePhaseIdx] && (
          <Box sx={{ bgcolor: 'action.hover', borderRadius: 1, p: 1.5, mb: 1.5 }}>
            <Typography variant="subtitle2" gutterBottom>
              Current Phase: {phases[activePhaseIdx].title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {phases[activePhaseIdx].description}
            </Typography>
            {phases[activePhaseIdx].requiredRoles && phases[activePhaseIdx].requiredRoles!.length > 0 && (
              <Stack direction="row" spacing={0.5}>
                {phases[activePhaseIdx].requiredRoles!.map((role) => (
                  <Chip
                    key={role}
                    label={role}
                    size="small"
                    variant="outlined"
                    color={role === currentUserRole ? 'primary' : 'default'}
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                ))}
              </Stack>
            )}
          </Box>
        )}

        {/* Contributors + deadline */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {contributors.length > 0 && (
            <Stack direction="row" spacing={-1}>
              {contributors.slice(0, maxContributorsShown).map((c) => (
                <Tooltip key={c.userId} title={`${c.displayName}: ${c.xpContributed} XP`}>
                  <Avatar
                    src={c.avatarUrl}
                    sx={{ width: 28, height: 28, fontSize: '0.75rem', border: '2px solid white' }}
                  >
                    {c.displayName.charAt(0)}
                  </Avatar>
                </Tooltip>
              ))}
              {contributors.length > maxContributorsShown && (
                <Avatar sx={{ width: 28, height: 28, fontSize: '0.65rem', bgcolor: 'grey.400' }}>
                  +{contributors.length - maxContributorsShown}
                </Avatar>
              )}
            </Stack>
          )}
          {deadline && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <TimerIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {formatTimeRemaining(deadline)}
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  )
}

export default BossBattleCard
