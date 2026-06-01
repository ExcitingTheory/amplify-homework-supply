import React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { SquadPostEditor } from './SquadPostEditor'

const meta: Meta<typeof SquadPostEditor> = {
  title: '🏆 Gamification/Squads & Teams/Squad Post Editor',
  component: SquadPostEditor,
  parameters: {
    layout: 'padded',
  },
}
export default meta

type Story = StoryObj<typeof SquadPostEditor>

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
