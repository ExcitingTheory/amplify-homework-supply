/**
 * TopicList — Displays #topics with create, pin, and archive actions.
 */

import React, { useState } from 'react'
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  TextField,
  IconButton,
  Typography,
  Chip,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import PushPinIcon from '@mui/icons-material/PushPin'
import ArchiveIcon from '@mui/icons-material/Archive'
import { ChatTopic } from '../../yjs/ChatCollaborationProvider'

// ============================================================================
// Types
// ============================================================================

export interface TopicListProps {
  topics: ChatTopic[]
  activeTopicId: string | null
  onSelectTopic: (topicId: string) => void
  onCreateTopic: (name: string) => void
  onPinTopic: (topicId: string, pinned: boolean) => void
  onArchiveTopic: (topicId: string) => void
}

// ============================================================================
// Component
// ============================================================================

export function TopicList({
  topics,
  activeTopicId,
  onSelectTopic,
  onCreateTopic,
  onPinTopic,
  onArchiveTopic,
}: TopicListProps) {
  const [showInput, setShowInput] = useState(false)
  const [newTopicName, setNewTopicName] = useState('')

  const sortedTopics = [...topics].sort((a, b) => {
    // Pinned first, then by creation date (newest first)
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const handleCreate = () => {
    const name = newTopicName.trim()
    if (!name) return
    onCreateTopic(name)
    setNewTopicName('')
    setShowInput(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCreate()
    }
    if (e.key === 'Escape') {
      setShowInput(false)
      setNewTopicName('')
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 1,
          px: 2,
        }}
      >
        <Typography variant="subtitle2" color="text.secondary">
          Topics
        </Typography>
        <IconButton size="small" onClick={() => setShowInput(true)}>
          <AddIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* New topic input */}
      {showInput && (
        <Box sx={{ px: 2, pb: 1 }}>
          <TextField
            size="small"
            fullWidth
            autoFocus
            placeholder="#new-topic"
            value={newTopicName}
            onChange={(e) => setNewTopicName(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (!newTopicName.trim()) setShowInput(false)
            }}
            slotProps={{
              input: {
                sx: { fontSize: '0.875rem' },
              },
            }}
          />
        </Box>
      )}

      {/* Topic list */}
      <List dense sx={{ flex: 1, overflow: 'auto', py: 0 }}>
        {sortedTopics.length === 0 && !showInput && (
          <ListItem>
            <ListItemText
              secondary="No topics yet. Create one to start chatting."
              secondaryTypographyProps={{ variant: 'caption' }}
            />
          </ListItem>
        )}

        {sortedTopics.map((topic) => (
          <ListItem
            key={topic.id}
            disablePadding
            secondaryAction={
              <Box sx={{ display: 'flex', gap: 0 }}>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation()
                    onPinTopic(topic.id, !topic.pinned)
                  }}
                  sx={{ opacity: topic.pinned ? 1 : 0.3 }}
                >
                  <PushPinIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Box>
            }
          >
            <ListItemButton
              selected={topic.id === activeTopicId}
              onClick={() => onSelectTopic(topic.id)}
              sx={{ py: 0.5 }}
            >
              <ListItemText
                primary={topic.name}
                primaryTypographyProps={{
                  variant: 'body2',
                  fontWeight: topic.pinned ? 600 : 400,
                }}
                secondary={
                  topic.scope !== 'section' && topic.scope !== 'squad'
                    ? topic.scope.split(':')[0]
                    : undefined
                }
                secondaryTypographyProps={{ variant: 'caption' }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  )
}
