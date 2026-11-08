import { describe, expect, it, vi } from "vitest";
import { startAnalysisRun, type AnalysisDocument } from "../../amplify/functions/documentAnalysis/startAnalysisRun";

const stateMachineArn = "arn:aws:states:us-east-1:123456789012:stateMachine:Analysis";

function store(initial: AnalysisDocument = { id: "doc-1", _version: null }) {
  let document = initial;
  const load = vi.fn(async () => ({ ...document }));
  const claim = vi.fn(async (expected: AnalysisDocument, update: { status: string; metadata: string }) => {
    if (expected._version !== document._version) {
      throw new Error("ConditionalCheckFailedException");
    }
    document = { ...document, ...update, _version: (document._version ?? 0) + 1 };
  });
  const start = vi.fn(async (_id: string) => {});
  return { load, claim, start, stateMachineArn, read: () => document };
}

describe("atomic document analysis starts", () => {
  it("starts exactly one execution for simultaneous upload/manual requests", async () => {
    const options = store();
    const results = await Promise.all(Array.from({ length: 8 }, () => startAnalysisRun(options)));
    expect(options.start).toHaveBeenCalledOnce();
    expect(new Set(results.map(result => result.executionArn)).size).toBe(1);
    expect(results.filter(result => !result.reused)).toHaveLength(1);
    const metadata = JSON.parse(options.read().metadata!);
    expect(results[0].executionArn).toBe(
      `arn:aws:states:us-east-1:123456789012:execution:Analysis:${metadata.analysis.runId}`,
    );
    expect(options.read()._version).toBe(1);
  });

  it("registers the execution ARN before start and never overwrites workflow progress afterward", async () => {
    const options = store();
    options.start.mockImplementationOnce(async runId => {
      const current = options.read();
      const metadata = JSON.parse(current.metadata!);
      expect(metadata.analysis.executionArn).toContain(runId);
      await options.claim(current, {
        status: "analyzing",
        metadata: JSON.stringify({ ...metadata, analysis: { ...metadata.analysis, state: "analyzing", done: 2 } }),
      });
    });
    await startAnalysisRun(options);
    expect(JSON.parse(options.read().metadata!).analysis).toMatchObject({ state: "analyzing", done: 2 });
    expect(options.claim).toHaveBeenCalledTimes(2);
  });

  it.each(["completed", "failed", "cancelled"])("starts a fresh run after %s", async state => {
    const options = store({
      id: "doc-1", _version: 3,
      metadata: JSON.stringify({ retained: "metadata", analysis: {runId:"old",executionArn:"old-arn",state} }),
    });
    const result = await startAnalysisRun(options);
    expect(result.reused).toBe(false);
    expect(options.start).toHaveBeenCalledOnce();
    expect(JSON.parse(options.read().metadata!).retained).toBe("metadata");
  });

  it("marks a rejected startup failed and allows an explicit retry", async () => {
    const options = store();
    options.start.mockRejectedValueOnce(new Error("Start denied"));
    await expect(startAnalysisRun(options)).rejects.toThrow("Start denied");
    expect(JSON.parse(options.read().metadata!).analysis).toMatchObject({state:"failed",error:"Start denied"});
    await expect(startAnalysisRun(options)).resolves.toMatchObject({reused:false});
    expect(options.start).toHaveBeenCalledTimes(2);
  });

  it("surfaces non-conflict claim errors without starting work", async () => {
    const options = store();
    options.claim.mockRejectedValueOnce(new Error("Access denied"));
    await expect(startAnalysisRun(options)).rejects.toThrow("Access denied");
    expect(options.start).not.toHaveBeenCalled();
  });

  it("bounds conflicting claims", async () => {
    const options = store();
    options.claim.mockRejectedValue(new Error("ConditionalCheckFailedException"));
    await expect(startAnalysisRun(options)).rejects.toThrow("ConditionalCheckFailedException");
    expect(options.claim).toHaveBeenCalledTimes(5);
    expect(options.start).not.toHaveBeenCalled();
  });

  it("rejects malformed active state rather than claiming success or replacing it", async () => {
    const options = store({
      id:"doc-1", _version:1,
      metadata:JSON.stringify({analysis:{runId:"old",state:"analyzing"}}),
    });
    await expect(startAnalysisRun(options)).rejects.toThrow("cancel it before retrying");
    expect(options.claim).not.toHaveBeenCalled();
  });
});
