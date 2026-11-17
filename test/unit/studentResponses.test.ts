import { describe, expect, it } from "vitest";
import {
  addResponse,
  buildResponse,
  isResponseRecord,
  listBlockResponses,
  needsReview,
  submissionKeysFor,
  verdictFromResult,
} from "../../src/utils/studentResponses";

const NOW = Date.UTC(2026, 10, 14, 12, 0, 0);

describe("verdictFromResult", () => {
  it("maps grader shapes to verdicts", () => {
    expect(verdictFromResult({ answer: true })).toBe("correct");
    expect(verdictFromResult({ correct: false })).toBe("incorrect");
    expect(verdictFromResult({ answer: false, verdict: "misspelled" })).toBe("misspelled");
    expect(verdictFromResult({ error: "boom" })).toBe("error");
    expect(verdictFromResult("An error occurred")).toBe("error");
    expect(verdictFromResult(undefined)).toBeUndefined();
  });
});

describe("buildResponse", () => {
  it("keeps the raw typed answer next to the verdict", () => {
    const r = buildResponse({
      inputMethod: "text",
      prompt: "Hello",
      text: "konichiwa",
      result: { answer: false, verdict: "misspelled", score: 0, reason: "Check the spelling." },
      now: NOW,
    });
    expect(r).toEqual({
      v: 1,
      inputMethod: "text",
      prompt: "Hello",
      text: "konichiwa",
      verdict: "misspelled",
      answer: false,
      score: 0,
      reason: "Check the spelling.",
      submittedAt: "2026-11-14T12:00:00.000Z",
      needsReview: true,
    });
  });

  it("keeps the recording path and the transcript", () => {
    const r = buildResponse({
      inputMethod: "audio",
      audioPath: "private/id/user-submissions/g/n/a.webm",
      transcript: "arigatou",
      result: { answer: true, score: 95, reason: "Good" },
      now: NOW,
    });
    expect(r).toMatchObject({ audioPath: "private/id/user-submissions/g/n/a.webm", transcript: "arigatou" });
    expect(r.needsReview).toBe(false);
  });

  it("keeps a drawing as its strokes, with no file", () => {
    const strokes = { version: 1, startedAt: 0, tolerance: 0.5, strokes: [{ order: 0, startMs: 0, durationMs: 10, points: [0, 0, 5, 5] }] };
    const r = buildResponse({ inputMethod: "drawing", strokes, result: { answer: true, score: 90 }, now: NOW });
    expect(r.strokes).toBe(strokes);
    expect(submissionKeysFor([r])).toEqual([]);
  });

  it("clips very long text so grade data stays small", () => {
    const r = buildResponse({ inputMethod: "text", text: "x".repeat(9000), now: NOW });
    expect(r.text).toHaveLength(5000);
  });
});

describe("needsReview", () => {
  it("flags failures, near misses, empty transcripts and score disagreements", () => {
    expect(needsReview({ verdict: "error" })).toBe(true);
    expect(needsReview({ verdict: "misspelled" })).toBe(true);
    expect(needsReview({ inputMethod: "audio", transcript: "  " })).toBe(true);
    expect(needsReview({ inputMethod: "text", answer: true, score: 30 })).toBe(true);
    expect(needsReview({ inputMethod: "text", answer: false, score: 0.7 })).toBe(true);
    expect(needsReview({ inputMethod: "text", confidence: 0.4 })).toBe(true);
  });

  it("does not flag confident answers", () => {
    expect(needsReview({ inputMethod: "text", verdict: "correct", answer: true, score: 90 })).toBe(false);
    expect(needsReview({ inputMethod: "text", verdict: "incorrect", answer: false, score: 10 })).toBe(false);
  });
});

describe("addResponse", () => {
  const first = buildResponse({ inputMethod: "text", text: "a", result: { answer: false }, now: NOW });
  const second = buildResponse({ inputMethod: "text", text: "b", result: { answer: true }, now: NOW + 1 });

  it("counts attempts and keeps earlier ones in history", () => {
    let map = addResponse({}, "q1", first);
    map = addResponse(map, "q1", second);
    expect(map.q1.text).toBe("b");
    expect(map.q1.attempts).toBe(2);
    expect(map.q1.history!.map((h: any) => h.text)).toEqual(["a"]);
  });

  it("keeps at most three earlier attempts and drops their stroke data", () => {
    let map: any = {};
    for (let i = 0; i < 6; i++) {
      map = addResponse(
        map,
        "q",
        buildResponse({
          inputMethod: "drawing",
          text: `d${i}`,
          strokes: { version: 1, strokes: Array.from({ length: i }, (_, order) => ({ order, points: [0, 0] })) },
          now: NOW,
        }),
      );
    }
    expect(map.q.attempts).toBe(6);
    expect(map.q.history.map((h: any) => h.text)).toEqual(["d4", "d3", "d2"]);
    expect(map.q.history[0].strokes).toBeUndefined();
    expect(map.q.history[0].strokeCount).toBe(4);
  });

  it("merges the transcript into the same attempt as the recording", () => {
    let map = addResponse({}, "q", buildResponse({ inputMethod: "audio", audioPath: "a.webm", now: NOW }));
    expect(map.q.needsReview).toBe(true);
    map = addResponse(
      map,
      "q",
      buildResponse({ inputMethod: "audio", transcript: "hai", result: { answer: true, score: 90 }, now: NOW }),
      { sameAttempt: true },
    );
    expect(map.q).toMatchObject({ audioPath: "a.webm", transcript: "hai", verdict: "correct", attempts: 1 });
    expect(map.q.needsReview).toBe(false);
  });

  it("does not merge a stale grading callback into a newer recording", () => {
    let map: any = addResponse(
      {},
      "q",
      buildResponse({
        inputMethod: "audio",
        audioPath: "a.webm",
        attemptId: "attempt-a",
        now: NOW,
      }),
    );
    map = addResponse(
      map,
      "q",
      buildResponse({
        inputMethod: "audio",
        audioPath: "b.webm",
        attemptId: "attempt-b",
        now: NOW + 1,
      }),
    );
    map = addResponse(
      map,
      "q",
      buildResponse({
        inputMethod: "audio",
        transcript: "transcript for a",
        attemptId: "attempt-a",
        now: NOW + 2,
      }),
      { sameAttempt: true, attemptId: "attempt-a" },
    );

    expect(map.q).toMatchObject({
      audioPath: "b.webm",
      attempts: 2,
      history: [{ audioPath: "a.webm" }],
    });
    expect(map.q.transcript).toBeUndefined();
  });

  it("does not mutate the input map", () => {
    const map = {};
    addResponse(map, "q", first);
    expect(map).toEqual({});
  });
});

describe("listBlockResponses", () => {
  it("returns new-format records", () => {
    const rec = buildResponse({ inputMethod: "text", text: "a", now: NOW });
    const list = listBlockResponses({ complete: true, accuracy: 100, responses: { 0: rec } });
    expect(list).toEqual([{ key: "0", record: rec, legacy: false }]);
    expect(isResponseRecord(rec)).toBe(true);
  });

  it("reads quiz attempts", () => {
    const list = listBlockResponses({
      accuracy: 50,
      attemptedAnswers: { a: "Tokyo", b: "Osaka" },
      correctAnswers: { a: "Tokyo" },
    });
    expect(list.map((x) => [x.key, x.record.text, x.record.verdict])).toEqual([
      ["a", "Tokyo", "correct"],
      ["b", "Osaka", "incorrect"],
    ]);
  });

  it("reads legacy custom-answer text and per-question audio keys", () => {
    expect(listBlockResponses({ complete: true, userResponse: "my answer", feedback: "ok" })[0].record).toMatchObject({
      inputMethod: "text",
      text: "my answer",
      reason: "ok",
    });
    expect(listBlockResponses({ userAnswer: "x" })[0].record.text).toBe("x");
    expect(
      listBlockResponses({ audioFilePath: "a.webm", transcript: "hi", inputMethod: "audio" })[0].record,
    ).toMatchObject({ inputMethod: "audio", audioPath: "a.webm", transcript: "hi" });
  });

  it("reads per-question verdict maps from block data", () => {
    const answerBlock = listBlockResponses({
      complete: true,
      totalWords: 2,
      feedback: { 0: { answer: true, reason: "Good" }, 1: { answer: false, reason: "Check the spelling" } },
    });
    expect(answerBlock.map((x) => [x.key, x.record.verdict, x.record.reason])).toEqual([
      ["0", "correct", "Good"],
      ["1", "incorrect", "Check the spelling"],
    ]);
    const custom = listBlockResponses({ complete: true, userResponse: "mine", feedback: "ok", results: { q1: { answer: false } } });
    expect(custom[0].record).toMatchObject({ text: "mine", verdict: "incorrect" });
  });

  it("returns nothing for blocks without answers", () => {
    expect(listBlockResponses({ complete: true, accuracy: 100 })).toEqual([]);
    expect(listBlockResponses(null)).toEqual([]);
  });
});

describe("submissionKeysFor", () => {
  it("collects unique file keys", () => {
    const a = buildResponse({ inputMethod: "audio", audioPath: "a", now: NOW });
    const d = buildResponse({ inputMethod: "image", imagePath: "photo.jpg", now: NOW });
    expect(submissionKeysFor([{ record: a }, { record: d }, { record: a }])).toEqual(["a", "photo.jpg"]);
  });
});
