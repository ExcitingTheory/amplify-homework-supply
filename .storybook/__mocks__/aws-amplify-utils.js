/**
 * Mock aws-amplify/utils for Storybook
 */

export const Cache = {
  getItem: async (key) => {
    console.log('Mock Cache.getItem called with:', key);
    return null; // Always return null to force "fetch"
  },
  setItem: async (key, value, options) => {
    console.log('Mock Cache.setItem called with:', key, value);
  },
  clear: () => {
    console.log('Mock Cache.clear called');
  },
};
