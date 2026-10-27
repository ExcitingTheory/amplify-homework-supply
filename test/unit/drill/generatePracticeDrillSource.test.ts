import { describe, it, expect, vi, beforeEach } from "vitest";

const { graphql, s3Send } = vi.hoisted(() => ({
  graphql: vi.fn(),
  s3Send: vi.fn(),
}));

vi.mock("aws-amplify", () => ({ Amplify: { configure: vi.fn() } }));
vi.mock("aws-amplify/data", () => ({
  generateClient: () => ({ graphql }),
}));
vi.mock("@aws-sdk/credential-providers", () => ({
  fromNodeProviderChain: () => async () => ({}),
}));
vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: class {
    send = s3Send;
  },
  GetObjectCommand: class {
    constructor(public input: unknown) {}
  },
}));
vi.mock("openai", () => ({ default: class {} }));

import {
  attachDocumentRefs,
  buildGenerationPrompt,
  mapItemSources,
  mapUnitWords,
  mapQuestionUnits,
  scopeMaterialToDocuments,
  handler,
} from "../../../amplify/functions/generatePracticeDrill/handler";

describe("generatePracticeDrill source mapping", () => {
  it("maps Word.pronunciation to phonetic and tolerates missing words", () => {
    expect(
      mapUnitWords([
        {
          wordID: "w1",
          word: {
            id: "w1",
            phrase: "hola",
            definition: null,
            pronunciation: "OH-la",
          },
        },
        { wordID: "w2", word: null },
        null,
      ]),
    ).toEqual([
      { id: "w1", phrase: "hola", definition: "", phonetic: "OH-la" },
    ]);
    expect(mapUnitWords(undefined)).toEqual([]);
  });

  it("leaves phonetic undefined when pronunciation is empty", () => {
    const [word] = mapUnitWords([
      { word: { id: "w", phrase: "p", definition: "d", pronunciation: "" } },
    ]);
    expect(word.phonetic).toBeUndefined();
  });

  it("maps question units and tolerates missing questions", () => {
    expect(
      mapQuestionUnits([
        {
          questionID: "q1",
          question: { id: "q1", prompt: "P", answer: null, choices: "[1]" },
        },
        { questionID: "q2", question: null },
      ]),
    ).toEqual([{ id: "q1", prompt: "P", answer: "", choices: "[1]" }]);
    expect(mapQuestionUnits(null)).toEqual([]);
  });
});

describe("generatePracticeDrill source queries", () => {
  beforeEach(() => {
    graphql.mockReset();
    s3Send.mockReset();
  });

  it("filters word and question links by unitID and never selects removed fields", async () => {
    graphql.mockImplementation(async ({ query }: { query: string }) => {
      if (query.includes("query GetUnit"))
        return { data: { getUnit: { id: "u1", summary: null } } };
      if (query.includes("query ListUnitWords"))
        return { data: { listUnitWords: { items: [] } } };
      return { data: { listQuestionUnits: { items: [] } } };
    });

    await expect(
      (handler as any)(
        {
          fieldName: "generatePracticeDrill",
          identity: { sub: "user" },
          arguments: {
            unitId: "u1",
            drillType: "VOCABULARY",
            count: 3,
            sourcesEnabled: {
              vocabulary: true,
              questions: true,
              text: false,
              documents: false,
            },
          },
        },
        {},
        () => {},
      ),
    ).rejects.toThrow("No source material found");

    const calls = graphql.mock.calls.map(([arg]) => arg);
    const words = calls.find((c) => c.query.includes("ListUnitWords"));
    const questions = calls.find((c) => c.query.includes("ListQuestionUnits"));
    expect(words.variables.filter).toEqual({ unitID: { eq: "u1" } });
    expect(questions.variables.filter).toEqual({ unitID: { eq: "u1" } });
    for (const { query } of calls) {
      expect(query).not.toMatch(
        /\b(wordId|questionId|audioPath|imagePath|phonetic)\b/,
      );
    }
    expect(
      calls.find((c) => c.query.includes("query GetUnit")).query,
    ).not.toMatch(/\blanguage\b/);
  });
});

describe("generatePracticeDrill document sources", () => {
  const link = (documentID: string, filename: string, extra: Record<string, unknown> = {}) => ({
    documentID,
    document: { id: documentID, filename },
    ...extra,
  });

  it("maps live document links to sources and skips recycled ones", () => {
    expect(
      mapItemSources({
        items: [
          link("d1", "a.pdf", { page: 3 }),
          link("d2", "b.pdf"),
          link("d3", "c.pdf", { deletedAt: "2026-10-01" }),
          link("d4", "d.pdf", { _deleted: true }),
          null,
        ],
      }),
    ).toEqual([
      { documentId: "d1", filename: "a.pdf", page: 3 },
      { documentId: "d2", filename: "b.pdf" },
    ]);
    expect(mapItemSources(undefined)).toEqual([]);
  });

  it("carries sources on words and questions only when there are some", () => {
    const [word] = mapUnitWords([
      {
        word: {
          id: "w1",
          phrase: "p",
          definition: "d",
          documentWords: { items: [link("d1", "a.pdf", { page: 2 })] },
        },
      },
    ]);
    expect(word.sources).toEqual([{ documentId: "d1", filename: "a.pdf", page: 2 }]);

    const [question] = mapQuestionUnits([
      {
        question: {
          id: "q1",
          prompt: "P",
          answer: "A",
          documentQuestions: { items: [link("d2", "b.pdf")] },
        },
      },
    ]);
    expect(question.sources).toEqual([{ documentId: "d2", filename: "b.pdf" }]);
  });

  const material = () => ({
    vocabulary: [
      { id: "w1", phrase: "one", definition: "1", sources: [{ documentId: "d1", filename: "a.pdf", page: 2 }] },
      { id: "w2", phrase: "two", definition: "2", sources: [{ documentId: "d2", filename: "b.pdf", page: 5 }] },
      { id: "w3", phrase: "three", definition: "3" },
    ],
    questions: [
      { id: "q1", prompt: "Q1", answer: "A1", sources: [{ documentId: "d1", filename: "a.pdf" }] },
      { id: "q2", prompt: "Q2", answer: "A2" },
    ],
    textBlocks: [{ id: "t", text: "unit text" }],
    documents: [
      { id: "d1", filename: "a.pdf", concepts: [], vocabulary: [], summaries: [] },
      { id: "d2", filename: "b.pdf", concepts: [], vocabulary: [], summaries: [] },
    ],
  });

  it("scopes the material to the chosen documents", () => {
    const scoped = scopeMaterialToDocuments(material(), ["d1"]);
    expect(scoped.vocabulary.map((w) => w.id)).toEqual(["w1"]);
    expect(scoped.questions.map((q) => q.id)).toEqual(["q1"]);
    expect(scoped.documents.map((d) => d.id)).toEqual(["d1"]);
    expect(scoped.textBlocks).toEqual([]);
  });

  it("fills in a block's document reference from the stored link", () => {
    const blocks = attachDocumentRefs(
      [
        { type: "quiz", instruction: "x", sourceItemId: "w2", sourceType: "vocabulary" },
        { type: "quiz", instruction: "y", sourceItemId: "q1", sourceType: "question" },
        { type: "quiz", instruction: "z", sourceItemId: "w1", sourceType: "vocabulary", documentRef: { filename: "own.pdf", page: 1 } },
        { type: "quiz", instruction: "t", sourceItemId: "t", sourceType: "text" },
      ] as any,
      material() as any,
    );
    // Only a link with a page makes a reference; an existing one is kept
    expect(blocks[0].documentRef).toEqual({ filename: "b.pdf", page: 5 });
    expect(blocks[1].documentRef).toBeUndefined();
    expect(blocks[2].documentRef).toEqual({ filename: "own.pdf", page: 1 });
    expect(blocks[3].documentRef).toBeUndefined();
  });

  it("shows item ids and sources in the prompt", () => {
    const prompt = buildGenerationPrompt(material() as any, "MIXED", 3);
    expect(prompt).toContain("- [id: w1] one: 1 [source: a.pdf, p.2]");
    expect(prompt).toContain("- [id: q1] Q: Q1 | A: A1 [source: a.pdf]");
    expect(prompt).toContain("- [id: w3] three: 3\n");
    expect(prompt).toContain("set sourceItemId to its [id: ...]");
  });

  it("asks for each item's document links with the word and question", async () => {
    graphql.mockReset();
    graphql.mockImplementation(async ({ query }: { query: string }) => {
      if (query.includes("query GetUnit")) return { data: { getUnit: { id: "u1" } } };
      return { data: { listUnitWords: { items: [] }, listQuestionUnits: { items: [] } } };
    });
    await expect(
      (handler as any)(
        {
          fieldName: "generatePracticeDrill",
          identity: { sub: "user" },
          arguments: {
            unitId: "u1",
            drillType: "MIXED",
            count: 1,
            sourcesEnabled: { vocabulary: true, questions: true, text: false, documents: false },
          },
        },
        {},
        () => {},
      ),
    ).rejects.toThrow("No source material found");
    const queries = graphql.mock.calls.map(([arg]) => arg.query as string);
    expect(queries.find((q) => q.includes("ListUnitWords"))).toMatch(/documentWords[\s\S]*document\s*\{[\s\S]*filename/);
    expect(queries.find((q) => q.includes("ListQuestionUnits"))).toMatch(/documentQuestions/);
  });
});
