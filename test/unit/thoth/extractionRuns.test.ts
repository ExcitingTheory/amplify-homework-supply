import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  loadLatestExtractionRun,
  saveExtractionRun,
} from "../../../scripts/thoth/extractionRuns";

describe("extraction run capture", () => {
  let directory: string;
  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), "thoth-runs-"));
  });
  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  it("preserves output even when scoring subsequently fails", async () => {
    const content = {
      questionsJSON: [{ prompt: "q", answer: "a", pages: [3, 4], field: null }],
      vocabularyJSON: [null, { word: "term", pages: [4] }],
    };
    const path = await saveExtractionRun(directory, "source", content);
    expect(() => {
      throw new Error("extraction gate failed");
    }).toThrow("extraction gate failed");
    const run = await loadLatestExtractionRun(directory, "source");
    expect(run?.path).toBe(path);
    expect(JSON.parse(run!.text)).toMatchObject({
      sourceSha256: "source",
      ...content,
      summariesJSON: [],
      objectivesJSON: [],
      conceptsJSON: [],
      pendingMediaJSON: [],
    });
  });

  it("keeps every run without overwriting a validated snapshot", async () => {
    const validated = join(directory, "validated.snapshot");
    await writeFile(validated, "previously passed");
    const runs = join(directory, "runs");
    const first = await saveExtractionRun(runs, "source", {});
    const second = await saveExtractionRun(runs, "source", {});
    expect(first).not.toBe(second);
    expect(await readdir(runs)).toHaveLength(2);
    expect(await readFile(validated, "utf8")).toBe("previously passed");
  });

  it("loads the latest compatible capture without using different source bytes", async () => {
    const run = {
      sourceSha256: "source",
      vocabularyJSON: [],
      questionsJSON: [],
      summariesJSON: [],
      objectivesJSON: [],
      conceptsJSON: [],
      pendingMediaJSON: [],
    };
    await writeFile(join(directory, "2026-01-01.json"), JSON.stringify(run));
    await writeFile(join(directory, "2026-01-02.json"), JSON.stringify(run));
    await writeFile(
      join(directory, "2026-01-03.json"),
      JSON.stringify({ ...run, sourceSha256: "other" }),
    );
    expect((await loadLatestExtractionRun(directory, "source"))?.path).toBe(
      join(directory, "2026-01-02.json"),
    );
    expect(await loadLatestExtractionRun(directory, "unknown")).toBeNull();
    expect(await loadLatestExtractionRun(join(directory, "absent"), "source"))
      .toBeNull();
  });

  it("surfaces corrupt captures instead of silently re-running paid analysis", async () => {
    await writeFile(join(directory, "bad.json"), "{bad");
    await expect(loadLatestExtractionRun(directory, "source")).rejects.toThrow();
    await writeFile(join(directory, "bad.json"), '{"sourceSha256":"source"}');
    await expect(loadLatestExtractionRun(directory, "source")).rejects.toThrow(
      "Invalid extraction lists",
    );
  });

  it("rejects malformed lists rather than replacing them with empty data", async () => {
    await expect(
      saveExtractionRun(directory, "source", { questionsJSON: "not an array" }),
    ).rejects.toThrow("questionsJSON must be an array");
    expect(await readdir(directory)).toEqual([]);
  });
});
