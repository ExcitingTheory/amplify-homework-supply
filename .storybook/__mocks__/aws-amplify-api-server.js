/**
 * Mock aws-amplify/api/server for Storybook
 * This is a server-side module that should not be used in the browser.
 */

export const generateClient = () => {
  console.warn('[Mock] aws-amplify/api/server is not available in Storybook');
  return {};
};
