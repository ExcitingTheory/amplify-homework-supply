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
