/**
 * Storybook stories for ComponentTreeView component
 */

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ComponentTreeView } from './ComponentTreeView';
import { ComponentMetadata } from '../../utils/debug/ComponentTreeStore';
import { expect } from 'storybook/test'

const meta: Meta<typeof ComponentTreeView> = {
  title: '🛠️ Developer Tools/Debug Panel/Component Tree View',
  component: ComponentTreeView,
};

export default meta;
type Story = StoryObj<typeof ComponentTreeView>;

const now = Date.now();

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
      lastSaved: now - 30000,
    },
    mountTime: now - 60000,
    renderCount: 5,
    lastRenderTime: now - 1000,
    children: ['toolbar-1', 'toolbar-2'],
  },
  {
    id: 'toolbar-1',
    name: 'ToolbarPlugin',
    props: {
      editor: '[Lexical Editor Instance]',
      showAdvanced: true,
    },
    state: {},
    mountTime: now - 59000,
    renderCount: 2,
    lastRenderTime: now - 5000,
    children: [],
  },
  {
    id: 'toolbar-2',
    name: 'ToolbarPlugin',
    props: {
      editor: '[Lexical Editor Instance]',
      showAdvanced: false,
    },
    state: {},
    mountTime: now - 58000,
    renderCount: 1,
    lastRenderTime: now - 58000,
    children: [],
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
    mountTime: now - 62000,
    renderCount: 3,
    lastRenderTime: now - 2000,
    children: ['editor-1', 'chat-1'],
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
    mountTime: now - 55000,
    renderCount: 12,
    lastRenderTime: now - 500,
    children: [],
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
    mountTime: now - 50000,
    renderCount: 1,
    lastRenderTime: now - 50000,
    children: [],
  },
];

export const Default: Story = {
  args: {
    tree: mockComponents,
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
};

export const EmptyTree: Story = {
  args: {
    tree: [],
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
};

export const SingleComponent: Story = {
  args: {
    tree: [mockComponents[0]],
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
};

export const WithSelection: Story = {
  args: {
    tree: mockComponents,
    selectedId: 'editor-1',
    onSelectComponent: (component) => console.log('Selected:', component),
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
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
        mountTime: now - 40000,
        renderCount: 1,
        lastRenderTime: now - 40000,
        children: [],
      },
      {
        id: 'list-item-2',
        name: 'ListItem',
        props: { index: 1 },
        state: {},
        mountTime: now - 39000,
        renderCount: 1,
        lastRenderTime: now - 39000,
        children: [],
      },
      {
        id: 'list-item-3',
        name: 'ListItem',
        props: { index: 2 },
        state: {},
        mountTime: now - 38000,
        renderCount: 1,
        lastRenderTime: now - 38000,
        children: [],
      },
      {
        id: 'list-item-4',
        name: 'ListItem',
        props: { index: 3 },
        state: {},
        mountTime: now - 37000,
        renderCount: 1,
        lastRenderTime: now - 37000,
        children: [],
      },
      {
        id: 'list-item-5',
        name: 'ListItem',
        props: { index: 4 },
        state: {},
        mountTime: now - 36000,
        renderCount: 1,
        lastRenderTime: now - 36000,
        children: [],
      },
    ],
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
};

export const HighRenderCount: Story = {
  args: {
    tree: [
      {
        id: 'inefficient-component',
        name: 'InefficientComponent',
        props: { data: '[Large Dataset]' },
        state: { lastUpdate: now },
        mountTime: now - 120000,
        renderCount: 247,
        lastRenderTime: now - 100,
        children: [],
      },
      ...mockComponents,
    ],
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
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
        mountTime: now - 30000,
        renderCount: 8,
        lastRenderTime: now - 2000,
        children: [],
      },
    ],
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
};
