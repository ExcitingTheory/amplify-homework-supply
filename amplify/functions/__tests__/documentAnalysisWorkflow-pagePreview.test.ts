import type { Context } from "aws-lambda";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  s3: vi.fn(),
  sfn: vi.fn(),
  graphql: vi.fn(),
  saveChunks: vi.fn(),
}));
vi.mock("aws-amplify", () => ({ Amplify: { configure: vi.fn() } }));
vi.mock("aws-amplify/data", () => ({ generateClient: () => ({ graphql: mocks.graphql }) }));
vi.mock("@aws-sdk/client-sfn", () => ({
  SFNClient: class { send = mocks.sfn; },
  DescribeMapRunCommand: class { constructor(public input: unknown) {} },
  ListMapRunsCommand: class { constructor(public input: unknown) {} },
}));
vi.mock("@aws-sdk/client-ssm", () => ({ SSMClient: class {}, GetParameterCommand: vi.fn() }));
vi.mock("@aws-sdk/client-lambda", () => ({ LambdaClient: class {}, InvokeCommand: vi.fn() }));
vi.mock("@aws-sdk/client-s3", async (importOriginal) => ({
  ...await importOriginal<typeof import("@aws-sdk/client-s3")>(),
  S3Client: class { send = mocks.s3; },
}));
vi.mock("openai", () => ({
  default: class {
    chat = { completions: { create: vi.fn() } };
    moderations = { create: vi.fn() };
  },
}));
vi.mock("../shared/parsedContentChunks", () => ({ saveParsedContentChunks: mocks.saveChunks }));
vi.mock("../documentAnalysisWorkflow/providerRateLimiter", async (importOriginal) => ({
  ...await importOriginal<typeof import("../documentAnalysisWorkflow/providerRateLimiter")>(),
  DynamoProviderRateLimitStore: class {},
  withProviderRateLimit: ({ execute }: { execute: () => Promise<unknown> }) => execute(),
}));

import { handler } from "../documentAnalysisWorkflow/handler";

const base = "run";
const event = {
  workflowMode: "progress", documentId: "doc-1", fileId: "file-1", runId: "run-1",
  identityId: "owner-1", profile: "standard", executionArn: "arn:execution",
  manifestKey: `${base}/manifest.json`, directContentKey: `${base}/direct.json`,
  baseKey: base, totalPages: 3,
};
const manifest = [1, 2, 3].map((page) => ({
  page, inputKey: `${base}/page-${page}-input.json`, resultKey: `${base}/page-${page}.json`,
}));
const pageResult = (page: number, completed: boolean) => ({
  page, completed,
  questionsJSON: [{
    prompt: `Question ${page}?`, answer: `Answer ${page}`, subject: `Subject ${page}`,
    field: "definition", sourceText: `Source ${page}`, page, accept: [],
  }],
  vocabularyJSON: [{ word: `Word${page}`, definition: `Definition ${page}`, context: `Context ${page}`, page }],
});

const objects = new Map<string, unknown>();
let document: Record<string, unknown>;
let metadata: () => Record<string, any>;

async function run() {
  return handler(event, {} as Context, vi.fn()) as Promise<{ mapDone: boolean }>;
}
const savedContent = (call = 0) => mocks.saveChunks.mock.calls[call][1].content;

describe("in-flight page preview", () => {
  afterEach(() => vi.unstubAllEnvs());
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("STORAGE_BUCKET", "test-bucket");
    vi.stubEnv("DOCUMENT_ANALYSIS_LIMITER_TABLE", "test-limiter");
    objects.clear();
    objects.set(event.manifestKey, manifest);
    objects.set(event.directContentKey, {});
    document = {
      id: event.documentId, _version: 1,
      metadata: JSON.stringify({ analysis: { runId: event.runId, state: "analyzing" } }),
    };
    metadata = () => JSON.parse(document.metadata as string).analysis;
    mocks.sfn.mockImplementation(async (command: { constructor: { name: string } }) =>
      command.constructor.name === "ListMapRunsCommand"
        ? { mapRuns: [{ mapRunArn: "arn:map" }] }
        : { itemCounts: { total: 3, succeeded: 2, failed: 0, running: 1, pending: 0 } });
    mocks.s3.mockImplementation(async (command: { input: { Key: string; Body?: string } }) => {
      const { Key, Body } = command.input;
      if (Body !== undefined) {
        objects.set(Key, JSON.parse(Body));
        return {};
      }
      if (!objects.has(Key)) throw Object.assign(new Error(`Missing ${Key}`), { name: "NoSuchKey" });
      return { Body: (async function* () { yield Buffer.from(JSON.stringify(objects.get(Key))); })() };
    });
    mocks.graphql.mockImplementation(async ({ query, variables }: {
      query: string; variables: { input?: Record<string, unknown> };
    }) => {
      if (query.includes("query GetDocument")) return { data: { getDocument: document } };
      if (query.includes("mutation UpdateDocument")) {
        document = { ...document, ...variables.input };
        return { data: { updateDocument: document } };
      }
      throw new Error(`Unexpected GraphQL operation: ${query}`);
    });
    mocks.saveChunks.mockResolvedValue({ chunkCount: 1, created: 1, updated: 0, unchanged: 0, removed: 0 });
  });

  it("saves finished pages and records them in the analysis metadata", async () => {
    objects.set(manifest[0].resultKey, pageResult(1, true));
    objects.set(manifest[1].resultKey, pageResult(2, true));
    objects.set(manifest[2].resultKey, pageResult(3, false));

    const result = await run();

    expect(result.mapDone).toBe(false);
    expect(mocks.saveChunks).toHaveBeenCalledTimes(1);
    expect(savedContent().questionsJSON.map((q: any) => q.pages)).toEqual([[1], [2]]);
    expect(savedContent().vocabularyJSON.map((v: any) => v.word)).toEqual(["Word1", "Word2"]);
    expect(mocks.saveChunks.mock.calls[0][1].skipUnchanged).toBe(true);
    expect(metadata()).toMatchObject({
      state: "analyzing", done: 2, totalPages: 3,
      completedPages: [1, 2], partialCounts: { questions: 2, vocabulary: 2 },
    });
  });

  it("reads only pages it has not seen and skips saving when nothing finished", async () => {
    objects.set(manifest[0].resultKey, pageResult(1, true));
    objects.set(manifest[1].resultKey, pageResult(2, false));
    await run();
    expect(mocks.saveChunks).toHaveBeenCalledTimes(1);

    const reads = () => mocks.s3.mock.calls.filter(([c]) => c.input.Key === manifest[0].resultKey).length;
    const readsAfterFirstPoll = reads();
    await run();

    expect(reads()).toBe(readsAfterFirstPoll);
    expect(mocks.saveChunks).toHaveBeenCalledTimes(1);
    expect(metadata()).toMatchObject({
      completedPages: [1], partialCounts: { questions: 1, vocabulary: 1 },
    });

    objects.set(manifest[1].resultKey, pageResult(2, true));
    await run();
    expect(mocks.saveChunks).toHaveBeenCalledTimes(2);
    expect(savedContent(1).questionsJSON).toHaveLength(2);
    expect(metadata().completedPages).toEqual([1, 2]);
  });

  it("keeps reporting progress when the preview cannot be saved", async () => {
    objects.set(manifest[0].resultKey, pageResult(1, true));
    mocks.saveChunks.mockRejectedValue(new Error("AppSync unavailable"));
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await run();

    expect(error).toHaveBeenCalledWith(
      expect.stringContaining("Could not publish page preview"),
      expect.any(Error),
    );
    expect(metadata()).toMatchObject({ state: "analyzing", done: 2 });
    expect(metadata()).not.toHaveProperty("completedPages");
    error.mockRestore();
  });
});
