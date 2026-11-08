/**
 * Matching extracted content against what the owner already has.
 *
 * A document's analysis produces vocabulary and questions that often already
 * exist in the owner's dictionary or question bank. Recording which existing
 * record each entry corresponds to lets the importer link to it instead of
 * creating a second copy.
 *
 * Terms and prompts are the only things that join an entry to an existing
 * record. Definitions and answers are never a join key: they are compared only
 * so an entry describing a different sense is left unmatched rather than
 * folded into a record that means something else.
 */
import {
  answersAreSimilar,
  answersConflict,
  DEFINITION_SIMILARITY,
  normaliseTerm,
} from "./analysis.js";

export interface ExistingWord {
  id: string;
  phrase?: string | null;
  definition?: string | null;
}

export interface ExistingQuestion {
  id: string;
  prompt?: string | null;
  answer?: string | null;
}

type Entry = Record<string, unknown>;

function text(entry: Entry, keys: string[]): string {
  for (const key of keys) {
    const value = entry[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return "";
}

function isEntry(value: unknown): value is Entry {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** Groups records by their normalised text; a text used twice keeps every record. */
function groupByText<T>(records: T[], textOf: (record: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const record of records) {
    const key = normaliseTerm(textOf(record));
    if (!key) continue;
    groups.set(key, [...(groups.get(key) ?? []), record]);
  }
  return groups;
}

export interface MatchOptions {
  /** Whether two definitions or answers mean the same although worded differently. */
  sameMeaning?: (left: string, right: string) => boolean;
}

/**
 * Whether an entry may be linked to an existing record. The texts agree when
 * either says nothing, when they read alike, or when they mean the same.
 * A text that contradicts the other — a different number, or a negation —
 * never agrees, however close the wording.
 */
function describesTheSame(
  left: string,
  right: string,
  { sameMeaning }: MatchOptions,
): boolean {
  if (!left || !right) return true;
  if (answersConflict(left, right)) return false;
  return answersAreSimilar(left, right) || (sameMeaning?.(left, right) ?? false);
}

/**
 * Records on each vocabulary entry the existing Word it refers to, as `wordID`.
 *
 * An entry matches a Word with the same term. When that Word defines the term
 * differently — a separate sense rather than a rewording — the entry is left
 * unmatched, so importing it cannot overwrite the existing definition.
 * Entries that already carry a `wordID` are left alone.
 */
export function linkExistingWords<T>(
  entries: T[],
  words: ExistingWord[],
  options: MatchOptions = {},
): { entries: T[]; linked: number } {
  const byPhrase = groupByText(words, (word) => word.phrase ?? "");
  let linked = 0;
  const result = entries.map((value) => {
    const entry = isEntry(value) ? value : undefined;
    if (!entry || text(entry, ["wordID"])) return value;
    const term = normaliseTerm(text(entry, ["word", "term"]));
    const candidates = byPhrase.get(term);
    if (!candidates) return value;

    const definition = text(entry, ["definition"]);
    const match = candidates.find((word) =>
      describesTheSame(definition, word.definition ?? "", options),
    );
    if (!match) return value;
    linked += 1;
    return { ...entry, wordID: match.id } as T;
  });
  return { entries: result, linked };
}

/**
 * Records on each question entry the existing Question it refers to, as
 * `questionID`.
 *
 * An entry matches a Question asking the same thing. When that Question
 * answers it differently — a different fact rather than a rewording — the
 * entry is left unmatched. Entries that already carry a `questionID` are left
 * alone.
 */
export function linkExistingQuestions<T>(
  entries: T[],
  questions: ExistingQuestion[],
  options: MatchOptions = {},
): { entries: T[]; linked: number } {
  const byPrompt = groupByText(questions, (question) => question.prompt ?? "");
  let linked = 0;
  const result = entries.map((value) => {
    const entry = isEntry(value) ? value : undefined;
    if (!entry || text(entry, ["questionID"])) return value;
    const candidates = byPrompt.get(normaliseTerm(text(entry, ["prompt"])));
    if (!candidates) return value;

    const answer = text(entry, ["answer"]);
    const match = candidates.find((question) =>
      describesTheSame(answer, question.answer ?? "", options),
    );
    if (!match) return value;
    linked += 1;
    return { ...entry, questionID: match.id } as T;
  });
  return { entries: result, linked };
}

/**
 * The texts worth comparing by meaning: those of entries whose term or prompt
 * exists already but whose wording differs, so only genuinely uncertain pairs
 * are embedded.
 */
export function textsNeedingMeaning(
  pairs: Array<{ entry: string; existing: string }>,
): string[] {
  const needed = new Set<string>();
  for (const { entry, existing } of pairs) {
    if (!entry || !existing) continue;
    if (answersConflict(entry, existing)) continue;
    if (answersAreSimilar(entry, existing)) continue;
    needed.add(entry);
    needed.add(existing);
  }
  return [...needed];
}

/** Pairs an entry's text with each existing record sharing its term or prompt. */
export function comparablePairs<T>(
  entries: T[],
  records: Array<{ text: string; compare: string }>,
  entryKey: (entry: Entry) => string,
  entryText: (entry: Entry) => string,
): Array<{ entry: string; existing: string }> {
  const byKey = groupByText(records, (record) => record.text);
  const pairs: Array<{ entry: string; existing: string }> = [];
  for (const value of entries) {
    if (!isEntry(value)) continue;
    const candidates = byKey.get(normaliseTerm(entryKey(value)));
    if (!candidates) continue;
    for (const candidate of candidates) {
      pairs.push({ entry: entryText(value), existing: candidate.compare });
    }
  }
  return pairs;
}

export { DEFINITION_SIMILARITY };
