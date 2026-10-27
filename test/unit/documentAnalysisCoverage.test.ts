import { describe, expect, it } from "vitest";
import {
  candidateIsCovered,
  extractCoverageCandidates,
  type ExhaustiveFact,
} from "../../amplify/functions/documentAnalysis/analysis";
import { joinPdfTextItems } from "../../amplify/functions/documentAnalysis/textExtraction";

function fact(answer: string, sourceText: string): ExhaustiveFact {
  return {
    subject: "The Hanged Man",
    field: "f",
    answer,
    accept: [],
    page: 10,
    sourceText,
  };
}

function candidateFor(line: string) {
  const [candidate] = extractCoverageCandidates({ pageNumber: 10, text: line });
  if (!candidate) throw new Error(`No candidate for ${line}`);
  return candidate;
}

describe("joinPdfTextItems", () => {
  it("starts a new line when the baseline moves and keeps same-line items together", () => {
    const text = joinPdfTextItems([
      { str: "Hebrew:", transform: [1, 0, 0, 1, 10, 700], height: 9 },
      { str: "מ Mem (M)", transform: [1, 0, 0, 1, 60, 700], height: 9 },
      { str: "Path: 23", transform: [1, 0, 0, 1, 10, 688], height: 9 },
    ]);
    expect(text).toBe("Hebrew: מ Mem (M)\nPath: 23");
  });

  it("honours end-of-line markers and ignores tiny baseline jitter", () => {
    const text = joinPdfTextItems([
      { str: "Water", transform: [1, 0, 0, 1, 10, 700], height: 9 },
      { str: "(element)", transform: [1, 0, 0, 1, 40, 701], height: 9 },
      { str: "", hasEOL: true },
      { str: "next", transform: [1, 0, 0, 1, 10, 700], height: 9 },
    ]);
    expect(text).toBe("Water (element)\nnext");
  });

  it("returns an empty string for pages without text", () => {
    expect(joinPdfTextItems([{ str: "", hasEOL: true }])).toBe("");
  });
});

describe("candidateIsCovered", () => {
  it("treats a wrapped PDF line as covered by a fact that quotes the full sentence", () => {
    const candidate = candidateFor(
      "Briah (plane): Creative World — the heart-mind; formative feeling (Water /",
    );
    expect(
      candidateIsCovered(candidate, [
        fact(
          "Creative World — the heart-mind; formative feeling (Water / Heh)",
          "Briah (plane): Creative World — the heart-mind; formative feeling (Water / Heh).",
        ),
      ]),
    ).toBe(true);
  });

  it("requires every statement on a multi-statement line to be extracted", () => {
    const candidate = candidateFor(
      "Terms — Path : a Tree-line joining two Sephiroth · Overlay : a modern add-on — not in",
    );
    const path = fact(
      "a Tree-line joining two Sephiroth",
      "Path : a Tree-line joining two Sephiroth",
    );
    const overlay = fact(
      "a modern add-on — not in Crowley",
      "Overlay : a modern add-on — not in Crowley",
    );
    expect(candidateIsCovered(candidate, [path])).toBe(false);
    expect(candidateIsCovered(candidate, [path, overlay])).toBe(true);
  });

  it("counts the label carried by subject and field when a line is split into value-only facts", () => {
    const candidate = candidateFor(
      "♂ Mars (planet): force and drive; energy, aggression, courage.",
    );
    const split = (answer: string): ExhaustiveFact => ({
      subject: "Mars",
      field: "planet",
      answer,
      accept: [],
      page: 10,
      sourceText: answer,
    });
    expect(
      candidateIsCovered(candidate, [
        split("force and drive"),
        split("energy, aggression, courage"),
      ]),
    ).toBe(true);
    expect(candidateIsCovered(candidate, [split("force and drive")])).toBe(
      false,
    );
  });

  it("covers non-Latin lines instead of treating them as empty", () => {
    const candidate = candidateFor("挨拶: こんにちは、お元気ですか");
    expect(
      candidateIsCovered(candidate, [
        fact("こんにちは、お元気ですか", "挨拶: こんにちは、お元気ですか"),
      ]),
    ).toBe(true);
    expect(candidateIsCovered(candidate, [])).toBe(false);
  });

  it("folds irregular plurals when comparing terms", () => {
    const candidate = candidateFor("Children: the youngest members");
    expect(
      candidateIsCovered(candidate, [
        fact("the youngest member", "Child: the youngest member"),
      ]),
    ).toBe(true);
  });

  it("never counts a fact with the wrong answer as coverage", () => {
    const candidate = candidateFor("Path: 23 · Geburah–Hod");
    expect(
      candidateIsCovered(candidate, [fact("27", "Path: 23 · Geburah–Hod")]),
    ).toBe(false);
  });

  it("keeps exact matches covered and unrelated facts uncovered", () => {
    const candidate = candidateFor("Path: 23");
    expect(candidateIsCovered(candidate, [fact("23", "Path: 23")])).toBe(true);
    expect(
      candidateIsCovered(candidate, [fact("Water", "Water (element): feeling")]),
    ).toBe(false);
  });
});
