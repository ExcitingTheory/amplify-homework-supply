import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { GuildPostFeed } from './GuildPostFeed'

const SAMPLE_LEXICAL_JSON = JSON.stringify({
  root: {
    children: [
      {
        children: [
          { detail: 0, format: 0, mode: 'normal', style: '', text: 'Hey team! Let\'s coordinate our practice for this week.', type: 'text', version: 1 },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
      {
        children: [
          { detail: 0, format: 1, mode: 'normal', style: '', text: 'Focus areas:', type: 'text', version: 1 },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
      {
        children: [
          {
            children: [
              { detail: 0, format: 0, mode: 'normal', style: '', text: 'Vocabulary chapters 5-7', type: 'text', version: 1 },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'listitem',
            value: 1,
            version: 1,
          },
          {
            children: [
              { detail: 0, format: 0, mode: 'normal', style: '', text: 'Grammar drills on irregular verbs', type: 'text', version: 1 },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'listitem',
            value: 2,
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'list',
        listType: 'bullet',
        start: 1,
        tag: 'ul',
        version: 1,
      },
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
})

const samplePosts = [
  {
    id: 'post-1',
    title: 'Weekly Practice Plan',
    data: SAMPLE_LEXICAL_JSON,
    authorId: 'user-1',
    createdAt: '2026-04-28T10:00:00Z',
    _version: 1,
  },
  {
    id: 'post-2',
    title: 'Great job on the quiz!',
    data: null,
    authorId: 'user-2',
    createdAt: '2026-04-27T15:30:00Z',
    _version: 1,
  },
  {
    id: 'post-3',
    title: 'Study resources shared',
    data: SAMPLE_LEXICAL_JSON,
    authorId: 'user-1',
    createdAt: '2026-04-25T09:00:00Z',
    _version: 2,
  },
]

const meta: Meta<typeof GuildPostFeed> = {
  title: '🏆 Gamification/Guilds & Teams/Guild Post Feed',
  component: GuildPostFeed,
  parameters: {
    layout: 'padded',
  },
}
export default meta

type Story = StoryObj<typeof GuildPostFeed>

export const WithPosts: Story = {
  args: {
    posts: samplePosts,
    currentUserId: 'user-1',
    isMember: true,
    onPublish: (post) => console.log('[Story] Publish:', post),
    onDelete: (id) => console.log('[Story] Delete:', id),
    isPublishing: false,
  },
}

export const EmptyFeed: Story = {
  args: {
    posts: [],
    currentUserId: 'user-1',
    isMember: true,
    onPublish: (post) => console.log('[Story] Publish:', post),
    isPublishing: false,
  },
}

export const NonMemberView: Story = {
  args: {
    posts: samplePosts,
    currentUserId: 'user-3',
    isMember: false,
    onPublish: () => {},
    isPublishing: false,
  },
}

export const Publishing: Story = {
  args: {
    posts: samplePosts,
    currentUserId: 'user-1',
    isMember: true,
    onPublish: () => {},
    isPublishing: true,
  },
}
