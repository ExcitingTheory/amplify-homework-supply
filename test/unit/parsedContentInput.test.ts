import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { toParsedContentInput } from "../../amplify/functions/documentAnalysis/parsedContentInput";

const schemaSource = readFileSync(
  resolve(__dirname, "../../amplify/data/resource.ts"),
  "utf8",
);

/** Field names declared by `const <name> = a.customType({ ... })`. */
function declaredFields(typeName: string): string[] {
  const start = schemaSource.indexOf(`const ${typeName} = a.customType({`);
  expect(start, `${typeName} not found in schema`).toBeGreaterThan(-1);
  const body = schemaSource.slice(start, schemaSource.indexOf("});", start));
  return [...body.matchAll(/^\s{2}(\w+):/gm)].map((match) => match[1]);
}

describe("toParsedContentInput", () => {
  it("sends typed lists, not JSON strings", () => {
    const input = toParsedContentInput({
      vocabularyJSON: [{ word: "Path", definition: "A line", page: 2 }],
      questionsJSON: [
        { prompt: "What is path?", answer: "12", page: 3, pages: [3, 5] },
      ],
    });
    expect(Array.isArray(input.vocabularyJSON)).toBe(true);
    expect(Array.isArray(input.questionsJSON)).toBe(true);
    expect(input.vocabularyJSON).toEqual([
      { word: "Path", definition: "A line", page: 2 },
    ]);
    expect(input.questionsJSON[0]).toEqual({
      prompt: "What is path?",
      answer: "12",
      page: 3,
      pages: [3, 5],
    });
    expect(input).not.toHaveProperty("pendingMediaJSON");
  });

  it("keeps merged page numbers on questions and vocabulary", () => {
    const input = toParsedContentInput({
      vocabularyJSON: [{ word: "Path", page: 2, pages: [2, 9] }],
      questionsJSON: [{ prompt: "p", answer: "a", page: 1, pages: [1, 4] }],
    });
    expect(input.vocabularyJSON[0].pages).toEqual([2, 9]);
    expect(input.questionsJSON[0].pages).toEqual([1, 4]);
  });

  it("drops fields the schema does not declare and maps legacy term to word", () => {
    const input = toParsedContentInput({
      vocabularyJSON: [{ term: "Aleph", extra: "nope", page: 1.5 }],
      summariesJSON: [{ title: "T", content: "C", unknown: 1 }],
      objectivesJSON: ["Explain the cycle", { objective: "Define", bloomLevel: "remember" }],
      conceptsJSON: [
        { concept: "Cycle", relatedVocabulary: ["water", 3] },
      ],
    });
    expect(input.vocabularyJSON).toEqual([{ word: "Aleph" }]);
    expect(input.summariesJSON).toEqual([{ title: "T", content: "C" }]);
    expect(input.objectivesJSON).toEqual([
      { objective: "Explain the cycle" },
      { objective: "Define", bloomLevel: "remember" },
    ]);
    expect(input.conceptsJSON).toEqual([{ concept: "Cycle" }]);
  });

  it("drops entries missing a required field and warns", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const input = toParsedContentInput({
      vocabularyJSON: [{ definition: "no word" }, { word: "ok" }],
      summariesJSON: [{ content: "no title" }],
    });
    expect(input.vocabularyJSON).toEqual([{ word: "ok" }]);
    expect(input.summariesJSON).toEqual([]);
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });

  it("passes valid pending media through", () => {
    const media = {
      filename: "a.png",
      mimeType: "image/png",
      s3Key: "k",
      size: 10,
      approved: false,
    };
    expect(
      toParsedContentInput({ pendingMedia: [media, { filename: "bad" }] })
        .pendingMediaJSON,
    ).toEqual([media]);
  });

  it("only emits fields declared by the schema's entry types", () => {
    const input = toParsedContentInput({
      vocabularyJSON: [
        { word: "w", definition: "d", context: "c", page: 1, pages: [1, 2] },
      ],
      summariesJSON: [{ title: "t", content: "c", pageRange: "1-2" }],
      objectivesJSON: [{ objective: "o", bloomLevel: "b" }],
      conceptsJSON: [
        { concept: "c", description: "d", relatedVocabulary: ["x"] },
      ],
      questionsJSON: [
        {
          prompt: "p",
          answer: "a",
          hint: "h",
          difficulty: "easy",
          questionType: "recall",
          page: 1,
          pages: [1, 2],
          subject: "s",
          field: "f",
          sourceText: "t",
          accept: ["x"],
        },
      ],
      pendingMedia: [
        {
          filename: "f",
          mimeType: "m",
          s3Key: "k",
          size: 1,
          description: "d",
          approved: true,
        },
      ],
    });
    const cases: Array<[keyof typeof input, string]> = [
      ["vocabularyJSON", "VocabularyEntry"],
      ["summariesJSON", "SummaryEntry"],
      ["objectivesJSON", "ObjectiveEntry"],
      ["conceptsJSON", "ConceptEntry"],
      ["questionsJSON", "QuestionEntry"],
      ["pendingMediaJSON", "PendingMediaEntry"],
    ];
    for (const [key, typeName] of cases) {
      const declared = declaredFields(typeName);
      for (const entry of input[key] ?? []) {
        for (const field of Object.keys(entry)) {
          expect(declared, `${typeName}.${field}`).toContain(field);
        }
      }
    }
  });
});
