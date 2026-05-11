/**
 * Mock @aws-amplify/adapter-nextjs for Storybook
 * This is a server-side module that should not be used in the browser.
 */

export const createServerRunner = () => ({
  runWithAmplifyServerContext: async (fn) => fn(),
});

export const generateServerClientUsingCookies = () => ({
  models: {},
  graphql: () => Promise.resolve({ data: {} }),
});

export const createCookieStorageAdapterFromNextServerContext = () => ({});
