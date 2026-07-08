/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Window augmentation for debug utilities.
 *
 * These globals are set by the debug panel infrastructure
 * (ComponentTreeStore, DebugLogger) and consumed by StateSnapshot.
 */

import type ComponentTreeStore from "../src/utils/debug/ComponentTreeStore";
import type DebugLogger from "../src/utils/debug/DebugLogger";

declare global {
  interface Window {
    __COMPONENT_TREE__?: ComponentTreeStore;
    __DEBUG_LOGGER__?: DebugLogger;
    __ERROR_BOUNDARY__?: {
      getRecentErrors(): any[];
    };
  }
}
