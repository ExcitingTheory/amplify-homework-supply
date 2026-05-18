/**
 * MessageComposer — Input with @mention autocomplete and typing indicators.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react'
import {
  Box,
  TextField,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Popper,
  Typography,
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import PersonIcon from '@mui/icons-material/Person'
import { MemberInfo, getAutocompleteSuggestions } from '../../utils/chatMentions'

// ============================================================================
// Types
// ============================================================================

export interface MessageComposerProps {
  onSend: (content: string, parentId?: string) => void
  members: MemberInfo[]
  onTyping?: (typing: boolean) => void
  replyTo?: { id: string; authorName: string; content: string } | null
  onCancelReply?: () => void
  placeholder?: string
}

// ============================================================================
// Component
// ============================================================================

export function MessageComposer({
  onSend,
  members,
  onTyping,
  replyTo,
  onCancelReply,
  placeholder = 'Type a message... (@kai for AI)',
}: MessageComposerProps) {
  const [value, setValue] = useState('')
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [mentionAnchor, setMentionAnchor] = useState<HTMLElement | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const suggestions = mentionQuery !== null
    ? getAutocompleteSuggestions(mentionQuery, members)
    : []

  // Track typing state with debounce
  const handleTyping = useCallback(() => {
    onTyping?.(true)

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      onTyping?.(false)
    }, 2000)
  }, [onTyping])

  // Cleanup typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setValue(newValue)
    handleTyping()

    // Detect @mention trigger
    const cursorPos = e.target.selectionStart || newValue.length
    const textBefore = newValue.slice(0, cursorPos)
    const atMatch = textBefore.match(/@(\w*)$/)

    if (atMatch) {
      setMentionQuery(atMatch[1])
      setMentionAnchor(e.target)
      setSelectedIndex(0)
    } else {
      setMentionQuery(null)
      setMentionAnchor(null)
    }
  }

  const insertMention = (mentionValue: string) => {
    const cursorPos = inputRef.current?.selectionStart || value.length
    const textBefore = value.slice(0, cursorPos)
    const textAfter = value.slice(cursorPos)

    // Replace the @query with the mention
    const atIndex = textBefore.lastIndexOf('@')
    const newText = textBefore.slice(0, atIndex) + mentionValue + ' ' + textAfter

    setValue(newText)
    setMentionQuery(null)
    setMentionAnchor(null)

    // Refocus input
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle mention autocomplete navigation
    if (mentionQuery !== null && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, suggestions.length - 1))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
        return
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        insertMention(suggestions[selectedIndex].value)
        return
      }
      if (e.key === 'Escape') {
        setMentionQuery(null)
        setMentionAnchor(null)
        return
      }
    }

    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSend = () => {
    const content = value.trim()
    if (!content) return

    onSend(content, replyTo?.id)
    setValue('')
    setMentionQuery(null)
    onTyping?.(false)

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
  }

  return (
    <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
      {/* Reply indicator */}
      {replyTo && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 1,
            px: 1,
            py: 0.5,
            bgcolor: 'action.hover',
            borderRadius: 1,
            borderLeft: 3,
            borderColor: 'primary.main',
          }}
        >
          <Typography variant="caption" noWrap sx={{ flex: 1 }}>
            Replying to <strong>{replyTo.authorName}</strong>: {replyTo.content}
          </Typography>
          <IconButton size="small" onClick={onCancelReply}>
            ×
          </IconButton>
        </Box>
      )}

      {/* Input row */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
        <TextField
          inputRef={inputRef}
          fullWidth
          multiline
          maxRows={4}
          size="small"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          slotProps={{
            input: {
              sx: { fontSize: '0.875rem' },
            },
          }}
        />
        <IconButton
          color="primary"
          onClick={handleSend}
          disabled={!value.trim()}
          sx={{ mb: 0.5 }}
        >
          <SendIcon />
        </IconButton>
      </Box>

      {/* Mention autocomplete popover */}
      <Popper
        open={mentionQuery !== null && suggestions.length > 0}
        anchorEl={mentionAnchor}
        placement="top-start"
        sx={{ zIndex: 1400 }}
      >
        <Paper elevation={4} sx={{ maxHeight: 200, overflow: 'auto', minWidth: 200 }}>
          <List dense>
            {suggestions.map((suggestion, index) => (
              <ListItem key={suggestion.value} disablePadding>
                <ListItemButton
                  selected={index === selectedIndex}
                  onClick={() => insertMention(suggestion.value)}
                  dense
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    {suggestion.type === 'bot' ? (
                      <SmartToyIcon fontSize="small" color="secondary" />
                    ) : (
                      <PersonIcon fontSize="small" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={suggestion.label}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Paper>
      </Popper>
    </Box>
  )
}
