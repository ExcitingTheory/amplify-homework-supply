import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { referenceSummary, samplePath, synthesizeHandwriting } from "../../amplify/seed/handwriting";
import {
  BIOLOGY_SPOKEN_ANSWER,
  biologyAIScenario,
  japaneseVocabScenario,
  replayAnswerSteps,
  seedGradeResponses,
  submissionPath,
  VOCAB_BLOCK_KEY,
} from "../../amplify/seed/studentResponses";
import {
  compareStrokeOrder,
  decodeStrokes,
  STROKE_DATA_MAX_BYTES,
  summarizeStrokes,
} from "../../src/utils/strokeLog";

const ROOT = resolve(__dirname, "../..");
const ASSETS = resolve(ROOT, "test/mocks/student-responses");
const kanjivg = JSON.parse(readFileSync(resolve(ASSETS, "kanjivg-arigatou.json"), "utf8"));
const glyphs = kanjivg.glyphs;
const START = Date.UTC(2026, 10, 10, 17, 0, 0);
const words = [
  { id: "w-hello", phrase: "こんにちは", definition: "Hello (daytime greeting)" },
  { id: "w-thanks", phrase: "ありがとう", definition: "Thank you" },
  { id: "w-bye", phrase: "さようなら", definition: "Goodbye" },
];

describe("KanjiVG asset", () => {
  it("has ありがとう in stroke order with attribution", () => {
    expect(glyphs.map((g: any) => g.char).join("")).toBe("ありがとう");
    expect(glyphs.map((g: any) => g.strokes.length)).toEqual([3, 2, 5, 2, 2]);
    expect(kanjivg.license).toBe("CC BY-SA 3.0");
    expect(kanjivg.attribution).toContain("KanjiVG");
  });
});

describe("samplePath", () => {
  it("follows lines and relative curves", () => {
    expect(samplePath("M0,0 L10,0")).toEqual([[0, 0], [10, 0]]);
    const curve = samplePath("M0,0c0,10,10,10,10,0", 4);
    expect(curve[0]).toEqual([0, 0]);
    expect(curve[curve.length - 1]).toEqual([10, 0]);
    expect(curve[2][1]).toBeCloseTo(7.5);
  });

  it("samples every KanjiVG stroke", () => {
    for (const g of glyphs) for (const d of g.strokes) expect(samplePath(d).length).toBeGreaterThan(10);
  });
});

describe("synthesizeHandwriting", () => {
  const reference = referenceSummary(glyphs);

  it("draws ありがとう in the correct stroke order", () => {
    const { strokes } = synthesizeHandwriting(glyphs, { seed: 11, startedAt: START });
    expect(strokes.strokes).toHaveLength(14);
    expect(strokes.tolerance).toBe(0.5);
    expect(JSON.stringify(strokes).length).toBeLessThan(STROKE_DATA_MAX_BYTES);
    const result = compareStrokeOrder(summarizeStrokes(decodeStrokes(strokes)), reference);
    expect(result.problems).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it("records hand-like timing", () => {
    const { strokes } = synthesizeHandwriting(glyphs, { seed: 11, startedAt: START });
    const durations = strokes.strokes.map((s) => s.durationMs ?? 0);
    expect(Math.min(...durations)).toBeGreaterThan(80);
    expect(strokes.strokes.every((s, i) => i === 0 || (s.startMs ?? 0) > (strokes.strokes[i - 1].startMs ?? 0))).toBe(true);
    expect(strokes.strokes.every((s) => (s.times?.length ?? 0) > 0)).toBe(true);
  });

  it("is deterministic for a seed", () => {
    const a = synthesizeHandwriting(glyphs, { seed: 5, startedAt: START }).strokes;
    const b = synthesizeHandwriting(glyphs, { seed: 5, startedAt: START }).strokes;
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("makes the requested stroke-order mistakes detectable", () => {
    const { strokes } = synthesizeHandwriting(glyphs, {
      seed: 23,
      startedAt: START,
      order: { 0: [1, 0, 2] },
      reversed: ["3:1"],
    });
    const result = compareStrokeOrder(summarizeStrokes(decodeStrokes(strokes)), reference);
    expect(result.ok).toBe(false);
    expect(result.strokes[0]).toMatchObject({ match: 2, inOrder: false });
    expect(result.strokes[1]).toMatchObject({ match: 1, inOrder: false });
    // と's second stroke is the 12th stroke drawn.
    expect(result.strokes[11]).toMatchObject({ match: 12, inOrder: true, reversed: true });
    expect(result.strokes.filter((s) => !s.inOrder || s.reversed)).toHaveLength(3);
  });
});

describe("scenarios", () => {
  it("strong: everything correct, nothing flagged", () => {
    const scenario = japaneseVocabScenario("strong", words, glyphs, START);
    const records = replayAnswerSteps(scenario.steps, { startedAt: START, audioPaths: { 2: "p/a.webm" } });
    expect(Object.keys(records)).toEqual(["0", "1", "2"]);
    expect(records["0"]).toMatchObject({ inputMethod: "text", text: "こんにちは", verdict: "correct", needsReview: false });
    expect(records["1"]).toMatchObject({ inputMethod: "drawing", verdict: "correct", needsReview: false });
    expect(records["2"]).toMatchObject({ inputMethod: "audio", audioPath: "p/a.webm", transcript: "さようなら", attempts: 1, needsReview: false });
    expect(scenario.blockData).toMatchObject({ complete: true, accuracy: 100, correctCount: 3 });
  });

  it("struggling: misspelling and low-confidence audio are flagged", () => {
    const scenario = japaneseVocabScenario("struggling", words, glyphs, START);
    const records = replayAnswerSteps(scenario.steps, { startedAt: START });
    expect(records["0"]).toMatchObject({ text: "こんにちわ", verdict: "misspelled", needsReview: true });
    expect(records["1"]).toMatchObject({ verdict: "correct", needsReview: false });
    expect(records["2"]).toMatchObject({ transcript: "さよなら", verdict: "incorrect", score: 60, needsReview: true });
    expect(scenario.blockData).toMatchObject({ accuracy: 33, correctCount: 1 });
  });

  it("silent: an empty transcript is flagged", () => {
    const records = replayAnswerSteps(japaneseVocabScenario("silent", words, glyphs, START).steps, { startedAt: START });
    expect(records["2"]).toMatchObject({ inputMethod: "audio", verdict: "incorrect", needsReview: true });
    expect(records["2"].transcript).toBe("");
    expect(records["1"]).toMatchObject({ text: "ありがと", verdict: "misspelled" });
  });

  it("biology: the failed recording stays in history", () => {
    const questions = [
      { id: "q-product", prompt: "What is the main product of photosynthesis?" },
      { id: "q-organelle", prompt: "In which organelle does photosynthesis occur?" },
    ];
    const scenario = biologyAIScenario(questions, START);
    const records = replayAnswerSteps(scenario.steps, { startedAt: START, audioPaths: { 1: "p/first.webm", 3: "p/second.webm" } });
    const spoken = records["q-organelle"];
    expect(spoken).toMatchObject({ attempts: 2, audioPath: "p/second.webm", transcript: BIOLOGY_SPOKEN_ANSWER, verdict: "correct", score: 95 });
    expect(spoken.history).toHaveLength(1);
    expect(spoken.history![0]).toMatchObject({ audioPath: "p/first.webm", verdict: "error", needsReview: true });
    expect(scenario.blockData).toMatchObject({ complete: true, accuracy: 0.935 });
  });

  it("uses the generator script's wording for the biology recording", () => {
    const script = readFileSync(resolve(ROOT, "scripts/demos/generate-spoken-answer.mjs"), "utf8");
    for (const sentence of BIOLOGY_SPOKEN_ANSWER.split(/(?<=\.) /)) {
      expect(script.replace(/"\s*\+\s*"/g, "")).toContain(sentence.trim());
    }
  });
});

describe("recordings", () => {
  it("are real WebM and MP4 files", () => {
    const magic = (name: string) => readFileSync(resolve(ASSETS, name));
    for (const name of ["sayonara-chrome.webm", "quiet-room.webm", "biology-first-try.webm", "biology-chloroplast-answer.webm"]) {
      expect(magic(name).subarray(0, 4).toString("hex")).toBe("1a45dfa3");
    }
    expect(magic("sayonara-casual-safari.m4a").subarray(4, 8).toString()).toBe("ftyp");
  });
});

describe("seedGradeResponses", () => {
  it("uploads recordings to the owner's folder and writes one item per question", async () => {
    const uploads: Array<{ path: string; contentType?: string; bytes: number }> = [];
    const created: any[] = [];
    const ctx = {
      client: { models: { GradeResponse: { create: vi.fn(async (input) => (created.push(input), { data: input })) } } },
      uploadData: vi.fn(({ path, data, options }) => {
        uploads.push({ path, contentType: options?.contentType, bytes: data.length });
        return { result: Promise.resolve({ path }) };
      }),
      identityId: "us-east-1:student-2",
      assetsDir: ASSETS,
    };
    const grade = { id: "grade-2", unitID: "unit-0", sectionID: "jpn101" };
    const scenario = japaneseVocabScenario("struggling", words, glyphs, START);
    const written = await seedGradeResponses(ctx, grade, scenario, START);

    expect(written).toBe(3);
    expect(uploads).toHaveLength(1);
    expect(uploads[0]).toMatchObject({
      path: submissionPath("us-east-1:student-2", "grade-2", `${VOCAB_BLOCK_KEY}-w-bye`, START + 7 * 60_000, "sayonara-casual-safari.m4a"),
      contentType: "audio/mp4",
    });
    expect(uploads[0].path.startsWith("private/us-east-1:student-2/user-submissions/grade-2/")).toBe(true);
    expect(created.map((c) => c.id)).toEqual(["grade-2:vocab-recall-1:0", "grade-2:vocab-recall-1:1", "grade-2:vocab-recall-1:2"]);
    expect(created[0]).toMatchObject({ inputMethod: "TEXT", verdict: "MISSPELLED", instructorGroup: "section-jpn101-instructors" });
    expect(created[2]).toMatchObject({ inputMethod: "AUDIO", audioPath: uploads[0].path, transcript: "さよなら" });

    // Strokes only use fields the ResponseStroke type defines.
    const allowed = new Set(["order", "startMs", "durationMs", "points", "times", "restored", "erasedMs", "color", "width", "pointCount"]);
    expect(Object.keys(created[1].strokes).sort()).toEqual(["startedAt", "strokes", "tolerance", "version"]);
    for (const stroke of created[1].strokes.strokes) {
      for (const key of Object.keys(stroke)) expect(allowed.has(key)).toBe(true);
    }
  });
});
