/**
 * CommentGutterIcon — Small icon button shown in the block gutter.
 *
 * Shows comment count badge. Clicking opens the CommentThreadDrawer.
 *
 * @module CommentGutterIcon
 */

import React from 'react'
import { useTranslations } from 'next-intl'
import IconButton from '@mui/material/IconButton'
import Badge from '@mui/material/Badge'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import ChatBubbleIcon from '@mui/icons-material/ChatBubble'

export interface CommentGutterIconProps {
  commentCount: number
  unresolvedCount: number
  onClick: () => void
}

export function CommentGutterIcon({
  commentCount,
  unresolvedCount,
  onClick,
}: CommentGutterIconProps) {
  const t = useTranslations('components')
  if (commentCount === 0) {
    return (
      <IconButton
        size="small"
        onClick={onClick}
        sx={{ opacity: 0.3, '&:hover': { opacity: 1 } }}
        title={t('commentGutterIcon.addComment')}
      >
        <ChatBubbleOutlineIcon fontSize="small" />
      </IconButton>
    )
  }

  return (
    <IconButton
      size="small"
      onClick={onClick}
      color="primary"
      title={t('commentGutterIcon.unresolvedCount', { count: unresolvedCount })}
    >
      <Badge badgeContent={unresolvedCount} color="primary" max={9}>
        <ChatBubbleIcon fontSize="small" />
      </Badge>
    </IconButton>
  )
}

export default CommentGutterIcon
