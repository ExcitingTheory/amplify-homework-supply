/**
 * Review warnings, attached to the entries they are about.
 *
 * A document's analysis records why it kept an entry for human review. Each
 * message that names an entry is matched to it, so the warning can be shown on
 * that entry rather than in a wall of text above the list. Messages about the
 * document as a whole are kept separately.
 */
import { normaliseTerm } from "./termNormalisation";

export type ReviewWarningKind = "question" | "vocabulary";

/** `Page 3: question "The Magus" (path): reason; another reason` */
const ENTRY_WARNING = /^(?:Page\s+(\d+):\s*)?(question|vocabulary)\s+"(.+?)"\s*\((.*?)\):\s*(.+)$/i;

export interface EntryReviewWarnings {
  /** Warnings for each entry, keyed by `warningKey`. */
  byEntry: Map<string, string[]>;
  /** Warnings that name no entry, such as missing source coverage. */
  document: string[];
  /** Entries named by at least one warning. */
  flaggedCount: number;
}

/** The key an entry's warnings are stored under. */
export function warningKey(kind: ReviewWarningKind, subject: string, field = ""): string {
  return [kind, normaliseTerm(subject), normaliseTerm(field)].join("\u0000");
}

function toStringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

/**
 * Reads `Document.metadata.analysis.reviewWarnings`, which may arrive as an
 * object or as the JSON string the data client stores.
 */
export function readReviewWarnings(metadata: unknown): string[] {
  let parsed = metadata;
  if (typeof metadata === "string" && metadata) {
    try {
      parsed = JSON.parse(metadata);
    } catch {
      return [];
    }
  }
  if (!parsed || typeof parsed !== "object") return [];
  const analysis = (parsed as Record<string, unknown>).analysis;
  if (!analysis || typeof analysis !== "object") return [];
  return toStringList((analysis as Record<string, unknown>).reviewWarnings);
}

/** Groups warnings by the entry each one names. */
export function groupReviewWarnings(warnings: string[]): EntryReviewWarnings {
  const byEntry = new Map<string, string[]>();
  const document: string[] = [];

  for (const warning of warnings) {
    const match = ENTRY_WARNING.exec(warning.trim());
    if (!match) {
      document.push(warning);
      continue;
    }
    const [, page, kind, subject, field, reason] = match;
    const key = warningKey(kind.toLowerCase() as ReviewWarningKind, subject, field);
    const detail = page ? `Page ${page}: ${reason}` : reason;
    byEntry.set(key, [...(byEntry.get(key) ?? []), detail]);
  }

  return { byEntry, document, flaggedCount: byEntry.size };
}

/** The warnings naming a vocabulary entry, by its term. */
export function warningsForWord(
  grouped: EntryReviewWarnings,
  word: string | null | undefined,
): string[] {
  if (!word) return [];
  const term = normaliseTerm(word);
  const found: string[] = [];
  // The field part varies by what was checked, so every field for the term counts.
  for (const [key, warnings] of grouped.byEntry) {
    const [kind, subject] = key.split("\u0000");
    if (kind === "vocabulary" && subject === term) found.push(...warnings);
  }
  return found;
}

/** The warnings naming a question entry, by its subject and field. */
export function warningsForQuestion(
  grouped: EntryReviewWarnings,
  question: { subject?: string | null; field?: string | null },
): string[] {
  if (!question.subject) return [];
  return grouped.byEntry.get(
    warningKey("question", question.subject, question.field ?? ""),
  ) ?? [];
}

/**
 * Entries in review order: those a warning names first, each keeping its
 * position among the rest otherwise.
 */
export function flaggedFirst<T>(
  entries: T[],
  warningsFor: (entry: T) => string[],
): Array<{ entry: T; warnings: string[] }> {
  const withWarnings = entries.map((entry) => ({ entry, warnings: warningsFor(entry) }));
  return [
    ...withWarnings.filter(({ warnings }) => warnings.length > 0),
    ...withWarnings.filter(({ warnings }) => warnings.length === 0),
  ];
}
