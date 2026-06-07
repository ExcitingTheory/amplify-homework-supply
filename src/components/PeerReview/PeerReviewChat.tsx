/**
 * PeerReviewChat — Chat panel for a peer review room.
 *
 * Renders the message feed, typing indicators, and message input.
 * Designed to be the right pane of the split-pane peer review layout.
 *
 * @module PeerReviewChat
 */

import React, { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import Avatar from '@mui/material/Avatar'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import SendIcon from '@mui/icons-material/Send'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import type { RoomMessage, PeerReviewUser, MessageType } from '../../yjs/PeerReviewRoomProvider'

export interface PeerReviewChatProps {
  messages: RoomMessage[]
  typingPeers: PeerReviewUser[]
  currentUsername: string
  isClosed: boolean
  onSendMessage: (content: string, messageType?: MessageType, referencedBlockId?: string) => void
  onTypingChange?: (typing: boolean) => void
  /** Called when a message contains @AI — triggers backend AI response. */
  onAIMention?: (message: string, chatHistory: string) => void
}

function MessageBubble({
  message,
  isOwnMessage,
}: {
  message: RoomMessage
  isOwnMessage: boolean
}) {
  const isAI = message.messageType === 'AI_SUGGESTION'
  const isSystem = message.messageType === 'SYSTEM'

  if (isSystem) {
    return (
      <Box sx={{ textAlign: 'center', py: 0.5 }}>
        <Typography variant="caption" color="text.disabled">
          {message.content}
        </Typography>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isOwnMessage ? 'row-reverse' : 'row',
        gap: 1,
        mb: 1.5,
        alignItems: 'flex-start',
      }}
    >
      <Avatar
        sx={{
          width: 28,
          height: 28,
          fontSize: 13,
          bgcolor: isAI ? 'secondary.main' : 'primary.main',
        }}
      >
        {isAI ? <SmartToyIcon sx={{ fontSize: 16 }} /> : (message.displayName || message.author).charAt(0)}
      </Avatar>
      <Box
        sx={{
          maxWidth: '75%',
          bgcolor: isAI
            ? 'secondary.50'
            : isOwnMessage
              ? 'primary.50'
              : 'grey.100',
          borderRadius: 2,
          px: 1.5,
          py: 1,
        }}
      >
        <Typography variant="caption" fontWeight={600} color="text.secondary">
          {isAI ? 'AI Assistant' : message.displayName || message.author}
        </Typography>
        {message.referencedBlockId && (
          <Chip
            label={`Block: ${message.referencedBlockId}`}
            size="small"
            variant="outlined"
            sx={{ ml: 1, height: 18, fontSize: 10 }}
          />
        )}
        <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
          {message.content}
        </Typography>
      </Box>
    </Box>
  )
}

export function PeerReviewChat({
  messages = [],
  typingPeers = [],
  currentUsername,
  isClosed = false,
  onSendMessage,
  onTypingChange,
  onAIMention,
}: PeerReviewChatProps) {
  const t = useTranslations('common')
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed) return

    onSendMessage(trimmed)
    setInput('')
    onTypingChange?.(false)
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }

    // Detect @AI mention and trigger AI response
    if (onAIMention && /@ai\b/i.test(trimmed)) {
      const chatHistory = messages
        .slice(-20)
        .map(m => `[${m.displayName || m.author}]: ${m.content}`)
        .join('\n')
      onAIMention(trimmed, chatHistory)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)

    onTypingChange?.(true)
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    typingTimeoutRef.current = setTimeout(() => {
      onTypingChange?.(false)
    }, 2000)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Message feed */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        {messages.length === 0 && (
          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
            mt={4}
          >
            No messages yet. Start the peer review conversation!
          </Typography>
        )}
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwnMessage={msg.author === currentUsername}
          />
        ))}
        <div ref={messagesEndRef} />
      </Box>

      {/* Typing indicator */}
      {typingPeers.length > 0 && (
        <Box sx={{ px: 2, pb: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            {typingPeers.map((p) => p.displayName || p.username).join(', ')}{' '}
            {typingPeers.length === 1 ? 'is' : 'are'} typing…
          </Typography>
        </Box>
      )}

      {/* Input area */}
      {!isClosed ? (
        <Stack direction="row" spacing={1} sx={{ p: 1.5, borderTop: 1, borderColor: 'divider' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Type a message… (use @AI for AI help)"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            multiline
            maxRows={3}
          />
          <IconButton
            color="primary"
            onClick={handleSend}
            disabled={!input.trim()}
            aria-label={t('actions.send')}
          >
            <SendIcon />
          </IconButton>
        </Stack>
      ) : (
        <Box sx={{ p: 2, textAlign: 'center', borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary">
            This review session has ended.
          </Typography>
        </Box>
      )}
    </Box>
  )
}

export default PeerReviewChat
