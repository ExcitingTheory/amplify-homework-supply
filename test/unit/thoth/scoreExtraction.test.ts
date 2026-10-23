import { describe, it, expect } from "vitest";
import {
  scoreExtraction,
  passesGate,
  normalise,
  tokenSetRatio,
  type ThothGroundTruth,
  type ExtractionInput,
} from "../../integration/thoth/scoreExtraction";
import groundTruthFixture from "../../fixtures/thoth/thoth-ground-truth.json";

function miniGroundTruth(): ThothGroundTruth {
  return {
    source: { filename: "mock.pdf", pages: 10, sha256: "deadbeef" },
    cards: [
      {
        key: "trump-i-the-magus",
        group: "trump",
        frontPage: 3,
        backPage: 4,
        title: "The Magus",
        subtitle: "Mercury",
        facts: [
          {
            field: "hebrewLetter",
            value: "Beth",
            accept: ["Beth (B)", "B"],
            required: true,
          },
          { field: "path", value: "12", required: true },
          { field: "attribution", value: "Mercury", required: true },
        ],
      },
      {
        key: "trump-ii-the-priestess",
        group: "trump",
        frontPage: 3,
        backPage: 4,
        title: "The Priestess",
        subtitle: "Moon",
        facts: [{ field: "path", value: "13", required: true }],
      },
    ],
    vocabulary: [
      { term: "Mercury", set: "planets", definition: "mind and message" },
      {
        term: "Aleph",
        set: "hebrewLetters",
        definition: "Hebrew letter",
        aliases: ["Aleph (A)", "A"],
      },
    ],
    pageIndex: {
      3: ["trump-i-the-magus", "trump-ii-the-priestess"],
      4: ["trump-i-the-magus", "trump-ii-the-priestess"],
    },
  };
}

function factQuestion(
  subject: string,
  field: string,
  answer: string,
  page = 4,
) {
  return {
    prompt: `${subject} — ${field}?`,
    subject,
    field,
    answer,
    page,
  };
}

describe("scoreExtraction", () => {
  it("scores a perfect match as full recall with no gaps", () => {
    const gt = miniGroundTruth();
    const extracted: ExtractionInput = {
      questions: [
        factQuestion("The Magus", "hebrewLetter", "Beth (B)"),
        factQuestion("The Magus", "path", "12"),
        factQuestion("The Magus", "attribution", "Mercury"),
        factQuestion("The Priestess", "path", "13"),
      ],
      words: [
        { term: "Mercury", definition: "mind and message", page: 4 },
        { term: "Aleph", definition: "Hebrew letter", page: 4 },
      ],
    };

    const report = scoreExtraction(gt, extracted);

    expect(report.factRecall).toBe(1);
    expect(report.vocabRecall).toBe(1);
    expect(report.missingFacts).toEqual([]);
    expect(report.missingVocab).toEqual([]);
    expect(report.duplicates).toBe(0);
  });

  it("reports a missing fact when no extracted item answers it", () => {
    const gt = miniGroundTruth();
    const extracted: ExtractionInput = {
      questions: [
        factQuestion("The Magus", "hebrewLetter", "Beth (B)"),
        // path and attribution omitted
        factQuestion("The Priestess", "path", "13"),
      ],
      words: [
        { term: "Mercury", page: 4 },
        { term: "Aleph", page: 4 },
      ],
    };

    const report = scoreExtraction(gt, extracted);

    expect(report.factRecall).toBeLessThan(1);
    expect(report.missingFacts).toEqual(
      expect.arrayContaining([
        { card: "trump-i-the-magus", field: "path", expected: "12" },
        {
          card: "trump-i-the-magus",
          field: "attribution",
          expected: "Mercury",
        },
      ]),
    );
    expect(passesGate(report)).toBe(false);
  });

  it("matches via the accept[] list and via fuzzy token-set ratio", () => {
    const gt = miniGroundTruth();
    const extracted: ExtractionInput = {
      questions: [
        // "B" is in accept[] for hebrewLetter
        factQuestion("The Magus", "hebrewLetter", "B"),
        factQuestion("The Magus", "path", "12"),
        // reordered / extra words should still match via token-set ratio
        factQuestion("The Magus", "attribution", "the planet Mercury"),
        factQuestion("The Priestess", "path", "13"),
      ],
      words: [
        { term: "Mercury", page: 4 },
        { term: "Aleph (A)", page: 4 }, // alias form
      ],
    };

    const report = scoreExtraction(gt, extracted);

    expect(report.factRecall).toBe(1);
    expect(report.vocabRecall).toBe(1);
  });

  it("does not let an out-of-scope answer satisfy a different card's fact", () => {
    const gt = miniGroundTruth();
    const extracted: ExtractionInput = {
      questions: [
        // "13" answers Priestess's path, scoped only to Priestess by text — must not
        // satisfy Magus's hebrewLetter/attribution/path facts.
        factQuestion("The Priestess", "path", "13"),
      ],
      words: [],
    };

    const report = scoreExtraction(gt, extracted);

    expect(report.missingFacts.map((m) => m.card)).toEqual(
      expect.arrayContaining(["trump-i-the-magus"]),
    );
    // Priestess's own path fact is satisfied
    expect(
      report.missingFacts.find((m) => m.card === "trump-ii-the-priestess"),
    ).toBeUndefined();
  });

  it("counts duplicates when multiple extracted items answer the same fact", () => {
    const gt = miniGroundTruth();
    const extracted: ExtractionInput = {
      questions: [
        factQuestion("The Magus", "path", "12"),
        factQuestion("The Magus", "path", "12"),
        factQuestion("The Magus", "hebrewLetter", "Beth"),
        factQuestion("The Magus", "attribution", "Mercury"),
        factQuestion("The Priestess", "path", "13"),
      ],
      words: [{ term: "Mercury" }, { term: "Aleph" }],
    };

    const report = scoreExtraction(gt, extracted);

    expect(report.factRecall).toBe(1);
    expect(report.duplicates).toBe(1);
  });

  it("flags unmatched extracted items (precision signal, does not gate)", () => {
    const gt = miniGroundTruth();
    const extracted: ExtractionInput = {
      questions: [
        factQuestion("The Magus", "hebrewLetter", "Beth"),
        factQuestion("The Magus", "path", "12"),
        factQuestion("The Magus", "attribution", "Mercury"),
        factQuestion("The Priestess", "path", "13"),
        { prompt: "Totally unrelated trivia", answer: "banana", page: 4 },
      ],
      words: [
        { term: "Mercury" },
        { term: "Aleph" },
        { term: "Unrelated term" },
      ],
    };

    const report = scoreExtraction(gt, extracted);

    expect(report.factRecall).toBe(1);
    expect(report.unmatchedExtracted).toBe(2); // "banana" question + "Unrelated term" word
  });

  it("does not let a different card on the same page satisfy a fact", () => {
    const gt = miniGroundTruth();
    const extracted: ExtractionInput = {
      questions: [factQuestion("The Priestess", "path", "12")],
      words: [],
    };

    const report = scoreExtraction(gt, extracted);

    expect(report.missingFacts).toContainEqual({
      card: "trump-i-the-magus",
      field: "path",
      expected: "12",
    });
  });

  it("does not let a different field on the same card satisfy a fact", () => {
    const gt = miniGroundTruth();
    const extracted: ExtractionInput = {
      questions: [
        factQuestion("The Magus", "attribution", "12"),
        factQuestion("The Magus", "hebrewLetter", "Beth"),
        factQuestion("The Magus", "attribution", "Mercury"),
        factQuestion("The Priestess", "path", "13"),
      ],
      words: [],
    };

    const report = scoreExtraction(gt, extracted);

    expect(report.missingFacts).toContainEqual({
      card: "trump-i-the-magus",
      field: "path",
      expected: "12",
    });
  });

  it("does not require a known source defect for full recall", () => {
    const gt = miniGroundTruth();
    gt.source.pages = 4;
    gt.cards[0].facts.push({
      field: "knownSourceDefect",
      value: "unavailable",
      required: true,
      sourceDefect: true,
    });
    const extracted: ExtractionInput = {
      questions: [
        factQuestion("The Magus", "hebrewLetter", "Beth"),
        factQuestion("The Magus", "path", "12"),
        factQuestion("The Magus", "attribution", "Mercury"),
        factQuestion("The Priestess", "path", "13"),
      ],
      words: [
        { term: "Mercury", page: 1 },
        { term: "Aleph", page: 3 },
      ],
    };

    const report = scoreExtraction(gt, extracted);

    expect(report.factRecall).toBe(1);
    expect(report.missingFacts).toEqual([]);
    expect(passesGate(report)).toBe(true);
  });

  it("supports legacy prompts only when they name both the card and field", () => {
    const gt = miniGroundTruth();
    const extracted: ExtractionInput = {
      questions: [
        {
          prompt: "The Magus — path?",
          answer: "12",
          page: 4,
        },
      ],
      words: [],
    };

    const report = scoreExtraction(gt, extracted);

    expect(report.missingFacts).toContainEqual({
      card: "trump-i-the-magus",
      field: "attribution",
      expected: "Mercury",
    });
    expect(report.missingFacts).not.toContainEqual({
      card: "trump-i-the-magus",
      field: "path",
      expected: "12",
    });
  });

  it("reports missing pages but always excludes page 2 (intentionally blank)", () => {
    const gt = miniGroundTruth();
    gt.source.pages = 4;
    const extracted: ExtractionInput = {
      questions: [{ prompt: "x", answer: "12", page: 4 }],
      words: [],
    };

    const report = scoreExtraction(gt, extracted);

    // Page 1 and 3 have no extracted items referencing them -> missing. Page 2 excluded.
    expect(report.pageCoverage.missing).toEqual([1, 3]);
    expect(passesGate(report)).toBe(false);
  });
});

describe("passesGate", () => {
  const base = {
    vocabRecall: 1,
    factRecall: 1,
    pageCoverage: { missing: [] as number[] },
    missingFacts: [],
    missingVocab: [],
    duplicates: 0,
    unmatchedExtracted: 0,
  };

  it("passes when recall is complete and no pages are missing", () => {
    expect(passesGate(base)).toBe(true);
  });

  it("fails when factRecall is below 1", () => {
    expect(passesGate({ ...base, factRecall: 0.99 })).toBe(false);
  });

  it("fails when vocabRecall is below 1", () => {
    expect(passesGate({ ...base, vocabRecall: 0.99 })).toBe(false);
  });

  it("fails when pages are missing", () => {
    expect(passesGate({ ...base, pageCoverage: { missing: [7] } })).toBe(false);
  });
});

describe("normalise / tokenSetRatio", () => {
  it("normalise strips diacritics, punctuation and case", () => {
    expect(normalise("Tzaddi (Tz)!")).toBe("tzaddi tz");
    expect(normalise("  Café   ")).toBe("cafe");
  });

  it("normalises regular and irregular plural forms to singular", () => {
    expect(normalise("Cards, categories, classes, Sephiroth")).toBe(
      "card category class sephira",
    );

    const gt = miniGroundTruth();
    gt.vocabulary.push({
      term: "category",
      set: "terms",
      definition: "A class or group",
    });
    const report = scoreExtraction(gt, {
      questions: [
        factQuestion("The Magus", "hebrewLetter", "Beth"),
        factQuestion("The Magus", "path", "12"),
        factQuestion("The Magus", "attribution", "Mercury"),
        factQuestion("The Priestess", "path", "13"),
      ],
      words: [
        { term: "Mercury", page: 4 },
        { term: "Aleph", page: 4 },
        { term: "Categories", page: 4 },
      ],
    });
    expect(report.vocabRecall).toBe(1);
  });

  it("tokenSetRatio is 1 for identical normalised strings", () => {
    expect(tokenSetRatio("Mercury", "mercury")).toBe(1);
  });

  it("tokenSetRatio is high for reordered/partial overlap", () => {
    expect(
      tokenSetRatio("the planet Mercury", "Mercury"),
    ).toBeGreaterThanOrEqual(0.9);
  });

  it("tokenSetRatio is low for unrelated strings", () => {
    expect(tokenSetRatio("Mercury", "Saturn")).toBeLessThan(0.9);
  });
});

describe("thoth-ground-truth.json fixture", () => {
  const gt = groundTruthFixture as unknown as ThothGroundTruth;

  it("has exactly 100 cards across the expected groups", () => {
    expect(gt.cards).toHaveLength(100);
    const counts = gt.cards.reduce<Record<string, number>>((acc, c) => {
      acc[c.group] = (acc[c.group] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts).toEqual({
      trump: 22,
      ace: 4,
      small: 36,
      court: 16,
      reference: 22,
    });
  });

  it("has a 40-term glossary plus the other documented vocabulary sets", () => {
    const glossaryCount = gt.vocabulary.filter(
      (v) => v.set === "glossary",
    ).length;
    expect(glossaryCount).toBe(40);
  });

  it("indexes every page 1-52 except page 2 to at least one card", () => {
    for (let p = 1; p <= 52; p++) {
      if (p === 2) {
        expect(
          gt.pageIndex[String(p) as unknown as number] ?? gt.pageIndex[p],
        ).toEqual([]);
      } else {
        expect(
          (gt.pageIndex[String(p) as unknown as number] ?? gt.pageIndex[p])
            .length,
        ).toBeGreaterThan(0);
      }
    }
  });

  it("marks the known page-42 Tetragrammaton font defect as sourceDefect", () => {
    const card = gt.cards.find((c) => c.key === "ref-four-suits-worlds")!;
    const fact = card.facts.find(
      (fct) => fct.field === "tetragrammatonLetters",
    )!;
    expect(fact.sourceDefect).toBe(true);
  });
});
