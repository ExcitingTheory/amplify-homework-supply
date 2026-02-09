/**
 * Global DebugPanel provider
 * 
 * Wraps the application and provides debug panel access
 */

import React from 'react';
import { DebugPanel } from './DebugPanel';
import { useDebugPanel } from './useDebugPanel';

export interface DebugPanelProviderProps {
  /** Children to render */
  children: React.ReactNode;
  /** Whether to enable debug panel (default: true in development) */
  enabled?: boolean;
}

/**
 * Provider component that adds debug panel to the app
 */
export function DebugPanelProvider({
  children,
  enabled = process.env.NODE_ENV === 'development',
}: DebugPanelProviderProps) {
  const { isOpen, close } = useDebugPanel();

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <DebugPanel open={isOpen} onClose={close} />
    </>
  );
}

export default DebugPanelProvider;
