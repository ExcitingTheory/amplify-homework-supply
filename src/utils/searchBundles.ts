/**
 * Client-side search bundle loader and IVF search utility.
 *
 * Loads pre-built search bundles from S3, caches in IndexedDB,
 * and performs ANN (approximate nearest neighbor) search using
 * the IVF index built by the rebuildSearchBundle Lambda.
 */

import { downloadData } from "aws-amplify/storage";

// --- Types ---

export interface BundleItem {
  id: string;
  type: "unit" | "file" | "word" | "question";
  title: string;
  embedding: number[];
  meta: {
    page?: number;
    unitId?: string;
    preview?: string;
  };
}

interface IVFIndex {
  strategy: "ivf";
  k: number;
  nProbe: number;
  centroids: number[][];
  assignments: number[];
}

interface LinearIndex {
  strategy: "linear";
}

export interface SearchBundle {
  version: number;
  dimensions: number;
  model: string;
  index: IVFIndex | LinearIndex;
  items: BundleItem[];
}

export interface SearchResult {
  item: BundleItem;
  score: number;
}

// --- IndexedDB Cache ---

const DB_NAME = "search-bundles";
const STORE_NAME = "bundles";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getCached(key: string): Promise<SearchBundle | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function setCache(key: string, bundle: SearchBundle): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(bundle, key);
  } catch {
    // Cache write failure is non-fatal
  }
}

// --- Bundle Loading ---

export async function loadUnitBundle(
  identityId: string,
  unitId: string,
): Promise<SearchBundle | null> {
  const cacheKey = `unit:${unitId}`;
  const cached = await getCached(cacheKey);

  const path = `protected/${identityId}/search-index/unit/${unitId}.json`;

  try {
    const result = await downloadData({ path }).result;
    const text = await result.body.text();
    const bundle: SearchBundle = JSON.parse(text);

    // Only use cache if version matches
    if (cached && cached.version >= bundle.version) {
      return cached;
    }

    await setCache(cacheKey, bundle);
    return bundle;
  } catch {
    // Fall back to cache if S3 unavailable
    return cached;
  }
}

export async function loadInstructorBundle(
  identityId: string,
): Promise<SearchBundle | null> {
  const cacheKey = `instructor:${identityId}`;
  const cached = await getCached(cacheKey);

  const path = `private/${identityId}/search-index/instructor.json`;

  try {
    const result = await downloadData({ path }).result;
    const text = await result.body.text();
    const bundle: SearchBundle = JSON.parse(text);

    if (cached && cached.version >= bundle.version) {
      return cached;
    }

    await setCache(cacheKey, bundle);
    return bundle;
  } catch {
    return cached;
  }
}

/**
 * Load the platform-wide admin search bundle.
 * Contains all instructors' content — only accessible by Admins.
 */
export async function loadPlatformBundle(): Promise<SearchBundle | null> {
  const cacheKey = "platform:admin";
  const cached = await getCached(cacheKey);

  const path = "private/unit/search-index/platform.json";

  try {
    const result = await downloadData({ path }).result;
    const text = await result.body.text();
    const bundle: SearchBundle = JSON.parse(text);

    if (cached && cached.version >= bundle.version) {
      return cached;
    }

    await setCache(cacheKey, bundle);
    return bundle;
  } catch {
    return cached;
  }
}

/**
 * Load search bundles for units shared with the current user.
 * Fetches unit bundles for each collaborator-granted unit.
 */
export async function loadSharedBundles(
  sharedUnits: Array<{ id: string; identityId: string }>,
): Promise<SearchBundle | null> {
  if (!sharedUnits || sharedUnits.length === 0) return null;

  const allItems: BundleItem[] = [];

  for (const unit of sharedUnits) {
    if (!unit.identityId || !unit.id) continue;
    try {
      const bundle = await loadUnitBundle(unit.identityId, unit.id);
      if (bundle?.items) {
        allItems.push(...bundle.items);
      }
    } catch {
      // Skip units whose bundles don't exist
    }
  }

  if (allItems.length === 0) return null;

  // Build a merged linear bundle for shared content
  return {
    version: Date.now(),
    dimensions: allItems[0]?.embedding?.length || 512,
    model: "text-embedding-3-small",
    index: { strategy: "linear" },
    items: allItems,
  };
}

// --- Search ---

function dotProduct(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

function l2Normalize(v: number[]): number[] {
  let norm = 0;
  for (let i = 0; i < v.length; i++) norm += v[i] * v[i];
  norm = Math.sqrt(norm);
  if (norm === 0) return v;
  return v.map((x) => x / norm);
}

function linearSearch(
  query: number[],
  bundle: SearchBundle,
  topK: number,
  threshold: number,
): SearchResult[] {
  const results: SearchResult[] = [];
  for (const item of bundle.items) {
    const score = dotProduct(query, item.embedding);
    if (score >= threshold) {
      results.push({ item, score });
    }
  }
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, topK);
}

function ivfSearch(
  query: number[],
  bundle: SearchBundle,
  topK: number,
  threshold: number,
): SearchResult[] {
  const index = bundle.index as IVFIndex;

  // Find top nProbe clusters by centroid similarity
  const centroidScores = index.centroids.map((centroid, i) => ({
    cluster: i,
    score: dotProduct(query, centroid),
  }));
  centroidScores.sort((a, b) => b.score - a.score);
  const probeClusters = new Set(
    centroidScores.slice(0, index.nProbe).map((c) => c.cluster),
  );

  // Search only items in selected clusters
  const results: SearchResult[] = [];
  for (let i = 0; i < bundle.items.length; i++) {
    if (!probeClusters.has(index.assignments[i])) continue;
    const score = dotProduct(query, bundle.items[i].embedding);
    if (score >= threshold) {
      results.push({ item: bundle.items[i], score });
    }
  }
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, topK);
}

/**
 * Search a bundle using the pre-computed index strategy.
 * The Lambda decides linear vs IVF at build time — client just reads the flag.
 */
export function search(
  query: number[],
  bundle: SearchBundle,
  topK = 10,
  threshold = 0.3,
): SearchResult[] {
  const normalizedQuery = l2Normalize(query);

  if (!bundle.index || bundle.index.strategy === "linear") {
    return linearSearch(normalizedQuery, bundle, topK, threshold);
  }

  return ivfSearch(normalizedQuery, bundle, topK, threshold);
}
