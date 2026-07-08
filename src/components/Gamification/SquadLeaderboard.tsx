/**
 * SquadLeaderboard — Ranked list of squads with crests, XP, and member avatars.
 *
 * Layout per row: [Rank] [Crest] [Name + XP] ... [Member Avatars →]
 *
 * @module SquadLeaderboard
 */

import React from 'react'
import Link from 'next/link'
import Avatar from '@mui/material/Avatar'
import AvatarGroup from '@mui/material/AvatarGroup'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemButton from '@mui/material/ListItemButton'
import Chip from '@mui/material/Chip'
import { SquadCrest } from './SquadCrest'
import { AvatarDisplay } from './AvatarDisplay'
import type { AvatarStyleTier, AvatarOverrides } from './DiceBearAvatar'

export interface SquadMemberAvatar {
  studentId: string
  avatarStyle?: AvatarStyleTier
  avatarOverrides?: AvatarOverrides
  avatarSeed?: string
}

export interface SquadLeaderboardEntry {
  id: string
  name: string
  totalXP: number
  memberCount: number
  /** Section/cohort this squad belongs to */
  cohortId?: string
  /** Resolved section name for display */
  sectionName?: string
  /** Denormalized member avatar configs for display */
  members?: SquadMemberAvatar[]
}

export type SortField = 'xp' | 'name' | 'section'
export type GroupBy = 'none' | 'section'

export interface SquadLeaderboardProps {
  squads: SquadLeaderboardEntry[]
  /** ID of the student's squad to highlight */
  mySquadId?: string
  /** Max member avatars to show per row before +N overflow. Defaults to 5. */
  maxAvatars?: number
  /** Multi-select filter: only show squads whose names match */
  nameFilter?: string[]
  /** Current sort field */
  sortBy?: SortField
  /** Group rows by section */
  groupBy?: GroupBy
}

const RANK_EMOJI: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
}

export function SquadLeaderboard({
  squads,
  mySquadId,
  maxAvatars = 5,
  nameFilter = [],
  sortBy = 'xp',
  groupBy = 'none',
}: SquadLeaderboardProps) {
  // Apply name filter
  const filtered = React.useMemo(() => {
    if (nameFilter.length === 0) return squads
    return squads.filter((s) => nameFilter.includes(s.name))
  }, [squads, nameFilter])

  // Apply sorting
  const sorted = React.useMemo(() => {
    const copy = [...filtered]
    switch (sortBy) {
      case 'name':
        return copy.sort((a, b) => a.name.localeCompare(b.name))
      case 'section':
        return copy.sort((a, b) => (a.sectionName || '').localeCompare(b.sectionName || ''))
      case 'xp':
      default:
        return copy.sort((a, b) => b.totalXP - a.totalXP)
    }
  }, [filtered, sortBy])

  // Group by section if requested
  const grouped = React.useMemo(() => {
    if (groupBy !== 'section') return [{ label: null, squads: sorted }]
    const map = new Map<string, SquadLeaderboardEntry[]>()
    for (const squad of sorted) {
      const key = squad.sectionName || 'Unknown Section'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(squad)
    }
    // Sort groups by total XP of best squad in group
    return Array.from(map.entries())
      .sort(([, a], [, b]) => {
        const maxA = Math.max(...a.map((s) => s.totalXP))
        const maxB = Math.max(...b.map((s) => s.totalXP))
        return maxB - maxA
      })
      .map(([label, squads]) => ({ label, squads }))
  }, [sorted, groupBy])

  if (filtered.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="text.secondary">No squads yet.</Typography>
      </Box>
    )
  }

  let globalRank = 0

  return (
    <List disablePadding>
      {grouped.map((group) => (
        <React.Fragment key={group.label || '__all'}>
          {group.label && (
            <Box sx={{ px: 2, pt: 2, pb: 0.5 }}>
              <Typography variant="overline" color="text.secondary" fontWeight={700}>
                {group.label}
              </Typography>
            </Box>
          )}
          {group.squads.map((squad) => {
            globalRank++
            const rank = globalRank
            const isMine = squad.id === mySquadId

            return (
              <ListItem
                key={squad.id}
                disablePadding
                sx={{
                  bgcolor: isMine ? 'action.selected' : 'transparent',
                  borderRadius: 1,
                  mb: 0.5,
                }}
              >
                <ListItemButton
                  component={Link}
                  href={`/squad/${squad.id}`}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1.5 }}
                >
                  {/* Rank */}
                  <Box sx={{ mr: 1, minWidth: 28, textAlign: 'center', flexShrink: 0 }}>
                    <Typography variant="body2" fontWeight={700}>
                      {RANK_EMOJI[rank] || `#${rank}`}
                    </Typography>
                  </Box>

                  {/* Crest (left side) */}
                  <ListItemAvatar sx={{ minWidth: 48, flexShrink: 0 }}>
                    <SquadCrest
                      squadId={squad.id}
                      squadName={squad.name}
                      size="small"
                      showName={false}
                    />
                  </ListItemAvatar>

                  {/* Name + members (center, flexible) */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle2" fontWeight={600} noWrap>
                        {squad.name}
                      </Typography>
                      {isMine && (
                        <Chip label="My Squad" size="small" color="primary" sx={{ height: 20, fontSize: '0.7rem' }} />
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                      <Typography variant="caption" color="text.secondary">
                        {squad.memberCount} member{squad.memberCount !== 1 ? 's' : ''}
                      </Typography>
                      {squad.sectionName && (
                        <Chip
                          label={squad.sectionName}
                          size="small"
                          variant="outlined"
                          sx={{ height: 18, fontSize: '0.65rem', ml: 0.5 }}
                        />
                      )}
                      {squad.members && squad.members.length > 0 && (
                        <AvatarGroup
                          max={maxAvatars}
                          sx={{
                            ml: 0.5,
                            '& .MuiAvatar-root': { width: 20, height: 20, fontSize: '0.6rem' },
                          }}
                        >
                          {squad.members.map((member) => (
                            <Avatar key={member.studentId} sx={{ width: 20, height: 20, p: 0, overflow: 'visible' }}>
                              <AvatarDisplay
                                seed={member.avatarSeed || member.studentId}
                                size={20}
                                style={member.avatarStyle || 'simple'}
                                overrides={member.avatarOverrides}
                              />
                            </Avatar>
                          ))}
                        </AvatarGroup>
                      )}
                    </Box>
                  </Box>

                  {/* XP (far right) */}
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    color="primary"
                    sx={{ flexShrink: 0, textAlign: 'right', minWidth: 60 }}
                  >
                    {squad.totalXP.toLocaleString()} XP
                  </Typography>
                </ListItemButton>
              </ListItem>
            )
          })}
        </React.Fragment>
      ))}
    </List>
  )
    </List>
  )
}

export default SquadLeaderboard
