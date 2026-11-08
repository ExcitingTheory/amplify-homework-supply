import { describe, it, expect, vi } from "vitest";
import {
  describeItemSources,
  documentRefFrom,
  entryOriginsFrom,
  indexLinksByItem,
  inDocumentScope,
  linkItemToDocument,
  listDocumentLinks,
  listImportedItemIds,
  listItemSources,
  summarizeDocumentLinks,
  SOURCE_TEXT_LIMIT,
} from "../../src/utils/documentLinks";

const link = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  documentID: "doc-1",
  questionID: `q-${id}`,
  ...extra,
});

describe("entryOriginsFrom", () => {
  it("keys each imported entry by the id it became and records its first page and trimmed snippet", () => {
    const origins = entryOriginsFrom(
      { questionsJSON: [{ prompt: "A?", questionID: "q1", pages: [5, 3], sourceText: "  from the text  " }] },
      "question",
    );
    expect(origins.get("q1")).toEqual({ page: 3, sourceText: "from the text" });
  });

  it("is unaffected by the entry's text, uses a word's context as its snippet and skips entries without an id", () => {
    const origins = entryOriginsFrom(
      {
        vocabularyJSON: [
          { word: "Renamed since import", wordID: "w1", context: "a narrow path" },
          { word: "Aleph", wordID: "w2", pages: [Number.NaN] },
          { word: "Not imported yet", pages: [1] },
          { definition: "no word", wordID: "" },
          null,
        ],
      },
      "word",
    );
    expect(origins.get("w1")).toEqual({ sourceText: "a narrow path" });
    expect(origins.get("w2")).toEqual({});
    expect(origins.size).toBe(2);
    expect(entryOriginsFrom(null, "question").size).toBe(0);
  });

  it("keeps the first of two entries with the same id, and caps the snippet", () => {
    const origins = entryOriginsFrom(
      {
        questionsJSON: [
          { prompt: "A?", questionID: "q1", pages: [1], sourceText: "x".repeat(1000) },
          { prompt: "A again?", questionID: "q1", pages: [9] },
        ],
      },
      "question",
    );
    expect(origins.get("q1")?.page).toBe(1);
    expect(origins.get("q1")?.sourceText).toHaveLength(SOURCE_TEXT_LIMIT);
  });
});

describe("listDocumentLinks", () => {
  it("reads every page of the document's relationship and drops recycled links", async () => {
    const relation = vi
      .fn()
      .mockResolvedValueOnce({ data: [link("1"), link("2", { deletedAt: "2026-10-01" })], nextToken: "t" })
      .mockResolvedValueOnce({ data: [link("3"), link("4", { _deleted: true })], nextToken: null });
    const client = { models: { Document: { get: vi.fn() } } };

    const links = await listDocumentLinks(client, "doc-1", "question", { documentQuestions: relation });

    expect(links.map((l) => l.id)).toEqual(["1", "3"]);
    expect(relation).toHaveBeenNthCalledWith(1, { limit: 100, nextToken: undefined });
    expect(relation).toHaveBeenNthCalledWith(2, { limit: 100, nextToken: "t" });
    expect(client.models.Document.get).not.toHaveBeenCalled();
  });

  it("loads the document when it is not passed, and reads a word relationship", async () => {
    const relation = vi.fn().mockResolvedValue({ data: [{ id: "w1", documentID: "doc-1", wordID: "w" }] });
    const client = { models: { Document: { get: vi.fn().mockResolvedValue({ data: { documentWords: relation } }) } } };

    expect(await listDocumentLinks(client, "doc-1", "word")).toHaveLength(1);
    expect(client.models.Document.get).toHaveBeenCalledWith({ id: "doc-1" });
  });

  it("falls back to a filtered list when the client has no relationship loaders", async () => {
    const list = vi.fn().mockResolvedValue({ data: [link("1")], nextToken: null });
    const client = { models: { DocumentQuestion: { list }, Document: { get: vi.fn().mockResolvedValue({ data: {} }) } } };

    expect(await listDocumentLinks(client, "doc-1", "question")).toHaveLength(1);
    expect(list).toHaveBeenCalledWith({ filter: { documentID: { eq: "doc-1" } }, nextToken: undefined });
  });

  it("reports errors from the relationship", async () => {
    const relation = vi.fn().mockResolvedValue({ data: [], errors: [{ message: "denied" }] });
    await expect(
      listDocumentLinks({ models: {} }, "doc-1", "question", { documentQuestions: relation }),
    ).rejects.toThrow("denied");
  });
});

describe("indexing links", () => {
  it("indexes by the linked item", () => {
    const links = [link("1"), link("2"), link("3")];
    expect([...indexLinksByItem("question", links).keys()]).toEqual(["q-1", "q-2", "q-3"]);
  });
});

describe("listImportedItemIds", () => {
  it("lists the ids of the items behind a document's live links", async () => {
    const relation = vi.fn().mockResolvedValue({
      data: [link("1"), link("2", { deletedAt: "2026-10-01" }), link("3")],
    });
    const client = { models: { Document: { get: vi.fn().mockResolvedValue({ data: { documentQuestions: relation } }) } } };

    expect([...(await listImportedItemIds(client, "doc-1", "question"))]).toEqual(["q-1", "q-3"]);
  });

  it("reads a word relationship by word id", async () => {
    const relation = vi.fn().mockResolvedValue({ data: [{ id: "l", documentID: "doc-1", wordID: "w1" }] });
    const client = { models: { Document: { get: vi.fn().mockResolvedValue({ data: { documentWords: relation } }) } } };

    expect([...(await listImportedItemIds(client, "doc-1", "word"))]).toEqual(["w1"]);
  });
});

describe("linkItemToDocument", () => {
  const client = (create: ReturnType<typeof vi.fn>) => ({ models: { DocumentQuestion: { create } } });

  it("creates the link without any entry details and remembers it", async () => {
    const create = vi.fn().mockResolvedValue({ data: { id: "new", documentID: "doc-1", questionID: "q1" } });
    const existing = new Map();

    const created = await linkItemToDocument(client(create), "question", {
      itemId: "q1",
      documentId: "doc-1",
      owner: "me",
      existing,
    });

    expect(created?.id).toBe("new");
    expect(create).toHaveBeenCalledWith({
      questionID: "q1",
      documentID: "doc-1",
      owner: "me",
    });
    expect(existing.get("q1")?.id).toBe("new");

    // A second call finds it instead of creating another
    await linkItemToDocument(client(create), "question", {
      itemId: "q1",
      documentId: "doc-1",
      owner: "me",
      existing,
    });
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("does nothing without a document", async () => {
    const create = vi.fn();
    expect(
      await linkItemToDocument(client(create), "question", { itemId: "q1", documentId: "", owner: "me" }),
    ).toBeNull();
    expect(create).not.toHaveBeenCalled();
  });

  it("throws when the create is rejected", async () => {
    const create = vi.fn().mockResolvedValue({ data: null, errors: [{ message: "nope" }] });
    await expect(
      linkItemToDocument(client(create), "question", {
        itemId: "q1",
        documentId: "doc-1",
        owner: "me",
        existing: new Map(),
      }),
    ).rejects.toThrow("nope");
  });
});

describe("listItemSources", () => {
  const contentWith = (entries: unknown[]) => ({
    parsedContent: vi.fn().mockResolvedValue({ data: [{ id: "c", chunkIndex: 0, questionsJSON: entries }] }),
  });

  it("lists live sources with file names and the page and snippet read from each document's content", async () => {
    const relation = vi.fn().mockResolvedValue({
      data: [
        link("1"),
        link("2", { documentID: "doc-2" }),
        link("3", { documentID: "doc-3", deletedAt: "2026-10-01" }),
      ],
    });
    const documentGet = vi.fn(async ({ id }: { id: string }) => ({
      data: {
        filename: id === "doc-1" ? "notes.pdf" : "other.pdf",
        ...(id === "doc-1"
          ? contentWith([{ prompt: "Reworded since import?", questionID: "q1", pages: [4, 6], sourceText: "snippet" }])
          : contentWith([])),
      },
    }));
    const client = {
      models: {
        Question: { get: vi.fn().mockResolvedValue({ data: { prompt: "What is a cell?", documentQuestions: relation } }) },
        Document: { get: documentGet },
      },
    };

    const sources = await listItemSources(client, "question", "q1");

    expect(sources).toEqual([
      { linkId: "1", documentId: "doc-1", filename: "notes.pdf", page: 4, sourceText: "snippet" },
      { linkId: "2", documentId: "doc-2", filename: "other.pdf", page: null, sourceText: null },
    ]);
  });

  it("uses a record that is already loaded and reads each document's content once per cache", async () => {
    const parsedContent = vi.fn().mockResolvedValue({
      data: [{ id: "c", chunkIndex: 0, vocabularyJSON: [{ word: "Path", wordID: "w1", pages: [2], context: "a narrow path" }] }],
    });
    const client = {
      models: {
        Word: { get: vi.fn() },
        Document: { get: vi.fn().mockResolvedValue({ data: { filename: "f.pdf", parsedContent } }) },
      },
    };
    const originsCache = new Map();
    const record = { documentWords: [{ id: "l", documentID: "doc-1", wordID: "w1" }] };
    const other = { documentWords: [{ id: "m", documentID: "doc-1", wordID: "w2" }] };

    const [first] = await listItemSources(client, "word", "w1", record, { originsCache });
    const [second] = await listItemSources(client, "word", "w2", other, { originsCache });

    expect(first).toMatchObject({ page: 2, sourceText: "a narrow path" });
    expect(second).toMatchObject({ page: null, sourceText: null });
    expect(client.models.Word.get).not.toHaveBeenCalled();
    expect(parsedContent).toHaveBeenCalledTimes(1);
  });

  it("still lists the document when its content cannot be read", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const client = {
      models: {
        Document: {
          get: vi.fn().mockResolvedValue({
            data: { filename: "f.pdf", parsedContent: vi.fn().mockRejectedValue(new Error("boom")) },
          }),
        },
      },
    };
    const record = { documentQuestions: [{ id: "l", documentID: "doc-1", questionID: "q1" }] };

    expect(await listItemSources(client, "question", "q1", record)).toEqual([
      { linkId: "l", documentId: "doc-1", filename: "f.pdf", page: null, sourceText: null },
    ]);
    error.mockRestore();
  });
});

describe("summarizeDocumentLinks", () => {
  it("counts the questions and words imported from a document", async () => {
    const client = {
      models: {
        Document: {
          get: vi.fn().mockResolvedValue({
            data: {
              documentQuestions: vi.fn().mockResolvedValue({ data: [link("1"), link("2")] }),
              documentWords: vi.fn().mockResolvedValue({ data: [{ id: "w", documentID: "doc-1" }] }),
            },
          }),
        },
      },
    };
    expect(await summarizeDocumentLinks(client, "doc-1")).toEqual({ questions: 2, words: 1 });
  });
});

describe("drill helpers", () => {
  const sources = [
    { linkId: "1", documentId: "doc-1", filename: "a.pdf", page: null, sourceText: null },
    { linkId: "2", documentId: "doc-2", filename: "b.pdf", page: 7, sourceText: null },
  ];

  it("tests whether any source is in scope", () => {
    expect(inDocumentScope(sources, new Set(["doc-2"]))).toBe(true);
    expect(inDocumentScope(sources, new Set(["doc-3"]))).toBe(false);
    expect(inDocumentScope(undefined, new Set(["doc-1"]))).toBe(false);
  });

  it("describes sources for a prompt", () => {
    expect(describeItemSources(sources)).toBe(" [source: a.pdf; b.pdf, p.7]");
    expect(describeItemSources([])).toBe("");
    expect(describeItemSources(undefined)).toBe("");
  });

  it("references the first source that has a file and a page", () => {
    expect(documentRefFrom(sources)).toEqual({ filename: "b.pdf", page: 7 });
    expect(documentRefFrom([sources[0]])).toBeUndefined();
  });
});
