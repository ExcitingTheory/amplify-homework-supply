/**
 * Mock aws-amplify/api/internals for Storybook
 * This is a server-side module that should not be used in the browser.
 */

export const createClientWithAmplifyInstance = () => {
  console.warn('[Mock] aws-amplify/api/internals is not available in Storybook');
  return {};
};

export const generateClientWithAmplifyInstance = (options) => {
  console.warn('[Mock] generateClientWithAmplifyInstance is not available in Storybook');
  return {
    models: {},
    graphql: () => Promise.resolve({ data: {} }),
    queries: {},
    mutations: {},
  };
};
