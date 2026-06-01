/**
 * WorkbookInviteShare — Share/invite UI for collaborative workbook sessions.
 * Shows a share button that opens a popover with the workbook URL, a copy
 * button, and the current participant list.
 */

import React, { useState, useCallback } from 'react'
import {
  Box,
  IconButton,
  Popover,
  Typography,
  TextField,
  Button,
  Divider,
  Avatar,
  AvatarGroup,
  Tooltip,
  Chip,
  InputAdornment,
} from '@mui/material'
import ShareIcon from '@mui/icons-material/Share'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import CheckIcon from '@mui/icons-material/Check'
import LinkIcon from '@mui/icons-material/Link'
import { useTranslations } from 'next-intl'
import type { PresenceUser } from '../../yjs/workbookHooks'

// ============================================================================
// Types
// ============================================================================

export interface WorkbookInviteShareProps {
  /** Connected users from usePresenceUsers */
  users: PresenceUser[]
  /** The workbook/unit ID for generating the share link */
  workbookId: string
  /** Whether the workbook collaboration is active */
  isConnected?: boolean
}

// ============================================================================
// Helpers
// ============================================================================

function getShareUrl(workbookId: string): string {
  if (typeof window === 'undefined') return ''
  return `${window.location.origin}/workbook/${workbookId}`
}

// ============================================================================
// Component
// ============================================================================

export function WorkbookInviteShare({
  users,
  workbookId,
  isConnected = true,
}: WorkbookInviteShareProps) {
  const t = useTranslations('components')
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [copied, setCopied] = useState(false)

  const shareUrl = getShareUrl(workbookId)
  const open = Boolean(anchorEl)

  const handleOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }, [])

  const handleClose = useCallback(() => {
    setAnchorEl(null)
    setCopied(false)
  }, [])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input')
      input.value = shareUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [shareUrl])

  return (
    <>
      <Tooltip title={t('workbook.invite.shareTooltip', 'Invite others to this workbook')}>
        <IconButton
          size="small"
          onClick={handleOpen}
          color={open ? 'primary' : 'default'}
          aria-label={t('workbook.invite.shareTooltip', 'Invite others to this workbook')}
        >
          <ShareIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: { p: 2, width: 340, maxWidth: '90vw' },
          },
        }}
      >
        <Typography variant="subtitle2" gutterBottom>
          {t('workbook.invite.title', 'Share Workbook')}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
          {t('workbook.invite.description', 'Anyone with this link who is enrolled in the same section can join and work together in real-time.')}
        </Typography>

        {/* Share link */}
        <TextField
          fullWidth
          size="small"
          value={shareUrl}
          slotProps={{
            input: {
              readOnly: true,
              startAdornment: (
                <InputAdornment position="start">
                  <LinkIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={handleCopy}
                    color={copied ? 'success' : 'default'}
                    aria-label={t('workbook.invite.copy', 'Copy link')}
                  >
                    {copied ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
              sx: { fontFamily: 'monospace', fontSize: '0.75rem' },
            },
          }}
          sx={{ mb: 1 }}
        />

        <Button
          fullWidth
          variant="outlined"
          size="small"
          startIcon={copied ? <CheckIcon /> : <ContentCopyIcon />}
          onClick={handleCopy}
          color={copied ? 'success' : 'primary'}
          sx={{ mb: 2 }}
        >
          {copied
            ? t('workbook.invite.copied', 'Copied!')
            : t('workbook.invite.copyLink', 'Copy Link')}
        </Button>

        <Divider sx={{ mb: 1.5 }} />

        {/* Current participants */}
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          {t('workbook.invite.currentlyOnline', 'Currently online')} ({users.length})
        </Typography>

        {users.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 1 }}>
            {t('workbook.invite.noOthers', 'No one else is here yet')}
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {users.map((user) => (
              <Box
                key={user.clientId}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  py: 0.5,
                  opacity: user.isIdle ? 0.5 : 1,
                }}
              >
                <Avatar
                  sx={{
                    width: 24,
                    height: 24,
                    fontSize: '0.7rem',
                    bgcolor: user.color || '#6366f1',
                  }}
                >
                  {(user.displayName?.[0] || user.username?.[0] || '?').toUpperCase()}
                </Avatar>
                <Typography variant="body2" sx={{ flex: 1 }}>
                  {user.displayName || user.username}
                </Typography>
                {user.role && user.role !== 'student' && (
                  <Chip
                    size="small"
                    label={user.role}
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.65rem' }}
                  />
                )}
                {user.isIdle && (
                  <Typography variant="caption" color="text.secondary">
                    {t('workbook.invite.idle', 'idle')}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        )}
      </Popover>
    </>
  )
}
