// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "aws-lambda";
import { handler } from "../../amplify/functions/nativeVocabulary/handler";

const mocks = vi.hoisted(() => ({ send: vi.fn(), models: vi.fn(), select: vi.fn() }));
vi.mock("@aws-sdk/client-s3", async (importOriginal) => ({
  ...await importOriginal<typeof import("@aws-sdk/client-s3")>(),
  S3Client: class { send = mocks.send; },
}));
vi.mock("../../amplify/functions/nativeVocabulary/modelAssets", () => ({ ensureStanzaModels: mocks.models }));
vi.mock("../../amplify/functions/nativeVocabulary/pythonBridge", () => ({ runNativeSelection: mocks.select }));

const prefix = "private/user/documents/document/analysis/run/native-vocabulary/job/";
const event = { manifestKey: prefix + "manifest.json" };
const remaining = vi.fn(() => 60_000);
const context = { getRemainingTimeInMillis: remaining } as unknown as Context;
const body = (value: unknown) => ({ Body: { transformToString: async () => JSON.stringify(value) } });

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("STORAGE_BUCKET", "storage-bucket");
  remaining.mockReturnValue(60_000);
  mocks.models.mockResolvedValue("/verified/stanza-es-v1");
  mocks.send.mockImplementation(async (command) => {
    if (command.input.Key === event.manifestKey) {
      return body({ language: "es", pages: [{ key: prefix + "page-1.json", pageNumber: 1 }] });
    }
    if (command.input.Key === prefix + "page-1.json") return body({ pageNumber: 1, text: "La membrana." });
    return {};
  });
  afterEach(() => { vi.unstubAllEnvs(); });
  mocks.select.mockImplementation(async (pages: AsyncIterable<unknown>) => {
    const consumed = [];
    for await (const page of pages) consumed.push(page);
    expect(consumed).toEqual([{ pageNumber: 1, text: "La membrana." }]);
    return { chunks: 1, candidates: [], splitSentences: 0 };
  });
});

describe("native handler model and document manifests", () => {
  it("keeps document-page manifests separate and passes the verified language model directory", async () => {
    expect(await handler(event, context)).toEqual({ outputKey: prefix + "result.json" });
    expect(mocks.models).toHaveBeenCalledWith(expect.anything(), "storage-bucket", "es",
      { signal: expect.any(AbortSignal) });
    expect(mocks.select).toHaveBeenCalledWith(expect.anything(), "es",
      { modelDirectory: "/verified/stanza-es-v1", timeoutMs: 45_000 });
    expect(mocks.send.mock.calls.map(([command]) => command.input.Key))
      .toEqual([event.manifestKey, prefix + "page-1.json", prefix + "result.json"]);
  });
  it("subtracts cold model loading time from the Python deadline", async () => {
    mocks.models.mockImplementation(async () => { remaining.mockReturnValue(30_000); return "/verified"; });
    await handler(event, context);
    expect(mocks.select).toHaveBeenCalledWith(expect.anything(), "es",
      { modelDirectory: "/verified", timeoutMs: 15_000 });
  });
  it("never runs Python or writes results when a model release is unavailable", async () => {
    mocks.models.mockRejectedValue(new Error("Stanza es model release unavailable or invalid"));
    await expect(handler(event, context)).rejects.toThrow("unavailable or invalid");
    expect(mocks.select).not.toHaveBeenCalled();
    expect(mocks.send).toHaveBeenCalledTimes(1);
  });
  it("does not start Python when cold model loading exhausts the invocation budget", async () => {
    mocks.models.mockImplementation(async () => { remaining.mockReturnValue(15_500); return "/verified"; });
    await expect(handler(event, context)).rejects.toThrow("Insufficient time after loading");
    expect(mocks.select).not.toHaveBeenCalled();
  });
  it("rejects English rather than falling back to native models", async () => {
    mocks.send.mockResolvedValue(body({ language: "en", pages: [] }));
    await expect(handler(event, context)).rejects.toThrow("requires vocabularyLanguage");
    expect(mocks.models).not.toHaveBeenCalled();
  });
});
