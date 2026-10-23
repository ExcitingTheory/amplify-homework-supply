/**
 * PeerReviewInvitations — Lists pending peer review invitations for the current user.
 *
 * Queries HomeworkRoom records where the user's ID is in `invitedUserIds`
 * and status is OPEN or IN_REVIEW.
 *
 * @module PeerReviewInvitations
 */

import React, { useEffect, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
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

const statusLabelKeys: Record<string, string> = {
  OPEN: 'open',
  IN_REVIEW: 'inProgress',
  REVIEW_COMPLETE: 'completed',
}

export function PeerReviewInvitations({
  invitations,
  onJoinReview,
  loading = false,
}: PeerReviewInvitationsProps) {
  const t = useTranslations('components')
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
          <Typography variant="h6">{t('peerReviewInvitations.title')}</Typography>
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
            <ListItem key={invitation.id} divider sx={{ gap: 1 }}>
              <ListItemText
                primary={invitation.unitName || t('peerReviewInvitations.homeworkFallback')}
                secondary={t('peerReviewInvitations.from', {
                  name: invitation.ownerDisplayName || invitation.ownerId,
                })}
                sx={{ flex: 1, minWidth: 0 }}
                primaryTypographyProps={{ noWrap: true }}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                <Chip
                  label={
                    statusLabelKeys[invitation.status]
                      ? t(`peerReviewInvitations.status.${statusLabelKeys[invitation.status]}`)
                      : invitation.status
                  }
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
                  {t('peerReviewInvitations.joinReview')}
                </Button>
              </Box>
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  )
}

export default PeerReviewInvitations
