import { describe, expect, it, vi } from "vitest";
import {
  MAX_PARSED_CONTENT_PAYLOAD_BYTES,
  analyzePages,
  assertParsedContentPayloadSize,
  checkPageFacts,
  chunkItemsByJsonSize,
  createPageBatches,
  extractCoverageCandidates,
  filterVerifiedEntries,
  isEquivalentText,
  normaliseQuestionEntries,
  retainDirectQuestionsWithVerifiedMatches,
  retainDirectVocabularyWithVerifiedMatches,
  resolveAnalysisProfile,
  resolveSkipAutoAnalysis,
  segmentTextIntoPages,
  splitTextInHalf,
  type ExhaustiveFact,
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
  it("defaults absent or invalid profiles to standard and reports invalid values", () => {
    expect(resolveAnalysisProfile(undefined)).toEqual({ profile: "standard" });
    expect(resolveAnalysisProfile({ analysisProfile: "exhaustive" })).toEqual({
      profile: "exhaustive",
    });
    expect(resolveAnalysisProfile('{"analysisProfile":"standard"}')).toEqual({
      profile: "standard",
    });
    expect(resolveAnalysisProfile({ analysisProfile: "unknown" })).toEqual({
      profile: "standard",
      invalidValue: "unknown",
    });
    expect(resolveAnalysisProfile("{invalid")).toEqual({
      profile: "standard",
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
        question: "What is a cell?",
        correctAnswer: "The basic unit of life.",
        options: ["Cell", "Atom"],
      },
      { question: "What is a tissue?", answer: "A group of cells." },
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

  it("rejects ParsedContent payloads that exceed the safe item budget", () => {
    const overhead = JSON.stringify({ content: "" }).length;
    const atLimit = {
      content: "x".repeat(MAX_PARSED_CONTENT_PAYLOAD_BYTES - overhead),
    };
    const overLimit = {
      content: `${atLimit.content}x`,
    };

    expect(() =>
      assertParsedContentPayloadSize({ small: "content" }),
    ).not.toThrow();
    expect(() => assertParsedContentPayloadSize(atLimit)).not.toThrow();
    expect(() => assertParsedContentPayloadSize(overLimit)).toThrow(
      /No content was persisted/,
    );
  });

  it("extracts labelled lines and glossary-style definitions for coverage", () => {
    expect(
      extractCoverageCandidates({
        pageNumber: 4,
        text: [
          "FRONTS",
          "Path: 12",
          "Beth — Hebrew letter",
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
    ]);
  });

  it("normalizes legacy and current question shapes while preserving metadata", () => {
    expect(
      normaliseQuestionEntries([
        {
          question: "What is the path?",
          expectedAnswer: "12",
          type: "recall",
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
        question: "What is the path?",
        expectedAnswer: "12",
        type: "recall",
      },
    ]);
    expect(() => normaliseQuestionEntries([{ answer: "12" }])).toThrow(
      "Extracted question 0 is missing its prompt",
    );
  });
});

describe("analyzePages", () => {
  it("keeps standard extraction batching and JSON-object responses by default", async () => {
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

    expect(create).toHaveBeenCalledTimes(2);
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
        subject: "The Magus",
        field: "path",
        sourceText,
        accept: ["XII"],
        question: "What is path for The Magus?",
        expectedAnswer: "12",
        type: "recall",
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
