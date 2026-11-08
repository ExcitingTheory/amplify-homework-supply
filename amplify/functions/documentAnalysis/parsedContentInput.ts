import { normaliseQuestionEntries } from "./analysis.js";

/**
 * ParsedContent's JSON fields are typed GraphQL lists (e.g. [QuestionEntryInput]),
 * not JSON strings, and AppSync rejects any field an input type does not
 * declare. These allow-lists mirror the custom types in amplify/data/resource.ts.
 */
type Entry = Record<string, unknown>;

const isEntry = (value: unknown): value is Entry =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const isInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value);

const text = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

const integerList = (value: unknown): number[] | undefined =>
  Array.isArray(value) && value.every(isInteger) ? value : undefined;

/**
 * Entries persist only `pages`. Extraction output for a single page carries a lone
 * `page`, which becomes a one-item list; the first page is then `pages[0]`.
 */
const pageList = (entry: Entry): number[] | undefined => {
  const pages = integerList(entry.pages);
  if (pages && pages.length > 0) return pages;
  return isInteger(entry.page) ? [entry.page] : pages;
};

const stringList = (value: unknown): string[] | undefined =>
  Array.isArray(value) && value.every((item) => typeof item === "string")
    ? value
    : undefined;

const defined = <T extends Entry>(entry: T): T =>
  Object.fromEntries(
    Object.entries(entry).filter(([, value]) => value !== undefined),
  ) as T;

export interface ParsedContentSource {
  vocabularyJSON?: unknown[];
  summariesJSON?: unknown[];
  objectivesJSON?: unknown[];
  conceptsJSON?: unknown[];
  questionsJSON?: unknown[];
  pendingMedia?: unknown[];
}

export interface ParsedContentListInput {
  vocabularyJSON: Entry[];
  summariesJSON: Entry[];
  objectivesJSON: Entry[];
  conceptsJSON: Entry[];
  questionsJSON: Entry[];
  pendingMediaJSON?: Entry[];
}

function vocabularyEntry(value: unknown): Entry | undefined {
  if (!isEntry(value)) return undefined;
  const word = text(value.word) ?? text(value.term);
  if (!word) return undefined;
  const occurrences = Array.isArray(value.occurrences)
    ? value.occurrences.flatMap((item) => {
        if (!isEntry(item)) return [];
        const occurrence = defined({
          definition: text(item.definition),
          contexts: stringList(item.contexts),
          pages: integerList(item.pages),
        });
        return Object.keys(occurrence).length > 0 ? [occurrence] : [];
      })
    : [];
  const editSource = isEntry(value.edited) ? value.edited : undefined;
  const edited = editSource
    ? defined({
        word: text(editSource.word),
        definition: text(editSource.definition),
        context: text(editSource.context),
      })
    : undefined;
  return defined({
    word,
    definition: text(value.definition),
    context: text(value.context),
    pages: pageList(value),
    wordID: text(value.wordID),
    occurrences: occurrences.length > 0 ? occurrences : undefined,
    edited: edited && Object.keys(edited).length > 0 ? edited : undefined,
  });
}

function summaryEntry(value: unknown): Entry | undefined {
  if (!isEntry(value)) return undefined;
  const title = text(value.title);
  if (!title) return undefined;
  return defined({
    title,
    content: text(value.content),
    pageRange: text(value.pageRange),
  });
}

function objectiveEntry(value: unknown): Entry | undefined {
  if (typeof value === "string" && value.trim()) return { objective: value };
  if (!isEntry(value)) return undefined;
  const objective = text(value.objective);
  if (!objective) return undefined;
  return defined({ objective, bloomLevel: text(value.bloomLevel) });
}

function conceptEntry(value: unknown): Entry | undefined {
  if (!isEntry(value)) return undefined;
  const concept = text(value.concept);
  if (!concept) return undefined;
  return defined({
    concept,
    description: text(value.description),
    relatedVocabulary: stringList(value.relatedVocabulary),
  });
}

function questionEntry(value: Entry): Entry {
  return defined({
    prompt: text(value.prompt),
    answer: text(value.answer),
    hint: text(value.hint),
    questionType: text(value.questionType),
    difficulty: text(value.difficulty),
    pages: pageList(value),
    questionID: text(value.questionID),
    subject: text(value.subject),
    field: text(value.field),
    sourceText: text(value.sourceText),
    accept: stringList(value.accept),
  });
}

function pendingMediaEntry(value: unknown): Entry | undefined {
  if (!isEntry(value)) return undefined;
  const { filename, mimeType, s3Key } = value;
  if (
    typeof filename !== "string" ||
    typeof mimeType !== "string" ||
    typeof s3Key !== "string" ||
    !isInteger(value.size)
  ) {
    return undefined;
  }
  return defined({
    filename,
    mimeType,
    s3Key,
    size: value.size,
    description: text(value.description),
    approved: typeof value.approved === "boolean" ? value.approved : undefined,
  });
}

function mapEntries(
  values: unknown[] | undefined,
  convert: (value: unknown) => Entry | undefined,
  label: string,
): Entry[] {
  const kept: Entry[] = [];
  let dropped = 0;
  for (const value of values ?? []) {
    const entry = convert(value);
    if (entry) kept.push(entry);
    else dropped += 1;
  }
  if (dropped > 0) {
    console.warn(
      `[parsedContentInput] Dropped ${dropped} ${label} entr${dropped === 1 ? "y" : "ies"} missing a required field`,
    );
  }
  return kept;
}

/** Shape extracted content for the ParsedContent create/update mutations. */
export function toParsedContentInput(
  content: ParsedContentSource,
): ParsedContentListInput {
  const pendingMedia = mapEntries(
    content.pendingMedia,
    pendingMediaEntry,
    "pending media",
  );
  return {
    vocabularyJSON: mapEntries(
      content.vocabularyJSON,
      vocabularyEntry,
      "vocabulary",
    ),
    summariesJSON: mapEntries(content.summariesJSON, summaryEntry, "summary"),
    objectivesJSON: mapEntries(
      content.objectivesJSON,
      objectiveEntry,
      "objective",
    ),
    conceptsJSON: mapEntries(content.conceptsJSON, conceptEntry, "concept"),
    questionsJSON: normaliseQuestionEntries(content.questionsJSON ?? []).map(
      questionEntry,
    ),
    ...(pendingMedia.length > 0 ? { pendingMediaJSON: pendingMedia } : {}),
  };
}
