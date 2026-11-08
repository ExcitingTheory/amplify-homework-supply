// @vitest-environment node
import { describe, expect, it } from "vitest";
import { loadBiologyGroundTruth } from "../fixtures/biology/groundTruth";
import { scoreClaimCoverage, type ClaimCorpus, type ClaimQuestion } from "../support/scoreClaimCoverage";

function fixture(): ClaimCorpus {
  const biology = loadBiologyGroundTruth();
  return { pages: [{ pageNumber: 1, text: biology.text }],
    units: biology.units.map((unit) => ({ ...unit, page: 1 })), claims: biology.claims };
}
function question(claim = fixture().claims[0]): ClaimQuestion {
  return { subject: claim.subject, field: claim.predicate, answer: claim.object, page: 1,
    sourceText: claim.evidence.quote, sourceStart: claim.evidence.start, sourceEnd: claim.evidence.end };
}

describe("annotated claim and evidence scoring", () => {
  it("scores all 171 required biology claims independently from 47 evidence units", () => {
    const corpus = fixture();
    const report = scoreClaimCoverage(corpus, corpus.claims.map((claim) => question(claim)));
    expect(report).toMatchObject({ requiredClaims: 171, matchedClaims: 171, claimRecall: 1,
      requiredEvidenceUnits: 47, matchedEvidenceUnits: 47, evidenceUnitCoverage: 1,
      duplicates: 0, unmatchedQuestions: 3 });
  });
  it.each([
    { subject: "Mitochondria" }, { field: "lacks" }, { answer: "not the basic unit of life" },
    { page: 2 }, { page: 2, pages: [1] }, { page: undefined, pages: [] }, { sourceText: "Unrelated source evidence." },
    { sourceStart: 0 }, { sourceEnd: 1 }, { sourceText: "is" },
    { subject: undefined, field: undefined },
  ])("rejects wrong or absent identity, answer, page or evidence (%j)", (change) => {
    expect(scoreClaimCoverage(fixture(), [{ ...question(), ...change }]).matchedClaims).toBe(0);
  });
  it("cannot turn one correct claim into complete recall of its evidence unit", () => {
    const report = scoreClaimCoverage(fixture(), [question()]);
    expect(report.matchedClaims).toBe(1);
    expect(report.matchedEvidenceUnits).toBe(1);
    expect(report.claimRecall).toBeCloseTo(1 / 171);
    expect(report.evidenceUnitCoverage).toBeCloseTo(1 / 47);
  });
  it("accepts only explicitly authored aliases and still requires anchored evidence", () => {
    const corpus = fixture();
    corpus.claims = [{ ...corpus.claims[0], aliases: {
      subjects: ["Cell"], predicates: ["constitutes"], objects: ["life's basic unit"],
    } }];
    const candidate = { ...question(corpus.claims[0]), subject: "Cell", field: "constitutes", answer: "life's basic unit" };
    expect(scoreClaimCoverage(corpus, [candidate]).claimRecall).toBe(1);
    expect(scoreClaimCoverage(corpus, [{ ...candidate, sourceText: "fabricated" }]).claimRecall).toBe(0);
  });
  it("does not grant credit for a combined answer or model-provided accept[]", () => {
    expect(scoreClaimCoverage(fixture(), [{ ...question(), answer: `${question().answer}; proteins` }]).claimRecall).toBe(0);
    const candidate = { ...question(), answer: "incorrect", accept: [question().answer] };
    expect(scoreClaimCoverage(fixture(), [candidate]).claimRecall).toBe(0);
  });
  it("reports duplicates and fails closed on tampered annotations", () => {
    expect(scoreClaimCoverage(fixture(), [question(), question()])).toMatchObject({ matchedClaims: 1, duplicates: 1 });
    const corpus = fixture();
    corpus.claims[0] = { ...corpus.claims[0], evidence: { ...corpus.claims[0].evidence, start: 0 } };
    expect(() => scoreClaimCoverage(corpus, [])).toThrow("Invalid annotated claim");
  });
});
