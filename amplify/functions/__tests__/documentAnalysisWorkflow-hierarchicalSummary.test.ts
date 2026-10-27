import { describe, expect, it } from "vitest";
import { buildPageSummaryItems } from "../documentAnalysisWorkflow/hierarchicalSummary";

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

  it("skips empty pages", () => {
    expect(buildPageSummaryItems([{ page: 1 }])).toEqual([]);
  });
});
