import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  isAnalyzableSeedFile,
  loadAnalysisSnapshot,
  resolveSeedAnalysisMode,
  saveAnalysisSnapshot,
  sha256Hex,
  snapshotFilePath,
  stripNulls,
  type AnalysisSnapshot,
} from "../../../scripts/seed/analysisSnapshots";

const snapshot = (overrides: Partial<AnalysisSnapshot> = {}): AnalysisSnapshot => ({
  sourceSha256: "abc",
  capturedAt: "2026-10-25T00:00:00.000Z",
  sourceFormat: "pdf",
  pageCount: 2,
  vocabularyJSON: [{ word: "Path", definition: null, page: 1 }],
  summariesJSON: [],
  objectivesJSON: [],
  conceptsJSON: [],
  questionsJSON: [null, { prompt: "q", answer: "a", hint: null }],
  ...overrides,
});

describe("resolveSeedAnalysisMode", () => {
  it("defaults to auto and rejects unknown values", () => {
    expect(resolveSeedAnalysisMode(undefined)).toBe("auto");
    expect(resolveSeedAnalysisMode("")).toBe("auto");
    expect(resolveSeedAnalysisMode("live")).toBe("live");
    expect(resolveSeedAnalysisMode("off")).toBe("off");
    expect(() => resolveSeedAnalysisMode("snapshot")).toThrow(
      "Invalid SEED_ANALYSIS_MODE",
    );
  });
});

describe("isAnalyzableSeedFile", () => {
  it("matches documents and ignores media", () => {
    for (const name of [
      "a.pdf",
      "A.DOCX",
      "x.rtf",
      "q.qti",
      "p.imscc",
      "s.zip",
      "g.gift",
    ]) {
      expect(isAnalyzableSeedFile(name)).toBe(true);
    }
    for (const name of ["a.jpg", "b.mp3", "c.wav", "d.png"]) {
      expect(isAnalyzableSeedFile(name)).toBe(false);
    }
  });
});

describe("analysis snapshot storage", () => {
  let directory: string;
  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), "seed-analysis-"));
  });
  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  it("round-trips a snapshot and strips nulls left by AppSync reads", async () => {
    expect(await saveAnalysisSnapshot(directory, "guide.pdf", snapshot())).toBe(
      true,
    );
    const loaded = await loadAnalysisSnapshot(directory, "guide.pdf", "abc");
    expect(loaded?.vocabularyJSON).toEqual([{ word: "Path", page: 1 }]);
    expect(loaded?.questionsJSON).toEqual([{ prompt: "q", answer: "a" }]);
    expect(loaded?.pageCount).toBe(2);
  });

  it("only replays a snapshot for the same source bytes", async () => {
    await saveAnalysisSnapshot(directory, "guide.pdf", snapshot());
    expect(await loadAnalysisSnapshot(directory, "guide.pdf", "other")).toBeNull();
    expect(await loadAnalysisSnapshot(directory, "missing.pdf", "abc")).toBeNull();
  });

  it("does not store an analysis that produced nothing", async () => {
    const empty = snapshot({ vocabularyJSON: [], questionsJSON: [] });
    expect(await saveAnalysisSnapshot(directory, "empty.txt", empty)).toBe(false);
    expect(await loadAnalysisSnapshot(directory, "empty.txt", "abc")).toBeNull();
  });

  it("ignores corrupt or malformed snapshot files", async () => {
    await writeFile(snapshotFilePath(directory, "bad.pdf"), "{not json");
    expect(await loadAnalysisSnapshot(directory, "bad.pdf", "abc")).toBeNull();
    await writeFile(
      snapshotFilePath(directory, "shape.pdf"),
      JSON.stringify({ sourceSha256: "abc", vocabularyJSON: "nope" }),
    );
    expect(await loadAnalysisSnapshot(directory, "shape.pdf", "abc")).toBeNull();
  });

  it("writes one stable file per source name", async () => {
    await saveAnalysisSnapshot(directory, "weird name (1).pdf", snapshot());
    const path = snapshotFilePath(directory, "weird name (1).pdf");
    expect(path).toMatch(/weird_name_1_\.pdf\.snapshot\.json$/);
    expect((await readFile(path, "utf8")).endsWith("\n")).toBe(true);
  });
});

describe("helpers", () => {
  it("hashes bytes", () => {
    expect(sha256Hex(Buffer.from("a"))).toBe(
      "ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",
    );
  });

  it("strips null and undefined recursively", () => {
    expect(stripNulls({ a: null, b: [null, { c: undefined, d: 1 }] })).toEqual({
      b: [{ d: 1 }],
    });
  });
});
