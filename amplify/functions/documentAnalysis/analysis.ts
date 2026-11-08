/**
 * OpenAI-powered document analysis
 */
import {
  OPENAI_DOCUMENT_ANALYSIS_MAX_OUTPUT_TOKENS,
} from "./modelLimits.js";
import { locateEvidence, normalizeEvidence, sourceEvidenceUnits, uncoveredEvidenceUnits, type EvidenceAnchor } from "./evidence.js";
import {
  selectVocabulary,
  isHybridVocabulary,
  type VocabularySelection,
  type VocabularyCandidate,
} from "./vocabularySelection.js";

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
  reviewWarnings?: Array<{ page: number; message: string }>;
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

export interface ExhaustiveFact extends Partial<EvidenceAnchor> {
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

export function completeVerificationVerdicts<T>(
  entries: T[],
  verdicts: FactVerificationVerdict[],
): FactVerificationVerdict[] {
  const reported = new Set(verdicts.map(({ index }) => index));
  const missing = entries.flatMap((_, index) =>
    reported.has(index) ? [] : [{
      index,
      supported: false,
      reason: "Verifier omitted this candidate; human review required",
    }],
  );
  const completed = [...verdicts, ...missing];
  filterVerifiedEntries(entries, completed);
  if (missing.length) {
    console.warn(`[verification] ${missing.length} candidate(s) missing verdicts; treating them as unverified`);
  }
  return completed;
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
  reviewWarnings?: string[];
}

interface CoverageCandidate {
  field: string;
  answer: string;
  sourceText: string;
}

interface AnalysisOptions {
  profile?: AnalysisProfile;
  sleep?: (milliseconds: number) => Promise<void>;
  vocabularySelection?: VocabularySelection;
  vocabularyLanguage?: string;
  vocabularyCandidates?: VocabularyCandidate[];
}

function vocabularyInstructions(options: AnalysisOptions, page?: number): string {
  if (!isHybridVocabulary(options.vocabularySelection)) return "";
  const shortlist = (options.vocabularyCandidates ?? []).filter((entry) => page === undefined || entry.page === page);
  return "\nVocabulary selection is already complete in deterministic code. This overrides earlier vocabulary-selection instructions. " +
    "Return vocabulary ONLY for the supplied shortlist; do not choose additional terms. " +
    "Keep each supplied term and page exactly. For source-defined terms copy sourceDefinition unchanged. " +
    `For other terms write a concise learner definition in ${options.vocabularyLanguage ?? "English"}, grounded in sourceText. ` +
    "A generated definition may paraphrase; context must copy the supplied sourceText verbatim. " +
    "Do not invent examples or definitions unsupported by the passage. Facts extraction remains exhaustive and independent of this vocabulary list.\n" +
    JSON.stringify(shortlist.map(({ term, page, sourceText, sourceDefinition }) => ({ term, page, sourceText, sourceDefinition })));
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

export function resolveLlmExtractionEnabled(
  platformDefault: unknown,
  userOverride: unknown,
): boolean {
  if (platformDefault != null && typeof platformDefault !== "boolean") {
    throw new Error("Platform LLM extraction setting must be a boolean");
  }
  if (userOverride != null && typeof userOverride !== "boolean") {
    throw new Error("User LLM extraction override must be a boolean");
  }
  return typeof userOverride === "boolean"
    ? userOverride
    : platformDefault === true;
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

export function analyzePageWithoutLLM(
  page: AnalysisPage,
  vocabularyCandidates: VocabularyCandidate[] = [],
): AnalysisResult {
  const questionsJSON = extractCoverageCandidates(page).map((candidate) => {
    const isLabel = /^([^:\n]{1,100}):\s*(\S.*)$/.test(candidate.sourceText);
    const subject = isLabel ? "Document" : candidate.field;
    const field = isLabel ? candidate.field : "definition";
    return {
      prompt: isLabel
        ? `What is ${candidate.field}?`
        : `What does ${candidate.field} mean?`,
      answer: candidate.answer,
      questionType: "recall",
      page: page.pageNumber,
      subject,
      field,
      sourceText: candidate.sourceText,
      accept: [],
    };
  });
  const reviewWarnings: Array<{ page: number; message: string }> = [];
  const vocabularyJSON = vocabularyCandidates
    .filter((candidate) => candidate.page === page.pageNumber)
    .map((candidate) => {
      if (!candidate.sourceDefinition?.trim()) {
        reviewWarnings.push({
          page: page.pageNumber,
          message: `Vocabulary "${candidate.term}" needs a human-written definition.`,
        });
      }
      return {
        word: candidate.term,
        definition: candidate.sourceDefinition ?? "",
        context: candidate.sourceText,
        page: candidate.page,
      };
    });

  return {
    questionsJSON,
    vocabularyJSON,
    summariesJSON: [],
    objectivesJSON: [],
    conceptsJSON: [],
    usage: EMPTY_TOKEN_USAGE,
    ...(reviewWarnings.length ? { reviewWarnings } : {}),
  };
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
          checklist: {
            type: "object",
            additionalProperties: false,
            properties: {
              sourcePage: { type: "integer" },
              factsReviewed: { type: "integer" },
              vocabularyReviewed: { type: "integer" },
              vocabularyEvidenceChecked: { type: "boolean" },
              coverageReviewed: { type: "boolean" },
              missingSourceLines: stringArray,
            },
            required: [
              "sourcePage", "factsReviewed", "vocabularyReviewed",
              "vocabularyEvidenceChecked", "coverageReviewed", "missingSourceLines",
            ],
          },
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
                context: {
                  type: "string",
                  description: "An exact quotation from the page containing the term's definition, not a page reference or paraphrase.",
                },
                page: { type: "integer" },
              },
              required: ["term", "definition", "context", "page"],
            },
          },
        },
        required: ["facts", "vocabulary", "checklist"],
      },
    },
  };
}

/**
 * A review warning in the shape the review UI parses: `kind "subject" (field):
 * reason`. Warnings written this way are shown on the entry they name and
 * counted in the review total; anything else is treated as being about the
 * document as a whole, so the shape matters.
 */
export function entryReviewWarning(
  kind: "question" | "vocabulary",
  subject: string,
  field: string,
  reasons: string[],
): string {
  // A quote inside the subject would close the quoted group early and make the
  // warning unparseable. Normalisation drops quotes on both sides, so removing
  // them here still matches the entry.
  const named = subject.replace(/"/g, "").trim();
  const detail = reasons.join("; ");
  return named
    ? `${kind} "${named}" (${field.replace(/"/g, "").trim()}): ${detail}`
    : `A ${kind} was dropped because it names no subject: ${detail}`;
}

/** Why a claim cannot be trusted, in wording an instructor can act on. */
function claimFailureReasons(
  fact: { subject: string; field: string; answer: string; page: number },
  pageNumber: number,
  anchored: boolean,
  suspectReasons: string[],
): string[] {
  const reasons: string[] = [];
  if (!fact.subject.trim()) reasons.push("it names no subject");
  if (!fact.field.trim()) reasons.push("it states no relationship");
  if (!fact.answer.trim()) reasons.push("it has no value");
  if (fact.page !== pageNumber) {
    reasons.push(`it claims page ${fact.page} but was extracted from page ${pageNumber}`);
  }
  if (!anchored) reasons.push("its quotation is not found exactly once in the page text");
  reasons.push(...suspectReasons);
  return reasons.length ? reasons : ["it did not pass source verification"];
}

function parseExhaustiveResult(
  content: string | null | undefined,
  pageNumber: number,
  pageText: string,
  generatedDefinitions = false,
): ExhaustivePageResult {  if (!content) throw new IncompletePageAnalysisError("Empty model response");

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
      typeof fact.page !== "number" ||
      !Number.isInteger(fact.page) || fact.page < 1 ||
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
      page: typeof fact.page === "number" ? fact.page : pageNumber,
      sourceText: fact.sourceText,
    };
  });

  const failures: string[] = [];
  const evidencePage = { pageNumber, text: pageText };
  const units = sourceEvidenceUnits(evidencePage);
  for (const fact of facts) {
    const anchor = locateEvidence(evidencePage, fact.sourceText, units);
    const suspect = checkPageFacts(evidencePage, [fact]).suspect;
    if (!anchor || fact.page !== pageNumber || !fact.subject.trim() ||
        !fact.field.trim() || !fact.answer.trim() || suspect.length) {
      // The whole fact is kept in the log for debugging; the warning itself is
      // read by instructors, so it names the claim instead of dumping JSON.
      console.warn(
        `[parseExhaustiveResult] Page ${pageNumber} dropped claim: ${JSON.stringify(fact)}`,
      );
      failures.push(entryReviewWarning(
        "question",
        fact.subject,
        fact.field,
        claimFailureReasons(
          fact,
          pageNumber,
          Boolean(anchor),
          suspect.flatMap((item) => item.reasons),
        ),
      ));
    } else {
      Object.assign(fact, anchor);
    }
  }
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
      const evidence = checkPageFacts({ pageNumber, text: pageText }, [{
        subject: word.term,
        field: "definition",
        answer: word.definition,
        sourceText: word.context,
        accept: [],
        page: pageNumber,
      }]);
      const evidenceFailures = evidence.suspect.flatMap(({ reasons }) =>
        reasons.filter((reason) => !generatedDefinitions || reason !== "answer_not_in_source"),
      );
      if (evidenceFailures.length > 0) {
        failures.push(
          `Vocabulary evidence for "${word.term}" must quote the source passage containing its definition; ` +
          `reasons: ${evidenceFailures.join(", ")}; ` +
          `definition: ${JSON.stringify(word.definition)}; context: ${JSON.stringify(word.context)}`,
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

  const checklist = (parsed as { checklist?: unknown }).checklist;
  if (!checklist || typeof checklist !== "object") {
    failures.push("Missing procedural checklist");
  } else {
    const report = checklist as Record<string, unknown>;
    if (report.sourcePage !== pageNumber) failures.push(`sourcePage must be ${pageNumber}`);
    if (report.factsReviewed !== facts.length) failures.push(`factsReviewed must be ${facts.length}`);
    if (report.vocabularyReviewed !== vocabulary.length) failures.push(`vocabularyReviewed must be ${vocabulary.length}`);
    if (report.vocabularyEvidenceChecked !== true) failures.push("Check every vocabulary definition against its quoted context");
    if (report.coverageReviewed !== true) failures.push("Review source coverage before returning the extraction");
    if (!Array.isArray(report.missingSourceLines) ||
        !report.missingSourceLines.every(line => typeof line === "string")) {
      failures.push("missingSourceLines must be an array of quoted source lines");
    } else if (report.missingSourceLines.length > 0) {
      failures.push(`Extract the reported missing source lines: ${JSON.stringify(report.missingSourceLines)}`);
    }
  }
  return {
    facts, vocabulary, usage: EMPTY_TOKEN_USAGE,
    ...(failures.length ? { reviewWarnings: failures } : {}),
  };
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
 * fact's subject, field and leading source label count too. The full quotation
 * does not count: quoting a list is not extracting every member of that list.
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
      sourceText.includes(candidateText) &&
      (normaliseTerm(fact.answer) === normaliseTerm(candidate.answer) ||
        (candidate.answer.length >= 3 && normaliseTerm(fact.answer).includes(normaliseTerm(candidate.answer))))
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
      `${fact.subject} ${fact.field} ${fact.answer} ${fact.sourceText.includes(":") ? fact.sourceText.split(":")[0] : ""}`,
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
  const extractionInstructions = `Extract atomic claims BEFORE writing any questions: facts are subject / predicate / value triples, represented by subject / field / answer. Read ordinary prose, lists, definitions, tables, every labelled line (Label: value) and every glossary entry (term — definition). Split independent relationships, list members, contrasts, dates, quantities and locations into separate claims; never combine unrelated values into one answer. Resolve each subject from the local heading and sentence, not the document title. Use field as the specific relationship or source label, not a generic "fact" or "description". Preserve qualifications and negation. Each claim needs a unique exact contiguous sourceText quotation (include enough context to disambiguate repeated values) and the correct page. A compact legend, key or table row where short codes or column labels each precede a value on one line (for example \"COLOUR K Yellow Q Purple P Grey\") holds one independent claim per code: return a separate fact for every code and value pair, using the legend's heading with the code as the field, and never stop after the first pair. When a line inside an entity's block links that entity to another named entity (for example \"Kether: Crown — the root\" under a card), the block's entity stays the subject, the relationship is the field, and the answer names the linked entity with its description. Headings provide context, not claims. Do not infer information absent from the source. Also extract every defined vocabulary term. For vocabulary quote its definition verbatim and set context to the exact source passage, not a page reference.`;

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
  options: AnalysisOptions,
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
      {
        role: "system",
        content: systemPrompt + vocabularyInstructions(options, page.pageNumber) + "\nBefore returning, complete the procedural checklist: " +
          "identify sourcePage; count factsReviewed and vocabularyReviewed from the returned arrays; " +
          (isHybridVocabulary(options.vocabularySelection)
            ? "check every vocabulary definition is supported by its context and that context is quoted from Page text; "
            : "check every vocabulary definition is contained verbatim in its context and that context is quoted from Page text; ") +
          "set vocabularyEvidenceChecked only after checking all entries. Review all source lines for coverage, " +
          "set coverageReviewed, and list any still-unextracted source lines in missingSourceLines. " +
          "Complete missing extractions before submitting. The checklist and evidence will be verified by code.",
      },
      {
        role: "user",
        content: `[Page ${page.pageNumber}]\nPage header context (topic hints only; do not extract from here):\n${context}\nSource block inventory (context only; offsets are page-local UTF-16):\n${JSON.stringify(sourceEvidenceUnits(page).map(({ id, headingPath, start, end }) => ({ id, headingPath, start, end })))}\nPage text (the only source of evidence):\n${text}`,
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

  const extractWithEvidenceRepair = async (
    request: ReturnType<typeof requestForText>,
    sourceText: string,
  ): Promise<ExhaustivePageResult> => {
    let usage = EMPTY_TOKEN_USAGE;
    for (let attempt = 0; ; attempt += 1) {
      const completion = await createStructuredCompletion(openai, request, pause);
      usage = addTokenUsage(usage, readTokenUsage(completion));
      const choice = completion.choices?.[0];
      if (choice?.finish_reason === "length") {
        throw new IncompletePageAnalysisError("Model response was truncated by the token limit");
      }
      const result = parseExhaustiveResult(choice?.message?.content, page.pageNumber, sourceText,
        isHybridVocabulary(options.vocabularySelection));
      if (!result.reviewWarnings?.length) return { ...result, usage };
      const reasons = result.reviewWarnings.join("; ");
      if (attempt >= 2) {
        console.warn(
          `[analyzePages] Page ${page.pageNumber} requires human review after checklist repairs: ${reasons}`,
        );
        return { ...result, usage };
      }
      console.warn(
        `[analyzePages] Repairing extraction checklist on page ${page.pageNumber} (attempt ${attempt + 1}): ${reasons}`,
      );
      request.messages.push(
        { role: "assistant", content: choice.message.content },
        {
          role: "user",
          content: `Checklist verification failed. Correct the extraction using only the Page text, not header context. ${reasons}. ` +
            "Return the complete extraction and a newly completed checklist. " +
            (isHybridVocabulary(options.vocabularySelection)
              ? "Preserve the deterministic vocabulary shortlist and quote context verbatim; source-defined terms retain sourceDefinition, other definitions may paraphrase. "
              : "Copy each definition and its containing context verbatim from Page text, preserving punctuation and words. ") +
            "Do not invent evidence or omit supported vocabulary to avoid validation. " +
            "Remove only entries not present in the supplied Page text.",
        },
      );
    }
  };

  const extractTextWithSplitting = async (
    text: string,
    depth: number,
  ): Promise<ExhaustivePageResult> => {
    try {
      return await extractWithEvidenceRepair(
        requestForText(text, exhaustivePrompt(pageRole), ""),
        text,
      );
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
        reviewWarnings: [...(left.reviewWarnings ?? []), ...(right.reviewWarnings ?? [])],
      };
    }
  };

  const initial = await extractTextWithSplitting(page.text, 0);
  const missingCandidates = extractCoverageCandidates(page).filter(
    (candidate) => !candidateIsCovered(candidate, initial.facts),
  );
  for (const unit of uncoveredEvidenceUnits(page, initial.facts)) {
    if (!missingCandidates.some((candidate) => unit.text.includes(candidate.sourceText))) {
      missingCandidates.push({ field: unit.headingPath.join(" > "), answer: "", sourceText: unit.text });
    }
    if (initial.reviewWarnings?.length) {
      return { ...initial, uncoveredLines: missingCandidates.map(({ sourceText }) => sourceText) };
    }
  }
  if (missingCandidates.length === 0) return initial;

  let gapCalls = 0;
  const isCovered = (candidate: CoverageCandidate, facts: ExhaustiveFact[]) =>
    candidate.answer ? candidateIsCovered(candidate, facts) :
      !uncoveredEvidenceUnits(page, facts).some((unit) => unit.text === candidate.sourceText);
  const fillGaps = async (
    candidates: CoverageCandidate[],
    depth: number,
    stalled: number,
  ): Promise<ExhaustivePageResult> => {
    if (gapCalls >= 8) return {
      facts: [], vocabulary: [], usage: EMPTY_TOKEN_USAGE,
      uncoveredLines: candidates.map(({ sourceText }) => sourceText),
      reviewWarnings: ["Evidence-unit repair budget exhausted; coverage is not a guarantee of complete fact recall."],
    };
    gapCalls += 1;
    let gapFill: ExhaustivePageResult;
    try {
      gapFill = await extractWithEvidenceRepair(
        requestForText(
          candidates.map((candidate) => candidate.sourceText).join("\n"),
          exhaustivePrompt(pageRole, candidates),
          gapFillContext,
        ),
        page.text,
      );
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
        reviewWarnings: [...(left.reviewWarnings ?? []), ...(right.reviewWarnings ?? [])],
        uncoveredLines: [
          ...(left.uncoveredLines ?? []),
          ...(right.uncoveredLines ?? []),
        ],
      };
    }

    const remaining = candidates.filter(
      (candidate) => !isCovered(candidate, gapFill.facts),
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
      let reviewWarnings = gapFill.reviewWarnings ?? [];
      for (const batch of retryBatches) {
        const retried = await fillGaps(batch, depth + 1, nextStalled);
        facts = [...facts, ...retried.facts];
        vocabulary = [...vocabulary, ...retried.vocabulary];
        usage = addTokenUsage(usage, retried.usage);
        uncoveredLines = [...uncoveredLines, ...(retried.uncoveredLines ?? [])];
        reviewWarnings = [...reviewWarnings, ...(retried.reviewWarnings ?? [])];
      }
      return { facts, vocabulary, usage, uncoveredLines, reviewWarnings };
    }
    return gapFill;
  };
  const gapFill = await fillGaps(missingCandidates, 0, 0);

  return {
    facts: [...initial.facts, ...gapFill.facts],
    vocabulary: [...initial.vocabulary, ...gapFill.vocabulary],
    usage: addTokenUsage(initial.usage, gapFill.usage),
    uncoveredLines: gapFill.uncoveredLines ?? [],
    reviewWarnings: [...(initial.reviewWarnings ?? []), ...(gapFill.reviewWarnings ?? [])],
  };
}

/**
 * Irregular plurals folded to their singular when comparing terms. Regular
 * English plurals are handled by suffix rules in normaliseTerm.
 */
export const IRREGULAR_PLURALS: Readonly<Record<string, string>> = {
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

/**
 * Mirrored in src/utils/termNormalisation.ts (no cross-boundary imports
 * between amplify/ and src/); test/unit/termNormalisation.test.ts runs the
 * same cases against both.
 */
export function normaliseTerm(term: string): string {
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

export function toQuestion(fact: ExhaustiveFact) {
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
    ...(fact.evidenceUnitId ? {
      evidenceUnitId: fact.evidenceUnitId, sourceStart: fact.sourceStart, sourceEnd: fact.sourceEnd,
    } : {}),
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
    const sourceText = optionalString("sourceText");
    const evidenceUnitId = optionalString("evidenceUnitId");
    const offsets: Partial<Pick<EvidenceAnchor, "sourceStart" | "sourceEnd">> = {};
    for (const key of ["sourceStart", "sourceEnd"] as const) {
      const value = question[key];
      if (value === undefined) continue;
      if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
        throw new Error(`Extracted question ${index} has an invalid ${key}`);
      }
      offsets[key] = value;
    }
    if ((evidenceUnitId !== undefined || Object.keys(offsets).length > 0) &&
        (!evidenceUnitId?.trim() || offsets.sourceStart === undefined ||
          offsets.sourceEnd === undefined || offsets.sourceEnd <= offsets.sourceStart ||
          sourceText?.length !== offsets.sourceEnd - offsets.sourceStart)) {
      throw new Error(`Extracted question ${index} has an incomplete or inconsistent evidence anchor`);
    }

    return {
      prompt,
      answer,
      hint: optionalString("hint"),
      difficulty: optionalString("difficulty"),
      questionType,
      page,
      ...(pages !== undefined ? { pages } : {}),
      questionID: optionalString("questionID"),
      subject: optionalString("subject"),
      field: optionalString("field"),
      sourceText,
      evidenceUnitId,
      ...offsets,
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

interface MergeOptions {
  /** Whether `entry` restates `first`, among entries that share a key. Default: always. */
  matches?: (first: Record<string, unknown>, entry: Record<string, unknown>) => boolean;
  /** Prepares the entry that survives for a key, before anything is merged into it. */
  seed?: (first: Record<string, unknown>) => void;
  /** Carries anything else worth keeping from `entry` onto the surviving `first`. */
  absorb?: (first: Record<string, unknown>, entry: Record<string, unknown>) => void;
}

function mergeDuplicates<T>(
  items: T[],
  keyOf: (entry: Record<string, unknown>) => string | undefined,
  { matches, seed, absorb }: MergeOptions = {},
): T[] {
  const merged = new Map<string, Array<Record<string, unknown>>>();
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
    const candidates = merged.get(key) ?? [];
    const first = candidates.find((candidate) => !matches || matches(candidate, entry));
    if (!first) {
      const copy = { ...entry };
      const pages = pagesOf(copy);
      if (pages.length > 0) copy.pages = pages;
      seed?.(copy);
      merged.set(key, [...candidates, copy]);
      result.push(copy);
      continue;
    }
    const pages = [...new Set([...pagesOf(first), ...pagesOf(entry)])].sort(
      (a, b) => a - b,
    );
    if (pages.length > 0) {
      if (typeof entry.page === "number" && entry.page === pages[0] &&
          first.page !== pages[0]) {
        for (const key of ["sourceText", "evidenceUnitId", "sourceStart", "sourceEnd"]) {
          if (entry[key] === undefined) delete first[key];
          else first[key] = entry[key];
        }
      }
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
    absorb?.(first, entry);
  }
  return result as T[];
}

function hasNegation(text: string): boolean {
  return /\b(?:not|no|never|none|neither|nor|without|cannot)\b|n't/i.test(text);
}

function editDistance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    previous = current;
  }
  return previous[b.length];
}

/** Shortest answer text compared by wording; below this only an exact match counts. */
const ANSWER_MIN_FUZZY_LENGTH = 3;
/** Share of the longer answer's text that must be unchanged for two answers to match. */
const ANSWER_SIMILARITY = 0.85;
/** Fewest words an answer needs before its meaning, rather than its wording, is compared. */
const PARAPHRASE_MIN_TOKENS = 3;

/** Answers that differ on a number or on negation state different facts, however close their wording. */
export function answersConflict(left: string, right: string): boolean {
  const numbers = (text: string) =>
    normaliseTerm(text).split(" ").filter((token) => /\d/.test(token)).join(" ");
  return numbers(left) !== numbers(right) || hasNegation(left) !== hasNegation(right);
}

function isOrderedSubsequence(shorter: string[], longer: string[]): boolean {
  let next = 0;
  for (const token of longer) {
    if (token === shorter[next]) next += 1;
  }
  return next === shorter.length;
}

/**
 * Whether two answers to the same question say the same thing, judged on their
 * words rather than their exact text: case, punctuation and plurals are
 * ignored, one answer may be a fuller version of the other, and small wording
 * differences are tolerated. Word order matters, since reordering a statement
 * can reverse it. Answers that disagree on a number or on negation never
 * match, however close their wording.
 */
export function answersAreSimilar(left: string, right: string): boolean {
  const leftTokens = normaliseTerm(left).split(" ").filter(Boolean);
  const rightTokens = normaliseTerm(right).split(" ").filter(Boolean);
  if (leftTokens.length === 0 || rightTokens.length === 0) return false;
  const leftText = leftTokens.join(" ");
  const rightText = rightTokens.join(" ");
  if (leftText === rightText) return true;

  if (answersConflict(left, right)) return false;
  // A short answer has too little text for a small difference to be wording.
  if (Math.min(leftText.length, rightText.length) < ANSWER_MIN_FUZZY_LENGTH) return false;

  const [shorter, longer] =
    leftTokens.length <= rightTokens.length ? [leftTokens, rightTokens] : [rightTokens, leftTokens];
  if (isOrderedSubsequence(shorter, longer)) return true;

  const distance = editDistance(leftText, rightText);
  return 1 - distance / Math.max(leftText.length, rightText.length) >= ANSWER_SIMILARITY;
}

function questionIdentity(entry: Record<string, unknown>): string | undefined {
  if (!firstString(entry, ["answer"])) return undefined;
  const subject = firstString(entry, ["subject"]);
  const field = firstString(entry, ["field"]);
  const identity =
    subject && field ? [subject, field] : [firstString(entry, ["prompt"])];
  if (identity.some((part) => !part)) return undefined;
  return identity.map(normaliseTerm).join("\u0000");
}

export interface QuestionMergeOptions {
  /** Whether two answers to one question mean the same although worded differently. */
  sameMeaning?: (left: string, right: string) => boolean;
}

/**
 * Merges questions that state the same fact: the same subject and field with
 * answers that are similar in wording (see `answersAreSimilar`) or, when
 * `sameMeaning` is given, in meaning. A fact repeated on several pages is kept
 * once. The merged question keeps the lowest `page` and always lists every
 * source page in `pages`; a differently worded answer is kept as an accepted
 * answer rather than dropped.
 */
export function mergeDuplicateQuestions<T>(
  questions: T[],
  { sameMeaning }: QuestionMergeOptions = {},
): T[] {
  return mergeDuplicates(questions, questionIdentity, {
    matches: (first, entry) => {
      const left = firstString(first, ["answer"]);
      const right = firstString(entry, ["answer"]);
      return answersAreSimilar(left, right) || (sameMeaning?.(left, right) ?? false);
    },
    absorb: (first, entry) => {
      const variant = firstString(entry, ["answer"]);
      const known = [firstString(first, ["answer"]), ...(Array.isArray(first.accept) ? first.accept : [])];
      if (known.some((answer) => typeof answer === "string" && normaliseTerm(answer) === normaliseTerm(variant))) {
        return;
      }
      first.accept = [...(Array.isArray(first.accept) ? first.accept : []), variant];
    },
  });
}

export type EmbedTexts = (texts: string[]) => Promise<number[][]>;

/**
 * Cosine similarity at which two answers count as a paraphrase of each other,
 * for the 384-dimension MiniLM vectors the embeddings Lambda produces. Measured
 * on that model: genuine paraphrases score about 0.68 to 0.80, answers that
 * differ only in a number or in negation score 0.9 and above (and are kept apart
 * by `answersConflict`), and unrelated answers score below 0.5. 0.75 merges the
 * paraphrases in a real 1,800-question extraction without merging any distinct
 * fact. Re-measure before changing the embedding model.
 */
export const PARAPHRASE_SIMILARITY = 0.75;
/**
 * Cosine similarity at which two definitions of one term describe the same
 * sense. Deliberately stricter than `PARAPHRASE_SIMILARITY`: this comparison
 * exists to avoid overwriting a distinct sense, not to join entries, so a
 * borderline pair should stay as two occurrences rather than collapse into
 * one. Measured on MiniLM definitions: genuine restatements score 0.865 and
 * above (Golgi apparatus/Golgi complex 0.958, plasma membrane/cell membrane
 * 0.865), while terms that must stay apart peak at 0.823 (prokaryotic/
 * eukaryotic cell, endocytosis/exocytosis).
 */
export const DEFINITION_SIMILARITY = 0.85;
/** Embedding batch size; answers are short, so this keeps each Lambda response small. */
const EMBED_BATCH_SIZE = 64;

export function cosineSimilarity(left: number[], right: number[]): number {
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftNorm += left[index] ** 2;
    rightNorm += right[index] ** 2;
  }
  return leftNorm === 0 || rightNorm === 0 ? 0 : dot / Math.sqrt(leftNorm * rightNorm);
}

/**
 * `mergeDuplicateQuestions` that also merges paraphrased answers: within each
 * subject and field whose answers differ, the answers are embedded and those
 * whose vectors are close enough are treated as one fact. Only answers that can
 * be confused with another answer to the same question are embedded.
 *
 * Short answers (names, numbers, single values) are compared on their wording
 * only, and answers that disagree on a number or on negation never merge.
 */
async function embedAll(texts: string[], embed: EmbedTexts): Promise<Map<string, number[]>> {
  const vectors = new Map<string, number[]>();
  for (let start = 0; start < texts.length; start += EMBED_BATCH_SIZE) {
    const batch = texts.slice(start, start + EMBED_BATCH_SIZE);
    const embedded = await embed(batch);
    if (embedded.length !== batch.length) {
      throw new Error(`Embedding returned ${embedded.length} vectors for ${batch.length} answers`);
    }
    batch.forEach((text, index) => vectors.set(text, embedded[index]));
  }
  return vectors;
}

function isCloseEnough(
  vectors: Map<string, number[]>,
  left: string,
  right: string,
  threshold: number,
): boolean {
  const leftVector = vectors.get(left);
  const rightVector = vectors.get(right);
  return (
    leftVector !== undefined &&
    rightVector !== undefined &&
    !answersConflict(left, right) &&
    cosineSimilarity(leftVector, rightVector) >= threshold
  );
}

export async function mergeDuplicateQuestionsByMeaning<T>(
  questions: T[],
  embed: EmbedTexts,
  threshold: number = PARAPHRASE_SIMILARITY,
): Promise<T[]> {
  const answersByQuestion = new Map<string, Map<string, string>>();
  for (const question of questions) {
    const entry = asRecord(question);
    const key = entry && questionIdentity(entry);
    if (!entry || !key) continue;
    const answer = firstString(entry, ["answer"]);
    const answers = answersByQuestion.get(key) ?? new Map<string, string>();
    answers.set(normaliseTerm(answer), answer);
    answersByQuestion.set(key, answers);
  }
  const needed = [
    ...new Set(
      [...answersByQuestion.values()]
        .filter((answers) => answers.size > 1)
        .flatMap((answers) => [...answers.values()])
        .filter((answer) => normaliseTerm(answer).split(" ").length >= PARAPHRASE_MIN_TOKENS),
    ),
  ];
  if (needed.length < 2) return mergeDuplicateQuestions(questions);

  const vectors = await embedAll(needed, embed);
  return mergeDuplicateQuestions(questions, {
    sameMeaning: (left, right) => isCloseEnough(vectors, left, right, threshold),
  });
}

function textList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

/** One sense of a term: its definition and every passage and page showing it. */
function occurrenceOf(entry: Record<string, unknown>): Record<string, unknown> {
  const definition = firstString(entry, ["definition"]);
  const context = firstString(entry, ["context"]);
  const pages = pagesOf(entry);
  return {
    ...(definition ? { definition } : {}),
    ...(context ? { contexts: [context] } : {}),
    ...(pages.length > 0 ? { pages } : {}),
  };
}

export interface VocabularyMergeOptions {
  /** Whether two definitions of one term describe the same sense although worded differently. */
  sameMeaning?: (left: string, right: string) => boolean;
}

/**
 * Merges vocabulary entries for the same term. The term is the only thing that
 * joins two entries: a term has one entry listing every page it appears on,
 * however its definitions are worded.
 *
 * Definitions are compared only to decide whether a definition restates one
 * already recorded or describes a different sense, so that a distinct sense is
 * never overwritten by a synonym of another. They are never compared as exact
 * text, never join entries, and never split a term into two.
 *
 * Each sense is kept in `occurrences` with every passage showing it, so the
 * term can be shown in context wherever it appears. The entry's own
 * `definition` and `context` repeat its first sense.
 */
export function mergeDuplicateVocabulary<T>(
  entries: T[],
  { sameMeaning }: VocabularyMergeOptions = {},
): T[] {
  const alike = (left: string, right: string) =>
    answersAreSimilar(left, right) || (sameMeaning?.(left, right) ?? false);

  const merged = mergeDuplicates(
    entries,
    (entry) => {
      const term = firstString(entry, ["word", "term"]);
      return term ? normaliseTerm(term) : undefined;
    },
    {
      seed: (first) => {
        const occurrence = occurrenceOf(first);
        if (Object.keys(occurrence).length > 0) first.occurrences = [occurrence];
      },
      absorb: (first, entry) => {
        const definition = firstString(entry, ["definition"]);
        const context = firstString(entry, ["context"]);
        if (!definition && !context) return;

        // The entry's own fields show its first sense, so fill them from the
        // first appearance that actually defines the term.
        if (!firstString(first, ["definition"]) && definition) {
          first.definition = definition;
          if (context) first.context = context;
        }

        const occurrences = Array.isArray(first.occurrences)
          ? (first.occurrences as Array<Record<string, unknown>>)
          : [];
        const sense = occurrences.find((occurrence) =>
          alike(firstString(occurrence, ["definition"]), definition),
        );
        if (!sense) {
          first.occurrences = [...occurrences, occurrenceOf(entry)];
          return;
        }
        const pages = [...new Set([...pagesOf(sense), ...pagesOf(entry)])].sort((a, b) => a - b);
        if (pages.length > 0) sense.pages = pages;
        const contexts = textList(sense.contexts);
        if (context && !contexts.some((shown) => answersAreSimilar(shown, context))) {
          sense.contexts = [...contexts, context];
        }
        if (!firstString(sense, ["definition"]) && definition) sense.definition = definition;
      },
    },
  );

  // A term with one sense shown in one passage is fully described by the
  // entry's own fields, so listing that sense again would only repeat it.
  for (const value of merged) {
    const entry = asRecord(value);
    const occurrences = entry && Array.isArray(entry.occurrences)
      ? (entry.occurrences as Array<Record<string, unknown>>)
      : undefined;
    if (entry && occurrences?.length === 1 && textList(occurrences[0].contexts).length <= 1) {
      delete entry.occurrences;
    }
  }
  return merged;
}

/**
 * `mergeDuplicateVocabulary` that also recognises definitions which mean the
 * same although worded differently, so one is not kept as a separate sense of
 * the term. Only terms defined more than once are embedded, and only their
 * definitions are compared, so a term is never joined to a different term.
 */
export async function mergeDuplicateVocabularyByMeaning<T>(
  entries: T[],
  embed: EmbedTexts,
  threshold: number = DEFINITION_SIMILARITY,
): Promise<T[]> {
  const definitionsByTerm = new Map<string, Map<string, string>>();
  for (const value of entries) {
    const entry = asRecord(value);
    const term = entry && firstString(entry, ["word", "term"]);
    const definition = entry ? firstString(entry, ["definition"]) : "";
    if (!entry || !term || !definition) continue;
    const key = normaliseTerm(term);
    const definitions = definitionsByTerm.get(key) ?? new Map<string, string>();
    definitions.set(normaliseTerm(definition), definition);
    definitionsByTerm.set(key, definitions);
  }
  const needed = [
    ...new Set(
      [...definitionsByTerm.values()]
        .filter((definitions) => definitions.size > 1)
        .flatMap((definitions) => [...definitions.values()])
        .filter((definition) => normaliseTerm(definition).split(" ").length >= PARAPHRASE_MIN_TOKENS),
    ),
  ];
  if (needed.length < 2) return mergeDuplicateVocabulary(entries);

  const vectors = await embedAll(needed, embed);
  return mergeDuplicateVocabulary(entries, {
    sameMeaning: (left, right) => isCloseEnough(vectors, left, right, threshold),
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
          options,
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
  const facts = results.flatMap((result, index) => (result?.facts ?? []).flatMap((fact) => {
    const anchor = fact.page === pages[index].pageNumber ? locateEvidence(pages[index], fact.sourceText) : undefined;
    if (!anchor) {
      (result!.reviewWarnings ??= []).push(entryReviewWarning(
        "question",
        fact.subject,
        fact.field,
        ["its quotation is not found exactly once on the page it names"],
      ));
      const unanchored = { ...fact };
      delete unanchored.evidenceUnitId;
      delete unanchored.sourceStart;
      delete unanchored.sourceEnd;
      return [unanchored];
    }
    return [{ ...fact, ...anchor }];
  }));
  const vocabulary = dedupeVocabulary(
    extractedPages.flatMap((result) => result.vocabulary),
  );

  const uncoveredLines = results.flatMap((result, index) =>
    (result?.uncoveredLines ?? []).map((line) => ({
      page: pages[index].pageNumber,
      line,
    })),
  );
  const reviewWarnings = results.flatMap((result, index) =>
    (result?.reviewWarnings ?? []).map((message) => ({
      page: pages[index].pageNumber,
      message,
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
    ...(reviewWarnings.length > 0 ? { reviewWarnings } : {}),
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
  if (!isHybridVocabulary(options.vocabularySelection)) {
    return analyzePagesCore(openai, pages, fileID, documentID, options);
  }
  if (options.vocabularySelection === "hybrid-native" && !options.vocabularyCandidates) {
    throw new Error("Native vocabulary requires a precomputed document-wide shortlist");
  }
  const candidates = options.vocabularyCandidates ?? selectVocabulary(pages);
  const result = await analyzePagesCore(openai, pages, fileID, documentID, {
    ...options, vocabularyCandidates: candidates,
  });
  const reviewWarnings = [...(result.reviewWarnings ?? [])];
  const vocabularyJSON = candidates.map((candidate) => {
    const generated = result.vocabularyJSON.find((entry) =>
      typeof entry.word === "string" && entry.word.normalize("NFKC").toLowerCase() === candidate.term.normalize("NFKC").toLowerCase() &&
      entry.page === candidate.page,
    );
    const definition = candidate.sourceDefinition ??
      (typeof generated?.definition === "string" ? generated.definition : "");
    if (!definition.trim()) {
      reviewWarnings.push({ page: candidate.page,
        message: `Vocabulary "${candidate.term}" needs a human-written definition; the model did not provide one` });
    }
    return { word: candidate.term, definition, context: candidate.sourceText, page: candidate.page };
  });
  const unselected = result.vocabularyJSON.filter((entry) => !candidates.some((candidate) =>
    typeof entry.word === "string" && entry.word.normalize("NFKC").toLowerCase() === candidate.term.normalize("NFKC").toLowerCase() &&
    entry.page === candidate.page));
  if (unselected.length) console.warn(`[analyzePages] Dropped ${unselected.length} vocabulary entries outside the deterministic shortlist`);
  if (reviewWarnings.length > (result.reviewWarnings?.length ?? 0)) {
    console.warn("[analyzePages] Deterministically selected vocabulary includes missing definitions requiring human review");
  }
  return { ...result, vocabularyJSON, ...(reviewWarnings.length ? { reviewWarnings } : {}) };
}

async function analyzePagesCore(
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
  const reviewWarnings: Array<{ page: number; message: string }> = [];
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
                  content: `Extract vocabulary, summaries, objectives, concepts, and atomic claims from educational text. Return JSON: {
  vocabularyJSON: [{word, definition, context, page}],
  summariesJSON: [{title, content, page_range}],
  objectivesJSON: [{objective, bloom_level}],
  conceptsJSON: [{concept, description, related_vocabulary}],
  factsJSON: [{subject, field, answer, accept: [], page, sourceText}]
}

${exhaustivePrompt("content")}
Do not render questions: code renders one recall question per atomic claim.

Include the page number in all extracted items.${vocabularyInstructions({
  ...options, vocabularyCandidates: options.vocabularyCandidates?.filter((candidate) =>
    batch.some((page) => page.pageNumber === candidate.page)),
})}`,
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
          if (!Array.isArray(batchContent.factsJSON)) {
            throw new Error("Standard extraction must return atomic factsJSON");
          }
          const questions: ReturnType<typeof toQuestion>[] = [];
          for (const raw of batchContent.factsJSON as unknown[]) {
            const fact = asRecord(raw);
            if (!fact || typeof fact.subject !== "string" || !fact.subject.trim() ||
                typeof fact.field !== "string" || !fact.field.trim() ||
                typeof fact.answer !== "string" || !fact.answer.trim() ||
                typeof fact.sourceText !== "string" || typeof fact.page !== "number" ||
                !Array.isArray(fact.accept) || !fact.accept.every((item) => typeof item === "string")) {
              throw new Error("Invalid atomic claim in standard extraction");
            }
            const page = batch.find((item) => item.pageNumber === fact.page);
            const anchor = page ? locateEvidence(page, fact.sourceText) : undefined;
            if (!anchor || (page && checkPageFacts(page, [{
              subject: fact.subject, field: fact.field, answer: fact.answer,
              sourceText: fact.sourceText, page: fact.page, accept: [],
            }]).suspect.length)) {
              reviewWarnings.push({ page: page?.pageNumber ?? batch[0].pageNumber,
                message: "An atomic claim lacks exact source support and requires human review." });
            }
            questions.push(toQuestion({
              subject: fact.subject, field: fact.field, answer: fact.answer,
              sourceText: fact.sourceText, page: fact.page, accept: fact.accept as string[], ...anchor,
            }));
          }
          batchContent.questionsJSON = questions;
          for (const page of batch) {
            const missing = uncoveredEvidenceUnits(page, questions.map((question) => ({
              ...question, accept: question.accept ?? [],
            })));
            if (missing.length) reviewWarnings.push({ page: page.pageNumber,
              message: `${missing.length} source evidence units have no anchored claim; standard mode does not repair coverage. This is not a measure of complete fact recall.` });
          }

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
    ...(reviewWarnings.length ? { reviewWarnings } : {}),
  };
}
