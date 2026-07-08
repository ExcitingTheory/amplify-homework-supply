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
  cacheSection,
  cacheAssignment,
  setPrefetchStatus,
  getPrefetchStatus,
  type PrefetchStatus,
} from "./OfflineDataStore";
import { loadContent } from "../utils/unitContentStorage";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PrefetchCallbacks {
  onProgress?: (status: PrefetchStatus) => void;
  onComplete?: (unitId: string) => void;
  onError?: (unitId: string, error: Error) => void;
}

interface SectionInfo {
  id: string;
  name: string;
  description?: string;
  code?: string;
  owner?: string;
  instructor?: string;
  featuredImage?: string;
  identityId?: string;
  status?: string;
}

interface AssignmentInfo {
  id: string;
  unitID: string;
  sectionID: string;
  unitName?: string;
  dueDate?: string;
  status?: string;
  featuredImage?: string;
  identityId?: string;
}

// ── Main prefetch ─────────────────────────────────────────────────────────────

/**
 * Prefetch all data for a unit so the student can complete it offline.
 *
 * @param client — Amplify Gen 2 data client
 * @param unitId — ID of the unit to prefetch
 * @param username — current student's username (for memory lookup)
 * @param callbacks — optional progress/completion hooks
 * @param context — optional section/assignment info to cache for navigation pages
 */
export async function prefetchAssignment(
  client: {
    models: {
      Unit: { get: (args: { id: string }) => Promise<{ data: any }> };
      StudentMemory: {
        list: (args: {
          filter: Record<string, unknown>;
        }) => Promise<{ data: any[] }>;
      };
    };
  },
  unitId: string,
  username: string,
  callbacks?: PrefetchCallbacks,
  context?: { section?: SectionInfo; assignment?: AssignmentInfo },
): Promise<void> {
  const update = async (partial: Partial<PrefetchStatus>) => {
    const status: PrefetchStatus = {
      unitId,
      status: "downloading",
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
    if (existing?.status === "complete") {
      callbacks?.onComplete?.(unitId);
      return;
    }

    await update({ status: "downloading", progress: 0 });

    // Cache section/assignment context for offline navigation pages
    if (context?.section) {
      await cacheSection({
        id: context.section.id,
        name: context.section.name,
        description: context.section.description,
        code: context.section.code,
        owner: context.section.owner,
        instructor: context.section.instructor,
        featuredImage: context.section.featuredImage,
        identityId: context.section.identityId,
        status: context.section.status,
        cachedAt: Date.now(),
      });
    }
    if (context?.assignment) {
      await cacheAssignment({
        id: context.assignment.id,
        unitID: context.assignment.unitID,
        sectionID: context.assignment.sectionID,
        unitName: context.assignment.unitName,
        dueDate: context.assignment.dueDate,
        status: context.assignment.status,
        featuredImage: context.assignment.featuredImage,
        identityId: context.assignment.identityId,
        cachedAt: Date.now(),
      });
    }

    // 1. Fetch Unit (10%)
    const { data: unit } = await client.models.Unit.get({ id: unitId });
    if (!unit) throw new Error(`Unit ${unitId} not found`);

    // Load published content from S3 (learner always reads published)
    let unitContent = "";
    if ((unit as any).identityId) {
      const s3Content = await loadContent(
        (unit as any).identityId,
        unit.id,
        "published",
      );
      unitContent = s3Content ?? "";
    }

    await cacheUnit({
      id: unit.id,
      data: unitContent,
      name: unit.name ?? "",
      description: unit.description ?? "",
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
          phrase: word.data.phrase ?? "",
          pronunciation: word.data.pronunciation,
          definition: word.data.definition ?? "",
          audio: word.data.audio,
          cachedAt: Date.now(),
        });
      }
    }
    await update({ progress: 30 });

    // 3. Fetch Questions (50%)
    const questions = unit.questionUnits
      ? await unit.questionUnits()
      : { data: [] };
    const questionItems = (questions?.data ?? []).filter(Boolean);
    for (const joinRecord of questionItems) {
      const question = joinRecord.question ? await joinRecord.question() : null;
      if (question?.data) {
        await cacheQuestion({
          id: question.data.id,
          unitId,
          prompt: question.data.prompt ?? "",
          answer: question.data.answer ?? "",
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
          const { downloadData } = await import("aws-amplify/storage");
          const result = await downloadData({ path: file.data.path }).result;
          const blob = await (
            result as { body: { blob: () => Promise<Blob> } }
          ).body.blob();
          await cacheFile({
            id: file.data.id,
            unitId,
            blob,
            contentType: file.data.mimeType ?? "application/octet-stream",
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
          memoryMarkdown: memory.memoryMarkdown ?? "",
          cachedAt: Date.now(),
        });
      }
    } catch {
      console.warn("[Prefetch] Could not cache student memory");
    }
    await update({ progress: 90 });

    // 6. Pre-cache search bundle for offline semantic search (93%)
    try {
      const { loadUnitBundle } = await import("../utils/searchBundles");
      const identityId =
        (unit as any).identityId || context?.assignment?.identityId;
      if (identityId) {
        await loadUnitBundle(identityId, unitId);
      }
    } catch {
      // Non-fatal: search bundle may not exist yet for this unit
      console.warn("[Prefetch] Could not cache search bundle");
    }
    await update({ progress: 93 });

    // 7. Pre-download embedding model for offline search (~22MB, cached by browser)
    try {
      const { loadModel } = await import("./LocalEmbeddingModel");
      await loadModel();
    } catch {
      // Non-fatal: model download may fail but TF-IDF fallback still works
      console.warn("[Prefetch] Could not pre-download embedding model");
    }
    await update({ progress: 96 });

    // 8. Cache navigation page shells so the SW can serve them offline
    try {
      const locale =
        (typeof window !== "undefined" &&
          window.location.pathname.match(/^\/([a-z]{2})\//)?.[1]) ||
        "en";
      const cache = await caches.open("offline-workbook-shells");

      // Cache the offline workbook shell
      const offlineShellUrl = `/${locale}/workbook-offline?id=${unitId}`;
      const shellResponse = await fetch(offlineShellUrl);
      if (shellResponse.ok) {
        await cache.put(offlineShellUrl, shellResponse);
      }

      // Cache the upstream navigation pages (home, sections, section detail)
      const pagesToCache = [`/${locale}`, `/${locale}/sections`];
      if (context?.section?.id) {
        pagesToCache.push(`/${locale}/section/${context.section.id}`);
      }
      await Promise.allSettled(
        pagesToCache.map(async (pageUrl) => {
          const resp = await fetch(pageUrl);
          if (resp.ok) await cache.put(pageUrl, resp);
        }),
      );
    } catch {
      // Non-fatal — SW will fall back to generic offline page
      console.warn("[Prefetch] Could not cache offline page shells");
    }

    // 9. Done (100%)
    await update({ status: "complete", progress: 100 });
    callbacks?.onComplete?.(unitId);
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    await update({ status: "error", error: error.message });
    callbacks?.onError?.(unitId, error);
    throw error;
  }
}
