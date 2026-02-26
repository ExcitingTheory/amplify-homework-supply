/**
 * @fileoverview CollaborationPlugin - Real-time collaborative editing with Yjs
 * @module CollaborationPlugin
 * 
 * Wrapper around Lexical's official CollaborationPlugin that adapts our YjsDocProvider
 * 
 * @example
 * ```tsx
 * const { provider } = useYjsUnit({ unitId: 'unit-1' });
 * 
 * <LexicalComposer>
 *   <YjsCollaborationPlugin
 *     provider={provider}
 *     username="user@example.com"
 *     color="#3b82f6"
 *   />
 * </LexicalComposer>
 * ```
 */

import React from 'react';
import { CollaborationPlugin } from '@lexical/react/LexicalCollaborationPlugin';
import type { Provider } from '@lexical/yjs';

// Import YjsDocProvider - use @/ alias from tsconfig paths
import type { YjsDocProvider } from '@/yjs/YjsProvider';

export interface YjsCollaborationPluginProps {
  provider: YjsDocProvider | null;
  username: string;
  color?: string;
  shouldBootstrap?: boolean;
  cursorsContainerRef?: React.RefObject<HTMLElement>;
}

/**
 * Creates a provider factory compatible with Lexical's CollaborationPlugin
 */
function createProviderFactory(yjsProvider: YjsDocProvider) {
  return (id: string, yjsDocMap: Map<string, any>): Provider => {
    const awareness = yjsProvider.getAwareness();
    const doc = yjsProvider.getDoc();
    
    // Add the Yjs document to the map
    yjsDocMap.set(id, doc);
    
    // Return a Lexical-compatible Provider
    return {
      awareness: {
        getLocalState: () => awareness.getLocalState() as any,
        getStates: () => awareness.getStates() as any,
        off: (type: string, cb: any) => awareness.off(type as any, cb),
        on: (type: string, cb: any) => awareness.on(type as any, cb),
        setLocalState: (state: any) => awareness.setLocalState(state),
        setLocalStateField: (field: string, value: any) => 
          awareness.setLocalStateField(field, value),
      },
      connect: () => yjsProvider.reconnect(),
      disconnect: () => yjsProvider.disconnect(),
      off: () => {}, // WebSocket events handled internally by YjsDocProvider
      on: () => {},  // WebSocket events handled internally by YjsDocProvider
    } as Provider;
  };
}

/**
 * Collaboration plugin for real-time editing with Yjs
 * 
 * Uses Lexical's official CollaborationPlugin with our YjsDocProvider adapter
 */
export default function YjsCollaborationPlugin({
  provider,
  username,
  color = '#3b82f6',
  shouldBootstrap = true,
  cursorsContainerRef,
}: YjsCollaborationPluginProps) {
  // Offline mode - no collaboration
  if (!provider) {
    console.log('[YjsCollaborationPlugin] No provider - offline mode');
    return null;
  }

  console.log('[YjsCollaborationPlugin] Initializing collaboration for', username);

  return (
    <CollaborationPlugin
      id="yjs-collaboration"
      providerFactory={createProviderFactory(provider)}
      shouldBootstrap={shouldBootstrap}
      username={username}
      cursorColor={color}
      cursorsContainerRef={cursorsContainerRef}
      awarenessData={{ user: { name: username, color } }}
    />
  );
}
