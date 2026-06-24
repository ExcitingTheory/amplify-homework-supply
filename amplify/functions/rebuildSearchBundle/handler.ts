import type { Handler } from "aws-lambda";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

const s3 = new S3Client({});
const BUCKET = process.env.AMPLIFY_STORAGE_BUCKET_NAME || "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

const EMBEDDING_DIMENSIONS = 512;
const EMBEDDING_MODEL = "text-embedding-3-small";
const IVF_THRESHOLD = 200;
const HNSW_THRESHOLD = 5000;

// --- Types ---

interface BundleItem {
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
  layers: number[][][];
  entryPoint: number;
  nodeLevels: number[];
}

interface SearchBundle {
  version: number;
  dimensions: number;
  model: string;
  index: IVFIndex | LinearIndex | HNSWIndex;
  items: BundleItem[];
}

interface LambdaEvent {
  source: "unit-publish" | "content-update" | "admin-reindex";
  identityId: string;
  unitId?: string;
  force?: boolean;
}

// --- K-Means IVF Implementation ---

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

function buildIndex(vectors: number[][]): SearchBundle["index"] {
  if (vectors.length <= IVF_THRESHOLD) {
    return { strategy: "linear" };
  }
  if (vectors.length >= HNSW_THRESHOLD) {
    return buildHnswIndex(vectors);
  }
  const k = Math.ceil(Math.sqrt(vectors.length));
  const nProbe = Math.max(2, Math.ceil(k * 0.1));
  const normalized = vectors.map(l2Normalize);
  const { centroids, assignments } = runKMeans(normalized, k);
  return { strategy: "ivf", k, nProbe, centroids, assignments };
}

// ─── HNSW Graph Builder ───────────────────────────────────────────────────────

/**
 * Build an HNSW (Hierarchical Navigable Small World) graph for ANN search.
 * Used for platform-wide bundles with >5000 items.
 *
 * Parameters:
 *   M = 16 (max connections per node per layer)
 *   efConstruction = 200 (beam width during build)
 *   mL = 1/ln(M) (level generation factor)
 */
function buildHnswIndex(
  vectors: number[][],
  M = 16,
  efConstruction = 200,
): HNSWIndex {
  const n = vectors.length;
  const mL = 1.0 / Math.log(M);
  const efSearch = 50;

  // Normalize all vectors
  const normalized = vectors.map(l2Normalize);

  // Assign random levels to each node
  const nodeLevels: number[] = [];
  let maxLevel = 0;
  for (let i = 0; i < n; i++) {
    const level = Math.floor(-Math.log(Math.random()) * mL);
    nodeLevels.push(level);
    if (level > maxLevel) maxLevel = level;
  }

  // Initialize layers: layers[level][nodeIndex] = neighbors
  const layers: number[][][] = [];
  for (let l = 0; l <= maxLevel; l++) {
    layers.push(Array.from({ length: n }, () => []));
  }

  let entryPoint = 0;
  let entryLevel = nodeLevels[0];

  // Insert nodes one by one
  for (let i = 1; i < n; i++) {
    const nodeLevel = nodeLevels[i];
    let currEntry = entryPoint;

    // Greedy descent from top to nodeLevel+1
    for (let level = entryLevel; level > nodeLevel; level--) {
      currEntry = greedyClosest(
        normalized[i],
        normalized,
        layers[level],
        currEntry,
      );
    }

    // Insert at each level from min(nodeLevel, entryLevel) down to 0
    const startLevel = Math.min(nodeLevel, entryLevel);
    let entryPoints = [currEntry];

    for (let level = startLevel; level >= 0; level--) {
      // Find efConstruction nearest neighbors at this level
      const nearest = searchLayerBuild(
        normalized[i],
        normalized,
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
          const scored = nNeighbors.map((idx) => ({
            idx,
            score: dotProduct(normalized[neighborIdx], normalized[idx]),
          }));
          scored.sort((a, b) => b.score - a.score);
          layers[level][neighborIdx] = scored.slice(0, M).map((s) => s.idx);
        }
      }

      // Entry points for next level down
      entryPoints = nearest.map((n) => n.idx);
    }

    // Update entry point if new node has higher level
    if (nodeLevel > entryLevel) {
      entryPoint = i;
      entryLevel = nodeLevel;
    }
  }

  return {
    strategy: "hnsw",
    M,
    efSearch,
    layers,
    entryPoint,
    nodeLevels,
  };
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

// --- S3 Helpers ---

async function readS3JSON(key: string): Promise<any | null> {
  try {
    const resp = await s3.send(
      new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    );
    const body = await resp.Body?.transformToString();
    return body ? JSON.parse(body) : null;
  } catch {
    return null;
  }
}

async function writeS3JSON(key: string, data: any): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: JSON.stringify(data),
      ContentType: "application/json",
    }),
  );
}

async function listS3Prefix(prefix: string): Promise<string[]> {
  const keys: string[] = [];
  let continuationToken: string | undefined;
  do {
    const resp = await s3.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }),
    );
    for (const obj of resp.Contents || []) {
      if (obj.Key) keys.push(obj.Key);
    }
    continuationToken = resp.NextContinuationToken;
  } while (continuationToken);
  return keys;
}

// --- Embedding Generation ---

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text,
      dimensions: EMBEDDING_DIMENSIONS,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `OpenAI API error: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();
  return data.data[0].embedding;
}

// --- Bundle Assembly ---

async function loadPerItemEmbeddings(
  identityId: string,
  unitId?: string,
): Promise<BundleItem[]> {
  const items: BundleItem[] = [];
  const prefix = `private/${identityId}/embeddings/`;

  // If unit-scoped, only load embeddings relevant to that unit
  const embeddingKeys = await listS3Prefix(prefix);

  for (const key of embeddingKeys) {
    const embeddingData = await readS3JSON(key);
    if (!embeddingData?.pages?.length) continue;

    // Parse type and ID from key: private/{id}/embeddings/{type}/{modelId}.json
    const parts = key.replace(prefix, "").split("/");
    if (parts.length < 2) continue;
    const type = parts[0] as BundleItem["type"];
    const modelId = parts[1].replace(".json", "");

    for (const page of embeddingData.pages) {
      items.push({
        id: page.page > 0 ? `${modelId}-p${page.page}` : modelId,
        type,
        title: embeddingData.title || modelId,
        embedding: page.embedding,
        meta: {
          page: page.page > 0 ? page.page : undefined,
          unitId,
          preview: page.text?.substring(0, 100),
        },
      });
    }
  }

  return items;
}

async function buildUnitBundle(
  identityId: string,
  unitId: string,
): Promise<SearchBundle> {
  // Read unit plain text and generate embedding if needed
  const plainTextKey = `protected/${identityId}/units/${unitId}/plain.txt`;
  const plainText = await readS3Text(plainTextKey);

  const items = await loadPerItemEmbeddings(identityId, unitId);

  // Add unit's own embedding if plain text exists
  if (plainText) {
    const unitEmbeddingKey = `private/${identityId}/embeddings/unit/${unitId}.json`;
    let unitEmbeddingData = await readS3JSON(unitEmbeddingKey);

    if (!unitEmbeddingData) {
      // Generate embedding for the unit
      const embedding = await generateEmbedding(plainText);
      unitEmbeddingData = {
        model: EMBEDDING_MODEL,
        dimensions: EMBEDDING_DIMENSIONS,
        generatedAt: Date.now(),
        wordCount: plainText.split(/\s+/).length,
        pages: [{ page: 0, embedding, text: plainText.substring(0, 200) }],
      };
      await writeS3JSON(unitEmbeddingKey, unitEmbeddingData);
    }

    items.push({
      id: unitId,
      type: "unit",
      title: `Unit ${unitId}`,
      embedding: unitEmbeddingData.pages[0].embedding,
      meta: { preview: plainText.substring(0, 100) },
    });
  }

  // Normalize all vectors before indexing
  const vectors = items.map((item) => l2Normalize(item.embedding));
  items.forEach((item, i) => {
    item.embedding = vectors[i];
  });

  const index = buildIndex(vectors);

  return {
    version: Date.now(),
    dimensions: EMBEDDING_DIMENSIONS,
    model: EMBEDDING_MODEL,
    index,
    items,
  };
}

async function buildInstructorBundle(
  identityId: string,
): Promise<SearchBundle> {
  const items = await loadPerItemEmbeddings(identityId);

  // Normalize all vectors before indexing
  const vectors = items.map((item) => l2Normalize(item.embedding));
  items.forEach((item, i) => {
    item.embedding = vectors[i];
  });

  const index = buildIndex(vectors);

  return {
    version: Date.now(),
    dimensions: EMBEDDING_DIMENSIONS,
    model: EMBEDDING_MODEL,
    index,
    items,
  };
}

async function readS3Text(key: string): Promise<string | null> {
  try {
    const resp = await s3.send(
      new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    );
    return (await resp.Body?.transformToString()) || null;
  } catch {
    return null;
  }
}

// --- Handler ---

export const handler: Handler<LambdaEvent> = async (event) => {
  const { source, identityId, unitId, force } = event;

  console.log(
    `[rebuildSearchBundle] source=${source} identityId=${identityId} unitId=${unitId || "all"} force=${force}`,
  );

  if (!BUCKET) throw new Error("AMPLIFY_STORAGE_BUCKET_NAME not set");
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not set");

  let itemsProcessed = 0;
  let bundleSize = 0;

  if (source === "unit-publish" && unitId) {
    // Rebuild single unit bundle
    const bundle = await buildUnitBundle(identityId, unitId);
    const bundleKey = `protected/${identityId}/search-index/unit/${unitId}.json`;
    await writeS3JSON(bundleKey, bundle);
    itemsProcessed = bundle.items.length;
    bundleSize = JSON.stringify(bundle).length;
    console.log(
      `[rebuildSearchBundle] Unit bundle written: ${bundleKey} (${bundle.items.length} items, ${bundle.index.strategy})`,
    );
  } else if (source === "admin-reindex" || source === "content-update") {
    // Rebuild instructor-wide bundle
    const bundle = await buildInstructorBundle(identityId);
    const bundleKey = `private/${identityId}/search-index/instructor.json`;
    await writeS3JSON(bundleKey, bundle);
    itemsProcessed = bundle.items.length;
    bundleSize = JSON.stringify(bundle).length;
    console.log(
      `[rebuildSearchBundle] Instructor bundle written: ${bundleKey} (${bundle.items.length} items, ${bundle.index.strategy})`,
    );

    // Also rebuild per-unit bundles if admin-reindex
    if (source === "admin-reindex") {
      const unitKeys = await listS3Prefix(
        `private/${identityId}/embeddings/unit/`,
      );
      for (const key of unitKeys) {
        const uid = key.split("/").pop()?.replace(".json", "");
        if (!uid) continue;
        const unitBundle = await buildUnitBundle(identityId, uid);
        const unitBundleKey = `protected/${identityId}/search-index/unit/${uid}.json`;
        await writeS3JSON(unitBundleKey, unitBundle);
        console.log(
          `[rebuildSearchBundle] Unit bundle: ${uid} (${unitBundle.items.length} items)`,
        );
      }

      // Build platform-wide admin search bundle (all instructors' content)
      try {
        const allInstructorPrefixes = await listS3Prefix(`private/`);
        const allItems: BundleItem[] = [...bundle.items]; // Start with current instructor's items

        // Collect embeddings from other instructors' bundles
        for (const prefix of allInstructorPrefixes) {
          const otherIdentityId = prefix
            .replace("private/", "")
            .replace("/", "");
          if (!otherIdentityId || otherIdentityId === identityId) continue;
          try {
            const otherBundleKey = `private/${otherIdentityId}/search-index/instructor.json`;
            const otherBundle = await readS3JSON(otherBundleKey);
            if (otherBundle?.items) {
              allItems.push(...otherBundle.items);
            }
          } catch {
            // Other instructor bundle may not exist — skip
          }
        }

        if (allItems.length > 0) {
          const vectors = allItems.map((item) => l2Normalize(item.embedding));
          allItems.forEach((item, i) => {
            item.embedding = vectors[i];
          });
          const platformIndex = buildIndex(vectors);
          const platformBundle: SearchBundle = {
            version: Date.now(),
            dimensions: EMBEDDING_DIMENSIONS,
            model: EMBEDDING_MODEL,
            index: platformIndex,
            items: allItems,
          };
          const platformBundleKey = `private/unit/search-index/platform.json`;
          await writeS3JSON(platformBundleKey, platformBundle);
          console.log(
            `[rebuildSearchBundle] Platform-wide admin bundle written: ${platformBundleKey} (${allItems.length} items, ${platformBundle.index.strategy})`,
          );
        }
      } catch (platformErr) {
        console.error(
          "[rebuildSearchBundle] Platform bundle generation failed:",
          platformErr,
        );
      }
    }
  }

  return {
    statusCode: 200,
    body: {
      source,
      identityId,
      itemsProcessed,
      bundleSize,
      strategy: itemsProcessed > IVF_THRESHOLD ? "ivf" : "linear",
    },
  };
};
