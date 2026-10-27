import { describe, it, expect, vi } from "vitest";
import {
  ParsedContentChunkSync,
  type ParsedContentSnapshot,
} from "../../src/utils/parsedContentChunkSync";
import { parsedContentChunkId } from "../../src/utils/parsedContentChunks";

const DOC = "doc-1";

function chunk(index: number, count: number, version: number, questions: string[] = [`q${index}`]) {
  return {
    id: parsedContentChunkId(DOC, index),
    documentID: DOC,
    chunkIndex: index,
    chunkCount: count,
    _version: version,
    vocabularyJSON: [],
    questionsJSON: questions.map((prompt) => ({ prompt, answer: "a" })),
  };
}

type Handler = (item: any) => void;

/** A data client over an in-memory chunk table, with controllable events. */
function createClient(initial: any[], document: any = { id: DOC, filename: "a.pdf", _version: 1 }) {
  const table = new Map<string, any>(initial.map((c) => [c.id, c]));
  const handlers: Record<"onCreate" | "onUpdate" | "onDelete", Handler[]> = {
    onCreate: [],
    onUpdate: [],
    onDelete: [],
  };
  const unsubscribe = vi.fn();
  const subscribeTo = (event: keyof typeof handlers) =>
    vi.fn(() => ({
      subscribe: ({ next }: { next: Handler }) => {
        handlers[event].push(next);
        return { unsubscribe };
      },
    }));

  const get = vi.fn(async ({ id }: { id: string }) => ({ data: table.get(id) ?? null }));
  const client = {
    models: {
      Document: { get: vi.fn(async () => ({ data: document })) },
      ParsedContent: {
        get,
        list: vi.fn(async () => ({ data: [...table.values()], nextToken: null })),
        onCreate: subscribeTo("onCreate"),
        onUpdate: subscribeTo("onUpdate"),
        onDelete: subscribeTo("onDelete"),
      },
    },
  };
  return {
    client,
    table,
    get,
    unsubscribe,
    emit: (event: keyof typeof handlers, item: any) => handlers[event].forEach((h) => h(item)),
  };
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

function start(client: any) {
  const snapshots: ParsedContentSnapshot[] = [];
  const sync = new ParsedContentChunkSync(client, DOC, (snapshot) => snapshots.push(snapshot));
  sync.start();
  return { sync, snapshots };
}

const prompts = (snapshot: ParsedContentSnapshot) =>
  (snapshot.parsedContent?.questionsJSON as any[]).map((q) => q.prompt);

describe("ParsedContentChunkSync", () => {
  it("starts loading, then publishes the first chunk before the rest arrive", async () => {
    const { client } = createClient([chunk(0, 2, 1), chunk(1, 2, 1)]);
    const { sync, snapshots } = start(client);
    expect(sync.getSnapshot().state).toBe("loading");

    await settle();

    const ready = snapshots.filter((s) => s.state === "ready");
    expect(prompts(ready[0])).toEqual(["q0"]);
    expect(ready[0].loadingMore).toBe(true);
    const last = snapshots[snapshots.length - 1];
    expect(prompts(last)).toEqual(["q0", "q1"]);
    expect(last.loadingMore).toBe(false);
    expect(last.document?.filename).toBe("a.pdf");
  });

  it("reports empty when the document has no ParsedContent", async () => {
    const { client } = createClient([]);
    const { sync } = start(client);
    await settle();
    expect(sync.getSnapshot().state).toBe("empty");
  });

  it("reports an error when loading throws and nothing was loaded", async () => {
    const { client } = createClient([]);
    client.models.ParsedContent.get.mockRejectedValue(new Error("boom"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { sync } = start(client);
    await settle();
    expect(sync.getSnapshot().state).toBe("error");
    spy.mockRestore();
  });

  it("falls back to the relation listing for records without a chunk id", async () => {
    const legacy = { ...chunk(0, 1, 1, ["old"]), id: "random-id" };
    const { client } = createClient([legacy]);
    const { sync } = start(client);
    await settle();
    expect(prompts(sync.getSnapshot())).toEqual(["old"]);
  });

  it("ignores events with the same or an older version", async () => {
    const { client, emit } = createClient([chunk(0, 1, 3)]);
    const { sync, snapshots } = start(client);
    await settle();
    const before = snapshots.length;
    const merged = sync.getSnapshot().parsedContent;

    emit("onUpdate", chunk(0, 1, 3, ["same"]));
    emit("onUpdate", chunk(0, 1, 2, ["older"]));
    await settle();

    expect(snapshots.length).toBe(before);
    expect(sync.getSnapshot().parsedContent).toBe(merged);
    expect(prompts(sync.getSnapshot())).toEqual(["q0"]);
  });

  it("replaces a chunk when a newer version arrives, without going back to loading", async () => {
    const { client, emit } = createClient([chunk(0, 1, 1)]);
    const { sync, snapshots } = start(client);
    await settle();
    const before = snapshots.length;

    emit("onUpdate", chunk(0, 1, 2, ["edited"]));
    await settle();

    expect(prompts(sync.getSnapshot())).toEqual(["edited"]);
    expect(snapshots.length).toBeGreaterThan(before);
    expect(snapshots.slice(before).every((s) => s.state === "ready")).toBe(true);
  });

  it("adds a created chunk and removes a deleted one", async () => {
    const { client, emit } = createClient([chunk(0, 2, 1)]);
    const { sync } = start(client);
    await settle();

    emit("onCreate", chunk(1, 2, 1));
    await settle();
    expect(prompts(sync.getSnapshot())).toEqual(["q0", "q1"]);

    emit("onDelete", chunk(1, 2, 1));
    await settle();
    expect(prompts(sync.getSnapshot())).toEqual(["q0"]);
  });

  it("treats an update flagged _deleted as a removal", async () => {
    const { client, emit } = createClient([chunk(0, 2, 1), chunk(1, 2, 1)]);
    const { sync } = start(client);
    await settle();

    emit("onUpdate", { ...chunk(1, 2, 2), _deleted: true });
    await settle();
    expect(prompts(sync.getSnapshot())).toEqual(["q0"]);
  });

  it("ignores events for other documents", async () => {
    const { client, emit } = createClient([chunk(0, 1, 1)]);
    const { sync, snapshots } = start(client);
    await settle();
    const before = snapshots.length;

    emit("onUpdate", { ...chunk(0, 1, 9, ["other"]), documentID: "doc-2" });
    await settle();

    expect(snapshots.length).toBe(before);
  });

  it("subscribes with a document filter", async () => {
    const { client } = createClient([chunk(0, 1, 1)]);
    start(client);
    await settle();
    expect(client.models.ParsedContent.onUpdate).toHaveBeenCalledWith({
      filter: { documentID: { eq: DOC } },
    });
  });

  it("refresh applies only changed chunks and drops ones no longer stored", async () => {
    const { client, table } = createClient([chunk(0, 2, 1), chunk(1, 2, 1)]);
    const { sync, snapshots } = start(client);
    await settle();

    // Re-saved shorter: one chunk, new version
    table.set(chunk(0, 1, 2).id, chunk(0, 1, 2, ["fresh"]));
    table.delete(chunk(1, 2, 1).id);
    await sync.refresh();

    expect(prompts(sync.getSnapshot())).toEqual(["fresh"]);

    const before = snapshots.length;
    await sync.refresh();
    expect(snapshots.length).toBe(before);
  });

  it("stop unsubscribes and stops publishing", async () => {
    const { client, emit, unsubscribe } = createClient([chunk(0, 1, 1)]);
    const { sync, snapshots } = start(client);
    await settle();
    const before = snapshots.length;

    sync.stop();
    expect(unsubscribe).toHaveBeenCalledTimes(3);

    emit("onUpdate", chunk(0, 1, 5, ["late"]));
    await settle();
    expect(snapshots.length).toBe(before);
  });
});
