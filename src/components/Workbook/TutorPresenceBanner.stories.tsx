import React from 'react';
import { TutorPresenceBanner } from './TutorPresenceBanner';
import UnitContext from '../../context/unitContext';

function withUnitContext(overrides = {}) {
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
  return (Story) => (
    <UnitContext.Provider value={base}>
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
};

export const Disabled = {
  decorators: [withUnitContext({ workbookEnabled: false })],
};
