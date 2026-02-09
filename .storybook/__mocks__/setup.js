/**
 * Vitest setup for Storybook component tests
 * 
 * This file is loaded before running tests via @storybook/addon-vitest
 */

// Mock window.matchMedia for components that use it
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {}, // deprecated
      removeListener: () => {}, // deprecated
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    }),
  });
}

console.log('[Vitest Setup] Storybook test environment initialized');
