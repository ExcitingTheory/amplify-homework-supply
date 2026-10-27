import { describe, expect, it, vi } from "vitest";
import {
  createGraphqlParsedContentStore,
  listParsedContentChunksByRelation,
} from "../../amplify/functions/shared/parsedContentGraphql";
import { saveParsedContentChunks } from "../../amplify/functions/shared/parsedContentChunks";
import {
  createParsedContentStore,
  listParsedContentChunks,
  loadMergedParsedContent,
  updateMergedListEntry,
} from "../../src/utils/parsedContentChunks";

type Row = Record<string, any>;

describe("listParsedContentChunks (client)", () => {
  it("reads every page of the document's parsedContent relationship", async () => {
    const pages: Record<string, Row> = {
      first: { data: [{ id: "c0" }], nextToken: "t1" },
      t1: { data: [{ id: "c1" }, null] },
    };
    const parsedContent = vi.fn(async ({ nextToken }: Row) => pages[nextToken ?? "first"]);
    const client = {
      models: {
        Document: { get: vi.fn(async () => ({ data: { id: "doc-1", parsedContent } })) },
        ParsedContent: { list: vi.fn() },
      },
    };

    const chunks = await listParsedContentChunks(client, { documentId: "doc-1" });

    expect(chunks.map((chunk) => chunk.id)).toEqual(["c0", "c1"]);
    expect(parsedContent).toHaveBeenCalledWith({ limit: 100, nextToken: undefined });
    expect(parsedContent).toHaveBeenCalledWith({ limit: 100, nextToken: "t1" });
    // The indexed relationship is used, never a scan of the table.
    expect(client.models.ParsedContent.list).not.toHaveBeenCalled();
  });

  it("uses a parent that is already loaded without fetching it again", async () => {
    const parsedContent = vi.fn(async () => ({ data: [{ id: "c0" }] }));
    const client = { models: { Document: { get: vi.fn() }, ParsedContent: { list: vi.fn() } } };

    await listParsedContentChunks(client, { documentId: "doc-1", document: { parsedContent } });

    expect(client.models.Document.get).not.toHaveBeenCalled();
  });

  it("loads a file's chunks through the file relationship", async () => {
    const parsedContent = vi.fn(async () => ({ data: [{ id: "c0" }] }));
    const client = {
      models: {
        File: { get: vi.fn(async () => ({ data: { id: "file-1", parsedContent } })) },
        ParsedContent: { list: vi.fn() },
      },
    };

    expect(await listParsedContentChunks(client, { fileId: "file-1" })).toEqual([{ id: "c0" }]);
    expect(client.models.File.get).toHaveBeenCalledWith({ id: "file-1" });
  });

  it("accepts a relationship that is already an array", async () => {
    const client = {
      models: {
        Document: { get: vi.fn(async () => ({ data: { parsedContent: [{ id: "c0" }, null] } })) },
        ParsedContent: { list: vi.fn() },
      },
    };
    expect(await listParsedContentChunks(client, { documentId: "d" })).toEqual([{ id: "c0" }]);
  });

  it("falls back to a filtered list where the client has no relationship loaders", async () => {
    const list = vi.fn(async () => ({ data: [{ id: "c0" }] }));
    const client = {
      models: { Document: { get: vi.fn(async () => ({ data: { id: "d" } })) }, ParsedContent: { list } },
    };

    await listParsedContentChunks(client, { documentId: "d" });

    expect(list).toHaveBeenCalledWith({ filter: { documentID: { eq: "d" } }, nextToken: undefined });
  });

  it("raises a page's errors rather than returning a partial list", async () => {
    const parsedContent = vi.fn(async () => ({ data: [], errors: [{ message: "denied" }] }));
    const client = { models: { Document: { get: vi.fn(async () => ({ data: { parsedContent } })) } } };

    await expect(listParsedContentChunks(client as any, { documentId: "d" })).rejects.toThrow(
      "Could not list ParsedContent: denied",
    );
  });
});

describe("loadMergedParsedContent (client)", () => {
  function clientWith(chunks: Row[]) {
    const records = new Map(chunks.map((chunk) => [chunk.id, chunk]));
    return {
      models: {
        ParsedContent: {
          get: vi.fn(async ({ id }: Row) => ({ data: records.get(id) ?? null })),
          list: vi.fn(async () => ({ data: chunks })),
        },
        Document: { get: vi.fn(async ({ id }: Row) => ({ data: { id } })) },
        File: { get: vi.fn(async ({ id }: Row) => ({ data: { id } })) },
      },
    };
  }
  const chunks = [
    { id: "d-chunk-1", documentID: "d", chunkIndex: 1, questionsJSON: [{ prompt: "b" }] },
    { id: "d-chunk-0", documentID: "d", chunkIndex: 0, importedAt: "t", questionsJSON: [{ prompt: "a" }] },
  ];

  it("finds a document's siblings from the id of any one of its chunks", async () => {
    const merged = await loadMergedParsedContent(clientWith(chunks), { id: "d-chunk-1" });

    expect(merged?.id).toBe("d-chunk-0");
    expect(merged?.importedAt).toBe("t");
    expect(merged?.questionsJSON).toEqual([{ prompt: "a" }, { prompt: "b" }]);
  });

  it("loads by document id or file id", async () => {
    expect((await loadMergedParsedContent(clientWith(chunks), { documentId: "d" }))?.chunks).toHaveLength(2);
    expect((await loadMergedParsedContent(clientWith(chunks), { fileId: "f" }))?.chunks).toHaveLength(2);
  });

  it("returns null when the record or the document has no content", async () => {
    expect(await loadMergedParsedContent(clientWith(chunks), { id: "missing" })).toBeNull();
    expect(await loadMergedParsedContent(clientWith(chunks), {})).toBeNull();
    expect(await loadMergedParsedContent(clientWith([]), { documentId: "d" })).toBeNull();
  });
});

describe("updateMergedListEntry (client)", () => {
  const merged = {
    chunks: [
      { id: "c0", chunkIndex: 0, vocabularyCount: 0, questionCount: 2 },
      { id: "c1", chunkIndex: 1, vocabularyCount: 0, questionCount: 2 },
    ],
  };
  const stored: Record<string, Row> = {
    c0: { id: "c0", _version: 7, questionsJSON: [{ prompt: "a" }, { prompt: "b" }] },
    c1: { id: "c1", _version: 9, questionsJSON: [{ prompt: "c" }, { prompt: "d", hint: null }] },
  };
  const makeClient = (updateResult: Row = { data: {} }) => ({
    models: {
      ParsedContent: {
        get: vi.fn(async ({ id }: Row) => ({ data: stored[id] ?? null })),
        update: vi.fn(async () => updateResult),
      },
    },
  });
  const pick = (entries: unknown[]) => (entries as Row[]).map(({ hint, ...rest }) => rest);

  it("writes only the chunk that holds the entry, with that chunk's current version", async () => {
    const client = makeClient();

    await updateMergedListEntry(client, merged, "questionsJSON", 3, { answer: "new" }, pick);

    expect(client.models.ParsedContent.update).toHaveBeenCalledTimes(1);
    expect(client.models.ParsedContent.update).toHaveBeenCalledWith({
      id: "c1",
      _version: 9,
      questionsJSON: [{ prompt: "c" }, { prompt: "d", answer: "new" }],
    });
  });

  it("rejects an index outside the list or a chunk that has gone", async () => {
    await expect(
      updateMergedListEntry(makeClient(), merged, "questionsJSON", 4, {}, pick),
    ).rejects.toThrow("Invalid item index: 4");
    await expect(
      updateMergedListEntry(
        makeClient(),
        { chunks: [{ id: "gone", chunkIndex: 0, vocabularyCount: 0, questionCount: 1 }] },
        "questionsJSON",
        0,
        {},
        pick,
      ),
    ).rejects.toThrow("ParsedContent not found: gone");
  });

  it("raises a failed write", async () => {
    await expect(
      updateMergedListEntry(
        makeClient({ errors: [{ message: "conflict" }] }),
        merged,
        "questionsJSON",
        0,
        {},
        pick,
      ),
    ).rejects.toThrow("Could not update ParsedContent: conflict");
  });
});

describe("createParsedContentStore (client)", () => {
  it("deletes with the record's version when it has one, and raises errors", async () => {
    const remove = vi.fn(async () => ({}));
    const client = { models: { ParsedContent: { delete: remove }, Document: { get: vi.fn() } } };
    const store = createParsedContentStore(client, "d");

    await store.remove({ id: "a", _version: 3 });
    await store.remove({ id: "b" });

    expect(remove).toHaveBeenNthCalledWith(1, { id: "a", _version: 3 });
    expect(remove).toHaveBeenNthCalledWith(2, { id: "b" });

    client.models.ParsedContent.delete = vi.fn(async () => ({ errors: [{ message: "no" }] })) as any;
    await expect(store.remove({ id: "c" })).rejects.toThrow("Could not delete ParsedContent: no");
  });
});

describe("listParsedContentChunksByRelation (GraphQL)", () => {
  it("queries the document relationship, selects the chunk fields, and follows pages", async () => {
    const graphql = vi.fn(async ({ variables }: Row) => ({
      data: {
        getDocument: {
          parsedContent: variables.nextToken
            ? { items: [{ id: "c1" }], nextToken: null }
            : { items: [{ id: "c0" }], nextToken: "t1" },
        },
      },
    }));

    const chunks = await listParsedContentChunksByRelation(
      graphql,
      { type: "Document", id: "doc-1" },
      "questionsJSON { prompt }",
    );

    expect(chunks.map((chunk) => chunk.id)).toEqual(["c0", "c1"]);
    const { query, variables } = graphql.mock.calls[0][0] as Row;
    expect(query).toContain("getDocument(id: $id)");
    expect(query).toContain("parsedContent(limit: 100, nextToken: $nextToken)");
    expect(query).toContain("chunkIndex chunkCount");
    expect(query).toContain("questionsJSON { prompt }");
    expect(variables).toEqual({ id: "doc-1", nextToken: undefined });
    expect(graphql.mock.calls[1][0].variables).toEqual({ id: "doc-1", nextToken: "t1" });
  });

  it("queries a file's relationship, returns nothing when the parent is missing, and raises errors", async () => {
    const graphql = vi.fn(async () => ({ data: { getFile: null } }));
    expect(await listParsedContentChunksByRelation(graphql, { type: "File", id: "f" })).toEqual([]);
    expect((graphql.mock.calls[0] as any)[0].query).toContain("getFile(id: $id)");

    await expect(
      listParsedContentChunksByRelation(
        async () => ({ errors: [{ message: "unauthorized" }] }),
        { type: "File", id: "f" },
      ),
    ).rejects.toThrow("Could not list ParsedContent for File f: unauthorized");
  });
});

describe("createGraphqlParsedContentStore", () => {
  /** A GraphQL stand-in over an in-memory table that logs each mutation. */
  function fakeGraphql(initial: Row[]) {
    const rows = new Map(initial.map((row) => [row.id, { ...row }]));
    const log: Array<[string, Row]> = [];
    const graphql = vi.fn(async ({ query, variables }: Row) => {
      if (query.includes("getDocument")) {
        return { data: { getDocument: { parsedContent: { items: [...rows.values()] } } } };
      }
      const input = variables.input as Row;
      if (query.includes("createParsedContent")) {
        log.push(["create", input]);
        rows.set(input.id, { _version: 1, ...input });
      } else if (query.includes("updateParsedContent")) {
        log.push(["update", input]);
        rows.set(input.id, { ...rows.get(input.id), ...input });
      } else if (query.includes("deleteParsedContent")) {
        log.push(["delete", input]);
        rows.delete(input.id);
      }
      return { data: {} };
    });
    return { graphql, rows, log };
  }

  it("saves a document's chunks the way finalize does, and replaces them on a re-run", async () => {
    const { graphql, rows, log } = fakeGraphql([]);
    const store = createGraphqlParsedContentStore(graphql, "doc-1");
    const content = {
      questionsJSON: [
        { prompt: "p1", answer: "x".repeat(300), page: 1 },
        { prompt: "p2", answer: "x".repeat(300), page: 2 },
      ],
    };

    await saveParsedContentChunks(store, {
      documentID: "doc-1",
      fileID: "file-1",
      content,
      fields: { modelUsed: "gpt-4o" },
      budgetBytes: 450,
    });
    expect(log.map(([kind, input]) => `${kind} ${input.id}`)).toEqual([
      "create doc-1-chunk-0",
      "create doc-1-chunk-1",
    ]);
    expect(rows.get("doc-1-chunk-0")).toMatchObject({ fileID: "file-1", modelUsed: "gpt-4o", chunkCount: 2 });

    log.length = 0;
    await saveParsedContentChunks(store, {
      documentID: "doc-1",
      fileID: "file-1",
      content: { questionsJSON: [{ prompt: "p1", page: 1 }] },
      fields: { modelUsed: "gpt-4o" },
      budgetBytes: 450,
    });
    expect(log.map(([kind, input]) => `${kind} ${input.id}`)).toEqual([
      "update doc-1-chunk-0",
      "delete doc-1-chunk-1",
    ]);
    // Updates carry the stored version; deletes do too.
    expect(log[0][1]._version).toBe(1);
    expect(log[1][1]).toEqual({ id: "doc-1-chunk-1", _version: 1 });
  });

  it("raises a mutation's errors", async () => {
    const store = createGraphqlParsedContentStore(
      async () => ({ errors: [{ message: "limit" }] }),
      "doc-1",
    );
    await expect(store.create({ id: "x" })).rejects.toThrow("Could not create ParsedContent x: limit");
    await expect(store.update({ id: "x" })).rejects.toThrow("Could not update ParsedContent x: limit");
    await expect(store.remove({ id: "x" })).rejects.toThrow("Could not delete ParsedContent x: limit");
  });
});
