/**
 * Mock useYjsUnit hook for Storybook
 * Prevents loading real YJS dependencies
 */

export function useYjsUnit(config) {
  console.log('[Mock] useYjsUnit called with config:', config);
  return {
    provider: null,
    unit: null,
    isLoading: false,
    error: null,
    isSynced: false,
    isConnected: false,
    updateMetadata: (updates) => {
      console.log('[Mock] updateMetadata:', updates);
    },
    forceSave: async () => {
      console.log('[Mock] forceSave called');
    },
    ytext: null,
    ymetadata: null,
  };
}
