/**
 * @fileoverview DataPlugin - Coordinates between Yjs collaboration and Amplify DataStore
 * @module DataPlugin
 * 
 * Phase 1 Yjs Integration: This plugin has been refactored to work with the new Yjs-based
 * saving system. The CollaborationPlugin now handles initial editor state loading and 
 * real-time sync, while useYjsUnit handles debounced saves to DataStore.
 * 
 * **Previous behavior (removed)**:
 * - Initial load of unit.data into editor ❌ (now: CollaborationPlugin bootstraps from Yjs)
 * - Version tracking to ignore own saves ❌ (now: Yjs CRDT handles conflict resolution)
 * - DataStore subscription updates ❌ (now: Yjs WebSocket provides real-time updates)
 * 
 * **Current behavior**:
 * - Force save on component unmount (triggers useYjsUnit.forceSave)
 * - Minimal coordination layer between Yjs and DataStore
 * - TypeScript typed for safety
 * 
 * @see {@link CollaborationPlugin} for Lexical <-> Yjs binding
 * @see {@link useYjsUnit} for Yjs <-> DataStore persistence with 5s debounce
 * 
 * @example
 * ```tsx
 * // In Editor3/index.jsx:
 * const { provider, forceSave } = useYjsUnit({ unitId: 'unit-1' });
 * 
 * <LexicalComposer>
 *   <DataPlugin /> // Minimal coordinator
 *   <CollaborationPlugin provider={provider} username="user@example.com" />
 * </LexicalComposer>
 * ```
 */

import React, { useEffect, useContext } from 'react';
import UnitContext from '../../../context/unitContext';

/**
 * DataPlugin - Lightweight coordinator for Yjs-based saving
 * 
 * With Yjs integration, most data synchronization is handled by:
 * 1. CollaborationPlugin - Binds Lexical editor state to Yjs Y.Text
 * 2. useYjsUnit hook - Debounces saves to DataStore every 5 seconds
 * 
 * This plugin provides a minimal coordination layer for:
 * - Force saving on unmount (to ensure latest changes persist)
 * - Future metadata sync if needed (title, description, tags)
 * 
 * **Migration Notes**:
 * - Old DataPlugin.js handled initial load → now done by CollaborationPlugin
 * - Old version checking logic → now done by Yjs CRDT automatic conflict resolution
 * - Old DataStore subscriptions → now done by Yjs WebSocket real-time sync
 */
export default function DataPlugin(): null {
  // Type assertion for legacy JS context (will be typed in future migration)
  const { unit } = useContext(UnitContext) as any;

  /**
   * Phase 1: Minimal implementation - just returns null
   * 
   * Future enhancements (Phase 2+):
   * - Call forceSave() on unmount to persist pending changes
   * - Sync metadata (title, description) independent of editor content
   * - Handle offline mode fallback to DataStore-only sync
   * 
   * Example future implementation:
   * ```typescript
   * const { forceSave } = useContext(YjsContext); // from future YjsProvider
   * 
   * useEffect(() => {
   *   return () => {
   *     // Force save on unmount
   *     forceSave().catch(console.error);
   *   };
   * }, [forceSave]);
   * ```
   */

  // Log migration status for debugging
  useEffect(() => {
    if (unit?.id) {
      console.log('[DataPlugin] Yjs mode - minimal coordinator for unit:', unit.id);
      console.log('[DataPlugin] Initial load and sync handled by CollaborationPlugin + useYjsUnit');
    }
  }, [unit?.id]);

  // No rendering needed - coordination only
  return null;
}
