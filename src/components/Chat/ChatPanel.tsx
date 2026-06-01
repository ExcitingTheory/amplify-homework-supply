/**
 * ChatPanel — Main container for collaborative peer chat.
 *
 * Renders a topic sidebar + active thread view. Connects to the
 * ChatCollaborationProvider based on the current section/squad context.
 */

import React, { useState, useMemo } from 'react'
import {
  Box,
  Drawer,
  IconButton,
  Typography,
  Badge,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import ForumIcon from '@mui/icons-material/Forum'
import CloseIcon from '@mui/icons-material/Close'
import { useChatRoom, useChatTopics, useChatThread, useChatPresence } from '../../yjs/chatHooks'
import { TopicScope, ChatUser } from '../../yjs/ChatCollaborationProvider'
import { TopicList } from './TopicList'
import { ThreadView } from './ThreadView'
import { MessageComposer } from './MessageComposer'
import { MemberInfo } from '../../utils/chatMentions'

// ============================================================================
// Types
// ============================================================================

export interface ChatPanelProps {
  /** 'section' or 'squad' */
  roomType: 'section' | 'squad'
  /** Section or squad ID */
  roomId: string
  /** Current user info */
  user: ChatUser
  /** Current topic scope based on page context */
  scope?: TopicScope
  /** Members list for @mention autocomplete */
  members?: MemberInfo[]
  /** WebSocket URL override */
  wsUrl?: string
}

// ============================================================================
// Component
// ============================================================================

export function ChatPanel({
  roomType,
  roomId,
  user,
  scope,
  members = [],
  wsUrl,
}: ChatPanelProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [open, setOpen] = useState(false)
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null)

  // Connect to the Yjs chat room
  const { provider, isConnected } = useChatRoom(
    roomId
      ? { roomType, roomId, user, wsUrl, connect: true, persistence: true }
      : null,
  )

  // Topics filtered by current scope
  const { topics, createTopic, pinTopic, archiveTopic } = useChatTopics(provider, scope)

  // Active thread messages
  const {
    topLevelMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    getReplies,
  } = useChatThread(provider, activeTopicId)

  // Presence info
  const { onlineUsers, typingUsers } = useChatPresence(provider, activeTopicId)

  // Default scope for new topics
  const defaultScope = scope || (roomType === 'squad' ? 'squad' : 'section') as TopicScope

  const activeTopic = useMemo(
    () => topics.find((t) => t.id === activeTopicId) || null,
    [topics, activeTopicId],
  )

  const handleCreateTopic = (name: string) => {
    const topic = createTopic(name, defaultScope)
    if (topic) setActiveTopicId(topic.id)
  }

  const handleSendMessage = (content: string, parentId?: string) => {
    sendMessage(content, parentId)
  }

  const drawerWidth = isMobile ? '100%' : 420

  return (
    <>
      {/* Floating action button to open chat */}
      <IconButton
        onClick={() => setOpen(true)}
        data-testid="collaborative-chat-button"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          width: 56,
          height: 56,
          '&:hover': { bgcolor: 'primary.dark' },
          zIndex: theme.zIndex.fab,
        }}
      >
        <Badge
          color="success"
          variant="dot"
          invisible={!isConnected}
        >
          <ForumIcon />
        </Badge>
      </IconButton>

      {/* Chat drawer */}
      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        variant={isMobile ? 'temporary' : 'persistent'}
        sx={{
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            maxWidth: '100vw',
          },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 2,
              borderBottom: 1,
              borderColor: 'divider',
            }}
          >
            <Typography variant="h6">
              {activeTopic ? activeTopic.name : 'Chat'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {onlineUsers.length} online
              </Typography>
              <IconButton size="small" onClick={() => setOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Content area */}
          <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {/* Topic list (left panel on desktop, full view when no topic selected on mobile) */}
            {(!activeTopicId || !isMobile) && (
              <Box
                sx={{
                  width: activeTopicId ? 180 : '100%',
                  borderRight: activeTopicId ? 1 : 0,
                  borderColor: 'divider',
                  overflow: 'auto',
                }}
              >
                <TopicList
                  topics={topics}
                  activeTopicId={activeTopicId}
                  onSelectTopic={setActiveTopicId}
                  onCreateTopic={handleCreateTopic}
                  onPinTopic={pinTopic}
                  onArchiveTopic={archiveTopic}
                />
              </Box>
            )}

            {/* Thread view + composer */}
            {activeTopicId && (
              <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                {isMobile && (
                  <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
                    <IconButton size="small" onClick={() => setActiveTopicId(null)}>
                      ← Topics
                    </IconButton>
                  </Box>
                )}

                <ThreadView
                  messages={topLevelMessages}
                  getReplies={getReplies}
                  onReact={addReaction}
                  onEdit={editMessage}
                  onDelete={deleteMessage}
                  currentUser={user}
                  typingUsers={typingUsers}
                />

                <MessageComposer
                  onSend={handleSendMessage}
                  members={members}
                  onTyping={(typing) => provider?.setTyping(typing)}
                />
              </Box>
            )}
          </Box>
        </Box>
      </Drawer>
    </>
  )
}
