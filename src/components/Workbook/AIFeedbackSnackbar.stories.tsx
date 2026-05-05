import React from 'react';
import { AIFeedbackSnackbar } from './AIFeedbackSnackbar';

// Minimal mock provider that emits awareness events
function createMockProvider(opts = {}) {
  const listeners = new Map();
  return {
    awareness: {
      on: (event, fn) => {
        if (!listeners.has(event)) listeners.set(event, []);
        listeners.get(event).push(fn);
      },
      off: (event, fn) => {
        const fns = listeners.get(event) || [];
        listeners.set(event, fns.filter(f => f !== fn));
      },
      getLocalState: () => ({}),
      getStates: () => new Map(),
    },
    // Simulate an AI feedback event after mount
    _emitFeedback: (blockId) => {
      const fns = listeners.get('change') || [];
      fns.forEach(fn => fn());
    },
    ...opts,
  };
}

export default {
  title: '📓 Workbook/AI Feedback Snackbar',
  component: AIFeedbackSnackbar,
  parameters: {
    layout: 'centered',
    disableUnitContext: true,
    disableSectionContext: true,
    disableDictionaryContext: true,
  },
};

export const Default = {
  args: {
    provider: null,
    currentUsername: 'student-alice',
  },
};

export const WithProvider = {
  args: {
    provider: createMockProvider(),
    currentUsername: 'student-alice',
  },
};
