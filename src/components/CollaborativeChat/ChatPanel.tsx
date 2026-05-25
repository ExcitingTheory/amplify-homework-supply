'use client'

/**
 * ChatPanel — Main container for collaborative chat.
 *
 * Combines TopicList + ThreadView + MessageInput with Yjs integration.
 * Connects to the ChatCollaborationProvider and manages state.
 *
 * @module CollaborativeChat/ChatPanel
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { Box, Paper, Divider, useMediaQuery, useTheme, Typography } from '@mui/material'
import { useChatRoom, useChatTopics, useChatThread, useChatPresence } from '../../yjs/chatHooks'
import type { ChatScopeContext, TopicScope, ChatUser, MemberInfo } from './types'
import { getCurrentScope } from './types'
import TopicList from './TopicList'
import ThreadView from './ThreadView'
import MessageInput from './MessageInput'
import { MiniEditorEditable } from '../MiniEditor'
import type { SerializedEditorState } from 'lexical'

export interface ChatPanelProps {
  /** Section ID for the chat room */
  sectionId: string
  /** Current user info */
  user: ChatUser
  /** Context for topic scoping */
  scopeContext: ChatScopeContext
  /** Section members for @mention autocomplete */
  members?: MemberInfo[]
  /** WebSocket URL override */
  wsUrl?: string
  /** Height of the panel */
  height?: number | string
  /**
   * Use the Lexical MiniEditor for input instead of plain text.
   * Enables rich content (blocks, images, etc.) in chat messages.
   */
  richInput?: boolean
}

export default function ChatPanel({
  sectionId,
  user,
  scopeContext,
  members = [],
  wsUrl,
  height = 500,
  richInput = false,
}: ChatPanelProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [showTopicList, setShowTopicList] = useState(!isMobile)

  const currentScope = useMemo(() => getCurrentScope(scopeContext), [scopeContext])

  // Connect to Yjs chat room
  const { provider, isConnected, isSynced } = useChatRoom({
    roomType: 'section',
    roomId: sectionId,
    user,
    wsUrl,
  })

  // Topics
  const { topics, createTopic, pinTopic } = useChatTopics(provider, currentScope)

  // Thread for selected topic
  const {
    messages,
    topLevelMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    getReplies,
  } = useChatThread(provider, selectedTopicId)

  // Presence
  const { onlineUsers, typingUsers } = useChatPresence(provider, selectedTopicId)

  // Auto-select first topic if none selected
  useEffect(() => {
    if (!selectedTopicId && topics.length > 0) {
      setSelectedTopicId(topics[0].id)
    }
  }, [topics, selectedTopicId])

  // Get selected topic info
  const selectedTopic = useMemo(
    () => topics.find((t) => t.id === selectedTopicId),
    [topics, selectedTopicId]
  )

  // Enrich members with online status
  const enrichedMembers = useMemo<MemberInfo[]>(() => {
    const onlineIds = new Set(onlineUsers.map((u) => u.username))
    return members.map((m) => ({ ...m, online: onlineIds.has(m.username) }))
  }, [members, onlineUsers])

  // Send message handler (plain text)
  const handleSend = useCallback(
    async (content: string) => {
      if (!provider || !selectedTopicId) return
      sendMessage(content, replyingTo || undefined)
      setReplyingTo(null)
      // Bot mention detection (@kai/@sage) is handled server-side by the Yjs botObserver
    },
    [provider, selectedTopicId, sendMessage, replyingTo]
  )

  // Send rich message handler (Lexical JSON from MiniEditor)
  const handleRichSend = useCallback(
    (json: SerializedEditorState, plainText: string) => {
      if (!provider || !selectedTopicId) return
      // Send with both plainText (for search/notifications) and JSON (for rendering)
      const msg = sendMessage(plainText, replyingTo || undefined)
      if (msg) {
        // Update the message to include contentJson via editMessage
        // The Yjs server sees the plain text @kai mention and triggers the bot
        editMessage(msg.id, plainText, JSON.stringify(json))
      }
      setReplyingTo(null)
    },
    [provider, selectedTopicId, sendMessage, editMessage, replyingTo]
  )

  // Typing indicator
  const handleTypingChange = useCallback(
    (typing: boolean) => {
      provider?.setTyping(typing)
    },
    [provider]
  )

  // Topic creation
  const handleCreateTopic = useCallback(
    (name: string, scope: TopicScope) => {
      const topic = createTopic(name, scope)
      if (topic) setSelectedTopicId(topic.id)
    },
    [createTopic]
  )

  // Select topic (mobile: hide list on select)
  const handleSelectTopic = useCallback(
    (topicId: string) => {
      setSelectedTopicId(topicId)
      if (isMobile) setShowTopicList(false)
    },
    [isMobile]
  )

  return (
    <Paper
      variant="outlined"
      sx={{ height, display: 'flex', overflow: 'hidden', borderRadius: 2 }}
    >
      {/* Topic sidebar */}
      {showTopicList && (
        <Box
          sx={{
            width: isMobile ? '100%' : 240,
            borderRight: isMobile ? 0 : 1,
            borderColor: 'divider',
            flexShrink: 0,
          }}
        >
          <TopicList
            topics={topics}
            selectedTopicId={selectedTopicId}
            onSelectTopic={handleSelectTopic}
            onCreateTopic={handleCreateTopic}
            onPinTopic={pinTopic}
            currentScope={currentScope}
            onlineUsers={onlineUsers}
          />
        </Box>
      )}

      {/* Thread area */}
      {(!isMobile || !showTopicList) && (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <ThreadView
            messages={messages}
            currentUserId={user.username}
            onReply={setReplyingTo}
            onReaction={addReaction}
            typingUsers={typingUsers}
            topicName={selectedTopic?.name}
          />
          <Divider />
          {richInput ? (
            <Box sx={{ p: 1 }}>
              <MiniEditorEditable
                chatMode
                compact
                placeholder="Message your class... (type @kai to ask the AI)"
                onSubmit={handleRichSend}
                showBlockInserter
                namespace={`chat-input-${selectedTopicId}`}
                ariaLabel="Chat message input"
                autoFocus={!!selectedTopicId}
              />
            </Box>
          ) : (
            <MessageInput
              onSend={handleSend}
              onTypingChange={handleTypingChange}
              members={enrichedMembers}
              disabled={!isConnected || !selectedTopicId}
              replyingTo={replyingTo}
              onCancelReply={() => setReplyingTo(null)}
            />
          )}
        </Box>
      )}
    </Paper>
  )
}
