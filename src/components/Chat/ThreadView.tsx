/**
 * ThreadView — Displays messages in a topic with threading support.
 */

import React, { useRef, useEffect, useState } from 'react'
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  Collapse,
  Chip,
} from '@mui/material'
import ReplyIcon from '@mui/icons-material/Reply'
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { ChatMessage, ChatUser } from '../../yjs/ChatCollaborationProvider'
import { MentionChip } from './MentionChip'

// ============================================================================
// Types
// ============================================================================

export interface ThreadViewProps {
  messages: ChatMessage[]
  getReplies: (parentId: string) => ChatMessage[]
  onReact: (messageId: string, emoji: string) => void
  onEdit: (messageId: string, content: string) => void
  onDelete: (messageId: string) => void
  onReply?: (parentId: string) => void
  currentUser: ChatUser
  typingUsers: ChatUser[]
}

// ============================================================================
// Component
// ============================================================================

export function ThreadView({
  messages,
  getReplies,
  onReact,
  onEdit,
  onDelete,
  onReply,
  currentUser,
  typingUsers,
}: ThreadViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set())

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages.length])

  const toggleThread = (messageId: string) => {
    setExpandedThreads((prev) => {
      const next = new Set(prev)
      if (next.has(messageId)) {
        next.delete(messageId)
      } else {
        next.add(messageId)
      }
      return next
    })
  }

  return (
    <Box
      ref={scrollRef}
      sx={{
        flex: 1,
        overflow: 'auto',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      {messages.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
          <Typography variant="body2">
            No messages yet. Start the conversation!
          </Typography>
        </Box>
      )}

      {messages.map((message) => {
        const replies = getReplies(message.id)
        const isExpanded = expandedThreads.has(message.id)
        const isOwn = message.authorId === currentUser.username

        return (
          <Box key={message.id}>
            <MessageBubble
              message={message}
              isOwn={isOwn}
              replyCount={replies.length}
              onToggleReplies={() => toggleThread(message.id)}
              onReact={onReact}
              onEdit={isOwn ? onEdit : undefined}
              onDelete={isOwn ? onDelete : undefined}
              onReply={onReply}
            />

            {/* Threaded replies */}
            {replies.length > 0 && (
              <Collapse in={isExpanded}>
                <Box sx={{ ml: 4, borderLeft: 2, borderColor: 'divider', pl: 1 }}>
                  {replies.map((reply) => (
                    <MessageBubble
                      key={reply.id}
                      message={reply}
                      isOwn={reply.authorId === currentUser.username}
                      onReact={onReact}
                      onEdit={reply.authorId === currentUser.username ? onEdit : undefined}
                      onDelete={reply.authorId === currentUser.username ? onDelete : undefined}
                      compact
                    />
                  ))}
                </Box>
              </Collapse>
            )}
          </Box>
        )
      })}

      {/* Typing indicators */}
      {typingUsers.length > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: 0.6 }}>
          <Typography variant="caption">
            {typingUsers.map((u) => u.displayName).join(', ')}{' '}
            {typingUsers.length === 1 ? 'is' : 'are'} typing...
          </Typography>
        </Box>
      )}
    </Box>
  )
}

// ============================================================================
// MessageBubble (internal)
// ============================================================================

interface MessageBubbleProps {
  message: ChatMessage
  isOwn: boolean
  replyCount?: number
  onToggleReplies?: () => void
  onReact: (messageId: string, emoji: string) => void
  onEdit?: (messageId: string, content: string) => void
  onDelete?: (messageId: string) => void
  onReply?: (parentId: string) => void
  compact?: boolean
}

function MessageBubble({
  message,
  isOwn,
  replyCount = 0,
  onToggleReplies,
  onReact,
  onEdit,
  onDelete,
  onReply,
  compact = false,
}: MessageBubbleProps) {
  const [hovered, setHovered] = useState(false)

  const initials = message.authorName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const isBot = message.authorId === 'kai-bot'

  return (
    <Box
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        display: 'flex',
        gap: 1,
        py: compact ? 0.5 : 1,
        alignItems: 'flex-start',
        position: 'relative',
      }}
    >
      {!compact && (
        <Avatar
          sx={{
            width: 32,
            height: 32,
            fontSize: '0.75rem',
            bgcolor: isBot ? 'secondary.main' : 'primary.main',
          }}
        >
          {isBot ? '🤖' : initials}
        </Avatar>
      )}

      <Box sx={{ flex: 1, minWidth: 0 }}>
        {/* Author + timestamp */}
        {!compact && (
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
            <Typography variant="subtitle2" component="span">
              {message.authorName}
              {isBot && (
                <Chip label="AI" size="small" color="secondary" sx={{ ml: 0.5, height: 18 }} />
              )}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatTime(message.createdAt)}
              {message.editedAt && ' (edited)'}
            </Typography>
          </Box>
        )}

        {/* Content with rendered mentions */}
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          <RenderContent content={message.content} />
        </Typography>

        {/* Reactions */}
        {Object.keys(message.reactions).length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
            {Object.entries(message.reactions).map(([emoji, users]) => (
              <Chip
                key={emoji}
                label={`${emoji} ${users.length}`}
                size="small"
                variant="outlined"
                onClick={() => onReact(message.id, emoji)}
                sx={{ height: 22, fontSize: '0.75rem' }}
              />
            ))}
          </Box>
        )}

        {/* Reply count */}
        {replyCount > 0 && onToggleReplies && (
          <Typography
            variant="caption"
            color="primary"
            sx={{ cursor: 'pointer', mt: 0.5, display: 'block' }}
            onClick={onToggleReplies}
          >
            {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
          </Typography>
        )}
      </Box>

      {/* Hover actions */}
      {hovered && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            display: 'flex',
            bgcolor: 'background.paper',
            borderRadius: 1,
            boxShadow: 1,
          }}
        >
          <IconButton size="small" onClick={() => onReact(message.id, '👍')}>
            <EmojiEmotionsIcon sx={{ fontSize: 16 }} />
          </IconButton>
          {onReply && !message.parentId && (
            <IconButton size="small" onClick={() => onReply(message.id)}>
              <ReplyIcon sx={{ fontSize: 16 }} />
            </IconButton>
          )}
          {onEdit && (
            <IconButton size="small" onClick={() => onEdit(message.id, message.content)}>
              <EditIcon sx={{ fontSize: 16 }} />
            </IconButton>
          )}
          {onDelete && (
            <IconButton size="small" onClick={() => onDelete(message.id)}>
              <DeleteIcon sx={{ fontSize: 16 }} />
            </IconButton>
          )}
        </Box>
      )}
    </Box>
  )
}

// ============================================================================
// Helpers
// ============================================================================

function RenderContent({ content }: { content: string }) {
  // Split content into text and mention segments
  const parts: React.ReactNode[] = []
  const mentionRegex = /@"([^"]+)"|@(\w[\w.-]*)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  mentionRegex.lastIndex = 0
  while ((match = mentionRegex.exec(content)) !== null) {
    // Text before mention
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index))
    }
    // Mention
    const name = match[1] || match[2]
    parts.push(<MentionChip key={match.index} name={name} />)
    lastIndex = match.index + match[0].length
  }

  // Remaining text
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex))
  }

  return <>{parts}</>
}

function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}
