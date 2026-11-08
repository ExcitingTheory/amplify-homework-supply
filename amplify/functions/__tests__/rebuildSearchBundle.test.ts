import { describe, it, expect, vi, beforeEach } from "vitest";

const store = new Map<string, string>();
const etags = new Map<string, string>();
const failPutKeys = new Set<string>();
const failGetKeys = new Set<string>();
// Lets a test act as a concurrent writer just before a given PutObject lands.
let beforePut: ((key: string) => void) | null = null;
let etagCounter = 0;

function s3Error(name: string, status: number) {
  return Object.assign(new Error(name), { name, $metadata: { httpStatusCode: status } });
}

const putObject = (key: string, body: string) => {
  store.set(key, body);
  etags.set(key, `"etag-${++etagCounter}"`);
};

vi.mock("@aws-sdk/client-s3", () => {
  class GetObjectCommand {
    constructor(public input: { Key: string }) {}
  }
  class PutObjectCommand {
    constructor(
      public input: {
        Key: string;
        Body: string;
        IfMatch?: string;
        IfNoneMatch?: string;
      },
    ) {}
  }
  class DeleteObjectCommand {
    constructor(public input: { Key: string }) {}
  }
  class ListObjectsV2Command {
    constructor(
      public input: { Prefix?: string; Delimiter?: string },
    ) {}
  }
  class S3Client {
    async send(command: any) {
      if (command instanceof GetObjectCommand) {
        if (failGetKeys.has(command.input.Key)) throw s3Error("InternalError", 500);
        const body = store.get(command.input.Key);
        if (body === undefined) throw s3Error("NoSuchKey", 404);
        return {
          Body: { transformToString: async () => body },
          ETag: etags.get(command.input.Key),
        };
      }
      if (command instanceof PutObjectCommand) {
        const { Key, Body, IfMatch, IfNoneMatch } = command.input;
        if (failPutKeys.has(Key)) throw new Error("AccessDenied");
        beforePut?.(Key);
        if (IfNoneMatch === "*" && store.has(Key)) {
          throw s3Error("PreconditionFailed", 412);
        }
        if (IfMatch && etags.get(Key) !== IfMatch) {
          throw s3Error("PreconditionFailed", 412);
        }
        putObject(Key, Body);
        return {};
      }
      if (command instanceof DeleteObjectCommand) {
        store.delete(command.input.Key);
        etags.delete(command.input.Key);
        return {};
      }
      if (command instanceof ListObjectsV2Command) {
        const { Prefix = "", Delimiter } = command.input;
        const keys = [...store.keys()].filter((k) => k.startsWith(Prefix));
        if (!Delimiter) return { Contents: keys.map((Key) => ({ Key })) };
        const folders = new Set<string>();
        for (const key of keys) {
          const rest = key.slice(Prefix.length);
          const slash = rest.indexOf("/");
          if (slash >= 0) folders.add(Prefix + rest.slice(0, slash + 1));
        }
        return { CommonPrefixes: [...folders].map((Prefix) => ({ Prefix })) };
      }
      throw new Error("Unexpected command");
    }
  }
  return {
    S3Client,
    GetObjectCommand,
    PutObjectCommand,
    DeleteObjectCommand,
    ListObjectsV2Command,
  };
});

vi.mock("@huggingface/transformers", () => ({
  env: {},
  pipeline: async () => async () => ({
    data: Float32Array.from({ length: 384 }, (_, i) => (i === 7 ? 1 : 0)),
  }),
}));

const DIMS = 384;
const vec = (axis: number) =>
  Array.from({ length: DIMS }, (_, i) => (i === axis ? 1 : 0.123456789 * 0));

function embeddingFile(
  pages: Array<{ page: number; embedding?: number[]; text?: string }>,
  extra: Record<string, unknown> = {},
) {
  return JSON.stringify({
    model: "Xenova/all-MiniLM-L6-v2",
    dimensions: DIMS,
    generatedAt: 1,
    wordCount: 1,
    pages,
    ...extra,
  });
}

async function loadHandler() {
  vi.stubEnv("AMPLIFY_STORAGE_BUCKET_NAME", "test-bucket");
  vi.resetModules();
  return import("../rebuildSearchBundle/handler");
}

const readJson = (key: string) => JSON.parse(store.get(key) as string);

describe("rebuildSearchBundle platform-reindex", () => {
  beforeEach(() => {
    store.clear();
    etags.clear();
    failPutKeys.clear();
    failGetKeys.clear();
    beforePut = null;
  });

  it("builds every instructor bundle and one admin-only platform bundle", async () => {
    store.set(
      "private/id-a/embeddings/word/w1.json",
      embeddingFile([{ page: 0, embedding: vec(0), text: "cat" }]),
    );
    store.set(
      "private/id-a/embeddings/file/f1.json",
      embeddingFile([
        { page: 1, embedding: vec(1), text: "page one" },
        { page: 2, embedding: vec(2), text: "page two" },
      ]),
    );
    store.set(
      "private/id-b/embeddings/question/q1.json",
      embeddingFile([{ page: 0, embedding: vec(3), text: "why" }]),
    );
    // Legacy non-identity folder and an identity without embeddings.
    store.set("private/unit/search-index/platform.json", "{}");
    store.set("private/id-c/notes.txt", "x");

    const { handler, PLATFORM_BUNDLE_KEY } = await loadHandler();
    const result: any = await handler({ source: "platform-reindex" }, {} as any, () => {});

    expect(result.statusCode).toBe(200);
    expect(result.body).toMatchObject({
      itemsProcessed: 4,
      instructors: 2,
      failedInstructors: [],
    });

    expect(PLATFORM_BUNDLE_KEY).toBe("admin/search-index/platform.json");
    expect(readJson("search-index/instructor/id-a.json").items).toHaveLength(3);
    expect(readJson("search-index/instructor/id-b.json").items).toHaveLength(1);
    expect(store.has("search-index/instructor/id-c.json")).toBe(false);

    const platform = readJson(PLATFORM_BUNDLE_KEY);
    expect(platform.items.map((i: any) => i.id).sort()).toEqual([
      "f1-p1",
      "f1-p2",
      "q1",
      "w1",
    ]);
    expect(platform.items[0].embedding).toHaveLength(DIMS);
    expect(platform.index.strategy).toBe("linear");
  });

  it("rounds platform vectors but leaves them unit length", async () => {
    const raw = Array.from({ length: DIMS }, (_, i) => Math.sin(i + 1));
    store.set(
      "private/id-a/embeddings/word/w1.json",
      embeddingFile([{ page: 0, embedding: raw, text: "cat" }]),
    );
    const { handler, PLATFORM_BUNDLE_KEY } = await loadHandler();
    await handler({ source: "platform-reindex" }, {} as any, () => {});

    const [item] = readJson(PLATFORM_BUNDLE_KEY).items;
    const norm = Math.sqrt(item.embedding.reduce((s: number, x: number) => s + x * x, 0));
    expect(norm).toBeCloseTo(1, 3);
    for (const x of item.embedding) {
      expect(Math.abs(x * 1e5 - Math.round(x * 1e5))).toBeLessThan(1e-6);
    }
  });

  it("skips a failing instructor and still publishes the platform bundle", async () => {
    store.set(
      "private/id-a/embeddings/word/w1.json",
      embeddingFile([{ page: 0, embedding: vec(0), text: "cat" }]),
    );
    store.set(
      "private/id-b/embeddings/word/w2.json",
      embeddingFile([{ page: 0, embedding: vec(1), text: "dog" }]),
    );
    failPutKeys.add("search-index/instructor/id-b.json");
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    const { handler, PLATFORM_BUNDLE_KEY } = await loadHandler();
    const result: any = await handler({ source: "platform-reindex" }, {} as any, () => {});

    expect(result.statusCode).toBe(207);
    expect(result.body.failedInstructors).toEqual(["id-b"]);
    expect(readJson(PLATFORM_BUNDLE_KEY).items.map((i: any) => i.id)).toEqual(["w1"]);
    error.mockRestore();
  });

  it("writes no platform bundle when there is nothing to index", async () => {
    const { handler, PLATFORM_BUNDLE_KEY } = await loadHandler();
    const result: any = await handler({ source: "platform-reindex" }, {} as any, () => {});
    expect(result.body.itemsProcessed).toBe(0);
    expect(store.has(PLATFORM_BUNDLE_KEY)).toBe(false);
  });

  it("generates vectors for text-only items (sections) on the fly", async () => {
    store.set(
      "private/id-a/embeddings/section/s1.json",
      embeddingFile([{ page: 0, text: "Biology — morning" }], {
        title: "Biology",
        needsEmbedding: true,
      }),
    );
    const { handler, PLATFORM_BUNDLE_KEY } = await loadHandler();
    await handler({ source: "platform-reindex" }, {} as any, () => {});

    const [item] = readJson(PLATFORM_BUNDLE_KEY).items;
    expect(item).toMatchObject({ id: "s1", type: "section", title: "Biology" });
    expect(item.embedding[7]).toBeCloseTo(1, 5);
    // The generated vector is persisted back so it is only computed once.
    expect(
      readJson("private/id-a/embeddings/section/s1.json").pages[0].embedding,
    ).toHaveLength(DIMS);
  });
});

describe("rebuildSearchBundle single-identity sources", () => {
  beforeEach(() => {
    store.clear();
    etags.clear();
    failPutKeys.clear();
    failGetKeys.clear();
    beforePut = null;
  });

  it("requires an identityId for admin-reindex", async () => {
    const { handler } = await loadHandler();
    await expect(
      handler({ source: "admin-reindex" }, {} as any, () => {}),
    ).rejects.toThrow(/identityId is required/);
  });

  it("admin-reindex rebuilds only that instructor's bundle", async () => {
    store.set(
      "private/id-a/embeddings/word/w1.json",
      embeddingFile([{ page: 0, embedding: vec(0), text: "cat" }]),
    );
    store.set(
      "private/id-b/embeddings/word/w2.json",
      embeddingFile([{ page: 0, embedding: vec(1), text: "dog" }]),
    );
    const { handler, PLATFORM_BUNDLE_KEY } = await loadHandler();
    const result: any = await handler(
      { source: "admin-reindex", identityId: "id-a" },
      {} as any,
      () => {},
    );
    expect(result.body.itemsProcessed).toBe(1);
    expect(store.has("search-index/instructor/id-a.json")).toBe(true);
    expect(store.has("search-index/instructor/id-b.json")).toBe(false);
    expect(store.has(PLATFORM_BUNDLE_KEY)).toBe(false);
  });
});

describe("rebuildSearchBundle incremental updates", () => {
  const eventFor = (...keys: string[]) => ({
    Records: keys.map((key) => ({
      body: JSON.stringify({
        "detail-type": "Object Created",
        detail: { object: { key } },
      }),
    })),
  });
  const key = (identity: string, type: string, id: string) =>
    `private/${identity}/embeddings/${type}/${id}.json`;
  const instructorKey = (identity: string) =>
    `search-index/instructor/${identity}.json`;
  const PLATFORM = "admin/search-index/platform.json";
  const ids = (bundleKey: string) =>
    readJson(bundleKey).items.map((i: any) => i.id).sort();

  async function seed() {
    store.set(key("id-a", "word", "w1"), embeddingFile([{ page: 0, embedding: vec(0), text: "cat" }]));
    store.set(key("id-a", "word", "w2"), embeddingFile([{ page: 0, embedding: vec(1), text: "dog" }]));
    store.set(
      key("id-a", "file", "f1"),
      embeddingFile([
        { page: 1, embedding: vec(2), text: "one" },
        { page: 2, embedding: vec(3), text: "two" },
      ]),
    );
    store.set(key("id-b", "word", "w3"), embeddingFile([{ page: 0, embedding: vec(4), text: "bird" }]));
    const mod = await loadHandler();
    await mod.handler({ source: "platform-reindex" }, {} as any, () => {});
    return mod;
  }

  beforeEach(() => {
    store.clear();
    etags.clear();
    failPutKeys.clear();
    failGetKeys.clear();
    beforePut = null;
  });

  it("replaces only the changed item in the instructor and platform bundles", async () => {
    const { handler } = await seed();
    const bundleB = store.get(instructorKey("id-b"));
    const versionBefore = readJson(PLATFORM).version;

    store.set(key("id-a", "word", "w1"), embeddingFile([{ page: 0, embedding: vec(5), text: "kitten" }]));
    await handler(eventFor(key("id-a", "word", "w1")) as any, {} as any, () => {});

    const w1 = (b: string) => readJson(b).items.find((i: any) => i.id === "w1");
    expect(w1(instructorKey("id-a")).embedding[5]).toBeCloseTo(1, 5);
    expect(w1(PLATFORM).embedding[5]).toBeCloseTo(1, 5);
    expect(w1(PLATFORM).meta.preview).toBe("kitten");
    expect(ids(instructorKey("id-a"))).toEqual(["f1-p1", "f1-p2", "w1", "w2"]);
    expect(ids(PLATFORM)).toEqual(["f1-p1", "f1-p2", "w1", "w2", "w3"]);
    // Other instructors' bundles are not touched.
    expect(store.get(instructorKey("id-b"))).toBe(bundleB);
    expect(readJson(PLATFORM).version).toBeGreaterThan(versionBefore);
  });

  it("adds new items", async () => {
    const { handler } = await seed();
    store.set(key("id-b", "question", "q9"), embeddingFile([{ page: 0, embedding: vec(6), text: "why" }]));
    await handler(eventFor(key("id-b", "question", "q9")) as any, {} as any, () => {});

    expect(ids(instructorKey("id-b"))).toEqual(["q9", "w3"]);
    expect(ids(PLATFORM)).toContain("q9");
  });

  it("removes items whose embedding file was deleted", async () => {
    const { handler } = await seed();
    store.delete(key("id-a", "word", "w2"));
    await handler(eventFor(key("id-a", "word", "w2")) as any, {} as any, () => {});

    expect(ids(instructorKey("id-a"))).not.toContain("w2");
    expect(ids(PLATFORM)).not.toContain("w2");
    expect(ids(PLATFORM)).toContain("w1");
  });

  it("replaces every page of a multi-page file", async () => {
    const { handler } = await seed();
    store.set(key("id-a", "file", "f1"), embeddingFile([{ page: 1, embedding: vec(2), text: "only page" }]));
    await handler(eventFor(key("id-a", "file", "f1")) as any, {} as any, () => {});

    expect(ids(instructorKey("id-a"))).toEqual(["f1-p1", "w1", "w2"]);
    expect(ids(PLATFORM)).toEqual(["f1-p1", "w1", "w2", "w3"]);
  });

  it("does not create a partial instructor bundle that was never built", async () => {
    const { handler } = await seed();
    store.set(key("id-d", "word", "w7"), embeddingFile([{ page: 0, embedding: vec(8), text: "new owner" }]));
    await handler(eventFor(key("id-d", "word", "w7")) as any, {} as any, () => {});

    expect(store.has(instructorKey("id-d"))).toBe(false);
    expect(ids(PLATFORM)).toContain("w7");
  });

  it("leaves another owner's item with the same id alone", async () => {
    store.set(key("id-a", "word", "shared"), embeddingFile([{ page: 0, embedding: vec(0), text: "A copy" }]));
    store.set(key("id-b", "word", "shared"), embeddingFile([{ page: 0, embedding: vec(1), text: "B copy" }]));
    const { handler } = await loadHandler();
    await handler({ source: "platform-reindex" }, {} as any, () => {});

    store.set(key("id-a", "word", "shared"), embeddingFile([{ page: 0, embedding: vec(2), text: "A edited" }]));
    await handler(eventFor(key("id-a", "word", "shared")) as any, {} as any, () => {});

    const previews = readJson(PLATFORM).items.map((i: any) => i.meta.preview).sort();
    expect(previews).toEqual(["A edited", "B copy"]);
  });

  it("retries on a lost write race and keeps the other writer's change", async () => {
    const { handler } = await seed();
    let raced = false;
    beforePut = (putKey) => {
      if (putKey !== PLATFORM || raced) return;
      raced = true;
      const current = readJson(PLATFORM);
      current.items.push({ ...current.items[0], id: "from-other-writer" });
      putObject(PLATFORM, JSON.stringify(current));
    };

    store.set(key("id-a", "word", "w1"), embeddingFile([{ page: 0, embedding: vec(5), text: "kitten" }]));
    await handler(eventFor(key("id-a", "word", "w1")) as any, {} as any, () => {});

    expect(raced).toBe(true);
    expect(ids(PLATFORM)).toContain("from-other-writer");
    expect(
      readJson(PLATFORM).items.find((i: any) => i.id === "w1").meta.preview,
    ).toBe("kitten");
  });

  it("never treats a failed read as a deletion", async () => {
    const { handler } = await seed();
    const before = store.get(PLATFORM);
    failGetKeys.add(key("id-a", "word", "w1"));

    await expect(
      handler(eventFor(key("id-a", "word", "w1")) as any, {} as any, () => {}),
    ).rejects.toThrow();
    expect(store.get(PLATFORM)).toBe(before);
  });

  it("generates the vector for text-only items", async () => {
    const { handler } = await seed();
    store.set(
      key("id-a", "section", "s1"),
      embeddingFile([{ page: 0, text: "Biology" }], { title: "Biology", needsEmbedding: true }),
    );
    await handler(eventFor(key("id-a", "section", "s1")) as any, {} as any, () => {});

    const item = readJson(PLATFORM).items.find((i: any) => i.id === "s1");
    expect(item).toMatchObject({ type: "section", title: "Biology" });
    expect(item.embedding[7]).toBeCloseTo(1, 5);
  });

  it("ignores keys that are not embedding files", async () => {
    const { handler, parseEmbeddingChanges } = await seed().then(async (m) => m);
    const before = store.get(PLATFORM);
    const event = eventFor(
      "search-index/instructor/id-a.json",
      "private/id-a/notes/word/x.json",
      key("id-a", "widget", "x"),
    );
    expect(parseEmbeddingChanges(event as any)).toEqual([]);
    await handler(event as any, {} as any, () => {});
    expect(store.get(PLATFORM)).toBe(before);
  });

  it("de-duplicates repeated events for the same item", async () => {
    const { parseEmbeddingChanges } = await loadHandler();
    const k = key("id-a", "word", "w1");
    expect(parseEmbeddingChanges(eventFor(k, k, k) as any)).toEqual([
      { identityId: "id-a", type: "word", itemId: "w1" },
    ]);
  });
});

describe("rebuildSearchBundle rebuild lock", () => {
  const LOCK = "admin/search-index/.rebuild-lock";
  const sqs = { Records: [] as unknown[] };

  beforeEach(() => {
    store.clear();
    etags.clear();
    failPutKeys.clear();
    failGetKeys.clear();
    beforePut = null;
  });

  it("holds updates back while a full rebuild is running", async () => {
    putObject(LOCK, JSON.stringify({ startedAt: Date.now() }));
    const { handler } = await loadHandler();
    await expect(handler(sqs as any, {} as any, () => {})).rejects.toThrow(
      /Full rebuild in progress/,
    );
  });

  it("ignores a stale lock left by a crashed run", async () => {
    putObject(LOCK, JSON.stringify({ startedAt: Date.now() - 60 * 60 * 1000 }));
    const { handler } = await loadHandler();
    await expect(handler(sqs as any, {} as any, () => {})).resolves.toBeDefined();
  });

  it("releases the lock when a full rebuild finishes or fails", async () => {
    store.set("private/id-a/embeddings/word/w1.json", embeddingFile([{ page: 0, embedding: vec(0), text: "cat" }]));
    const { handler } = await loadHandler();
    await handler({ source: "platform-reindex" }, {} as any, () => {});
    expect(store.has(LOCK)).toBe(false);

    failPutKeys.add("search-index/instructor/id-a.json");
    await expect(
      handler({ source: "admin-reindex", identityId: "id-a" }, {} as any, () => {}),
    ).rejects.toThrow();
    expect(store.has(LOCK)).toBe(false);
  });

  it("refuses to start a second full rebuild", async () => {
    putObject(LOCK, JSON.stringify({ startedAt: Date.now() }));
    const { handler } = await loadHandler();
    await expect(
      handler({ source: "platform-reindex" }, {} as any, () => {}),
    ).rejects.toThrow(/already running/);
  });
});

describe("rebuildSearchBundle unit-publish", () => {
  // Keyed by id alone, outside every client-readable storage prefix.
  const unitKey = (_identity: string, unit: string) => `search-index/unit/${unit}.json`;
  const sectionKey = (_identity: string, section: string) =>
    `search-index/section/${section}.json`;
  const embedKey = (type: string, id: string) =>
    `private/id-a/embeddings/${type}/${id}.json`;
  const ids = (key: string) => readJson(key).items.map((i: any) => i.id).sort();

  beforeEach(() => {
    store.clear();
    etags.clear();
    failPutKeys.clear();
    failGetKeys.clear();
    beforePut = null;
  });

  function seedUnit() {
    store.set("protected/id-a/units/u1/plain.txt", "Plants turn light into sugar");
    for (const [type, id, axis] of [
      ["word", "w1", 0],
      ["word", "w2", 1],
      ["word", "w9", 2],
      ["question", "q1", 3],
    ] as const) {
      store.set(embedKey(type, id), embeddingFile([{ page: 0, embedding: vec(axis), text: id }]));
    }
    store.set(
      embedKey("file", "f1"),
      embeddingFile([
        { page: 1, embedding: vec(4), text: "p1" },
        { page: 2, embedding: vec(5), text: "p2" },
      ]),
    );
  }

  const publish = (extra: Record<string, unknown> = {}) =>
    loadHandler().then(({ handler }) =>
      handler(
        {
          source: "unit-publish",
          identityId: "id-a",
          unitId: "u1",
          unitName: "Plants",
          members: { word: ["w1", "w2"], question: ["q1"], file: ["f1"] },
          ...extra,
        } as any,
        {} as any,
        () => {},
      ),
    );

  it("holds only the unit and the records it uses", async () => {
    seedUnit();
    const result: any = await publish();

    expect(result.body.itemsProcessed).toBe(6);
    expect(ids(unitKey("id-a", "u1"))).toEqual(["f1-p1", "f1-p2", "q1", "u1", "w1", "w2"]);
    expect(ids(unitKey("id-a", "u1"))).not.toContain("w9");

    const bundle = readJson(unitKey("id-a", "u1"));
    const unit = bundle.items.find((i: any) => i.id === "u1");
    expect(unit).toMatchObject({ type: "unit", title: "Plants" });
    expect(unit.embedding[7]).toBeCloseTo(1, 5);
    expect(bundle.items.every((i: any) => i.meta.unitId === "u1")).toBe(true);
  });

  it("regenerates the unit's own embedding on every publish", async () => {
    seedUnit();
    store.set(
      embedKey("unit", "u1"),
      embeddingFile([{ page: 0, embedding: vec(11), text: "stale" }]),
    );
    await publish();

    const stored = readJson(embedKey("unit", "u1"));
    expect(stored.title).toBe("Plants");
    expect(stored.pages[0].embedding[7]).toBeCloseTo(1, 5);
  });

  it("falls back to the published content when plain.txt is missing", async () => {
    seedUnit();
    store.delete("protected/id-a/units/u1/plain.txt");
    store.set(
      "protected/units/u1/published.json",
      JSON.stringify({
        root: {
          children: [
            { type: "paragraph", children: [{ text: "Chlorophyll" }, { text: "absorbs light" }] },
          ],
        },
      }),
    );
    await publish();

    const unit = readJson(unitKey("id-a", "u1")).items.find((i: any) => i.id === "u1");
    expect(unit.meta.preview).toBe("Chlorophyll absorbs light");
  });

  it("skips members without embeddings and builds from the unit alone when there are none", async () => {
    seedUnit();
    await publish({ members: { word: ["w1", "missing"] } });
    expect(ids(unitKey("id-a", "u1"))).toEqual(["u1", "w1"]);

    await publish({ members: undefined });
    expect(ids(unitKey("id-a", "u1"))).toEqual(["u1"]);
  });

  it("merges unit bundles into each section bundle without duplicates", async () => {
    seedUnit();
    store.set(
      unitKey("id-a", "u2"),
      JSON.stringify({
        items: [
          { id: "u2", type: "unit", title: "Other", embedding: vec(20), meta: {} },
          { id: "w1", type: "word", title: "w1", embedding: vec(0), meta: {} },
        ],
      }),
    );
    await publish({
      sections: [
        { sectionId: "s1", unitIds: ["u1", "u2"] },
        { sectionId: "s2", unitIds: ["u1"] },
      ],
    });

    expect(ids(sectionKey("id-a", "s1"))).toEqual([
      "f1-p1", "f1-p2", "q1", "u1", "u2", "w1", "w2",
    ]);
    expect(ids(sectionKey("id-a", "s2"))).toEqual(["f1-p1", "f1-p2", "q1", "u1", "w1", "w2"]);
  });

  it("does not touch instructor or platform bundles", async () => {
    seedUnit();
    await publish();
    expect(store.has("search-index/instructor/id-a.json")).toBe(false);
    expect(store.has("admin/search-index/platform.json")).toBe(false);
  });

  it("never writes under a prefix every signed-in user can read", async () => {
    seedUnit();
    await publish({ sections: [{ sectionId: "s1", unitIds: ["u1"] }] });
    const written = [...store.keys()].filter((k) => k.includes("search-index"));
    expect(written.sort()).toEqual([
      "search-index/section/s1.json",
      "search-index/unit/u1.json",
    ]);
  });

  it("removes legacy bundles from protected/ and private/ on the next platform rebuild", async () => {
    store.set("private/id-a/search-index/instructor.json", "{}");
    store.set("protected/id-a/search-index/unit/old.json", "{}");
    store.set("protected/id-a/search-index/section/old.json", "{}");
    store.set("protected/id-a/units/u1/plain.txt", "keep me");
    store.set(embedKey("word", "w1"), embeddingFile([{ page: 0, embedding: vec(0), text: "w1" }]));
    const { handler } = await loadHandler();
    await handler({ source: "platform-reindex" }, {} as any, () => {});

    expect(store.has("private/id-a/search-index/instructor.json")).toBe(false);
    expect(store.has("protected/id-a/search-index/unit/old.json")).toBe(false);
    expect(store.has("protected/id-a/search-index/section/old.json")).toBe(false);
    expect(store.has("protected/id-a/units/u1/plain.txt")).toBe(true);
  });

  it("requires a unitId", async () => {
    const { handler } = await loadHandler();
    await expect(
      handler({ source: "unit-publish", identityId: "id-a" } as any, {} as any, () => {}),
    ).rejects.toThrow(/unitId is required/);
  });
});
