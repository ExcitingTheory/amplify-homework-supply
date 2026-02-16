/**
 * useDebugPanel hook
 * 
 * Provides easy access to debug panel state and controls
 * 
 * Debug panel can be enabled in production via:
 * - localStorage flag: localStorage.setItem('debug-mode-enabled', 'true')
 * - Keyboard shortcut: Cmd/Ctrl + Shift + D
 * - Secret trigger: Click menu icon 7 times within 3 seconds
 */

import { useState, useEffect, useCallback } from 'react';

const DEBUG_MODE_KEY = 'debug-mode-enabled';

export interface UseDebugPanelReturn {
  /** Whether the debug panel is open */
  isOpen: boolean;
  /** Open the debug panel */
  open: () => void;
  /** Close the debug panel */
  close: () => void;
  /** Toggle the debug panel */
  toggle: () => void;
  /** Whether debug mode is enabled (for production) */
  isDebugModeEnabled: boolean;
  /** Enable debug mode in production */
  enableDebugMode: () => void;
  /** Disable debug mode in production */
  disableDebugMode: () => void;
}

/**
 * Check if debug mode is enabled via localStorage
 */
export function isDebugModeEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(DEBUG_MODE_KEY) === 'true';
}

/**
 * Enable debug mode (persists across sessions)
 */
export function enableDebugMode(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DEBUG_MODE_KEY, 'true');
  console.log('🐛 Debug mode enabled. Refresh page to activate debug panel.');
}

/**
 * Disable debug mode
 */
export function disableDebugMode(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(DEBUG_MODE_KEY);
  console.log('🐛 Debug mode disabled.');
}

/**
 * Hook to control the debug panel
 */
export function useDebugPanel(): UseDebugPanelReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [debugModeEnabled, setDebugModeEnabled] = useState(false);

  // Check localStorage on mount
  useEffect(() => {
    setDebugModeEnabled(isDebugModeEnabled());
  }, []);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  const handleEnableDebugMode = useCallback(() => {
    enableDebugMode();
    setDebugModeEnabled(true);
  }, []);

  const handleDisableDebugMode = useCallback(() => {
    disableDebugMode();
    setDebugModeEnabled(false);
    setIsOpen(false);
  }, []);

  // Keyboard shortcut: Cmd/Ctrl + Shift + D
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        toggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);

  return {
    isOpen,
    open,
    close,
    toggle,
    isDebugModeEnabled: debugModeEnabled,
    enableDebugMode: handleEnableDebugMode,
    disableDebugMode: handleDisableDebugMode,
  };
}
