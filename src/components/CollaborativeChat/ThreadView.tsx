'use client'

/**
 * ThreadView — Displays messages within a topic thread.
 *
 * Features:
 * - Top-level messages with inline replies
 * - Auto-scroll to bottom on new messages
 * - Typing indicators
 * - Message timestamps and author info
 * - Reply action per message
 * - Emoji reactions
 *
 * @module CollaborativeChat/ThreadView
 */

import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react'
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  Chip,
  Tooltip,
  Stack,
  Paper,
  Collapse,
  CircularProgress,
} from '@mui/material'
import ReplyIcon from '@mui/icons-material/Reply'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import AddReactionIcon from '@mui/icons-material/AddReaction'
import { MiniEditorReadOnly } from '../MiniEditor'
import type { ChatMessage, ChatUser } from './types'

export interface ThreadViewProps {
  messages: ChatMessage[]
  currentUserId: string
  onReply?: (messageId: string) => void
  onReaction?: (messageId: string, emoji: string) => void
  typingUsers?: ChatUser[]
  topicName?: string
}

/** Format timestamp to relative or absolute */
function formatTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function MessageBubble({
  message,
  isOwn,
  replies,
  onReply,
  onReaction,
}: {
  message: ChatMessage
  isOwn: boolean
  replies: ChatMessage[]
  onReply?: (messageId: string) => void
  onReaction?: (messageId: string, emoji: string) => void
}) {
  const [showReplies, setShowReplies] = useState(replies.length > 0)
  const isBot = message.authorId === 'kai-bot' || message.authorId === 'kai'

  return (
    <Box sx={{ mb: 1.5 }}>
      {/* Message header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        {isBot ? (
          <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main' }}>
            <SmartToyIcon sx={{ fontSize: 16 }} />
          </Avatar>
        ) : (
          <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: isOwn ? 'secondary.main' : 'grey.400' }}>
            {message.authorName[0]?.toUpperCase()}
          </Avatar>
        )}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
            <Typography variant="body2" fontWeight={600} component="span">
              {isBot ? 'Kai' : message.authorName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatTime(message.createdAt)}
            </Typography>
            {message.editedAt && (
              <Typography variant="caption" color="text.secondary">(edited)</Typography>
            )}
          </Box>
          {/* Message content - rich Lexical blocks or plain text fallback */}
          {message.contentJson ? (
            <MiniEditorReadOnly
              content={message.contentJson}
              compact
              namespace={`msg-${message.id}`}
              ariaLabel={`Message from ${message.authorName}`}
            />
          ) : (
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', mt: 0.25 }}>
              {message.content}
            </Typography>
          )}

          {/* Streaming indicator for Kai */}
          {isBot && message.isStreaming && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              <CircularProgress size={12} />
              <Typography variant="caption" color="text.secondary">
                Kai is thinking...
              </Typography>
            </Box>
          )}

          {/* Reactions */}
          {Object.keys(message.reactions).length > 0 && (
            <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: 'wrap' }}>
              {Object.entries(message.reactions).map(([emoji, users]) => (
                <Chip
                  key={emoji}
                  label={`${emoji} ${users.length}`}
                  size="small"
                  variant="outlined"
                  onClick={() => onReaction?.(message.id, emoji)}
                  sx={{ height: 22, fontSize: '0.75rem' }}
                />
              ))}
            </Stack>
          )}

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.25, opacity: 0.6, '&:hover': { opacity: 1 } }}>
            <Tooltip title="Reply">
              <IconButton size="small" onClick={() => onReply?.(message.id)}>
                <ReplyIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="React">
              <IconButton size="small" onClick={() => onReaction?.(message.id, '👍')}>
                <AddReactionIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Thread replies */}
          {replies.length > 0 && (
            <Box sx={{ ml: 2, mt: 0.5, borderLeft: 2, borderColor: 'divider', pl: 1.5 }}>
              {!showReplies ? (
                <Typography
                  variant="caption"
                  color="primary"
                  sx={{ cursor: 'pointer' }}
                  onClick={() => setShowReplies(true)}
                >
                  {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                </Typography>
              ) : (
                replies.map((reply) => (
                  <Box key={reply.id} sx={{ mb: 0.75 }}>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                      <Typography variant="caption" fontWeight={600}>
                        {reply.authorId === 'kai-bot' || reply.authorId === 'kai' ? 'Kai' : reply.authorName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatTime(reply.createdAt)}
                      </Typography>
                    </Box>
                    {reply.contentJson ? (
                      <MiniEditorReadOnly
                        content={reply.contentJson}
                        compact
                        namespace={`reply-${reply.id}`}
                        ariaLabel={`Reply from ${reply.authorName}`}
                      />
                    ) : (
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.8125rem' }}>
                        {reply.content}
                      </Typography>
                    )}
                  </Box>
                ))
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}

export default function ThreadView({
  messages,
  currentUserId,
  onReply,
  onReaction,
  typingUsers = [],
  topicName,
}: ThreadViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)

  // Group messages: top-level + their replies
  const topLevelMessages = useMemo(
    () => messages.filter((m) => m.parentId === null),
    [messages]
  )

  const repliesMap = useMemo(() => {
    const map = new Map<string, ChatMessage[]>()
    messages
      .filter((m) => m.parentId !== null)
      .forEach((m) => {
        const existing = map.get(m.parentId!) || []
        existing.push(m)
        map.set(m.parentId!, existing)
      })
    return map
  }, [messages])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length, autoScroll])

  // Detect if user has scrolled up
  const handleScroll = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50
    setAutoScroll(isAtBottom)
  }, [])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Topic header */}
      {topicName && (
        <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" fontWeight={600}>
            {topicName}
          </Typography>
        </Box>
      )}

      {/* Messages area */}
      <Box
        ref={containerRef}
        onScroll={handleScroll}
        sx={{ flex: 1, overflow: 'auto', px: 2, py: 1 }}
      >
        {topLevelMessages.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No messages yet. Start the conversation!
            </Typography>
          </Box>
        )}
        {topLevelMessages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={msg.authorId === currentUserId}
            replies={repliesMap.get(msg.id) || []}
            onReply={onReply}
            onReaction={onReaction}
          />
        ))}
        <div ref={bottomRef} />
      </Box>

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <Box sx={{ px: 2, py: 0.5 }}>
          <Typography variant="caption" color="text.secondary" fontStyle="italic">
            {typingUsers.map((u) => u.displayName).join(', ')}{' '}
            {typingUsers.length === 1 ? 'is' : 'are'} typing...
          </Typography>
        </Box>
      )}
    </Box>
  )
}
