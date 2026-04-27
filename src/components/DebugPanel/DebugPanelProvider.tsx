/**
 * Global DebugPanel provider
 * 
 * Wraps the application and provides debug panel access
 * 
 * Debug panel is enabled:
 * - Always in development mode
 * - In production when localStorage 'debug-mode-enabled' is 'true'
 * 
 * To enable in production:
 * - Click menu icon 7 times within 3 seconds
 * - Or set localStorage: localStorage.setItem('debug-mode-enabled', 'true')
 * - Then use keyboard shortcut: Cmd/Ctrl + Shift + D to open
 */

import React from 'react';
import { DebugPanel } from './DebugPanel';
import { useDebugPanel, isDebugModeEnabled } from './useDebugPanel';

export interface DebugPanelProviderProps {
  /** Children to render */
  children: React.ReactNode;
  /** Whether to force enable debug panel (overrides default logic) */
  enabled?: boolean;
}

/**
 * Provider component that adds debug panel to the app
 */
export function DebugPanelProvider({
  children,
  enabled,
}: DebugPanelProviderProps) {
  const { isOpen, close } = useDebugPanel();

  // Defer localStorage check to after mount to avoid SSR/client hydration mismatch.
  // On the server, isDebugModeEnabled() always returns false (no window), but on the
  // client it may return true — changing the render tree and causing a hydration error.
  const [shouldEnable, setShouldEnable] = React.useState(
    enabled ?? process.env.NODE_ENV === 'development'
  );

  React.useEffect(() => {
    if (enabled == null && process.env.NODE_ENV !== 'development') {
      setShouldEnable(isDebugModeEnabled());
    }
  }, [enabled]);

  if (!shouldEnable) {
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
