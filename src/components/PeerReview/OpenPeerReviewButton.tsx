/**
 * OpenPeerReviewButton — Button shown after homework completion
 * that creates a HomeworkRoom and opens peer review.
 *
 * @module OpenPeerReviewButton
 */

import React, { useState } from 'react'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Typography from '@mui/material/Typography'
import Skeleton from '@mui/material/Skeleton'
import RateReviewIcon from '@mui/icons-material/RateReview'
import { RoomInvite } from './RoomInvite'

export interface OpenPeerReviewButtonProps {
  gradeId: string
  disabled?: boolean
  onCreateRoom: (gradeId: string, invitedUserIds: string[]) => Promise<string>
  onRoomCreated?: (roomId: string) => void
}

export function OpenPeerReviewButton({
  gradeId,
  disabled = false,
  onCreateRoom,
  onRoomCreated,
}: OpenPeerReviewButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [invitedUsers, setInvitedUsers] = useState<string[]>([])
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleOpen = () => {
    setDialogOpen(true)
    setError(null)
  }

  const handleClose = () => {
    if (!creating) {
      setDialogOpen(false)
      setInvitedUsers([])
      setError(null)
    }
  }

  const handleInvite = (username: string) => {
    if (!invitedUsers.includes(username)) {
      setInvitedUsers((prev) => [...prev, username])
    }
  }

  const handleRemoveInvite = (username: string) => {
    setInvitedUsers((prev) => prev.filter((u) => u !== username))
  }

  const handleCreate = async () => {
    setCreating(true)
    setError(null)
    try {
      const roomId = await onCreateRoom(gradeId, invitedUsers)
      setDialogOpen(false)
      setInvitedUsers([])
      onRoomCreated?.(roomId)
    } catch (err: any) {
      setError(err?.message || 'Failed to create review room')
    } finally {
      setCreating(false)
    }
  }

  return (
    <>
      <Button
        variant="outlined"
        color="primary"
        startIcon={<RateReviewIcon />}
        onClick={handleOpen}
        disabled={disabled}
      >
        Open for Peer Review
      </Button>

      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Open Peer Review</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Invite classmates to review your homework. They will be able to view
            your answers and provide feedback through a chat room.
          </Typography>

          <RoomInvite
            invitedUsers={invitedUsers}
            onInvite={handleInvite}
            onRemove={handleRemoveInvite}
          />

          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={creating}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={creating}
            startIcon={creating ? <Skeleton variant="circular" width={16} height={16} /> : undefined}
          >
            {creating ? 'Creating...' : 'Create Room'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default OpenPeerReviewButton
