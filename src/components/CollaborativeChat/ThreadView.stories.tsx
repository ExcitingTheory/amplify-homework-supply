/**
 * @fileoverview Storybook stories for ThreadView component
 * @module CollaborativeChat/ThreadView.stories
 */

import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn } from 'storybook/test'
import ThreadView from './ThreadView'
import type { ChatMessage, ChatUser } from './types'

const mockMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    parentId: null,
    authorId: 'student1',
    authorName: 'Alex',
    content: 'Hey everyone! Can someone explain how を works in this sentence: 本を読みます?',
    mentions: [],
    createdAt: '2026-05-20T10:00:00Z',
    editedAt: null,
    reactions: { '👍': ['student2', 'student3'] },
  },
  {
    id: 'msg-2',
    parentId: 'msg-1',
    authorId: 'student2',
    authorName: 'Jordan',
    content: 'を marks the direct object - the thing being read (本 = book)',
    mentions: [],
    createdAt: '2026-05-20T10:02:00Z',
    editedAt: null,
    reactions: {},
  },
  {
    id: 'msg-3',
    parentId: 'msg-1',
    authorId: 'kai-bot',
    authorName: 'Kai',
    content: 'Great question! In 本を読みます:\n\n- 本 (hon) = book (the object)\n- を (wo) = object marker particle\n- 読みます (yomimasu) = to read\n\nThe particle を tells us that 本 is what\'s being read. Think of it as pointing to "what receives the action." 📚',
    mentions: [],
    createdAt: '2026-05-20T10:02:30Z',
    editedAt: null,
    reactions: { '🙏': ['student1'], '💡': ['student1', 'student3'] },
  },
  {
    id: 'msg-4',
    parentId: null,
    authorId: 'student3',
    authorName: 'Sam',
    content: 'Is there a difference between は and が? I keep mixing them up',
    mentions: [],
    createdAt: '2026-05-20T10:05:00Z',
    editedAt: null,
    reactions: {},
  },
  {
    id: 'msg-5',
    parentId: null,
    authorId: 'teacher1',
    authorName: 'Ms. Tanaka',
    content: '@kai Can you explain the difference between は and が with simple examples?',
    mentions: ['@kai'],
    createdAt: '2026-05-20T10:06:00Z',
    editedAt: null,
    reactions: {},
  },
  {
    id: 'msg-6',
    parentId: 'msg-5',
    authorId: 'kai-bot',
    authorName: 'Kai',
    content: 'Sure! Here\'s a simple way to think about it:\n\n**は (wa) = "As for..."** (topic marker)\n- 私は学生です = "As for me, I\'m a student"\n\n**が (ga) = "It is... that"** (subject/emphasis)\n- 誰が来ますか？= "Who is it that comes?"\n\nQuick rule: Use は for known/general info, が for new/specific info! 🎯',
    mentions: [],
    createdAt: '2026-05-20T10:06:15Z',
    editedAt: null,
    reactions: { '🎉': ['student1', 'student2', 'student3'] },
  },
]

const mockTypingUsers: ChatUser[] = [
  { username: 'student2', displayName: 'Jordan' },
]

const meta: Meta<typeof ThreadView> = {
  title: '💬 Collaborative Chat/ThreadView',
  component: ThreadView,
  parameters: {
    layout: 'padded',
  },
  args: {
    onReply: fn(),
    onReaction: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ height: 500, border: '1px solid #e0e0e0', borderRadius: 8 }}>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof ThreadView>

export const WithMessages: Story = {
  args: {
    messages: mockMessages,
    currentUserId: 'student1',
    typingUsers: [],
    topicName: '#homework-help',
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
}

export const WithTypingIndicator: Story = {
  args: {
    messages: mockMessages,
    currentUserId: 'student1',
    typingUsers: mockTypingUsers,
    topicName: '#homework-help',
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
}

export const EmptyThread: Story = {
  args: {
    messages: [],
    currentUserId: 'student1',
    typingUsers: [],
    topicName: '#general',
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
}

export const BotConversation: Story = {
  args: {
    messages: [
      {
        id: 'msg-a',
        parentId: null,
        authorId: 'student1',
        authorName: 'Alex',
        content: '@kai What does 食べる mean?',
        mentions: ['@kai'],
        createdAt: '2026-05-20T14:00:00Z',
        editedAt: null,
        reactions: {},
      },
      {
        id: 'msg-b',
        parentId: 'msg-a',
        authorId: 'kai-bot',
        authorName: 'Kai',
        content: '食べる (taberu) means "to eat" in Japanese! It\'s a る-verb (ichidan verb), so conjugation is straightforward:\n\n- 食べます (tabemasu) - polite present\n- 食べた (tabeta) - past casual\n- 食べない (tabenai) - negative casual',
        mentions: [],
        createdAt: '2026-05-20T14:00:10Z',
        editedAt: null,
        reactions: { '👍': ['student1'] },
      },
    ],
    currentUserId: 'student1',
    typingUsers: [],
    topicName: '#kanji-practice',
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
}
