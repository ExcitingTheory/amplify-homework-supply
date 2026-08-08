import React from 'react';
import { WorkbookProgress } from './WorkbookProgress';
import UnitContext from '../../context/unitContext';
import { expect } from 'storybook/test'

function withUnitContext(stats = {}, overrides = {}) {
  const base = {
    unit: { id: 'unit-1' },
    workbookEnabled: true,
    workbook: {
      provider: { awareness: { getStates: () => new Map() } },
    },
    workbookStats: {
      completion: 60,
      accuracy: 75,
      totalBlocks: 10,
      completeBlocks: 6,
      ...stats,
    },
    ...overrides,
  };
  return (Story: any) => (
    <UnitContext.Provider value={base as any}>
      <Story />
    </UnitContext.Provider>
  );
}

export default {
  title: '📓 Workbook/Progress',
  component: WorkbookProgress,
  parameters: {
    layout: 'centered',
    disableUnitContext: true,
    disableSectionContext: true,
    disableDictionaryContext: true,
  },
};

export const Default = {
  decorators: [withUnitContext()],
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
};

export const Compact = {
  args: { variant: 'compact' },
  decorators: [withUnitContext()],
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
};

export const Detailed = {
  args: { variant: 'detailed' },
  decorators: [withUnitContext()],
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
};

export const Complete = {
  args: { variant: 'detailed' },
  decorators: [
    withUnitContext({ completion: 100, accuracy: 92, totalBlocks: 8, completeBlocks: 8 }),
  ],
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
};

export const JustStarted = {
  args: { variant: 'detailed' },
  decorators: [
    withUnitContext({ completion: 10, accuracy: 0, totalBlocks: 10, completeBlocks: 1 }),
  ],
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
};

export const Disabled = {
  decorators: [withUnitContext({}, { workbookEnabled: false })],
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
};
