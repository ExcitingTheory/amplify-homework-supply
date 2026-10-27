/**
 * @fileoverview scoreExtraction — Grades a document-analysis pipeline's output
 * against the hand-checked Thoth ground-truth fixture.
 *
 * See docs/THOTH_CALL_AND_RESPONSE_PLAN.md §3.3. Each fact match requires
 * the correct page, card and field before comparing answers — normalised
 * exact, then accept[], then a token-set similarity ratio >= 0.9. Known
 * source defects are excluded from required recall.
 *
 * This module has no dependency on the pipeline; it accepts a generic
 * `ExtractionInput` shape using the question bank's fields ({prompt, answer, ...}).
 */

export interface GTFact {
  field: string;
  value: string;
  accept?: string[];
  required: boolean;
  sourceDefect?: boolean;
}

export interface ThothCard {
  key: string;
  group: "trump" | "ace" | "small" | "court" | "reference";
  frontPage: number;
  backPage: number;
  title: string;
  subtitle: string;
  facts: GTFact[];
}

export interface GTVocab {
  term: string;
  set: string;
  definition: string;
  aliases?: string[];
}

export interface ThothGroundTruth {
  source: { filename: string; pages: number; sha256: string };
  cards: ThothCard[];
  vocabulary: GTVocab[];
  pageIndex: Record<number, string[]>;
}

/** Extracted question/fact item, in the question bank's shape. */
export interface ExtractedQuestionLike {
  prompt?: string;
  answer?: string;
  subject?: string;
  field?: string;
  sourceText?: string;
  page?: number | null;
  /** Every page a merged duplicate fact appeared on; `page` is the lowest. */
  pages?: number[];
}

/** Extracted vocabulary item (DocumentWord-like). */
export interface ExtractedWordLike {
  term?: string;
  word?: string;
  definition?: string;
  page?: number | null;
  pages?: number[];
}

export interface ExtractionInput {
  questions: ExtractedQuestionLike[];
  words: ExtractedWordLike[];
}

export interface MissingFact {
  card: string;
  field: string;
  expected: string;
  sourceDefect?: boolean;
}

export interface ExtractionReport {
  vocabRecall: number;
  factRecall: number;
  pageCoverage: { missing: number[] };
  missingFacts: MissingFact[];
  missingVocab: string[];
  duplicates: number;
  unmatchedExtracted: number;
}

// ---------------------------------------------------------------------------
// Normalisation + similarity
// ---------------------------------------------------------------------------

/** Lowercase, strip diacritics/punctuation, collapse whitespace. */
export function normalise(input: string): string {
  const cleaned = input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned
    .split(" ")
    .map(singulariseToken)
    .join(" ");
}

function singulariseToken(token: string): string {
  const irregular: Record<string, string> = {
    sephiroth: "sephira",
  };
  if (irregular[token]) return irregular[token];
  if (token.length < 4) return token;
  if (token.endsWith("ies")) return `${token.slice(0, -3)}y`;
  if (/(ches|shes|sses|xes|zes)$/.test(token)) return token.slice(0, -2);
  if (token.endsWith("s") && !/(ss|us|is)$/.test(token)) {
    return token.slice(0, -1);
  }
  return token;
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = new Array(n + 1);
  let curr = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

/** Normalised edit-distance similarity in [0, 1]; 1 = identical. */
export function levenshteinRatio(a: string, b: string): number {
  if (a.length === 0 && b.length === 0) return 1;
  const dist = levenshtein(a, b);
  return (a.length + b.length - dist) / (a.length + b.length);
}

/** fuzzywuzzy-style token-set ratio: robust to reordering and partial overlap. */
export function tokenSetRatio(a: string, b: string): number {
  const na = normalise(a);
  const nb = normalise(b);
  if (na === nb) return 1;
  const tokensA = new Set(na.split(" ").filter(Boolean));
  const tokensB = new Set(nb.split(" ").filter(Boolean));
  const intersection = [...tokensA].filter((t) => tokensB.has(t)).sort();
  const diffA = [...tokensA].filter((t) => !tokensB.has(t)).sort();
  const diffB = [...tokensB].filter((t) => !tokensA.has(t)).sort();

  const sorted_intersection = intersection.join(" ");
  const combined1 = [...intersection, ...diffA].join(" ").trim();
  const combined2 = [...intersection, ...diffB].join(" ").trim();

  return Math.max(
    levenshteinRatio(sorted_intersection, combined1),
    levenshteinRatio(sorted_intersection, combined2),
    levenshteinRatio(combined1, combined2),
  );
}

const SIMILARITY_THRESHOLD = 0.9;

function answerMatches(candidateAnswer: string, fact: GTFact): boolean {
  const candidates = [fact.value, ...(fact.accept ?? [])];
  const normCandidateAnswer = normalise(candidateAnswer);
  for (const expected of candidates) {
    if (normalise(expected) === normCandidateAnswer) return true;
  }
  for (const expected of candidates) {
    if (tokenSetRatio(expected, candidateAnswer) >= SIMILARITY_THRESHOLD)
      return true;
  }
  return false;
}

/** Pages an item came from: all merged pages, else its single page. */
function pagesOfItem(item: { page?: number | null; pages?: number[] }): number[] {
  if (item.pages && item.pages.length > 0) return item.pages;
  return item.page != null ? [item.page] : [];
}

function questionIsOnCardPage(
  card: ThothCard,
  question: ExtractedQuestionLike,
): boolean {
  return pagesOfItem(question).some(
    (page) => page === card.frontPage || page === card.backPage,
  );
}

function questionIdentifiesCard(
  card: ThothCard,
  question: ExtractedQuestionLike,
): boolean {
  if (question.subject) {
    const subject = normalise(question.subject);
    return subject === normalise(card.key) || subject === normalise(card.title);
  }

  const prompt = normalise(question.prompt ?? "");
  return prompt.includes(normalise(card.title));
}

function questionIdentifiesField(
  fact: GTFact,
  question: ExtractedQuestionLike,
): boolean {
  if (question.field) return normalise(question.field) === normalise(fact.field);

  const fieldWords = fact.field.replace(/([a-z])([A-Z])/g, "$1 $2");
  const prompt = normalise(question.prompt ?? "");
  return prompt.includes(normalise(fieldWords));
}

function extractedAnswerText(q: ExtractedQuestionLike): string {
  return q.answer ?? "";
}

function extractedTermText(w: ExtractedWordLike): string {
  return w.term ?? w.word ?? "";
}

/**
 * Score extracted pipeline output against the ground truth.
 */
export function scoreExtraction(
  groundTruth: ThothGroundTruth,
  extracted: ExtractionInput,
): ExtractionReport {
  const matchedQuestionIdx = new Set<number>();
  const matchedWordIdx = new Set<number>();
  const missingFacts: MissingFact[] = [];
  let requiredTotal = 0;
  let requiredMatched = 0;
  let duplicates = 0;

  for (const card of groundTruth.cards) {
    for (const fact of card.facts) {
      if (!fact.required || fact.sourceDefect) continue;
      requiredTotal += 1;

      let matchCount = 0;
      for (let i = 0; i < extracted.questions.length; i++) {
        const q = extracted.questions[i];
        if (
          !questionIsOnCardPage(card, q) ||
          !questionIdentifiesCard(card, q) ||
          !questionIdentifiesField(fact, q)
        ) {
          continue;
        }
        const answer = extractedAnswerText(q);
        if (!answer) continue;
        if (answerMatches(answer, fact)) {
          matchCount += 1;
          matchedQuestionIdx.add(i);
        }
      }

      if (matchCount > 0) {
        requiredMatched += 1;
        if (matchCount > 1) duplicates += matchCount - 1;
      } else {
        missingFacts.push({
          card: card.key,
          field: fact.field,
          expected: fact.value,
          ...(fact.sourceDefect ? { sourceDefect: true } : {}),
        });
      }
    }
  }

  const missingVocab: string[] = [];
  let vocabMatched = 0;
  for (const vocab of groundTruth.vocabulary) {
    const candidates = [vocab.term, ...(vocab.aliases ?? [])];
    let found = false;
    for (let i = 0; i < extracted.words.length; i++) {
      const w = extracted.words[i];
      const term = extractedTermText(w);
      if (!term) continue;
      for (const expected of candidates) {
        if (
          normalise(expected) === normalise(term) ||
          tokenSetRatio(expected, term) >= SIMILARITY_THRESHOLD
        ) {
          found = true;
          matchedWordIdx.add(i);
          break;
        }
      }
      if (found) break;
    }
    if (found) vocabMatched += 1;
    else missingVocab.push(vocab.term);
  }

  const presentPages = new Set<number>();
  for (const q of extracted.questions)
    for (const page of pagesOfItem(q)) presentPages.add(page);
  for (const w of extracted.words)
    for (const page of pagesOfItem(w)) presentPages.add(page);
  const missingPages: number[] = [];
  for (let p = 1; p <= groundTruth.source.pages; p++) {
    if (p === 2) continue; // page 2 is intentionally blank
    if (!presentPages.has(p)) missingPages.push(p);
  }

  const unmatchedExtracted =
    extracted.questions.filter((_, i) => !matchedQuestionIdx.has(i)).length +
    extracted.words.filter((_, i) => !matchedWordIdx.has(i)).length;

  return {
    vocabRecall:
      groundTruth.vocabulary.length === 0
        ? 1
        : vocabMatched / groundTruth.vocabulary.length,
    factRecall: requiredTotal === 0 ? 1 : requiredMatched / requiredTotal,
    pageCoverage: { missing: missingPages },
    missingFacts,
    missingVocab,
    duplicates,
    unmatchedExtracted,
  };
}

/** Gate per plan §3.3: vocabRecall === 1 and factRecall === 1 and no pages missing (except page 2). */
export function passesGate(report: ExtractionReport): boolean {
  return (
    report.vocabRecall === 1 &&
    report.factRecall === 1 &&
    report.pageCoverage.missing.length === 0
  );
}
