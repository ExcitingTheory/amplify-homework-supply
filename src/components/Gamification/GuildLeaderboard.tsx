/**
 * GuildLeaderboard — Ranked list of guilds with crests, XP, and member counts.
 *
 * @module GuildLeaderboard
 */

import React from 'react'
import Link from 'next/link'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Chip from '@mui/material/Chip'
import { GuildCrest } from './GuildCrest'

export interface GuildLeaderboardEntry {
  id: string
  name: string
  totalXP: number
  memberCount: number
}

export interface GuildLeaderboardProps {
  guilds: GuildLeaderboardEntry[]
  /** ID of the student's guild to highlight */
  myGuildId?: string
}

const RANK_EMOJI: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
}

export function GuildLeaderboard({ guilds, myGuildId }: GuildLeaderboardProps) {
  if (guilds.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="text.secondary">No guilds yet.</Typography>
      </Box>
    )
  }

  return (
    <List disablePadding>
      {guilds.map((guild, idx) => {
        const rank = idx + 1
        const isMine = guild.id === myGuildId

        return (
          <ListItem
            key={guild.id}
            disablePadding
            sx={{
              bgcolor: isMine ? 'action.selected' : 'transparent',
              borderRadius: 1,
              mb: 0.5,
            }}
          >
            <ListItemButton component={Link} href={`/guild/${guild.id}`}>
            <Box sx={{ mr: 1.5, minWidth: 28, textAlign: 'center' }}>
              <Typography variant="body2" fontWeight={700}>
                {RANK_EMOJI[rank] || `#${rank}`}
              </Typography>
            </Box>
            <ListItemAvatar>
              <GuildCrest
                guildId={guild.id}
                guildName={guild.name}
                size="small"
                showName={false}
              />
            </ListItemAvatar>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {guild.name}
                  </Typography>
                  {isMine && (
                    <Chip label="My Guild" size="small" color="primary" sx={{ height: 20, fontSize: '0.7rem' }} />
                  )}
                </Box>
              }
              secondary={`${guild.totalXP.toLocaleString()} XP · ${guild.memberCount} member${guild.memberCount !== 1 ? 's' : ''}`}
            />
            </ListItemButton>
          </ListItem>
        )
      })}
    </List>
  )
}

export default GuildLeaderboard
