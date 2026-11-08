type PageSummarySource = {
  page: number;
  summariesJSON?: unknown[];
  questionsJSON?: Array<Record<string, unknown>>;
  vocabularyJSON?: unknown[];
};

type TitledSummary = Record<string, unknown> & { title: string; content: string };

const SPLIT_BOUNDARIES = ["\n\n", "\n", ". ", " "];

/**
 * Splits text into chunks that each satisfy `fits`, cutting at a paragraph,
 * line, sentence or word boundary when one exists in the back half of the chunk.
 */
function splitTextToFit(
  text: string,
  fits: (chunk: string) => boolean,
): string[] {
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (fits(remaining)) {
      chunks.push(remaining);
      break;
    }
    // Binary search for the longest prefix that fits (always at least one character).
    let low = 1;
    let high = remaining.length - 1;
    let best = 1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (fits(remaining.slice(0, mid))) {
        best = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    let cut = best;
    const window = remaining.slice(0, best);
    for (const boundary of SPLIT_BOUNDARIES) {
      const index = window.lastIndexOf(boundary);
      if (index > 0 && index >= Math.floor(best / 2)) {
        cut = index + boundary.length;
        break;
      }
    }
    const lastCode = remaining.charCodeAt(cut - 1);
    if (cut > 1 && lastCode >= 0xd800 && lastCode <= 0xdbff) cut -= 1;
    chunks.push(remaining.slice(0, cut));
    remaining = remaining.slice(cut);
  }
  return chunks;
}

/**
 * Splits a summary whose serialized form (as produced by `wrap`) exceeds the
 * budget into consecutive "(part i of n)" summaries covering the same page range.
 */
function splitSummaryToFit(
  summary: TitledSummary,
  wrap: (summary: TitledSummary) => unknown,
  maxCharacters: number,
): TitledSummary[] {
  const size = (candidate: TitledSummary) =>
    JSON.stringify(wrap(candidate)).length + 2;
  if (size(summary) <= maxCharacters) return [summary];

  // Reserve room for the " (part N of M)" suffix added to every split title.
  const parts = splitTextToFit(
    summary.content,
    (chunk) =>
      size({
        ...summary,
        title: `${summary.title} (part 999 of 999)`,
        content: chunk,
      }) <= maxCharacters,
  );
  return parts.map((content, index) => ({
    ...summary,
    title: `${summary.title} (part ${index + 1} of ${parts.length})`,
    content,
  }));
}

function usableSummaries(page: PageSummarySource): TitledSummary[] {
  return (page.summariesJSON ?? []).flatMap<TitledSummary>((value) => {
    if (value === null || typeof value !== "object") return [];
    const summary = value as Record<string, unknown>;
    if (
      typeof summary.title !== "string" ||
      typeof summary.content !== "string"
    ) {
      return [];
    }
    return [summary as TitledSummary];
  });
}

/**
 * Splits one page's verified evidence into items whose serialized JSON stays within
 * `maxItemCharacters` (the batcher rejects any single item larger than its budget).
 * Facts are packed first, then vocabulary; a single entry larger than the budget is
 * kept whole so the batcher can still report it.
 */
function splitPageEvidence(
  page: number,
  facts: unknown[],
  vocabulary: unknown[],
  maxItemCharacters: number | undefined,
): Array<Record<string, unknown>> {
  const makeItem = (
    itemFacts: unknown[],
    itemVocabulary: unknown[],
    title: string,
  ): Record<string, unknown> => ({
    type: "page-evidence",
    title,
    pageRange: `Page ${page}`,
    facts: itemFacts,
    vocabulary: itemVocabulary,
  });
  const baseTitle = `Page ${page}`;
  const whole = makeItem(facts, vocabulary, baseTitle);
  if (
    maxItemCharacters === undefined ||
    JSON.stringify(whole).length + 2 <= maxItemCharacters
  ) {
    return [whole];
  }

  // Reserve room for the " (part N of M)" suffix added to every split title.
  const measureTitle = `${baseTitle} (part 999 of 999)`;
  const fits = (itemFacts: unknown[], itemVocabulary: unknown[]) =>
    JSON.stringify(makeItem(itemFacts, itemVocabulary, measureTitle)).length +
      2 <=
    maxItemCharacters;

  const parts: Array<{ facts: unknown[]; vocabulary: unknown[] }> = [];
  let current: { facts: unknown[]; vocabulary: unknown[] } = {
    facts: [],
    vocabulary: [],
  };
  const flush = () => {
    if (current.facts.length > 0 || current.vocabulary.length > 0) {
      parts.push(current);
      current = { facts: [], vocabulary: [] };
    }
  };
  const add = (kind: "facts" | "vocabulary", entry: unknown) => {
    const next = {
      facts: kind === "facts" ? [...current.facts, entry] : current.facts,
      vocabulary:
        kind === "vocabulary"
          ? [...current.vocabulary, entry]
          : current.vocabulary,
    };
    if (
      (current.facts.length > 0 || current.vocabulary.length > 0) &&
      !fits(next.facts, next.vocabulary)
    ) {
      flush();
      current[kind] = [entry];
      return;
    }
    current = next;
  };
  for (const fact of facts) add("facts", fact);
  for (const entry of vocabulary) add("vocabulary", entry);
  flush();

  return parts.map((part, index) =>
    makeItem(
      part.facts,
      part.vocabulary,
      `${baseTitle} (part ${index + 1} of ${parts.length})`,
    ),
  );
}

export function buildPageSummaryItems(
  pages: PageSummarySource[],
  maxItemCharacters?: number,
): Array<Record<string, unknown>> {
  return pages.flatMap<Record<string, unknown>>((page) => {
    const summaries = usableSummaries(page).flatMap<TitledSummary>(
      (summary) => {
        const pageRange =
          typeof summary.pageRange === "string"
            ? summary.pageRange
            : typeof summary.page_range === "string"
              ? summary.page_range
              : `Page ${page.page}`;
        const item: TitledSummary = {
          type: "page-summary",
          title: summary.title,
          content: summary.content,
          pageRange,
        };
        return maxItemCharacters === undefined
          ? [item]
          : splitSummaryToFit(item, (candidate) => candidate, maxItemCharacters);
      },
    );
    if (summaries.length > 0) return summaries;

    const facts = (page.questionsJSON ?? []).map((question) => ({
      prompt: question.prompt,
      answer: question.answer,
      subject: question.subject,
      field: question.field,
      sourceText: question.sourceText,
    }));
    const vocabulary = (page.vocabularyJSON ?? []).map((value) => {
      if (value === null || typeof value !== "object") return value;
      const entry = value as Record<string, unknown>;
      return {
        word: entry.word ?? entry.term,
        definition: entry.definition,
        context: entry.context,
      };
    });
    return facts.length > 0 || vocabulary.length > 0
      ? splitPageEvidence(page.page, facts, vocabulary, maxItemCharacters)
      : [];
  });
}

/**
 * Document-level synthesis input: the page items plus the merged questions and
 * vocabulary that no page-evidence item already carries. A page without usable
 * summaries contributes its own questions and vocabulary as page evidence, so
 * repeating them as standalone items would show the model the same facts twice.
 */
export function buildSynthesisItems({
  pages,
  questions,
  vocabulary,
  maxItemCharacters,
}: {
  pages: PageSummarySource[];
  questions: unknown[];
  vocabulary: unknown[];
  maxItemCharacters?: number;
}): unknown[] {
  const questionPages = new Set<number>();
  const vocabularyPages = new Set<number>();
  for (const page of pages) {
    if (usableSummaries(page).length > 0) continue;
    if ((page.questionsJSON ?? []).length > 0) questionPages.add(page.page);
    if ((page.vocabularyJSON ?? []).length > 0) vocabularyPages.add(page.page);
  }

  // A merged duplicate lists every page it appeared on in `pages`; it is only
  // redundant when all of them are covered by page evidence.
  const isCovered = (entry: Record<string, unknown>, covered: Set<number>) => {
    const entryPages = Array.isArray(entry.pages) ? entry.pages : [entry.page];
    return (
      entryPages.length > 0 &&
      entryPages.every((page) => typeof page === "number" && covered.has(page))
    );
  };

  return [
    ...buildPageSummaryItems(pages, maxItemCharacters),
    ...questions.flatMap((question) => {
      if (question === null || typeof question !== "object") return [question];
      const entry = question as Record<string, unknown>;
      if (isCovered(entry, questionPages)) return [];
      return [
        {
          type: "question",
          prompt: entry.prompt,
          answer: entry.answer,
          subject: entry.subject,
          field: entry.field,
          page: entry.page,
        },
      ];
    }),
    ...vocabulary.flatMap((value) => {
      if (value === null || typeof value !== "object") return [value];
      const entry = value as Record<string, unknown>;
      if (isCovered(entry, vocabularyPages)) return [];
      return [
        {
          type: "vocabulary",
          word: entry.word ?? entry.term,
          definition: entry.definition,
          page: entry.page,
        },
      ];
    }),
  ];
}

const REDUCTION_ARRAY_KEYS = [
  "summariesJSON",
  "objectivesJSON",
  "conceptsJSON",
] as const;

/**
 * Splits a consolidated reduction that exceeds the batch budget into several
 * reductions of the same shape (summariesJSON / objectivesJSON / conceptsJSON), so a
 * later synthesis pass can re-batch it. An individual summary larger than the budget
 * is divided into "(part i of n)" summaries. Keys other than those three arrays are
 * only kept when the reduction already fits.
 */
export function splitReductionForBatching(
  reduction: Record<string, unknown>,
  maxCharacters: number,
): Array<Record<string, unknown>> {
  const size = (value: unknown) => JSON.stringify(value).length + 2;
  if (size(reduction) <= maxCharacters) return [reduction];

  const entries: Array<{
    key: (typeof REDUCTION_ARRAY_KEYS)[number];
    value: unknown;
  }> = [];
  for (const key of REDUCTION_ARRAY_KEYS) {
    const values = reduction[key];
    if (!Array.isArray(values)) continue;
    for (const value of values) {
      const [summary] = usableSummaries({ page: 0, summariesJSON: [value] });
      if (key === "summariesJSON" && summary) {
        for (const part of splitSummaryToFit(
          summary,
          (candidate) => ({ summariesJSON: [candidate] }),
          maxCharacters,
        )) {
          entries.push({ key, value: part });
        }
      } else {
        entries.push({ key, value });
      }
    }
  }

  const parts: Array<Record<string, unknown[]>> = [];
  let current: Record<string, unknown[]> = {};
  for (const { key, value } of entries) {
    const next = { ...current, [key]: [...(current[key] ?? []), value] };
    if (Object.keys(current).length > 0 && size(next) > maxCharacters) {
      parts.push(current);
      current = { [key]: [value] };
    } else {
      current = next;
    }
  }
  if (Object.keys(current).length > 0) parts.push(current);
  return parts.length > 0 ? parts : [reduction];
}

