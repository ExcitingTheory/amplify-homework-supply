import { describe, expect, it } from "vitest";
import { diagnoseExtraction, passesGate, scoreExtraction, type ThothGroundTruth } from "../../integration/thoth/scoreExtraction";

const groundTruth: ThothGroundTruth = {
  source: { filename: "fixture.pdf", pages: 2, sha256: "fixture" },
  cards: [{ key: "card", title: "Test card", subtitle: "", group: "reference",
    frontPage: 1, backPage: 2, facts: [{ field: "path", value: "12", required: true }] }],
  vocabulary: [], pageIndex: { 1: ["card"], 2: ["card"] },
};
const question = { subject: "Test card", field: "path", answer: "12", page: 1 };

describe("strict extraction mismatch diagnostics", () => {
  it.each([
    ["subject", { subject: "Other card" }],
    ["field", { field: "location" }],
    ["answer", { answer: "13" }],
    ["page", { page: 5 }],
  ] as const)("identifies a %s mismatch without granting recall", (key, change) => {
    const extracted = { questions: [{ ...question, ...change }], words: [] };
    const diagnostic = diagnoseExtraction(groundTruth, extracted);
    expect(diagnostic.strict).toEqual(scoreExtraction(groundTruth, extracted));
    expect(diagnostic.strict.factRecall).toBe(0);
    expect(passesGate(diagnostic.strict)).toBe(false);
    expect(diagnostic.counts[key]).toBe(1);
    expect(diagnostic.mismatches[0].candidates[0][key]).toBe(false);
  });
  it("reports combined values among near misses without changing the existing answer matcher", () => {
    const extracted = { questions: [{ ...question, field: "description", answer: "12 and Mercury" }], words: [] };
    const report = diagnoseExtraction(groundTruth, extracted);
    expect(report.counts.combinedValue).toBe(1);
    expect(report.strict.factRecall).toBe(0);
    expect(report.strict).toEqual(scoreExtraction(groundTruth, extracted));
  });
  it("bounds candidate output and reports facts with no plausible candidate", () => {
    const report = diagnoseExtraction(groundTruth, { questions: [], words: [] }, 1);
    expect(report.counts.noCandidate).toBe(1);
    expect(() => diagnoseExtraction(groundTruth, { questions: [], words: [] }, 0)).toThrow();
  });
});
