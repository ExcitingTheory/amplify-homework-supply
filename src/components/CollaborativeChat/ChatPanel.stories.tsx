/**
 * @fileoverview Storybook stories for ChatPanel component
 *
 * Uses mocked Yjs hooks to render the full chat panel without a real server.
 * @module CollaborativeChat/ChatPanel.stories
 */

import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import React, { useState, useCallback, useMemo } from 'react'
import { fn } from 'storybook/test'
import { Box, Typography } from '@mui/material'
import TopicList from './TopicList'
import ThreadView from './ThreadView'
import MessageInput from './MessageInput'
import type { ChatTopic, ChatMessage, ChatUser, MemberInfo, TopicScope } from './types'

/**
 * Since ChatPanel connects to a real Yjs provider, we compose
 * the sub-components directly for a self-contained Storybook demo.
 */
function MockChatPanel() {
  const currentUser: ChatUser = { username: 'student1', displayName: 'Alex Chen' }

  const [topics] = useState<ChatTopic[]>([
    {
      id: 'topic-1',
      name: '#general',
      scope: 'section',
      createdBy: 'teacher1',
      createdByName: 'Ms. Tanaka',
      createdAt: '2026-05-18T10:00:00Z',
      pinned: true,
      archived: false,
    },
    {
      id: 'topic-2',
      name: '#homework-help',
      scope: 'section',
      createdBy: 'teacher1',
      createdByName: 'Ms. Tanaka',
      createdAt: '2026-05-17T14:00:00Z',
      pinned: false,
      archived: false,
    },
    {
      id: 'topic-3',
      name: '#unit-questions',
      scope: 'unit:unit-abc',
      createdBy: 'student2',
      createdByName: 'Jordan',
      createdAt: '2026-05-19T09:30:00Z',
      pinned: false,
      archived: false,
    },
  ])

  const [selectedTopicId, setSelectedTopicId] = useState<string | null>('topic-2')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)

  const [allMessages, setAllMessages] = useState<Record<string, ChatMessage[]>>({
    'topic-1': [
      {
        id: 'msg-gen-1',
        parentId: null,
        authorId: 'teacher1',
        authorName: 'Ms. Tanaka',
        content: 'Welcome to the class chat! Feel free to ask questions here.',
        mentions: [],
        createdAt: '2026-05-18T10:01:00Z',
        editedAt: null,
        reactions: { '👋': ['student1', 'student2', 'student3'] },
      },
    ],
    'topic-2': [
      {
        id: 'msg-hw-1',
        parentId: null,
        authorId: 'student3',
        authorName: 'Sam',
        content: 'Can someone help me with the particle exercise on page 12?',
        mentions: [],
        createdAt: '2026-05-20T09:00:00Z',
        editedAt: null,
        reactions: {},
      },
      {
        id: 'msg-hw-2',
        parentId: 'msg-hw-1',
        authorId: 'student2',
        authorName: 'Jordan',
        content: 'Sure! Which sentence are you stuck on?',
        mentions: [],
        createdAt: '2026-05-20T09:02:00Z',
        editedAt: null,
        reactions: {},
      },
      {
        id: 'msg-hw-3',
        parentId: null,
        authorId: 'student1',
        authorName: 'Alex Chen',
        content: '@kai What is the correct particle for "I go to school"?',
        mentions: ['@kai'],
        createdAt: '2026-05-20T09:05:00Z',
        editedAt: null,
        reactions: {},
      },
      {
        id: 'msg-hw-4',
        parentId: 'msg-hw-3',
        authorId: 'kai-bot',
        authorName: 'Kai',
        content: 'For "I go to school" in Japanese:\n\n学校**に**行きます (gakkou ni ikimasu)\n\nThe particle に (ni) is used with directional verbs like 行く (iku - to go) to indicate the destination. Think of に as "to" or "toward" a place! 🏫',
        mentions: [],
        createdAt: '2026-05-20T09:05:15Z',
        editedAt: null,
        reactions: { '💡': ['student1'] },
      },
    ],
    'topic-3': [],
  })

  const messages = useMemo(
    () => allMessages[selectedTopicId || ''] || [],
    [allMessages, selectedTopicId]
  )

  const members: MemberInfo[] = [
    { username: 'student1', displayName: 'Alex Chen', online: true },
    { username: 'student2', displayName: 'Jordan Smith', online: true },
    { username: 'student3', displayName: 'Sam Williams', online: false },
    { username: 'teacher1', displayName: 'Ms. Tanaka', online: true },
  ]

  const onlineUsers: ChatUser[] = [
    { username: 'student2', displayName: 'Jordan Smith' },
    { username: 'teacher1', displayName: 'Ms. Tanaka' },
  ]

  const handleSend = useCallback(
    (content: string) => {
      if (!selectedTopicId) return
      const newMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        parentId: replyingTo,
        authorId: currentUser.username,
        authorName: currentUser.displayName,
        content,
        mentions: [],
        createdAt: new Date().toISOString(),
        editedAt: null,
        reactions: {},
      }
      setAllMessages((prev) => ({
        ...prev,
        [selectedTopicId]: [...(prev[selectedTopicId] || []), newMsg],
      }))
      setReplyingTo(null)
    },
    [selectedTopicId, replyingTo, currentUser]
  )

  return (
    <Box sx={{ display: 'flex', height: 500, border: 1, borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ width: 240, borderRight: 1, borderColor: 'divider' }}>
        <TopicList
          topics={topics}
          selectedTopicId={selectedTopicId}
          onSelectTopic={setSelectedTopicId}
          onCreateTopic={fn()}
          currentScope="section"
          onlineUsers={onlineUsers}
        />
      </Box>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <ThreadView
          messages={messages}
          currentUserId={currentUser.username}
          onReply={setReplyingTo}
          onReaction={fn()}
          typingUsers={[]}
          topicName={topics.find((t) => t.id === selectedTopicId)?.name}
        />
        <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
          <MessageInput
            onSend={handleSend}
            members={members}
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
          />
        </Box>
      </Box>
    </Box>
  )
}

const meta: Meta = {
  title: '💬 Collaborative Chat/ChatPanel',
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Box sx={{ p: 2 }}>
        <Story />
      </Box>
    ),
  ],
}

export default meta

export const FullDemo: StoryObj = {
  render: () => <MockChatPanel />,
}
