/**
 * Mock AuthContext for Storybook
 * 
 * Provides a mock authentication context that works with the aws-amplify/auth mock.
 * This prevents AuthContext from crashing in Storybook when components consume it.
 */

import React from 'react';

const AuthContext = React.createContext();

/**
 * Mock user for Storybook - can be customized per story
 */
const defaultMockUser = {
  attributes: {
    sub: 'student-alice-sub',
    email: 'alice@example.com',
    name: 'Alice Student',
  },
};

const defaultMockSession = {
  identityId: 'us-east-1:mock-identity-123',
  username: 'student-alice-sub', // Must match user.attributes.sub for UnitContext
  idToken: {
    toString: () => 'mock-id-token',
  },
};

/**
 * Mock AuthProvider for Storybook
 * 
 * Usage in stories:
 * ```jsx
 * export const CustomUser = {
 *   parameters: {
 *     mockAuth: {
 *       user: {
 *         attributes: {
 *           sub: 'instructor-bob-sub',
 *           email: 'bob@example.com',
 *           name: 'Bob Instructor',
 *         },
 *       },
 *       session: {
 *         username: 'instructor-bob-sub', // Must match user.attributes.sub
 *       },
 *       isLoading: false,
 *     },
 *   },
 * };
 * ```
 */
const MockAuthProvider = ({ children, mockUser, mockSession, isLoading = false, error = undefined }) => {
  const user = mockUser || defaultMockUser;
  // If mockSession is provided, merge with defaults; otherwise use default
  // This ensures session.username matches user.attributes.sub
  const session = mockSession ? {
    ...defaultMockSession,
    ...mockSession,
    username: mockSession.username || user.attributes.sub,
  } : {
    ...defaultMockSession,
    username: user.attributes.sub, // Always sync with user.attributes.sub
  };

  const value = {
    user,
    session,
    isLoading,
    error,
  };

  console.log('[Mock AuthContext] Providing auth:', value);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { MockAuthProvider as AuthProvider };
export default AuthContext;
