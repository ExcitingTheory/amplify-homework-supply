import { beforeEach, describe, expect, it, vi } from "vitest";

const models = vi.hoisted(() => ({
  ParsedContent: { get: vi.fn(), list: vi.fn(), update: vi.fn() },
  // No relationship loader, so chunks are found with ParsedContent.list.
  Document: { get: vi.fn() },
  Question: { list: vi.fn(), create: vi.fn() },
  QuestionUnit: { list: vi.fn(), create: vi.fn() },
  DocumentQuestion: { list: vi.fn(), create: vi.fn() },
}));

vi.mock("../../src/utils/amplifyClient", () => ({
  getAmplifyClient: () => ({ models }),
}));
vi.mock("../../src/utils/parsedContentModeration", () => ({
  assertParsedContentImportAllowed: vi.fn().mockResolvedValue(undefined),
}));

import {
  createQuestion,
  importQuestionsToUnit,
  updateQuestionItem,
} from "../../src/utils/questionImportUtils";

type Row = Record<string, any>;

const chunk = (index: number, count: number, questions: Row[], extra: Row = {}): Row => ({
  id: `doc-1-chunk-${index}`,
  documentID: "doc-1",
  _version: 3 + index,
  chunkIndex: index,
  chunkCount: count,
  questionsJSON: questions,
  ...extra,
});

/** The document's stored chunks; `get` finds any one of them by id. */
function givenChunks(...records: Array<Row | null>) {
  const live = records.filter((record): record is Row => record !== null);
  models.ParsedContent.get.mockImplementation(async ({ id }: { id: string }) => ({
    data: live.find((record) => record.id === id) ?? null,
  }));
  models.ParsedContent.list.mockResolvedValue({ data: live });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  models.Document.get.mockResolvedValue({ data: { id: "doc-1" } });
  models.Question.list.mockResolvedValue({ data: [] });
  models.Question.create.mockImplementation(async ({ prompt }: Row) => ({
    data: { id: `q-${prompt}`, prompt },
  }));
  models.QuestionUnit.list.mockResolvedValue({ data: [] });
  models.QuestionUnit.create.mockResolvedValue({ data: { id: "qu" } });
  models.DocumentQuestion.list.mockResolvedValue({ data: [] });
  models.DocumentQuestion.create.mockResolvedValue({ data: { id: "dq" } });
  models.ParsedContent.update.mockResolvedValue({ data: {} });
});

describe("createQuestion", () => {
  it("builds a bank question from the entry's prompt and answer", async () => {
    await createQuestion(
      { prompt: "What is a cell?", answer: "The unit of life", hint: "Think small", difficulty: "hard" },
      "owner",
      "identity",
    );

    expect(models.Question.create).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: "What is a cell?",
        answer: "The unit of life",
        hint: "Think small",
        difficulty: "hard",
        generated: true,
        owner: "owner",
        identityId: "identity",
      }),
    );
  });

  it("does not read the old question or expectedAnswer names", async () => {
    await createQuestion({ question: "Old?", expectedAnswer: "Old answer" }, "o", "i");

    expect(models.Question.create).toHaveBeenCalledWith(
      expect.objectContaining({ prompt: "", answer: "", difficulty: "medium" }),
    );
  });
});

describe("importQuestionsToUnit", () => {
  it("imports a single-record document and links it to the unit and the document", async () => {
    givenChunks(chunk(0, 1, [{ prompt: "A?", answer: "a" }, { prompt: "B?", answer: "b" }]));

    const result = await importQuestionsToUnit("doc-1-chunk-0", "unit-1", null, "owner", "identity");

    expect(result).toMatchObject({ success: true, imported: 2, skipped: 0, errors: 0 });
    expect(models.QuestionUnit.create).toHaveBeenCalledTimes(2);
    expect(models.DocumentQuestion.create).toHaveBeenCalledWith({
      questionID: "q-A?",
      documentID: "doc-1",
      owner: "owner",
      entryKey: "a?",
    });
    expect(models.ParsedContent.update.mock.calls[0][0]).toMatchObject({
      id: "doc-1-chunk-0",
      _version: 3,
      importedAt: expect.any(String),
    });
  });

  it("records the page and source text on the document link", async () => {
    givenChunks(
      chunk(0, 1, [{ prompt: "Where?", answer: "Here", page: 4, sourceText: "  It is here.  " }]),
    );

    await importQuestionsToUnit("doc-1-chunk-0", "unit-1", null, "owner", "identity");

    expect(models.DocumentQuestion.create).toHaveBeenCalledWith(
      expect.objectContaining({ page: 4, sourceText: "It is here.", entryKey: "where?" }),
    );
  });

  it("loads the document's links once and does not link a question twice", async () => {
    givenChunks(
      chunk(0, 1, [
        { prompt: "A?", answer: "a" },
        { prompt: "B?", answer: "b" },
      ]),
    );
    models.DocumentQuestion.list.mockResolvedValue({
      data: [{ id: "dq-1", documentID: "doc-1", questionID: "q-A?", entryKey: "a?" }],
    });

    await importQuestionsToUnit("doc-1-chunk-0", "unit-1", null, "owner", "identity");

    expect(models.DocumentQuestion.list).toHaveBeenCalledTimes(1);
    expect(models.DocumentQuestion.create).toHaveBeenCalledTimes(1);
    expect(models.DocumentQuestion.create).toHaveBeenCalledWith(
      expect.objectContaining({ questionID: "q-B?" }),
    );
  });

  it("ignores links in the recycle bin", async () => {
    givenChunks(chunk(0, 1, [{ prompt: "A?", answer: "a" }]));
    models.DocumentQuestion.list.mockResolvedValue({
      data: [
        {
          id: "dq-1",
          documentID: "doc-1",
          questionID: "q-A?",
          entryKey: "a?",
          deletedAt: "2026-10-01T00:00:00.000Z",
        },
      ],
    });

    await importQuestionsToUnit("doc-1-chunk-0", "unit-1", null, "owner", "identity");

    expect(models.DocumentQuestion.create).toHaveBeenCalledTimes(1);
  });

  it("imports the questions of every chunk and marks only the primary record imported", async () => {
    givenChunks(
      chunk(1, 2, [{ prompt: "C?", answer: "c" }]),
      chunk(0, 2, [{ prompt: "A?", answer: "a" }, { prompt: "B?", answer: "b" }]),
    );

    // Starting from the second chunk's id still finds the whole document.
    const result = await importQuestionsToUnit("doc-1-chunk-1", "unit-1", null, "o", "i");

    expect(result).toMatchObject({ imported: 3 });
    expect(models.Question.create.mock.calls.map(([input]) => input.prompt)).toEqual([
      "A?",
      "B?",
      "C?",
    ]);
    expect(models.ParsedContent.update).toHaveBeenCalledTimes(1);
    expect(models.ParsedContent.update.mock.calls[0][0]).toMatchObject({ id: "doc-1-chunk-0" });
  });

  it("selects questions by their position in the merged list", async () => {
    givenChunks(
      chunk(0, 2, [{ prompt: "A?", answer: "a" }]),
      chunk(1, 2, [{ prompt: "B?", answer: "b" }, { prompt: "C?", answer: "c" }]),
    );

    const result = await importQuestionsToUnit("doc-1-chunk-0", "unit-1", [2], "o", "i");

    expect(result).toMatchObject({ imported: 1 });
    expect(models.Question.create).toHaveBeenCalledWith(expect.objectContaining({ prompt: "C?" }));
  });

  it("counts an entry with no prompt as an error and skips one already in the bank", async () => {
    givenChunks(chunk(0, 1, [{ answer: "orphan" }, { prompt: "Known?", answer: "k" }]));
    models.Question.list.mockResolvedValue({ data: [{ id: "q-known", prompt: "Known?" }] });

    const result = await importQuestionsToUnit("doc-1-chunk-0", "unit-1", null, "o", "i");

    expect(result).toMatchObject({ imported: 0, skipped: 1, errors: 1 });
    expect(result.errorDetails[0]).toMatchObject({ error: "Empty prompt" });
  });

  it("reports an empty or missing record without throwing", async () => {
    givenChunks(chunk(0, 1, []));
    expect(await importQuestionsToUnit("doc-1-chunk-0", "u", null, "o", "i")).toMatchObject({
      success: true,
      imported: 0,
      message: "No questions to import",
    });

    givenChunks(null);
    expect(await importQuestionsToUnit("missing", "u", null, "o", "i")).toMatchObject({
      success: false,
    });
  });
});

describe("updateQuestionItem", () => {
  it("writes typed entries with only declared fields and the record version", async () => {
    givenChunks(
      chunk(0, 1, [
        { prompt: "A?", answer: "a", hint: null, page: 1 },
        { prompt: "B?", answer: "b" },
      ]),
    );

    const ok = await updateQuestionItem("doc-1-chunk-0", 0, { answer: "edited", editedBy: "ui" });

    expect(ok).toBe(true);
    expect(models.ParsedContent.update).toHaveBeenCalledWith({
      id: "doc-1-chunk-0",
      _version: 3,
      questionsJSON: [
        { prompt: "A?", answer: "edited", page: 1 },
        { prompt: "B?", answer: "b" },
      ],
    });
  });

  it("edits a question in a later chunk and writes only that chunk", async () => {
    givenChunks(
      chunk(0, 2, [{ prompt: "A?", answer: "a" }]),
      chunk(1, 2, [{ prompt: "B?", answer: "b" }, { prompt: "C?", answer: "c" }]),
    );

    // Merged order: A (chunk 0), B and C (chunk 1).
    expect(await updateQuestionItem("doc-1-chunk-0", 2, { prompt: "C edited?" })).toBe(true);

    expect(models.ParsedContent.update).toHaveBeenCalledTimes(1);
    expect(models.ParsedContent.update).toHaveBeenCalledWith({
      id: "doc-1-chunk-1",
      _version: 4,
      questionsJSON: [
        { prompt: "B?", answer: "b" },
        { prompt: "C edited?", answer: "c" },
      ],
    });
  });

  it("rejects an out-of-range index and a missing record without writing", async () => {
    givenChunks(chunk(0, 1, [{ prompt: "A?" }]));
    expect(await updateQuestionItem("doc-1-chunk-0", 5, { answer: "x" })).toBe(false);

    givenChunks(null);
    expect(await updateQuestionItem("missing", 0, { answer: "x" })).toBe(false);
    expect(models.ParsedContent.update).not.toHaveBeenCalled();
  });
});
