import { describe, expect, it } from "vitest";
import {
  passesGate, scoreExtraction, scoreExtractionByContent, type ThothGroundTruth,
} from "../../integration/thoth/scoreExtraction";

const groundTruth: ThothGroundTruth = {
  source: { filename: "fixture.pdf", pages: 4, sha256: "fixture" },
  cards: [{
    key: "trump-ix-the-hermit", title: "The Hermit", subtitle: "Virgo", group: "trump",
    frontPage: 3, backPage: 4,
    facts: [
      { field: "hebrewLetter", value: "Yod", accept: ["Yod (Y)"], required: true },
      { field: "number", value: "IX", required: true },
      { field: "sourceDefectFact", value: "Defect", required: true, sourceDefect: true },
      { field: "optional", value: "Extra", required: false },
    ],
  }],
  vocabulary: [], pageIndex: { 3: ["trump-ix-the-hermit"], 4: ["trump-ix-the-hermit"] },
};
const score = (questions: Array<Record<string, unknown>>) =>
  scoreExtractionByContent(groundTruth, { questions, words: [] });

describe("scoreExtractionByContent", () => {
  it("anchors a value whose question names the card, whatever the extractor called the field", () => {
    const report = score([{ subject: "Hermit Trump", field: "Hebrew", answer: "י Yod (Y)", pages: [4] }]);
    expect(report.counts).toMatchObject({ anchored: 1, absent: 1 });
    expect(report.totalFacts).toBe(2);
    expect(report.anchoredRecall).toBe(0.5);
  });

  it("names the card from the prompt or source text when there is no subject", () => {
    const report = score([{ prompt: "Which letter is The Hermit?", answer: "Yod", sourceText: "x", pages: [3] }]);
    expect(report.counts.anchored).toBe(1);
  });

  it("does not anchor a value to a neighbouring card", () => {
    const report = score([{ subject: "The Magus", field: "Hebrew", answer: "Yod", pages: [4] }]);
    expect(report.counts).toMatchObject({ anchored: 0, onPage: 1 });
    expect(report.answeredRecall).toBe(0.5);
    expect(report.anchoredRecall).toBe(0);
  });

  it("separates a value found only in a source quotation", () => {
    const report = score([{ subject: "Kether", field: "Crown", answer: "unity", sourceText: "IX Hermit Yod", pages: [4] }]);
    expect(report.counts.sourceOnly).toBe(1);
    expect(report.sourcedRecall).toBeGreaterThan(report.answeredRecall);
  });

  it("ignores questions from other pages", () => {
    const report = score([{ subject: "The Hermit", field: "Hebrew", answer: "Yod", pages: [9] }]);
    expect(report.counts.anchored).toBe(0);
  });

  it("requires a short value to be the whole answer", () => {
    const short: ThothGroundTruth = {
      ...groundTruth,
      cards: [{ ...groundTruth.cards[0], facts: [{ field: "path", value: "12", required: true }] }],
    };
    const near = scoreExtractionByContent(short, {
      questions: [{ subject: "The Hermit", answer: "Paths 112 and 120", pages: [3] }], words: [],
    });
    const exact = scoreExtractionByContent(short, {
      questions: [{ subject: "The Hermit", answer: "12", pages: [3] }], words: [],
    });
    expect(near.counts.anchored).toBe(0);
    expect(exact.counts.anchored).toBe(1);
  });

  it("lists every fact that is not anchored and never affects the strict gate", () => {
    const extracted = { questions: [{ subject: "Hermit Trump", field: "Hebrew", answer: "Yod", pages: [4] }], words: [] };
    const report = scoreExtractionByContent(groundTruth, extracted);
    expect(report.misses).toEqual([
      { card: "trump-ix-the-hermit", field: "number", expected: "IX", tier: "absent" },
    ]);
    expect(passesGate(scoreExtraction(groundTruth, extracted))).toBe(false);
  });
});
