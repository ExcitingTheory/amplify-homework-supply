import { describe, expect, it, vi } from "vitest";
import * as amplifyChunks from "../../amplify/functions/shared/parsedContentChunks";
import * as clientChunks from "../../src/utils/parsedContentChunks";

type Chunks = typeof amplifyChunks;

const bytes = (entry: unknown) => new TextEncoder().encode(JSON.stringify(entry)).length + 1;
const listBytes = (list: unknown[]) => list.reduce<number>((sum, entry) => sum + bytes(entry), 0);
const chunkBytes = (chunk: amplifyChunks.ParsedContentChunk) =>
  amplifyChunks.PARSED_CONTENT_LIST_FIELDS.reduce((sum, field) => sum + listBytes(chunk[field]), 0);

const question = (page: number | undefined, n: number, pad = 0) => ({
  prompt: `q${page ?? "x"}-${n}`,
  answer: "a".repeat(pad),
  ...(page === undefined ? {} : { page }),
});
const word = (page: number | undefined, n: number) => ({
  word: `w${page ?? "x"}-${n}`,
  ...(page === undefined ? {} : { page }),
});
const pagesOf = (chunk: amplifyChunks.ParsedContentChunk) => [
  ...new Set(
    [...chunk.vocabularyJSON, ...chunk.questionsJSON].map((entry: any) => entry.page ?? 0),
  ),
];

describe.each([
  ["backend", amplifyChunks],
  ["client", clientChunks],
] as Array<[string, Chunks]>)("parsed content chunks (%s copy)", (_name, m) => {
  describe("splitParsedContentByPage", () => {
    it("returns one chunk, with every list present, for empty content", () => {
      const chunks = m.splitParsedContentByPage({});
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toEqual({
        vocabularyJSON: [],
        summariesJSON: [],
        objectivesJSON: [],
        conceptsJSON: [],
        questionsJSON: [],
        pendingMediaJSON: [],
        chunkIndex: 0,
        chunkCount: 1,
      });
    });

    it("keeps a short document in one chunk with its small lists", () => {
      const content = {
        vocabularyJSON: [word(1, 1)],
        questionsJSON: [question(1, 1), question(2, 1)],
        summariesJSON: [{ title: "T" }],
        objectivesJSON: [{ objective: "O" }],
        conceptsJSON: [{ concept: "C" }],
        pendingMediaJSON: [{ filename: "f" }],
      };
      const [only, ...rest] = m.splitParsedContentByPage(content);
      expect(rest).toHaveLength(0);
      expect(only).toMatchObject({ ...content, chunkIndex: 0, chunkCount: 1 });
    });

    it("splits at page boundaries and keeps summaries and the like in chunk 0", () => {
      const entries = [1, 2, 3, 4].flatMap((page) => [question(page, 1, 80), question(page, 2, 80)]);
      const budget = bytes(entries[0]) * 5;
      const chunks = m.splitParsedContentByPage(
        { questionsJSON: entries, summariesJSON: [{ title: "T" }] },
        budget,
      );

      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks.every((chunk) => chunk.chunkCount === chunks.length)).toBe(true);
      expect(chunks.map((chunk) => chunk.chunkIndex)).toEqual(chunks.map((_, i) => i));
      expect(chunks[0].summariesJSON).toEqual([{ title: "T" }]);
      expect(chunks.slice(1).every((chunk) => chunk.summariesJSON.length === 0)).toBe(true);
      // No page is split across chunks.
      const homes = chunks.flatMap((chunk, i) => pagesOf(chunk).map((page) => [page, i]));
      expect(new Set(homes.map(([page]) => page)).size).toBe(homes.length);
      expect(chunks.every((chunk) => chunkBytes(chunk) <= budget)).toBe(true);
    });

    it("orders entries by page, with entries that have no page first", () => {
      const chunks = m.splitParsedContentByPage({
        questionsJSON: [question(3, 1), question(undefined, 1), question(1, 1), question(3, 2)],
        vocabularyJSON: [word(2, 1), word(undefined, 1)],
      });
      expect(chunks[0].questionsJSON.map((q: any) => q.prompt)).toEqual([
        "qx-1",
        "q1-1",
        "q3-1",
        "q3-2",
      ]);
      expect(chunks[0].vocabularyJSON.map((w: any) => w.word)).toEqual(["wx-1", "w2-1"]);
    });

    it("splits a single page that is larger than a chunk, entry by entry and in order", () => {
      const entries = Array.from({ length: 12 }, (_, n) => question(7, n, 60));
      const budget = bytes(entries[0]) * 4;
      const chunks = m.splitParsedContentByPage({ questionsJSON: entries }, budget);

      expect(chunks.length).toBeGreaterThanOrEqual(3);
      expect(chunks.flatMap((chunk) => chunk.questionsJSON)).toEqual(entries);
      expect(chunks.every((chunk) => chunkBytes(chunk) <= budget)).toBe(true);
    });

    it("fails clearly when one entry, or the small lists, cannot fit in a chunk", () => {
      expect(() =>
        m.splitParsedContentByPage({ questionsJSON: [question(1, 1, 500)] }, 200),
      ).toThrow(/questionsJSON entry on page 1/);
      expect(() =>
        m.splitParsedContentByPage({ summariesJSON: [{ title: "x".repeat(500) }] }, 200),
      ).toThrow(/Summaries, objectives, concepts and pending media/);
    });

    it("splits a deck the size of the Thoth extraction into chunks under the budget", () => {
      const questions = Array.from({ length: 1582 }, (_, n) => ({
        prompt: `What is field ${n} for card ${n % 80}?`,
        answer: "An answer of ordinary length for a card field",
        questionType: "recall",
        page: 1 + Math.floor(n / 31),
        subject: `Card ${n % 80}`,
        field: `field ${n}`,
        sourceText: "Source text from the page that supports the answer, around one line long.",
        accept: ["alt answer"],
      }));
      const chunks = m.splitParsedContentByPage({ questionsJSON: questions });

      expect(chunks.length).toBeGreaterThanOrEqual(2);
      expect(chunks.every((chunk) => chunkBytes(chunk) <= m.PARSED_CONTENT_CHUNK_BUDGET_BYTES)).toBe(true);
      expect(chunks.flatMap((chunk) => chunk.questionsJSON)).toHaveLength(1582);
    });
  });

  describe("chunk ids", () => {
    it("derive from the document id so a re-save overwrites", () => {
      expect(m.parsedContentChunkId("doc-1", 0)).toBe("doc-1-chunk-0");
      expect(m.parsedContentChunkId("doc-1", 3)).toBe("doc-1-chunk-3");
    });
  });

  describe("mergeParsedContentChunks", () => {
    const record = (index: number | null, extra: Record<string, unknown> = {}) => ({
      id: `r${index}`,
      chunkIndex: index,
      ...extra,
    });

    it("concatenates lists in chunk order and describes where entries live", () => {
      const merged = m.mergeParsedContentChunks([
        record(1, { questionsJSON: [{ prompt: "c" }], vocabularyJSON: [] }),
        record(0, {
          importedAt: "2026-01-01",
          questionsJSON: [{ prompt: "a" }, { prompt: "b" }],
          vocabularyJSON: [{ word: "w" }],
          summariesJSON: [{ title: "T" }],
        }),
      ])!;

      expect(merged.id).toBe("r0");
      expect(merged.importedAt).toBe("2026-01-01");
      expect(merged.questionsJSON).toEqual([{ prompt: "a" }, { prompt: "b" }, { prompt: "c" }]);
      expect(merged.vocabularyJSON).toEqual([{ word: "w" }]);
      expect(merged.summariesJSON).toEqual([{ title: "T" }]);
      expect(merged.chunks).toEqual([
        { id: "r0", _version: undefined, chunkIndex: 0, vocabularyCount: 1, questionCount: 2 },
        { id: "r1", _version: undefined, chunkIndex: 1, vocabularyCount: 0, questionCount: 1 },
      ]);
    });

    it("treats a record with no chunk index as a single chunk and ignores deleted or missing ones", () => {
      const merged = m.mergeParsedContentChunks([
        null,
        undefined,
        record(1, { _deleted: true, questionsJSON: [{ prompt: "gone" }] }),
        record(null, { questionsJSON: [{ prompt: "only" }] }),
      ])!;
      expect(merged.questionsJSON).toEqual([{ prompt: "only" }]);
      expect(merged.chunks).toHaveLength(1);
      expect(m.mergeParsedContentChunks([])).toBeNull();
      expect(m.mergeParsedContentChunks([record(0, { _deleted: true })])).toBeNull();
    });

    it("reads a split back into the same content", () => {
      const questions = Array.from({ length: 40 }, (_, n) => question(1 + (n % 9), n, 50));
      const split = m.splitParsedContentByPage(
        { questionsJSON: questions, vocabularyJSON: [word(2, 1), word(5, 1)] },
        bytes(questions[0]) * 6,
      );
      const merged = m.mergeParsedContentChunks(
        split.map((chunk) => ({ id: `c${chunk.chunkIndex}`, ...chunk })),
      )!;

      expect([...merged.questionsJSON].sort((a: any, b: any) => a.prompt.localeCompare(b.prompt))).toEqual(
        [...questions].sort((a, b) => a.prompt.localeCompare(b.prompt)),
      );
      expect(merged.vocabularyJSON).toHaveLength(2);
      const pages = merged.questionsJSON.map((q: any) => q.page);
      expect(pages).toEqual([...pages].sort((a, b) => a - b));
    });
  });

  describe("locateChunkEntry", () => {
    const merged = {
      chunks: [
        { id: "a", chunkIndex: 0, vocabularyCount: 1, questionCount: 3 },
        { id: "b", chunkIndex: 1, vocabularyCount: 0, questionCount: 2 },
      ],
    };

    it("maps a merged index to its chunk and local index", () => {
      expect(m.locateChunkEntry(merged, "questionsJSON", 0)).toEqual({ chunk: merged.chunks[0], localIndex: 0 });
      expect(m.locateChunkEntry(merged, "questionsJSON", 2)).toEqual({ chunk: merged.chunks[0], localIndex: 2 });
      expect(m.locateChunkEntry(merged, "questionsJSON", 3)).toEqual({ chunk: merged.chunks[1], localIndex: 0 });
      expect(m.locateChunkEntry(merged, "vocabularyJSON", 0)).toEqual({ chunk: merged.chunks[0], localIndex: 0 });
    });

    it("returns null outside the list", () => {
      expect(m.locateChunkEntry(merged, "questionsJSON", 5)).toBeNull();
      expect(m.locateChunkEntry(merged, "questionsJSON", -1)).toBeNull();
      expect(m.locateChunkEntry(merged, "vocabularyJSON", 1)).toBeNull();
      expect(m.locateChunkEntry(merged, "questionsJSON", 1.5)).toBeNull();
    });
  });

  describe("collectPages", () => {
    it("reads every page and skips null items", async () => {
      const pages: Record<string, { data: Array<number | null>; nextToken?: string }> = {
        start: { data: [1, null, 2], nextToken: "t1" },
        t1: { data: [3] },
      };
      const fetchPage = vi.fn(async (token: string | undefined) => pages[token ?? "start"]);
      expect(await m.collectPages(fetchPage)).toEqual([1, 2, 3]);
      expect(fetchPage).toHaveBeenCalledTimes(2);
    });

    it("stops a pagination loop instead of spinning forever", async () => {
      await expect(
        m.collectPages(async () => ({ data: [1], nextToken: "same" })),
      ).rejects.toThrow("Repeated pagination token");
    });
  });

  describe("saveParsedContentChunks", () => {
    /** A store backed by a map; `calls` keeps the order of every write. */
    function fakeStore(initial: Array<Record<string, unknown> & { id: string }> = []) {
      const rows = new Map(initial.map((row) => [row.id, { ...row }]));
      const calls: string[] = [];
      const store: amplifyChunks.ParsedContentStore = {
        list: async () => [...rows.values()] as any,
        create: async (input) => {
          calls.push(`create ${input.id}`);
          rows.set(input.id as string, { _version: 1, ...input } as any);
        },
        update: async (input) => {
          calls.push(`update ${input.id}`);
          rows.set(input.id as string, { ...rows.get(input.id as string), ...input } as any);
        },
        remove: async ({ id }) => {
          calls.push(`remove ${id}`);
          rows.delete(id);
        },
      };
      return { store, rows, calls };
    }

    const twoPages = {
      questionsJSON: [question(1, 1, 90), question(2, 1, 90)],
    };
    const smallBudget = bytes(question(1, 1, 90)) + 5;

    it("creates one record per chunk with deterministic ids and the shared fields", async () => {
      const { store, rows } = fakeStore();
      const result = await m.saveParsedContentChunks(store, {
        documentID: "doc-1",
        fileID: "file-1",
        content: twoPages,
        fields: { modelUsed: "gpt-4o" },
        budgetBytes: smallBudget,
      });

      expect(result).toEqual({ chunkCount: 2, created: 2, updated: 0, unchanged: 0, removed: 0 });
      expect([...rows.keys()]).toEqual(["doc-1-chunk-0", "doc-1-chunk-1"]);
      expect(rows.get("doc-1-chunk-1")).toMatchObject({
        documentID: "doc-1",
        fileID: "file-1",
        modelUsed: "gpt-4o",
        chunkIndex: 1,
        chunkCount: 2,
      });
    });

    it("omits fileID when there is none", async () => {
      const { store, rows } = fakeStore();
      await m.saveParsedContentChunks(store, { documentID: "doc-1", content: {} });
      expect(rows.get("doc-1-chunk-0")).not.toHaveProperty("fileID");
    });

    it("overwrites the same chunks on a re-save, with their versions", async () => {
      const { store, rows, calls } = fakeStore([
        { id: "doc-1-chunk-0", _version: 3 },
        { id: "doc-1-chunk-1", _version: 5 },
      ]);
      const result = await m.saveParsedContentChunks(store, {
        documentID: "doc-1",
        content: twoPages,
        budgetBytes: smallBudget,
      });

      expect(result).toMatchObject({ created: 0, updated: 2, removed: 0 });
      expect(calls).toEqual(["update doc-1-chunk-0", "update doc-1-chunk-1"]);
      expect(rows.get("doc-1-chunk-1")).toMatchObject({ _version: 5, chunkCount: 2 });
    });

    it("writes new chunks before it removes leftovers, so the document is never empty", async () => {
      const { store, calls } = fakeStore([
        { id: "doc-1-chunk-0", _version: 1 },
        { id: "doc-1-chunk-1", _version: 1 },
        { id: "doc-1-chunk-2", _version: 1 },
        { id: "legacy-random-id", _version: 1 },
      ]);
      const result = await m.saveParsedContentChunks(store, {
        documentID: "doc-1",
        content: { questionsJSON: [question(1, 1)] },
      });

      expect(result).toMatchObject({ chunkCount: 1, updated: 1, removed: 3 });
      expect(calls[0]).toBe("update doc-1-chunk-0");
      expect(calls.slice(1).sort()).toEqual([
        "remove doc-1-chunk-1",
        "remove doc-1-chunk-2",
        "remove legacy-random-id",
      ]);
    });

    it("can skip chunks that already match, comparing without the nulls a server adds", async () => {
      const { store, calls } = fakeStore([
        {
          id: "doc-1-chunk-0",
          _version: 2,
          chunkIndex: 0,
          chunkCount: 2,
          questionsJSON: [{ ...question(1, 1, 90), hint: null }],
        },
        {
          id: "doc-1-chunk-1",
          _version: 2,
          chunkIndex: 1,
          chunkCount: 2,
          questionsJSON: [{ ...question(2, 1, 90), answer: "old" }],
        },
      ]);
      const result = await m.saveParsedContentChunks(store, {
        documentID: "doc-1",
        content: twoPages,
        budgetBytes: smallBudget,
        skipUnchanged: true,
      });

      expect(result).toMatchObject({ unchanged: 1, updated: 1, created: 0, removed: 0 });
      expect(calls).toEqual(["update doc-1-chunk-1"]);
    });

    it("rewrites every chunk when the chunk count changed, even if a chunk's lists match", async () => {
      const { store, calls } = fakeStore([
        { id: "doc-1-chunk-0", _version: 1, chunkIndex: 0, chunkCount: 5, questionsJSON: [] },
      ]);
      await m.saveParsedContentChunks(store, {
        documentID: "doc-1",
        content: {},
        skipUnchanged: true,
      });
      expect(calls).toEqual(["update doc-1-chunk-0"]);
    });
  });
});
