import { describe, expect, it } from "vitest";
import {
  flaggedFirst,
  groupReviewWarnings,
  readReviewWarnings,
  warningsForQuestion,
  warningsForWord,
} from "../../src/utils/reviewWarnings";
import { entryReviewWarning } from "../../amplify/functions/documentAnalysis/analysis";

const warnings = [
  'Page 1: question "Robert Hooke" (first observed cells): Claim requires a unique exact source anchor',
  'Page 2: question "Chloroplasts" (description): answer_not_in_source; Claim requires a source anchor',
  'Page 2: vocabulary "Chloroplasts" (definition): Definition does not match the source',
  "Page 1: Review missing source coverage: Cell structure",
  "Page 1: factsReviewed must be 26",
];

describe("readReviewWarnings", () => {
  it("reads warnings from metadata held as an object or as a JSON string", () => {
    const metadata = { analysis: { reviewWarnings: ["a", 2, "b"] } };
    expect(readReviewWarnings(metadata)).toEqual(["a", "b"]);
    expect(readReviewWarnings(JSON.stringify(metadata))).toEqual(["a", "b"]);
  });

  it("returns nothing for metadata that is missing, unreadable or has no warnings", () => {
    expect(readReviewWarnings(undefined)).toEqual([]);
    expect(readReviewWarnings("{not json")).toEqual([]);
    expect(readReviewWarnings({ analysis: {} })).toEqual([]);
  });
});

describe("groupReviewWarnings", () => {
  it("counts each entry a warning names once, and keeps the rest for the document", () => {
    const grouped = groupReviewWarnings(warnings);
    expect(grouped.flaggedCount).toBe(3);
    expect(grouped.document).toEqual([
      "Page 1: Review missing source coverage: Cell structure",
      "Page 1: factsReviewed must be 26",
    ]);
  });

  it("keeps the page with the reason so the warning still says where it came from", () => {
    const grouped = groupReviewWarnings(warnings);
    expect(warningsForQuestion(grouped, { subject: "Chloroplasts", field: "description" })).toEqual([
      "Page 2: answer_not_in_source; Claim requires a source anchor",
    ]);
  });

  it("gathers every warning about a term, whichever field each one checked", () => {
    const grouped = groupReviewWarnings([
      'vocabulary "Path" (definition): Definition does not match the source',
      'vocabulary "Paths" (context): Context is not quoted from the page',
    ]);
    expect(warningsForWord(grouped, "path")).toHaveLength(2);
  });

  it("does not confuse a question with a vocabulary entry of the same name", () => {
    const grouped = groupReviewWarnings(warnings);
    expect(warningsForWord(grouped, "Chloroplasts")).toEqual([
      "Page 2: Definition does not match the source",
    ]);
  });

  it("reports nothing for an entry no warning names", () => {
    const grouped = groupReviewWarnings(warnings);
    expect(warningsForWord(grouped, "Nucleus")).toEqual([]);
    expect(warningsForQuestion(grouped, { subject: "Nucleus", field: "definition" })).toEqual([]);
    expect(warningsForQuestion(grouped, {})).toEqual([]);
  });
});

describe("flaggedFirst", () => {
  it("lists flagged entries first, leaving the order within each group alone", () => {
    const grouped = groupReviewWarnings(warnings);
    const entries = [
      { word: "Nucleus" },
      { word: "Chloroplasts" },
      { word: "Cytoplasm" },
    ];
    expect(
      flaggedFirst(entries, (entry) => warningsForWord(grouped, entry.word)).map(
        ({ entry, warnings: found }) => [entry.word, found.length],
      ),
    ).toEqual([
      ["Chloroplasts", 1],
      ["Nucleus", 0],
      ["Cytoplasm", 0],
    ]);
  });
});

describe("entryReviewWarning", () => {
  it("writes a warning the review UI attaches to its entry and counts", () => {
    const warning = entryReviewWarning("question", "Robert Hooke", "observation", [
      "its quotation is not found exactly once in the page text",
    ]);
    expect(warning).toBe(
      'question "Robert Hooke" (observation): its quotation is not found exactly once in the page text',
    );

    // The analysis prefixes the page, exactly as the workflow stores it.
    const grouped = groupReviewWarnings([`Page 1: ${warning}`]);
    expect(grouped.document).toEqual([]);
    expect(grouped.flaggedCount).toBe(1);
    expect(
      warningsForQuestion(grouped, { subject: "Robert Hooke", field: "observation" }),
    ).toEqual(["Page 1: its quotation is not found exactly once in the page text"]);
  });

  it("never embeds the claim as JSON", () => {
    const warning = entryReviewWarning("question", "Prokaryotic cells", "size", [
      "it claims page 3 but was extracted from page 1",
      "answer_not_in_source",
    ]);
    expect(warning).not.toContain("{");
    expect(warning).toBe(
      'question "Prokaryotic cells" (size): it claims page 3 but was extracted from page 1; answer_not_in_source',
    );
  });

  it("stays parseable when the subject itself contains a quote", () => {
    const warning = entryReviewWarning("vocabulary", 'the "cell" theory', "definition", [
      "no definition",
    ]);
    const grouped = groupReviewWarnings([warning]);
    expect(grouped.flaggedCount).toBe(1);
    // Normalisation drops the quotes on both sides, so the entry still matches.
    expect(warningsForWord(grouped, "the cell theory")).toEqual(["no definition"]);
  });

  it("says so plainly when there is no subject to attach the warning to", () => {
    const warning = entryReviewWarning("question", "  ", "", ["it names no subject"]);
    expect(warning).toBe(
      "A question was dropped because it names no subject: it names no subject",
    );
    expect(groupReviewWarnings([warning]).flaggedCount).toBe(0);
  });
});
