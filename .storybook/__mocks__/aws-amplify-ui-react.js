/**
 * @fileoverview Mock for @aws-amplify/ui-react in Storybook
 *
 * Bypasses the real Authenticator component which requires a live Cognito
 * connection. Instead, immediately renders children with a mock user/signOut
 * so pages wrapped in <MyAuth> render without delay.
 */
import React from 'react';

/**
 * Mock Authenticator — renders children immediately with mock signOut/user.
 * Supports both render-prop and regular children patterns.
 */
export function Authenticator({ children }) {
  const mockUser = { username: 'mock-user', attributes: {} };
  const mockSignOut = () => console.log('[Mock Authenticator] signOut called');

  if (typeof children === 'function') {
    return children({ signOut: mockSignOut, user: mockUser });
  }
  return React.createElement(React.Fragment, null, children);
}

/**
 * Mock ThemeProvider — passes children through without Amplify theming.
 */
export function ThemeProvider({ children }) {
  return React.createElement(React.Fragment, null, children);
}

/**
 * Mock Icon component used by VocabularyReview2.
 */
export function Icon(props) {
  return React.createElement('span', {
    className: 'amplify-icon',
    'data-testid': props.ariaLabel || 'amplify-icon',
    ...props,
  });
}
