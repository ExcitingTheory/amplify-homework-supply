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

        // Parse JSON fields (Amplify Gen 2 stores as strings)
        const parsedUnit = {
          ...data,
          data: data.data ? JSON.parse(data.data as string) : null
        };

        setUnit(parsedUnit);
        nextVersionRef.current = ((data as any)._version || 0) + 1;

        // Apply Yjs snapshot if exists
        if ((data as any).yjsSnapshot && provider) {
          try {
            const yjsSnapshot = (data as any).yjsSnapshot as string;
            const updateBytes = Buffer.from(yjsSnapshot, 'base64');
            Y.applyUpdate(provider.getDoc(), updateBytes);
            console.log(`[useYjsUnit] Applied Yjs snapshot for unit ${unitId}`);
          } catch (err) {
            console.warn('[useYjsUnit] Failed to apply snapshot:', err);
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
    if (!unitId || !provider) {
      console.warn('[useYjsUnit] No unitId or provider available for save');
      return;
    }

    try {
      const ytext = provider.getText('editorContent');
      const ymetadata = provider.getMap('metadata');
      
      // Extract state
      const editorContent = ytext.toString();
      const yjsState = Y.encodeStateAsUpdate(provider.getDoc());
      const yjsSnapshot = Buffer.from(yjsState).toString('base64');
      
      // Extract metadata
      const metadata: Record<string, any> = {};
      ymetadata.forEach((value, key) => {
        metadata[key] = value;
      });

      console.log(`[useYjsUnit] Saving unit ${unitId} to DataStore (version ${nextVersionRef.current})`);

      // Save to Amplify (MUST stringify JSON fields for Gen 2)
      await client.models.Unit.update({
        id: unitId,
        data: JSON.stringify({ content: editorContent }), // MUST stringify
        yjsSnapshot: yjsSnapshot,
        ...metadata,
        _version: nextVersionRef.current
      } as any);

      // Optimistically increment version
      nextVersionRef.current += 1;

      console.log(`[useYjsUnit] Successfully saved unit ${unitId}`);
    } catch (err: any) {
      if (err.message?.includes('version') || err.message?.includes('ConditionalCheck')) {
        console.warn('[useYjsUnit] Version conflict detected, reloading from DataStore...');
        
        try {
          // Reload from DataStore
          const { data } = await client.models.Unit.get({ id: unitId as string });
          if (data) {
            nextVersionRef.current = ((data as any)._version || 0) + 1;
            
            // Re-apply snapshot
            if ((data as any).yjsSnapshot) {
              const yjsSnapshot = (data as any).yjsSnapshot as string;
              const updateBytes = Buffer.from(yjsSnapshot, 'base64');
              Y.applyUpdate(provider.getDoc(), updateBytes);
              console.log('[useYjsUnit] Re-applied snapshot after version conflict');
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
  }, [provider, unitId, client]);

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
