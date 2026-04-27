/**
 * useYjsFile - Real-time collaborative file metadata management hook
 * 
 * Integrates Yjs CRDT for conflict-free file operations with Amplify GraphQL
 * for cross-device persistence. Eliminates version conflicts during file deletion.
 * 
 * @example
 * ```typescript
 * const { metadata, deleteFile, isSynced } = useYjsFile({ fileId: 'file-123' });
 * 
 * // Update metadata - syncs automatically across clients
 * metadata?.set('name', 'new-name.pdf');
 * 
 * // Delete file - no version conflicts!
 * await deleteFile();
 * ```
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useYjsProvider } from '../yjs/hooks';
import { getAmplifyClient } from '../utils/amplifyClient';
import { remove } from 'aws-amplify/storage';
import * as Y from 'yjs';

export interface UseYjsFileConfig {
  fileId?: string | null;
  enableWebSocket?: boolean;
  enablePersistence?: boolean;
  saveDebounceMs?: number;
}

export interface UseYjsFileReturn {
  provider: ReturnType<typeof useYjsProvider>['provider'] | null;
  file: any | null;
  metadata: Y.Map<any> | null;
  isLoading: boolean;
  error: Error | null;
  isSynced: boolean;
  isConnected: boolean;
  updateMetadata: (updates: Record<string, any>) => void;
  deleteFile: () => Promise<void>;
  forceSave: () => Promise<void>;
}

/**
 * Hook for managing real-time collaborative file metadata with Yjs
 * 
 * Features:
 * - Real-time sync via WebSocket (<100ms latency)
 * - Offline persistence via IndexedDB
 * - Debounced saves to Amplify GraphQL (default 3s)
 * - Automatic conflict resolution via CRDT
 * - No version conflicts on deletion
 */
export function useYjsFile(config: UseYjsFileConfig): UseYjsFileReturn {
  const {
    fileId,
    enableWebSocket = true,
    enablePersistence = true,
    saveDebounceMs = 3000 // Faster for file operations
  } = config;

  const client = getAmplifyClient();
  const [file, setFile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isDeletingRef = useRef(false);

  // Initialize Yjs provider only if we have a fileId
  const { provider, isSynced, isConnected } = useYjsProvider({
    docName: fileId ? `file-${fileId}` : 'file-null',
    connect: enableWebSocket && !!fileId,
    persistence: enablePersistence && !!fileId
  });

  // Load initial state from Amplify
  useEffect(() => {
    if (!fileId) {
      setIsLoading(false);
      return;
    }

    async function loadFile() {
      try {
        setIsLoading(true);
        const { data } = await client.models.File.get({ id: fileId as string });
        
        if (!data) {
          throw new Error(`File ${fileId} not found`);
        }

        setFile(data);

        // Apply Yjs snapshot if exists
        if ((data as any).yjsSnapshot && provider) {
          try {
            const yjsSnapshot = (data as any).yjsSnapshot as string;
            const updateBytes = Buffer.from(yjsSnapshot, 'base64');
            Y.applyUpdate(provider.getDoc(), updateBytes);
            console.log(`[useYjsFile] Applied Yjs snapshot for file ${fileId}`);
          } catch (err) {
            console.warn('[useYjsFile] Failed to apply snapshot:', err);
          }
        } else if (provider) {
          // Initialize Yjs metadata from existing file data
          const ymap = provider.getMap('metadata');
          
          // Only initialize if empty (first time)
          if (ymap.size === 0) {
            Object.entries(data).forEach(([key, value]) => {
              // Skip internal fields, relationships, and timestamps
              if (!key.startsWith('_') && !key.includes('ID') && key !== 'createdAt' && key !== 'updatedAt') {
                // Only set primitive types that Yjs Y.Map supports (string, number, boolean, null)
                // Skip functions, objects (lazy-loaded relationships), and undefined
                const type = typeof value;
                if (value === null || type === 'string' || type === 'number' || type === 'boolean') {
                  ymap.set(key, value);
                }
              }
            });
            console.log(`[useYjsFile] Initialized Yjs metadata for file ${fileId}`);
          }
        }

        setIsLoading(false);
      } catch (err) {
        console.error('[useYjsFile] Failed to load file:', err);
        setError(err as Error);
        setIsLoading(false);
      }
    }

    if (provider) {
      loadFile();
    }
  }, [fileId, provider, client]);

  // Debounced save to GraphQL
  const saveToGraphQL = useCallback(async () => {
    if (!fileId || !provider || isDeletingRef.current) {
      return;
    }

    try {
      const ymap = provider.getMap('metadata');
      
      // Check if file is marked deleted
      if (ymap.get('_deleted')) {
        console.log(`[useYjsFile] File ${fileId} marked deleted, skipping save`);
        return;
      }
      
      // Extract state
      const yjsState = Y.encodeStateAsUpdate(provider.getDoc());
      const yjsSnapshot = Buffer.from(yjsState).toString('base64');
      
      // Extract metadata
      const fileData: any = {
        id: fileId,
        yjsSnapshot: yjsSnapshot,
      };
      
      ymap.forEach((value, key) => {
        // Skip internal Yjs fields
        if (!key.startsWith('_')) {
          fileData[key] = value;
        }
      });

      console.log(`[useYjsFile] Saving file ${fileId} to GraphQL`);

      // Update file record - no _version needed!
      await client.models.File.update(fileData);

      console.log(`[useYjsFile] Successfully saved file ${fileId}`);
    } catch (err: any) {
      console.error('[useYjsFile] Failed to save to GraphQL:', err);
      setError(err as Error);
    }
  }, [provider, fileId, client]);

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
        saveToGraphQL().catch(err => {
          console.error('[useYjsFile] Debounced save failed:', err);
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
  }, [provider, saveToGraphQL, saveDebounceMs]);

  // Update metadata helper
  const updateMetadata = useCallback((updates: Record<string, any>) => {
    if (!fileId || !provider) {
      console.warn('[useYjsFile] Cannot update metadata: no fileId or provider');
      return;
    }

    const ymap = provider.getMap('metadata');
    Object.entries(updates).forEach(([key, value]) => {
      ymap.set(key, value);
    });

    console.log('[useYjsFile] Updated metadata:', updates);
  }, [provider, fileId]);

  // Delete file helper - no version conflicts!
  const deleteFile = useCallback(async () => {
    if (!fileId || !provider) {
      throw new Error('Cannot delete: no fileId or provider');
    }

    isDeletingRef.current = true;

    try {
      const ymap = provider.getMap('metadata');
      
      // Get S3 path (access level is encoded in the path for Gen 2)
      const path = ymap.get('path') || file?.path;

      console.log(`[useYjsFile] Deleting file ${fileId} from S3: ${path}`);

      // Delete from S3 (if path exists)
      if (path) {
        try {
          // Gen 2 API: use path directly (access level is encoded in the path)
          await remove({
            path: path,
          });
          console.log(`[useYjsFile] Deleted from S3: ${path}`);
        } catch (s3Error) {
          console.warn('[useYjsFile] S3 deletion failed:', s3Error);
          // Continue with database deletion even if S3 fails
        }
      }

      // Mark deleted in Yjs
      ymap.set('_deleted', true);
      ymap.set('deletedAt', new Date().toISOString());

      // Force immediate save
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      await saveToGraphQL();

      // Delete from GraphQL - no _version needed!
      await client.models.File.delete({ id: fileId });

      console.log(`[useYjsFile] Successfully deleted file ${fileId}`);
    } catch (err) {
      console.error(`[useYjsFile] Error deleting file ${fileId}:`, err);
      isDeletingRef.current = false;
      throw err;
    }
  }, [fileId, provider, file, client, saveToGraphQL]);

  // Force save helper
  const forceSave = useCallback(async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    await saveToGraphQL();
  }, [saveToGraphQL]);

  return {
    provider: provider || null,
    file,
    metadata: provider ? provider.getMap('metadata') : null,
    isLoading,
    error,
    isSynced,
    isConnected,
    updateMetadata,
    deleteFile,
    forceSave
  };
}
