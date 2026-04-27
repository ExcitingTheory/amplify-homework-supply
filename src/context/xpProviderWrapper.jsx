import React, { useContext, useMemo } from 'react';
import AuthContext from './authContext';
import { XPProvider } from './xpContext';
import { getAmplifyClient } from '../utils/amplifyClient';

/**
 * Bridges AuthContext → XPProvider by extracting the current user's
 * identity and passing it along with the Amplify Data Client.
 * Renders children directly when no user is logged in.
 */
export function XPProviderWrapper({ children }) {
  const { user } = useContext(AuthContext);
  const client = useMemo(() => getAmplifyClient(), []);
  const studentId = user?.username || user?.attributes?.sub || '';

  if (!studentId) {
    return <>{children}</>;
  }

  return (
    <XPProvider client={client} studentId={studentId}>
      {children}
    </XPProvider>
  );
}
