/**
 * OfflineSearchTools — Local semantic search for offline chat.
 *
 * When online, the chat uses server-side embeddings + S3 bundles.
 * Offline, this module provides equivalent functionality using:
 * 1. Local embedding model (all-MiniLM-L6-v2 via @huggingface/transformers)
 * 2. Pre-cached re-indexed bundles in IndexedDB (384-dim local embeddings)
 * 3. TF-IDF text fallback if embedding model isn't loaded yet
 * 4. Direct vocabulary/question lookup from cached data
 *
 * Designed to be called by the ReAct loop in OfflineChatEngine.
 */

import {
  getCachedUnit,
  getRecordsByIndex,
  type CachedWord,
  type CachedQuestion,
} from "./OfflineDataStore";
import { embed, isModelReady, cosineSimilarity } from "./LocalEmbeddingModel";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LocalSearchResult {
  id: string;
  type: "unit" | "word" | "question" | "file" | "content";
  title: string;
  preview: string;
  score: number;
}

export interface OfflineToolResult {
  tool: string;
  results: string;
}

// ── Search Bundle Access ──────────────────────────────────────────────────────

const BUNDLE_DB_NAME = "search-bundles";
const BUNDLE_STORE = "bundles";
const LOCAL_BUNDLE_STORE = "local-bundles"; // Re-indexed with local embeddings

interface BundleItem {
  id: string;
  type: string;
  title: string;
  embedding: number[];
  meta: { preview?: string; unitId?: string; page?: number };
}

interface SearchBundle {
  version: number;
  dimensions: number;
  model: string;
  items: BundleItem[];
}

/** Bundle re-indexed with local embedding model (384 dims) */
interface LocalBundle {
  version: number;
  dimensions: number;
  model: string;
  items: Array<{
    id: string;
    type: string;
    title: string;
    embedding: number[];
    preview: string;
  }>;
  reindexedAt: number;
}

async function getCachedBundle(unitId: string): Promise<SearchBundle | null> {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(BUNDLE_DB_NAME, 1);
      request.onerror = () => resolve(null);
      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(BUNDLE_STORE)) {
          resolve(null);
          return;
        }
        const tx = db.transaction(BUNDLE_STORE, "readonly");
        const store = tx.objectStore(BUNDLE_STORE);
        const req = store.get(`unit:${unitId}`);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      };
    } catch {
      resolve(null);
    }
  });
}

/**
 * Get the locally re-indexed bundle (384-dim embeddings from all-MiniLM-L6-v2).
 */
async function getLocalBundle(unitId: string): Promise<LocalBundle | null> {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(BUNDLE_DB_NAME, 2);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(LOCAL_BUNDLE_STORE)) {
          db.createObjectStore(LOCAL_BUNDLE_STORE);
        }
      };
      request.onerror = () => resolve(null);
      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(LOCAL_BUNDLE_STORE)) {
          resolve(null);
          return;
        }
        const tx = db.transaction(LOCAL_BUNDLE_STORE, "readonly");
        const store = tx.objectStore(LOCAL_BUNDLE_STORE);
        const req = store.get(`local:${unitId}`);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      };
    } catch {
      resolve(null);
    }
  });
}

/**
 * Save a locally re-indexed bundle to IndexedDB.
 */
async function saveLocalBundle(
  unitId: string,
  bundle: LocalBundle,
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(BUNDLE_DB_NAME, 2);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(LOCAL_BUNDLE_STORE)) {
          db.createObjectStore(LOCAL_BUNDLE_STORE);
        }
      };
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction(LOCAL_BUNDLE_STORE, "readwrite");
        const store = tx.objectStore(LOCAL_BUNDLE_STORE);
        store.put(bundle, `local:${unitId}`);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Re-index a unit's search bundle using the local embedding model.
 * Called during prefetch to pre-compute all local embeddings.
 * Returns the local bundle for immediate use.
 */
export async function reindexBundleLocally(
  unitId: string,
  onProgress?: (done: number, total: number) => void,
): Promise<LocalBundle | null> {
  const { embedBatch, getModelDimensions, getModelId, loadModel } =
    await import("./LocalEmbeddingModel");

  // Ensure model is loaded
  await loadModel();

  // Gather all searchable content for this unit
  const texts: Array<{
    id: string;
    type: string;
    title: string;
    text: string;
    preview: string;
  }> = [];

  // From the existing S3 bundle
  const s3Bundle = await getCachedBundle(unitId);
  if (s3Bundle?.items) {
    for (const item of s3Bundle.items) {
      texts.push({
        id: item.id,
        type: item.type,
        title: item.title,
        text: `${item.title} ${item.meta?.preview || ""}`,
        preview: item.meta?.preview || "",
      });
    }
  }

  // From cached words
  try {
    const words = await getRecordsByIndex<CachedWord>(
      "words",
      "unitId",
      unitId,
    );
    for (const w of words) {
      // Avoid duplicates if already in bundle
      if (texts.some((t) => t.id === w.id)) continue;
      texts.push({
        id: w.id,
        type: "word",
        title: w.phrase,
        text: `${w.phrase} ${w.definition}`,
        preview: w.definition,
      });
    }
  } catch {
    // Continue without words
  }

  // From cached questions
  try {
    const questions = await getRecordsByIndex<CachedQuestion>(
      "questions",
      "unitId",
      unitId,
    );
    for (const q of questions) {
      if (texts.some((t) => t.id === q.id)) continue;
      texts.push({
        id: q.id,
        type: "question",
        title: q.prompt,
        text: `${q.prompt} ${q.answer}`,
        preview: q.answer,
      });
    }
  } catch {
    // Continue without questions
  }

  if (texts.length === 0) return null;

  // Batch embed all texts
  const embeddings = await embedBatch(texts.map((t) => t.text));
  onProgress?.(texts.length, texts.length);

  const localBundle: LocalBundle = {
    version: s3Bundle?.version || Date.now(),
    dimensions: getModelDimensions(),
    model: getModelId(),
    items: texts.map((t, i) => ({
      id: t.id,
      type: t.type,
      title: t.title,
      embedding: embeddings[i].embedding,
      preview: t.preview,
    })),
    reindexedAt: Date.now(),
  };

  // Persist to IndexedDB
  await saveLocalBundle(unitId, localBundle);

  return localBundle;
}

// ── TF-IDF Text Search (no embeddings needed) ────────────────────────────────

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "can",
  "shall",
  "to",
  "of",
  "in",
  "for",
  "on",
  "with",
  "at",
  "by",
  "from",
  "as",
  "into",
  "through",
  "during",
  "before",
  "after",
  "above",
  "below",
  "between",
  "out",
  "off",
  "over",
  "under",
  "again",
  "further",
  "then",
  "once",
  "and",
  "but",
  "or",
  "nor",
  "not",
  "so",
  "very",
  "just",
  "than",
  "too",
  "also",
  "that",
  "this",
  "what",
  "which",
  "who",
  "how",
  "when",
  "where",
  "why",
]);

function removeStopWords(tokens: string[]): string[] {
  return tokens.filter((t) => !STOP_WORDS.has(t));
}

/**
 * Compute TF-IDF similarity between query and a document.
 * Uses term frequency in document weighted by inverse document frequency
 * across the corpus of bundle items.
 */
function textSimilarity(queryTokens: string[], docText: string): number {
  if (!queryTokens.length || !docText) return 0;

  const docTokens = removeStopWords(tokenize(docText));
  if (!docTokens.length) return 0;

  const docSet = new Set(docTokens);
  let hits = 0;
  for (const qt of queryTokens) {
    if (docSet.has(qt)) hits++;
    // Also check partial matches (prefix matching for vocabulary)
    else if (docTokens.some((dt) => dt.startsWith(qt) || qt.startsWith(dt))) {
      hits += 0.5;
    }
  }

  // Normalized by query length
  return hits / queryTokens.length;
}

// ── Tool Implementations ──────────────────────────────────────────────────────

/**
 * Semantic search using the local embedding model + cached bundle.
 *
 * Strategy:
 * 1. If the local model is ready, embed the query and use the existing
 *    `search()` function from searchBundles.ts (handles IVF/linear/HNSW).
 * 2. If the model isn't loaded yet, fall back to TF-IDF text similarity.
 *
 * The bundle in IndexedDB already has the IVF centroids + assignments
 * pre-computed by the Lambda — we just need the query vector.
 */
export async function offlineSemanticSearch(
  query: string,
  unitId: string,
  topK = 5,
): Promise<LocalSearchResult[]> {
  // Try embedding-based search first (uses IVF/linear from cached bundle)
  const bundle = await getCachedBundle(unitId);
  if (bundle?.items?.length && isModelReady()) {
    try {
      const { embedding } = await embed(query);
      // Import the search function that handles IVF/linear routing
      const { search } = await import("../utils/searchBundles");
      const searchResults = search(embedding, bundle as any, topK, 0.2);

      if (searchResults.length > 0) {
        return searchResults.map((r) => ({
          id: r.item.id,
          type: r.item.type as LocalSearchResult["type"],
          title: r.item.title,
          preview: r.item.meta?.preview || "",
          score: r.score,
        }));
      }
    } catch {
      // Model inference failed — fall through to TF-IDF
    }
  }

  // Fallback: TF-IDF text matching (model not loaded or no bundle)
  const queryTokens = removeStopWords(tokenize(query));
  if (!queryTokens.length) return [];

  const results: LocalSearchResult[] = [];

  // Search bundle items by text
  if (bundle?.items) {
    for (const item of bundle.items) {
      const searchText = `${item.title} ${item.meta?.preview || ""}`;
      const score = textSimilarity(queryTokens, searchText);
      if (score > 0.1) {
        results.push({
          id: item.id,
          type: item.type as LocalSearchResult["type"],
          title: item.title,
          preview: item.meta?.preview || "",
          score,
        });
      }
    }
  }

  // Also search cached words and questions directly
  try {
    const words = await getRecordsByIndex<CachedWord>(
      "words",
      "unitId",
      unitId,
    );
    for (const word of words) {
      const searchText = `${word.phrase} ${word.definition}`;
      const score = textSimilarity(queryTokens, searchText);
      if (score > 0.15) {
        results.push({
          id: word.id,
          type: "word",
          title: word.phrase,
          preview: word.definition,
          score: score + 0.05,
        });
      }
    }

    const questions = await getRecordsByIndex<CachedQuestion>(
      "questions",
      "unitId",
      unitId,
    );
    for (const q of questions) {
      const searchText = `${q.prompt} ${q.answer}`;
      const score = textSimilarity(queryTokens, searchText);
      if (score > 0.15) {
        results.push({
          id: q.id,
          type: "question",
          title: q.prompt,
          preview: q.answer,
          score,
        });
      }
    }
  } catch {
    // IndexedDB access failed — continue with bundle results only
  }

  // Deduplicate by ID, keeping highest score
  const seen = new Map<string, LocalSearchResult>();
  for (const r of results) {
    const existing = seen.get(r.id);
    if (!existing || r.score > existing.score) {
      seen.set(r.id, r);
    }
  }

  return Array.from(seen.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/**
 * Look up vocabulary by phrase or keyword.
 * Mimics the online context-aware vocabulary lookup.
 */
export async function offlineVocabLookup(
  query: string,
  unitId: string,
): Promise<CachedWord[]> {
  const queryLower = query.toLowerCase();
  try {
    const words = await getRecordsByIndex<CachedWord>(
      "words",
      "unitId",
      unitId,
    );
    return words.filter(
      (w) =>
        w.phrase.toLowerCase().includes(queryLower) ||
        w.definition.toLowerCase().includes(queryLower),
    );
  } catch {
    return [];
  }
}

/**
 * Get student progress from cached grade data.
 */
export async function offlineGetProgress(unitId: string): Promise<{
  complete: boolean;
  percentComplete: number;
  accuracy: number;
} | null> {
  try {
    const grades = await getRecordsByIndex("grades", "unitId", unitId);
    if (grades.length === 0) return null;
    // Return the most recent grade
    const latest = grades.sort(
      (a: any, b: any) => (b.savedAt || 0) - (a.savedAt || 0),
    )[0] as any;
    return {
      complete: latest.complete || false,
      percentComplete: latest.percentComplete || 0,
      accuracy: latest.accuracy || 0,
    };
  } catch {
    return null;
  }
}

/**
 * Get unit content summary from cached data.
 */
export async function offlineGetContent(
  unitId: string,
): Promise<string | null> {
  const unit = await getCachedUnit(unitId);
  return unit?.data || null;
}

// ── ReAct Tool Registry ───────────────────────────────────────────────────────

export const OFFLINE_TOOL_DESCRIPTIONS = `
Available tools (use XML tags to call them):
<tool name="semantic_search">Search unit content by topic or keyword. Args: query (string)</tool>
<tool name="vocab_lookup">Look up a vocabulary word. Args: word (string)</tool>
<tool name="get_progress">Check student's current grade progress. No args needed.</tool>
<tool name="get_content">Get the unit's lesson content. No args needed.</tool>
`;

/**
 * Execute an offline tool by name with given arguments.
 */
export async function executeOfflineTool(
  toolName: string,
  args: string,
  unitId: string,
): Promise<OfflineToolResult> {
  switch (toolName) {
    case "semantic_search": {
      const results = await offlineSemanticSearch(args, unitId);
      if (results.length === 0) {
        return { tool: toolName, results: "No results found." };
      }
      const formatted = results
        .map((r, i) => `${i + 1}. [${r.type}] ${r.title}: ${r.preview}`)
        .join("\n");
      return { tool: toolName, results: formatted };
    }

    case "vocab_lookup": {
      const words = await offlineVocabLookup(args, unitId);
      if (words.length === 0) {
        return {
          tool: toolName,
          results: `No vocabulary found matching "${args}".`,
        };
      }
      const formatted = words
        .map(
          (w) =>
            `**${w.phrase}**${w.pronunciation ? ` (${w.pronunciation})` : ""}: ${w.definition}`,
        )
        .join("\n");
      return { tool: toolName, results: formatted };
    }

    case "get_progress": {
      const progress = await offlineGetProgress(unitId);
      if (!progress) {
        return { tool: toolName, results: "No grade data available offline." };
      }
      return {
        tool: toolName,
        results: `Status: ${progress.complete ? "Completed" : "In Progress"}\nProgress: ${Math.round(progress.percentComplete)}%\nAccuracy: ${Math.round(progress.accuracy)}%`,
      };
    }

    case "get_content": {
      const content = await offlineGetContent(unitId);
      if (!content) {
        return {
          tool: toolName,
          results: "Unit content not available offline.",
        };
      }
      // Truncate to reasonable size for context injection
      const truncated =
        content.length > 2000 ? content.slice(0, 2000) + "..." : content;
      return { tool: toolName, results: truncated };
    }

    default:
      return { tool: toolName, results: `Unknown tool: ${toolName}` };
  }
}

// ── Pre-search Augmentation ───────────────────────────────────────────────────

/**
 * Automatically search for relevant content based on the user's message
 * and inject it into the context before sending to the model.
 * This is the "simulated tools" approach — no model cooperation needed.
 */
export async function augmentContextWithSearch(
  userMessage: string,
  unitId: string,
): Promise<string> {
  const results = await offlineSemanticSearch(userMessage, unitId, 3);
  if (results.length === 0) return "";

  let augmentation =
    "\n\n## Relevant Content (auto-retrieved from course material)\n";
  for (const r of results) {
    augmentation += `- [${r.type}] **${r.title}**: ${r.preview}\n`;
  }
  return augmentation;
}
