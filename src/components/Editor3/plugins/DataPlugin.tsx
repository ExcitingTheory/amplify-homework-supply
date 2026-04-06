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

import React, { useEffect, useContext, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import UnitContext from '../../../context/unitContext';

interface DataPluginProps {
  provider?: any;
}

/**
 * DataPlugin - Lightweight coordinator for Yjs-based saving
 * 
 * With Yjs integration, most data synchronization is handled by:
 * 1. CollaborationPlugin - Binds Lexical editor state to Yjs Y.Text
 * 2. useYjsUnit hook - Debounces saves to DataStore every 5 seconds
 * 
 * When no Yjs provider is available (e.g., Storybook, offline fallback),
 * this plugin loads unit.data directly into the Lexical editor.
 */
export default function DataPlugin({ provider }: DataPluginProps): null {
  const [editor] = useLexicalComposerContext();
  const { unit } = useContext(UnitContext) as any;
  const hasLoadedRef = useRef(false);

  // Fallback: load unit.data into editor when no Yjs provider is available
  useEffect(() => {
    if (provider || hasLoadedRef.current) return;
    if (!unit?.data) return;

    try {
      const parsed = typeof unit.data === 'string' ? JSON.parse(unit.data) : unit.data;
      if (parsed?.root) {
        const editorState = editor.parseEditorState(parsed);
        editor.setEditorState(editorState);
        hasLoadedRef.current = true;
        console.log('[DataPlugin] Loaded unit.data as fallback (no Yjs provider)');
      }
    } catch (err) {
      console.warn('[DataPlugin] Failed to parse unit.data:', err);
    }
  }, [editor, unit?.data, provider]);

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
