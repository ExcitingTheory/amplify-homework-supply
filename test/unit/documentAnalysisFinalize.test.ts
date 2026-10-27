import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Runs the document-analysis `finalize` step: the aggregate from S3 is saved
 * as page chunks through GraphQL. S3 and AppSync are simulated; chunking,
 * entry normalisation and the store are the real code.
 */

const sim = vi.hoisted(() => ({
  store: new Map<string, Buffer>(),
  documentMetadata: "",
  documentVersion: 1,
  rows: new Map<string, Record<string, any>>(),
  mutations: [] as Array<{ kind: "create" | "update" | "delete"; input: Record<string, any> }>,
  chunkQueries: [] as Array<{ query: string; variables: Record<string, any> }>,
}));

vi.mock("aws-amplify", () => ({ Amplify: { configure: vi.fn() } }));
vi.mock("@aws-sdk/credential-providers", () => ({
  fromNodeProviderChain: vi.fn(() => async () => ({})),
}));
vi.mock("@aws-sdk/client-sfn", () => ({
  SFNClient: class {},
  DescribeMapRunCommand: class {},
  ListMapRunsCommand: class {},
}));
vi.mock("@aws-sdk/client-ssm", () => ({ SSMClient: class {}, GetParameterCommand: class {} }));
vi.mock("@aws-sdk/client-lambda", () => ({ LambdaClient: class {}, InvokeCommand: class {} }));
vi.mock("@aws-sdk/client-s3", () => {
  class GetObjectCommand {
    constructor(public input: { Key: string }) {}
  }
  class PutObjectCommand {
    constructor(public input: { Key: string; Body: Buffer | string }) {}
  }
  return {
    GetObjectCommand,
    PutObjectCommand,
    S3Client: class {
      async send(command: GetObjectCommand | PutObjectCommand) {
        if (command instanceof PutObjectCommand) {
          sim.store.set(command.input.Key, Buffer.from(command.input.Body));
          return {};
        }
        const body = sim.store.get(command.input.Key);
        if (!body) throw Object.assign(new Error("NoSuchKey"), { name: "NoSuchKey" });
        return {
          Body: (async function* () {
            yield body;
          })(),
        };
      }
    },
  };
});

vi.mock("aws-amplify/data", () => ({
  generateClient: () => ({
    graphql: async ({ query, variables }: { query: string; variables: Record<string, any> }) => {
      if (query.includes("ListParsedContentChunks")) {
        sim.chunkQueries.push({ query, variables });
        return {
          data: { getDocument: { parsedContent: { items: [...sim.rows.values()], nextToken: null } } },
        };
      }
      if (query.includes("createParsedContent")) {
        sim.mutations.push({ kind: "create", input: variables.input });
        sim.rows.set(variables.input.id, { _version: 1, ...variables.input });
        return { data: { createParsedContent: { id: variables.input.id } } };
      }
      if (query.includes("updateParsedContent")) {
        sim.mutations.push({ kind: "update", input: variables.input });
        sim.rows.set(variables.input.id, { ...sim.rows.get(variables.input.id), ...variables.input });
        return { data: { updateParsedContent: { id: variables.input.id } } };
      }
      if (query.includes("deleteParsedContent")) {
        sim.mutations.push({ kind: "delete", input: variables.input });
        sim.rows.delete(variables.input.id);
        return { data: { deleteParsedContent: { id: variables.input.id } } };
      }
      if (query.includes("listPlatformSettings")) {
        return { data: { listPlatformSettings: { items: [] } } };
      }
      if (query.includes("listAgentJobs")) return { data: { listAgentJobs: { items: [] } } };
      if (query.includes("createAgentJob")) return { data: { createAgentJob: { id: "job-1", _version: 1 } } };
      if (query.includes("updateDocument")) {
        sim.documentMetadata = variables.input.metadata ?? sim.documentMetadata;
        sim.documentVersion += 1;
        return { data: { updateDocument: { id: variables.input.id } } };
      }
      return {
        data: {
          getDocument: { id: "doc-1", _version: sim.documentVersion, metadata: sim.documentMetadata },
        },
      };
    },
  }),
}));

import { handler } from "../../amplify/functions/documentAnalysisWorkflow/handler";
import { PARSED_CONTENT_CHUNK_BUDGET_BYTES } from "../../amplify/functions/shared/parsedContentChunks";

const BASE = "private/identity-1/documents/doc-1/analysis/run-1";
const AGGREGATE_KEY = `${BASE}/aggregate.json`;

function finalizeEvent() {
  return {
    workflowMode: "finalize",
    runId: "run-1",
    documentId: "doc-1",
    fileId: "file-1",
    identityId: "identity-1",
    s3Key: "private/identity-1/files/deck.pdf",
    profile: "exhaustive",
    executionArn: "arn:execution",
    aggregateKey: AGGREGATE_KEY,
  } as any;
}

const question = (n: number, page: number) => ({
  prompt: `What is field ${n} for card ${n % 80}?`,
  answer: "An answer of ordinary length for a card field",
  questionType: "recall",
  page,
  subject: `Card ${n % 80}`,
  field: `field ${n}`,
  sourceText: "Source text from the page that supports the answer, around one line long.",
  accept: ["alt answer"],
});

function putAggregate(questionCount: number, extra: Record<string, unknown> = {}) {
  const aggregate = {
    questionsJSON: Array.from({ length: questionCount }, (_, n) => question(n, 1 + Math.floor(n / 31))),
    vocabularyJSON: [{ word: "Path", definition: "A line", page: 2 }],
    summariesJSON: [{ title: "Overview", content: "About cards" }],
    objectivesJSON: [{ objective: "Explain the deck" }],
    conceptsJSON: [{ concept: "Correspondence" }],
    failedPages: [],
    totalPages: 52,
    done: 52,
    quality: { supported: questionCount },
    tokenUsageByModel: { "gpt-4o": { promptTokens: 1, completionTokens: 1, totalTokens: 2 } },
    ...extra,
  };
  sim.store.set(AGGREGATE_KEY, Buffer.from(JSON.stringify(aggregate)));
  return aggregate;
}

const questionsStored = () =>
  [...sim.rows.values()]
    .sort((a, b) => a.chunkIndex - b.chunkIndex)
    .flatMap((row) => row.questionsJSON as Array<{ page: number }>);

beforeEach(() => {
  sim.store.clear();
  sim.rows.clear();
  sim.mutations.length = 0;
  sim.chunkQueries.length = 0;
  sim.documentVersion = 1;
  sim.documentMetadata = JSON.stringify({ analysis: { runId: "run-1", state: "analyzing" } });
  process.env.STORAGE_BUCKET = "bucket";
  process.env.OPENAI_API_KEY = "test";
  vi.spyOn(console, "log").mockImplementation(() => {});
});

describe("finalize: saving a long document's analysis", () => {
  it("splits the Thoth-sized result into chunks that each fit, losing no question", async () => {
    putAggregate(1582);

    await handler(finalizeEvent(), {} as any, () => {});

    const chunks = [...sim.rows.values()].sort((a, b) => a.chunkIndex - b.chunkIndex);
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    expect(chunks.map((chunk) => chunk.id)).toEqual(chunks.map((_, i) => `doc-1-chunk-${i}`));
    for (const chunk of chunks) {
      expect(chunk).toMatchObject({
        documentID: "doc-1",
        fileID: "file-1",
        modelUsed: "gpt-4o",
        chunkCount: chunks.length,
      });
      const bytes = new TextEncoder().encode(
        JSON.stringify({ q: chunk.questionsJSON, v: chunk.vocabularyJSON }),
      ).length;
      expect(bytes).toBeLessThan(PARSED_CONTENT_CHUNK_BUDGET_BYTES);
    }
    expect(questionsStored()).toHaveLength(1582);

    // The small lists live in the primary chunk; every question keeps its page.
    expect(chunks[0]).toMatchObject({
      summariesJSON: [{ title: "Overview", content: "About cards" }],
      objectivesJSON: [{ objective: "Explain the deck" }],
      conceptsJSON: [{ concept: "Correspondence" }],
    });
    expect(chunks.slice(1).every((chunk) => chunk.summariesJSON.length === 0)).toBe(true);
    const pages = questionsStored().map((q) => q.page);
    expect(pages).toEqual([...pages].sort((a, b) => a - b));
  });

  it("lists the document's existing chunks through its indexed relationship", async () => {
    putAggregate(10);

    await handler(finalizeEvent(), {} as any, () => {});

    expect(sim.chunkQueries).toHaveLength(1);
    expect(sim.chunkQueries[0].query).toContain("getDocument(id: $id)");
    expect(sim.chunkQueries[0].variables.id).toBe("doc-1");
  });

  it("keeps a short document in one chunk with a deterministic id", async () => {
    putAggregate(20);

    await handler(finalizeEvent(), {} as any, () => {});

    expect([...sim.rows.keys()]).toEqual(["doc-1-chunk-0"]);
    expect(sim.rows.get("doc-1-chunk-0")).toMatchObject({ chunkIndex: 0, chunkCount: 1 });
    expect(sim.mutations.map((m) => m.kind)).toEqual(["create"]);
  });

  it("replaces the previous chunks when the analysis runs again", async () => {
    putAggregate(1582);
    await handler(finalizeEvent(), {} as any, () => {});
    const firstRunChunks = sim.rows.size;
    expect(firstRunChunks).toBeGreaterThanOrEqual(2);

    sim.mutations.length = 0;
    putAggregate(20);
    await handler(finalizeEvent(), {} as any, () => {});

    expect([...sim.rows.keys()]).toEqual(["doc-1-chunk-0"]);
    expect(questionsStored()).toHaveLength(20);
    const kinds = sim.mutations.map((m) => `${m.kind} ${m.input.id}`);
    // The primary chunk is overwritten with its stored version before leftovers go.
    expect(kinds[0]).toBe("update doc-1-chunk-0");
    expect(sim.mutations[0].input._version).toBe(1);
    expect(kinds.slice(1).every((entry) => entry.startsWith("delete doc-1-chunk-"))).toBe(true);
    expect(kinds).toHaveLength(firstRunChunks);
  });

  it("moves the document to the embedding state after saving", async () => {
    putAggregate(5);

    const result = await handler(finalizeEvent(), {} as any, () => {});

    expect(result).toMatchObject({ status: "embedding" });
    expect(JSON.parse(sim.documentMetadata).analysis).toMatchObject({ state: "embedding" });
  });
});
