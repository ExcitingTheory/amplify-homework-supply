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

export const Hub = {
  listen: (channel, callback) => {
    console.log('Mock Hub.listen called for channel:', channel);
    return () => {
      console.log('Mock Hub.listen cleanup for channel:', channel);
    };
  },
  dispatch: (channel, payload) => {
    console.log('Mock Hub.dispatch called for channel:', channel, payload);
  },
};
