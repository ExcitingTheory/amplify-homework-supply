/**
 * @fileoverview Storybook stories for TopicList component
 * @module CollaborativeChat/TopicList.stories
 */

import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn } from 'storybook/test'
import TopicList from './TopicList'
import type { ChatTopic, ChatUser, TopicScope } from './types'

const mockTopics: ChatTopic[] = [
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
    name: '#unit-3-questions',
    scope: 'unit:unit-abc',
    createdBy: 'student1',
    createdByName: 'Alex',
    createdAt: '2026-05-19T09:30:00Z',
    pinned: false,
    archived: false,
  },
  {
    id: 'topic-4',
    name: '#kanji-practice',
    scope: 'unit:unit-abc',
    createdBy: 'student2',
    createdByName: 'Jordan',
    createdAt: '2026-05-19T11:00:00Z',
    pinned: false,
    archived: false,
  },
  {
    id: 'topic-5',
    name: '#workbook-review',
    scope: 'workbook:grade-xyz',
    createdBy: 'student3',
    createdByName: 'Sam',
    createdAt: '2026-05-20T08:00:00Z',
    pinned: false,
    archived: false,
  },
]

const mockOnlineUsers: ChatUser[] = [
  { username: 'student1', displayName: 'Alex', color: '#4caf50' },
  { username: 'student2', displayName: 'Jordan', color: '#2196f3' },
  { username: 'teacher1', displayName: 'Ms. Tanaka', color: '#ff9800' },
]

const meta: Meta<typeof TopicList> = {
  title: '💬 Collaborative Chat/TopicList',
  component: TopicList,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  args: {
    onSelectTopic: fn(),
    onCreateTopic: fn(),
    onPinTopic: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ width: 260, height: 500, border: '1px solid #e0e0e0', borderRadius: 8 }}>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof TopicList>

export const SectionScope: Story = {
  args: {
    topics: mockTopics,
    selectedTopicId: 'topic-1',
    currentScope: 'section',
    onlineUsers: mockOnlineUsers,
  },
}

export const UnitScope: Story = {
  args: {
    topics: mockTopics,
    selectedTopicId: 'topic-3',
    currentScope: 'unit:unit-abc',
    onlineUsers: mockOnlineUsers,
  },
}

export const EmptyTopics: Story = {
  args: {
    topics: [],
    selectedTopicId: null,
    currentScope: 'section',
    onlineUsers: [],
  },
}

export const NoSelection: Story = {
  args: {
    topics: mockTopics,
    selectedTopicId: null,
    currentScope: 'section',
    onlineUsers: mockOnlineUsers,
  },
}
