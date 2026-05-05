import React from 'react';
import { TutorCursorOverlay } from './TutorCursorOverlay';
import UnitContext from '../../context/unitContext';

function withUnitContext(overrides = {}) {
  const base = {
    unit: { id: 'unit-1' },
    workbookEnabled: true,
    workbook: {
      provider: { awareness: { getStates: () => new Map(), on: () => {}, off: () => {} } },
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
