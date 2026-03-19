/**
 * useYjsWord - Real-time collaborative word/vocabulary editing hook
 * 
 * Integrates Yjs CRDT for conflict-free word operations with Amplify GraphQL
 * for cross-device persistence. Enables collaborative dictionary editing.
 * 
 * @example
 * ```typescript
 * const { metadata, deleteWord, isSynced } = useYjsWord({ wordId: 'w-123' });
 * 
 * // Update metadata - syncs automatically across clients
 * metadata?.set('phrase', 'ありがとう');
 * metadata?.set('phonetic', 'arigatō');
 * metadata?.set('definition', 'thank you');
 * 
 * // Delete word - no version conflicts!
 * await deleteWord();
 * ```
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useYjsProvider } from '../yjs/hooks';
import { getAmplifyClient } from '../utils/amplifyClient';
import type { YjsDocProvider } from '../yjs/YjsProvider';
import * as Y from 'yjs';

export interface UseYjsWordConfig {
  wordId?: string | null;
  enableWebSocket?: boolean;
  enablePersistence?: boolean;
  saveDebounceMs?: number;
}

export interface UseYjsWordReturn {
  provider: YjsDocProvider | null;
  word: any | null;
  metadata: Y.Map<any> | null;
  isLoading: boolean;
  error: Error | null;
  isSynced: boolean;
  isConnected: boolean;
  updateMetadata: (updates: Record<string, any>) => void;
  deleteWord: () => Promise<void>;
  forceSave: () => Promise<void>;
}

/**
 * Hook for managing real-time collaborative word editing with Yjs
 * 
 * Features:
 * - Real-time sync via WebSocket (<100ms latency)
 * - Offline persistence via IndexedDB
 * - Debounced saves to Amplify GraphQL (default 3s)
 * - Automatic conflict resolution via CRDT
 * - No version conflicts on deletion or updates
 */
export function useYjsWord(config: UseYjsWordConfig): UseYjsWordReturn {
  const {
    wordId,
    enableWebSocket = true,
    enablePersistence = true,
    saveDebounceMs = 3000
  } = config;

  const client = getAmplifyClient();
  const [word, setWord] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isDeletingRef = useRef(false);

  // Initialize Yjs provider only if we have a wordId
  const { provider, isSynced, isConnected } = useYjsProvider({
    docName: wordId ? `word-${wordId}` : 'word-null',
    connect: enableWebSocket && !!wordId,
    persistence: enablePersistence && !!wordId
  });

  // Get metadata map from Yjs doc
  const metadata = provider?.getDoc().getMap('metadata') || null;

  // Load initial state from Amplify
  useEffect(() => {
    if (!wordId) {
      setIsLoading(false);
      return;
    }

    async function loadWord() {
      try {
        setIsLoading(true);
        const { data } = await client.models.Word.get({ id: wordId as string });
        
        if (!data) {
          throw new Error(`Word ${wordId} not found`);
        }

        setWord(data);

        // Apply Yjs snapshot if exists
        if ((data as any).yjsSnapshot && provider) {
          try {
            const yjsSnapshot = (data as any).yjsSnapshot as string;
            const updateBytes = Buffer.from(yjsSnapshot, 'base64');
            Y.applyUpdate(provider.getDoc(), updateBytes);
            console.log(`[useYjsWord] Applied Yjs snapshot for word ${wordId}`);
          } catch (err) {
            console.warn(`[useYjsWord] Failed to apply snapshot for word ${wordId}:`, err);
          }
        }

        // Initialize metadata if empty (first time or no snapshot)
        if (metadata && metadata.size === 0) {
          metadata.set('id', data.id);
          metadata.set('phrase', data.phrase || '');
          metadata.set('pronunciation', data.pronunciation || '');
          metadata.set('definition', data.definition || '');
          metadata.set('audio', data.audio || []);
          metadata.set('rubyTags', data.rubyTags || '');
          metadata.set('definitionAudio', data.definitionAudio || []);
          metadata.set('updatedAt', new Date().toISOString());
          console.log(`[useYjsWord] Initialized metadata for word ${wordId}`);
        }

        setError(null);
      } catch (err) {
        console.error(`[useYjsWord] Error loading word ${wordId}:`, err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    }

    loadWord();
  }, [wordId, provider, client.models.Word]);

  // Save to Amplify when Yjs doc updates
  const saveToGraphQL = useCallback(async () => {
    if (!wordId || !metadata || isDeletingRef.current) return;

    try {
      // Get current state from metadata
      const updates: any = {
        id: wordId
      };

      if (metadata.has('phrase')) updates.phrase = metadata.get('phrase');
      if (metadata.has('pronunciation')) updates.pronunciation = metadata.get('pronunciation');
      if (metadata.has('definition')) updates.definition = metadata.get('definition');
      if (metadata.has('audio')) updates.audio = metadata.get('audio');
      if (metadata.has('rubyTags')) updates.rubyTags = metadata.get('rubyTags');
      if (metadata.has('definitionAudio')) updates.definitionAudio = metadata.get('definitionAudio');

      // Capture snapshot
      const yjsUpdate = Y.encodeStateAsUpdate(provider!.getDoc());
      const yjsSnapshot = Buffer.from(yjsUpdate).toString('base64');
      updates.yjsSnapshot = yjsSnapshot;

      console.log(`[useYjsWord] Saving word ${wordId} to GraphQL`);
      
      const { data, errors } = await client.models.Word.update(updates);
      
      if (errors) {
        console.error(`[useYjsWord] GraphQL errors saving word ${wordId}:`, errors);
      } else {
        setWord(data);
        console.log(`[useYjsWord] Successfully saved word ${wordId}`);
      }
    } catch (err) {
      console.error(`[useYjsWord] Error saving word ${wordId}:`, err);
    }
  }, [wordId, metadata, provider, client.models.Word]);

  // Subscribe to Yjs updates and debounce saves
  useEffect(() => {
    if (!provider) return;

    const updateHandler = () => {
      // Clear existing timer
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      // Debounce save
      saveTimerRef.current = setTimeout(() => {
        saveToGraphQL().catch(err => {
          console.error('[useYjsWord] Debounced save failed:', err);
        });
      }, saveDebounceMs);
    };

    const unsubscribe = provider!.onUpdate(updateHandler);

    return () => {
      unsubscribe();
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [provider, saveToGraphQL, saveDebounceMs]);

  /**
   * Update word metadata (applies to Yjs, will auto-sync)
   */
  const updateMetadata = useCallback((updates: Record<string, any>) => {
    if (!metadata) {
      console.warn('[useYjsWord] Cannot update metadata - not initialized');
      return;
    }

    Object.entries(updates).forEach(([key, value]) => {
      metadata.set(key, value);
    });

    metadata.set('updatedAt', new Date().toISOString());
  }, [metadata]);

  /**
   * Delete word from both GraphQL and any associated resources
   * No version conflicts - simple deletion by ID
   */
  const deleteWord = useCallback(async () => {
    if (!wordId) {
      throw new Error('Cannot delete word - no wordId provided');
    }

    isDeletingRef.current = true;

    try {
      console.log(`[useYjsWord] Deleting word ${wordId}`);

      // Delete from GraphQL (no _version needed!)
      await client.models.Word.delete({ id: wordId });

      console.log(`[useYjsWord] Successfully deleted word ${wordId}`);

      // Disconnect provider
      provider?.disconnect();
      setWord(null);
    } catch (err) {
      console.error(`[useYjsWord] Error deleting word ${wordId}:`, err);
      throw err;
    } finally {
      isDeletingRef.current = false;
    }
  }, [wordId, provider, client.models.Word]);

  /**
   * Force immediate save to GraphQL (bypasses debounce)
   */
  const forceSave = useCallback(async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    await saveToGraphQL();
  }, [saveToGraphQL]);

  return {
    provider,
    word,
    metadata,
    isLoading,
    error,
    isSynced,
    isConnected,
    updateMetadata,
    deleteWord,
    forceSave
  };
}
