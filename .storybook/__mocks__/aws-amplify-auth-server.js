/**
 * Mock aws-amplify/auth/server for Storybook
 * This is a server-side module that should not be used in the browser.
 */

export const createServerRunner = () => {
  console.warn('[Mock] aws-amplify/auth/server is not available in Storybook');
  return {};
};

export const fetchAuthSession = async () => ({
  tokens: {
    idToken: {
      payload: {
        sub: 'mock-user-id',
        'cognito:username': 'mock-user',
        'cognito:groups': ['Admins', 'Instructors'],
      },
    },
  },
});
