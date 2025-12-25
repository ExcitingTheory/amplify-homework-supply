/**
 * Mock aws-amplify/auth for Storybook
 */

export const fetchUserAttributes = async () => ({
  sub: 'mock-user-sub',
  email: 'mock@example.com',
});

export const getCurrentUser = async () => ({
  username: 'mock-user-sub',
  userId: 'mock-user-sub',
});

export const fetchAuthSession = async () => ({
  identityId: 'us-east-1:mock-identity-123',
  tokens: {
    accessToken: { toString: () => 'mock-access-token' },
    idToken: { toString: () => 'mock-id-token' },
  },
  credentials: {
    accessKeyId: 'mock-access-key',
    secretAccessKey: 'mock-secret-key',
  },
});

export const signOut = async () => {
  console.log('[Mock Auth] signOut');
};
