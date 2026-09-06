/**
 * @fileoverview CollaborationPlugin - Real-time collaborative editing with Yjs
 * @module CollaborationPlugin
 *
 * Uses Lexical's official CollaborationPlugin with proper context provider
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

import React from "react";
import { CollaborationPlugin } from "@lexical/react/LexicalCollaborationPlugin";
import { LexicalCollaboration } from "@lexical/react/LexicalCollaborationContext";
import type { Provider } from "@lexical/yjs";
import type { YjsDocProvider } from "@/yjs/YjsProvider";

export interface YjsCollaborationPluginProps {
  provider: YjsDocProvider | null;
  username: string;
  color?: string;
  shouldBootstrap?: boolean;
  cursorsContainerRef?: React.RefObject<HTMLDivElement | null>;
}

/**
 * Collaboration plugin for real-time editing with Yjs
 *
 * Uses official Lexical CollaborationPlugin with LexicalCollaboration context provider
 */
export default function YjsCollaborationPlugin({
  provider,
  username,
  color = "#3b82f6",
  shouldBootstrap = true,
  cursorsContainerRef,
}: YjsCollaborationPluginProps) {
  // Create a provider factory for CollaborationPlugin
  const providerFactory = React.useCallback(
    (id: string, yjsDocMap: Map<string, any>): Provider => {
      // Guard instead of relying on the outer null-check — this hook must be
      // called unconditionally, so the null-provider case is offline mode and
      // this factory is never actually invoked by CollaborationPlugin then.
      if (!provider) {
        throw new Error(
          "YjsCollaborationPlugin: providerFactory called without a provider",
        );
      }
      const doc = provider.getDoc();
      const awareness = provider.getAwareness();

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
        connect: () => provider.reconnect(),
        disconnect: () => provider.disconnect(),
        off: () => {},
        on: () => {},
      } as Provider;
    },
    [provider],
  );

  // Offline mode - no collaboration
  if (!provider) {
    return null;
  }

  return (
    <LexicalCollaboration>
      <CollaborationPlugin
        id="yjs-collaboration"
        providerFactory={providerFactory}
        shouldBootstrap={shouldBootstrap}
        username={username}
        cursorColor={color}
        cursorsContainerRef={
          cursorsContainerRef as React.RefObject<HTMLElement>
        }
        awarenessData={{ user: { name: username, color } }}
      />
    </LexicalCollaboration>
  );
}
