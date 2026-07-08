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
  type: "unit" | "file" | "word" | "question" | "section";
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

interface HybridSearchConfig {
  semanticWeight: number;
  lexicalWeight: number;
  titleExactBoost: number;
  phraseBoost: number;
}

const DEFAULT_HYBRID_CONFIG: HybridSearchConfig = {
  semanticWeight: 0.65,
  lexicalWeight: 0.35,
  titleExactBoost: 0.2,
  phraseBoost: 0.1,
};

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
    dimensions: allItems[0]?.embedding?.length || 384,
    model: "Xenova/all-MiniLM-L6-v2",
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

function tokenize(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2);
}

function getSearchText(item: BundleItem): string {
  return `${item.title || ""} ${item.meta?.preview || ""}`.trim();
}

function buildTokenStats(
  items: BundleItem[],
  queryTokens: string[],
): { df: Map<string, number>; avgDocLen: number } {
  const df = new Map<string, number>();
  const uniqueQueryTokens = Array.from(new Set(queryTokens));
  let totalLen = 0;

  for (const item of items) {
    const docTokens = tokenize(getSearchText(item));
    totalLen += docTokens.length;
    if (uniqueQueryTokens.length === 0) continue;
    const tokenSet = new Set(docTokens);
    for (const token of uniqueQueryTokens) {
      if (tokenSet.has(token)) {
        df.set(token, (df.get(token) || 0) + 1);
      }
    }
  }

  return {
    df,
    avgDocLen: items.length > 0 ? totalLen / items.length : 0,
  };
}

function lexicalScore(
  item: BundleItem,
  queryText: string,
  queryTokens: string[],
  df: Map<string, number>,
  corpusSize: number,
  avgDocLen: number,
  config: HybridSearchConfig,
): number {
  if (queryTokens.length === 0 || corpusSize === 0) return 0;

  const title = (item.title || "").toLowerCase();
  const docText = getSearchText(item).toLowerCase();
  const docTokens = tokenize(docText);
  const tf = new Map<string, number>();
  for (const token of docTokens) {
    tf.set(token, (tf.get(token) || 0) + 1);
  }

  const k1 = 1.2;
  const b = 0.75;
  const docLen = Math.max(1, docTokens.length);
  const avgLen = Math.max(1, avgDocLen);
  let score = 0;

  for (const token of queryTokens) {
    const termFreq = tf.get(token) || 0;
    if (termFreq === 0) continue;
    const docFreq = df.get(token) || 0;
    const idf = Math.log(1 + (corpusSize - docFreq + 0.5) / (docFreq + 0.5));
    const denom = termFreq + k1 * (1 - b + (b * docLen) / avgLen);
    score += idf * ((termFreq * (k1 + 1)) / denom);
  }

  const normalizedQuery = queryText.trim().toLowerCase();
  if (normalizedQuery && title.includes(normalizedQuery)) {
    score += config.titleExactBoost;
  }
  if (normalizedQuery && docText.includes(normalizedQuery)) {
    score += config.phraseBoost;
  }

  return score;
}

function combineScores(
  semantic: number,
  lexical: number,
  maxLexical: number,
  config: HybridSearchConfig,
): number {
  const normalizedLexical = maxLexical > 0 ? lexical / maxLexical : 0;
  return (
    config.semanticWeight * Math.max(0, semantic) +
    config.lexicalWeight * normalizedLexical
  );
}

function hybridRank(
  query: number[],
  candidates: BundleItem[],
  topK: number,
  semanticThreshold: number,
  queryText: string,
): SearchResult[] {
  const config = DEFAULT_HYBRID_CONFIG;
  const queryTokens = tokenize(queryText);
  const { df, avgDocLen } = buildTokenStats(candidates, queryTokens);

  const scored = candidates.map((item) => {
    const semantic = dotProduct(query, item.embedding);
    const lexical = lexicalScore(
      item,
      queryText,
      queryTokens,
      df,
      candidates.length,
      avgDocLen,
      config,
    );
    return { item, semantic, lexical };
  });

  const maxLexical = scored.reduce(
    (max, s) => (s.lexical > max ? s.lexical : max),
    0,
  );

  const results = scored
    .filter((s) => s.semantic >= semanticThreshold || s.lexical > 0)
    .map((s) => ({
      item: s.item,
      score: combineScores(s.semantic, s.lexical, maxLexical, config),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return results;
}

function linearSearch(
  query: number[],
  bundle: SearchBundle,
  topK: number,
  threshold: number,
  queryText: string,
): SearchResult[] {
  return hybridRank(query, bundle.items, topK, threshold, queryText);
}

function ivfSearch(
  query: number[],
  bundle: SearchBundle,
  topK: number,
  threshold: number,
  queryText: string,
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
  const candidates: BundleItem[] = [];
  for (let i = 0; i < bundle.items.length; i++) {
    if (!probeClusters.has(index.assignments[i])) continue;
    candidates.push(bundle.items[i]);
  }

  return hybridRank(query, candidates, topK, threshold, queryText);
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
  queryText = "",
): SearchResult[] {
  const normalizedQuery = l2Normalize(query);

  if (!bundle.index || bundle.index.strategy === "linear") {
    return linearSearch(normalizedQuery, bundle, topK, threshold, queryText);
  }

  return ivfSearch(normalizedQuery, bundle, topK, threshold, queryText);
}
