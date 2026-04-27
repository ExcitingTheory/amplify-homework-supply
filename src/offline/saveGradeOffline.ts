/**
 * Offline-aware saveGrade wrapper.
 *
 * Always saves to local IndexedDB first (instant feedback), then attempts
 * to sync to the server. If the network is unavailable, the mutation is
 * enqueued in the SyncQueue and will be retried on reconnection.
 */

import { cacheGrade, getCachedGrade, type CachedGrade } from './OfflineDataStore';
import { enqueue } from './SyncQueue';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SaveGradeParams {
  gradeId: string;
  unitId: string;
  sectionId?: string;
  data: Record<string, unknown>;
  accuracy?: number;
  percentComplete?: number;
  complete: boolean;
  version?: number; // _version for optimistic locking
}

export interface SaveGradeResult {
  synced: boolean;
  offlineQueued: boolean;
  error?: string;
}

// ── Implementation ────────────────────────────────────────────────────────────

/**
 * Save a grade locally first, then sync to server if online.
 *
 * @param params — grade data to save
 * @param serverSave — callback that performs the actual Amplify mutation;
 *                     throw on failure
 */
export async function saveGradeOfflineAware(
  params: SaveGradeParams,
  serverSave: (params: SaveGradeParams) => Promise<void>,
): Promise<SaveGradeResult> {
  const dataString = JSON.stringify(params.data);

  // 1. Always write to IndexedDB first — instant local persistence
  const localGrade: CachedGrade = {
    id: params.gradeId,
    unitId: params.unitId,
    sectionId: params.sectionId,
    data: dataString,
    accuracy: params.accuracy,
    percentComplete: params.percentComplete,
    complete: params.complete,
    synced: 0,
    savedAt: Date.now(),
    version: params.version,
  };
  await cacheGrade(localGrade);

  // 2. Attempt server sync if online
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      await serverSave(params);
      // Mark as synced locally
      await cacheGrade({ ...localGrade, synced: 1 });
      return { synced: true, offlineQueued: false };
    } catch (err) {
      // Server save failed — enqueue for retry
      const errorMessage = err instanceof Error ? err.message : String(err);
      await enqueue({
        model: 'Grade',
        operation: params.gradeId ? 'update' : 'create',
        payload: JSON.stringify({
          id: params.gradeId,
          unitId: params.unitId,
          sectionId: params.sectionId,
          data: dataString,
          accuracy: params.accuracy,
          percentComplete: params.percentComplete,
          complete: params.complete,
          _version: params.version,
        }),
      });
      return { synced: false, offlineQueued: true, error: errorMessage };
    }
  }

  // 3. Offline — enqueue for sync
  await enqueue({
    model: 'Grade',
    operation: params.gradeId ? 'update' : 'create',
    payload: JSON.stringify({
      id: params.gradeId,
      unitId: params.unitId,
      sectionId: params.sectionId,
      data: dataString,
      accuracy: params.accuracy,
      percentComplete: params.percentComplete,
      complete: params.complete,
      _version: params.version,
    }),
  });
  return { synced: false, offlineQueued: true };
}

/**
 * Get the locally cached grade data for a grade ID.
 * Useful for reading back work-in-progress when offline.
 */
export async function getOfflineGrade(gradeId: string): Promise<CachedGrade | undefined> {
  return getCachedGrade(gradeId);
}
