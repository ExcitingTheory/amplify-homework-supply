/**
 * PeerReviewInvitations — Lists pending peer review invitations for the current user.
 *
 * Queries HomeworkRoom records where the user's ID is in `invitedUserIds`
 * and status is OPEN or IN_REVIEW.
 *
 * @module PeerReviewInvitations
 */

import React, { useEffect, useState, useCallback } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction'
import Chip from '@mui/material/Chip'
import RateReviewIcon from '@mui/icons-material/RateReview'

export interface PeerReviewInvitation {
  id: string
  gradeId: string
  ownerId: string
  ownerDisplayName?: string
  unitName?: string
  status: 'OPEN' | 'IN_REVIEW' | 'REVIEW_COMPLETE'
  createdAt?: string
}

export interface PeerReviewInvitationsProps {
  invitations: PeerReviewInvitation[]
  onJoinReview: (roomId: string) => void
  loading?: boolean
}

const statusColors: Record<string, 'success' | 'warning' | 'default'> = {
  OPEN: 'success',
  IN_REVIEW: 'warning',
  REVIEW_COMPLETE: 'default',
}

const statusLabels: Record<string, string> = {
  OPEN: 'Open',
  IN_REVIEW: 'In Progress',
  REVIEW_COMPLETE: 'Completed',
}

export function PeerReviewInvitations({
  invitations,
  onJoinReview,
  loading = false,
}: PeerReviewInvitationsProps) {
  const activeInvitations = invitations.filter(
    (inv) => inv.status !== 'REVIEW_COMPLETE'
  )

  if (activeInvitations.length === 0 && !loading) {
    return null // Don't render anything if no pending invitations
  }

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <RateReviewIcon color="primary" />
          <Typography variant="h6">Peer Review Invitations</Typography>
          {activeInvitations.length > 0 && (
            <Chip
              label={activeInvitations.length}
              size="small"
              color="primary"
            />
          )}
        </Box>
        <List dense>
          {activeInvitations.map((invitation) => (
            <ListItem key={invitation.id} divider>
              <ListItemText
                primary={invitation.unitName || 'Homework'}
                secondary={`From: ${invitation.ownerDisplayName || invitation.ownerId}`}
              />
              <ListItemSecondaryAction>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={statusLabels[invitation.status] || invitation.status}
                    size="small"
                    color={statusColors[invitation.status] || 'default'}
                    variant="outlined"
                  />
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => onJoinReview(invitation.id)}
                    disabled={invitation.status === 'REVIEW_COMPLETE'}
                  >
                    Join Review
                  </Button>
                </Box>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  )
}

export default PeerReviewInvitations
