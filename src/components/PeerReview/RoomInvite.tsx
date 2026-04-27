/**
 * RoomInvite — UI for inviting peers to a review room.
 *
 * @module RoomInvite
 */

import React, { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import type { RoomState } from '../../yjs/PeerReviewRoomProvider'

export interface RoomInviteProps {
  /** Room state from Yjs provider (provides invitedUserIds). */
  roomState?: RoomState
  /** Standalone invited users list (alternative to roomState). */
  invitedUsers?: string[]
  onInvite: (userId: string) => void
  /** Optional remove handler (only in standalone mode). */
  onRemove?: (userId: string) => void
}

export function RoomInvite({ roomState, invitedUsers, onInvite, onRemove }: RoomInviteProps) {
  const [username, setUsername] = useState('')
  const invited = roomState?.invitedUserIds ?? invitedUsers ?? []

  const handleInvite = () => {
    const trimmed = username.trim()
    if (!trimmed) return
    onInvite(trimmed)
    setUsername('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleInvite()
    }
  }

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Invite Peers
      </Typography>

      <Stack direction="row" spacing={1} mb={2}>
        <TextField
          size="small"
          placeholder="Enter username or email"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={handleKeyDown}
          fullWidth
        />
        <Button
          variant="outlined"
          startIcon={<PersonAddIcon />}
          onClick={handleInvite}
          disabled={!username.trim()}
        >
          Invite
        </Button>
      </Stack>

      {invited.length > 0 && (
        <Box>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Invited:
          </Typography>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            {invited.map((userId) => (
              <Chip
                key={userId}
                label={userId}
                size="small"
                variant="outlined"
                onDelete={onRemove ? () => onRemove(userId) : undefined}
              />
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  )
}

export default RoomInvite
