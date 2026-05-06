/**
 * useYjsQuestion - Real-time collaborative question editing hook
 * 
 * Integrates Yjs CRDT for conflict-free question operations with Amplify GraphQL
 * for cross-device persistence. Enables collaborative question editing.
 * 
 * @example
 * ```typescript
 * const { metadata, deleteQuestion, isSynced } = useYjsQuestion({ questionId: 'q-123' });
 * 
 * // Update metadata - syncs automatically across clients
 * metadata?.set('prompt', 'What is the capital of France?');
 * metadata?.set('answer', 'Paris');
 * 
 * // Delete question - no version conflicts!
 * await deleteQuestion();
 * ```
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useYjsProvider } from '../yjs/hooks';
import { getAmplifyClient } from '../utils/amplifyClient';
import type { YjsDocProvider } from '../yjs/YjsProvider';
import * as Y from 'yjs';

export interface UseYjsQuestionConfig {
  questionId?: string | null;
  enableWebSocket?: boolean;
  enablePersistence?: boolean;
  saveDebounceMs?: number;
  /** Optional optimistic version bump — call before save to block subscription echo */
  bumpVersion?: (id: string, currentVersion: number) => { confirm: (v: number) => void; rollback: () => void };
}

export interface UseYjsQuestionReturn {
  provider: YjsDocProvider | null;
  question: any | null;
  metadata: Y.Map<any> | null;
  isLoading: boolean;
  error: Error | null;
  isSynced: boolean;
  isConnected: boolean;
  updateMetadata: (updates: Record<string, any>) => void;
  deleteQuestion: () => Promise<void>;
  forceSave: () => Promise<void>;
}

/**
 * Hook for managing real-time collaborative question editing with Yjs
 * 
 * Features:
 * - Real-time sync via WebSocket (<100ms latency)
 * - Offline persistence via IndexedDB
 * - Debounced saves to Amplify GraphQL (default 3s)
 * - Automatic conflict resolution via CRDT
 * - No version conflicts on deletion or updates
 */
export function useYjsQuestion(config: UseYjsQuestionConfig): UseYjsQuestionReturn {
  const {
    questionId,
    enableWebSocket = true,
    enablePersistence = true,
    saveDebounceMs = 3000,
    bumpVersion
  } = config;

  const client = getAmplifyClient();
  const [question, setQuestion] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isDeletingRef = useRef(false);

  // Initialize Yjs provider only if we have a questionId
  const { provider, isSynced, isConnected } = useYjsProvider({
    docName: questionId ? `question-${questionId}` : 'question-null',
    connect: enableWebSocket && !!questionId,
    persistence: enablePersistence && !!questionId
  });

  // Get metadata map from Yjs doc
  const metadata = provider?.getDoc().getMap('metadata') || null;

  // Load initial state from Amplify
  useEffect(() => {
    if (!questionId) {
      setIsLoading(false);
      return;
    }

    async function loadQuestion() {
      try {
        setIsLoading(true);
        const { data } = await client.models.Question.get({ id: questionId as string });
        
        if (!data) {
          throw new Error(`Question ${questionId} not found`);
        }

        setQuestion(data);

        // Apply Yjs snapshot if exists
        if ((data as any).yjsSnapshot && provider) {
          try {
            const yjsSnapshot = (data as any).yjsSnapshot as string;
            const updateBytes = Buffer.from(yjsSnapshot, 'base64');
            Y.applyUpdate(provider.getDoc(), updateBytes);
            console.log(`[useYjsQuestion] Applied Yjs snapshot for question ${questionId}`);
          } catch (err) {
            console.warn(`[useYjsQuestion] Failed to apply snapshot for question ${questionId}:`, err);
          }
        }

        // Initialize metadata if empty (first time or no snapshot)
        if (metadata && metadata.size === 0) {
          metadata.set('id', data.id);
          metadata.set('prompt', data.prompt || '');
          metadata.set('hint', data.hint || '');
          metadata.set('answer', data.answer || '');
          metadata.set('audio', data.audio || []);
          metadata.set('updatedAt', new Date().toISOString());
          console.log(`[useYjsQuestion] Initialized metadata for question ${questionId}`);
        }

        setError(null);
      } catch (err) {
        console.error(`[useYjsQuestion] Error loading question ${questionId}:`, err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    }

    loadQuestion();
  }, [questionId, provider, client.models.Question]);

  // Save to Amplify when Yjs doc updates
  const saveToGraphQL = useCallback(async () => {
    if (!questionId || !metadata || isDeletingRef.current) return;

    try {
      // Get current state from metadata
      const updates: any = {
        id: questionId
      };

      if (metadata.has('prompt')) updates.prompt = metadata.get('prompt');
      if (metadata.has('hint')) updates.hint = metadata.get('hint');
      if (metadata.has('answer')) updates.answer = metadata.get('answer');
      if (metadata.has('audio')) updates.audio = metadata.get('audio');

      // Capture snapshot
      const yjsUpdate = Y.encodeStateAsUpdate(provider!.getDoc());
      const yjsSnapshot = Buffer.from(yjsUpdate).toString('base64');
      updates.yjsSnapshot = yjsSnapshot;

      // Optimistic version bump to block subscription echo
      const currentVersion = question?._version;
      const versionCtrl = (bumpVersion && currentVersion != null)
        ? bumpVersion(questionId, currentVersion)
        : null;
      if (currentVersion != null) {
        updates._version = currentVersion;
      }

      console.log(`[useYjsQuestion] Saving question ${questionId} to GraphQL`);
      
      const { data, errors } = await client.models.Question.update(updates);
      
      if (errors) {
        console.error(`[useYjsQuestion] GraphQL errors saving question ${questionId}:`, errors);
        versionCtrl?.rollback();
      } else {
        setQuestion(data);
        versionCtrl?.confirm(data._version);
        console.log(`[useYjsQuestion] Successfully saved question ${questionId}`);
      }
    } catch (err) {
      console.error(`[useYjsQuestion] Error saving question ${questionId}:`, err);
    }
  }, [questionId, metadata, provider, client.models.Question, question, bumpVersion]);

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
          console.error('[useYjsQuestion] Debounced save failed:', err);
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
   * Update question metadata (applies to Yjs, will auto-sync)
   */
  const updateMetadata = useCallback((updates: Record<string, any>) => {
    if (!metadata) {
      console.warn('[useYjsQuestion] Cannot update metadata - not initialized');
      return;
    }

    Object.entries(updates).forEach(([key, value]) => {
      metadata.set(key, value);
    });

    metadata.set('updatedAt', new Date().toISOString());
  }, [metadata]);

  /**
   * Delete question from both GraphQL and any associated resources
   * No version conflicts - simple deletion by ID
   */
  const deleteQuestion = useCallback(async () => {
    if (!questionId) {
      throw new Error('Cannot delete question - no questionId provided');
    }

    isDeletingRef.current = true;

    try {
      console.log(`[useYjsQuestion] Deleting question ${questionId}`);

      // Delete from GraphQL (no _version needed!)
      await client.models.Question.delete({ id: questionId });

      console.log(`[useYjsQuestion] Successfully deleted question ${questionId}`);

      // Disconnect provider
      provider?.disconnect();
      setQuestion(null);
    } catch (err) {
      console.error(`[useYjsQuestion] Error deleting question ${questionId}:`, err);
      throw err;
    } finally {
      isDeletingRef.current = false;
    }
  }, [questionId, provider, client.models.Question]);

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
    question,
    metadata,
    isLoading,
    error,
    isSynced,
    isConnected,
    updateMetadata,
    deleteQuestion,
    forceSave
  };
}
