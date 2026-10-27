/**
 * Embedding items and storage format, shared by the embeddings Lambda and the
 * seed (which regenerates vectors locally for replayed analyses).
 *
 * The embedded text is a pure function of ParsedContent, so vectors never need
 * to be stored alongside a saved analysis.
 */

export const EMBEDDING_MODEL = "Xenova/all-MiniLM-L6-v2";
export const EMBEDDING_DIMENSIONS = 384;

const MAX_ITEM_TEXT = 8000;
const STORED_TEXT_PREVIEW = 200;

export interface EmbeddingItem {
  type: "vocabulary" | "summary";
  page: number;
  text: string;
  sourceId: string;
}

export interface EmbeddedItem extends EmbeddingItem {
  embedding: number[];
}

export interface EmbeddingFile {
  model: string;
  dimensions: number;
  generatedAt: number;
  wordCount: number;
  pages: Array<{ page: number; embedding: number[]; text: string }>;
}

/** Matches the schema's EmbeddingInfo custom type. */
export interface EmbeddingInfo {
  model: string;
  dimensions: number;
  version: number;
  wordCount: number;
  pageCount: number;
}

type Entry = Record<string, unknown>;

/** Lists arrive as arrays from typed GraphQL reads, or as JSON strings from older records. */
function asEntries(value: unknown): Entry[] {
  const list = typeof value === "string" ? safeParse(value) : value;
  return Array.isArray(list)
    ? list.filter(
        (item): item is Entry => item !== null && typeof item === "object",
      )
    : [];
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return [];
  }
}

const str = (value: unknown): string => (typeof value === "string" ? value : "");

/** The vocabulary entries and summaries of a ParsedContent record, as embeddable text. */
export function buildEmbeddingItems(parsed: {
  vocabularyJSON?: unknown;
  summariesJSON?: unknown;
}): EmbeddingItem[] {
  const items: EmbeddingItem[] = [];
  for (const entry of asEntries(parsed.vocabularyJSON)) {
    const word = str(entry.word);
    const context = str(entry.context);
    items.push({
      type: "vocabulary",
      page: typeof entry.page === "number" ? entry.page : 0,
      text: `${word} - ${str(entry.definition)}${context ? ` (${context})` : ""}`.substring(
        0,
        MAX_ITEM_TEXT,
      ),
      sourceId: word,
    });
  }
  for (const entry of asEntries(parsed.summariesJSON)) {
    items.push({
      type: "summary",
      page: typeof entry.page === "number" ? entry.page : 0,
      text: str(entry.content).substring(0, MAX_ITEM_TEXT),
      sourceId: str(entry.title),
    });
  }
  return items.filter((item) => item.text.trim().length > 0);
}

/** Embed each item; an item that fails is logged and skipped. */
export async function embedItems(
  items: EmbeddingItem[],
  embed: (text: string) => Promise<number[]>,
): Promise<EmbeddedItem[]> {
  const embedded: EmbeddedItem[] = [];
  for (const item of items) {
    try {
      embedded.push({ ...item, embedding: await embed(item.text) });
    } catch (error) {
      console.error(`[embeddingItems] Error embedding "${item.sourceId}":`, error);
    }
  }
  return embedded;
}

const wordCount = (items: EmbeddedItem[]): number =>
  items.reduce((sum, item) => sum + item.text.split(/\s+/).length, 0);

/** The JSON document stored in S3 for a file's embeddings. */
export function buildEmbeddingFile(
  items: EmbeddedItem[],
  generatedAt = Date.now(),
): EmbeddingFile {
  return {
    model: EMBEDDING_MODEL,
    dimensions: EMBEDDING_DIMENSIONS,
    generatedAt,
    wordCount: wordCount(items),
    pages: items.map((item) => ({
      page: item.page,
      embedding: item.embedding,
      text: item.text.substring(0, STORED_TEXT_PREVIEW),
    })),
  };
}

/** The metadata stored on File.embedding (no vectors). */
export function buildEmbeddingInfo(
  items: EmbeddedItem[],
  version = Date.now(),
): EmbeddingInfo {
  return {
    model: EMBEDDING_MODEL,
    dimensions: EMBEDDING_DIMENSIONS,
    version,
    wordCount: wordCount(items),
    pageCount: items.length,
  };
}

/** Storage key for a file's embeddings (owner-only `private/{identityId}/` area). */
export function embeddingObjectKey(identityId: string, fileId: string): string {
  return `private/${identityId}/embeddings/file/${fileId}.json`;
}
