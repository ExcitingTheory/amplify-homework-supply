/**
 * @fileoverview Storybook stories for ToolCallPreview component
 * 
 * Demonstrates AI tool call preview functionality with:
 * - Different tool types (search, create, update, delete)
 * - Various states (pending, executing, executed, error)
 * - Parameter editing workflows
 * - Confirmation/cancellation interactions
 * 
 * @module ChatSidebar/ToolCallPreview.stories
 */

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import ToolCallPreview from './ToolCallPreview';
import { toolDefinitions } from '../../utils/chatTools';

const meta: Meta<typeof ToolCallPreview> = {
  title: '💬 AI Assistant/Components/Tool Call Preview',
  component: ToolCallPreview,
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof ToolCallPreview>;

// Find tool definitions for stories
const searchContentDef = toolDefinitions.find(t => t.function.name === 'search_content');
const createSectionDef = toolDefinitions.find(t => t.function.name === 'create_section');
const generateContentDef = toolDefinitions.find(t => t.function.name === 'generate_unit_content');

export const SearchContentPending: Story = {
  args: {
    toolName: 'search_content',
    toolCallId: 'call_abc123',
    parameters: {
      query: 'Japanese particles',
      type: 'all',
      limit: 10,
    },
    toolDefinition: searchContentDef,
    state: 'pending',
    onConfirm: (params) => console.log('Confirmed with params:', params),
    onCancel: () => console.log('Cancelled'),
    onEdit: (params) => console.log('Edited params:', params),
  },
};

export const CreateSectionPending: Story = {
  args: {
    toolName: 'create_section',
    toolCallId: 'call_def456',
    parameters: {
      name: 'Japanese 101 - Fall 2026',
      description: 'Beginner Japanese language course',
      learner: 'fall2026-jpn101',
    },
    toolDefinition: createSectionDef,
    state: 'pending',
    onConfirm: (params) => console.log('Confirmed with params:', params),
    onCancel: () => console.log('Cancelled'),
  },
};

export const GenerateContentPending: Story = {
  args: {
    toolName: 'generate_unit_content',
    toolCallId: 'call_ghi789',
    parameters: {
      contentType: 'explanation',
      topic: 'Japanese particles (は, が, を)',
      instructions: 'Include examples for each particle with translations',
      includeMarkdown: true,
    },
    toolDefinition: generateContentDef,
    state: 'pending',
    onConfirm: (params) => console.log('Confirmed with params:', params),
    onCancel: () => console.log('Cancelled'),
  },
};

export const ToolExecuting: Story = {
  args: {
    toolName: 'search_content',
    toolCallId: 'call_exec123',
    parameters: {
      query: 'vocabulary about food',
      type: 'words',
      limit: 5,
    },
    toolDefinition: searchContentDef,
    state: 'executing',
  },
};

export const ToolExecuted: Story = {
  args: {
    toolName: 'create_section',
    toolCallId: 'call_done456',
    parameters: {
      name: 'Advanced Japanese',
      description: 'Advanced level course',
    },
    toolDefinition: createSectionDef,
    state: 'executed',
  },
};

export const ToolError: Story = {
  args: {
    toolName: 'create_unit',
    toolCallId: 'call_err789',
    parameters: {
      name: '',  // Empty name should trigger error
      description: 'Test unit',
    },
    state: 'error',
  },
};

export const CompactView: Story = {
  args: {
    toolName: 'add_timer_to_unit',
    toolCallId: 'call_compact',
    parameters: {
      unitId: 'unit-123',
      seconds: 1800,
    },
    state: 'pending',
    compact: true,
    onConfirm: (params) => console.log('Confirmed:', params),
    onCancel: () => console.log('Cancelled'),
  },
};

export const AllToolTypes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <ToolCallPreview
        toolName="search_content"
        toolCallId="call_1"
        parameters={{ query: 'test', type: 'all' }}
        toolDefinition={searchContentDef}
        state="pending"
      />
      <ToolCallPreview
        toolName="create_section"
        toolCallId="call_2"
        parameters={{ name: 'Test Section' }}
        toolDefinition={createSectionDef}
        state="executing"
      />
      <ToolCallPreview
        toolName="generate_unit_content"
        toolCallId="call_3"
        parameters={{ contentType: 'quiz', topic: 'Verb conjugation' }}
        toolDefinition={generateContentDef}
        state="executed"
      />
    </div>
  ),
};
