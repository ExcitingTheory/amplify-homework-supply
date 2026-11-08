/**
 * Where an extracted question or word sits in its document, read from the
 * document's ParsedContent (found by the `questionID` / `wordID` the importer
 * stored on the entry) rather than stored on the DocumentQuestion /
 * DocumentWord link. Mirrors the entry-origin helpers in
 * src/utils/documentLinks.ts (no cross-boundary imports between amplify/ and
 * src/); test/unit/shared/entryOrigins.test.ts runs the same cases on both.
 */

export type EntryKind = "question" | "word";

/** Longest source snippet shown for an entry. */
export const SOURCE_TEXT_LIMIT = 240;

export interface EntryOrigin {
  page?: number;
  sourceText?: string;
}

/** Origins keyed by the id of the Question or Word the entry was imported as. */
export type EntryOrigins = Map<string, EntryOrigin>;

/**
 * Where each imported entry of a document's ParsedContent came from: its first
 * page and a short source snippet (the entry's source text, or a word's
 * context), keyed by its stored `questionID` / `wordID`. Entries not yet
 * imported have no id and are skipped.
 */
export function entryOriginsFrom(
  content: { questionsJSON?: unknown[]; vocabularyJSON?: unknown[] } | null | undefined,
  kind: EntryKind,
): EntryOrigins {
  const origins: EntryOrigins = new Map();
  const entries =
    (kind === "question" ? content?.questionsJSON : content?.vocabularyJSON) ?? [];
  for (const raw of entries) {
    if (raw === null || typeof raw !== "object") continue;
    const entry = raw as Record<string, unknown>;
    const id = kind === "question" ? entry.questionID : entry.wordID;
    if (typeof id !== "string" || !id || origins.has(id)) continue;
    const pages = Array.isArray(entry.pages)
      ? entry.pages.filter(
          (value): value is number =>
            typeof value === "number" && Number.isFinite(value),
        )
      : [];
    const text = [entry.sourceText, entry.context].find(
      (value): value is string =>
        typeof value === "string" && value.trim().length > 0,
    );
    origins.set(id, {
      ...(pages.length > 0 ? { page: Math.min(...pages) } : {}),
      ...(text ? { sourceText: text.trim().slice(0, SOURCE_TEXT_LIMIT) } : {}),
    });
  }
  return origins;
}
