/**
 * Offline annotated-claim scorer. No answer-only, fuzzy or inferred aliases.
 * The default evidence contract is the complete authored quote; shorter quotes
 * must be explicitly annotated as alternatives by the fixture author.
 */
export interface AnnotatedClaim {
  id: string;
  subject: string;
  predicate: string;
  object: string;
  required: boolean;
  evidence: { unitId: string; quote: string; start: number; end: number };
  aliases?: { subjects?: string[]; predicates?: string[]; objects?: string[]; quotes?: string[] };
}

export interface AnnotatedEvidenceUnit {
  id: string;
  page: number;
  text: string;
  start: number;
  end: number;
}

export interface ClaimCorpus {
  pages: Array<{ pageNumber: number; text: string }>;
  units: AnnotatedEvidenceUnit[];
  claims: AnnotatedClaim[];
}

export interface ClaimQuestion {
  subject?: string;
  field?: string;
  answer?: string;
  sourceText?: string;
  page?: number | null;
  pages?: number[];
  sourceStart?: number;
  sourceEnd?: number;
}

const canonical = (value: string) => value.normalize("NFKC").toLowerCase().replace(/\s+/gu, " ").trim();
const matches = (value: string | undefined, expected: string, aliases: string[] = []) =>
  typeof value === "string" && value.trim().length > 0 &&
  [expected, ...aliases].some((alias) => canonical(value) === canonical(alias));

export function scoreClaimCoverage(corpus: ClaimCorpus, questions: ClaimQuestion[]) {
  const pages = new Map(corpus.pages.map((page) => [page.pageNumber, page.text]));
  const units = new Map(corpus.units.map((unit) => [unit.id, unit]));
  if (pages.size !== corpus.pages.length || units.size !== corpus.units.length ||
      new Set(corpus.claims.map((claim) => claim.id)).size !== corpus.claims.length) {
    throw new Error("Corpus page, evidence unit and claim IDs must be unique");
  }
  for (const unit of corpus.units) {
    if (!Number.isInteger(unit.page) || unit.page < 1 ||
        !Number.isInteger(unit.start) || !Number.isInteger(unit.end) || unit.start < 0 ||
        unit.end <= unit.start || !unit.text.trim() ||
        pages.get(unit.page)?.slice(unit.start, unit.end) !== unit.text) {
      throw new Error(`Invalid source span for evidence unit ${unit.id}`);
    }
  }
  for (const claim of corpus.claims) {
    const unit = units.get(claim.evidence.unitId);
    if (!unit || !claim.subject.trim() || !claim.predicate.trim() || !claim.object.trim() ||
        !Number.isInteger(claim.evidence.start) || !Number.isInteger(claim.evidence.end) ||
        !claim.evidence.quote.trim() || claim.evidence.start < unit.start ||
        claim.evidence.end > unit.end ||
        pages.get(unit.page)?.slice(claim.evidence.start, claim.evidence.end) !== claim.evidence.quote) {
      throw new Error(`Invalid annotated claim ${claim.id}`);
    }
    if (claim.aliases?.quotes?.some((quote) => !quote.trim() || !claim.evidence.quote.includes(quote))) {
      throw new Error(`Invalid alternative evidence quote for ${claim.id}`);
    }
  }
  const required = corpus.claims.filter((claim) => claim.required);
  const expectedUnits = new Set(required.map((claim) => claim.evidence.unitId));
  const matchedUnits = new Set<string>();
  const matchedQuestionIndices = new Set<number>();
  const missingClaimIds: string[] = [];
  let duplicates = 0;
  for (const claim of required) {
    const unit = units.get(claim.evidence.unitId)!;
    let count = 0;
    questions.forEach((question, index) => {
      if (!matches(question.subject, claim.subject, claim.aliases?.subjects) ||
          !matches(question.field, claim.predicate, claim.aliases?.predicates) ||
          !matches(question.answer, claim.object, claim.aliases?.objects)) return;
      const questionPages = question.pages?.length ? question.pages : [question.page];
      if (question.page != null && (!Number.isInteger(question.page) ||
          question.page < 1 || !questionPages.includes(question.page))) return;
      if (questionPages.some((page) => !Number.isInteger(page) || (page ?? 0) < 1)) return;
      if (!questionPages.includes(unit.page) || !question.sourceText ||
          ![claim.evidence.quote, ...(claim.aliases?.quotes ?? [])].includes(question.sourceText)) return;
      const pageText = pages.get(unit.page)!;
      const quote = question.sourceText;
      const hasOffsets = question.sourceStart !== undefined || question.sourceEnd !== undefined;
      if (hasOffsets && (question.sourceStart === undefined || question.sourceEnd === undefined)) return;
      const start = question.sourceStart ?? pageText.indexOf(quote);
      const end = question.sourceEnd ?? start + quote.length;
      if (!Number.isInteger(start) || !Number.isInteger(end) || start < claim.evidence.start ||
          end > claim.evidence.end || end - start !== quote.length ||
          pageText.slice(start, end) !== quote ||
          (!hasOffsets && pageText.indexOf(quote, start + 1) >= 0)) return;
      count += 1;
      matchedUnits.add(unit.id);
      matchedQuestionIndices.add(index);
    });
    if (!count) missingClaimIds.push(claim.id);
    duplicates += Math.max(0, count - 1);
  }
  return {
    requiredClaims: required.length,
    matchedClaims: required.length - missingClaimIds.length,
    claimRecall: required.length ? (required.length - missingClaimIds.length) / required.length : 0,
    requiredEvidenceUnits: expectedUnits.size,
    matchedEvidenceUnits: matchedUnits.size,
    evidenceUnitCoverage: expectedUnits.size ? matchedUnits.size / expectedUnits.size : 0,
    missingClaimIds,
    missingEvidenceUnitIds: [...expectedUnits].filter((id) => !matchedUnits.has(id)),
    duplicates,
    unmatchedQuestions: questions.length - matchedQuestionIndices.size,
  };
}
