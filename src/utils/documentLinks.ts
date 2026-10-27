/**
 * Links between imported Questions/Words and the Document they came from
 * (the DocumentQuestion and DocumentWord join models).
 *
 * A link records where in the document the entry came from (`page`,
 * `sourceText`) and an `entryKey`, the normalized prompt or word, so a review
 * screen can tell which extracted entries are already in the bank. One
 * Question or Word can be linked to several documents.
 */
import { collectPages } from "./parsedContentChunks";

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
  page?: number | null;
  sourceText?: string | null;
  entryKey?: string | null;
  owner?: string | null;
  deletedAt?: string | null;
  _deleted?: boolean | null;
}

/** A link in the recycle bin (or deleted) no longer counts. */
function isLive(link: DocumentLink): boolean {
  return !link.deletedAt && link._deleted !== true;
}

/** Longest source snippet stored on a link. */
export const SOURCE_TEXT_LIMIT = 240;

function normalize(text: unknown): string {
  return typeof text === "string" ? text.trim().toLowerCase() : "";
}

/** Same normalization the importers use to find an existing question. */
export function questionEntryKey(prompt: unknown): string {
  return normalize(prompt);
}

/** Same normalization the importers use to find an existing word. */
export function wordEntryKey(word: unknown): string {
  return normalize(word);
}

export function entryKeyFor(kind: DocumentLinkKind, entry: Record<string, unknown>): string {
  return kind === "question" ? questionEntryKey(entry.prompt) : wordEntryKey(entry.word);
}

/** The per-link detail an extracted entry carries. */
export function linkDetails(
  kind: DocumentLinkKind,
  entry: Record<string, unknown> | null | undefined,
): { page?: number; sourceText?: string; entryKey: string } {
  const source = entry ?? {};
  const page = typeof source.page === "number" && Number.isFinite(source.page) ? source.page : undefined;
  const text = [source.sourceText, source.context].find(
    (value): value is string => typeof value === "string" && value.trim().length > 0,
  );
  return {
    ...(page !== undefined ? { page } : {}),
    ...(text ? { sourceText: text.trim().slice(0, SOURCE_TEXT_LIMIT) } : {}),
    entryKey: entryKeyFor(kind, source),
  };
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

/** The normalized keys of the entries a document has already imported. */
export function importedEntryKeys(links: ReadonlyArray<DocumentLink>): Set<string> {
  const keys = new Set<string>();
  for (const link of links) if (link.entryKey) keys.add(link.entryKey);
  return keys;
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
    entry?: Record<string, unknown> | null;
    existing?: Map<string, DocumentLink>;
  },
): Promise<DocumentLink | null> {
  const { itemId, documentId, owner, entry, existing } = params;
  if (!documentId) return null;
  const config = KIND[kind];

  const known = existing ?? indexLinksByItem(kind, await listDocumentLinks(client, documentId, kind));
  const found = known.get(itemId);
  if (found) return found;

  const result = await client.models[config.model].create({
    [config.itemField]: itemId,
    documentID: documentId,
    owner,
    ...linkDetails(kind, entry),
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
 * The documents a Question or Word was imported from. Pass the record when it
 * is already loaded, to skip fetching it again.
 */
export async function listItemSources(
  client: DataClient,
  kind: DocumentLinkKind,
  itemId: string,
  record?: Record<string, any> | null,
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

  const filenames = new Map<string, string | null>();
  const sources: ItemSource[] = [];
  for (const link of links.filter(isLive)) {
    if (!filenames.has(link.documentID)) {
      const { data } = await client.models.Document.get({ id: link.documentID });
      filenames.set(link.documentID, data?.filename ?? null);
    }
    sources.push({
      linkId: link.id,
      documentId: link.documentID,
      filename: filenames.get(link.documentID) ?? null,
      page: link.page ?? null,
      sourceText: link.sourceText ?? null,
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
