import React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn, expect, userEvent, within } from 'storybook/test'
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
    onPublish: fn(),
    disabled: false,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    // Type a post title
    const titleInput = canvas.getByPlaceholderText('Post title…')
    await userEvent.type(titleInput, 'Weekly Study Tips')

    // Publish button enabled once title has content
    const publishBtn = canvas.getByRole('button', { name: /Publish/i })
    expect(publishBtn).not.toBeDisabled()
    await userEvent.click(publishBtn)
    expect(args.onPublish).toHaveBeenCalled()
  },
}

export const WithInitialContent: Story = {
  args: {
    onPublish: fn(),
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
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    // Verify pre-filled title
    const titleInput = canvas.getByPlaceholderText('Post title…')
    expect((titleInput as HTMLInputElement).value).toBe('Editing an existing post')

    // Edit title and publish
    await userEvent.tripleClick(titleInput)
    await userEvent.type(titleInput, 'Updated Post Title')
    const publishBtn = canvas.getByRole('button', { name: /Publish/i })
    await userEvent.click(publishBtn)
    expect(args.onPublish).toHaveBeenCalled()
  },
}

export const Disabled: Story = {
  args: {
    onPublish: fn(),
    initialTitle: 'Saving...',
    disabled: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Publish button disabled
    const publishBtn = canvas.getByRole('button', { name: /Publish/i })
    expect(publishBtn).toBeDisabled()
  },
}
