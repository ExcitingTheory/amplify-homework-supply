/**
 * Unit tests for saveGradeOffline — offline-aware grade saving.
 *
 * Mocks OfflineDataStore and SyncQueue to test the three code paths:
 * 1. Online + server save succeeds → synced: true
 * 2. Online + server save fails → enqueued
 * 3. Offline → enqueued
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ───────────────────────────────────────────────────────────────────

const cachedGrades = new Map<string, any>();
const enqueuedOps: any[] = [];

vi.mock('../../src/offline/OfflineDataStore', () => ({
  cacheGrade: vi.fn(async (grade: any) => {
    cachedGrades.set(grade.id, { ...grade });
  }),
  getCachedGrade: vi.fn(async (id: string) => {
    return cachedGrades.get(id);
  }),
}));

vi.mock('../../src/offline/SyncQueue', () => ({
  enqueue: vi.fn(async (op: any) => {
    enqueuedOps.push(op);
  }),
}));

// ── Tests ──────────────────────────────────────────────────────────────────

describe('saveGradeOffline', () => {
  let saveModule: typeof import('../../src/offline/saveGradeOffline');

  beforeEach(async () => {
    cachedGrades.clear();
    enqueuedOps.length = 0;
    vi.clearAllMocks();
    vi.resetModules();
    saveModule = await import('../../src/offline/saveGradeOffline');
  });

  const baseParams = {
    gradeId: 'g1',
    unitId: 'u1',
    sectionId: 's1',
    data: { 'block-1': { userAnswer: 'test', complete: true, accuracy: 90 } },
    accuracy: 90,
    percentComplete: 100,
    complete: true,
    version: 1,
  };

  describe('when online and server save succeeds', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
    });

    it('saves locally then syncs to server', async () => {
      const serverSave = vi.fn(async () => {});
      const result = await saveModule.saveGradeOfflineAware(baseParams, serverSave);

      expect(result.synced).toBe(true);
      expect(result.offlineQueued).toBe(false);
      expect(serverSave).toHaveBeenCalledOnce();
    });

    it('marks the cached grade as synced: 1', async () => {
      const serverSave = vi.fn(async () => {});
      await saveModule.saveGradeOfflineAware(baseParams, serverSave);

      const cached = cachedGrades.get('g1');
      expect(cached.synced).toBe(1);
    });
  });

  describe('when online but server save fails', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
    });

    it('enqueues the operation for retry', async () => {
      const serverSave = vi.fn(async () => { throw new Error('500 Internal Server Error'); });
      const result = await saveModule.saveGradeOfflineAware(baseParams, serverSave);

      expect(result.synced).toBe(false);
      expect(result.offlineQueued).toBe(true);
      expect(result.error).toBe('500 Internal Server Error');
      expect(enqueuedOps).toHaveLength(1);
      expect(enqueuedOps[0].model).toBe('Grade');
    });

    it('still saves locally with synced: 0', async () => {
      const serverSave = vi.fn(async () => { throw new Error('fail'); });
      await saveModule.saveGradeOfflineAware(baseParams, serverSave);

      const cached = cachedGrades.get('g1');
      expect(cached).toBeDefined();
      expect(cached.synced).toBe(0);
    });
  });

  describe('when offline', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true });
    });

    it('saves locally and enqueues without calling serverSave', async () => {
      const serverSave = vi.fn(async () => {});
      const result = await saveModule.saveGradeOfflineAware(baseParams, serverSave);

      expect(result.synced).toBe(false);
      expect(result.offlineQueued).toBe(true);
      expect(serverSave).not.toHaveBeenCalled();
      expect(enqueuedOps).toHaveLength(1);
    });

    it('stores grade data as JSON string in IndexedDB', async () => {
      const serverSave = vi.fn(async () => {});
      await saveModule.saveGradeOfflineAware(baseParams, serverSave);

      const cached = cachedGrades.get('g1');
      expect(typeof cached.data).toBe('string');
      expect(JSON.parse(cached.data)).toEqual(baseParams.data);
    });
  });

  describe('getOfflineGrade', () => {
    it('retrieves a cached grade by ID', async () => {
      cachedGrades.set('g1', { id: 'g1', unitId: 'u1', data: '{}', synced: 0 });
      const grade = await saveModule.getOfflineGrade('g1');
      expect(grade).toBeDefined();
      expect(grade!.id).toBe('g1');
    });

    it('returns undefined for missing grade', async () => {
      const grade = await saveModule.getOfflineGrade('nonexistent');
      expect(grade).toBeUndefined();
    });
  });
});
