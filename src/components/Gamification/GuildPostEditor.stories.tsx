import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { GuildPostEditor } from './GuildPostEditor'

const meta: Meta<typeof GuildPostEditor> = {
  title: '🏆 Gamification/Guilds & Teams/Guild Post Editor',
  component: GuildPostEditor,
  parameters: {
    layout: 'padded',
  },
}
export default meta

type Story = StoryObj<typeof GuildPostEditor>

export const Default: Story = {
  args: {
    onPublish: (post) => console.log('[Story] Published:', post),
    disabled: false,
  },
}

export const WithInitialContent: Story = {
  args: {
    onPublish: (post) => console.log('[Story] Published:', post),
    initialTitle: 'Editing an existing post',
    initialData: JSON.stringify({
      root: {
        children: [
          {
            children: [
              { detail: 0, format: 0, mode: 'normal', style: '', text: 'This is pre-filled content for editing.', type: 'text', version: 1 },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'paragraph',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'root',
        version: 1,
      },
    }),
    disabled: false,
  },
}

export const Disabled: Story = {
  args: {
    onPublish: () => {},
    initialTitle: 'Saving...',
    disabled: true,
  },
}
