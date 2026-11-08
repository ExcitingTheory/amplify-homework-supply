/**
 * Search index structures shared by the full and incremental bundle builders.
 *
 * Strategies (chosen by item count): linear scan, IVF clustering, and an HNSW
 * graph. Everything operates on L2-normalized vectors, so a dot product is the
 * cosine similarity.
 */

export const EMBEDDING_DIMENSIONS = 384;
export const IVF_THRESHOLD = 200;
export const HNSW_THRESHOLD = 5000;

export interface BundleItem {
  id: string;
  type: "unit" | "file" | "word" | "question" | "section";
  title: string;
  embedding: number[];
  meta: {
    page?: number;
    unitId?: string;
    preview?: string;
    /** Owning identity; lets the platform bundle update one owner's items. */
    identityId?: string;
  };
}

export interface IVFIndex {
  strategy: "ivf";
  k: number;
  nProbe: number;
  centroids: number[][];
  assignments: number[];
}

export interface LinearIndex {
  strategy: "linear";
}

export interface HNSWIndex {
  strategy: "hnsw";
  M: number;
  efSearch: number;
  layers: number[][][];
  entryPoint: number;
  nodeLevels: number[];
}

export interface SearchBundle {
  version: number;
  dimensions: number;
  model: string;
  index: IVFIndex | LinearIndex | HNSWIndex;
  items: BundleItem[];
}

// --- K-Means IVF Implementation ---

export function dotProduct(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

export function l2Normalize(v: number[]): number[] {
  let norm = 0;
  for (let i = 0; i < v.length; i++) norm += v[i] * v[i];
  norm = Math.sqrt(norm);
  if (norm === 0) return v;
  return v.map((x) => x / norm);
}

function initCentroidsKMeansPlusPlus(
  vectors: number[][],
  k: number,
): number[][] {
  const centroids: number[][] = [];
  // Pick first centroid uniformly at random
  centroids.push([...vectors[Math.floor(Math.random() * vectors.length)]]);

  for (let c = 1; c < k; c++) {
    // Compute distances to nearest centroid
    const distances = vectors.map((v) => {
      let minDist = Infinity;
      for (const centroid of centroids) {
        const dist = 1 - dotProduct(v, centroid); // cosine distance for L2-normalized vectors
        if (dist < minDist) minDist = dist;
      }
      return minDist;
    });

    // Weighted random selection
    const totalDist = distances.reduce((a, b) => a + b, 0);
    let r = Math.random() * totalDist;
    let idx = 0;
    for (let i = 0; i < distances.length; i++) {
      r -= distances[i];
      if (r <= 0) {
        idx = i;
        break;
      }
    }
    centroids.push([...vectors[idx]]);
  }
  return centroids;
}

function runKMeans(
  vectors: number[][],
  k: number,
  iterations = 20,
): { centroids: number[][]; assignments: number[] } {
  const centroids = initCentroidsKMeansPlusPlus(vectors, k);
  const assignments = new Array(vectors.length).fill(0);

  for (let iter = 0; iter < iterations; iter++) {
    // Assign each vector to nearest centroid
    for (let i = 0; i < vectors.length; i++) {
      let bestDist = -Infinity;
      let bestCluster = 0;
      for (let c = 0; c < k; c++) {
        const sim = dotProduct(vectors[i], centroids[c]);
        if (sim > bestDist) {
          bestDist = sim;
          bestCluster = c;
        }
      }
      assignments[i] = bestCluster;
    }

    // Recompute centroids
    for (let c = 0; c < k; c++) {
      const members = vectors.filter((_, i) => assignments[i] === c);
      if (members.length === 0) continue;
      const dim = vectors[0].length;
      const newCentroid = new Array(dim).fill(0);
      for (const m of members) {
        for (let d = 0; d < dim; d++) newCentroid[d] += m[d];
      }
      for (let d = 0; d < dim; d++) newCentroid[d] /= members.length;
      centroids[c] = l2Normalize(newCentroid);
    }
  }

  return { centroids, assignments: Array.from(assignments) };
}

export function buildIvfIndex(vectors: number[][]): IVFIndex {
  const k = Math.ceil(Math.sqrt(vectors.length));
  const nProbe = Math.max(2, Math.ceil(k * 0.1));
  const normalized = vectors.map(l2Normalize);
  const { centroids, assignments } = runKMeans(normalized, k);
  return { strategy: "ivf", k, nProbe, centroids, assignments };
}

export function buildIndex(vectors: number[][]): SearchBundle["index"] {
  if (vectors.length <= IVF_THRESHOLD) {
    return { strategy: "linear" };
  }
  if (vectors.length >= HNSW_THRESHOLD) {
    return buildHnswIndex(vectors);
  }
  return buildIvfIndex(vectors);
}

// ─── HNSW Graph Builder ───────────────────────────────────────────────────────

const HNSW_M = 16;
const HNSW_EF_CONSTRUCTION = 200;
const HNSW_EF_SEARCH = 50;

interface HnswState {
  /** L2-normalized vectors, one per node. */
  vectors: number[][];
  /** layers[level][node] = neighbor node ids. */
  layers: number[][][];
  nodeLevels: number[];
  entryPoint: number;
}

function randomHnswLevel(M: number): number {
  return Math.floor((-Math.log(Math.random()) * 1.0) / Math.log(M));
}

/**
 * Inserts node `i` (already present in state.vectors / nodeLevels, with an
 * empty neighbor list on every level up to its own) into the graph.
 */
function insertHnswNode(
  state: HnswState,
  i: number,
  M: number,
  efConstruction: number,
): void {
  const { vectors, layers, nodeLevels } = state;
  const nodeLevel = nodeLevels[i];
  const entryLevel = nodeLevels[state.entryPoint];
  let currEntry = state.entryPoint;

  // Greedy descent from top to nodeLevel+1
  for (let level = entryLevel; level > nodeLevel; level--) {
    currEntry = greedyClosest(vectors[i], vectors, layers[level], currEntry);
  }

  // Insert at each level from min(nodeLevel, entryLevel) down to 0
  const startLevel = Math.min(nodeLevel, entryLevel);
  let entryPoints = [currEntry];

  for (let level = startLevel; level >= 0; level--) {
    // Find efConstruction nearest neighbors at this level
    const nearest = searchLayerBuild(
      vectors[i],
      vectors,
      layers[level],
      entryPoints,
      efConstruction,
    );

    // Select M best neighbors
    const neighbors = nearest.slice(0, M).map((n) => n.idx);

    // Add bidirectional edges
    layers[level][i] = neighbors;
    for (const neighborIdx of neighbors) {
      const nNeighbors = layers[level][neighborIdx];
      nNeighbors.push(i);
      // Prune if exceeding M connections
      if (nNeighbors.length > M) {
        // Keep only M closest
        layers[level][neighborIdx] = closestNeighbors(
          vectors,
          neighborIdx,
          nNeighbors,
          M,
        );
      }
    }

    // Entry points for next level down
    entryPoints = nearest.map((n) => n.idx);
  }

  // Update entry point if new node has higher level
  if (nodeLevel > entryLevel) {
    state.entryPoint = i;
  }
}

function closestNeighbors(
  vectors: number[][],
  node: number,
  candidates: number[],
  limit: number,
): number[] {
  return candidates
    .map((idx) => ({ idx, score: dotProduct(vectors[node], vectors[idx]) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.idx);
}

function toHnswIndex(state: HnswState, M: number): HNSWIndex {
  return {
    strategy: "hnsw",
    M,
    efSearch: HNSW_EF_SEARCH,
    layers: state.layers,
    entryPoint: state.entryPoint,
    nodeLevels: state.nodeLevels,
  };
}

/**
 * Build an HNSW (Hierarchical Navigable Small World) graph for ANN search.
 * Used for platform-wide bundles with >5000 items.
 *
 * Parameters:
 *   M = 16 (max connections per node per layer)
 *   efConstruction = 200 (beam width during build)
 *   mL = 1/ln(M) (level generation factor)
 */
export function buildHnswIndex(
  vectors: number[][],
  M = HNSW_M,
  efConstruction = HNSW_EF_CONSTRUCTION,
): HNSWIndex {
  const n = vectors.length;
  const normalized = vectors.map(l2Normalize);
  const nodeLevels = normalized.map(() => randomHnswLevel(M));
  const maxLevel = nodeLevels.reduce((max, l) => Math.max(max, l), 0);

  // layers[level][nodeIndex] = neighbors
  const layers: number[][][] = [];
  for (let l = 0; l <= maxLevel; l++) {
    layers.push(Array.from({ length: n }, () => []));
  }

  const state: HnswState = {
    vectors: normalized,
    layers,
    nodeLevels,
    entryPoint: 0,
  };
  for (let i = 1; i < n; i++) {
    insertHnswNode(state, i, M, efConstruction);
  }
  return toHnswIndex(state, M);
}

function greedyClosest(
  query: number[],
  allVectors: number[][],
  layerNeighbors: number[][],
  start: number,
): number {
  let current = start;
  let bestScore = dotProduct(query, allVectors[current]);

  let improved = true;
  while (improved) {
    improved = false;
    for (const neighbor of layerNeighbors[current] || []) {
      const score = dotProduct(query, allVectors[neighbor]);
      if (score > bestScore) {
        bestScore = score;
        current = neighbor;
        improved = true;
      }
    }
  }
  return current;
}

function searchLayerBuild(
  query: number[],
  allVectors: number[][],
  layerNeighbors: number[][],
  entryPoints: number[],
  ef: number,
): Array<{ idx: number; score: number }> {
  const visited = new Set<number>(entryPoints);
  const candidates: Array<{ idx: number; score: number }> = [];
  const results: Array<{ idx: number; score: number }> = [];

  for (const ep of entryPoints) {
    const score = dotProduct(query, allVectors[ep]);
    candidates.push({ idx: ep, score });
    results.push({ idx: ep, score });
  }

  candidates.sort((a, b) => b.score - a.score);
  results.sort((a, b) => b.score - a.score);

  while (candidates.length > 0) {
    const current = candidates.shift()!;
    if (
      results.length >= ef &&
      current.score < results[results.length - 1].score
    )
      break;

    for (const neighborIdx of layerNeighbors[current.idx] || []) {
      if (visited.has(neighborIdx)) continue;
      visited.add(neighborIdx);

      const score = dotProduct(query, allVectors[neighborIdx]);
      if (results.length < ef || score > results[results.length - 1].score) {
        candidates.push({ idx: neighborIdx, score });
        results.push({ idx: neighborIdx, score });
        results.sort((a, b) => b.score - a.score);
        if (results.length > ef) results.pop();
        candidates.sort((a, b) => b.score - a.score);
      }
    }
  }

  return results;
}


// ─── Incremental updates ──────────────────────────────────────────────────────

export interface ItemDelta {
  /** Existing items to drop (evaluated before the upserts are added). */
  isRemoved: (item: BundleItem) => boolean;
  /** Items to add; vectors must already be L2-normalized. */
  upserts: BundleItem[];
}

export type IndexAction = "unchanged" | "incremental" | "rebuilt";

export interface DeltaResult {
  bundle: SearchBundle;
  indexAction: IndexAction;
  removed: number;
  added: number;
}

type Strategy = SearchBundle["index"]["strategy"];

/**
 * Picks the strategy for `count` items. Thresholds have hysteresis so a bundle
 * hovering around a boundary does not flip (and rebuild its index) every update.
 */
function targetStrategy(count: number, current: Strategy): Strategy {
  if (count >= HNSW_THRESHOLD) return "hnsw";
  if (current === "hnsw" && count >= HNSW_THRESHOLD * 0.8) return "hnsw";
  if (count > IVF_THRESHOLD) return "ivf";
  if (current === "ivf" && count > IVF_THRESHOLD * 0.8) return "ivf";
  return "linear";
}

function nearestCentroid(vector: number[], centroids: number[][]): number {
  let best = 0;
  let bestScore = -Infinity;
  for (let c = 0; c < centroids.length; c++) {
    const score = dotProduct(vector, centroids[c]);
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best;
}

/**
 * Drops removed nodes from every layer and compacts node ids. Nodes that lost
 * a neighbor are reconnected to that neighbor's own neighbors, which keeps the
 * graph navigable without a rebuild.
 */
function removeHnswNodes(
  index: HNSWIndex,
  items: BundleItem[],
  keep: boolean[],
): HnswState {
  const oldToNew = new Array<number>(keep.length).fill(-1);
  let next = 0;
  keep.forEach((kept, i) => {
    if (kept) oldToNew[i] = next++;
  });
  const oldVectors = items.map((item) => item.embedding);

  const layers = index.layers.map((layer) => {
    const orphanedNeighbors = new Map<number, number[]>();
    keep.forEach((kept, r) => {
      if (!kept) {
        orphanedNeighbors.set(
          r,
          (layer[r] || []).filter((x) => keep[x]),
        );
      }
    });

    const compacted: number[][] = new Array(next);
    keep.forEach((kept, u) => {
      if (!kept) return;
      const list = layer[u] || [];
      if (list.every((x) => keep[x])) {
        compacted[oldToNew[u]] = list.map((x) => oldToNew[x]);
        return;
      }
      const candidates = new Set<number>();
      for (const x of list) {
        if (keep[x]) candidates.add(x);
        else for (const y of orphanedNeighbors.get(x) || []) candidates.add(y);
      }
      candidates.delete(u);
      compacted[oldToNew[u]] = closestNeighbors(
        oldVectors,
        u,
        [...candidates],
        index.M,
      ).map((x) => oldToNew[x]);
    });
    return compacted;
  });

  const nodeLevels = index.nodeLevels.filter((_, i) => keep[i]);
  const maxLevel = nodeLevels.reduce((max, l) => Math.max(max, l), 0);

  let entryPoint = keep[index.entryPoint] ? oldToNew[index.entryPoint] : 0;
  if (!keep[index.entryPoint]) {
    nodeLevels.forEach((level, i) => {
      if (level > nodeLevels[entryPoint]) entryPoint = i;
    });
  }

  return {
    vectors: items.filter((_, i) => keep[i]).map((item) => item.embedding),
    layers: layers.slice(0, maxLevel + 1),
    nodeLevels,
    entryPoint,
  };
}

function addHnswNodes(
  state: HnswState,
  upserts: BundleItem[],
  M: number,
): void {
  for (const item of upserts) {
    const level = randomHnswLevel(M);
    while (state.layers.length <= level) {
      state.layers.push(Array.from({ length: state.vectors.length }, () => []));
    }
    state.vectors.push(item.embedding);
    state.nodeLevels.push(level);
    for (const layer of state.layers) layer.push([]);
    insertHnswNode(state, state.vectors.length - 1, M, HNSW_EF_CONSTRUCTION);
  }
}

const isConsistent = (index: SearchBundle["index"], itemCount: number) =>
  index.strategy === "linear" ||
  (index.strategy === "ivf" && index.assignments.length === itemCount) ||
  (index.strategy === "hnsw" &&
    index.nodeLevels.length === itemCount &&
    index.layers.every((layer) => layer.length === itemCount));

/**
 * Applies an item-level change to a bundle and keeps its index valid without
 * rebuilding it from scratch whenever possible:
 * - linear: nothing to maintain.
 * - ivf: removed items drop out of the assignment list; new items join their
 *   nearest existing cluster. Re-clusters only when the ideal cluster count
 *   has drifted by 2x.
 * - hnsw: removed nodes are unlinked and their neighbors reconnected; new
 *   items are inserted into the graph.
 * A full index build only happens when the item count crosses a strategy
 * boundary or the existing index is inconsistent with the items.
 */
export function applyItemDelta(
  bundle: SearchBundle,
  delta: ItemDelta,
): DeltaResult {
  const keep = bundle.items.map((item) => !delta.isRemoved(item));
  const removed = keep.filter((kept) => !kept).length;
  const added = delta.upserts.length;
  if (removed === 0 && added === 0) {
    return { bundle, indexAction: "unchanged", removed, added };
  }

  const keptItems = bundle.items.filter((_, i) => keep[i]);
  const items = [...keptItems, ...delta.upserts];
  const current = bundle.index?.strategy ?? "linear";
  const target = targetStrategy(items.length, current);
  const usable =
    current === target &&
    keptItems.length > 0 &&
    isConsistent(bundle.index, bundle.items.length);

  let index: SearchBundle["index"];
  let indexAction: IndexAction = "incremental";

  if (target === "linear") {
    index = { strategy: "linear" };
    if (current !== "linear") indexAction = "rebuilt";
  } else if (target === "ivf") {
    const ivf = bundle.index as IVFIndex;
    const drifted =
      usable &&
      (() => {
        const ratio = Math.ceil(Math.sqrt(items.length)) / ivf.k;
        return ratio > 2 || ratio < 0.5;
      })();
    if (usable && !drifted) {
      index = {
        ...ivf,
        assignments: [
          ...ivf.assignments.filter((_, i) => keep[i]),
          ...delta.upserts.map((item) =>
            nearestCentroid(item.embedding, ivf.centroids),
          ),
        ],
      };
    } else {
      index = buildIvfIndex(items.map((item) => item.embedding));
      indexAction = "rebuilt";
    }
  } else if (usable) {
    const hnsw = bundle.index as HNSWIndex;
    const state = removeHnswNodes(hnsw, bundle.items, keep);
    addHnswNodes(state, delta.upserts, hnsw.M);
    index = { ...toHnswIndex(state, hnsw.M), efSearch: hnsw.efSearch };
  } else {
    index = buildHnswIndex(items.map((item) => item.embedding));
    indexAction = "rebuilt";
  }

  return {
    bundle: {
      ...bundle,
      // Clients keep a cached copy and refetch only when the version is newer.
      version: Math.max(Date.now(), bundle.version + 1),
      index,
      items,
    },
    indexAction,
    removed,
    added,
  };
}
