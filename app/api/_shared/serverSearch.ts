/**
 * Server-Side Search Bundle Utilities
 *
 * Port of the client-side searchBundles.ts for use in Route Handlers.
 * Loads search bundles from S3 via AWS SDK (not Amplify Storage)
 * and performs IVF/linear ANN search.
 */

import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

// --- Types (mirrored from src/utils/searchBundles.ts) ---

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

interface HNSWIndex {
  strategy: "hnsw";
  M: number;
  efSearch: number;
  /** Layered adjacency lists. layers[0] = base layer (all nodes), layers[L] = top layer (few nodes). */
  layers: number[][][]; // layers[level][nodeIndex] = array of neighbor indices
  /** Entry point node index (always in the top layer). */
  entryPoint: number;
  /** Maximum layer for each node. */
  nodeLevels: number[];
}

export interface SearchBundle {
  version: number;
  dimensions: number;
  model: string;
  index: IVFIndex | LinearIndex | HNSWIndex;
  items: BundleItem[];
}

export interface SearchResult {
  item: BundleItem;
  score: number;
}

// --- S3 Helpers ---

let _s3: S3Client | null = null;
function getS3(): S3Client {
  if (!_s3) _s3 = new S3Client({});
  return _s3;
}

function getBucketName(): string {
  if (process.env.AMPLIFY_STORAGE_BUCKET_NAME) {
    return process.env.AMPLIFY_STORAGE_BUCKET_NAME;
  }
  if (process.env.STORAGE_BUCKET_NAME) {
    return process.env.STORAGE_BUCKET_NAME;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const outputs = require("../../../amplify_outputs.json");
    return outputs?.storage?.bucket_name;
  } catch {
    throw new Error("S3 bucket name not configured");
  }
}

/**
 * Load a search bundle from S3 by path.
 * Returns null if the bundle doesn't exist or can't be loaded.
 */
export async function loadBundleFromS3(
  path: string,
): Promise<SearchBundle | null> {
  try {
    const response = await getS3().send(
      new GetObjectCommand({
        Bucket: getBucketName(),
        Key: path,
      }),
    );
    const text = await response.Body?.transformToString();
    if (!text) return null;
    return JSON.parse(text) as SearchBundle;
  } catch (error: any) {
    if (
      error?.name === "NoSuchKey" ||
      error?.$metadata?.httpStatusCode === 404
    ) {
      return null;
    }
    console.warn(`[serverSearch] Failed to load bundle at ${path}:`, error);
    return null;
  }
}

// --- Search Math ---

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

  const centroidScores = index.centroids.map((centroid, i) => ({
    cluster: i,
    score: dotProduct(query, centroid),
  }));
  centroidScores.sort((a, b) => b.score - a.score);
  const probeClusters = new Set(
    centroidScores.slice(0, index.nProbe).map((c) => c.cluster),
  );

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

// ─── HNSW Search ──────────────────────────────────────────────────────────────

/**
 * Greedy beam search on an HNSW graph layer.
 * Returns the `ef` closest neighbors found from the given entry points.
 */
function hnswSearchLayer(
  query: number[],
  items: BundleItem[],
  neighbors: number[][], // adjacency list for this layer
  entryPoints: number[],
  ef: number,
): Array<{ idx: number; score: number }> {
  const visited = new Set<number>(entryPoints);
  // Max-heap candidates (all nodes to explore), min-heap results (best so far)
  const candidates: Array<{ idx: number; score: number }> = [];
  const results: Array<{ idx: number; score: number }> = [];

  for (const ep of entryPoints) {
    const score = dotProduct(query, items[ep].embedding);
    candidates.push({ idx: ep, score });
    results.push({ idx: ep, score });
  }

  candidates.sort((a, b) => b.score - a.score); // best first
  results.sort((a, b) => b.score - a.score);

  while (candidates.length > 0) {
    const current = candidates.shift()!;
    const worstResult = results[results.length - 1];

    // If current candidate is worse than the worst result and we have enough, stop
    if (results.length >= ef && current.score < worstResult.score) break;

    // Explore neighbors
    const nodeNeighbors = neighbors[current.idx] || [];
    for (const neighborIdx of nodeNeighbors) {
      if (visited.has(neighborIdx)) continue;
      visited.add(neighborIdx);

      const score = dotProduct(query, items[neighborIdx].embedding);

      if (results.length < ef || score > results[results.length - 1].score) {
        candidates.push({ idx: neighborIdx, score });
        results.push({ idx: neighborIdx, score });
        results.sort((a, b) => b.score - a.score);
        if (results.length > ef) results.pop();

        // Re-sort candidates (insertion could be optimized but N is bounded by ef)
        candidates.sort((a, b) => b.score - a.score);
      }
    }
  }

  return results;
}

function hnswSearch(
  query: number[],
  bundle: SearchBundle,
  topK: number,
  threshold: number,
): SearchResult[] {
  const index = bundle.index as HNSWIndex;
  const { layers, entryPoint, efSearch } = index;

  if (layers.length === 0 || bundle.items.length === 0) {
    return linearSearch(query, bundle, topK, threshold);
  }

  // Start from top layer, greedily descend to base
  let currentEntryPoints = [entryPoint];

  // Traverse from top layer down to layer 1 (greedy, ef=1)
  for (let level = layers.length - 1; level > 0; level--) {
    const layerNeighbors = layers[level];
    const nearest = hnswSearchLayer(
      query,
      bundle.items,
      layerNeighbors,
      currentEntryPoints,
      1, // ef=1 for upper layers (greedy)
    );
    currentEntryPoints = nearest.map((n) => n.idx);
  }

  // Search base layer (layer 0) with full efSearch
  const baseResults = hnswSearchLayer(
    query,
    bundle.items,
    layers[0],
    currentEntryPoints,
    efSearch,
  );

  // Filter by threshold, take topK
  return baseResults
    .filter((r) => r.score >= threshold)
    .slice(0, topK)
    .map((r) => ({ item: bundle.items[r.idx], score: r.score }));
}

/**
 * Search a bundle using its pre-computed index strategy.
 */
export function searchBundle(
  queryEmbedding: number[],
  bundle: SearchBundle,
  topK = 10,
  threshold = 0.3,
): SearchResult[] {
  const normalizedQuery = l2Normalize(queryEmbedding);

  if (!bundle.index || bundle.index.strategy === "linear") {
    return linearSearch(normalizedQuery, bundle, topK, threshold);
  }

  if (bundle.index.strategy === "hnsw") {
    return hnswSearch(normalizedQuery, bundle, topK, threshold);
  }

  return ivfSearch(normalizedQuery, bundle, topK, threshold);
}

// ─── Hybrid Scoring (Cosine + BM25 Keyword Boost) ────────────────────────────

/**
 * Simple BM25-inspired keyword scoring for hybrid search.
 * Boosts results that contain query keywords in their title or preview.
 */
function bm25Score(queryTerms: string[], text: string): number {
  if (!text || !queryTerms.length) return 0;
  const lower = text.toLowerCase();
  let hits = 0;
  for (const term of queryTerms) {
    if (lower.includes(term)) hits += 1;
  }
  // Normalize by query length for 0-1 range
  return hits / queryTerms.length;
}

/**
 * Hybrid search combining cosine similarity with BM25 keyword boosting.
 * Useful when the user query contains specific terms that should boost relevance.
 *
 * @param alpha Weight for cosine similarity (0-1). BM25 weight = 1 - alpha.
 */
export function hybridSearchBundle(
  queryEmbedding: number[],
  queryText: string,
  bundle: SearchBundle,
  topK = 10,
  threshold = 0.3,
  alpha = 0.8,
): SearchResult[] {
  // Get semantic results with a lower threshold (BM25 will re-rank)
  const semanticResults = searchBundle(
    queryEmbedding,
    bundle,
    topK * 2,
    threshold * 0.7,
  );

  const queryTerms = queryText
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2);

  if (!queryTerms.length) return semanticResults.slice(0, topK);

  // Re-score with hybrid weighting
  const reRanked = semanticResults.map((r) => {
    const textContent = `${r.item.title} ${r.item.meta.preview || ""}`;
    const keywordScore = bm25Score(queryTerms, textContent);
    const hybridScore = alpha * r.score + (1 - alpha) * keywordScore;
    return { ...r, score: hybridScore };
  });

  reRanked.sort((a, b) => b.score - a.score);

  // Apply original threshold to hybrid score
  return reRanked.filter((r) => r.score >= threshold).slice(0, topK);
}
