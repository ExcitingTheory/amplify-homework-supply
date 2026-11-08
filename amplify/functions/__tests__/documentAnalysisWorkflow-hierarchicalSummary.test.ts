import { describe, expect, it } from "vitest";
import {
  buildPageSummaryItems,
  buildSynthesisItems,
  splitReductionForBatching,
} from "../documentAnalysisWorkflow/hierarchicalSummary";

describe("buildPageSummaryItems", () => {
  it("uses page-level summaries and preserves their ranges", () => {
    expect(
      buildPageSummaryItems([
        {
          page: 2,
          summariesJSON: [
            { title: "Cell structure", content: "Cells have membranes.", page_range: "2-3" },
          ],
        },
      ]),
    ).toEqual([
      {
        type: "page-summary",
        title: "Cell structure",
        content: "Cells have membranes.",
        pageRange: "2-3",
      },
    ]);
  });

  it("uses verified page evidence when exhaustive extraction has no summary", () => {
    expect(
      buildPageSummaryItems([
        {
          page: 4,
          summariesJSON: [],
          questionsJSON: [
            {
              prompt: "What is osmosis?",
              answer: "Water movement across a membrane.",
              sourceText: "Osmosis is...",
            },
          ],
          vocabularyJSON: [
            { term: "osmosis", definition: "Water movement", context: "Cells" },
          ],
        },
      ]),
    ).toEqual([
      {
        type: "page-evidence",
        title: "Page 4",
        pageRange: "Page 4",
        facts: [
          {
            prompt: "What is osmosis?",
            answer: "Water movement across a membrane.",
            subject: undefined,
            field: undefined,
            sourceText: "Osmosis is...",
          },
        ],
        vocabulary: [
          {
            word: "osmosis",
            definition: "Water movement",
            context: "Cells",
          },
        ],
      },
    ]);
  });

  it("splits oversized page evidence into items within the size budget", () => {
    const questionsJSON = Array.from({ length: 40 }, (_, index) => ({
      prompt: `Question ${index}`,
      answer: "a".repeat(200),
      sourceText: "s".repeat(200),
    }));
    const vocabularyJSON = Array.from({ length: 10 }, (_, index) => ({
      word: `word-${index}`,
      definition: "d".repeat(150),
    }));
    const limit = 3_000;

    const items = buildPageSummaryItems(
      [{ page: 22, summariesJSON: [], questionsJSON, vocabularyJSON }],
      limit,
    );

    expect(items.length).toBeGreaterThan(1);
    expect(
      items.every((item) => JSON.stringify(item).length + 2 <= limit),
    ).toBe(true);
    expect(items.map((item) => item.title)).toEqual(
      items.map((_, index) => `Page 22 (part ${index + 1} of ${items.length})`),
    );
    expect(items.every((item) => item.pageRange === "Page 22")).toBe(true);
    expect(items.flatMap((item) => item.facts as unknown[])).toHaveLength(40);
    expect(items.flatMap((item) => item.vocabulary as unknown[])).toHaveLength(
      10,
    );
  });

  it("keeps page evidence whole when it fits the budget", () => {
    const items = buildPageSummaryItems(
      [
        {
          page: 4,
          summariesJSON: [],
          questionsJSON: [{ prompt: "Q", answer: "A" }],
          vocabularyJSON: [],
        },
      ],
      16_000,
    );

    expect(items).toHaveLength(1);
    expect(items[0]?.title).toBe("Page 4");
  });

  it("skips empty pages", () => {
    expect(buildPageSummaryItems([{ page: 1 }])).toEqual([]);
  });

  it("splits an oversized page summary into parts that keep its page range", () => {
    const content = Array.from(
      { length: 40 },
      (_, index) => `Sentence number ${index} describes the topic.`,
    ).join(" ");
    const limit = 600;

    const items = buildPageSummaryItems(
      [
        {
          page: 7,
          summariesJSON: [{ title: "Topic", content, pageRange: "7-8" }],
        },
      ],
      limit,
    );

    expect(items.length).toBeGreaterThan(1);
    expect(items.every((item) => JSON.stringify(item).length + 2 <= limit)).toBe(
      true,
    );
    expect(items.every((item) => item.pageRange === "7-8")).toBe(true);
    expect(items.map((item) => item.title)).toEqual(
      items.map((_, index) => `Topic (part ${index + 1} of ${items.length})`),
    );
    expect(items.map((item) => item.content).join("")).toBe(content);
  });
});

describe("buildSynthesisItems", () => {
  const question = {
    prompt: "What is osmosis?",
    answer: "Water movement.",
    subject: "Biology",
    field: "Cells",
    page: 4,
    pages: [4],
  };

  it("does not repeat questions and vocabulary that page evidence already carries", () => {
    const items = buildSynthesisItems({
      pages: [
        {
          page: 4,
          summariesJSON: [],
          questionsJSON: [question],
          vocabularyJSON: [{ word: "osmosis", definition: "Water movement" }],
        },
      ],
      questions: [question],
      vocabulary: [{ word: "osmosis", definition: "Water movement", page: 4 }],
    });

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ type: "page-evidence", title: "Page 4" });
  });

  it("keeps standalone items for pages that only have summaries", () => {
    const items = buildSynthesisItems({
      pages: [
        {
          page: 4,
          summariesJSON: [{ title: "Cells", content: "Cells are small." }],
          questionsJSON: [question],
        },
      ],
      questions: [question],
      vocabulary: [],
    });

    expect(items.map((item) => (item as { type: string }).type)).toEqual([
      "page-summary",
      "question",
    ]);
  });

  it("keeps a merged duplicate when any of its pages is not covered by evidence", () => {
    const merged = { ...question, page: 4, pages: [4, 9] };
    const items = buildSynthesisItems({
      pages: [
        { page: 4, summariesJSON: [], questionsJSON: [question] },
        {
          page: 9,
          summariesJSON: [{ title: "More", content: "More cells." }],
        },
      ],
      questions: [merged],
      vocabulary: [],
    });

    expect(items.map((item) => (item as { type: string }).type)).toEqual([
      "page-evidence",
      "page-summary",
      "question",
    ]);
  });
});

describe("splitReductionForBatching", () => {
  it("returns a reduction that fits unchanged", () => {
    const reduction = { summariesJSON: [{ title: "A", content: "B" }] };
    expect(splitReductionForBatching(reduction, 1_000)).toEqual([reduction]);
  });

  it("splits an oversized reduction into same-shape reductions within the budget", () => {
    const reduction = {
      summariesJSON: Array.from({ length: 12 }, (_, index) => ({
        title: `Chapter ${index}`,
        content: "c".repeat(150),
        pageRange: `${index}-${index + 1}`,
      })),
      objectivesJSON: Array.from({ length: 10 }, (_, index) => `Objective ${index}`),
      conceptsJSON: Array.from({ length: 10 }, (_, index) => `Concept ${index}`),
    };
    const limit = 700;

    const parts = splitReductionForBatching(reduction, limit);

    expect(parts.length).toBeGreaterThan(1);
    expect(parts.every((part) => JSON.stringify(part).length + 2 <= limit)).toBe(
      true,
    );
    expect(parts.flatMap((part) => (part.summariesJSON as unknown[]) ?? [])).toHaveLength(12);
    expect(parts.flatMap((part) => (part.objectivesJSON as unknown[]) ?? [])).toHaveLength(10);
    expect(parts.flatMap((part) => (part.conceptsJSON as unknown[]) ?? [])).toHaveLength(10);
  });

  it("divides a single oversized summary into parts", () => {
    const reduction = {
      summariesJSON: [
        {
          title: "Everything",
          content: Array.from({ length: 60 }, () => "word").join(" "),
          pageRange: "1-51",
        },
      ],
    };
    const limit = 200;

    const parts = splitReductionForBatching(reduction, limit);

    expect(parts.length).toBeGreaterThan(1);
    expect(parts.every((part) => JSON.stringify(part).length + 2 <= limit)).toBe(
      true,
    );
    expect(
      parts.every(
        (part) =>
          (part.summariesJSON as Array<{ pageRange: string }>)[0]?.pageRange ===
          "1-51",
      ),
    ).toBe(true);
  });
});
