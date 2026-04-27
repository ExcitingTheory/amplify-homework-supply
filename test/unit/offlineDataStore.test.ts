/**
 * Unit tests for OfflineDataStore — IndexedDB persistence layer.
 *
 * Since happy-dom doesn't provide IndexedDB, we mock the `idb` module
 * with a simple in-memory Map-based store and test the higher-level
 * helper functions exported by OfflineDataStore.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── In-memory IDB mock ─────────────────────────────────────────────────────

interface MockStore {
  data: Map<any, any>;
  indexes: Record<string, string>; // indexName → keyPath
  keyPath: string;
  autoIncrement: boolean;
  _nextId: number;
}

function createMockDB() {
  const stores: Record<string, MockStore> = {};

  function getStore(name: string): MockStore {
    if (!stores[name]) throw new Error(`Object store "${name}" not found`);
    return stores[name];
  }

  const db = {
    objectStoreNames: {
      contains: (name: string) => !!stores[name],
    },
    createObjectStore: (name: string, opts?: { keyPath?: string; autoIncrement?: boolean }) => {
      const store: MockStore = {
        data: new Map(),
        indexes: {},
        keyPath: opts?.keyPath ?? 'id',
        autoIncrement: !!opts?.autoIncrement,
        _nextId: 1,
      };
      stores[name] = store;
      return {
        createIndex: (indexName: string, keyPath: string) => {
          store.indexes[indexName] = keyPath;
        },
      };
    },
    put: async (storeName: string, value: any) => {
      const store = getStore(storeName);
      const key = store.autoIncrement
        ? (value[store.keyPath] ?? store._nextId++)
        : value[store.keyPath];
      if (store.autoIncrement && !value[store.keyPath]) {
        value[store.keyPath] = key;
      }
      store.data.set(key, { ...value });
    },
    get: async (storeName: string, key: any) => {
      const store = getStore(storeName);
      const val = store.data.get(key);
      return val ? { ...val } : undefined;
    },
    getAll: async (storeName: string) => {
      const store = getStore(storeName);
      return Array.from(store.data.values()).map((v) => ({ ...v }));
    },
    getAllFromIndex: async (storeName: string, indexName: string, key: any) => {
      const store = getStore(storeName);
      const keyPath = store.indexes[indexName];
      if (!keyPath) throw new Error(`Index "${indexName}" not found on "${storeName}"`);
      return Array.from(store.data.values())
        .filter((v) => v[keyPath] === key)
        .map((v) => ({ ...v }));
    },
    delete: async (storeName: string, key: any) => {
      const store = getStore(storeName);
      store.data.delete(key);
    },
    clear: async (storeName: string) => {
      const store = getStore(storeName);
      store.data.clear();
    },
    transaction: (storeName: string, _mode: string) => {
      const store = getStore(storeName);
      const cursorItems: any[] = [];

      return {
        store: {
          index: (indexName: string) => {
            const keyPath = store.indexes[indexName];
            return {
              openCursor: async (indexKey: any) => {
                const matches = Array.from(store.data.entries())
                  .filter(([, v]) => v[keyPath] === indexKey);
                cursorItems.length = 0;
                cursorItems.push(...matches);

                if (cursorItems.length === 0) return null;
                const [key] = cursorItems.shift()!;
                return {
                  delete: async () => { store.data.delete(key); },
                  continue: async () => {
                    if (cursorItems.length === 0) return null;
                    const [nextKey] = cursorItems.shift()!;
                    return {
                      delete: async () => { store.data.delete(nextKey); },
                      continue: async () => null,
                    };
                  },
                };
              },
            };
          },
        },
        done: Promise.resolve(),
      };
    },
  };

  return db;
}

// Mock idb
let mockDB: ReturnType<typeof createMockDB>;

vi.mock('idb', () => ({
  openDB: async (_name: string, _version: number, opts: any) => {
    mockDB = createMockDB();
    if (opts?.upgrade) {
      opts.upgrade(mockDB);
    }
    return mockDB;
  },
}));

// ── Tests ──────────────────────────────────────────────────────────────────

describe('OfflineDataStore', () => {
  let store: typeof import('../../src/offline/OfflineDataStore');

  beforeEach(async () => {
    vi.resetModules();
    store = await import('../../src/offline/OfflineDataStore');
  });

  // ── Generic CRUD ──────────────────────────────────────────────────────

  describe('putRecord / getRecord', () => {
    it('stores and retrieves a record by key', async () => {
      await store.putRecord('units', { id: 'u1', name: 'Test Unit', data: '{}', version: 1, cachedAt: 1 });
      const result = await store.getRecord<{ id: string; name: string }>('units', 'u1');
      expect(result).toBeDefined();
      expect(result!.name).toBe('Test Unit');
    });

    it('returns undefined for missing key', async () => {
      const result = await store.getRecord('units', 'nonexistent');
      expect(result).toBeUndefined();
    });
  });

  describe('getAllRecords', () => {
    it('returns all records from a store', async () => {
      await store.putRecord('units', { id: 'u1', name: 'Unit 1', data: '{}', version: 1, cachedAt: 1 });
      await store.putRecord('units', { id: 'u2', name: 'Unit 2', data: '{}', version: 1, cachedAt: 1 });
      const all = await store.getAllRecords('units');
      expect(all).toHaveLength(2);
    });

    it('returns empty array for empty store', async () => {
      const all = await store.getAllRecords('units');
      expect(all).toHaveLength(0);
    });
  });

  describe('getRecordsByIndex', () => {
    it('returns records matching an index key', async () => {
      await store.putRecord('words', { id: 'w1', unitId: 'u1', phrase: 'hello', definition: 'greeting', cachedAt: 1 });
      await store.putRecord('words', { id: 'w2', unitId: 'u1', phrase: 'goodbye', definition: 'farewell', cachedAt: 1 });
      await store.putRecord('words', { id: 'w3', unitId: 'u2', phrase: 'thanks', definition: 'gratitude', cachedAt: 1 });

      const u1Words = await store.getRecordsByIndex('words', 'unitId', 'u1');
      expect(u1Words).toHaveLength(2);
      expect(u1Words.map((w: any) => w.phrase)).toContain('hello');
      expect(u1Words.map((w: any) => w.phrase)).toContain('goodbye');
    });
  });

  describe('deleteRecord', () => {
    it('removes a record by key', async () => {
      await store.putRecord('units', { id: 'u1', name: 'Unit 1', data: '{}', version: 1, cachedAt: 1 });
      await store.deleteRecord('units', 'u1');
      const result = await store.getRecord('units', 'u1');
      expect(result).toBeUndefined();
    });
  });

  // ── Unit helpers ──────────────────────────────────────────────────────

  describe('cacheUnit / getCachedUnit', () => {
    it('caches and retrieves a unit', async () => {
      await store.cacheUnit({ id: 'u1', name: 'Biology', data: '{"root":{}}', description: 'Bio unit', version: 3, cachedAt: 0 });
      const unit = await store.getCachedUnit('u1');
      expect(unit).toBeDefined();
      expect(unit!.name).toBe('Biology');
      expect(unit!.version).toBe(3);
      // cachedAt should be set to Date.now() by cacheUnit
      expect(unit!.cachedAt).toBeGreaterThan(0);
    });
  });

  // ── Word helpers ──────────────────────────────────────────────────────

  describe('cacheWord / getCachedWordsForUnit', () => {
    it('caches words and retrieves by unitId', async () => {
      await store.cacheWord({ id: 'w1', unitId: 'u1', phrase: 'photosynthesis', definition: 'plant process', cachedAt: 0 });
      await store.cacheWord({ id: 'w2', unitId: 'u1', phrase: 'chlorophyll', definition: 'green pigment', cachedAt: 0 });
      const words = await store.getCachedWordsForUnit('u1');
      expect(words).toHaveLength(2);
    });
  });

  // ── Question helpers ──────────────────────────────────────────────────

  describe('cacheQuestion / getCachedQuestionsForUnit', () => {
    it('caches questions and retrieves by unitId', async () => {
      await store.cacheQuestion({ id: 'q1', unitId: 'u1', prompt: 'What is 2+2?', answer: '4', cachedAt: 0 });
      const questions = await store.getCachedQuestionsForUnit('u1');
      expect(questions).toHaveLength(1);
      expect(questions[0].answer).toBe('4');
    });
  });

  // ── File helpers ──────────────────────────────────────────────────────

  describe('cacheFile / getCachedFilesForUnit / getCachedFileBlob', () => {
    it('caches a file with blob and retrieves it', async () => {
      const blob = new Blob(['hello'], { type: 'text/plain' });
      await store.cacheFile({ id: 'f1', unitId: 'u1', blob, contentType: 'text/plain', path: 'test.txt', cachedAt: 0 });

      const files = await store.getCachedFilesForUnit('u1');
      expect(files).toHaveLength(1);
      expect(files[0].contentType).toBe('text/plain');

      const fileBlob = await store.getCachedFileBlob('f1');
      expect(fileBlob).toBeDefined();
    });
  });

  // ── Grade helpers ─────────────────────────────────────────────────────

  describe('cacheGrade / getCachedGrade / getUnsyncedGrades', () => {
    it('caches a grade and retrieves it', async () => {
      await store.cacheGrade({
        id: 'g1', unitId: 'u1', data: '{}', accuracy: 85, complete: true,
        synced: 1, savedAt: Date.now(),
      });
      const grade = await store.getCachedGrade('g1');
      expect(grade).toBeDefined();
      expect(grade!.accuracy).toBe(85);
    });

    it('getUnsyncedGrades returns only synced=0 grades', async () => {
      await store.cacheGrade({ id: 'g1', unitId: 'u1', data: '{}', complete: true, synced: 0, savedAt: 1 });
      await store.cacheGrade({ id: 'g2', unitId: 'u1', data: '{}', complete: true, synced: 1, savedAt: 2 });
      await store.cacheGrade({ id: 'g3', unitId: 'u2', data: '{}', complete: false, synced: 0, savedAt: 3 });

      const unsynced = await store.getUnsyncedGrades();
      expect(unsynced).toHaveLength(2);
      expect(unsynced.map((g) => g.id)).toContain('g1');
      expect(unsynced.map((g) => g.id)).toContain('g3');
    });
  });

  // ── Student memory ────────────────────────────────────────────────────

  describe('cacheStudentMemory / getCachedStudentMemory', () => {
    it('caches and retrieves student memory', async () => {
      await store.cacheStudentMemory({ id: 'sm1', studentId: 'student1', memoryMarkdown: '## Notes', cachedAt: 0 });
      const mem = await store.getCachedStudentMemory('sm1');
      expect(mem).toBeDefined();
      expect(mem!.memoryMarkdown).toBe('## Notes');
    });
  });

  // ── Prefetch status ───────────────────────────────────────────────────

  describe('setPrefetchStatus / getPrefetchStatus / getAllPrefetchStatuses', () => {
    it('stores and retrieves prefetch status', async () => {
      await store.setPrefetchStatus({ unitId: 'u1', status: 'complete', progress: 100, lastUpdated: Date.now() });
      const ps = await store.getPrefetchStatus('u1');
      expect(ps).toBeDefined();
      expect(ps!.status).toBe('complete');
    });

    it('lists all prefetch statuses', async () => {
      await store.setPrefetchStatus({ unitId: 'u1', status: 'complete', progress: 100, lastUpdated: 1 });
      await store.setPrefetchStatus({ unitId: 'u2', status: 'downloading', progress: 50, lastUpdated: 2 });
      const all = await store.getAllPrefetchStatuses();
      expect(all).toHaveLength(2);
    });
  });

  // ── clearUnitCache ────────────────────────────────────────────────────

  describe('clearUnitCache', () => {
    it('removes all cached data for a specific unit', async () => {
      await store.cacheUnit({ id: 'u1', name: 'Unit 1', data: '{}', version: 1, cachedAt: 0 });
      await store.cacheWord({ id: 'w1', unitId: 'u1', phrase: 'word', definition: 'def', cachedAt: 0 });
      await store.cacheQuestion({ id: 'q1', unitId: 'u1', prompt: 'Q?', answer: 'A', cachedAt: 0 });
      await store.setPrefetchStatus({ unitId: 'u1', status: 'complete', progress: 100, lastUpdated: 1 });

      // Also add data for u2 to make sure it's not affected
      await store.cacheUnit({ id: 'u2', name: 'Unit 2', data: '{}', version: 1, cachedAt: 0 });
      await store.cacheWord({ id: 'w2', unitId: 'u2', phrase: 'other', definition: 'other def', cachedAt: 0 });

      await store.clearUnitCache('u1');

      // u1 data should be gone
      expect(await store.getCachedUnit('u1')).toBeUndefined();
      expect(await store.getCachedWordsForUnit('u1')).toHaveLength(0);
      expect(await store.getCachedQuestionsForUnit('u1')).toHaveLength(0);
      expect(await store.getPrefetchStatus('u1')).toBeUndefined();

      // u2 data should remain
      expect(await store.getCachedUnit('u2')).toBeDefined();
      expect(await store.getCachedWordsForUnit('u2')).toHaveLength(1);
    });
  });

  // ── clearStore ────────────────────────────────────────────────────────

  describe('clearStore', () => {
    it('clears all records from a store', async () => {
      await store.putRecord('units', { id: 'u1', name: 'A', data: '{}', version: 1, cachedAt: 1 });
      await store.putRecord('units', { id: 'u2', name: 'B', data: '{}', version: 1, cachedAt: 1 });
      await store.clearStore('units');
      const all = await store.getAllRecords('units');
      expect(all).toHaveLength(0);
    });
  });
});
