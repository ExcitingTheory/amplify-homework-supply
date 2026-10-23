/**
 * WorkbookPresenceBar — shows all connected users as an avatar row
 * in the workbook header, with idle fade for inactive users and a
 * share/invite button for collaborative sessions.
 */

import React from 'react'
import { Avatar, AvatarGroup, Box, Chip, Tooltip, Typography } from '@mui/material'
import { Circle as CircleIcon } from '@mui/icons-material'
import { useTranslations } from 'next-intl'
import UnitContext from '../../context/unitContext'
import { usePresenceUsers, type PresenceUser } from '../../yjs/workbookHooks'
import { WorkbookInviteShare } from './WorkbookInviteShare'
import { ProfileAvatarLink } from '../ProfileAvatarLink'

export interface WorkbookPresenceBarProps {
  /** Maximum number of avatars before "+N" overflow */
  max?: number
}

export function WorkbookPresenceBar({ max = 5 }: WorkbookPresenceBarProps) {
  const t = useTranslations('components')
  const { workbook, workbookEnabled, unit } = React.useContext(UnitContext)

  const users = usePresenceUsers(workbook?.provider ?? null)

  if (!workbookEnabled || !workbook?.provider) {
    return null
  }

  const workbookId = unit?.id || ''

  return (
    <Box
      display="flex"
      alignItems="center"
      gap={1}
      sx={{ py: 0.5, px: 1 }}
    >
      {users.length > 0 && (
        <AvatarGroup
          max={max}
          sx={{
            '& .MuiAvatar-root': {
              width: 28,
              height: 28,
              fontSize: '0.75rem',
            },
          }}
        >
          {users.map((user) => (
            <Tooltip
              key={user.clientId}
              title={
                user.isIdle
                  ? t('workbookPresenceBar.idleUser', {
                      name: user.displayName || user.username,
                    })
                  : user.displayName || user.username
              }
            >
              <Avatar
                component={ProfileAvatarLink}
                username={user.username}
                displayName={user.displayName}
                sx={{
                  bgcolor: user.color || '#6366f1',
                  opacity: user.isIdle ? 0.4 : 1,
                  transition: 'opacity 0.3s ease',
                }}
              >
                {(user.displayName?.[0] || user.username?.[0] || '?').toUpperCase()}
              </Avatar>
            </Tooltip>
          ))}
        </AvatarGroup>
      )}

      {users.length > 0 && (
        <Typography variant="caption" color="text.secondary">
          {t('workbookPresenceBar.connectedCount', { count: users.length })}
        </Typography>
      )}

      {/* Share/Invite button — always visible when workbook is enabled */}
      {workbookId && (
        <WorkbookInviteShare
          users={users}
          workbookId={workbookId}
          isConnected={!!workbook?.provider}
        />
      )}
    </Box>
  )
}
