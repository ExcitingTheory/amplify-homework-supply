/**
 * Mock aws-amplify/auth/server for Storybook
 * Reads the currently set mock user so RSC auth checks match client-side auth.
 */
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';

export const createServerRunner = () => {
  console.warn('[Mock] aws-amplify/auth/server is not available in Storybook');
  return {};
};

export const fetchAuthSession = async () => {
  const user = await getCurrentUser().catch(() => ({ username: 'mock-user', userId: 'mock-user-id' }));
  const attrs = await fetchUserAttributes().catch(() => ({ sub: user.userId }));
  return {
    tokens: {
      idToken: {
        payload: {
          sub: attrs.sub || user.userId,
          'cognito:username': user.username,
          'cognito:groups': [],
        },
      },
    },
  };
};
