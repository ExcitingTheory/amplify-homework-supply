import React from 'react';
import AuthContext from '../authContext';

/**
 * Example component that consumes AuthContext
 * Demonstrates the mock working in Storybook
 */
const AuthDisplay = () => {
  const { user, session, isLoading, error } = React.useContext(AuthContext);

  if (isLoading) {
    return <div style={{ padding: 20 }}>Loading authentication...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: 20, color: 'red' }}>
        <h3>Authentication Error</h3>
        <p>{error.message}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: 20 }}>
        <h3>Not Authenticated</h3>
        <p>Please sign in to continue.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h2>Authentication Status</h2>
      
      <h3>User Information</h3>
      <table style={{ borderCollapse: 'collapse', marginBottom: 20 }}>
        <tbody>
          <tr>
            <td style={{ padding: 8, fontWeight: 'bold' }}>Sub:</td>
            <td style={{ padding: 8 }}>{user.attributes?.sub}</td>
          </tr>
          <tr>
            <td style={{ padding: 8, fontWeight: 'bold' }}>Email:</td>
            <td style={{ padding: 8 }}>{user.attributes?.email}</td>
          </tr>
          <tr>
            <td style={{ padding: 8, fontWeight: 'bold' }}>Name:</td>
            <td style={{ padding: 8 }}>{user.attributes?.name || 'N/A'}</td>
          </tr>
          {user.attributes?.['cognito:groups'] && (
            <tr>
              <td style={{ padding: 8, fontWeight: 'bold' }}>Groups:</td>
              <td style={{ padding: 8 }}>
                {user.attributes['cognito:groups'].join(', ')}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <h3>Session Information</h3>
      <table style={{ borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td style={{ padding: 8, fontWeight: 'bold' }}>Identity ID:</td>
            <td style={{ padding: 8 }}>{session?.identityId}</td>
          </tr>
          <tr>
            <td style={{ padding: 8, fontWeight: 'bold' }}>ID Token:</td>
            <td style={{ padding: 8, fontFamily: 'monospace', fontSize: 12 }}>
              {session?.idToken?.toString?.() || 'N/A'}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

/**
 * Demonstrates AuthContext mock in Storybook
 */
export default {
  title: 'Examples/AuthContext Mock',
  component: AuthDisplay,
  parameters: {
    docs: {
      description: {
        component: 'Demonstrates how the AuthContext mock works in Storybook. See `.storybook/__mocks__/AUTH_MOCK_GUIDE.md` for full documentation.',
      },
    },
  },
};

/**
 * Default authenticated state with student user
 */
export const DefaultStudent = {
  render: () => <AuthDisplay />,
};

/**
 * Instructor user with groups
 */
export const InstructorUser = {
  parameters: {
    mockAuth: {
      user: {
        attributes: {
          sub: 'instructor-bob-sub',
          email: 'bob@example.com',
          name: 'Bob Instructor',
          'cognito:groups': ['Instructors'],
        },
      },
    },
  },
  render: () => <AuthDisplay />,
};

/**
 * Admin user with multiple groups
 */
export const AdminUser = {
  parameters: {
    mockAuth: {
      user: {
        attributes: {
          sub: 'admin-user-sub',
          email: 'admin@example.com',
          name: 'Admin User',
          'cognito:groups': ['Admins', 'Instructors'],
        },
      },
    },
  },
  render: () => <AuthDisplay />,
};

/**
 * Loading authentication state
 */
export const LoadingState = {
  parameters: {
    mockAuth: {
      isLoading: true,
    },
  },
  render: () => <AuthDisplay />,
};

/**
 * Authentication error state
 */
export const ErrorState = {
  parameters: {
    mockAuth: {
      error: new Error('Failed to authenticate user'),
      isLoading: false,
    },
  },
  render: () => <AuthDisplay />,
};

/**
 * Not authenticated / signed out state
 */
export const NotAuthenticated = {
  parameters: {
    mockAuth: {
      user: undefined,
      session: undefined,
      isLoading: false,
    },
  },
  render: () => <AuthDisplay />,
};

/**
 * Moderator user
 */
export const ModeratorUser = {
  parameters: {
    mockAuth: {
      user: {
        attributes: {
          sub: 'moderator-user-sub',
          email: 'moderator@example.com',
          name: 'Moderator User',
          'cognito:groups': ['Moderators'],
        },
      },
    },
  },
  render: () => <AuthDisplay />,
};
