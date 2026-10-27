/**
 * ParsedContent chunking.
 *
 * A long document's extracted content does not fit in one DynamoDB item, so it
 * is stored as several ParsedContent records ("chunks") per document, split by
 * page. Chunk 0 is the primary record: it also holds the small lists
 * (summaries, objectives, concepts, pending media). Vocabulary and questions
 * are packed across chunks in page order, keeping a page whole whenever it
 * fits.
 *
 * Chunk ids are derived from the document id, so saving the same document
 * again overwrites its chunks instead of adding new ones.
 *
 * Mirrors amplify/functions/shared/parsedContentChunks.ts down to the "Data
 * client" section (no cross-boundary imports between amplify/ and src/);
 * test/unit/parsedContentChunks.test.ts runs the same cases against both.
 */
import { toEntryList } from "./parsedContentLists";

/**
 * Serialized size each chunk is filled to. DynamoDB's item limit is 400 KB
 * and stores attribute names per entry, so JSON bytes understate the stored
 * size; 200 KB leaves a wide margin.
 */
export const PARSED_CONTENT_CHUNK_BUDGET_BYTES = 200 * 1024;

export const PARSED_CONTENT_LIST_FIELDS = [
  "vocabularyJSON",
  "summariesJSON",
  "objectivesJSON",
  "conceptsJSON",
  "questionsJSON",
  "pendingMediaJSON",
] as const;

export type ParsedContentListField = (typeof PARSED_CONTENT_LIST_FIELDS)[number];

/** Lists packed across chunks by page. The others always stay in chunk 0. */
const PAGED_LISTS = ["vocabularyJSON", "questionsJSON"] as const;
const PRIMARY_LISTS = [
  "summariesJSON",
  "objectivesJSON",
  "conceptsJSON",
  "pendingMediaJSON",
] as const;

export type ParsedContentLists = Record<ParsedContentListField, unknown[]>;

export interface ParsedContentChunk extends ParsedContentLists {
  chunkIndex: number;
  chunkCount: number;
}

const encoder = new TextEncoder();

/** Bytes an entry adds to a serialized list (its JSON plus a separator). */
function entryBytes(entry: unknown): number {
  return encoder.encode(JSON.stringify(entry) ?? "null").length + 1;
}

function emptyLists(): ParsedContentLists {
  return {
    vocabularyJSON: [],
    summariesJSON: [],
    objectivesJSON: [],
    conceptsJSON: [],
    questionsJSON: [],
    pendingMediaJSON: [],
  };
}

function pageOf(entry: unknown): number {
  const page =
    entry !== null && typeof entry === "object"
      ? (entry as Record<string, unknown>).page
      : undefined;
  // Entries without a page (direct imports) sort before every numbered page.
  return typeof page === "number" && Number.isInteger(page) ? page : 0;
}

interface PagedItem {
  field: (typeof PAGED_LISTS)[number];
  entry: unknown;
  bytes: number;
}

/**
 * Splits content into chunks of at most `budgetBytes` each, by page.
 *
 * - Pages are kept whole when they fit; a page too large for any chunk is
 *   split entry by entry.
 * - Entries are ordered by page, then by their original order.
 * - There is always at least one chunk.
 */
export function splitParsedContentByPage(
  content: Partial<Record<ParsedContentListField, unknown>>,
  budgetBytes: number = PARSED_CONTENT_CHUNK_BUDGET_BYTES,
): ParsedContentChunk[] {
  const lists = Object.fromEntries(
    PARSED_CONTENT_LIST_FIELDS.map((field) => [field, toEntryList(content[field])]),
  ) as ParsedContentLists;

  const first = emptyLists();
  let firstBytes = 0;
  for (const field of PRIMARY_LISTS) {
    first[field] = lists[field];
    firstBytes += lists[field].reduce<number>((sum, entry) => sum + entryBytes(entry), 0);
  }
  if (firstBytes > budgetBytes) {
    throw new Error(
      `Summaries, objectives, concepts and pending media take ${firstBytes} bytes; a chunk holds at most ${budgetBytes}`,
    );
  }

  const byPage = new Map<number, PagedItem[]>();
  for (const field of PAGED_LISTS) {
    for (const entry of lists[field]) {
      const page = pageOf(entry);
      const items = byPage.get(page) ?? [];
      items.push({ field, entry, bytes: entryBytes(entry) });
      byPage.set(page, items);
    }
  }

  const chunks = [{ lists: first, bytes: firstBytes }];
  let current = chunks[0];
  const open = () => {
    current = { lists: emptyLists(), bytes: 0 };
    chunks.push(current);
  };
  const add = (item: PagedItem) => {
    current.lists[item.field].push(item.entry);
    current.bytes += item.bytes;
  };

  for (const page of [...byPage.keys()].sort((a, b) => a - b)) {
    const items = byPage.get(page)!;
    // Keep each list's original order within the page.
    items.sort((a, b) => PAGED_LISTS.indexOf(a.field) - PAGED_LISTS.indexOf(b.field));
    const pageBytes = items.reduce((sum, item) => sum + item.bytes, 0);

    if (current.bytes + pageBytes <= budgetBytes) {
      items.forEach(add);
    } else if (pageBytes <= budgetBytes) {
      open();
      items.forEach(add);
    } else {
      // One page larger than a chunk: fill entry by entry.
      for (const item of items) {
        if (item.bytes > budgetBytes) {
          throw new Error(
            `A ${item.field} entry on page ${page} takes ${item.bytes} bytes; a chunk holds at most ${budgetBytes}`,
          );
        }
        if (current.bytes + item.bytes > budgetBytes) open();
        add(item);
      }
    }
  }

  return chunks.map((chunk, chunkIndex) => ({
    ...chunk.lists,
    chunkIndex,
    chunkCount: chunks.length,
  }));
}

export function parsedContentChunkId(documentId: string, chunkIndex: number): string {
  return `${documentId}-chunk-${chunkIndex}`;
}

// ---------------------------------------------------------------------------
// Merging
// ---------------------------------------------------------------------------

export interface ParsedContentChunkSummary {
  id: string;
  _version?: number | null;
  chunkIndex: number;
  vocabularyCount: number;
  questionCount: number;
}

type ChunkRecord = {
  id: string;
  _deleted?: boolean | null;
  chunkIndex?: number | null;
  [key: string]: unknown;
};

export type MergedParsedContent<T extends ChunkRecord = ChunkRecord> = T &
  ParsedContentLists & { chunks: ParsedContentChunkSummary[] };

/**
 * Combines a document's chunk records into one record shaped like the old
 * single record: chunk 0's fields, every list concatenated in chunk order,
 * and `chunks` describing where each entry lives. Returns null when there are
 * no live records.
 */
export function mergeParsedContentChunks<T extends ChunkRecord>(
  records: ReadonlyArray<T | null | undefined>,
): MergedParsedContent<T> | null {
  const live = records
    .filter((record): record is T => record != null && record._deleted !== true)
    .sort(
      (a, b) =>
        (a.chunkIndex ?? 0) - (b.chunkIndex ?? 0) || a.id.localeCompare(b.id),
    );
  if (live.length === 0) return null;

  const lists = emptyLists();
  const chunks: ParsedContentChunkSummary[] = [];
  live.forEach((record, position) => {
    for (const field of PARSED_CONTENT_LIST_FIELDS) {
      lists[field].push(...toEntryList(record[field]));
    }
    chunks.push({
      id: record.id,
      _version: record._version as number | null | undefined,
      chunkIndex: record.chunkIndex ?? position,
      vocabularyCount: toEntryList(record.vocabularyJSON).length,
      questionCount: toEntryList(record.questionsJSON).length,
    });
  });

  return { ...live[0], ...lists, chunks };
}

/** Finds the chunk holding the entry at `index` of the merged list. */
export function locateChunkEntry(
  merged: Pick<MergedParsedContent, "chunks">,
  list: "vocabularyJSON" | "questionsJSON",
  index: number,
): { chunk: ParsedContentChunkSummary; localIndex: number } | null {
  if (!Number.isInteger(index) || index < 0) return null;
  let offset = 0;
  for (const chunk of merged.chunks) {
    const count = list === "questionsJSON" ? chunk.questionCount : chunk.vocabularyCount;
    if (index < offset + count) return { chunk, localIndex: index - offset };
    offset += count;
  }
  return null;
}

/** Reads every page of a paginated list into one array. */
export async function collectPages<T>(
  fetchPage: (nextToken: string | undefined) => Promise<{
    data?: ReadonlyArray<T | null> | null;
    nextToken?: string | null;
  }>,
): Promise<T[]> {
  const all: T[] = [];
  const seen = new Set<string>();
  let nextToken: string | undefined;
  do {
    const page = await fetchPage(nextToken);
    for (const item of page.data ?? []) if (item != null) all.push(item);
    nextToken = page.nextToken ?? undefined;
    if (nextToken) {
      if (seen.has(nextToken)) throw new Error("Repeated pagination token");
      seen.add(nextToken);
    }
  } while (nextToken);
  return all;
}

// ---------------------------------------------------------------------------
// Saving
// ---------------------------------------------------------------------------

export interface StoredParsedContentChunk {
  id: string;
  _version?: number | null;
  [key: string]: unknown;
}

/** The storage a save runs against; see the GraphQL and data-client stores. */
export interface ParsedContentStore {
  /** Every chunk record that currently exists for the document. */
  list(): Promise<StoredParsedContentChunk[]>;
  create(input: Record<string, unknown>): Promise<void>;
  update(input: Record<string, unknown>): Promise<void>;
  remove(chunk: { id: string; _version?: number | null }): Promise<void>;
}

export interface SaveParsedContentChunksOptions {
  documentID: string;
  fileID?: string | null;
  content: Partial<Record<ParsedContentListField, unknown>>;
  /** Scalar fields written to every chunk (for example `modelUsed`). */
  fields?: Record<string, unknown>;
  budgetBytes?: number;
  /**
   * Skip chunks whose stored lists already match. Needs `store.list()` to
   * return the lists; used by edits so a one-entry change writes one chunk.
   */
  skipUnchanged?: boolean;
}

export interface SaveParsedContentChunksResult {
  chunkCount: number;
  created: number;
  updated: number;
  unchanged: number;
  removed: number;
}

/** Drops null and undefined so a server read compares equal to what was sent. */
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== null && item !== undefined)
        .map(([key, item]) => [key, canonical(item)]),
    );
  }
  return value;
}

function sameChunk(stored: StoredParsedContentChunk, chunk: ParsedContentChunk): boolean {
  if ((stored.chunkIndex ?? 0) !== chunk.chunkIndex) return false;
  if (stored.chunkCount !== chunk.chunkCount) return false;
  return PARSED_CONTENT_LIST_FIELDS.every(
    (field) =>
      JSON.stringify(canonical(toEntryList(stored[field]))) ===
      JSON.stringify(canonical(chunk[field])),
  );
}

/**
 * Writes a document's content as page chunks. Chunks are written (created or
 * overwritten) before any leftover chunk from an earlier, longer save is
 * removed, so a reader never sees the document empty.
 */
export async function saveParsedContentChunks(
  store: ParsedContentStore,
  options: SaveParsedContentChunksOptions,
): Promise<SaveParsedContentChunksResult> {
  const { documentID, fileID, content, fields = {}, budgetBytes, skipUnchanged } = options;
  const chunks = splitParsedContentByPage(content, budgetBytes);
  const stored = await store.list();
  const storedById = new Map(stored.map((record) => [record.id, record]));
  const result: SaveParsedContentChunksResult = {
    chunkCount: chunks.length,
    created: 0,
    updated: 0,
    unchanged: 0,
    removed: 0,
  };

  const written = new Set<string>();
  for (const chunk of chunks) {
    const id = parsedContentChunkId(documentID, chunk.chunkIndex);
    written.add(id);
    const existing = storedById.get(id);
    if (existing && skipUnchanged && sameChunk(existing, chunk)) {
      result.unchanged += 1;
      continue;
    }
    if (existing) {
      await store.update({ id, _version: existing._version, ...fields, ...chunk });
      result.updated += 1;
    } else {
      await store.create({
        id,
        documentID,
        ...(fileID ? { fileID } : {}),
        ...fields,
        ...chunk,
      });
      result.created += 1;
    }
  }

  for (const record of stored) {
    if (written.has(record.id)) continue;
    await store.remove({ id: record.id, _version: record._version });
    result.removed += 1;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Data client
// ---------------------------------------------------------------------------

type DataClient = { models: Record<string, any> };

function assertNoErrors(result: { errors?: ReadonlyArray<{ message?: string }> | null }, what: string) {
  if (result?.errors?.length) {
    throw new Error(`${what}: ${result.errors.map((error) => error.message).join("; ")}`);
  }
}

type Relational = { parsedContent?: unknown };

/** The record whose chunks to load: a document, or a file's document. */
export type ChunkParent =
  | { documentId: string; document?: Relational | null }
  | { fileId: string; file?: Relational | null };

/**
 * Every ParsedContent chunk of a document or file. Uses the parent's
 * `parsedContent` relationship, which is indexed, rather than a filtered scan
 * of the table. Pass the parent record if it is already loaded.
 */
export async function listParsedContentChunks(
  client: DataClient,
  parent: ChunkParent,
): Promise<StoredParsedContentChunk[]> {
  const byDocument = "documentId" in parent;
  const id = byDocument ? parent.documentId : parent.fileId;
  const preloaded = byDocument ? parent.document : parent.file;
  const record =
    preloaded ??
    (await client.models[byDocument ? "Document" : "File"].get({ id })).data;

  const relation = record?.parsedContent;
  if (typeof relation === "function") {
    return collectPages<StoredParsedContentChunk>(async (nextToken) => {
      const page = await relation({ limit: 100, nextToken });
      assertNoErrors(page, "Could not list ParsedContent");
      return page;
    });
  }
  if (Array.isArray(relation)) {
    return relation.filter((item): item is StoredParsedContentChunk => item != null);
  }
  // A client without relationship loaders (test doubles).
  return collectPages<StoredParsedContentChunk>(async (nextToken) => {
    const page = await client.models.ParsedContent.list({
      filter: { [byDocument ? "documentID" : "fileID"]: { eq: id } },
      nextToken,
    });
    assertNoErrors(page, "Could not list ParsedContent");
    return page;
  });
}

/**
 * One record for a document or file: its chunks merged (see
 * mergeParsedContentChunks). Pass the document id, the file id, or the id of
 * any chunk record.
 */
export async function loadMergedParsedContent(
  client: DataClient,
  target: { id?: string } & Partial<{ documentId: string; document: Relational | null; fileId: string; file: Relational | null }>,
): Promise<MergedParsedContent<StoredParsedContentChunk> | null> {
  let parent: ChunkParent | undefined;
  if (target.documentId) parent = { documentId: target.documentId, document: target.document };
  else if (target.fileId) parent = { fileId: target.fileId, file: target.file };
  else if (target.id) {
    const { data: record } = await client.models.ParsedContent.get({ id: target.id });
    if (record?.documentID) parent = { documentId: record.documentID };
  }
  if (!parent) return null;
  return mergeParsedContentChunks(await listParsedContentChunks(client, parent));
}

/** A store that reads and writes chunks through the data client. */
export function createParsedContentStore(
  client: DataClient,
  documentId: string,
): ParsedContentStore {
  const model = client.models.ParsedContent;
  return {
    list: () => listParsedContentChunks(client, { documentId }),
    create: async (input) => {
      assertNoErrors(await model.create(input), "Could not create ParsedContent");
    },
    update: async (input) => {
      assertNoErrors(await model.update(input), "Could not update ParsedContent");
    },
    remove: async ({ id, _version }) => {
      assertNoErrors(
        await model.delete(_version != null ? { id, _version } : { id }),
        "Could not delete ParsedContent",
      );
    },
  };
}

/**
 * Edits one entry of a merged list: finds the chunk that holds it and writes
 * only that chunk.
 */
export async function updateMergedListEntry(
  client: DataClient,
  merged: Pick<MergedParsedContent, "chunks">,
  list: "vocabularyJSON" | "questionsJSON",
  index: number,
  updates: Record<string, unknown>,
  pick: (entries: unknown[]) => unknown[],
): Promise<void> {
  const where = locateChunkEntry(merged, list, index);
  if (!where) throw new Error(`Invalid item index: ${index}`);
  const { data: chunk } = await client.models.ParsedContent.get({ id: where.chunk.id });
  if (!chunk) throw new Error(`ParsedContent not found: ${where.chunk.id}`);

  const entries = toEntryList<Record<string, unknown>>(chunk[list]);
  entries[where.localIndex] = { ...entries[where.localIndex], ...updates };
  assertNoErrors(
    await client.models.ParsedContent.update({
      id: chunk.id,
      _version: chunk._version,
      [list]: pick(entries),
    }),
    "Could not update ParsedContent",
  );
}
