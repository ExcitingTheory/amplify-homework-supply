/**
 * Mock aws-amplify/auth for Storybook
 */

// Allow stories to set the current user
let mockCurrentUser = {
  username: 'student-alice-sub',
  userId: 'student-alice-sub',
  attributes: {
    sub: 'student-alice-sub',
    email: 'alice@example.com',
  },
};

export const setMockUser = (user) => {
  console.log('[Mock Auth] setMockUser:', user);
  mockCurrentUser = user;
};

export const fetchUserAttributes = async () => ({
  sub: mockCurrentUser.attributes?.sub || mockCurrentUser.userId,
  email: mockCurrentUser.attributes?.email || 'mock@example.com',
  ...mockCurrentUser.attributes,
});

export const getCurrentUser = async () => {
  console.log('[Mock Auth] getCurrentUser returning:', mockCurrentUser);
  return {
    username: mockCurrentUser.username,
    userId: mockCurrentUser.userId,
    attributes: mockCurrentUser.attributes,
  };
};

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

export const signIn = async () => {
  console.log('[Mock Auth] signIn');
  return { isSignedIn: true };
};

export const signUp = async () => {
  console.log('[Mock Auth] signUp');
  return { isSignUpComplete: true };
};

export const confirmSignIn = async () => {
  console.log('[Mock Auth] confirmSignIn');
};

export const confirmSignUp = async () => {
  console.log('[Mock Auth] confirmSignUp');
};

export const resetPassword = async () => {
  console.log('[Mock Auth] resetPassword');
};

export const confirmResetPassword = async () => {
  console.log('[Mock Auth] confirmResetPassword');
};

export const updatePassword = async () => {
  console.log('[Mock Auth] updatePassword');
};

export const updateUserAttribute = async () => {
  console.log('[Mock Auth] updateUserAttribute');
};

export const deleteUser = async () => {
  console.log('[Mock Auth] deleteUser');
};

export const resendSignUpCode = async () => {
  console.log('[Mock Auth] resendSignUpCode');
};

export const sendUserAttributeVerificationCode = async () => {
  console.log('[Mock Auth] sendUserAttributeVerificationCode');
};

export const confirmUserAttribute = async () => {
  console.log('[Mock Auth] confirmUserAttribute');
};

export const signInWithRedirect = async () => {
  console.log('[Mock Auth] signInWithRedirect');
};

export const autoSignIn = async () => {
  console.log('[Mock Auth] autoSignIn');
};
