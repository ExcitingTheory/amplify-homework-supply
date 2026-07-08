/**
 * OfflineDataStore — IndexedDB persistence layer for offline student data.
 *
 * Stores units, words, questions, files (as blobs), grades, student memory,
 * and a sync queue for deferred mutations. Uses the `idb` library that is
 * already a project dependency via VectorStoreDB.
 */

import type { IDBPDatabase } from "idb";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CachedUnit {
  id: string;
  data: string; // Lexical JSON
  name: string;
  description?: string;
  version: number; // _version
  cachedAt: number;
}

export interface CachedWord {
  id: string;
  unitId: string;
  phrase: string;
  pronunciation?: string;
  definition: string;
  audio?: string[];
  cachedAt: number;
}

export interface CachedQuestion {
  id: string;
  unitId: string;
  prompt: string;
  answer: string;
  choices?: Array<{ choice: string; correct: boolean }>;
  audio?: string[];
  cachedAt: number;
}

export interface CachedFile {
  id: string;
  unitId: string;
  blob: Blob;
  contentType: string;
  path: string;
  name?: string;
  cachedAt: number;
}

export interface CachedGrade {
  id: string;
  unitId: string;
  sectionId?: string;
  data: string; // JSON string of block responses
  accuracy?: number;
  percentComplete?: number;
  complete: boolean;
  /** 0 = unsynced, 1 = synced. Numbers (not booleans) because IDB indexes don't support boolean keys. */
  synced: 0 | 1;
  savedAt: number;
  version?: number; // _version
}

export interface CachedStudentMemory {
  id: string;
  studentId: string;
  memoryMarkdown: string;
  cachedAt: number;
}

export interface PrefetchStatus {
  unitId: string;
  status: "pending" | "downloading" | "complete" | "error";
  progress: number; // 0-100
  lastUpdated: number;
  error?: string;
}

export interface CachedSection {
  id: string;
  name: string;
  description?: string;
  code?: string;
  owner?: string;
  instructor?: string;
  featuredImage?: string;
  identityId?: string;
  status?: string;
  cachedAt: number;
}

export interface CachedAssignment {
  id: string;
  unitID: string;
  sectionID: string;
  unitName?: string;
  dueDate?: string;
  status?: string;
  featuredImage?: string;
  identityId?: string;
  cachedAt: number;
}

// ── DB Setup ──────────────────────────────────────────────────────────────────

const DB_NAME = "OfflineDataStore";
const DB_VERSION = 2;

let openDB: typeof import("idb").openDB;
let _depsLoaded = false;

async function loadDeps(): Promise<void> {
  if (_depsLoaded || typeof window === "undefined") return;
  ({ openDB } = await import("idb"));
  _depsLoaded = true;
}

let _dbPromise: Promise<IDBPDatabase> | null = null;

async function getDB(): Promise<IDBPDatabase> {
  if (typeof window === "undefined") {
    throw new Error("OfflineDataStore is only available in browser");
  }
  await loadDeps();
  if (!_dbPromise) {
    _dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Units store
        if (!db.objectStoreNames.contains("units")) {
          db.createObjectStore("units", { keyPath: "id" });
        }
        // Words store
        if (!db.objectStoreNames.contains("words")) {
          const words = db.createObjectStore("words", { keyPath: "id" });
          words.createIndex("unitId", "unitId", { unique: false });
        }
        // Questions store
        if (!db.objectStoreNames.contains("questions")) {
          const questions = db.createObjectStore("questions", {
            keyPath: "id",
          });
          questions.createIndex("unitId", "unitId", { unique: false });
        }
        // Files store (blobs)
        if (!db.objectStoreNames.contains("files")) {
          const files = db.createObjectStore("files", { keyPath: "id" });
          files.createIndex("unitId", "unitId", { unique: false });
        }
        // Grades store
        if (!db.objectStoreNames.contains("grades")) {
          const grades = db.createObjectStore("grades", { keyPath: "id" });
          grades.createIndex("unitId", "unitId", { unique: false });
          grades.createIndex("synced", "synced", { unique: false });
        }
        // Student memory
        if (!db.objectStoreNames.contains("studentMemory")) {
          db.createObjectStore("studentMemory", { keyPath: "id" });
        }
        // Sync queue
        if (!db.objectStoreNames.contains("syncQueue")) {
          const sq = db.createObjectStore("syncQueue", {
            keyPath: "id",
            autoIncrement: true,
          });
          sq.createIndex("createdAt", "createdAt", { unique: false });
        }
        // Prefetch status
        if (!db.objectStoreNames.contains("prefetchStatus")) {
          db.createObjectStore("prefetchStatus", { keyPath: "unitId" });
        }
        // Sections store (v2)
        if (!db.objectStoreNames.contains("sections")) {
          db.createObjectStore("sections", { keyPath: "id" });
        }
        // Assignments store (v2)
        if (!db.objectStoreNames.contains("assignments")) {
          const assignments = db.createObjectStore("assignments", {
            keyPath: "id",
          });
          assignments.createIndex("sectionID", "sectionID", { unique: false });
          assignments.createIndex("unitID", "unitID", { unique: false });
        }
      },
    });
  }
  return _dbPromise;
}

// ── Generic helpers ───────────────────────────────────────────────────────────

export async function putRecord<T>(store: string, value: T): Promise<void> {
  const db = await getDB();
  await db.put(store, value);
}

export async function getRecord<T>(
  store: string,
  key: IDBValidKey,
): Promise<T | undefined> {
  const db = await getDB();
  return db.get(store, key);
}

export async function getAllRecords<T>(store: string): Promise<T[]> {
  const db = await getDB();
  return db.getAll(store);
}

export async function getRecordsByIndex<T>(
  store: string,
  indexName: string,
  key: IDBValidKey,
): Promise<T[]> {
  const db = await getDB();
  return db.getAllFromIndex(store, indexName, key);
}

export async function deleteRecord(
  store: string,
  key: IDBValidKey,
): Promise<void> {
  const db = await getDB();
  await db.delete(store, key);
}

export async function clearStore(store: string): Promise<void> {
  const db = await getDB();
  await db.clear(store);
}

// ── Unit helpers ──────────────────────────────────────────────────────────────

export async function cacheUnit(unit: CachedUnit): Promise<void> {
  await putRecord("units", { ...unit, cachedAt: Date.now() });
}

export async function getCachedUnit(
  unitId: string,
): Promise<CachedUnit | undefined> {
  return getRecord<CachedUnit>("units", unitId);
}

// ── Words ─────────────────────────────────────────────────────────────────────

export async function cacheWord(word: CachedWord): Promise<void> {
  await putRecord("words", { ...word, cachedAt: Date.now() });
}

export async function getCachedWordsForUnit(
  unitId: string,
): Promise<CachedWord[]> {
  return getRecordsByIndex<CachedWord>("words", "unitId", unitId);
}

// ── Questions ─────────────────────────────────────────────────────────────────

export async function cacheQuestion(question: CachedQuestion): Promise<void> {
  await putRecord("questions", { ...question, cachedAt: Date.now() });
}

export async function getCachedQuestionsForUnit(
  unitId: string,
): Promise<CachedQuestion[]> {
  return getRecordsByIndex<CachedQuestion>("questions", "unitId", unitId);
}

// ── Files (blobs) ─────────────────────────────────────────────────────────────

export async function cacheFile(file: CachedFile): Promise<void> {
  await putRecord("files", { ...file, cachedAt: Date.now() });
}

export async function getCachedFilesForUnit(
  unitId: string,
): Promise<CachedFile[]> {
  return getRecordsByIndex<CachedFile>("files", "unitId", unitId);
}

export async function getCachedFileBlob(
  fileId: string,
): Promise<Blob | undefined> {
  const record = await getRecord<CachedFile>("files", fileId);
  return record?.blob;
}

// ── Grades ────────────────────────────────────────────────────────────────────

export async function cacheGrade(grade: CachedGrade): Promise<void> {
  await putRecord("grades", grade);
}

export async function getCachedGrade(
  gradeId: string,
): Promise<CachedGrade | undefined> {
  return getRecord<CachedGrade>("grades", gradeId);
}

export async function getUnsyncedGrades(): Promise<CachedGrade[]> {
  return getRecordsByIndex<CachedGrade>("grades", "synced", 0);
}

// ── Student memory ────────────────────────────────────────────────────────────

export async function cacheStudentMemory(
  memory: CachedStudentMemory,
): Promise<void> {
  await putRecord("studentMemory", { ...memory, cachedAt: Date.now() });
}

export async function getCachedStudentMemory(
  id: string,
): Promise<CachedStudentMemory | undefined> {
  return getRecord<CachedStudentMemory>("studentMemory", id);
}

// ── Prefetch status ───────────────────────────────────────────────────────────

export async function setPrefetchStatus(status: PrefetchStatus): Promise<void> {
  await putRecord("prefetchStatus", status);
}

export async function getPrefetchStatus(
  unitId: string,
): Promise<PrefetchStatus | undefined> {
  return getRecord<PrefetchStatus>("prefetchStatus", unitId);
}

export async function getAllPrefetchStatuses(): Promise<PrefetchStatus[]> {
  return getAllRecords<PrefetchStatus>("prefetchStatus");
}

// ── Storage estimate ──────────────────────────────────────────────────────────

export async function getStorageEstimate(): Promise<{
  usage: number;
  quota: number;
}> {
  if (typeof navigator !== "undefined" && navigator.storage?.estimate) {
    const est = await navigator.storage.estimate();
    return { usage: est.usage ?? 0, quota: est.quota ?? 0 };
  }
  return { usage: 0, quota: 0 };
}

/**
 * Remove all cached data for a specific unit (words, questions, files, etc.)
 */
export async function clearUnitCache(unitId: string): Promise<void> {
  const db = await getDB();

  const stores = ["words", "questions", "files"] as const;
  for (const storeName of stores) {
    const tx = db.transaction(storeName, "readwrite");
    const index = tx.store.index("unitId");
    let cursor = await index.openCursor(unitId);
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }
    await tx.done;
  }

  await db.delete("units", unitId);
  await db.delete("prefetchStatus", unitId);
}

// ── Sections ──────────────────────────────────────────────────────────────────

export async function cacheSection(section: CachedSection): Promise<void> {
  await putRecord("sections", { ...section, cachedAt: Date.now() });
}

export async function getCachedSection(
  sectionId: string,
): Promise<CachedSection | undefined> {
  return getRecord<CachedSection>("sections", sectionId);
}

export async function getAllCachedSections(): Promise<CachedSection[]> {
  return getAllRecords<CachedSection>("sections");
}

// ── Assignments ───────────────────────────────────────────────────────────────

export async function cacheAssignment(
  assignment: CachedAssignment,
): Promise<void> {
  await putRecord("assignments", { ...assignment, cachedAt: Date.now() });
}

export async function getCachedAssignment(
  assignmentId: string,
): Promise<CachedAssignment | undefined> {
  return getRecord<CachedAssignment>("assignments", assignmentId);
}

export async function getCachedAssignmentsForSection(
  sectionId: string,
): Promise<CachedAssignment[]> {
  return getRecordsByIndex<CachedAssignment>(
    "assignments",
    "sectionID",
    sectionId,
  );
}

export async function getAllCachedAssignments(): Promise<CachedAssignment[]> {
  return getAllRecords<CachedAssignment>("assignments");
}
