/**
 * Global type declarations for debug utilities
 * Extends Window interface with debug panel globals
 */

import ComponentTreeStore from './ComponentTreeStore';
import DebugLogger from './DebugLogger';
import type { ErrorInfo } from './StateSnapshot';

declare global {
  /**
   * Window interface extensions for debug utilities
   */
  interface Window {
    /**
     * Global component tree store for tracking React components
     * Automatically initialized when ComponentTreeStore is imported
     */
    __COMPONENT_TREE__?: ComponentTreeStore;
    
    /**
     * Global debug logger for capturing console output
     * Automatically initialized when DebugLogger is imported
     */
    __DEBUG_LOGGER__?: DebugLogger;
    
    /**
     * Error boundary tracking for recent errors
     * Populated by ErrorBoundary component
     */
    __ERROR_BOUNDARY__?: {
      /**
       * Get list of recent errors captured by error boundaries
       */
      getRecentErrors(): ErrorInfo[];
    };
    
    /**
     * Context values exposed for debugging
     * These are optional and may be set by application code
     */
    __UNIT_CONTEXT__?: unknown;
    __FILES_CONTEXT__?: unknown;
    __SESSION_CONTEXT__?: unknown;
  }
}

export {};
