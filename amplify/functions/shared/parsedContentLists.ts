/**
 * ParsedContent's JSON fields are typed GraphQL lists, so a query must select
 * each one's sub-fields (a bare `vocabularyJSON` is invalid) and results are
 * arrays. These fragments mirror the custom types in amplify/data/resource.ts;
 * test/unit/shared/parsedContentLists.test.ts checks them against it.
 */
export const VOCABULARY_SELECTION =
  "vocabularyJSON { word definition context page pages }";
export const SUMMARIES_SELECTION =
  "summariesJSON { title content pageRange }";
export const OBJECTIVES_SELECTION =
  "objectivesJSON { objective bloomLevel }";
export const CONCEPTS_SELECTION =
  "conceptsJSON { concept description relatedVocabulary }";
export const QUESTIONS_SELECTION =
  "questionsJSON { prompt answer hint questionType difficulty page pages subject field sourceText accept }";
export const PENDING_MEDIA_SELECTION =
  "pendingMediaJSON { filename mimeType s3Key size description approved }";

/** Scalar fields that describe a record's place among a document's chunks. */
export const PARSED_CONTENT_CHUNK_SELECTION = "chunkIndex chunkCount";

/** Every list field of a ParsedContent record. */
export const PARSED_CONTENT_LISTS_SELECTION = [
  VOCABULARY_SELECTION,
  SUMMARIES_SELECTION,
  OBJECTIVES_SELECTION,
  CONCEPTS_SELECTION,
  QUESTIONS_SELECTION,
  PENDING_MEDIA_SELECTION,
].join("\n      ");

/**
 * Read a ParsedContent list as an array of entries. Accepts the typed arrays
 * GraphQL returns and the JSON strings older records or callers may hold.
 */
export function toEntryList<T = Record<string, unknown>>(value: unknown): T[] {
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
