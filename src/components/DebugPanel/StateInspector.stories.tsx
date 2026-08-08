/**
 * Storybook stories for StateInspector component
 */

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { StateInspector } from './StateInspector';
import { StateSnapshot } from '../../utils/debug/StateSnapshot';
import { expect } from 'storybook/test'

const meta: Meta<typeof StateInspector> = {
  title: '🛠️ Developer Tools/Debug Panel/State Inspector',
  component: StateInspector,
};

export default meta;
type Story = StoryObj<typeof StateInspector>;

const mockSnapshot: StateSnapshot = {
  timestamp: new Date().toISOString(),
  version: '1.0.0',
  environment: {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    screenSize: { width: 1920, height: 1080 },
    viewport: { width: 1920, height: 1080 },
    url: 'http://localhost:3000/unit/test-unit',
    platform: 'MacIntel',
    language: 'en-US',
    cookiesEnabled: true,
    online: true,
  },
  localStorage: {
    'user-preferences': JSON.stringify({ theme: 'dark', language: 'en' }),
    'recent-units': JSON.stringify(['unit-1', 'unit-2', 'unit-3']),
  },
  sessionStorage: {
    'current-session': JSON.stringify({ id: 'session-123', startTime: Date.now() - 3600000 }),
  },
  componentTree: JSON.stringify([
    {
      id: 'editor-main',
      name: 'Editor3',
      props: { unitId: 'test-unit', readOnly: false },
      state: { editorState: '[Lexical State]', isSaving: false },
      renderCount: 3,
    },
    {
      id: 'toolbar-1',
      name: 'ToolbarPlugin',
      props: { editor: '[Lexical Editor]' },
      state: {},
      renderCount: 1,
    },
    {
      id: 'unit-context',
      name: 'UnitContext',
      props: {},
      state: { currentUnit: '[Unit Object]', isLoading: false },
      renderCount: 2,
    },
  ]),
  logs: JSON.stringify([
    { timestamp: Date.now() - 5000, level: 'info', message: 'Application started' },
    { timestamp: Date.now() - 3000, level: 'warn', message: 'Slow network detected' },
    { timestamp: Date.now() - 1000, level: 'error', message: 'Failed to save', stack: 'Error: Network timeout' },
  ]),
  dataStore: {
    units: [
      { name: 'Unit 1', id: 'unit-1' },
      { name: 'Unit 2', id: 'unit-2' },
    ],
    words: Array.from({ length: 128 }, (_, i) => ({ id: `word-${i}`, word: `word${i}` })),
  },
  contexts: {},
  performance: {
    memory: {
      usedJSHeapSize: 25000000,
      totalJSHeapSize: 50000000,
      jsHeapSizeLimit: 2000000000,
    },
    navigation: null,
    timing: {
      domContentLoaded: 850,
      loadComplete: 1250,
    },
  },
  errors: [
    { message: 'Network timeout', timestamp: Date.now() - 2000, stack: 'Error: timeout\n  at fetch...' },
  ],
};

const emptySnapshot: StateSnapshot = {
  timestamp: new Date().toISOString(),
  version: '1.0.0',
  environment: {
    userAgent: 'Mozilla/5.0',
    screenSize: { width: 1920, height: 1080 },
    viewport: { width: 1920, height: 1080 },
    url: 'http://localhost:3000',
    platform: 'MacIntel',
    language: 'en-US',
    cookiesEnabled: true,
    online: true,
  },
  localStorage: {},
  sessionStorage: {},
  componentTree: JSON.stringify([]),
  logs: JSON.stringify([]),
  dataStore: {},
  contexts: {},
  performance: {
    memory: { usedJSHeapSize: 0, totalJSHeapSize: 0, jsHeapSizeLimit: 0 },
    navigation: null,
    timing: { domContentLoaded: 0, loadComplete: 0 },
  },
  errors: [],
};

export const Default: Story = {
  args: {
    snapshot: mockSnapshot,
    onRefresh: () => console.log('Refresh clicked'),
    onExport: (snapshot) => console.log('Export:', snapshot),
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

export const EmptyState: Story = {
  args: {
    snapshot: emptySnapshot,
    onRefresh: () => console.log('Refresh clicked'),
    onExport: (snapshot) => console.log('Export:', snapshot),
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

export const WithErrors: Story = {
  args: {
    snapshot: {
      ...mockSnapshot,
      errors: [
        { message: 'TypeError: Cannot read property', timestamp: Date.now() - 5000, stack: 'TypeError...' },
        { message: 'Network error', timestamp: Date.now() - 3000, stack: 'Error: ECONNREFUSED' },
        { message: 'Authentication failed', timestamp: Date.now() - 1000, stack: 'Error: 401 Unauthorized' },
      ],
    },
    onRefresh: () => console.log('Refresh clicked'),
    onExport: (snapshot) => console.log('Export:', snapshot),
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

export const LargeDataSet: Story = {
  args: {
    snapshot: {
      ...mockSnapshot,
      localStorage: Object.fromEntries(
        Array.from({ length: 20 }, (_, i) => [`key-${i}`, `value-${i}`])
      ),
      componentTree: JSON.stringify(Array.from({ length: 50 }, (_, i) => ({
        id: `component-${i}`,
        name: `Component${i}`,
        props: { id: i, active: i % 2 === 0 },
        state: { count: i },
        renderCount: Math.floor(Math.random() * 10) + 1,
      }))),
      logs: JSON.stringify(Array.from({ length: 100 }, (_, i) => ({
        timestamp: Date.now() - i * 1000,
        level: (['info', 'warn', 'error'] as const)[i % 3],
        message: `Log message ${i}`,
      }))),
    },
    onRefresh: () => console.log('Refresh clicked'),
    onExport: (snapshot) => console.log('Export:', snapshot),
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};
