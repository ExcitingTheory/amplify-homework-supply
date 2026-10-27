/**
 * OpenAI-powered document analysis
 */
import {
  OPENAI_DOCUMENT_ANALYSIS_MAX_OUTPUT_TOKENS,
} from "./modelLimits.js";

export type AnalysisProfile = "standard" | "exhaustive";

export interface AnalysisPage {
  pageNumber: number;
  text: string;
}

interface AnalysisResult {
  vocabularyJSON: any[];
  summariesJSON: any[];
  objectivesJSON: any[];
  conceptsJSON: any[];
  questionsJSON: any[];
  usage: TokenUsage;
  /** Exhaustive mode: labelled lines no fact covered, by page. */
  uncoveredLines?: Array<{ page: number; line: string }>;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

const EMPTY_TOKEN_USAGE: TokenUsage = {
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
};

function readTokenUsage(completion: any): TokenUsage {
  return {
    promptTokens: completion.usage?.prompt_tokens ?? 0,
    completionTokens: completion.usage?.completion_tokens ?? 0,
    totalTokens: completion.usage?.total_tokens ?? 0,
  };
}

function addTokenUsage(left: TokenUsage, right: TokenUsage): TokenUsage {
  return {
    promptTokens: left.promptTokens + right.promptTokens,
    completionTokens: left.completionTokens + right.completionTokens,
    totalTokens: left.totalTokens + right.totalTokens,
  };
}

export function isEquivalentText(leftText: string, rightText: string): boolean {
  const normalize = (text: string) =>
    text
      .normalize("NFKC")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;|&#160;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/\s+/g, " ")
      .trim()
      .toLocaleLowerCase();
  const left = normalize(leftText);
  return left.length >= 3 && left === normalize(rightText);
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : undefined;
}

function firstString(
  record: Record<string, unknown>,
  keys: string[],
): string {
  return (
    keys
      .map((key) => record[key])
      .find((value): value is string => typeof value === "string") ?? ""
  );
}

export function retainDirectQuestionsWithVerifiedMatches(
  directEntries: unknown[],
  verifiedEntries: Array<Record<string, unknown>>,
): Array<Record<string, unknown>> {
  return directEntries.filter((value): value is Record<string, unknown> => {
    const direct = asRecord(value);
    if (!direct) return false;
    const prompt = firstString(direct, ["prompt"]);
    const answer = firstString(direct, ["answer"]);
    return verifiedEntries.some(
      (verified) =>
        isEquivalentText(prompt, firstString(verified, ["prompt"])) &&
        isEquivalentText(answer, firstString(verified, ["answer"])),
    );
  });
}

export function retainDirectVocabularyWithVerifiedMatches(
  directEntries: unknown[],
  verifiedEntries: unknown[],
): unknown[] {
  return directEntries.filter((value) => {
    const direct = asRecord(value);
    if (!direct) return false;
    const word = firstString(direct, ["word", "term"]);
    const definition = firstString(direct, ["definition"]);
    return verifiedEntries.some((candidate) => {
      const verified = asRecord(candidate);
      return (
        verified !== undefined &&
        isEquivalentText(word, firstString(verified, ["word", "term"])) &&
        isEquivalentText(definition, firstString(verified, ["definition"]))
      );
    });
  });
}

export function chunkItemsByJsonSize<T>(
  items: T[],
  maxCharacters: number,
): T[][] {
  if (!Number.isInteger(maxCharacters) || maxCharacters <= 0) {
    throw new Error("maxCharacters must be a positive integer");
  }

  const batches: T[][] = [];
  let current: T[] = [];
  let currentLength = 2;

  for (const item of items) {
    const itemLength = JSON.stringify(item).length;
    const nextLength = currentLength + itemLength + (current.length > 0 ? 1 : 0);
    if (itemLength + 2 > maxCharacters) {
      throw new Error("A synthesis item exceeds the configured size limit");
    }
    if (current.length > 0 && nextLength > maxCharacters) {
      batches.push(current);
      current = [];
      currentLength = 2;
    }
    currentLength += itemLength + (current.length > 0 ? 1 : 0);
    current.push(item);
  }

  if (current.length > 0) batches.push(current);
  return batches;
}

export interface ExhaustiveFact {
  subject: string;
  field: string;
  answer: string;
  accept: string[];
  page: number;
  sourceText: string;
}

export interface FactVerificationVerdict {
  index: number;
  supported: boolean;
  reason?: string;
}

export const VERIFIER_SYSTEM_PROMPT =
  'Verify each candidate against only the source page. Each candidate has an explicit "index". Return only JSON {"verdicts":[{"index":0,"supported":true,"reason":""}],"omissions":[]} with exactly one verdict for every candidate index from 0 to N-1: no duplicates, no missing indices, no extra indices. omissions are brief facts present in the source but missing from the candidates.';

export function buildVerifierCandidates<
  T extends { kind: string; fact: ExhaustiveFact },
>(candidates: T[]): Array<{ index: number; kind: string } & ExhaustiveFact> {
  return candidates.map(({ kind, fact }, index) => ({ index, kind, ...fact }));
}

export function filterVerifiedEntries<T>(
  entries: T[],
  verdicts: FactVerificationVerdict[],
): T[] {
  if (
    verdicts.length !== entries.length ||
    verdicts.some(
      (verdict) =>
        !Number.isInteger(verdict.index) ||
        verdict.index < 0 ||
        verdict.index >= entries.length,
    ) ||
    new Set(verdicts.map((verdict) => verdict.index)).size !== entries.length
  ) {
    throw new Error(
      "Verification verdicts must cover each candidate exactly once",
    );
  }

  const supported = new Set(
    verdicts.filter((verdict) => verdict.supported).map(({ index }) => index),
  );
  return entries.filter((_entry, index) => supported.has(index));
}

interface ExhaustiveVocabulary {
  term: string;
  definition: string;
  context: string;
  page: number;
}

interface ExhaustivePageResult {
  facts: ExhaustiveFact[];
  vocabulary: ExhaustiveVocabulary[];
  usage: TokenUsage;
  /** Labelled/glossary lines the model never produced a covering fact for. */
  uncoveredLines?: string[];
}

interface CoverageCandidate {
  field: string;
  answer: string;
  sourceText: string;
}

interface AnalysisOptions {
  profile?: AnalysisProfile;
  sleep?: (milliseconds: number) => Promise<void>;
}

const MAX_PARALLEL_BATCHES = 5;
const MAX_RATE_LIMIT_RETRIES = 4;
const MAX_SPLIT_DEPTH = 8;
const MIN_SPLIT_LENGTH = 100;
const sleep = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

class IncompletePageAnalysisError extends Error {}

function isProviderLimitError(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === "object" &&
    "providerLimitError" in error &&
    error.providerLimitError === true
  );
}

/** Used when a file's settings do not name a valid profile. */
export const DEFAULT_ANALYSIS_PROFILE: AnalysisProfile = "exhaustive";

export function resolveAnalysisProfile(settings: unknown): {
  profile: AnalysisProfile;
  invalidValue?: unknown;
} {
  let parsedSettings = settings;
  if (typeof settings === "string") {
    try {
      parsedSettings = JSON.parse(settings);
    } catch {
      return { profile: DEFAULT_ANALYSIS_PROFILE, invalidValue: settings };
    }
  }

  if (
    parsedSettings === null ||
    typeof parsedSettings !== "object" ||
    !("analysisProfile" in parsedSettings)
  ) {
    return { profile: DEFAULT_ANALYSIS_PROFILE };
  }

  const profile = (parsedSettings as { analysisProfile?: unknown })
    .analysisProfile;
  if (profile === undefined) return { profile: DEFAULT_ANALYSIS_PROFILE };
  if (profile === "standard" || profile === "exhaustive") {
    return { profile };
  }
  return { profile: DEFAULT_ANALYSIS_PROFILE, invalidValue: profile };
}

export function resolveSkipAutoAnalysis(settings: unknown): {
  skip: boolean;
  invalidValue?: unknown;
} {
  let parsedSettings = settings;
  if (typeof settings === "string") {
    try {
      parsedSettings = JSON.parse(settings);
    } catch {
      return { skip: false, invalidValue: settings };
    }
  }

  if (
    parsedSettings === null ||
    typeof parsedSettings !== "object" ||
    !("skipAutoAnalysis" in parsedSettings)
  ) {
    return { skip: false };
  }

  const skip = (parsedSettings as { skipAutoAnalysis?: unknown })
    .skipAutoAnalysis;
  if (skip === undefined) return { skip: false };
  if (typeof skip === "boolean") return { skip };
  return { skip: false, invalidValue: skip };
}

export function createPageBatches<T>(
  pages: T[],
  pagesPerBatch: number,
): T[][] {
  if (!Number.isInteger(pagesPerBatch) || pagesPerBatch < 1) {
    throw new Error("pagesPerBatch must be a positive integer");
  }

  const batches: T[][] = [];
  for (let i = 0; i < pages.length; i += pagesPerBatch) {
    batches.push(pages.slice(i, i + pagesPerBatch));
  }
  return batches;
}

export function splitTextInHalf(text: string): [string, string] | null {
  const midpoint = Math.floor(text.length / 2);
  if (midpoint < 1 || midpoint >= text.length) return null;

  let splitAt = text.lastIndexOf("\n", midpoint);
  if (splitAt < text.length * 0.25) {
    splitAt = text.indexOf("\n", midpoint);
  }
  if (splitAt < 1 || splitAt >= text.length - 1) splitAt = midpoint;

  const first = text.slice(0, splitAt).trim();
  const second = text.slice(splitAt).trim();
  return first && second ? [first, second] : null;
}

const SEGMENT_TARGET_CHARS = 3500;
const SEGMENT_MIN_CHARS = 1750;
const SEGMENT_MAX_CHARS = 5250;

function nearestBoundary(boundaries: number[], target: number): number | undefined {
  return boundaries.reduce<number | undefined>((nearest, boundary) => {
    if (
      nearest === undefined ||
      Math.abs(boundary - target) < Math.abs(nearest - target)
    ) {
      return boundary;
    }
    return nearest;
  }, undefined);
}

export function segmentTextIntoPages(text: string): AnalysisPage[] {
  if (!text) return [];

  const paragraphBoundaries = new Set<number>();
  for (const match of text.matchAll(/\r?\n[ \t]*\r?\n/g)) {
    paragraphBoundaries.add(match.index + match[0].length);
  }
  for (const match of text.matchAll(/(?:^|\r?\n)(?=#{1,6}[ \t]+\S)/gm)) {
    const boundary = match.index + match[0].length;
    if (boundary > 0) paragraphBoundaries.add(boundary);
  }

  const sentenceBoundaries: number[] = [];
  for (const match of text.matchAll(/[.!?](?:["')\]]*)[ \t]*(?:\r?\n| )+/g)) {
    sentenceBoundaries.push(match.index + match[0].length);
  }

  const pages: AnalysisPage[] = [];
  let start = 0;
  while (text.length - start > SEGMENT_MAX_CHARS) {
    const remaining = text.length - start;
    const minCut = start + SEGMENT_MIN_CHARS;
    const maxCut = Math.min(
      start + SEGMENT_MAX_CHARS,
      text.length - SEGMENT_MIN_CHARS,
    );
    const eligibleParagraphs = [...paragraphBoundaries].filter(
      (boundary) => boundary >= minCut && boundary <= maxCut,
    );
    const eligibleSentences = sentenceBoundaries.filter(
      (boundary) => boundary >= minCut && boundary <= maxCut,
    );
    const cut =
      nearestBoundary(
        eligibleParagraphs,
        start + SEGMENT_TARGET_CHARS,
      ) ??
      nearestBoundary(eligibleSentences, start + SEGMENT_TARGET_CHARS) ??
      maxCut;
    const safeCut =
      cut > 0 &&
      cut < text.length &&
      text.charCodeAt(cut - 1) >= 0xd800 &&
      text.charCodeAt(cut - 1) <= 0xdbff &&
      text.charCodeAt(cut) >= 0xdc00 &&
      text.charCodeAt(cut) <= 0xdfff
        ? cut - 1
        : cut;

    pages.push({ pageNumber: pages.length + 1, text: text.slice(start, safeCut) });
    start = safeCut;
  }

  if (start < text.length) {
    pages.push({ pageNumber: pages.length + 1, text: text.slice(start) });
  }

  return pages;
}

/**
 * Headings and titles share the `Label: value` / `term — definition` shapes
 * but are not facts, so the model rightly never extracts them.
 */
function isHeadingLike(line: string): boolean {
  if (/^#{1,6}\s/.test(line)) return true;
  if (/^(?:chapter|section|unit|part|lesson|module|appendix)\b/i.test(line)) {
    return true;
  }
  // "All caps" only means something for scripts that have case.
  const isAllCaps = /\p{Lu}/u.test(line) && !/\p{Ll}/u.test(line);
  const words = line.match(/\p{L}{2,}/gu) ?? [];
  return isAllCaps && words.length >= 3;
}

export function extractCoverageCandidates(
  page: AnalysisPage,
): CoverageCandidate[] {
  const entries: Array<{ kind: "label" | "glossary"; candidate: CoverageCandidate }> =
    [];
  for (const rawLine of page.text.split(/\r?\n/)) {
    const sourceText = rawLine.trim();
    if (!sourceText || isHeadingLike(sourceText)) continue;

    const labelMatch = sourceText.match(/^([^:\n]{1,100}):\s*(\S.*)$/);
    const glossaryMatch = labelMatch
      ? null
      : sourceText.match(/^([^—–-]{1,100}?)\s+[—–-]\s+(\S.*)$/);
    const match = labelMatch ?? glossaryMatch;
    if (!match) continue;

    const field = match[1].trim();
    const answer = match[2].trim();
    if (field && answer) {
      entries.push({
        kind: labelMatch ? "label" : "glossary",
        candidate: { field, answer, sourceText },
      });
    }
  }

  // A dash is ordinary punctuation in titles and prose, so a lone dashed line
  // is not evidence of a glossary; glossary entries come in runs.
  const glossaryCount = entries.filter(({ kind }) => kind === "glossary").length;
  return entries
    .filter(({ kind }) => kind === "label" || glossaryCount >= 2)
    .map(({ candidate }) => candidate);
}

/**
 * Hint for decks and card-style documents. Only a standalone `Front` / `Back`
 * marker line (optionally `Front: title` or `Front — title`) counts, so
 * ordinary headings such as "Back to basics" or "Front-end" do not.
 */
function inferPageRole(text: string): string {
  const header = text
    .split(/\r?\n/)
    .slice(0, 8)
    .map((line) => line.replace(/^[#*\s]+/, "").replace(/[*\s]+$/, ""));
  const marker = (word: string) =>
    new RegExp(`^${word}\\s*(?::.*|\\s[—–·|-]\\s.*)?$`, "i");
  if (header.some((line) => marker("fronts?").test(line))) return "front";
  if (header.some((line) => marker("backs?").test(line))) return "back";
  if (header.some((line) => /^(?:reference|glossary)\b/i.test(line))) {
    return "reference";
  }
  return "content";
}

function toStrictRecallFormat(): Record<string, unknown> {
  const stringArray = { type: "array", items: { type: "string" } };
  return {
    type: "json_schema",
    json_schema: {
      name: "document_recall_extraction",
      strict: true,
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          facts: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                subject: { type: "string" },
                field: { type: "string" },
                answer: { type: "string" },
                accept: stringArray,
                page: { type: "integer" },
                sourceText: { type: "string" },
              },
              required: [
                "subject",
                "field",
                "answer",
                "accept",
                "page",
                "sourceText",
              ],
            },
          },
          vocabulary: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                term: { type: "string" },
                definition: { type: "string" },
                context: { type: "string" },
                page: { type: "integer" },
              },
              required: ["term", "definition", "context", "page"],
            },
          },
        },
        required: ["facts", "vocabulary"],
      },
    },
  };
}

function parseExhaustiveResult(
  content: string | null | undefined,
  pageNumber: number,
): ExhaustivePageResult {
  if (!content) throw new IncompletePageAnalysisError("Empty model response");

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new IncompletePageAnalysisError("Model response was not valid JSON");
  }

  if (
    parsed === null ||
    typeof parsed !== "object" ||
    !Array.isArray((parsed as { facts?: unknown }).facts) ||
    !Array.isArray((parsed as { vocabulary?: unknown }).vocabulary)
  ) {
    throw new IncompletePageAnalysisError(
      "Model response did not match the required extraction shape",
    );
  }

  const facts = (parsed as { facts: unknown[] }).facts.map((item) => {
    if (item === null || typeof item !== "object") {
      throw new IncompletePageAnalysisError("Invalid extracted fact");
    }
    const fact = item as Record<string, unknown>;
    if (
      typeof fact.subject !== "string" ||
      typeof fact.field !== "string" ||
      typeof fact.answer !== "string" ||
      !Array.isArray(fact.accept) ||
      !fact.accept.every((answer) => typeof answer === "string") ||
      typeof fact.sourceText !== "string"
    ) {
      throw new IncompletePageAnalysisError("Invalid extracted fact fields");
    }
    return {
      subject: fact.subject,
      field: fact.field,
      answer: fact.answer,
      accept: fact.accept as string[],
      page: pageNumber,
      sourceText: fact.sourceText,
    };
  });

  const vocabulary = (parsed as { vocabulary: unknown[] }).vocabulary.map(
    (item) => {
      if (item === null || typeof item !== "object") {
        throw new IncompletePageAnalysisError("Invalid extracted vocabulary");
      }
      const word = item as Record<string, unknown>;
      if (
        typeof word.term !== "string" ||
        typeof word.definition !== "string" ||
        typeof word.context !== "string"
      ) {
        throw new IncompletePageAnalysisError(
          "Invalid extracted vocabulary fields",
        );
      }
      return {
        term: word.term,
        definition: word.definition,
        context: word.context,
        page: pageNumber,
      };
    },
  );

  return { facts, vocabulary, usage: EMPTY_TOKEN_USAGE };
}

const COVERAGE_ANSWER_SUPPORT = 0.8;
const COVERAGE_LINE_RATIO = 0.9;

function tokenSet(value: string): Set<string> {
  return new Set(normaliseTerm(value).split(" ").filter(Boolean));
}

/**
 * A labelled line is covered when facts whose answers come from that line
 * together account for nearly all of its tokens. Wrapped PDF lines and lines
 * holding several statements are quoted differently by the model than they
 * appear on the page, so exact line equality is too strict. A fact with a
 * wrong answer is not related to the line and never counts as coverage. The
 * fact's subject and field count too, because facts split from one line
 * usually quote only their value and carry the label as subject/field.
 */
export function candidateIsCovered(
  candidate: CoverageCandidate,
  facts: ExhaustiveFact[],
): boolean {
  const candidateText = candidate.sourceText
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  const exact = facts.some((fact) => {
    const sourceText = fact.sourceText
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
    return (
      sourceText === candidateText &&
      normaliseTerm(fact.answer) === normaliseTerm(candidate.answer)
    );
  });
  if (exact) return true;

  const lineTokens = tokenSet(candidate.sourceText);
  if (lineTokens.size === 0) return false;
  const covered = new Set<string>();
  for (const fact of facts) {
    const answerTokens = tokenSet(fact.answer);
    if (answerTokens.size === 0) continue;
    let supported = 0;
    for (const token of answerTokens) if (lineTokens.has(token)) supported += 1;
    if (supported / answerTokens.size < COVERAGE_ANSWER_SUPPORT) continue;
    for (const token of tokenSet(
      `${fact.subject} ${fact.field} ${fact.sourceText} ${fact.answer}`,
    )) {
      if (lineTokens.has(token)) covered.add(token);
    }
  }
  return covered.size / lineTokens.size >= COVERAGE_LINE_RATIO;
}

export interface SuspectFact {
  fact: ExhaustiveFact;
  reasons: Array<"source_not_on_page" | "wrong_page" | "answer_not_in_source">;
}

export interface PageFactCheckResult {
  facts: ExhaustiveFact[];
  suspect: SuspectFact[];
}

function normalizeEvidence(value: string): string {
  return value.normalize("NFKC").replace(/\s+/gu, " ").trim().toLowerCase();
}

export function checkPageFacts(
  page: AnalysisPage,
  facts: ExhaustiveFact[],
): PageFactCheckResult {
  const result: PageFactCheckResult = { facts: [], suspect: [] };
  const seen = new Set<string>();
  const normalizedPage = normalizeEvidence(page.text);

  for (const fact of facts) {
    const normalizedSource = normalizeEvidence(fact.sourceText);
    const normalizedAnswer = normalizeEvidence(fact.answer);
    const reasons: SuspectFact["reasons"] = [];

    if (!normalizedSource || !normalizedPage.includes(normalizedSource)) {
      reasons.push("source_not_on_page");
    }
    if (fact.page !== page.pageNumber) reasons.push("wrong_page");
    if (!normalizedAnswer || !normalizedSource.includes(normalizedAnswer)) {
      reasons.push("answer_not_in_source");
    }

    if (reasons.length > 0) {
      result.suspect.push({ fact, reasons });
      continue;
    }

    const key = [
      fact.page,
      normalizeEvidence(fact.subject),
      normalizeEvidence(fact.field),
      normalizedAnswer,
      normalizedSource,
    ].join("\u0000");
    if (!seen.has(key)) {
      seen.add(key);
      result.facts.push(fact);
    }
  }

  return result;
}

async function createStructuredCompletion(
  openai: any,
  request: Record<string, unknown>,
  pause: (milliseconds: number) => Promise<void>,
): Promise<any> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await openai.chat.completions.create(request);
    } catch (error) {
      const status =
        error !== null && typeof error === "object" && "status" in error
          ? (error as { status?: unknown }).status
          : undefined;
      if (status !== 429 || attempt >= MAX_RATE_LIMIT_RETRIES) throw error;
      const delay = Math.min(1000 * 2 ** attempt, 8000);
      console.error("MODEL_RATE_LIMITED vendor=openai");
      console.warn(
        `[analyzePages] Rate limited; retrying in ${delay}ms (attempt ${attempt + 1})`,
      );
      await pause(delay);
    }
  }
}

function describeUncovered(candidates: CoverageCandidate[]): string {
  const shown = candidates
    .slice(0, 5)
    .map(({ sourceText }) => JSON.stringify(sourceText.slice(0, 120)));
  const more = candidates.length - shown.length;
  return more > 0 ? `${shown.join("; ")}; and ${more} more` : shown.join("; ");
}

function describeFacts(result: ExhaustivePageResult): string {
  const summary = JSON.stringify({
    facts: result.facts.map(({ subject, field, answer, sourceText }) => ({
      subject,
      field,
      answer,
      sourceText,
    })),
    vocabulary: result.vocabulary.map(({ term }) => term),
  });
  return summary.length > 800 ? `${summary.slice(0, 800)}…` : summary;
}

function exhaustivePrompt(pageRole: string, gapCandidates?: CoverageCandidate[]) {
  const extractionInstructions = `Extract every discrete fact and every defined vocabulary term from the supplied page. Every labelled line (Label: value), every glossary entry (term — definition) and every enumerated statement must become one fact. Do not summarise or omit repeated boilerplate the first time it appears. Each fact must retain its exact sourceText and have a concise field (the label or attribute), a subject (the card, topic, term or section the fact is about), a short answer, and any acceptable answer alternatives. Include every defined term, including glossary entries and lines that list several terms. Keep the source page number. Do not infer information that is absent from the source.`;

  if (gapCandidates?.length) {
    return `${extractionInstructions}
This is a targeted gap-fill. Return facts for every source line below that was missed previously, and only for those lines: ignore the page header context and any other text on the page. Preserve each sourceText exactly. If a line is a heading or title rather than a fact, return nothing for it. For glossary lines, also return the defined term as vocabulary.
${JSON.stringify(gapCandidates)}`;
  }

  const roleHint =
    pageRole === "content" ? "" : `Page role hint: ${pageRole}. `;
  return `${extractionInstructions}
${roleHint}Use the topic, term or section the page is about as the subject for each fact.`;
}

async function analyzeExhaustivePage(
  openai: any,
  page: AnalysisPage,
  fileID: string,
  documentID: string,
  pause: (milliseconds: number) => Promise<void>,
): Promise<ExhaustivePageResult> {
  const pageRole = inferPageRole(page.text);

  const pageContext = page.text.split(/\r?\n/).slice(0, 8).join("\n");
  // Labelled lines in the header context are extractable facts; a gap-fill
  // that sees them answers about those instead of the lines it was asked for.
  const labelledLines = new Set(
    extractCoverageCandidates(page).map(({ sourceText }) => sourceText),
  );
  const gapFillContext = page.text
    .split(/\r?\n/)
    .slice(0, 8)
    .filter((line) => !labelledLines.has(line.trim()))
    .join("\n");
  const requestForText = (
    text: string,
    systemPrompt: string,
    context = pageContext,
  ) => ({
    model: "gpt-4o",
    max_tokens: OPENAI_DOCUMENT_ANALYSIS_MAX_OUTPUT_TOKENS,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `[Page ${page.pageNumber}]\nPage header context:\n${context}\nPage text:\n${text}`,
      },
    ],
    response_format: toStrictRecallFormat(),
    metadata: {
      fileId: fileID,
      documentId: documentID,
      pages: String(page.pageNumber),
      profile: "exhaustive",
    },
  });

  const extractTextWithSplitting = async (
    text: string,
    depth: number,
  ): Promise<ExhaustivePageResult> => {
    const completion = await createStructuredCompletion(
      openai,
      requestForText(text, exhaustivePrompt(pageRole)),
      pause,
    );
    const choice = completion.choices?.[0];
    try {
      if (choice?.finish_reason === "length") {
        throw new IncompletePageAnalysisError(
          "Model response was truncated by the token limit",
        );
      }
      return {
        ...parseExhaustiveResult(
        choice?.message?.content,
        page.pageNumber,
        ),
        usage: readTokenUsage(completion),
      };
    } catch (error) {
      if (
        !(error instanceof IncompletePageAnalysisError) ||
        depth >= MAX_SPLIT_DEPTH ||
        text.length < MIN_SPLIT_LENGTH
      ) {
        throw error;
      }

      const halves = splitTextInHalf(text);
      if (!halves) throw error;
      console.warn(
        `[analyzePages] Splitting page ${page.pageNumber} after incomplete extraction (depth ${depth + 1})`,
      );
      const left = await extractTextWithSplitting(halves[0], depth + 1);
      const right = await extractTextWithSplitting(halves[1], depth + 1);
      return {
        facts: [...left.facts, ...right.facts],
        vocabulary: [...left.vocabulary, ...right.vocabulary],
        usage: addTokenUsage(left.usage, right.usage),
      };
    }
  };

  const initial = await extractTextWithSplitting(page.text, 0);
  const missingCandidates = extractCoverageCandidates(page).filter(
    (candidate) => !candidateIsCovered(candidate, initial.facts),
  );
  if (missingCandidates.length === 0) return initial;

  const fillGaps = async (
    candidates: CoverageCandidate[],
    depth: number,
    stalled: number,
  ): Promise<ExhaustivePageResult> => {
    let gapFill: ExhaustivePageResult;
    try {
      const completion = await createStructuredCompletion(
        openai,
        requestForText(
          candidates.map((candidate) => candidate.sourceText).join("\n"),
          exhaustivePrompt(pageRole, candidates),
          gapFillContext,
        ),
        pause,
      );
      if (completion.choices?.[0]?.finish_reason === "length") {
        throw new IncompletePageAnalysisError("Gap-fill response was truncated");
      }
      gapFill = {
        ...parseExhaustiveResult(
          completion.choices?.[0]?.message?.content,
          page.pageNumber,
        ),
        usage: readTokenUsage(completion),
      };
    } catch (error) {
      if (
        !(error instanceof IncompletePageAnalysisError) ||
        depth >= MAX_SPLIT_DEPTH ||
        candidates.length < 2
      ) {
        throw error;
      }
      const midpoint = Math.ceil(candidates.length / 2);
      const left = await fillGaps(candidates.slice(0, midpoint), depth + 1, 0);
      const right = await fillGaps(candidates.slice(midpoint), depth + 1, 0);
      return {
        facts: [...left.facts, ...right.facts],
        vocabulary: [...left.vocabulary, ...right.vocabulary],
        usage: addTokenUsage(left.usage, right.usage),
        uncoveredLines: [
          ...(left.uncoveredLines ?? []),
          ...(right.uncoveredLines ?? []),
        ],
      };
    }

    const remaining = candidates.filter(
      (candidate) => !candidateIsCovered(candidate, gapFill.facts),
    );
    if (remaining.length > 0) {
      const progressed = remaining.length < candidates.length;
      if (
        depth >= MAX_SPLIT_DEPTH ||
        (!progressed && remaining.length === 1 && stalled >= 1)
      ) {
        // Headings and titles also look like labelled lines, and the model
        // rightly declines them; keep the page's facts and report the gap
        // instead of discarding the whole page.
        console.warn(
          `[analyzePages] Exhaustive extraction left ${remaining.length} labelled/glossary lines uncovered on page ${page.pageNumber}: ${describeUncovered(remaining)}. Last gap-fill returned ${describeFacts(gapFill)}`,
        );
        return {
          ...gapFill,
          uncoveredLines: remaining.map(({ sourceText }) => sourceText),
        };
      }
      // Re-sending an identical set that made no progress rarely helps; smaller
      // sets focus the model on fewer lines.
      const retryBatches =
        !progressed && remaining.length > 1
          ? [
              remaining.slice(0, Math.ceil(remaining.length / 2)),
              remaining.slice(Math.ceil(remaining.length / 2)),
            ]
          : [remaining];
      const nextStalled = progressed ? 0 : stalled + 1;
      let facts = gapFill.facts;
      let vocabulary = gapFill.vocabulary;
      let usage = gapFill.usage;
      let uncoveredLines: string[] = [];
      for (const batch of retryBatches) {
        const retried = await fillGaps(batch, depth + 1, nextStalled);
        facts = [...facts, ...retried.facts];
        vocabulary = [...vocabulary, ...retried.vocabulary];
        usage = addTokenUsage(usage, retried.usage);
        uncoveredLines = [...uncoveredLines, ...(retried.uncoveredLines ?? [])];
      }
      return { facts, vocabulary, usage, uncoveredLines };
    }
    return gapFill;
  };
  const gapFill = await fillGaps(missingCandidates, 0, 0);

  return {
    facts: [...initial.facts, ...gapFill.facts],
    vocabulary: [...initial.vocabulary, ...gapFill.vocabulary],
    usage: addTokenUsage(initial.usage, gapFill.usage),
    uncoveredLines: gapFill.uncoveredLines ?? [],
  };
}

/**
 * Irregular plurals folded to their singular when comparing terms. Regular
 * English plurals are handled by suffix rules in normaliseTerm.
 */
export const IRREGULAR_PLURALS: Readonly<Record<string, string>> = {
  sephiroth: "sephira",
  children: "child",
  people: "person",
  men: "man",
  women: "woman",
  mice: "mouse",
  feet: "foot",
  teeth: "tooth",
  geese: "goose",
  criteria: "criterion",
  phenomena: "phenomenon",
  analyses: "analysis",
  hypotheses: "hypothesis",
  theses: "thesis",
};

function normaliseTerm(term: string): string {
  // Only Latin diacritics are folded away; combining marks in other scripts
  // (e.g. Japanese dakuten) are part of the letters and must survive.
  const normalized = term
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  const invariant = new Set(["news", "series", "species", "means"]);
  return normalized
    .split(" ")
    .map((token) => {
      if (Object.hasOwn(IRREGULAR_PLURALS, token)) {
        return IRREGULAR_PLURALS[token];
      }
      if (invariant.has(token) || token.length < 4) return token;
      if (token.endsWith("ies")) return `${token.slice(0, -3)}y`;
      if (/(ches|shes|sses|xes|zes)$/.test(token)) return token.slice(0, -2);
      if (token.endsWith("s") && !/(ss|us|is)$/.test(token)) {
        return token.slice(0, -1);
      }
      return token;
    })
    .join(" ");
}

function dedupeVocabulary(
  vocabulary: ExhaustiveVocabulary[],
): ExhaustiveVocabulary[] {
  const seen = new Set<string>();
  return vocabulary.filter((entry) => {
    const key = normaliseTerm(entry.term);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function toQuestion(fact: ExhaustiveFact) {
  const prompt = `What is ${fact.field} for ${fact.subject}?`;
  return {
    prompt,
    answer: fact.answer,
    questionType: "recall",
    page: fact.page,
    subject: fact.subject,
    field: fact.field,
    sourceText: fact.sourceText,
    accept: fact.accept,
  };
}

export function normaliseQuestionEntries(input: unknown): Array<
  Record<string, string | number | string[] | number[] | undefined>
> {
  if (!Array.isArray(input)) {
    throw new Error("Extracted questions must be an array");
  }

  return input.map((entry, index) => {
    if (entry === null || typeof entry !== "object") {
      throw new Error(`Extracted question ${index} is not an object`);
    }
    const question = entry as Record<string, unknown>;
    const prompt = question.prompt;
    if (typeof prompt !== "string" || !prompt.trim()) {
      throw new Error(`Extracted question ${index} is missing its prompt`);
    }

    const answer = question.answer;
    if (answer !== undefined && typeof answer !== "string") {
      throw new Error(`Extracted question ${index} has an invalid answer`);
    }

    const questionType = question.questionType;
    if (questionType !== undefined && typeof questionType !== "string") {
      throw new Error(`Extracted question ${index} has an invalid questionType`);
    }

    const page = question.page;
    if (
      page !== undefined &&
      (typeof page !== "number" || !Number.isInteger(page))
    ) {
      throw new Error(`Extracted question ${index} has an invalid page`);
    }

    const optionalString = (key: string): string | undefined => {
      const value = question[key];
      if (value === undefined || value === null) return undefined;
      if (typeof value !== "string") {
        throw new Error(`Extracted question ${index} has an invalid ${key}`);
      }
      return value;
    };

    const accept = question.accept;
    let acceptValues: string[] | undefined;
    if (accept !== undefined) {
      if (
        !Array.isArray(accept) ||
        !accept.every((value): value is string => typeof value === "string")
      ) {
        throw new Error(
          `Extracted question ${index} has invalid accept values`,
        );
      }
      acceptValues = accept;
    }

    const pages = question.pages;
    if (
      pages !== undefined &&
      (!Array.isArray(pages) ||
        !pages.every(
          (value): value is number =>
            typeof value === "number" && Number.isInteger(value),
        ))
    ) {
      throw new Error(`Extracted question ${index} has invalid pages`);
    }

    return {
      prompt,
      answer,
      hint: optionalString("hint"),
      difficulty: optionalString("difficulty"),
      questionType,
      page,
      ...(pages !== undefined ? { pages } : {}),
      subject: optionalString("subject"),
      field: optionalString("field"),
      sourceText: optionalString("sourceText"),
      accept: acceptValues,
    };
  });
}

function pagesOf(entry: Record<string, unknown>): number[] {
  const pages = Array.isArray(entry.pages) ? entry.pages : [entry.page];
  return pages.filter(
    (page): page is number => typeof page === "number" && Number.isInteger(page),
  );
}

function mergeDuplicates<T>(
  items: T[],
  keyOf: (entry: Record<string, unknown>) => string | undefined,
): T[] {
  const merged = new Map<string, Record<string, unknown>>();
  const result: unknown[] = [];
  for (const item of items) {
    const entry =
      item !== null && typeof item === "object"
        ? (item as Record<string, unknown>)
        : undefined;
    const key = entry && keyOf(entry);
    if (!entry || !key) {
      const pages = entry ? pagesOf(entry) : [];
      result.push(pages.length > 0 ? { ...entry, pages } : item);
      continue;
    }
    const first = merged.get(key);
    if (!first) {
      const copy = { ...entry };
      const pages = pagesOf(copy);
      if (pages.length > 0) copy.pages = pages;
      merged.set(key, copy);
      result.push(copy);
      continue;
    }
    const pages = [...new Set([...pagesOf(first), ...pagesOf(entry)])].sort(
      (a, b) => a - b,
    );
    if (pages.length > 0) {
      first.page = pages[0];
      first.pages = pages;
    }
    if (Array.isArray(first.accept) || Array.isArray(entry.accept)) {
      first.accept = [
        ...new Set([
          ...(Array.isArray(first.accept) ? first.accept : []),
          ...(Array.isArray(entry.accept) ? entry.accept : []),
        ]),
      ];
    }
  }
  return result as T[];
}

/**
 * Merges questions that state the same fact (same subject, field and answer)
 * so a fact repeated on several pages is kept once. The merged question keeps
 * the lowest `page` and always lists every source page in `pages`, so page
 * references survive the merge.
 */
export function mergeDuplicateQuestions<T>(questions: T[]): T[] {
  return mergeDuplicates(questions, (entry) => {
    const answer = firstString(entry, ["answer"]);
    const subject = firstString(entry, ["subject"]);
    const field = firstString(entry, ["field"]);
    const identity =
      subject && field ? [subject, field] : [firstString(entry, ["prompt"])];
    if (!answer || identity.some((part) => !part)) return undefined;
    return [...identity, answer].map((part) => normaliseTerm(part!)).join("\u0000");
  });
}

/** Merges vocabulary entries with the same term and definition across pages. */
export function mergeDuplicateVocabulary<T>(entries: T[]): T[] {
  return mergeDuplicates(entries, (entry) => {
    const term = firstString(entry, ["word", "term"]);
    if (!term) return undefined;
    return [term, firstString(entry, ["definition"]) ?? ""]
      .map(normaliseTerm)
      .join("\u0000");
  });
}

async function analyzePagesExhaustively(
  openai: any,
  pages: AnalysisPage[],
  fileID: string,
  documentID: string,
  options: AnalysisOptions,
): Promise<AnalysisResult> {
  const results: Array<ExhaustivePageResult | undefined> = new Array(
    pages.length,
  );
  const failedPages: Array<{ page: number; error: unknown }> = [];
  let nextPage = 0;

  const worker = async () => {
    while (nextPage < pages.length) {
      const index = nextPage;
      nextPage += 1;
      const page = pages[index];
      if (!page.text.trim()) {
        results[index] = {
          facts: [],
          vocabulary: [],
          usage: EMPTY_TOKEN_USAGE,
        };
        continue;
      }
      try {
        results[index] = await analyzeExhaustivePage(
          openai,
          page,
          fileID,
          documentID,
          options.sleep ?? sleep,
        );
      } catch (error) {
        failedPages.push({ page: page.pageNumber, error });
        console.error(
          `[analyzePages] Exhaustive analysis failed for page ${page.pageNumber}:`,
          error,
        );
      }
    }
  };

  await Promise.all(
    Array.from(
      { length: Math.min(MAX_PARALLEL_BATCHES, pages.length) },
      () => worker(),
    ),
  );

  if (failedPages.length > 0) {
    const providerLimitFailure = failedPages.find(({ error }) =>
      isProviderLimitError(error),
    );
    if (providerLimitFailure) throw providerLimitFailure.error;

    const pageNumbers = failedPages
      .map(({ page }) => page)
      .sort((a, b) => a - b);
    console.error(
      `[analyzePages] Exhaustive analysis failedPages: ${pageNumbers.join(", ")}`,
    );
    throw new Error(
      `Exhaustive analysis failed for page${pageNumbers.length === 1 ? "" : "s"} ${pageNumbers.join(", ")}`,
    );
  }

  const extractedPages = results.filter(
    (result): result is ExhaustivePageResult => result !== undefined,
  );
  const facts = extractedPages.flatMap((result) => result.facts);
  const vocabulary = dedupeVocabulary(
    extractedPages.flatMap((result) => result.vocabulary),
  );

  const uncoveredLines = results.flatMap((result, index) =>
    (result?.uncoveredLines ?? []).map((line) => ({
      page: pages[index].pageNumber,
      line,
    })),
  );

  return {
    vocabularyJSON: vocabulary.map((entry) => ({
      word: entry.term,
      definition: entry.definition,
      context: entry.context,
      page: entry.page,
    })),
    summariesJSON: [],
    objectivesJSON: [],
    conceptsJSON: [],
    questionsJSON: mergeDuplicateQuestions(facts.map(toQuestion)),
    usage: extractedPages.reduce(
      (total, result) => addTokenUsage(total, result.usage),
      EMPTY_TOKEN_USAGE,
    ),
    ...(uncoveredLines.length > 0 ? { uncoveredLines } : {}),
  };
}

/**
 * Analyze pages with GPT-4o. Standard mode preserves the existing batching and
 * prompt; exhaustive mode uses page-sized structured extraction and coverage.
 */
export async function analyzePages(
  openai: any,
  pages: AnalysisPage[],
  fileID: string,
  documentID: string,
  options: AnalysisOptions = {},
): Promise<AnalysisResult> {
  if (options.profile === "exhaustive") {
    return analyzePagesExhaustively(
      openai,
      pages,
      fileID,
      documentID,
      options,
    );
  }

  const PAGES_PER_BATCH = 2;
  const MAX_PARALLEL_BATCHES = 5;
  const pause = options.sleep ?? sleep;

  const allVocabulary: any[] = [];
  const allSummaries: any[] = [];
  const allObjectives: any[] = [];
  const allConcepts: any[] = [];
  const allQuestions: any[] = [];
  const failedBatches: string[] = [];
  let usage = EMPTY_TOKEN_USAGE;

  const batchTasks = createPageBatches(pages, PAGES_PER_BATCH).map(
    (batch) =>
      (async (): Promise<
        | { success: true; batchContent: Record<string, any>; usage: TokenUsage }
        | { success: false; error: string }
      > => {
        const pageNumbers = batch.map((page) => page.pageNumber).join(", ");
        const batchText = batch
          .map((page) => `[Page ${page.pageNumber}]\n${page.text}`)
          .join("\n\n");

        console.log(
          `[analyzePages] Analyzing pages ${pageNumbers} (${batchText.length} characters)...`,
        );

        try {
          const completion = await createStructuredCompletion(
            openai,
            {
              model: "gpt-4o",
              max_tokens: OPENAI_DOCUMENT_ANALYSIS_MAX_OUTPUT_TOKENS,
              messages: [
                {
                  role: "system",
                  content: `Extract vocabulary, summaries, objectives, concepts, and generate questions from educational text. Return JSON: {
  vocabularyJSON: [{word, definition, context, page}],
  summariesJSON: [{title, content, page_range}],
  objectivesJSON: [{objective, bloom_level}],
  conceptsJSON: [{concept, description, related_vocabulary}],
  questionsJSON: [{prompt, answer, hint, difficulty, questionType, page, subject, field, sourceText}]
}

For questionsJSON, generate 2-3 custom answer questions per batch that test comprehension. Questions should be open-ended, requiring thoughtful responses. Include:
- prompt: The question text
- answer: A sample correct answer (200-300 words)
- hint: A helpful hint for students (optional)
- difficulty: "easy", "medium", or "hard"
- questionType: "short_answer", "essay", or "comprehension"
- page: the page number containing the evidence
- subject: the card, topic, or section the question is about
- field: the specific fact or concept being tested
- sourceText: the source passage supporting the answer

Include the page number in all extracted items.`,
                },
                { role: "user", content: `Extract from:\n\n${batchText}` },
              ],
              response_format: { type: "json_object" },
              metadata: {
                fileId: fileID,
                documentId: documentID,
                pages: pageNumbers,
              },
            },
            pause,
          );
          if (completion.choices?.[0]?.finish_reason === "length") {
            throw new IncompletePageAnalysisError(
              `Extraction response was truncated for pages ${pageNumbers}`,
            );
          }

          const content = completion.choices[0]?.message?.content;
          if (!content) {
            throw new Error(
              `Extraction returned no content for pages ${pageNumbers}`,
            );
          }
          const batchContent = JSON.parse(content);

          console.log(`[analyzePages] Batch ${pageNumbers} complete:`, {
            vocabulary: batchContent.vocabularyJSON?.length || 0,
            summaries: batchContent.summariesJSON?.length || 0,
            objectives: batchContent.objectivesJSON?.length || 0,
            concepts: batchContent.conceptsJSON?.length || 0,
            questions: batchContent.questionsJSON?.length || 0,
            tokens: completion.usage?.total_tokens,
          });

          return {
            success: true,
            batchContent,
            usage: readTokenUsage(completion),
          };
        } catch (error) {
          if (isProviderLimitError(error)) throw error;
          if (
            error !== null &&
            typeof error === "object" &&
            "status" in error &&
            error.status === 429
          ) {
            console.error("MODEL_RATE_LIMITED vendor=openai");
          }
          console.error(
            `[analyzePages] Error analyzing pages ${pageNumbers}:`,
            error,
          );
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      })(),
  );

  console.log(
    `[analyzePages] Processing ${batchTasks.length} batches in parallel (max ${MAX_PARALLEL_BATCHES} concurrent)...`,
  );

  for (let i = 0; i < batchTasks.length; i += MAX_PARALLEL_BATCHES) {
    const parallelGroup = batchTasks.slice(i, i + MAX_PARALLEL_BATCHES);
    const results = await Promise.allSettled(parallelGroup);

    results.forEach((result) => {
      if (
        result.status === "rejected" &&
        isProviderLimitError(result.reason)
      ) {
        throw result.reason;
      }
      if (result.status !== "fulfilled") {
        failedBatches.push(
          result.reason instanceof Error
            ? result.reason.message
            : String(result.reason),
        );
        return;
      }
      if (!result.value.success) {
        failedBatches.push(result.value.error);
        return;
      }
      const { batchContent } = result.value;
      usage = addTokenUsage(usage, result.value.usage);
      if (batchContent.vocabularyJSON)
        allVocabulary.push(...batchContent.vocabularyJSON);
      if (batchContent.summariesJSON)
        allSummaries.push(...batchContent.summariesJSON);
      if (batchContent.objectivesJSON)
        allObjectives.push(...batchContent.objectivesJSON);
      if (batchContent.conceptsJSON)
        allConcepts.push(...batchContent.conceptsJSON);
      if (batchContent.questionsJSON)
        allQuestions.push(...batchContent.questionsJSON);
    });

    console.log(
      `[analyzePages] Completed parallel group ${Math.floor(i / MAX_PARALLEL_BATCHES) + 1} of ${Math.ceil(batchTasks.length / MAX_PARALLEL_BATCHES)}`,
    );
  }

  if (failedBatches.length > 0) {
    throw Object.assign(
      new Error(
        `Document extraction failed for ${failedBatches.length} page batch(es): ${failedBatches.join("; ")}`,
      ),
      { name: "ModelTimeout" },
    );
  }

  return {
    vocabularyJSON: allVocabulary,
    summariesJSON: allSummaries,
    objectivesJSON: allObjectives,
    conceptsJSON: allConcepts,
    questionsJSON: allQuestions,
    usage,
  };
}
