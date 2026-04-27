/**
 * Assignment Prefetch — Downloads all data a student needs for a unit
 * into the OfflineDataStore so it's available without connectivity.
 *
 * Fetches: unit content, words, questions, files (as blobs), student memory.
 * Populates the vector embedding cache so semantic search works offline.
 */

import {
  cacheUnit,
  cacheWord,
  cacheQuestion,
  cacheFile,
  cacheStudentMemory,
  setPrefetchStatus,
  getPrefetchStatus,
  type PrefetchStatus,
} from './OfflineDataStore';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PrefetchCallbacks {
  onProgress?: (status: PrefetchStatus) => void;
  onComplete?: (unitId: string) => void;
  onError?: (unitId: string, error: Error) => void;
}

// ── Main prefetch ─────────────────────────────────────────────────────────────

/**
 * Prefetch all data for a unit so the student can complete it offline.
 *
 * @param client — Amplify Gen 2 data client
 * @param unitId — ID of the unit to prefetch
 * @param username — current student's username (for memory lookup)
 * @param callbacks — optional progress/completion hooks
 */
export async function prefetchAssignment(
  client: {
    models: {
      Unit: { get: (args: { id: string }) => Promise<{ data: any }> };
      StudentMemory: { list: (args: { filter: Record<string, unknown> }) => Promise<{ data: any[] }> };
    };
  },
  unitId: string,
  username: string,
  callbacks?: PrefetchCallbacks,
): Promise<void> {
  const update = async (partial: Partial<PrefetchStatus>) => {
    const status: PrefetchStatus = {
      unitId,
      status: 'downloading',
      progress: 0,
      lastUpdated: Date.now(),
      ...partial,
    };
    await setPrefetchStatus(status);
    callbacks?.onProgress?.(status);
  };

  try {
    // Check if already cached
    const existing = await getPrefetchStatus(unitId);
    if (existing?.status === 'complete') {
      callbacks?.onComplete?.(unitId);
      return;
    }

    await update({ status: 'downloading', progress: 0 });

    // 1. Fetch Unit (10%)
    const { data: unit } = await client.models.Unit.get({ id: unitId });
    if (!unit) throw new Error(`Unit ${unitId} not found`);

    await cacheUnit({
      id: unit.id,
      data: typeof unit.data === 'string' ? unit.data : JSON.stringify(unit.data),
      name: unit.name ?? '',
      description: unit.description ?? '',
      version: unit._version ?? 0,
      cachedAt: Date.now(),
    });
    await update({ progress: 10 });

    // 2. Fetch Words (30%)
    const words = unit.unitWords ? await unit.unitWords() : { data: [] };
    const wordItems = (words?.data ?? []).filter(Boolean);
    for (const joinRecord of wordItems) {
      const word = joinRecord.word ? await joinRecord.word() : null;
      if (word?.data) {
        await cacheWord({
          id: word.data.id,
          unitId,
          phrase: word.data.phrase ?? '',
          pronunciation: word.data.pronunciation,
          definition: word.data.definition ?? '',
          audio: word.data.audio,
          cachedAt: Date.now(),
        });
      }
    }
    await update({ progress: 30 });

    // 3. Fetch Questions (50%)
    const questions = unit.questionUnits ? await unit.questionUnits() : { data: [] };
    const questionItems = (questions?.data ?? []).filter(Boolean);
    for (const joinRecord of questionItems) {
      const question = joinRecord.question ? await joinRecord.question() : null;
      if (question?.data) {
        await cacheQuestion({
          id: question.data.id,
          unitId,
          prompt: question.data.prompt ?? '',
          answer: question.data.answer ?? '',
          choices: question.data.choices,
          audio: question.data.audio,
          cachedAt: Date.now(),
        });
      }
    }
    await update({ progress: 50 });

    // 4. Fetch Files and cache blobs (80%)
    const files = unit.unitFiles ? await unit.unitFiles() : { data: [] };
    const fileItems = (files?.data ?? []).filter(Boolean);
    for (const joinRecord of fileItems) {
      const file = joinRecord.file ? await joinRecord.file() : null;
      if (file?.data?.path) {
        try {
          const { downloadData } = await import('aws-amplify/storage');
          const result = await downloadData({ path: file.data.path }).result;
          const blob = await (result as { body: { blob: () => Promise<Blob> } }).body.blob();
          await cacheFile({
            id: file.data.id,
            unitId,
            blob,
            contentType: file.data.mimeType ?? 'application/octet-stream',
            path: file.data.path,
            name: file.data.name,
            cachedAt: Date.now(),
          });
        } catch {
          // Non-fatal: file may not be accessible
          console.warn(`[Prefetch] Could not cache file ${file.data.id}`);
        }
      }
    }
    await update({ progress: 80 });

    // 5. Fetch Student Memory (90%)
    try {
      const memoryResult = await client.models.StudentMemory.list({
        filter: { studentId: { eq: username } },
      });
      const memory = memoryResult.data?.[0];
      if (memory) {
        await cacheStudentMemory({
          id: memory.id,
          studentId: memory.studentId,
          memoryMarkdown: memory.memoryMarkdown ?? '',
          cachedAt: Date.now(),
        });
      }
    } catch {
      console.warn('[Prefetch] Could not cache student memory');
    }
    await update({ progress: 90 });

    // 6. Done (100%)
    await update({ status: 'complete', progress: 100 });
    callbacks?.onComplete?.(unitId);
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    await update({ status: 'error', error: error.message });
    callbacks?.onError?.(unitId, error);
    throw error;
  }
}
