/**
 * Mock AuthContext for Storybook
 *
 * Re-exports the production AuthContext to ensure there's only ONE React Context instance
 * shared between the mock provider and all consumers. This prevents the "two contexts" bug
 * where MockAuthProvider provides to one context while UnitContext consumes from another.
 */

import React from "react";
import ProductionAuthContext from "../../src/context/authContext";

/**
 * Mock user for Storybook - can be customized per story
 */
const defaultMockUser = {
  attributes: {
    sub: "mock-user-sub",
    email: "alice@example.com",
    name: "Alice Student",
  },
};

const defaultMockSession = {
  identityId: "us-east-1:mock-identity-123",
  username: "mock-user-sub", // Must match user.attributes.sub for UnitContext
  groups: ["Admins", "Instructors"], // Required by AdminRouteGuard; override per story for student views
  idToken: {
    toString: () => "mock-id-token",
  },
};

// Re-export the production AuthContext - this ensures UnitContext and MockAuthProvider
// use the SAME React Context instance
const AuthContext = ProductionAuthContext;

// Debug: verify this mock module is being loaded
console.log(
  "[MOCK authContext.js] Module loaded - Re-exporting production AuthContext",
);

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
const MockAuthProvider = ({
  children,
  mockUser,
  mockSession,
  isLoading = false,
  error = undefined,
}) => {
  const user = mockUser || defaultMockUser;
  const groups =
    mockSession?.groups || user?.groups || defaultMockSession.groups;
  const username =
    mockSession?.username ||
    user?.attributes?.sub ||
    user?.userId ||
    user?.username ||
    defaultMockSession.username;
  // If mockSession is provided, merge with defaults; otherwise use default
  // This ensures session.username matches user.attributes.sub
  const session = mockSession
    ? {
        ...defaultMockSession,
        ...mockSession,
        username,
        groups,
      }
    : {
        ...defaultMockSession,
        username,
        groups,
      };

  const value = React.useMemo(
    () => ({
      user,
      session,
      isLoading,
      error,
    }),
    [user, session, isLoading, error],
  );

  console.log("[Mock AuthContext] Providing auth:", value);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { MockAuthProvider as AuthProvider };
export default AuthContext;
