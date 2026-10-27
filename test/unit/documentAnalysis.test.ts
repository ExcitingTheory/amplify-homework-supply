import { describe, expect, it, vi } from "vitest";
import {
  analyzePages,
  buildVerifierCandidates,
  checkPageFacts,
  chunkItemsByJsonSize,
  createPageBatches,
  extractCoverageCandidates,
  filterVerifiedEntries,
  isEquivalentText,
  mergeDuplicateQuestions,
  mergeDuplicateVocabulary,
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

function structuredCompletion(
  result: { facts: unknown[]; vocabulary: unknown[] },
  finishReason = "stop",
) {
  return {
    choices: [
      {
        finish_reason: finishReason,
        message: { content: JSON.stringify(result) },
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

  it("merges vocabulary with the same term and definition across pages", () => {
    expect(
      mergeDuplicateVocabulary([
        { word: "Path", definition: "A Tree-line", page: 9 },
        { word: "path", definition: "A Tree-line", page: 2 },
        { word: "Path", definition: "A road", page: 4 },
      ]),
    ).toEqual([
      { word: "Path", definition: "A Tree-line", page: 2, pages: [2, 9] },
      { word: "Path", definition: "A road", page: 4, pages: [4] },
    ]);
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
              questionsJSON: [],
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
            page: 99,
            sourceText,
          },
        ],
        vocabulary: [
          {
            term: "Sephira",
            definition: "A sphere on the Tree",
            context: "Tree of Life",
            page: 99,
          },
        ],
      }),
    );
    const result = await analyzePages(
      { chat: { completions: { create } } },
      [{ pageNumber: 4, text: "BACK\nPath: 12" }],
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
      },
    ]);
    expect(result.vocabularyJSON[0].page).toBe(4);
  });

  it("gap-fills a labelled line when its extracted answer is wrong", async () => {
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
    expect(create.mock.calls[1][0].messages[0].content).toContain(
      "targeted gap-fill",
    );
    expect(result.questionsJSON.map((question) => question.answer)).toEqual([
      "13",
      "12",
    ]);
  });

  it("splits a page and retries a response truncated by the token limit", async () => {
    const create = vi
      .fn()
      .mockResolvedValueOnce(
        structuredCompletion({ facts: [], vocabulary: [] }, "length"),
      )
      .mockResolvedValue(structuredCompletion({ facts: [], vocabulary: [] }));
    const result = await analyzePages(
      { chat: { completions: { create } } },
      [{ pageNumber: 7, text: "x".repeat(400) }],
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
      .mockResolvedValue(structuredCompletion({ facts: [], vocabulary: [] }));

    await analyzePages(
      { chat: { completions: { create } } },
      [{ pageNumber: 8, text: "x".repeat(400) }],
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
              context: "first page",
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
              context: "later page",
              page: 1,
            },
          ],
        }),
      );

    const result = await analyzePages(
      { chat: { completions: { create } } },
      [{ pageNumber: 1, text: "Path: 12\nPlanet: Mercury" }],
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
        context: "first page",
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
          facts: [],
          vocabulary: [
            {
              term: "Shared",
              definition: `definition from ${pageNumber}`,
              context: `page ${pageNumber}`,
              page: pageNumber,
            },
          ],
        });
      },
    );

    const result = await analyzePages(
      { chat: { completions: { create } } },
      Array.from({ length: 11 }, (_, index) => ({
        pageNumber: index + 1,
        text: `Page prose ${index + 1}`,
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
        context: "page 1",
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
      [{ pageNumber: 1, text: "plain prose with no labelled facts" }],
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
        }),
      )
      .mockResolvedValueOnce(
        structuredCompletion({
          facts: [factFor("Fire (element): energy and will")],
          vocabulary: [],
        }),
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
    const [context, pageText] = gapFillUser.split("Page text:\n");
    expect(context).toContain("FRONT");
    expect(context).not.toContain("Sun: bright");
    expect(pageText).toBe("Fire (element): energy and will");
    // The first, full extraction still sees the whole header.
    expect(create.mock.calls[0][0].messages[1].content).toContain(
      "Sun: bright",
    );
  });

  it("splits stalled gap-fills, stops early, and reports lines the model never covers", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const create = vi
      .fn()
      .mockResolvedValue(structuredCompletion({ facts: [], vocabulary: [] }));

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
