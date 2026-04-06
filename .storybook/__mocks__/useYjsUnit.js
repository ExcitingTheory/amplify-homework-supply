/**
 * Mock useYjsUnit hook for Storybook
 * Returns a real in-memory Y.Doc + Awareness so CollaborationPlugin works.
 * The Y.Doc starts empty; CollaborationPlugin's shouldBootstrap=true
 * initializes it from the editor's initialConfig.editorState (unit.data).
 */

import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness';
import { useRef, useCallback } from 'react';

/**
 * Creates an in-memory YjsDocProvider-compatible object
 */
function createInMemoryProvider(doc, awareness) {
  return {
    getDoc: () => doc,
    getAwareness: () => awareness,
    getText: (name) => doc.getText(name),
    getMap: (name) => doc.getMap(name),
    getArray: (name) => doc.getArray(name),
    reconnect: () => {},
    disconnect: () => {},
    isSynced: () => true,
    getState: () => Y.encodeStateAsUpdate(doc),
    getStateVector: () => Y.encodeStateVector(doc),
    applyUpdate: (update) => Y.applyUpdate(doc, update),
    setAwareness: (state) => awareness.setLocalState(state),
    getConnectedClients: () => [doc.clientID],
    getClientState: (id) => awareness.getStates().get(id) || null,
    destroy: () => { awareness.destroy(); doc.destroy(); },
  };
}

export function useYjsUnit(config) {
  const providerRef = useRef(null);

  if (!providerRef.current) {
    const doc = new Y.Doc();
    const awareness = new Awareness(doc);
    providerRef.current = createInMemoryProvider(doc, awareness);
    console.log('[Mock useYjsUnit] Created in-memory Y.Doc for:', config?.unitId);
  }

  const provider = providerRef.current;

  const updateMetadata = useCallback((updates) => {
    console.log('[Mock useYjsUnit] updateMetadata:', updates);
  }, []);

  const forceSave = useCallback(async () => {
    console.log('[Mock useYjsUnit] forceSave called');
  }, []);

  return {
    provider,
    unit: null,
    isLoading: false,
    error: null,
    isSynced: true,
    isConnected: true,
    updateMetadata,
    forceSave,
    ytext: provider.getText('content'),
    ymetadata: provider.getMap('metadata'),
  };
}
