/**
 * Unit tests for SyncQueue — offline mutation queue.
 *
 * Mocks the OfflineDataStore functions so we can test SyncQueue logic
 * (enqueue, processQueue FIFO, retry limit, backoff) in isolation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── In-memory store mock ────────────────────────────────────────────────────

let store: Map<number, any>;
let nextId: number;

vi.mock('../../src/offline/OfflineDataStore', () => {
  return {
    putRecord: async (_storeName: string, value: any) => {
      const key = value.id ?? nextId++;
      if (!value.id) value.id = key;
      store.set(key, { ...value });
    },
    getRecord: async (_storeName: string, key: any) => {
      const val = store.get(key);
      return val ? { ...val } : undefined;
    },
    getAllRecords: async () => {
      return Array.from(store.values()).map((v) => ({ ...v }));
    },
    deleteRecord: async (_storeName: string, key: any) => {
      store.delete(key);
    },
    clearStore: async () => {
      store.clear();
    },
  };
});

// Mock Background Sync API
Object.defineProperty(globalThis, 'navigator', {
  value: {
    ...globalThis.navigator,
    serviceWorker: {
      ready: Promise.resolve({ sync: { register: vi.fn() } }),
    },
    onLine: true,
  },
  writable: true,
  configurable: true,
});
Object.defineProperty(globalThis, 'window', {
  value: { ...globalThis.window, SyncManager: class {} },
  writable: true,
  configurable: true,
});

// ── Tests ──────────────────────────────────────────────────────────────────

describe('SyncQueue', () => {
  let queue: typeof import('../../src/offline/SyncQueue');

  beforeEach(async () => {
    store = new Map();
    nextId = 1;
    vi.resetModules();
    queue = await import('../../src/offline/SyncQueue');
  });

  describe('enqueue', () => {
    it('adds an operation to the queue', async () => {
      await queue.enqueue({ model: 'Grade', operation: 'update', payload: '{"id":"g1"}' });
      const count = await queue.getPendingCount();
      expect(count).toBe(1);
    });

    it('sets retryCount to 0 and records createdAt', async () => {
      await queue.enqueue({ model: 'Grade', operation: 'create', payload: '{}' });
      const all = await queue.getAllPending();
      expect(all[0].retryCount).toBe(0);
      expect(all[0].createdAt).toBeGreaterThan(0);
    });
  });

  describe('processQueue', () => {
    it('processes operations in FIFO order', async () => {
      const order: string[] = [];
      await queue.enqueue({ model: 'Grade', operation: 'update', payload: '{"order":1}' });
      // Manually adjust createdAt to ensure order
      const all1 = await queue.getAllPending();
      store.set(all1[0].id!, { ...all1[0], createdAt: 100 });

      await queue.enqueue({ model: 'Grade', operation: 'create', payload: '{"order":2}' });
      const all2 = await queue.getAllPending();
      const second = all2.find((op) => op.id !== all1[0].id);
      if (second) store.set(second.id!, { ...second, createdAt: 200 });

      const executor = vi.fn(async (_model, _operation, payload) => {
        order.push(String(payload.order));
      });

      await queue.processQueue(executor);
      expect(order).toEqual(['1', '2']);
    });

    it('removes successful operations from the queue', async () => {
      await queue.enqueue({ model: 'Grade', operation: 'update', payload: '{"id":"g1"}' });
      const executor = vi.fn(async () => {});
      const result = await queue.processQueue(executor);
      expect(result.success).toBe(1);
      expect(result.remaining).toBe(0);
    });

    it('increments retryCount on failure', async () => {
      await queue.enqueue({ model: 'Grade', operation: 'update', payload: '{"id":"g1"}' });
      const executor = vi.fn(async () => { throw new Error('network error'); });

      await queue.processQueue(executor);
      const pending = await queue.getAllPending();
      expect(pending[0].retryCount).toBe(1);
      expect(pending[0].lastError).toBe('network error');
    });

    it('skips operations that exceed max retries', async () => {
      await queue.enqueue({ model: 'Grade', operation: 'update', payload: '{"id":"g1"}' });
      // Manually set retryCount to 5 (MAX_RETRIES)
      const all = await queue.getAllPending();
      store.set(all[0].id!, { ...all[0], retryCount: 5 });

      const executor = vi.fn(async () => {});
      const result = await queue.processQueue(executor);
      expect(executor).not.toHaveBeenCalled();
      expect(result.failed).toBe(1);
    });
  });

  describe('getBackoffDelay', () => {
    it('returns exponentially increasing delays', () => {
      expect(queue.getBackoffDelay(0)).toBe(1000);
      expect(queue.getBackoffDelay(1)).toBe(2000);
      expect(queue.getBackoffDelay(2)).toBe(4000);
    });

    it('caps at 30 seconds', () => {
      expect(queue.getBackoffDelay(10)).toBe(30_000);
    });
  });

  describe('clearQueue', () => {
    it('removes all pending operations', async () => {
      await queue.enqueue({ model: 'Grade', operation: 'update', payload: '{}' });
      await queue.enqueue({ model: 'Grade', operation: 'create', payload: '{}' });
      await queue.clearQueue();
      expect(await queue.getPendingCount()).toBe(0);
    });
  });

  describe('getAllPending', () => {
    it('returns operations sorted by createdAt', async () => {
      await queue.enqueue({ model: 'Grade', operation: 'update', payload: '{"a":1}' });
      const all1 = await queue.getAllPending();
      store.set(all1[0].id!, { ...all1[0], createdAt: 300 });

      await queue.enqueue({ model: 'Grade', operation: 'create', payload: '{"a":2}' });
      const all2 = await queue.getAllPending();
      const second = all2.find((op) => op.id !== all1[0].id);
      if (second) store.set(second.id!, { ...second, createdAt: 100 });

      const sorted = await queue.getAllPending();
      expect(sorted[0].createdAt).toBeLessThanOrEqual(sorted[1].createdAt);
    });
  });
});
