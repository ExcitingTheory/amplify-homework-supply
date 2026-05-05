/**
 * GuildJoinPanel — UI for browsing available guilds, joining one,
 * or viewing current guild membership. Shows guild crest, member count,
 * and join/leave actions.
 *
 * @module GuildJoinPanel
 */

import React, { useState, useCallback } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemText from '@mui/material/ListItemText'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import GroupIcon from '@mui/icons-material/Group'
import ExitToAppIcon from '@mui/icons-material/ExitToApp'
import StarIcon from '@mui/icons-material/Star'
import { GuildCrest } from './GuildCrest'
import { DiceBearAvatar } from './DiceBearAvatar'
import type { AvatarStyleTier, AvatarOverrides } from './DiceBearAvatar'
import { ArmoriaShield } from './ArmoriaShield'
import { PixelSpriteMascot } from './PixelSpriteMascot'
import { NarrativeReader } from '../Editor3/NarrativeReader'

// ============================================================================
// Types
// ============================================================================

export interface GuildListEntry {
  id: string
  name: string
  totalXP: number
  memberCount: number
  description?: string
  crestSvg?: string | null
}

export interface GuildMemberEntry {
  id: string
  studentId: string
  role: 'LEADER' | 'MEMBER'
  joinedAt?: string
  displayName?: string
  avatarSeed?: string
  avatarStyle?: AvatarStyleTier
  avatarOverrides?: AvatarOverrides
}

export interface GuildJoinPanelProps {
  /** Available guilds to join */
  availableGuilds: GuildListEntry[]
  /** The student's current guild (null if not in one) */
  myGuild?: GuildListEntry | null
  /** Members of the student's current guild */
  myGuildMembers?: GuildMemberEntry[]
  /** Current student's ID (to identify leader status) */
  studentId: string
  /** Called when student joins a guild */
  onJoinGuild: (guildId: string) => void
  /** Called when student leaves their guild */
  onLeaveGuild: () => void
  /** Whether operations are loading */
  isLoading?: boolean
  /** Current student level (for PixelSprite stage) */
  level?: number
}

// ============================================================================
// Component
// ============================================================================

export function GuildJoinPanel({
  availableGuilds,
  myGuild = null,
  myGuildMembers = [],
  studentId,
  onJoinGuild,
  onLeaveGuild,
  isLoading = false,
  level = 1,
}: GuildJoinPanelProps) {
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [selectedGuild, setSelectedGuild] = useState<GuildListEntry | null>(null)

  const handleJoin = useCallback((guild: GuildListEntry) => {
    setSelectedGuild(guild)
  }, [])

  const handleConfirmJoin = useCallback(() => {
    if (selectedGuild) {
      onJoinGuild(selectedGuild.id)
      setSelectedGuild(null)
    }
  }, [selectedGuild, onJoinGuild])

  const handleLeave = useCallback(() => {
    onLeaveGuild()
    setConfirmLeave(false)
  }, [onLeaveGuild])

  const isLeader = myGuildMembers.find(
    (m) => m.studentId === studentId,
  )?.role === 'LEADER'

  // ── Current guild view ──────────────────────────────────────────────────
  if (myGuild) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <ArmoriaShield
              guildId={myGuild.id}
              guildName={myGuild.name}
              crestSvg={myGuild.crestSvg}
              size={72}
              showName={false}
            />
            <Box>
              <Typography variant="h6">{myGuild.name}</Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  icon={<GroupIcon />}
                  label={`${myGuild.memberCount} members`}
                  size="small"
                />
                <Chip
                  label={`${myGuild.totalXP} XP`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
                {isLeader && (
                  <Chip icon={<StarIcon />} label="Leader" size="small" color="warning" />
                )}
              </Stack>
              {myGuild.description && (
                myGuild.description.trim().startsWith('{') ? (
                  <NarrativeReader contentJson={myGuild.description} ariaLabel="Guild description" padding="0.25rem 0" />
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {myGuild.description}
                  </Typography>
                )
              )}
            </Box>
          </Stack>

          {/* Guild mascot */}
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <PixelSpriteMascot seed={myGuild.id} stage={Math.min(5, Math.ceil(level / 2))} size={48} />
          </Box>

          <Divider sx={{ my: 1 }} />

          {/* Members list */}
          <Typography variant="subtitle2" gutterBottom>
            Members
          </Typography>
          <List dense>
            {myGuildMembers.map((member) => (
              <ListItem key={member.id} disablePadding sx={{ py: 0.5 }}>
                <ListItemAvatar sx={{ minWidth: 36 }}>
                  <DiceBearAvatar seed={member.studentId} size={32} label={member.displayName || member.studentId} style={member.avatarStyle} overrides={member.avatarOverrides} />
                </ListItemAvatar>
                <ListItemText
                  primary={member.displayName || member.studentId}
                  secondary={member.role === 'LEADER' ? '⭐ Leader' : 'Member'}
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
        <CardActions>
          <Button
            startIcon={<ExitToAppIcon />}
            color="error"
            size="small"
            onClick={() => setConfirmLeave(true)}
            disabled={isLoading}
          >
            Leave Guild
          </Button>
        </CardActions>

        {/* Leave confirmation */}
        <Dialog open={confirmLeave} onClose={() => setConfirmLeave(false)}>
          <DialogTitle>Leave {myGuild.name}?</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to leave this guild? You can rejoin later if space is available.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmLeave(false)}>Cancel</Button>
            <Button onClick={handleLeave} color="error" variant="contained">
              Leave
            </Button>
          </DialogActions>
        </Dialog>
      </Card>
    )
  }

  // ── Guild browser (not in a guild) ─────────────────────────────────────
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Join a Guild
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Join a guild to collaborate with peers, earn bonus XP, and compete on the leaderboard.
      </Typography>

      {/* Create Guild section */}

      {availableGuilds.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          No guilds available yet.
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {availableGuilds.map((guild) => (
            <Card key={guild.id} variant="outlined">
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <GuildCrest guildId={guild.id} guildName={guild.name} size="small" showName={false} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2">{guild.name}</Typography>
                  <Stack direction="row" spacing={1}>
                    <Typography variant="caption" color="text.secondary">
                      {guild.memberCount} members
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {guild.totalXP} XP
                    </Typography>
                  </Stack>
                  {guild.description && (
                    guild.description.trim().startsWith('{') ? (
                      <NarrativeReader contentJson={guild.description} ariaLabel={`${guild.name} description`} padding="0.25rem 0" />
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        {guild.description}
                      </Typography>
                    )
                  )}
                </Box>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => handleJoin(guild)}
                  disabled={isLoading}
                >
                  Join
                </Button>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {/* Join confirmation dialog */}
      <Dialog open={!!selectedGuild} onClose={() => setSelectedGuild(null)}>
        <DialogTitle>Join {selectedGuild?.name}?</DialogTitle>
        <DialogContent>
          <Stack alignItems="center" spacing={2} sx={{ pt: 1 }}>
            {selectedGuild && (
              <GuildCrest
                guildId={selectedGuild.id}
                guildName={selectedGuild.name}
                size="large"
              />
            )}
            <Typography>
              You&apos;ll join as a member and start contributing XP to this guild.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedGuild(null)}>Cancel</Button>
          <Button onClick={handleConfirmJoin} variant="contained" disabled={isLoading}>
            Join Guild
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default GuildJoinPanel
