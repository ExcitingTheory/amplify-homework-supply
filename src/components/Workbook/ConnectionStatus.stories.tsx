import React from 'react';
import { ConnectionStatus } from './ConnectionStatus';
import UnitContext from '../../context/unitContext';

const baseContext = {
  unit: { id: 'unit-1', name: 'Test Unit' },
  grade: { id: 'grade-1' },
  workbookEnabled: true,
  workbook: {
    provider: { awareness: { getStates: () => new Map() } },
    joinCode: 'ABC-123',
  },
};

function withUnitContext(overrides = {}) {
  return (Story) => (
    <UnitContext.Provider value={{ ...baseContext, ...overrides }}>
      <Story />
    </UnitContext.Provider>
  );
}

export default {
  title: '📓 Workbook/Connection Status',
  component: ConnectionStatus,
  parameters: {
    layout: 'centered',
    disableUnitContext: true,
    disableSectionContext: true,
    disableDictionaryContext: true,
  },
};

export const Connected = {
  decorators: [withUnitContext()],
};

export const ConnectedMedium = {
  args: { size: 'medium' },
  decorators: [withUnitContext()],
};

export const NoLabel = {
  args: { showLabel: false },
  decorators: [withUnitContext()],
};

export const Disabled = {
  decorators: [withUnitContext({ workbookEnabled: false })],
};
