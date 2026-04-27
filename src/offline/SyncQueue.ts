/**
 * SyncQueue — Persistent queue for offline mutations that need to sync
 * when connectivity is restored.
 *
 * Operations are stored in IndexedDB and processed in FIFO order with
 * exponential backoff on failure.
 */

import {
  putRecord,
  getRecord,
  getAllRecords,
  deleteRecord,
} from './OfflineDataStore';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SyncOperation {
  id?: number; // auto-incremented by IndexedDB
  model: string; // 'Grade' | 'AssistantChat' | 'StudentMemory' | ...
  operation: 'create' | 'update' | 'delete';
  payload: string; // JSON serialized mutation input
  createdAt: number;
  retryCount: number;
  lastError?: string;
  /** Set to true while an attempt is in flight to avoid double-processing */
  inFlight?: boolean;
}

export interface SyncResult {
  success: number;
  failed: number;
  remaining: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STORE = 'syncQueue';
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;

// ── Queue operations ──────────────────────────────────────────────────────────

/**
 * Add an operation to the sync queue.
 */
export async function enqueue(
  op: Pick<SyncOperation, 'model' | 'operation' | 'payload'>,
): Promise<void> {
  const entry: SyncOperation = {
    ...op,
    createdAt: Date.now(),
    retryCount: 0,
  };
  await putRecord(STORE, entry);

  // Request Background Sync if available
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const reg = await navigator.serviceWorker.ready;
    try {
      await (reg as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register('grade-sync');
    } catch {
      // Background Sync not allowed — will fall back to online listener
    }
  }
}

/**
 * Get the count of pending sync operations.
 */
export async function getPendingCount(): Promise<number> {
  const all = await getAllRecords<SyncOperation>(STORE);
  return all.length;
}

/**
 * Process the entire queue using the provided executor function.
 *
 * @param executor — receives (model, operation, payload) and should perform
 * the Amplify Data Client mutation. Throw on failure.
 */
export async function processQueue(
  executor: (model: string, operation: string, payload: Record<string, unknown>) => Promise<void>,
): Promise<SyncResult> {
  const ops = await getAllRecords<SyncOperation>(STORE);
  // Sort by createdAt ascending (FIFO)
  ops.sort((a, b) => a.createdAt - b.createdAt);

  let success = 0;
  let failed = 0;

  for (const op of ops) {
    if (!op.id) continue;

    // Skip operations that have exceeded max retries
    if (op.retryCount >= MAX_RETRIES) {
      failed++;
      continue;
    }

    try {
      const payload = JSON.parse(op.payload);
      await executor(op.model, op.operation, payload);
      // Success — remove from queue
      await deleteRecord(STORE, op.id!);
      success++;
    } catch (err: unknown) {
      // Increment retry count and store error
      const errorMessage = err instanceof Error ? err.message : String(err);
      const updated: SyncOperation = {
        ...op,
        retryCount: op.retryCount + 1,
        lastError: errorMessage,
        inFlight: false,
      };
      await putRecord(STORE, updated);
      failed++;
    }
  }

  const remaining = await getPendingCount();
  return { success, failed, remaining };
}

/**
 * Calculate exponential backoff delay for a given retry count.
 */
export function getBackoffDelay(retryCount: number): number {
  return Math.min(BASE_DELAY_MS * Math.pow(2, retryCount), 30_000);
}

/**
 * Clear all operations from the sync queue.
 */
export async function clearQueue(): Promise<void> {
  const { clearStore } = await import('./OfflineDataStore');
  await clearStore(STORE);
}

/**
 * Get all pending operations (for UI display).
 */
export async function getAllPending(): Promise<SyncOperation[]> {
  const all = await getAllRecords<SyncOperation>(STORE);
  return all.sort((a, b) => a.createdAt - b.createdAt);
}
