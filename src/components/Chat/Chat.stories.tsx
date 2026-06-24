import React from 'react'
import { ChatPanel } from './ChatPanel'
import { TopicList } from './TopicList'
import { ThreadView } from './ThreadView'
import { MessageComposer } from './MessageComposer'
import { MentionChip } from './MentionChip'
import { fn } from 'storybook/test'

// ============================================================================
// Mock Data
// ============================================================================

const mockUser = {
  username: 'user-123',
  displayName: 'Alex Johnson',
  role: 'learner',
}

const mockMembers = [
  { username: 'user-456', displayName: 'Maria Garcia' },
  { username: 'user-789', displayName: 'David Chen' },
  { username: 'user-101', displayName: 'Sarah Williams' },
  { username: 'user-102', displayName: 'James Wilson' },
]

const mockTopics = [
  {
    id: 'topic-1',
    name: '#general',
    scope: 'section',
    createdBy: 'user-456',
    createdByName: 'Maria Garcia',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    pinned: true,
    archived: false,
  },
  {
    id: 'topic-2',
    name: '#homework-help',
    scope: 'section',
    createdBy: 'user-789',
    createdByName: 'David Chen',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    pinned: false,
    archived: false,
  },
  {
    id: 'topic-3',
    name: '#unit-discussion',
    scope: 'unit:unit-abc',
    createdBy: 'user-123',
    createdByName: 'Alex Johnson',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    pinned: false,
    archived: false,
  },
]

const mockMessages = [
  {
    id: 'msg-1',
    parentId: null,
    authorId: 'user-456',
    authorName: 'Maria Garcia',
    content: 'Hey everyone! Does anyone understand the reading for today?',
    mentions: [],
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    editedAt: null,
    reactions: { '👍': ['user-789', 'user-101'] },
  },
  {
    id: 'msg-2',
    parentId: null,
    authorId: 'user-789',
    authorName: 'David Chen',
    content: 'Yeah I found it confusing too. @kai can you explain the main concept?',
    mentions: ['@kai'],
    createdAt: new Date(Date.now() - 3000000).toISOString(),
    editedAt: null,
    reactions: {},
  },
  {
    id: 'msg-3',
    parentId: 'msg-2',
    authorId: 'kai-bot',
    authorName: 'Kai',
    content:
      'The main concept revolves around how organisms adapt to their environment through natural selection. Think of it as a filter — traits that help survival get passed on more frequently.',
    mentions: [],
    createdAt: new Date(Date.now() - 2900000).toISOString(),
    editedAt: null,
    reactions: { '🙏': ['user-789'] },
  },
  {
    id: 'msg-4',
    parentId: null,
    authorId: 'user-123',
    authorName: 'Alex Johnson',
    content: 'Thanks @"David Chen"! That explanation helps a lot.',
    mentions: ['@David Chen'],
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    editedAt: null,
    reactions: { '❤️': ['user-456'] },
  },
]

const mockReplies = [mockMessages[2]] // msg-3 is a reply to msg-2

// ============================================================================
// Stories: ChatPanel
// ============================================================================

export default {
  title: '💬 Chat/ChatPanel',
  component: ChatPanel,
  parameters: {
    layout: 'fullscreen',
  },
}

/**
 * Note: ChatPanel requires a Yjs WebSocket connection.
 * In Storybook, it will show the FAB but won't connect.
 * See individual component stories for interactive demos.
 */
export const Default = {
  args: {
    roomType: 'section',
    roomId: 'section-123',
    user: mockUser,
    scope: 'section',
    members: mockMembers,
  },
}

// ============================================================================
// Stories: TopicList
// ============================================================================

export const TopicListDefault = {
  render: (args: any) => <TopicList {...args} />,
  args: {
    topics: mockTopics,
    activeTopicId: null,
    onSelectTopic: fn(),
    onCreateTopic: fn(),
    onPinTopic: fn(),
    onArchiveTopic: fn(),
  },
}

export const TopicListWithActive = {
  render: (args: any) => <TopicList {...args} />,
  args: {
    topics: mockTopics,
    activeTopicId: 'topic-1',
    onSelectTopic: fn(),
    onCreateTopic: fn(),
    onPinTopic: fn(),
    onArchiveTopic: fn(),
  },
}

export const TopicListEmpty = {
  render: (args: any) => <TopicList {...args} />,
  args: {
    topics: [],
    activeTopicId: null,
    onSelectTopic: fn(),
    onCreateTopic: fn(),
    onPinTopic: fn(),
    onArchiveTopic: fn(),
  },
}

// ============================================================================
// Stories: ThreadView
// ============================================================================

export const ThreadViewWithMessages = {
  render: (args: any) => (
    <div style={{ height: 400, display: 'flex', flexDirection: 'column' }}>
      <ThreadView {...args} />
    </div>
  ),
  args: {
    messages: mockMessages.filter((m) => m.parentId === null),
    getReplies: (parentId: string) => mockMessages.filter((m) => m.parentId === parentId),
    onReact: fn(),
    onEdit: fn(),
    onDelete: fn(),
    currentUser: mockUser,
    typingUsers: [],
  },
}

export const ThreadViewWithTyping = {
  render: (args: any) => (
    <div style={{ height: 400, display: 'flex', flexDirection: 'column' }}>
      <ThreadView {...args} />
    </div>
  ),
  args: {
    messages: mockMessages.filter((m) => m.parentId === null),
    getReplies: (parentId: string) => mockMessages.filter((m) => m.parentId === parentId),
    onReact: fn(),
    onEdit: fn(),
    onDelete: fn(),
    currentUser: mockUser,
    typingUsers: [{ username: 'user-456', displayName: 'Maria Garcia' }],
  },
}

export const ThreadViewEmpty = {
  render: (args: any) => (
    <div style={{ height: 400, display: 'flex', flexDirection: 'column' }}>
      <ThreadView {...args} />
    </div>
  ),
  args: {
    messages: [],
    getReplies: () => [],
    onReact: fn(),
    onEdit: fn(),
    onDelete: fn(),
    currentUser: mockUser,
    typingUsers: [],
  },
}

// ============================================================================
// Stories: MessageComposer
// ============================================================================

export const ComposerDefault = {
  render: (args: any) => <MessageComposer {...args} />,
  args: {
    onSend: fn(),
    members: mockMembers,
    onTyping: fn(),
  },
}

export const ComposerWithReply = {
  render: (args: any) => <MessageComposer {...args} />,
  args: {
    onSend: fn(),
    members: mockMembers,
    onTyping: fn(),
    replyTo: {
      id: 'msg-1',
      authorName: 'Maria Garcia',
      content: 'Does anyone understand the reading for today?',
    },
    onCancelReply: fn(),
  },
}

// ============================================================================
// Stories: MentionChip
// ============================================================================

export const MentionChipBot = {
  render: () => (
    <div style={{ padding: 16, display: 'flex', gap: 8 }}>
      <MentionChip name="kai" />
      <MentionChip name="Maria Garcia" />
      <MentionChip name="David Chen" />
    </div>
  ),
}
