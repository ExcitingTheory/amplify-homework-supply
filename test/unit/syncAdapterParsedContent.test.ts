import { describe, expect, it, vi } from "vitest";
import * as Y from "yjs";
import { SyncAdapter } from "../../src/yjs/SyncAdapter";

type Row = Record<string, any>;

/** An in-memory ParsedContent model that records every write. */
function setup(initial: Row[]) {
  const records = new Map<string, Row>(initial.map((row) => [row.id, structuredClone(row)]));
  const writes = { create: [] as Row[], update: [] as Row[], delete: [] as Row[] };

  const ParsedContent = {
    get: vi.fn(async ({ id }: { id: string }) => ({ data: records.get(id) ?? null })),
    list: vi.fn(async () => ({ data: [...records.values()] })),
    create: vi.fn(async (input: Row) => {
      writes.create.push(input);
      records.set(input.id, { _version: 1, ...input });
      return { data: input };
    }),
    update: vi.fn(async (input: Row) => {
      writes.update.push(input);
      records.set(input.id, { ...records.get(input.id), ...input, _version: input._version + 1 });
      return { data: input };
    }),
    delete: vi.fn(async (input: Row) => {
      writes.delete.push(input);
      records.delete(input.id);
      return { data: input };
    }),
  };
  // No relationship loader, so the adapter lists chunks with ParsedContent.list.
  const Document = { get: vi.fn(async ({ id }: { id: string }) => ({ data: { id } })) };

  const client = { models: { ParsedContent, Document } };
  return { adapter: new SyncAdapter({ client: client as any }), writes, records };
}

const chunk = (index: number, count: number, lists: Row = {}): Row => ({
  id: `doc-1-chunk-${index}`,
  documentID: "doc-1",
  fileID: "file-1",
  _version: 4,
  chunkIndex: index,
  chunkCount: count,
  vocabularyJSON: [],
  summariesJSON: [],
  objectivesJSON: [],
  conceptsJSON: [],
  questionsJSON: [],
  pendingMediaJSON: [],
  ...lists,
});

function docWith(lists: Row, status = "analyzing") {
  const ydoc = new Y.Doc();
  const map = ydoc.getMap("parsedContent");
  map.set("status", status);
  for (const [key, value] of Object.entries(lists)) map.set(key, value);
  return ydoc;
}

describe("SyncAdapter.syncParsedContent", () => {
  it("sends typed lists of declared fields and no fields ParsedContent lacks", async () => {
    const { adapter, writes } = setup([chunk(0, 1)]);
    const ydoc = docWith({
      progress: "40%",
      vocabularyJSON: [{ word: "Path", definition: null, page: 2, localId: "x" }],
      questionsJSON: [{ prompt: "q", answer: "a", ui: true }],
    });

    await adapter.syncParsedContent("doc-1-chunk-0", ydoc);

    expect(writes.update).toHaveLength(1);
    const input = writes.update[0];
    expect(input).toEqual({
      id: "doc-1-chunk-0",
      _version: 4,
      vocabularyJSON: [{ word: "Path", page: 2 }],
      summariesJSON: [],
      objectivesJSON: [],
      conceptsJSON: [],
      questionsJSON: [{ prompt: "q", answer: "a" }],
      pendingMediaJSON: [],
      chunkIndex: 0,
      chunkCount: 1,
    });
    expect(input).not.toHaveProperty("status");
    expect(input).not.toHaveProperty("progress");
    expect(writes.create).toHaveLength(0);
  });

  it("keeps the objectives and pending media the shared document does not carry", async () => {
    const { adapter, writes } = setup([
      chunk(0, 1, {
        objectivesJSON: [{ objective: "Explain", bloomLevel: null }],
        pendingMediaJSON: [
          { filename: "a.png", mimeType: "image/png", s3Key: "k", size: 3, description: null },
        ],
      }),
    ]);

    await adapter.syncParsedContent("doc-1-chunk-0", docWith({ questionsJSON: [{ prompt: "q" }] }));

    expect(writes.update[0]).toMatchObject({
      objectivesJSON: [{ objective: "Explain" }],
      pendingMediaJSON: [{ filename: "a.png", mimeType: "image/png", s3Key: "k", size: 3 }],
    });
  });

  it("writes nothing when the document matches what is stored", async () => {
    const { adapter, writes } = setup([
      chunk(0, 1, { questionsJSON: [{ prompt: "q", answer: "a", hint: null }] }),
    ]);

    await adapter.syncParsedContent(
      "doc-1-chunk-0",
      docWith({ questionsJSON: [{ prompt: "q", answer: "a" }] }),
    );

    expect(writes.update).toHaveLength(0);
    expect(writes.create).toHaveLength(0);
    expect(writes.delete).toHaveLength(0);
  });

  it("writes only the chunk that changed when a long document is edited", async () => {
    // Two pages, each too large to share a chunk with the other.
    const big = (page: number, text: string) => ({
      prompt: `p${page}`,
      answer: text,
      page,
    });
    const filler = "x".repeat(120_000);
    const { adapter, writes } = setup([
      chunk(0, 2, { questionsJSON: [big(1, filler)] }),
      chunk(1, 2, { questionsJSON: [big(2, filler)] }),
    ]);

    await adapter.syncParsedContent(
      "doc-1-chunk-0",
      docWith({ questionsJSON: [big(1, filler), big(2, `${filler}!`)] }),
    );

    expect(writes.update.map((write) => write.id)).toEqual(["doc-1-chunk-1"]);
    expect(writes.update[0].questionsJSON[0].answer.endsWith("!")).toBe(true);
    expect(writes.create).toHaveLength(0);
    expect(writes.delete).toHaveLength(0);
  });

  it("removes a chunk the document no longer needs", async () => {
    const filler = "x".repeat(120_000);
    const { adapter, writes, records } = setup([
      chunk(0, 2, { questionsJSON: [{ prompt: "p1", answer: filler, page: 1 }] }),
      chunk(1, 2, { questionsJSON: [{ prompt: "p2", answer: filler, page: 2 }] }),
    ]);

    await adapter.syncParsedContent(
      "doc-1-chunk-0",
      docWith({ questionsJSON: [{ prompt: "p1", answer: "short", page: 1 }] }),
    );

    expect(writes.delete.map((write) => write.id)).toEqual(["doc-1-chunk-1"]);
    expect(records.has("doc-1-chunk-1")).toBe(false);
    expect(records.get("doc-1-chunk-0")?.chunkCount).toBe(1);
  });

  it("skips the write when the record does not exist", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { adapter, writes } = setup([]);
    await adapter.syncParsedContent("missing", new Y.Doc());
    expect(writes.update).toHaveLength(0);
    expect(writes.create).toHaveLength(0);
    warn.mockRestore();
  });
});
