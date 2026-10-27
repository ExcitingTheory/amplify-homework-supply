import { beforeEach, describe, expect, it, vi } from "vitest";

const { generateText, generateObject, models } = vi.hoisted(() => ({
  generateText: vi.fn(),
  generateObject: vi.fn(),
  models: {
    Unit: { get: vi.fn() },
    UnitWord: { list: vi.fn() },
    QuestionUnit: { list: vi.fn() },
    UnitDocument: { list: vi.fn() },
    Word: { get: vi.fn() },
    Question: { get: vi.fn() },
    Document: { get: vi.fn() },
    ParsedContent: { list: vi.fn() },
  } as Record<string, any>,
}));

vi.mock("ai", () => ({
  generateText,
  generateObject,
  stepCountIs: (count: number) => ({ type: "step-count", count }),
  tool: (definition: unknown) => definition,
}));
vi.mock("@ai-sdk/openai", () => ({ createOpenAI: () => () => "mock-model" }));
vi.mock("../../src/utils/amplifyServerClient", () => ({
  getServerClient: () => ({ models }),
}));

import { generatePracticeDrill } from "../../app/actions/drill";

const wordLinks = (links: any[]) => vi.fn(async () => ({ data: links, nextToken: null }));
const link = (documentID: string, page?: number) => ({
  id: `l-${documentID}`,
  documentID,
  ...(page !== undefined ? { page } : {}),
});

beforeEach(() => {
  vi.clearAllMocks();
  process.env.OPENAI_API_KEY = "test";
  models.Unit.get.mockResolvedValue({ data: { id: "u1", name: "Unit" } });
  models.UnitWord.list.mockResolvedValue({ data: [{ wordID: "w1" }, { wordID: "w2" }] });
  models.QuestionUnit.list.mockResolvedValue({ data: [{ questionID: "q1" }] });
  models.UnitDocument.list.mockResolvedValue({ data: [] });
  models.ParsedContent.list.mockResolvedValue({ data: [] });
  models.Document.get.mockImplementation(async ({ id }: { id: string }) => ({
    data: { id, filename: `${id}.pdf` },
  }));

  const words: Record<string, any> = {
    w1: { id: "w1", phrase: "one", definition: "1", documentWords: wordLinks([link("d1", 2)]) },
    w2: { id: "w2", phrase: "two", definition: "2", documentWords: wordLinks([link("d2", 9)]) },
  };
  models.Word.get.mockImplementation(async ({ id }: { id: string }) => ({ data: words[id] }));
  models.Question.get.mockResolvedValue({
    data: {
      id: "q1",
      prompt: "Why?",
      answer: "Because",
      documentQuestions: wordLinks([link("d1", 4)]),
    },
  });

  // Build a block from the first source index, as the model would
  generateText.mockImplementation(async ({ tools }: any) => {
    await tools.generate_blocks.execute({
      blocks: [
        {
          type: "answer",
          instruction: "Define it",
          choices: null,
          expectedAnswer: "x",
          pairs: null,
          hint: null,
          sourceIndex: 0,
          sourceIndices: null,
          sourceType: "vocabulary",
        },
      ],
    });
    return {};
  });
});

const promptOf = () => generateText.mock.calls[0][0].prompt as string;

describe("generatePracticeDrill document sources", () => {
  it("shows where each word and question came from, and cites it on the block", async () => {
    const { blocks } = await generatePracticeDrill({ unitId: "u1", drillType: "VOCABULARY", count: 1 });

    expect(promptOf()).toContain('phrase: "one" | definition: "1" [source: d1.pdf, p.2]');
    expect(promptOf()).toContain('question: "Why?" | answer: "Because" [source: d1.pdf, p.4]');
    expect(blocks[0].documentRef).toEqual({ filename: "d1.pdf", page: 2 });
  });

  it("limits the drill to the chosen documents", async () => {
    await generatePracticeDrill({
      unitId: "u1",
      drillType: "VOCABULARY",
      count: 1,
      sourcesEnabled: { documentIds: ["d2"] },
    });

    const prompt = promptOf();
    expect(prompt).toContain('phrase: "two"');
    expect(prompt).not.toContain('phrase: "one"');
    expect(prompt).not.toContain("Why?");
  });

  it("leaves out the unit's own text when limited to documents", async () => {
    models.Unit.get.mockResolvedValue({
      data: { id: "u1", name: "Unit", data: JSON.stringify({ root: { children: [{ type: "text", text: "Unit text" }] } }) },
    });

    await generatePracticeDrill({
      unitId: "u1",
      drillType: "VOCABULARY",
      count: 1,
      sourcesEnabled: { documentIds: ["d1"] },
    });

    expect(promptOf()).not.toContain("Unit text content");
  });

  it("only reads the chosen documents' content", async () => {
    models.UnitDocument.list.mockResolvedValue({
      data: [{ documentID: "d1" }, { documentID: "d2" }],
    });
    models.ParsedContent.list.mockResolvedValue({
      data: [{ conceptsJSON: [{ concept: "c" }], vocabularyJSON: [], summariesJSON: [] }],
    });

    await generatePracticeDrill({
      unitId: "u1",
      drillType: "COMPREHENSION",
      count: 1,
      sourcesEnabled: { documentIds: ["d2"] },
    });

    expect(models.Document.get.mock.calls.filter(([arg]) => arg.id === "d2")).not.toHaveLength(0);
    expect(models.ParsedContent.list).toHaveBeenCalledTimes(1);
    expect(models.ParsedContent.list).toHaveBeenCalledWith({ filter: { documentID: { eq: "d2" } } });
  });

  it("still generates when a word's sources cannot be loaded", async () => {
    models.Word.get.mockImplementation(async ({ id }: { id: string }) => ({
      data: { id, phrase: id, definition: "d", documentWords: vi.fn().mockRejectedValue(new Error("denied")) },
    }));

    const { blocks } = await generatePracticeDrill({ unitId: "u1", drillType: "VOCABULARY", count: 1 });

    expect(blocks).toHaveLength(1);
    expect(blocks[0].documentRef).toBeUndefined();
  });
});
