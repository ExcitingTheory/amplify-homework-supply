// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { analyzePages, normaliseQuestionEntries } from "../../amplify/functions/documentAnalysis/analysis";
import { locateEvidence, sourceEvidenceUnits, uncoveredEvidenceUnits } from "../../amplify/functions/documentAnalysis/evidence";
import { loadBiologyGroundTruth } from "../fixtures/biology/groundTruth";
import { scoreClaimCoverage } from "../support/scoreClaimCoverage";

const nucleus = "The nucleus contains DNA. The nucleus has a double membrane.";
const membrane = "The membrane regulates transport.";
const page = { pageNumber: 3, text: `# Cells\n\n## Nucleus\n\n${nucleus}\n\n## Membrane\n\n${membrane}\n` };
const fact = (sourceText: string, subject = "Nucleus", field = "contains", answer = "DNA") =>
  ({ subject, field, answer, accept: [], page: 3, sourceText });
const completion = (facts: unknown[], sourcePage = 3) => ({
  choices: [{ finish_reason: "stop", message: { content: JSON.stringify({ facts, vocabulary: [],
    checklist: { sourcePage, factsReviewed: facts.length, vocabularyReviewed: 0,
      vocabularyEvidenceChecked: true, coverageReviewed: true, missingSourceLines: [] } }) } }],
});

describe("source-derived evidence and atomic claim rendering", () => {
  it("preserves headings, lists, exact text, stable IDs and page-local UTF-16 offsets", () => {
    const units = sourceEvidenceUnits(page);
    expect(units).toHaveLength(2);
    expect(units[0].headingPath).toEqual(["Cells", "Nucleus"]);
    expect(units[1].headingPath).toEqual(["Cells", "Membrane"]);
    expect(sourceEvidenceUnits(page)).toEqual(units);
    for (const unit of units) expect(page.text.slice(unit.start, unit.end)).toBe(unit.text);
    const biology = loadBiologyGroundTruth();
    const biologyUnits = sourceEvidenceUnits({ pageNumber: 1, text: biology.text });
    for (const unit of biology.units) {
      expect(biologyUnits.find((entry) => entry.start === unit.start)?.text).toBe(unit.text);
    }
    expect(biologyUnits.find((unit) => unit.text.startsWith("**Cell Theory**"))?.text).toContain("\n3.");
    expect(sourceEvidenceUnits({ pageNumber: 1, text: "Mitochondria produce ATP" })[0].text)
      .toBe("Mitochondria produce ATP");
    const nested = sourceEvidenceUnits({ pageNumber: 1,
      text: "### Deep\n\nEvidence exists.\n\n## Parent\n\nMore evidence exists." });
    expect(nested.map((unit) => unit.headingPath)).toEqual([["Deep"], ["Parent"]]);
  });
  it("rejects paraphrased, ambiguous and wrong-page evidence without claiming full recall", () => {
    expect(locateEvidence(page, "The nucleus contains genetic material.")).toBeUndefined();
    expect(locateEvidence(page, "The nucleus")).toBeUndefined();
    expect(uncoveredEvidenceUnits(page, [{ ...fact(nucleus), page: 2 }])).toHaveLength(2);
    expect(uncoveredEvidenceUnits(page, [fact("DNA")])).toHaveLength(1);
    // Touching a unit is not complete recall of its several claims.
    expect(uncoveredEvidenceUnits(page, [fact(nucleus)])).toHaveLength(1);
  });
  it("rejects partial, negative or inconsistent internal evidence spans at normalization", () => {
    const question = { ...fact(nucleus), prompt: "What does the nucleus contain?" };
    expect(() => normaliseQuestionEntries([{ ...question, sourceStart: 0 }])).toThrow("evidence anchor");
    expect(() => normaliseQuestionEntries([{ ...question, sourceStart: -1 }])).toThrow("sourceStart");
    expect(() => normaliseQuestionEntries([{ ...question, evidenceUnitId: "unit", sourceStart: 0, sourceEnd: 1 }]))
      .toThrow("evidence anchor");
  });
  it("repairs only the missing prose unit and renders claims after extraction", async () => {
    const create = vi.fn().mockResolvedValueOnce(completion([fact(nucleus)]))
      .mockResolvedValueOnce(completion([fact(membrane, "Membrane", "regulates", "transport")]));
    const result = await analyzePages({ chat: { completions: { create } } }, [page], "file", "document", { profile: "exhaustive" });
    expect(create).toHaveBeenCalledTimes(2);
    const repair = create.mock.calls[1][0].messages;
    expect(repair[0].content).toContain("targeted gap-fill");
    expect(repair[1].content.split("Page text (the only source of evidence):")[1].trim()).toBe(membrane);
    expect(result.questionsJSON).toHaveLength(2);
    for (const question of normaliseQuestionEntries(result.questionsJSON)) {
      expect(page.text.slice(question.sourceStart as number, question.sourceEnd as number)).toBe(question.sourceText);
      expect(question.evidenceUnitId).toMatch(/^evidence-/);
      expect(question.prompt).toBe(`What is ${question.field} for ${question.subject}?`);
    }
  });
  it("retains wrong-page claims for human review without a trusted anchor after bounded repairs", async () => {
    const create = vi.fn().mockResolvedValue(completion([{ ...fact(nucleus), page: 9 }]));
    const result = await analyzePages({ chat: { completions: { create } } }, [page], "file", "document", { profile: "exhaustive" });
    expect(create).toHaveBeenCalledTimes(3);
    expect(result.questionsJSON[0]).toMatchObject({ page: 9, sourceText: nucleus });
    expect(result.questionsJSON[0].evidenceUnitId).toBeUndefined();
    expect(result.reviewWarnings?.length).toBeGreaterThan(0);
    expect(result.uncoveredLines?.length).toBeGreaterThan(0);
  });
  it("bounds prose gap-fill batches and reports all remaining source units honestly", async () => {
    const text = Array.from({ length: 16 }, (_, index) => `Cells in sample ${index} contain DNA.`).join("\n\n");
    const create = vi.fn().mockResolvedValue(completion([]));
    const result = await analyzePages({ chat: { completions: { create } } },
      [{ pageNumber: 3, text }], "file", "document", { profile: "exhaustive" });
    expect(create).toHaveBeenCalledTimes(9); // One initial extraction plus at most eight gap batches.
    expect(result.questionsJSON).toEqual([]);
    expect(new Set(result.uncoveredLines?.map(({ line }) => line)).size).toBe(16);
    expect(result.reviewWarnings?.some(({ message }) => message.includes("budget exhausted"))).toBe(true);
  });
  it("reanchors split-page claims to the full page rather than fragment-local offsets", async () => {
    const bigPage = { pageNumber: 3,
      text: `${nucleus} ${"Additional context. ".repeat(20)}\n\n${membrane} ${"More context. ".repeat(20)}` };
    const create = vi.fn().mockResolvedValueOnce({
      choices: [{ finish_reason: "length", message: { content: "" } }],
    }).mockImplementation(async (request) => {
      const source = request.messages[1].content.split("Page text (the only source of evidence):")[1];
      return completion(source.includes(nucleus) ? [fact(nucleus)] :
        [fact(membrane, "Membrane", "regulates", "transport")]);
    });
    const result = await analyzePages({ chat: { completions: { create } } },
      [bigPage], "file", "document", { profile: "exhaustive" });
    expect(create).toHaveBeenCalledTimes(3);
    const repaired = result.questionsJSON.find((question) => question.subject === "Membrane");
    expect(repaired.sourceStart).toBe(bigPage.text.indexOf(membrane));
    expect(bigPage.text.slice(repaired.sourceStart, repaired.sourceEnd)).toBe(membrane);
  });
  it("uses the same atomic contract in standard mode without generating long essay answers", async () => {
    const create = vi.fn().mockResolvedValue({
      choices: [{ finish_reason: "stop", message: { content: JSON.stringify({
        factsJSON: [fact(nucleus)], vocabularyJSON: [], summariesJSON: [], objectivesJSON: [], conceptsJSON: [],
      }) } }],
    });
    const result = await analyzePages({ chat: { completions: { create } } }, [page], "file", "document", { profile: "standard" });
    expect(result.questionsJSON[0]).toMatchObject({ subject: "Nucleus", field: "contains", answer: "DNA",
      questionType: "recall", evidenceUnitId: expect.stringMatching(/^evidence-/) });
    expect(result.reviewWarnings?.[0].message).toContain("does not repair coverage");
  });
  it("wires a mocked biology prose omission through repair, question rendering and independent annotated scoring", async () => {
    const biology = loadBiologyGroundTruth();
    const unit = biology.units.find((entry) => entry.id === "microscope")!;
    const claims = biology.claims.filter((entry) => entry.evidence.unitId === unit.id).map((claim) => ({
      ...claim, evidence: { ...claim.evidence, start: 0, end: unit.text.length },
    }));
    const corpus = {
      pages: [{ pageNumber: 1, text: unit.text }], units: [{ ...unit, page: 1, start: 0, end: unit.text.length }], claims,
    };
    const create = vi.fn().mockResolvedValueOnce(completion([], 1))
      .mockResolvedValueOnce(completion(claims.map((claim) => ({
        subject: claim.subject, field: claim.predicate, answer: claim.object,
        sourceText: claim.evidence.quote, accept: [], page: 1,
      })), 1));
    const result = await analyzePages({ chat: { completions: { create } } }, corpus.pages, "file", "document", { profile: "exhaustive" });
    expect(scoreClaimCoverage(corpus, []).claimRecall).toBe(0);
    expect(scoreClaimCoverage(corpus, result.questionsJSON)).toMatchObject({
      requiredClaims: 3, matchedClaims: 3, claimRecall: 1, evidenceUnitCoverage: 1,
    });
    expect(create).toHaveBeenCalledTimes(2);
    // Controlled mocks prove repair/scoring wiring, not a measured model recall gain.
  });
});
