/**
 * @fileoverview Storybook stories for MessageInput component
 * @module CollaborativeChat/MessageInput.stories
 */

import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn } from 'storybook/test'
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
  tags: ['autodocs'],
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
}

export const WithReply: Story = {
  args: {
    members: mockMembers,
    replyingTo: 'msg-123',
    onCancelReply: fn(),
  },
}

export const Disabled: Story = {
  args: {
    members: mockMembers,
    disabled: true,
    placeholder: 'Connect to chat to send messages...',
  },
}

export const NoMembers: Story = {
  args: {
    members: [],
    placeholder: 'Type @ to mention someone...',
  },
}
