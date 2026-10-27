import { describe, it, expect, vi } from "vitest";
import {
  describeItemSources,
  documentRefFrom,
  entryKeyFor,
  importedEntryKeys,
  indexLinksByItem,
  inDocumentScope,
  linkDetails,
  linkItemToDocument,
  listDocumentLinks,
  listItemSources,
  questionEntryKey,
  summarizeDocumentLinks,
  wordEntryKey,
  SOURCE_TEXT_LIMIT,
} from "../../src/utils/documentLinks";

const link = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  documentID: "doc-1",
  questionID: `q-${id}`,
  ...extra,
});

describe("entry keys", () => {
  it("normalizes the prompt and the word the way the importers do", () => {
    expect(questionEntryKey("  What Is A Cell?  ")).toBe("what is a cell?");
    expect(wordEntryKey(" Path ")).toBe("path");
    expect(questionEntryKey(undefined)).toBe("");
    expect(entryKeyFor("question", { prompt: "A?" })).toBe("a?");
    expect(entryKeyFor("word", { word: "Aleph" })).toBe("aleph");
  });
});

describe("linkDetails", () => {
  it("records the page, a trimmed source snippet and the key", () => {
    expect(
      linkDetails("question", { prompt: "A?", page: 3, sourceText: "  from the text  " }),
    ).toEqual({ page: 3, sourceText: "from the text", entryKey: "a?" });
  });

  it("uses a word's context as its source text and omits what is missing", () => {
    expect(linkDetails("word", { word: "Path", context: "a narrow path" })).toEqual({
      sourceText: "a narrow path",
      entryKey: "path",
    });
    expect(linkDetails("word", { word: "Path", page: Number.NaN })).toEqual({ entryKey: "path" });
    expect(linkDetails("question", null)).toEqual({ entryKey: "" });
  });

  it("caps the source snippet", () => {
    const { sourceText } = linkDetails("question", { prompt: "A?", sourceText: "x".repeat(1000) });
    expect(sourceText).toHaveLength(SOURCE_TEXT_LIMIT);
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
  it("indexes by the linked item and collects imported keys", () => {
    const links = [link("1", { entryKey: "a?" }), link("2", { entryKey: "b?" }), link("3")];
    expect([...indexLinksByItem("question", links).keys()]).toEqual(["q-1", "q-2", "q-3"]);
    expect([...importedEntryKeys(links)]).toEqual(["a?", "b?"]);
  });
});

describe("linkItemToDocument", () => {
  const client = (create: ReturnType<typeof vi.fn>) => ({ models: { DocumentQuestion: { create } } });

  it("creates the link with the entry's details and remembers it", async () => {
    const create = vi.fn().mockResolvedValue({ data: { id: "new", documentID: "doc-1", questionID: "q1" } });
    const existing = new Map();

    const created = await linkItemToDocument(client(create), "question", {
      itemId: "q1",
      documentId: "doc-1",
      owner: "me",
      entry: { prompt: "A?", page: 2 },
      existing,
    });

    expect(created?.id).toBe("new");
    expect(create).toHaveBeenCalledWith({
      questionID: "q1",
      documentID: "doc-1",
      owner: "me",
      page: 2,
      entryKey: "a?",
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
  it("lists live sources with file names, fetching each document once", async () => {
    const relation = vi.fn().mockResolvedValue({
      data: [
        link("1", { page: 4, sourceText: "snippet" }),
        link("2", { documentID: "doc-1" }),
        link("3", { documentID: "doc-2", deletedAt: "2026-10-01" }),
      ],
    });
    const documentGet = vi.fn().mockResolvedValue({ data: { filename: "notes.pdf" } });
    const client = {
      models: {
        Question: { get: vi.fn().mockResolvedValue({ data: { documentQuestions: relation } }) },
        Document: { get: documentGet },
      },
    };

    const sources = await listItemSources(client, "question", "q1");

    expect(sources).toEqual([
      { linkId: "1", documentId: "doc-1", filename: "notes.pdf", page: 4, sourceText: "snippet" },
      { linkId: "2", documentId: "doc-1", filename: "notes.pdf", page: null, sourceText: null },
    ]);
    expect(documentGet).toHaveBeenCalledTimes(1);
  });

  it("uses a record that is already loaded", async () => {
    const client = {
      models: {
        Word: { get: vi.fn() },
        Document: { get: vi.fn().mockResolvedValue({ data: { filename: "f.pdf" } }) },
      },
    };
    const record = { documentWords: [{ id: "l", documentID: "doc-1", wordID: "w1", page: 1 }] };

    const sources = await listItemSources(client, "word", "w1", record);

    expect(sources).toHaveLength(1);
    expect(client.models.Word.get).not.toHaveBeenCalled();
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
