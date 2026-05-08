/**
 * useYjsUnit - Real-time collaborative unit editing hook
 * 
 * Integrates Yjs CRDT for real-time collaboration with Amplify DataStore
 * for cross-device persistence.
 * 
 * @example
 * ```typescript
 * const { provider, unit, isSynced, ytext } = useYjsUnit({ unitId: 'unit-1' });
 * 
 * // Yjs handles real-time sync automatically
 * // Debounced saves to DataStore every 5 seconds
 * ```
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useYjsProvider } from '../yjs/hooks';
import { getAmplifyClient } from '../utils/amplifyClient';
import { saveDraftContent, saveYjsSnapshot, loadYjsSnapshot } from '../utils/unitContentStorage';
import * as Y from 'yjs';

export interface UseYjsUnitConfig {
  unitId?: string | null;
  enableWebSocket?: boolean;
  enablePersistence?: boolean;
  saveDebounceMs?: number;
}

export interface UseYjsUnitReturn {
  provider: ReturnType<typeof useYjsProvider>['provider'] | null;
  unit: any | null;
  isLoading: boolean;
  error: Error | null;
  isSynced: boolean;
  isConnected: boolean;
  updateMetadata: (updates: Record<string, any>) => void;
  forceSave: () => Promise<void>;
  ytext: Y.Text | null;
  ymetadata: Y.Map<any> | null;
}

/**
 * Hook for managing real-time collaborative unit editing with Yjs
 * 
 * Features:
 * - Real-time sync via WebSocket (<100ms latency)
 * - Offline persistence via IndexedDB
 * - Debounced saves to Amplify DataStore (default 5s)
 * - Automatic conflict resolution via CRDT
 * - Version conflict handling with reload
 */
export function useYjsUnit(config: UseYjsUnitConfig): UseYjsUnitReturn {
  const {
    unitId,
    enableWebSocket = true,
    enablePersistence = true,
    saveDebounceMs = 5000
  } = config;

  const client = getAmplifyClient();
  const [unit, setUnit] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const nextVersionRef = useRef(1);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Yjs provider only if we have a unitId
  const { provider, isSynced, isConnected } = useYjsProvider({
    docName: unitId ? `unit-${unitId}` : 'unit-null',
    connect: enableWebSocket && !!unitId,
    persistence: enablePersistence && !!unitId
  });

  // Load initial state from Amplify
  useEffect(() => {
    if (!unitId) {
      setIsLoading(false);
      return;
    }

    async function loadUnit() {
      try {
        setIsLoading(true);
        // TypeScript type guard - unitId is guaranteed to be string here
        const { data } = await client.models.Unit.get({ id: unitId as string });
        
        if (!data) {
          throw new Error(`Unit ${unitId} not found`);
        }

        // Unit record — content is loaded from S3 separately
        const parsedUnit = { ...data };

        setUnit(parsedUnit);
        nextVersionRef.current = ((data as any)._version || 0) + 1;

        // Load Yjs snapshot from S3
        if ((data as any).identityId && provider) {
          try {
            const yjsBytes = await loadYjsSnapshot((data as any).identityId, unitId as string);
            if (yjsBytes) {
              Y.applyUpdate(provider.getDoc(), yjsBytes);
              console.log(`[useYjsUnit] Applied Yjs snapshot from S3 for unit ${unitId}`);
            }
          } catch (err) {
            console.warn('[useYjsUnit] Failed to load snapshot from S3:', err);
          }
        }

        setIsLoading(false);
      } catch (err) {
        console.error('[useYjsUnit] Failed to load unit:', err);
        setError(err as Error);
        setIsLoading(false);
      }
    }

    if (provider) {
      loadUnit();
    }
  }, [unitId, provider, client]);

  // Debounced save to DataStore
  const saveToDataStore = useCallback(async () => {
    if (!unitId || !provider || !unit) {
      console.warn('[useYjsUnit] No unitId, provider, or unit available for save');
      return;
    }

    try {
      const ytext = provider.getText('editorContent');
      const ymetadata = provider.getMap('metadata');
      
      // Extract state
      const editorContent = ytext.toString();
      const yjsState = Y.encodeStateAsUpdate(provider.getDoc());
      
      // Extract metadata
      const metadata: Record<string, any> = {};
      ymetadata.forEach((value, key) => {
        metadata[key] = value;
      });

      const identityId = (unit as any).identityId;
      if (!identityId) {
        console.warn('[useYjsUnit] Unit has no identityId, cannot save to S3');
        return;
      }

      console.log(`[useYjsUnit] Saving unit ${unitId} to S3 + DynamoDB (version ${nextVersionRef.current})`);

      // Upload content + snapshot to S3 in parallel (private — owner only)
      await Promise.all([
        saveDraftContent(identityId, unitId, JSON.stringify({ content: editorContent })),
        saveYjsSnapshot(identityId, unitId, yjsState),
      ]);

      // Bump contentVersion in DynamoDB (lightweight, no content payload)
      const currentContentVersion = (unit as any).contentVersion || 0;
      const nextContentVersion = currentContentVersion + 1;
      await client.models.Unit.update({
        id: unitId,
        contentVersion: nextContentVersion,
        ...metadata,
        _version: nextVersionRef.current
      } as any);

      // Optimistically increment version
      nextVersionRef.current += 1;
      setUnit((prev: any) => prev ? { ...prev, contentVersion: nextContentVersion } : prev);

      console.log(`[useYjsUnit] Successfully saved unit ${unitId}`);
    } catch (err: any) {
      if (err.message?.includes('version') || err.message?.includes('ConditionalCheck')) {
        console.warn('[useYjsUnit] Version conflict detected, reloading from DataStore...');
        
        try {
          // Reload from DataStore
          const { data } = await client.models.Unit.get({ id: unitId as string });
          if (data) {
            nextVersionRef.current = ((data as any)._version || 0) + 1;
            
            // Re-apply snapshot from S3
            const identityId = (data as any).identityId;
            if (identityId) {
              const yjsBytes = await loadYjsSnapshot(identityId, unitId as string);
              if (yjsBytes) {
                Y.applyUpdate(provider.getDoc(), yjsBytes);
                console.log('[useYjsUnit] Re-applied snapshot from S3 after version conflict');
              }
            }
          }
        } catch (reloadErr) {
          console.error('[useYjsUnit] Failed to reload after version conflict:', reloadErr);
          setError(reloadErr as Error);
        }
      } else {
        console.error('[useYjsUnit] Failed to save to DataStore:', err);
        setError(err as Error);
      }
      
      throw err;
    }
  }, [provider, unitId, unit, client]);

  // Schedule debounced save on Y.Doc changes
  useEffect(() => {
    if (!provider) return;

    const updateHandler = () => {
      // Clear existing timer
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      // Schedule new save
      saveTimerRef.current = setTimeout(() => {
        saveToDataStore().catch(err => {
          console.error('[useYjsUnit] Debounced save failed:', err);
        });
      }, saveDebounceMs);
    };

    const unsubscribe = provider.onUpdate(updateHandler);

    return () => {
      unsubscribe();
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [provider, saveToDataStore, saveDebounceMs]);

  // Update metadata helper
  const updateMetadata = useCallback((updates: Record<string, any>) => {
    if (!unitId || !provider) {
      console.warn('[useYjsUnit] Cannot update metadata: no unitId or provider');
      return;
    }

    const ymetadata = provider.getMap('metadata');
    Object.entries(updates).forEach(([key, value]) => {
      ymetadata.set(key, value);
    });

    console.log('[useYjsUnit] Updated metadata:', updates);
  }, [provider]);

  // Force save helper
  const forceSave = useCallback(async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    await saveToDataStore();
  }, [saveToDataStore]);

  return {
    provider: provider || null,
    unit,
    isLoading,
    error,
    isSynced,
    isConnected,
    updateMetadata,
    forceSave,
    ytext: provider ? provider.getText('editorContent') : null,
    ymetadata: provider ? provider.getMap('metadata') : null
  };
}
