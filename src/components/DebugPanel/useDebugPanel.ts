/**
 * useDebugPanel hook
 * 
 * Provides easy access to debug panel state and controls
 */

import { useState, useEffect, useCallback } from 'react';

export interface UseDebugPanelReturn {
  /** Whether the debug panel is open */
  isOpen: boolean;
  /** Open the debug panel */
  open: () => void;
  /** Close the debug panel */
  close: () => void;
  /** Toggle the debug panel */
  toggle: () => void;
}

/**
 * Hook to control the debug panel
 */
export function useDebugPanel(): UseDebugPanelReturn {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

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

  return { isOpen, open, close, toggle };
}
