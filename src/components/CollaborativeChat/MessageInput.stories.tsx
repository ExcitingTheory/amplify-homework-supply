/**
 * @fileoverview Storybook stories for MessageInput component
 * @module CollaborativeChat/MessageInput.stories
 */

import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn, expect, userEvent, within } from 'storybook/test'
import MessageInput from './MessageInput'
import type { MemberInfo } from './types'

const mockMembers: MemberInfo[] = [
  { username: 'student1', displayName: 'Alex Chen', online: true },
  { username: 'student2', displayName: 'Jordan Smith', online: true },
  { username: 'student3', displayName: 'Sam Williams', online: false },
  { username: 'teacher1', displayName: 'Ms. Tanaka', online: true },
  { username: 'student4', displayName: 'Riley Johnson', online: false },
]

const meta: Meta<typeof MessageInput> = {
  title: '💬 Collaborative Chat/MessageInput',
  component: MessageInput,
  parameters: {
    layout: 'padded',
  },
  args: {
    onSend: fn(),
    onTypingChange: fn(),
  },
}

export default meta
type Story = StoryObj<typeof MessageInput>

export const Default: Story = {
  args: {
    members: mockMembers,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    // Type a message
    const input = canvas.getByPlaceholderText('Type a message...')
    await userEvent.type(input, 'Hello class!')

    // Send button enabled
    const sendBtn = canvas.getByRole('button', { name: /Send message/i })
    expect(sendBtn).not.toBeDisabled()

    // Press Enter to send
    await userEvent.keyboard('{Enter}')
    expect(args.onSend).toHaveBeenCalledWith('Hello class!')

    // Input cleared after send
    expect((input as HTMLInputElement).value).toBe('')
  },
}

export const WithReply: Story = {
  args: {
    members: mockMembers,
    replyingTo: 'msg-123',
    onCancelReply: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    // Reply indicator shown
    await canvas.findByText('Replying to message')

    // Click Cancel to dismiss reply
    const cancelBtn = canvas.getByText('Cancel')
    await userEvent.click(cancelBtn)
    expect(args.onCancelReply).toHaveBeenCalled()
  },
}

export const Disabled: Story = {
  args: {
    members: mockMembers,
    disabled: true,
    placeholder: 'Connect to chat to send messages...',
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    // Input disabled — cannot type
    const input = canvas.getByPlaceholderText('Connect to chat to send messages...')
    expect(input).toBeDisabled()

    // Send button disabled
    const sendBtn = canvas.getByRole('button', { name: /Send message/i })
    expect(sendBtn).toBeDisabled()
  },
}

export const NoMembers: Story = {
  args: {
    members: [],
    placeholder: 'Type @ to mention someone...',
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    // Type @ — no mention suggestions since there are no members
    // (only @kai would appear if it still shows the AI bot)
    const input = canvas.getByPlaceholderText('Type @ to mention someone...')
    await userEvent.type(input, '@unknownperson')

    // Mention dropdown should NOT appear (no members match)
    // The popper won't be open if no suggestions
    const popup = document.body.querySelector('[data-popper-placement]')
    if (popup) {
      // If popup is rendered, it should have no visible list items
      const items = within(popup as HTMLElement).queryAllByRole('option')
      expect(items).toHaveLength(0)
    }

    // Shift+Enter adds a newline instead of sending
    await userEvent.clear(input)
    await userEvent.type(input, 'line1')
    await userEvent.keyboard('{Shift>}{Enter}{/Shift}')
    expect(args.onSend).not.toHaveBeenCalled()
  },
}
