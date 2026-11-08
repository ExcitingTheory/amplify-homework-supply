import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  analyzePages,
  buildVerifierCandidates,
  checkPageFacts,
  completeVerificationVerdicts,
  chunkItemsByJsonSize,
  createPageBatches,
  extractCoverageCandidates,
  filterVerifiedEntries,
  isEquivalentText,
  answersAreSimilar,
  mergeDuplicateQuestions,
  mergeDuplicateQuestionsByMeaning,
  mergeDuplicateVocabulary,
  mergeDuplicateVocabularyByMeaning,
  normaliseQuestionEntries,
  retainDirectQuestionsWithVerifiedMatches,
  retainDirectVocabularyWithVerifiedMatches,
  resolveAnalysisProfile,
  resolveSkipAutoAnalysis,
  segmentTextIntoPages,
  splitTextInHalf,
  type ExhaustiveFact,
  VERIFIER_SYSTEM_PROMPT,
} from "../../amplify/functions/documentAnalysis/analysis";

describe("completeVerificationVerdicts", () => {
  it("preserves explicit verdicts and marks only missing candidates unverified", () => {
    const verdicts = completeVerificationVerdicts(["first", "second", "third"], [
      { index: 2, supported: false, reason: "Unsupported" },
      { index: 0, supported: true },
    ]);
    expect(verdicts).toEqual([
      { index: 2, supported: false, reason: "Unsupported" },
      { index: 0, supported: true },
      { index: 1, supported: false, reason: expect.stringContaining("Verifier omitted") },
    ]);
    expect(filterVerifiedEntries(["first", "second", "third"], verdicts)).toEqual(["first"]);
  });
  it.each([
    { verdicts: [{ index: 0, supported: true }, { index: 0, supported: false }] },
    { verdicts: [{ index: 2, supported: true }] },
    { verdicts: [{ index: -1, supported: true }] },
  ])("still rejects ambiguous or invalid indices (%j)", ({ verdicts }) => {
    expect(() => completeVerificationVerdicts(["candidate"], verdicts)).toThrow(
      "Verification verdicts must cover each candidate exactly once",
    );
  });
});

function structuredCompletion(
  result: { facts: unknown[]; vocabulary: unknown[]; checklist?: Record<string, unknown> },
  finishReason = "stop",
  page = 1,
) {
  return {
    choices: [
      {
        finish_reason: finishReason,
        message: { content: JSON.stringify({
          ...result,
          checklist: result.checklist ?? {
            sourcePage: page,
            factsReviewed: result.facts.length,
            vocabularyReviewed: result.vocabulary.length,
            vocabularyEvidenceChecked: true,
            coverageReviewed: true,
            missingSourceLines: [],
          },
        }) },
      },
    ],
  };
}

describe("document-analysis profiles and helpers", () => {
  it("defaults absent or invalid profiles to exhaustive and reports invalid values", () => {
    expect(resolveAnalysisProfile(undefined)).toEqual({ profile: "exhaustive" });
    expect(resolveAnalysisProfile({})).toEqual({ profile: "exhaustive" });
    expect(resolveAnalysisProfile({ analysisProfile: "exhaustive" })).toEqual({
      profile: "exhaustive",
    });
    expect(resolveAnalysisProfile('{"analysisProfile":"standard"}')).toEqual({
      profile: "standard",
    });
    expect(resolveAnalysisProfile({ analysisProfile: "unknown" })).toEqual({
      profile: "exhaustive",
      invalidValue: "unknown",
    });
    expect(resolveAnalysisProfile("{invalid")).toEqual({
      profile: "exhaustive",
      invalidValue: "{invalid",
    });
  });

  it("only suppresses S3 auto-analysis for an explicit skip flag", () => {
    expect(resolveSkipAutoAnalysis(undefined)).toEqual({ skip: false });
    expect(resolveSkipAutoAnalysis({ skipAutoAnalysis: true })).toEqual({
      skip: true,
    });
    expect(resolveSkipAutoAnalysis('{"skipAutoAnalysis":false}')).toEqual({
      skip: false,
    });
    expect(resolveSkipAutoAnalysis({ skipAutoAnalysis: "true" })).toEqual({
      skip: false,
      invalidValue: "true",
    });
    expect(resolveSkipAutoAnalysis("{invalid")).toEqual({
      skip: false,
      invalidValue: "{invalid",
    });
  });

  it("creates bounded page batches and rejects invalid batch sizes", () => {
    expect(createPageBatches([1, 2, 3, 4, 5], 2)).toEqual([
      [1, 2],
      [3, 4],
      [5],
    ]);
    expect(() => createPageBatches([1], 0)).toThrow(
      "pagesPerBatch must be a positive integer",
    );
  });

  it("splits text at a line boundary when possible and splits long lines safely", () => {
    expect(splitTextInHalf("one\ntwo\nthree\nfour")).toEqual([
      "one\ntwo",
      "three\nfour",
    ]);
    expect(splitTextInHalf("x".repeat(400))).toEqual([
      "x".repeat(200),
      "x".repeat(200),
    ]);
    expect(splitTextInHalf("")).toBeNull();
  });

  it("segments long text near paragraph boundaries without losing characters", () => {
    const text = [
      "a".repeat(1700),
      "b".repeat(1700),
      "c".repeat(1700),
      "d".repeat(1700),
    ].join("\n\n");

    const pages = segmentTextIntoPages(text);

    expect(pages.map(({ pageNumber }) => pageNumber)).toEqual([1, 2]);
    expect(pages[0].text).toBe(
      `${"a".repeat(1700)}\n\n${"b".repeat(1700)}\n\n`,
    );
    expect(pages.map(({ text: pageText }) => pageText).join("")).toBe(text);
    expect(pages.every(({ text: pageText }) => pageText.length <= 5250)).toBe(
      true,
    );
  });

  it("bounds long single-paragraph segments and preserves Unicode code points", () => {
    const text = "🔮".repeat(6000);
    const pages = segmentTextIntoPages(text);

    expect(pages.length).toBeGreaterThan(1);
    expect(pages.map(({ text: pageText }) => pageText).join("")).toBe(text);
    expect(
      pages.every(
        ({ text: pageText }) =>
          pageText.length >= 1750 && pageText.length <= 5250,
      ),
    ).toBe(true);
    expect(pages.map(({ pageNumber }) => pageNumber)).toEqual(
      pages.map((_, index) => index + 1),
    );
  });

  it("checks page facts, routes unsupported facts to suspects, and removes duplicates", () => {
    const page = { pageNumber: 2, text: "Path:\u00a0 12\nA line about cups." };
    const validFact: ExhaustiveFact = {
      subject: "The Magus",
      field: "Path",
      answer: "12",
      accept: [],
      page: 2,
      sourceText: "Path: 12",
    };
    const wrongPage = { ...validFact, page: 3 };
    const absentSource = { ...validFact, sourceText: "Path: 13", answer: "13" };
    const inferredAnswer = {
      ...validFact,
      answer: "The twelfth path",
    };

    expect(
      checkPageFacts(page, [
        validFact,
        { ...validFact },
        wrongPage,
        absentSource,
        inferredAnswer,
      ]),
    ).toEqual({
      facts: [validFact],
      suspect: [
        { fact: wrongPage, reasons: ["wrong_page"] },
        {
          fact: absentSource,
          reasons: ["source_not_on_page"],
        },
        {
          fact: inferredAnswer,
          reasons: ["answer_not_in_source"],
        },
      ],
    });

  });

  it("accepts equivalent quotation typography without relaxing evidence words", () => {
    const text = 'Lysosomes are the "recycling centers" of the cell.';
    const fact: ExhaustiveFact = {
      subject: "Lysosomes",
      field: "definition",
      answer: "the 'recycling centers' of the cell.",
      sourceText: text,
      page: 2,
      accept: [],
    };
    expect(checkPageFacts({ pageNumber: 2, text }, [fact]).suspect).toEqual([]);
    expect(
      checkPageFacts({ pageNumber: 2, text }, [
        { ...fact, answer: "the 'energy centers' of the cell." },
      ]).suspect[0].reasons,
    ).toContain("answer_not_in_source");
  });

  it("retains only verified entries and rejects incomplete or duplicate verdicts", () => {
    const entries = ["supported", "unsupported"];

    expect(
      filterVerifiedEntries(entries, [
        { index: 0, supported: true },
        { index: 1, supported: false },
      ]),
    ).toEqual(["supported"]);
    expect(() =>
      filterVerifiedEntries(entries, [{ index: 0, supported: true }]),
    ).toThrow("Verification verdicts must cover each candidate exactly once");
    expect(() =>
      filterVerifiedEntries(entries, [
        { index: 0, supported: true },
        { index: 0, supported: false },
      ]),
    ).toThrow("Verification verdicts must cover each candidate exactly once");
  });

  it("indexes verifier candidates so verdicts can reference them explicitly", () => {
    const fact = (answer: string): ExhaustiveFact => ({
      subject: "cell",
      field: "definition",
      answer,
      accept: [],
      page: 1,
      sourceText: answer,
    });

    expect(
      buildVerifierCandidates([
        { kind: "question", fact: fact("a") },
        { kind: "vocabulary", fact: fact("b") },
      ]).map(({ index, kind, answer }) => ({ index, kind, answer })),
    ).toEqual([
      { index: 0, kind: "question", answer: "a" },
      { index: 1, kind: "vocabulary", answer: "b" },
    ]);
    expect(VERIFIER_SYSTEM_PROMPT).toContain("exactly one verdict");
  });

  it("merges a fact repeated on several pages into one question listing every page", () => {
    const question = (page: number, accept: string[] = []) => ({
      prompt: "What is path for The Magus?",
      answer: "12",
      subject: "The Magus",
      field: "path",
      page,
      accept,
    });
    const other = { ...question(3), field: "attribution", answer: "Mercury" };

    const merged = mergeDuplicateQuestions([
      question(7, ["twelve"]),
      other,
      question(3, ["XII"]),
      question(5),
    ]);

    expect(merged).toEqual([
      {
        ...question(3),
        pages: [3, 5, 7],
        accept: ["twelve", "XII"],
      },
      { ...other, pages: [3] },
    ]);
    expect(normaliseQuestionEntries(merged)[0].pages).toEqual([3, 5, 7]);
  });

  it("keeps a question whose answer differs and leaves unkeyed entries alone", () => {
    const base = {
      prompt: "p",
      answer: "a",
      subject: "s",
      field: "f",
      page: 1,
    };
    expect(
      mergeDuplicateQuestions([base, { ...base, answer: "b", page: 2 }, "raw"]),
    ).toHaveLength(3);
  });

  it("records the source page even when nothing was merged", () => {
    expect(
      mergeDuplicateQuestions([
        { prompt: "p", answer: "a", subject: "s", field: "f", page: 6 },
        { prompt: "no key", page: 8 },
      ]),
    ).toEqual([
      { prompt: "p", answer: "a", subject: "s", field: "f", page: 6, pages: [6] },
      { prompt: "no key", page: 8, pages: [8] },
    ]);
  });

  it("does not merge distinct questions written in non-Latin scripts", () => {
    const question = (subject: string, field: string, answer: string, page: number) => ({
      prompt: `${subject} ${field}`,
      subject,
      field,
      answer,
      page,
    });
    const merged = mergeDuplicateQuestions([
      question("日本語", "挨拶", "こんにちは", 1),
      question("日本語", "別れ", "さようなら", 2),
      question("日本語", "挨拶", "こんにちは", 3),
      question("Ελληνικά", "χαιρετισμός", "γεια", 4),
    ]);
    expect(merged.map(({ answer }) => answer)).toEqual([
      "こんにちは",
      "さようなら",
      "γεια",
    ]);
    expect(merged[0].pages).toEqual([1, 3]);
  });

  it("keeps one entry per term, grouping its senses and every passage showing them", () => {
    expect(
      mergeDuplicateVocabulary([
        { word: "Path", definition: "A Tree-line joining two Sephiroth", context: "A path is a Tree-line joining two Sephiroth.", page: 9 },
        // The same sense worded differently: its passage joins the first sense.
        { word: "path", definition: "a tree line joining two sephiroth!", context: "Each path joins two Sephiroth.", page: 2 },
        { word: "Paths", definition: "A road for walkers", context: "A path is a road for walkers.", page: 4 },
        { word: "Sephira", definition: "A sphere", page: 3 },
      ]),
    ).toEqual([
      {
        word: "Path",
        definition: "A Tree-line joining two Sephiroth",
        context: "A path is a Tree-line joining two Sephiroth.",
        page: 2,
        pages: [2, 4, 9],
        occurrences: [
          {
            definition: "A Tree-line joining two Sephiroth",
            contexts: [
              "A path is a Tree-line joining two Sephiroth.",
              "Each path joins two Sephiroth.",
            ],
            pages: [2, 9],
          },
          {
            definition: "A road for walkers",
            contexts: ["A path is a road for walkers."],
            pages: [4],
          },
        ],
      },
      // One sense shown once, so the entry's own fields already describe it.
      { word: "Sephira", definition: "A sphere", page: 3, pages: [3] },
    ]);
  });

  it("fills a blank definition from a later appearance of the same term", () => {
    const [entry] = mergeDuplicateVocabulary([
      { word: "Cell", definition: "", context: "", page: 1 },
      { word: "Cell", definition: "The basic unit of life", context: "A cell is the basic unit of life.", page: 2 },
    ]) as Array<Record<string, any>>;
    expect(entry).toMatchObject({
      definition: "The basic unit of life",
      context: "A cell is the basic unit of life.",
      pages: [1, 2],
    });
  });

  it("merges definitions of one term that mean the same although worded differently", async () => {
    const vectors: Record<string, number[]> = {
      "Organelles that release energy from food": [1, 0, 0],
      "The parts of a cell that supply its power": [0.95, 0.1, 0],
      "A ring of protein around the cell": [0, 1, 0],
    };
    const embed = async (texts: string[]) => texts.map((text) => vectors[text] ?? [0, 0, 1]);
    const merged = (await mergeDuplicateVocabularyByMeaning([
      { word: "Mitochondria", definition: "Organelles that release energy from food", context: "c1", page: 1 },
      { word: "Mitochondria", definition: "The parts of a cell that supply its power", context: "c2", page: 2 },
      { word: "Mitochondria", definition: "A ring of protein around the cell", context: "c3", page: 3 },
    ], embed)) as Array<Record<string, any>>;

    expect(merged).toHaveLength(1);
    expect(merged[0].occurrences).toEqual([
      {
        definition: "Organelles that release energy from food",
        contexts: ["c1", "c2"],
        pages: [1, 2],
      },
      { definition: "A ring of protein around the cell", contexts: ["c3"], pages: [3] },
    ]);
  });

  it("compares definitions by meaning only when a term is defined more than once", async () => {
    const embedded: string[][] = [];
    const embed = async (texts: string[]) => {
      embedded.push(texts);
      return texts.map(() => [1, 0, 0]);
    };
    await mergeDuplicateVocabularyByMeaning([
      { word: "Cell", definition: "The basic unit of life", page: 1 },
      { word: "Nucleus", definition: "The control centre of the cell", page: 2 },
    ], embed);
    expect(embedded).toEqual([]);
  });

  it("merges questions whose answers are worded differently and keeps the variant as accepted", () => {
    const question = (answer: string, page: number) => ({
      prompt: "What is the Hebrew letter for The Hermit?",
      subject: "The Hermit",
      field: "hebrewLetter",
      answer,
      page,
      accept: [] as string[],
    });
    const merged = mergeDuplicateQuestions([
      question("Yod", 4),
      question("Yod (Y)", 3),
      question("yod", 9),
      question("Resh", 5),
    ]);
    expect(merged.map(({ answer }) => answer)).toEqual(["Yod", "Resh"]);
    expect(merged[0]).toMatchObject({ pages: [3, 4, 9], page: 3, accept: ["Yod (Y)"] });
  });

  it("does not merge answers that disagree on a number or on negation", () => {
    const question = (answer: string) => ({ prompt: "p", subject: "s", field: "f", answer, page: 1 });
    expect(mergeDuplicateQuestions([
      question("Path 12 joins Kether and Binah"),
      question("Path 13 joins Kether and Binah"),
    ])).toHaveLength(2);
    expect(mergeDuplicateQuestions([
      question("The nucleus contains DNA"),
      question("The nucleus does not contain DNA"),
    ])).toHaveLength(2);
  });

  it("keeps separate members of the same list as separate questions", () => {
    const question = (answer: string) => ({ prompt: "p", subject: "Eukaryotes", field: "members", answer, page: 1 });
    expect(mergeDuplicateQuestions([
      question("Animals"),
      question("Plants"),
      question("Fungi"),
    ])).toHaveLength(3);
  });

  it("compares answers on their words rather than their exact text", () => {
    expect(answersAreSimilar("The basic unit of life.", "basic unit of life")).toBe(true);
    expect(answersAreSimilar("energy converted into glucose", "glucose converted into energy")).toBe(false);
    expect(answersAreSimilar("The control centre of the cell", "The control center of the cell")).toBe(true);
    expect(answersAreSimilar("The nucleus stores DNA", "The ribosome makes protein")).toBe(false);
    expect(answersAreSimilar("a", "b")).toBe(false);
    expect(answersAreSimilar("", "")).toBe(false);
  });

  describe("paraphrased answers", () => {
    const question = (answer: string, page: number, field = "function") => ({
      prompt: `What is the ${field} of Mitochondria?`,
      subject: "Mitochondria",
      field,
      answer,
      page,
    });
    /** Stands in for the embedding model: each phrase maps to a fixed direction. */
    const vectors: Record<string, number[]> = {
      "Produces energy for the cell": [1, 0, 0],
      "Generates the cell's power supply": [0.9, 0.2, 0],
      "Makes proteins": [0, 1, 0],
      "Produces energy for 2 cells": [1, 0, 0],
      "Does not produce energy for the cell": [1, 0, 0],
    };
    let embedded: string[][] = [];
    const embed = async (texts: string[]) => {
      embedded.push(texts);
      return texts.map((text) => vectors[text] ?? [0, 0, 1]);
    };
    beforeEach(() => { embedded = []; });

    it("merges answers that mean the same although worded differently, keeping the variant as accepted", async () => {
      const merged = await mergeDuplicateQuestionsByMeaning([
        question("Produces energy for the cell", 2),
        question("Generates the cell's power supply", 5),
        question("Makes proteins", 6),
      ], embed);
      expect(merged.map(({ answer }) => answer)).toEqual(["Produces energy for the cell", "Makes proteins"]);
      expect(merged[0]).toMatchObject({ pages: [2, 5], accept: ["Generates the cell's power supply"] });
    });

    it("never merges answers that differ on a number or on negation, however close their vectors", async () => {
      const merged = await mergeDuplicateQuestionsByMeaning([
        question("Produces energy for the cell", 2),
        question("Produces energy for 2 cells", 3),
        question("Does not produce energy for the cell", 4),
      ], embed);
      expect(merged).toHaveLength(3);
    });

    it("only embeds answers that can be confused with another answer to the same question", async () => {
      await mergeDuplicateQuestionsByMeaning([
        question("Produces energy for the cell", 2),
        question("Produces energy for the cell", 3),
        question("Makes proteins", 4, "role"),
      ], embed);
      expect(embedded).toEqual([]);
    });

    it("compares short answers on their wording only", async () => {
      const merged = await mergeDuplicateQuestionsByMeaning([
        question("ATP", 2),
        question("Energy", 3),
      ], embed);
      expect(merged).toHaveLength(2);
      expect(embedded).toEqual([]);
    });

    it("rejects an embedder that returns the wrong number of vectors", async () => {
      await expect(mergeDuplicateQuestionsByMeaning([
        question("Produces energy for the cell", 2),
        question("Generates the cell's power supply", 3),
      ], async () => [[1, 0, 0]])).rejects.toThrow(/vectors for 2 answers/);
    });
  });

  it("matches direct entries only to equivalent verified facts", () => {
    expect(isEquivalentText("<p>What is a cell?</p>", "What is a cell?")).toBe(
      true,
    );
    expect(
      isEquivalentText("The basic unit of life.", "The basic unit of energy."),
    ).toBe(false);
    expect(isEquivalentText("A", "A")).toBe(false);
  });

  it("does not let unverified direct questions or vocabulary bypass page results", () => {
    const verifiedQuestions = [
      { prompt: "What is a cell?", answer: "The basic unit of life." },
    ];
    const directQuestions = [
      {
        prompt: "What is a cell?",
        answer: "The basic unit of life.",
        options: ["Cell", "Atom"],
      },
      { prompt: "What is a tissue?", answer: "A group of cells." },
    ];
    const verifiedVocabulary = [
      { word: "cell", definition: "The basic unit of life." },
    ];
    const directVocabulary = [
      { term: "cell", definition: "The basic unit of life." },
      { term: "tissue", definition: "A group of cells." },
    ];

    expect(
      retainDirectQuestionsWithVerifiedMatches(
        directQuestions,
        verifiedQuestions,
      ),
    ).toEqual([directQuestions[0]]);
    expect(
      retainDirectVocabularyWithVerifiedMatches(
        directVocabulary,
        verifiedVocabulary,
      ),
    ).toEqual([directVocabulary[0]]);
  });

  it("chunks synthesis items within a serialized JSON character budget", () => {
    const items = [{ value: "a".repeat(3) }, { value: "b".repeat(3) }];
    const chunks = chunkItemsByJsonSize(items, 17);

    expect(chunks).toEqual([[items[0]], [items[1]]]);
    expect(chunks.every((chunk) => JSON.stringify(chunk).length <= 17)).toBe(
      true,
    );
    expect(() => chunkItemsByJsonSize(items, 0)).toThrow(
      "maxCharacters must be a positive integer",
    );
    expect(() =>
      chunkItemsByJsonSize([{ value: "too large" }], 5),
    ).toThrow("A synthesis item exceeds the configured size limit");
  });

  it("extracts labelled lines and glossary-style definitions for coverage", () => {
    expect(
      extractCoverageCandidates({
        pageNumber: 4,
        text: [
          "FRONTS",
          "Path: 12",
          "Beth — Hebrew letter",
          "Aleph — Hebrew letter",
          "A sentence with no label.",
        ].join("\n"),
      }),
    ).toEqual([
      { field: "Path", answer: "12", sourceText: "Path: 12" },
      {
        field: "Beth",
        answer: "Hebrew letter",
        sourceText: "Beth — Hebrew letter",
      },
      {
        field: "Aleph",
        answer: "Hebrew letter",
        sourceText: "Aleph — Hebrew letter",
      },
    ]);
  });

  it("does not treat headings, titles or a lone dashed line as facts", () => {
    expect(
      extractCoverageCandidates({
        pageNumber: 1,
        text: [
          "CHAPTER 1: THE WATER CYCLE",
          "# Part 2: Overview",
          "Unit 3: Weather",
          "Correspondence flashcards — the full system for reading the deck",
          "Evaporation: water becomes vapor",
        ].join("\n"),
      }),
    ).toEqual([
      {
        field: "Evaporation",
        answer: "water becomes vapor",
        sourceText: "Evaporation: water becomes vapor",
      },
    ]);
  });

  it("keeps short all-caps labels and caseless-script lines as facts", () => {
    expect(
      extractCoverageCandidates({
        pageNumber: 1,
        text: "HP: 20\n挨拶: こんにちは、お元気ですか",
      }).map(({ sourceText }) => sourceText),
    ).toEqual(["HP: 20", "挨拶: こんにちは、お元気ですか"]);
  });

  it("only infers a front/back page role from a standalone marker line", () => {
    const hint = (text: string) => {
      const create = vi
        .fn()
        .mockResolvedValue(structuredCompletion({ facts: [], vocabulary: [] }));
      return analyzePages(
        { chat: { completions: { create } } },
        [{ pageNumber: 1, text }],
        "file-1",
        "document-1",
        { profile: "exhaustive" },
      ).then(() => create.mock.calls[0][0].messages[0].content as string);
    };
    return Promise.all([
      hint("BACK\nPath: 12"),
      hint("Front: The Magus\nPath: 12"),
      hint("Back to basics\nPath: 12"),
      hint("Front-end development\nPath: 12"),
    ]).then(([back, front, backToBasics, frontEnd]) => {
      expect(back).toContain("Page role hint: back");
      expect(front).toContain("Page role hint: front");
      expect(backToBasics).not.toContain("Page role hint");
      expect(frontEnd).not.toContain("Page role hint");
    });
  });

  it("prompts for a neutral subject rather than a card", () => {
    const create = vi
      .fn()
      .mockResolvedValue(structuredCompletion({ facts: [], vocabulary: [] }));
    return analyzePages(
      { chat: { completions: { create } } },
      [{ pageNumber: 1, text: "Plain prose without labels." }],
      "file-1",
      "document-1",
      { profile: "exhaustive" },
    ).then(() => {
      const prompt = create.mock.calls[0][0].messages[0].content as string;
      expect(prompt).not.toMatch(/Terms lines|card or section/);
      expect(prompt).toContain("glossary entry (term — definition)");
    });
  });

  it("normalizes question entries to the bank's fields while preserving metadata", () => {
    expect(
      normaliseQuestionEntries([
        {
          prompt: "What is the path?",
          answer: "12",
          questionType: "recall",
          page: 4,
          subject: "The Magus",
          field: "path",
          sourceText: "Path: 12",
          accept: ["XII"],
        },
      ]),
    ).toEqual([
      {
        prompt: "What is the path?",
        answer: "12",
        hint: undefined,
        difficulty: undefined,
        questionType: "recall",
        page: 4,
        subject: "The Magus",
        field: "path",
        sourceText: "Path: 12",
        accept: ["XII"],
      },
    ]);
    expect(() => normaliseQuestionEntries([{ answer: "12" }])).toThrow(
      "Extracted question 0 is missing its prompt",
    );
    // The old field names are no longer read.
    expect(() =>
      normaliseQuestionEntries([{ question: "What?", expectedAnswer: "12" }]),
    ).toThrow("Extracted question 0 is missing its prompt");
  });
});

describe("analyzePages", () => {
  const completedChecklist = {
    sourcePage: 1, factsReviewed: 0, vocabularyReviewed: 0,
    vocabularyEvidenceChecked: true, coverageReviewed: true, missingSourceLines: [],
  };

  it.each([
    ["wrong page", { sourcePage: 2 }, "sourcePage must be 1"],
    ["wrong fact count", { factsReviewed: 7 }, "factsReviewed must be 0"],
    ["wrong vocabulary count", { vocabularyReviewed: 7 }, "vocabularyReviewed must be 0"],
    ["unchecked evidence", { vocabularyEvidenceChecked: false }, "Check every vocabulary"],
    ["unchecked coverage", { coverageReviewed: false }, "Review source coverage"],
    ["reported omissions", { missingSourceLines: ["A missing line"] }, "reported missing source lines"],
  ])("requests fixes for %s before accepting a corrected checklist", async (_label, incomplete, expected) => {
    const create = vi.fn()
      .mockResolvedValueOnce(structuredCompletion({
        facts: [], vocabulary: [], checklist: { ...completedChecklist, ...incomplete },
      }))
      .mockResolvedValue(structuredCompletion({ facts: [], vocabulary: [] }));
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      await analyzePages(
        { chat: { completions: { create } } },
        [{ pageNumber: 1, text: "Heading" }], "file-1", "document-1", { profile: "exhaustive" },
      );
      expect(create).toHaveBeenCalledTimes(2);
      expect(create.mock.calls[1][0].messages.at(-1).content).toContain(expected);
    } finally { warning.mockRestore(); }
  });

  it("requests a missing checklist twice then returns reviewable output without splitting the page", async () => {
    const create = vi.fn().mockResolvedValue({
      choices: [{ finish_reason: "stop", message: { content: '{"facts":[],"vocabulary":[]}' } }],
    });
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const result = await analyzePages(
        { chat: { completions: { create } } },
        [{ pageNumber: 1, text: "Plain prose. ".repeat(100) }],
        "file-1", "document-1", { profile: "exhaustive" },
      );
      expect(create).toHaveBeenCalledTimes(3);
      expect(warning).toHaveBeenCalledTimes(3);
      expect(error).not.toHaveBeenCalled();
      expect(result.reviewWarnings).toEqual([{ page: 1, message: "Missing procedural checklist" }]);
    } finally {
      warning.mockRestore();
      error.mockRestore();
    }
  });

  it("sends two pages per call and keeps JSON-object responses by default", async () => {
    const create = vi.fn().mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              vocabularyJSON: [],
              summariesJSON: [],
              objectivesJSON: [],
              conceptsJSON: [],
              factsJSON: [],
            }),
          },
        },
      ],
    });
    const openai = { chat: { completions: { create } } };

    await analyzePages(
      openai,
      Array.from({ length: 11 }, (_, index) => ({
        pageNumber: index + 1,
        text: `page ${index + 1}`,
      })),
      "file-1",
      "document-1",
    );

    // 11 pages in batches of two: five full batches and one with the last page
    expect(create).toHaveBeenCalledTimes(6);
    expect(create.mock.calls[0][0].response_format).toEqual({
      type: "json_object",
    });
  });

  it("uses strict structured extraction and stores metadata with compatible aliases", async () => {
    const sourceText = "Path: 12";
    const create = vi.fn().mockResolvedValue(
      structuredCompletion({
        facts: [
          {
            subject: "The Magus",
            field: "path",
            answer: "12",
            accept: ["XII"],
            page: 4,
            sourceText,
          },
        ],
        vocabulary: [
          {
            term: "Sephira",
            definition: "A sphere on the Tree",
            context: "Sephira means A sphere on the Tree.",
            page: 99,
          },
        ],
      }, "stop", 4),
    );
    const result = await analyzePages(
      { chat: { completions: { create } } },
      [{ pageNumber: 4, text: "BACK\nPath: 12\nSephira means A sphere on the Tree." }],
      "file-1",
      "document-1",
      { profile: "exhaustive" },
    );

    const request = create.mock.calls[0][0];
    expect(request.response_format.type).toBe("json_schema");
    expect(request.response_format.json_schema.strict).toBe(true);
    expect(request.response_format.json_schema.schema.properties.facts.items)
      .toBeDefined();
    expect(request.messages[0].content).toContain("Page role hint: back");
    expect(request.messages[0].content).toContain("one independent claim per code");
    expect(request.messages[0].content).toContain("links that entity to another named entity");
    expect(result.questionsJSON).toEqual([
      {
        prompt: "What is path for The Magus?",
        answer: "12",
        questionType: "recall",
        page: 4,
        pages: [4],
        subject: "The Magus",
        field: "path",
        sourceText,
        accept: ["XII"],
        evidenceUnitId: expect.stringMatching(/^evidence-/),
        sourceStart: 5,
        sourceEnd: 13,
      },
    ]);
    expect(result.vocabularyJSON[0].page).toBe(4);
  });

  it.each([
    ["Cytology", "the study of cells", "Cytology is the study of cells."],
    [
      "Lysosomes",
      "Organelles containing digestive enzymes that break down waste materials, cellular debris, and foreign substances. Sometimes called the 'recycling centers' of the cell.",
      'Lysosomes - Organelles containing digestive enzymes that break down waste materials, cellular debris, and foreign substances. Sometimes called the "recycling centers" of the cell.',
    ],
  ])("preserves supported vocabulary evidence for %s without unnecessary repairs", async (term, definition, text) => {
    const create = vi.fn().mockResolvedValue(structuredCompletion({
      facts: [{ subject: term, field: "definition", answer: definition, sourceText: text, page: 1, accept: [] }],
      vocabulary: [{ term, definition, context: text, page: 1 }],
    }));
    const result = await analyzePages(
      { chat: { completions: { create } } },
      [{ pageNumber: 1, text }], "file-1", "document-1", { profile: "exhaustive" },
    );
    expect(create.mock.calls[0][0].messages[0].content).toContain("context to the exact source passage");
    expect(create).toHaveBeenCalledTimes(1);
    const entry = result.vocabularyJSON[0];
    expect(entry.context).toBe(text);
    expect(checkPageFacts({ pageNumber: 1, text }, [{
      subject: entry.word, field: "definition", answer: entry.definition,
      sourceText: entry.context, page: 1, accept: [],
    }]).suspect).toEqual([]);
  });

  it.each([
    ["Definition on page 1", "the study of cells"],
    ["Cytology is the study of cells.", "the study of plants"],
  ])("retains unsupported vocabulary for human editing with explicit warnings (%s)", async (context, definition) => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const create = vi.fn().mockResolvedValue(structuredCompletion({
        facts: [], vocabulary: [{ term: "Cytology", definition, context, page: 1 }],
      }));
      const result = await analyzePages(
        { chat: { completions: { create } } },
        [{ pageNumber: 1, text: "Cytology is the study of cells." }],
        "file-1", "document-1", { profile: "exhaustive" },
      );
      expect(create).toHaveBeenCalledTimes(3);
      expect(result.vocabularyJSON).toEqual([{ word: "Cytology", definition, context, page: 1 }]);
      expect(result.reviewWarnings).toEqual([{
        page: 1, message: expect.stringContaining('Vocabulary evidence for "Cytology" must quote the source passage'),
      }]);
      expect(error).not.toHaveBeenCalled();
    } finally {
      error.mockRestore();
    }
  });

  it("repairs invalid vocabulary quotations without splitting away their definitions", async () => {
    const text = "Cytology - The study of cells.";
    const create = vi.fn()
      .mockResolvedValueOnce(structuredCompletion({
        facts: [],
        vocabulary: [{ term: "Cytology", definition: "The study of cells.", context: "Definition on page 1", page: 1 }],
      }))
      .mockResolvedValue(structuredCompletion({
        facts: [{
          subject: "Cytology", field: "definition", answer: "The study of cells.",
          accept: [], sourceText: text, page: 1,
        }],
        vocabulary: [{ term: "Cytology", definition: "The study of cells.", context: text, page: 1 }],
      }));
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const result = await analyzePages(
        { chat: { completions: { create } } },
        [{ pageNumber: 1, text }], "file-1", "document-1", { profile: "exhaustive" },
      );
      expect(create).toHaveBeenCalledTimes(2);
      expect(create.mock.calls[1][0].messages.at(-1).content).toContain("source_not_on_page");
      expect(create.mock.calls[1][0].messages[1].content).toContain(text);
      expect(result.vocabularyJSON).toEqual([{
        word: "Cytology", definition: "The study of cells.", context: text, page: 1,
      }]);
      expect(warning).toHaveBeenCalledWith(expect.stringContaining(
        "Repairing extraction checklist on page 1 (attempt 1)",
      ));
    } finally {
      warning.mockRestore();
    }
  });

  it("repairs a labelled claim when its extracted answer is wrong", async () => {
    const create = vi
      .fn()
      .mockResolvedValueOnce(
        structuredCompletion({
          facts: [
            {
              subject: "The Magus",
              field: "path",
              answer: "13",
              accept: [],
              page: 1,
              sourceText: "Path: 12",
            },
          ],
          vocabulary: [],
        }),
      )
      .mockResolvedValueOnce(
        structuredCompletion({
          facts: [
            {
              subject: "The Magus",
              field: "path",
              answer: "12",
              accept: [],
              page: 1,
              sourceText: "Path: 12",
            },
          ],
          vocabulary: [],
        }),
      );
    const result = await analyzePages(
      { chat: { completions: { create } } },
      [{ pageNumber: 1, text: "Path: 12" }],
      "file-1",
      "document-1",
      { profile: "exhaustive" },
    );

    expect(create).toHaveBeenCalledTimes(2);
    // The repair prompt must carry the failure, and it now names the claim it
    // is about rather than dumping the fact as JSON.
    expect(create.mock.calls[1][0].messages.at(-1).content).toContain(
      'question "The Magus" (path): answer_not_in_source',
    );
    expect(result.questionsJSON.map((question) => question.answer)).toEqual([
      "12",
    ]);
  });

  it("splits a page and retries a response truncated by the token limit", async () => {
    const create = vi
      .fn()
      .mockResolvedValueOnce(
        structuredCompletion({ facts: [], vocabulary: [] }, "length"),
      )
      .mockResolvedValue(structuredCompletion({ facts: [], vocabulary: [] }, "stop", 7));
    const result = await analyzePages(
      { chat: { completions: { create } } },
      [{ pageNumber: 7, text: "# " + "x".repeat(400) }],
      "file-1",
      "document-1",
      { profile: "exhaustive" },
    );

    expect(create).toHaveBeenCalledTimes(3);
    expect(result.questionsJSON).toEqual([]);
  });

  it("splits a page and retries malformed JSON", async () => {
    const create = vi
      .fn()
      .mockResolvedValueOnce({
        choices: [{ finish_reason: "stop", message: { content: "not json" } }],
      })
      .mockResolvedValue(structuredCompletion({ facts: [], vocabulary: [] }, "stop", 8));

    await analyzePages(
      { chat: { completions: { create } } },
      [{ pageNumber: 8, text: "# " + "x".repeat(400) }],
      "file-1",
      "document-1",
      { profile: "exhaustive" },
    );

    expect(create).toHaveBeenCalledTimes(3);
  });

  it("splits an incomplete gap-fill and keeps the first vocabulary definition", async () => {
    const factFor = (sourceText: string) => ({
      subject: "The Magus",
      field: sourceText.split(":")[0],
      answer: sourceText.split(":")[1].trim(),
      accept: [],
      page: 1,
      sourceText,
    });
    const create = vi
      .fn()
      .mockResolvedValueOnce(structuredCompletion({ facts: [], vocabulary: [] }))
      .mockResolvedValueOnce(
        structuredCompletion({ facts: [], vocabulary: [] }, "length"),
      )
      .mockResolvedValueOnce(
        structuredCompletion({
          facts: [factFor("Path: 12")],
          vocabulary: [
            {
              term: "Shared",
              definition: "First definition",
              context: "Shared means First definition.",
              page: 1,
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        structuredCompletion({
          facts: [factFor("Planet: Mercury")],
          vocabulary: [
            {
              term: "Shared",
              definition: "Later definition",
              context: "Shared means Later definition.",
              page: 1,
            },
          ],
        }),
      );

    const result = await analyzePages(
      { chat: { completions: { create } } },
      [{ pageNumber: 1, text: "Path: 12\nPlanet: Mercury\nShared means First definition.\nShared means Later definition." }],
      "file-1",
      "document-1",
      { profile: "exhaustive" },
    );

    expect(create).toHaveBeenCalledTimes(4);
    expect(result.questionsJSON).toHaveLength(2);
    expect(result.vocabularyJSON).toEqual([
      {
        word: "Shared",
        definition: "First definition",
        context: "Shared means First definition.",
        page: 1,
      },
    ]);
  });

  it("limits exhaustive page analysis to five concurrent calls", async () => {
    let activeCalls = 0;
    let maxActiveCalls = 0;
    const create = vi.fn(
      async (request: { messages: Array<{ content: string }> }) => {
        activeCalls += 1;
        maxActiveCalls = Math.max(maxActiveCalls, activeCalls);
        const pageNumber = Number(
          request.messages[1].content.match(/\[Page (\d+)\]/)?.[1],
        );
        await new Promise((resolve) => setTimeout(resolve, 2));
        activeCalls -= 1;
        return structuredCompletion({
          facts: [{ subject: "Shared", field: "definition", answer: `definition from ${pageNumber}`,
            sourceText: `Shared means definition from ${pageNumber}.`, page: pageNumber, accept: [] }],
          vocabulary: [
            {
              term: "Shared",
              definition: `definition from ${pageNumber}`,
              context: `Shared means definition from ${pageNumber}.`,
              page: pageNumber,
            },
          ],
        }, "stop", pageNumber);
      },
    );

    const result = await analyzePages(
      { chat: { completions: { create } } },
      Array.from({ length: 11 }, (_, index) => ({
        pageNumber: index + 1,
        text: `Shared means definition from ${index + 1}.`,
      })),
      "file-1",
      "document-1",
      { profile: "exhaustive" },
    );

    expect(create).toHaveBeenCalledTimes(11);
    expect(maxActiveCalls).toBeGreaterThan(1);
    expect(maxActiveCalls).toBeLessThanOrEqual(5);
    expect(result.vocabularyJSON).toEqual([
      {
        word: "Shared",
        definition: "definition from 1",
        context: "Shared means definition from 1.",
        page: 1,
      },
    ]);
  });

  it("backs off and retries rate-limited structured requests", async () => {
    const rateLimitError = Object.assign(new Error("rate limited"), {
      status: 429,
    });
    const create = vi
      .fn()
      .mockRejectedValueOnce(rateLimitError)
      .mockResolvedValueOnce(
        structuredCompletion({ facts: [], vocabulary: [] }),
      );
    const pause = vi.fn().mockResolvedValue(undefined);

    await analyzePages(
      { chat: { completions: { create } } },
      [{ pageNumber: 1, text: "# Heading" }],
      "file-1",
      "document-1",
      { profile: "exhaustive", sleep: pause },
    );

    expect(create).toHaveBeenCalledTimes(2);
    expect(pause).toHaveBeenCalledWith(1000);
  });

  it("keeps other labelled lines out of the gap-fill context", async () => {
    const factFor = (sourceText: string) => ({
      subject: "Page 16",
      field: sourceText.split(":")[0],
      answer: sourceText.split(":")[1].trim(),
      accept: [],
      page: 16,
      sourceText,
    });
    const create = vi
      .fn()
      .mockResolvedValueOnce(
        structuredCompletion({
          facts: [factFor("Sun: bright")],
          vocabulary: [],
        }, "stop", 16),
      )
      .mockResolvedValueOnce(
        structuredCompletion({
          facts: [factFor("Fire (element): energy and will")],
          vocabulary: [],
        }, "stop", 16),
      );

    await analyzePages(
      { chat: { completions: { create } } },
      [
        {
          pageNumber: 16,
          text: "FRONT\nSun: bright\nFire (element): energy and will",
        },
      ],
      "file-1",
      "document-1",
      { profile: "exhaustive" },
    );

    const gapFillUser = create.mock.calls[1][0].messages[1].content as string;
    const [context, pageText] = gapFillUser.split("Page text (the only source of evidence):\n");
    expect(context).toContain("FRONT");
    expect(context).not.toContain("Sun: bright");
    expect(pageText).toBe("Fire (element): energy and will");
    // The first extraction sees those lines in source text, not repeated hints.
    expect(create.mock.calls[0][0].messages[1].content).toContain(
      "Sun: bright",
    );
  });

  it("splits stalled gap-fills, stops early, and reports lines the model never covers", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const create = vi
      .fn()
      .mockResolvedValue(structuredCompletion({ facts: [], vocabulary: [] }, "stop", 2));

    const result = await analyzePages(
      { chat: { completions: { create } } },
      [{ pageNumber: 2, text: "Path: 12\nPlanet: Mercury\nElement: Water" }],
      "file-1",
      "document-1",
      { profile: "exhaustive" },
    );

    expect(result.questionsJSON).toEqual([]);
    expect(result.uncoveredLines?.map(({ page }) => page)).toEqual([2, 2, 2]);
    expect(result.uncoveredLines?.map(({ line }) => line).sort()).toEqual([
      "Element: Water",
      "Path: 12",
      "Planet: Mercury",
    ]);
    expect(String(warnSpy.mock.calls.at(-1)?.[0])).toContain(
      "labelled/glossary lines uncovered on page 2",
    );
    // Identical retries of the full set are no longer repeated 8 times.
    expect(create.mock.calls.length).toBeLessThan(20);
    warnSpy.mockRestore();
  });

  it("logs and fails instead of silently dropping an exhaustively analyzed page", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const create = vi.fn().mockResolvedValue({
      choices: [{ finish_reason: "stop", message: { content: "not json" } }],
    });

    await expect(
      analyzePages(
        { chat: { completions: { create } } },
        [{ pageNumber: 9, text: "brief text" }],
        "file-1",
        "document-1",
        { profile: "exhaustive" },
      ),
    ).rejects.toThrow("Exhaustive analysis failed for page 9");
    expect(errorSpy).toHaveBeenCalledWith(
      "[analyzePages] Exhaustive analysis failedPages: 9",
    );
    errorSpy.mockRestore();
  });
});
