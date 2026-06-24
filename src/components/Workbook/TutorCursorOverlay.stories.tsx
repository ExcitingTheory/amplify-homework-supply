import React from 'react';
import { TutorCursorOverlay } from './TutorCursorOverlay';
import UnitContext from '../../context/unitContext';

function withUnitContext(overrides: Record<string, any> = {}) {
  const awareness = {
    getStates: () => new Map(),
    on: () => {},
    off: () => {},
    clientID: 0,
  };
  const base = {
    unit: { id: 'unit-1' },
    workbookEnabled: true,
    workbook: {
      provider: {
        awareness,
        getAwareness: () => awareness,
        onAwarenessChange: () => () => {},
        ...overrides.workbook,
      },
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
  title: '📓 Workbook/Tutor Cursor Overlay',
  component: TutorCursorOverlay,
  parameters: {
    layout: 'padded',
    disableUnitContext: true,
    disableSectionContext: true,
    disableDictionaryContext: true,
  },
};

export const NoTutors = {
  decorators: [withUnitContext()],
};

export const Disabled = {
  decorators: [withUnitContext({ workbookEnabled: false })],
};
