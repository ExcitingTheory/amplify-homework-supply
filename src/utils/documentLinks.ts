/**
 * Links between imported Questions/Words and the Document they came from
 * (the DocumentQuestion and DocumentWord join models).
 *
 * A link only ties a Question or Word to a Document; one Question or Word can
 * be linked to several documents. The importer records the other direction on
 * the document's ParsedContent: each imported entry carries the `questionID` /
 * `wordID` it became. That reference is how a link finds its entry (for the
 * page and source snippet) and how a review screen knows an entry is already
 * imported, so neither depends on the question or word text staying the same.
 */
import { collectPages, loadMergedParsedContent } from "./parsedContentChunks";

type DataClient = { models: Record<string, any> };

export type DocumentLinkKind = "question" | "word";

const KIND = {
  question: {
    model: "DocumentQuestion",
    itemModel: "Question",
    itemField: "questionID",
    documentRelation: "documentQuestions",
    itemRelation: "documentQuestions",
  },
  word: {
    model: "DocumentWord",
    itemModel: "Word",
    itemField: "wordID",
    documentRelation: "documentWords",
    itemRelation: "documentWords",
  },
} as const;

export interface DocumentLink {
  id: string;
  documentID: string;
  questionID?: string;
  wordID?: string;
  owner?: string | null;
  deletedAt?: string | null;
  _deleted?: boolean | null;
}

/** A link in the recycle bin (or deleted) no longer counts. */
function isLive(link: DocumentLink): boolean {
  return !link.deletedAt && link._deleted !== true;
}

/** Longest source snippet shown for an entry. */
export const SOURCE_TEXT_LIMIT = 240;

/** Where in its document an extracted entry came from. */
export interface EntryOrigin {
  page?: number;
  sourceText?: string;
}

/** Origins keyed by the id of the Question or Word the entry was imported as. */
export type EntryOrigins = Map<string, EntryOrigin>;

/**
 * Where each imported entry of a document's ParsedContent came from: its first
 * page and a short source snippet (the entry's source text, or a word's
 * context), keyed by the `questionID` / `wordID` the importer stored on it.
 * Entries not yet imported have no id and are skipped.
 */
export function entryOriginsFrom(
  content: { questionsJSON?: unknown[]; vocabularyJSON?: unknown[] } | null | undefined,
  kind: DocumentLinkKind,
): EntryOrigins {
  const origins: EntryOrigins = new Map();
  const entries = (kind === "question" ? content?.questionsJSON : content?.vocabularyJSON) ?? [];
  for (const raw of entries) {
    if (raw === null || typeof raw !== "object") continue;
    const entry = raw as Record<string, unknown>;
    const id = kind === "question" ? entry.questionID : entry.wordID;
    if (typeof id !== "string" || !id || origins.has(id)) continue;
    const pages = Array.isArray(entry.pages)
      ? entry.pages.filter((value): value is number => typeof value === "number" && Number.isFinite(value))
      : [];
    const text = [entry.sourceText, entry.context].find(
      (value): value is string => typeof value === "string" && value.trim().length > 0,
    );
    origins.set(id, {
      ...(pages.length > 0 ? { page: Math.min(...pages) } : {}),
      ...(text ? { sourceText: text.trim().slice(0, SOURCE_TEXT_LIMIT) } : {}),
    });
  }
  return origins;
}

/** Origins of a document's questions or words, read from its ParsedContent. */
export async function loadEntryOrigins(
  client: DataClient,
  documentId: string,
  kind: DocumentLinkKind,
): Promise<EntryOrigins> {
  const merged = await loadMergedParsedContent(client as any, { documentId });
  return entryOriginsFrom(merged, kind);
}

function assertNoErrors(result: { errors?: ReadonlyArray<{ message?: string }> | null }, what: string) {
  if (result?.errors?.length) {
    throw new Error(`${what}: ${result.errors.map((error) => error.message).join("; ")}`);
  }
}

/**
 * Every link of one kind for a document. Uses the document's relationship,
 * which is indexed, rather than a filtered scan of the table. Pass the
 * document if it is already loaded.
 */
export async function listDocumentLinks(
  client: DataClient,
  documentId: string,
  kind: DocumentLinkKind,
  document?: Record<string, any> | null,
): Promise<DocumentLink[]> {
  const config = KIND[kind];
  const record = document ?? (await client.models.Document.get({ id: documentId })).data;
  const relation = record?.[config.documentRelation];

  let links: DocumentLink[];
  if (typeof relation === "function") {
    links = await collectPages<DocumentLink>(async (nextToken) => {
      const page = await relation({ limit: 100, nextToken });
      assertNoErrors(page, `Could not list ${config.model}`);
      return page;
    });
  } else if (Array.isArray(relation)) {
    links = relation.filter((item): item is DocumentLink => item != null);
  } else {
    // A client without relationship loaders (test doubles).
    links = await collectPages<DocumentLink>(async (nextToken) => {
      const page = await client.models[config.model].list({
        filter: { documentID: { eq: documentId } },
        nextToken,
      });
      assertNoErrors(page, `Could not list ${config.model}`);
      return page;
    });
  }
  return links.filter(isLive);
}

/** Links keyed by the linked Question or Word id. */
export function indexLinksByItem(
  kind: DocumentLinkKind,
  links: ReadonlyArray<DocumentLink>,
): Map<string, DocumentLink> {
  const field = KIND[kind].itemField;
  const byItem = new Map<string, DocumentLink>();
  for (const link of links) {
    const itemId = link[field];
    if (itemId) byItem.set(itemId, link);
  }
  return byItem;
}

/**
 * The ids of the Questions or Words a document has already imported (its live
 * links). An extracted entry is imported when its `questionID` / `wordID` is
 * in this set.
 */
export async function listImportedItemIds(
  client: DataClient,
  documentId: string,
  kind: DocumentLinkKind,
): Promise<Set<string>> {
  const links = await listDocumentLinks(client, documentId, kind);
  return new Set(indexLinksByItem(kind, links).keys());
}

/**
 * Links an item to a document, once. Pass `existing` (from
 * indexLinksByItem) to avoid a lookup per item; it is updated when a link is
 * created.
 */
export async function linkItemToDocument(
  client: DataClient,
  kind: DocumentLinkKind,
  params: {
    itemId: string;
    documentId: string;
    owner: string;
    existing?: Map<string, DocumentLink>;
  },
): Promise<DocumentLink | null> {
  const { itemId, documentId, owner, existing } = params;
  if (!documentId) return null;
  const config = KIND[kind];

  const known = existing ?? indexLinksByItem(kind, await listDocumentLinks(client, documentId, kind));
  const found = known.get(itemId);
  if (found) return found;

  const result = await client.models[config.model].create({
    [config.itemField]: itemId,
    documentID: documentId,
    owner,
  });
  assertNoErrors(result, `Could not create ${config.model}`);
  const created = result.data as DocumentLink | null;
  if (created) known.set(itemId, created);
  return created;
}

export interface ItemSource {
  linkId: string;
  documentId: string;
  filename: string | null;
  page: number | null;
  sourceText: string | null;
}

/**
 * The documents a Question or Word was imported from, with the page and
 * snippet of the entry that became it in each document's ParsedContent (found
 * by the entry's stored `questionID` / `wordID`). Pass the record when it is
 * already loaded, and share `originsCache` across calls so each document's
 * ParsedContent is read once.
 */
export async function listItemSources(
  client: DataClient,
  kind: DocumentLinkKind,
  itemId: string,
  record?: Record<string, any> | null,
  options: { originsCache?: Map<string, Promise<EntryOrigins>> } = {},
): Promise<ItemSource[]> {
  const config = KIND[kind];
  const item = record ?? (await client.models[config.itemModel].get({ id: itemId })).data;
  const relation = item?.[config.itemRelation];

  let links: DocumentLink[];
  if (typeof relation === "function") {
    links = await collectPages<DocumentLink>(async (nextToken) => {
      const page = await relation({ limit: 100, nextToken });
      assertNoErrors(page, `Could not list ${config.model}`);
      return page;
    });
  } else if (Array.isArray(relation)) {
    links = relation.filter((link): link is DocumentLink => link != null);
  } else {
    links = await collectPages<DocumentLink>(async (nextToken) => {
      const page = await client.models[config.model].list({
        filter: { [config.itemField]: { eq: itemId } },
        nextToken,
      });
      assertNoErrors(page, `Could not list ${config.model}`);
      return page;
    });
  }

  const originsCache = options.originsCache ?? new Map<string, Promise<EntryOrigins>>();
  const originsOf = (documentId: string) => {
    const cacheKey = `${kind}:${documentId}`;
    let origins = originsCache.get(cacheKey);
    if (!origins) {
      origins = loadEntryOrigins(client, documentId, kind).catch((error) => {
        console.error("[documentLinks] Could not read the document's entries:", error);
        return new Map() as EntryOrigins;
      });
      originsCache.set(cacheKey, origins);
    }
    return origins;
  };

  const filenames = new Map<string, string | null>();
  const sources: ItemSource[] = [];
  for (const link of links.filter(isLive)) {
    if (!filenames.has(link.documentID)) {
      const { data } = await client.models.Document.get({ id: link.documentID });
      filenames.set(link.documentID, data?.filename ?? null);
    }
    const origin = (await originsOf(link.documentID)).get(itemId);
    sources.push({
      linkId: link.id,
      documentId: link.documentID,
      filename: filenames.get(link.documentID) ?? null,
      page: origin?.page ?? null,
      sourceText: origin?.sourceText ?? null,
    });
  }
  return sources;
}

/** How much imported content points back at a document. */
export interface DocumentLinkSummary {
  questions: number;
  words: number;
}

export async function summarizeDocumentLinks(
  client: DataClient,
  documentId: string,
): Promise<DocumentLinkSummary> {
  const document = (await client.models.Document.get({ id: documentId })).data;
  const [questions, words] = await Promise.all([
    listDocumentLinks(client, documentId, "question", document),
    listDocumentLinks(client, documentId, "word", document),
  ]);
  return { questions: questions.length, words: words.length };
}

/** True when any source is one of the given documents. */
export function inDocumentScope(
  sources: ReadonlyArray<ItemSource> | undefined,
  documentIds: ReadonlySet<string>,
): boolean {
  return !!sources?.some((source) => documentIds.has(source.documentId));
}

/** A short " [source: file, p.3]" note for prompts; empty when there is none. */
export function describeItemSources(sources: ReadonlyArray<ItemSource> | undefined): string {
  if (!sources || sources.length === 0) return "";
  const parts = sources.slice(0, 2).map((source) => {
    const name = source.filename ?? "document";
    return source.page != null ? `${name}, p.${source.page}` : name;
  });
  return ` [source: ${parts.join("; ")}]`;
}

/** The reference a drill block shows: the first source with a file and a page. */
export function documentRefFrom(
  sources: ReadonlyArray<ItemSource> | undefined,
): { filename: string; page: number } | undefined {
  const source = sources?.find((candidate) => candidate.filename && candidate.page != null);
  return source ? { filename: source.filename as string, page: source.page as number } : undefined;
}
