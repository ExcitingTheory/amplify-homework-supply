import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ s3: vi.fn(), invoke: vi.fn() }));
vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: class { send = mocks.s3; },
  GetObjectCommand: class { constructor(public input: unknown) {} },
  PutObjectCommand: class { constructor(public input: unknown) {} },
}));
vi.mock("@aws-sdk/client-lambda", () => ({
  LambdaClient: class { send = mocks.invoke; },
  InvokeCommand: class { constructor(public input: unknown) {} },
}));
import { resolveVocabularyLanguage, selectNativeVocabulary } from "../../amplify/functions/documentAnalysis/nativeVocabulary";
import { handler } from "../../amplify/functions/nativeVocabulary/handler";
import type { Context } from "aws-lambda";

describe("native vocabulary private artifact transport", () => {
  const pages = [{ pageNumber: 1, text: "La membrana regula el transporte." }];
  const baseKey = "private/owner/documents/doc/analysis/run";
  let outputKey: string;
  let output: Record<string, unknown>;
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("STORAGE_BUCKET", "bucket");
    vi.stubEnv("NATIVE_VOCABULARY_FUNCTION_NAME", "native-function");
    output = {
      version: "stanza-wordfreq-v1", language: "es", splitSentences: 0,
      candidates: [{
        term: "membrana", lemma: "membrana", page: 1, sourceText: pages[0].text,
        documentCount: 2, frequencyPerMillion: 1, score: 20, reasons: ["repeated-in-document"],
      }],
    };
    mocks.invoke.mockImplementation(async ({ input }: { input: { Payload: Buffer } }) => {
      const { manifestKey } = JSON.parse(input.Payload.toString());
      outputKey = manifestKey.replace("manifest.json", "result.json");
      return { Payload: Buffer.from(JSON.stringify({ outputKey })) };
    });
    mocks.s3.mockImplementation(async ({ input }: { input: { Key: string; Body?: string } }) => {
      if (input.Body) return {};
      expect(input.Key).toBe(outputKey);
      return { Body: { transformToString: async () => JSON.stringify(output) } };
    });
  });
  it("uses only a manifest pointer in Lambda payloads and verifies source provenance on return", async () => {
    const result = await selectNativeVocabulary(pages, "es", baseKey);
    expect(result.candidates).toHaveLength(1);
    const payload = JSON.parse(mocks.invoke.mock.calls[0][0].input.Payload.toString());
    expect(Object.keys(payload)).toEqual(["manifestKey"]);
    expect(payload.manifestKey).toMatch(/^private\/owner\/documents\/doc\/analysis\/run\/native-vocabulary\/[^/]+\/manifest.json$/);
    expect(mocks.s3.mock.calls[0][0].input).toMatchObject({
      Tagging: "analysis-run=true", Body: JSON.stringify(pages[0]),
    });
  });
  it("surfaces child Lambda failures instead of substituting English selection", async () => {
    mocks.invoke.mockResolvedValueOnce({ FunctionError: "Unhandled" });
    await expect(selectNativeVocabulary(pages, "es", baseKey)).rejects.toThrow("Lambda processing failed");
  });
  it("rejects invented source quotes", async () => {
    output.candidates = [{
      term: "membrana", lemma: "membrana", page: 1, sourceText: "invented",
      documentCount: 2, frequencyPerMillion: 1, score: 20, reasons: [],
    }];
    await expect(selectNativeVocabulary(pages, "es", baseKey)).rejects.toThrow("source quote");
  });
  it("returns explicit review warnings for oversized sentence splitting", async () => {
    output.splitSentences = 1;
    expect((await selectNativeVocabulary(pages, "es", baseKey)).reviewWarnings).toEqual([
      expect.stringContaining("chunk boundaries"),
    ]);
  });
  it("requires a supported language rather than silently defaulting", () => {
    expect(resolveVocabularyLanguage('{"vocabularyLanguage":"ar"}')).toBe("ar");
    expect(() => resolveVocabularyLanguage({})).toThrow();
  });
  it("rejects source references outside the invocation's private artifact prefix", async () => {
    mocks.s3.mockResolvedValueOnce({ Body: { transformToString: async () => JSON.stringify({
      language: "es", pages: [{ key: "private/another-owner/source.json", pageNumber: 1 }],
    }) } });
    await expect(handler({
      manifestKey: `${baseKey}/native-vocabulary/id/manifest.json`,
    }, { getRemainingTimeInMillis: () => 60_000 } as Context)).rejects.toThrow("page reference");
  });
});
