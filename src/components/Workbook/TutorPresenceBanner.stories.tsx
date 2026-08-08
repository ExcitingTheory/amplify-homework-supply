import React from 'react';
import { TutorPresenceBanner } from './TutorPresenceBanner';
import UnitContext from '../../context/unitContext';
import { expect } from 'storybook/test'

function withUnitContext(overrides: Record<string, any> = {}) {
  const base = {
    unit: { id: 'unit-1' },
    workbookEnabled: true,
    workbook: {
      provider: { awareness: { getStates: () => new Map() } },
      hasTutorPresent: true,
      activeTutors: [
        { displayName: 'Dr. García', color: '#1976d2', clientId: 1 },
        { displayName: 'Prof. Smith', color: '#388e3c', clientId: 2 },
      ],
      ...overrides.workbook,
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
  title: '📓 Workbook/Tutor Presence Banner',
  component: TutorPresenceBanner,
  parameters: {
    layout: 'padded',
    disableUnitContext: true,
    disableSectionContext: true,
    disableDictionaryContext: true,
  },
};

export const TwoTutors = {
  decorators: [withUnitContext()],
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
};

export const SingleTutor = {
  decorators: [
    withUnitContext({
      workbook: {
        provider: { awareness: { getStates: () => new Map() } },
        hasTutorPresent: true,
        activeTutors: [
          { displayName: 'Dr. García', color: '#1976d2', clientId: 1 },
        ],
      },
    }),
  ],
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
};

export const NoTutors = {
  decorators: [
    withUnitContext({
      workbook: {
        provider: { awareness: { getStates: () => new Map() } },
        hasTutorPresent: false,
        activeTutors: [],
      },
    }),
  ],
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
};

export const Disabled = {
  decorators: [withUnitContext({ workbookEnabled: false })],
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
};
