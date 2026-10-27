/**
 * ParsedContent's JSON fields are typed GraphQL lists: reads return arrays and
 * writes must send arrays of entries whose fields the schema declares.
 * Mirrors amplify/functions/shared/parsedContentLists.ts (no cross-boundary
 * imports between amplify/ and src/ in this repo); the field lists mirror the
 * custom types in amplify/data/resource.ts and are checked against it by
 * test/unit/parsedContentListsClient.test.ts.
 */

export const VOCABULARY_FIELDS = ["word", "definition", "context", "page", "pages"] as const;
export const SUMMARY_FIELDS = ["title", "content", "pageRange"] as const;
export const CONCEPT_FIELDS = ["concept", "description", "relatedVocabulary"] as const;
export const OBJECTIVE_FIELDS = ["objective", "bloomLevel"] as const;
export const PENDING_MEDIA_FIELDS = [
  "filename",
  "mimeType",
  "s3Key",
  "size",
  "description",
  "approved",
] as const;
export const QUESTION_FIELDS = [
  "prompt",
  "answer",
  "hint",
  "questionType",
  "difficulty",
  "page",
  "pages",
  "subject",
  "field",
  "sourceText",
  "accept",
] as const;

/**
 * Read a ParsedContent list as an array of entries. Accepts typed arrays and
 * the JSON strings older records or callers may hold.
 */
export function toEntryList<T = Record<string, any>>(value: unknown): T[] {
  let list: unknown = value;
  if (typeof value === "string") {
    try {
      list = JSON.parse(value);
    } catch {
      return [];
    }
  }
  return Array.isArray(list)
    ? (list.filter((item) => item !== null && item !== undefined) as T[])
    : [];
}

/**
 * Entries shaped for a ParsedContent write: only the declared fields, and no
 * null or undefined values left over from reads or UI state.
 */
export function pickEntries(
  value: unknown,
  fields: readonly string[],
): Array<Record<string, unknown>> {
  return toEntryList(value)
    .filter((entry) => typeof entry === "object")
    .map((entry) =>
      Object.fromEntries(
        fields
          .map((field) => [field, (entry as Record<string, unknown>)[field]] as const)
          .filter(([, fieldValue]) => fieldValue !== null && fieldValue !== undefined),
      ),
    );
}
