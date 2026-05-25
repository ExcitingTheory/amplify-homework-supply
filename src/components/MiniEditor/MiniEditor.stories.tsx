import type { Meta, StoryObj } from '@storybook/react'
import MiniEditor from './MiniEditor'

const meta: Meta<typeof MiniEditor> = {
  title: 'Components/MiniEditor/MiniEditor',
  component: MiniEditor,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Unified Lexical mini editor with read-only and editable modes. ' +
          'Supports all custom blocks (quiz, answer, matching, etc.) and ' +
          'features a Notion-style hover "+" block inserter.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof MiniEditor>

// Sample Lexical JSON content with various block types
const sampleContent = JSON.stringify({
  root: {
    children: [
      {
        children: [
          { detail: 0, format: 0, mode: 'normal', style: '', text: 'Welcome to the Chat', type: 'text', version: 1 },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h2',
      },
      {
        children: [
          { detail: 0, format: 0, mode: 'normal', style: '', text: 'This is a message with ', type: 'text', version: 1 },
          { detail: 0, format: 1, mode: 'normal', style: '', text: 'bold', type: 'text', version: 1 },
          { detail: 0, format: 0, mode: 'normal', style: '', text: ' and ', type: 'text', version: 1 },
          { detail: 0, format: 2, mode: 'normal', style: '', text: 'italic', type: 'text', version: 1 },
          { detail: 0, format: 0, mode: 'normal', style: '', text: ' formatting.', type: 'text', version: 1 },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
      {
        children: [
          { detail: 0, format: 0, mode: 'normal', style: '', text: 'Here is a list:', type: 'text', version: 1 },
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
              { detail: 0, format: 0, mode: 'normal', style: '', text: 'First item', type: 'text', version: 1 },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'listitem',
            version: 1,
            value: 1,
          },
          {
            children: [
              { detail: 0, format: 0, mode: 'normal', style: '', text: 'Second item', type: 'text', version: 1 },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'listitem',
            version: 1,
            value: 2,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'list',
        version: 1,
        listType: 'bullet',
        start: 1,
        tag: 'ul',
      },
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
})

// ─── Read-Only Stories ────────────────────────────────────────────────────────

export const ReadOnly: Story = {
  args: {
    mode: 'readonly',
    content: sampleContent,
  },
}

export const ReadOnlyCompact: Story = {
  name: 'Read-Only (Compact)',
  args: {
    mode: 'readonly',
    content: sampleContent,
    compact: true,
  },
}

export const ReadOnlyWithMaxHeight: Story = {
  name: 'Read-Only (Scrollable)',
  args: {
    mode: 'readonly',
    content: sampleContent,
    maxHeight: 150,
  },
}

export const ReadOnlyEmpty: Story = {
  name: 'Read-Only (No content)',
  args: {
    mode: 'readonly',
    content: null,
  },
}

// ─── Editable Stories ─────────────────────────────────────────────────────────

export const Editable: Story = {
  args: {
    mode: 'editable',
    placeholder: 'Start writing...',
    showBlockInserter: true,
    onChange: (json: any) => console.log('[MiniEditor] onChange:', json),
  },
}

export const EditableWithContent: Story = {
  name: 'Editable (Pre-filled)',
  args: {
    mode: 'editable',
    content: sampleContent,
    placeholder: 'Edit this content...',
    showBlockInserter: true,
    onChange: (json: any) => console.log('[MiniEditor] onChange:', json),
  },
}

export const ChatMode: Story = {
  name: 'Editable (Chat Mode)',
  args: {
    mode: 'editable',
    chatMode: true,
    compact: true,
    placeholder: 'Message your class... (type @kai to ask the AI)',
    showBlockInserter: true,
    autoFocus: true,
    onSubmit: (json: any, text: string) => {
      console.log('[MiniEditor] onSubmit:', { json, text })
      alert(`Sent: ${text}`)
    },
  },
}

export const ChatModeNoBlockInserter: Story = {
  name: 'Chat Mode (No Block Inserter)',
  args: {
    mode: 'editable',
    chatMode: true,
    compact: true,
    placeholder: 'Simple chat message...',
    showBlockInserter: false,
    onSubmit: (json: any, text: string) => console.log('Sent:', text),
  },
}

// ─── Usage Context Stories ────────────────────────────────────────────────────

export const SquadDescription: Story = {
  name: 'Use Case: Squad Description',
  args: {
    mode: 'editable',
    placeholder: 'Describe your squad...',
    showBlockInserter: true,
    maxHeight: 300,
    onChange: (json: any) => console.log('[Squad] Saved:', json),
  },
}

export const CampaignBriefing: Story = {
  name: 'Use Case: Campaign Briefing',
  args: {
    mode: 'editable',
    content: sampleContent,
    placeholder: 'Write the campaign briefing...',
    showBlockInserter: true,
    onChange: (json: any) => console.log('[Campaign] Saved:', json),
  },
}
