/**
 * Storybook stories for ComponentTreeView component
 */

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ComponentTreeView } from './ComponentTreeView';
import { ComponentMetadata } from '../../utils/debug/ComponentTreeStore';

const meta: Meta<typeof ComponentTreeView> = {
  title: '🛠️ Developer Tools/Debug Panel/Component Tree View',
  component: ComponentTreeView,
};

export default meta;
type Story = StoryObj<typeof ComponentTreeView>;

const mockComponents: ComponentMetadata[] = [
  {
    id: 'editor-1',
    name: 'Editor3',
    props: {
      unitId: 'unit-123',
      readOnly: false,
      placeholder: 'Start typing...',
    },
    state: {
      editorState: '[Lexical EditorState]',
      isSaving: false,
      lastSaved: Date.now() - 30000,
    },
    renderCount: 5,
  },
  {
    id: 'toolbar-1',
    name: 'ToolbarPlugin',
    props: {
      editor: '[Lexical Editor Instance]',
      showAdvanced: true,
    },
    state: {},
    renderCount: 2,
  },
  {
    id: 'toolbar-2',
    name: 'ToolbarPlugin',
    props: {
      editor: '[Lexical Editor Instance]',
      showAdvanced: false,
    },
    state: {},
    renderCount: 1,
  },
  {
    id: 'unit-context-1',
    name: 'UnitContext',
    props: {},
    state: {
      currentUnit: { id: 'unit-123', name: 'Test Unit' },
      isLoading: false,
      words: '[Array of 15 words]',
    },
    renderCount: 3,
  },
  {
    id: 'chat-1',
    name: 'ChatSidebar',
    props: {
      unitId: 'unit-123',
      position: 'right',
    },
    state: {
      messages: '[Array of messages]',
      isStreaming: false,
    },
    renderCount: 12,
  },
  {
    id: 'grade-view-1',
    name: 'WorkbookGradeView',
    props: {
      gradeId: 'grade-456',
      readOnly: true,
    },
    state: {
      accuracy: 85,
      complete: true,
    },
    renderCount: 1,
  },
];

export const Default: Story = {
  args: {
    tree: mockComponents,
  },
};

export const EmptyTree: Story = {
  args: {
    tree: [],
  },
};

export const SingleComponent: Story = {
  args: {
    tree: [mockComponents[0]],
  },
};

export const WithSelection: Story = {
  args: {
    tree: mockComponents,
    selectedId: 'editor-1',
    onSelectComponent: (component) => console.log('Selected:', component),
  },
};

export const ManyInstances: Story = {
  args: {
    tree: [
      ...mockComponents,
      {
        id: 'list-item-1',
        name: 'ListItem',
        props: { index: 0 },
        state: {},
        renderCount: 1,
      },
      {
        id: 'list-item-2',
        name: 'ListItem',
        props: { index: 1 },
        state: {},
        renderCount: 1,
      },
      {
        id: 'list-item-3',
        name: 'ListItem',
        props: { index: 2 },
        state: {},
        renderCount: 1,
      },
      {
        id: 'list-item-4',
        name: 'ListItem',
        props: { index: 3 },
        state: {},
        renderCount: 1,
      },
      {
        id: 'list-item-5',
        name: 'ListItem',
        props: { index: 4 },
        state: {},
        renderCount: 1,
      },
    ],
  },
};

export const HighRenderCount: Story = {
  args: {
    tree: [
      {
        id: 'inefficient-component',
        name: 'InefficientComponent',
        props: { data: '[Large Dataset]' },
        state: { lastUpdate: Date.now() },
        renderCount: 247,
      },
      ...mockComponents,
    ],
  },
};

export const ComplexProps: Story = {
  args: {
    tree: [
      {
        id: 'complex-1',
        name: 'ComplexComponent',
        props: {
          config: {
            nested: {
              deeply: {
                structured: 'data',
                array: [1, 2, 3, 4, 5],
                boolean: true,
              },
            },
          },
          callbacks: '[Function handlers]',
          refs: '[React Refs]',
        },
        state: {
          cache: new Map(),
          history: '[Array of 100 items]',
        },
        renderCount: 8,
      },
    ],
  },
};
