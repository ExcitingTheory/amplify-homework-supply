import { describe, expect, it, vi } from "vitest";
import {
  fromGradeResponse,
  gradeResponseId,
  instructorGroupFor,
  listGradeResponses,
  saveGradeResponse,
  toGradeResponseInput,
} from "../../src/utils/gradeResponses";
import { addResponse, buildResponse } from "../../src/utils/studentResponses";
import { encodeStrokes, createStrokeLog, updateStrokeLog, decodeStrokes } from "../../src/utils/strokeLog";
import { isAllowedSubmissionKey } from "../../amplify/functions/section/submissionKeys";
import { speechRecorderOptions } from "../../src/utils/audioRecordingFormat";

const NOW = Date.UTC(2026, 10, 14, 12, 0, 0);
const grade = { id: "g1", unitID: "u1", sectionID: "s1" };

describe("GradeResponse mapping", () => {
  it("builds one id per grade, block and question", () => {
    expect(gradeResponseId("g1", "answer-3", 2)).toBe("g1:answer-3:2");
  });

  it("uses the section's instructor group", () => {
    expect(instructorGroupFor(grade)).toBe("section-s1-instructors");
    expect(instructorGroupFor({ ...grade, instructorGroup: "custom" })).toBe("custom");
    expect(instructorGroupFor({ id: "g" })).toBeNull();
  });

  it("maps a record to typed model input, with every field present", () => {
    const record = buildResponse({
      inputMethod: "text",
      prompt: "Hello",
      text: "konichiwa",
      result: { answer: false, verdict: "misspelled", score: 0, reason: "Spelling" },
      now: NOW,
    });
    const input = toGradeResponseInput({ ...record, attempts: 1 }, { grade, blockKey: "b1", questionKey: 0 });
    expect(input).toMatchObject({
      gradeID: "g1",
      blockKey: "b1",
      questionKey: "0",
      unitID: "u1",
      sectionID: "s1",
      instructorGroup: "section-s1-instructors",
      inputMethod: "TEXT",
      verdict: "MISSPELLED",
      correct: false,
      score: 0,
      needsReview: true,
      attempts: 1,
      submittedAt: "2026-11-14T12:00:00.000Z",
    });
    // Unset fields are sent as null so a new attempt clears the old ones.
    expect(input.audioPath).toBeNull();
    expect(input.strokes).toBeNull();
    expect(input.history).toEqual([]);
  });

  it("round-trips a drawing with history through the model shape", () => {
    const log = createStrokeLog(0);
    updateStrokeLog(log, [{ id: "a", type: "freedraw", x: 0, y: 0, points: [[0, 0], [10, 0]], version: 2 }], 10);
    const strokes = encodeStrokes(log);
    let map = addResponse({}, "q", buildResponse({ inputMethod: "audio", audioPath: "p/a.webm", transcript: "hai", result: { answer: false, score: 10 }, now: NOW }));
    map = addResponse(map, "q", buildResponse({ inputMethod: "drawing", strokes, result: { answer: true, score: 90 }, now: NOW }));

    const input = toGradeResponseInput(map.q, { grade, blockKey: "b", questionKey: "q" });
    expect(input.inputMethod).toBe("DRAWING");
    expect(input.audioPath).toBeNull();
    expect(input.history).toHaveLength(1);
    expect(input.history[0]).toMatchObject({ inputMethod: "AUDIO", audioPath: "p/a.webm", correct: false });

    // What AppSync returns: the input plus nulls for anything unset.
    const item = JSON.parse(JSON.stringify({ id: "x", ...input }));
    const back = fromGradeResponse(item)!;
    expect(back).toMatchObject({ inputMethod: "drawing", verdict: "correct", answer: true, attempts: 2 });
    expect(back.history![0]).toMatchObject({ inputMethod: "audio", transcript: "hai", answer: false });
    expect(decodeStrokes(back.strokes)!.strokes).toHaveLength(1);
    expect("audioPath" in back).toBe(false);
  });
});

describe("saveGradeResponse", () => {
  const conditional = { errors: [{ errorType: "DynamoDB:ConditionalCheckFailedException", message: "The conditional request failed" }] };

  it("creates a new item", async () => {
    const create = vi.fn().mockResolvedValue({ data: {} });
    const update = vi.fn();
    await saveGradeResponse({ models: { GradeResponse: { create, update } } }, { id: "i", input: { a: 1 }, exists: false });
    expect(create).toHaveBeenCalledWith({ id: "i", a: 1 });
    expect(update).not.toHaveBeenCalled();
  });

  it("falls back to update when the item already exists", async () => {
    const create = vi.fn().mockResolvedValue(conditional);
    const update = vi.fn().mockResolvedValue({ data: {} });
    await saveGradeResponse({ models: { GradeResponse: { create, update } } }, { id: "i", input: {}, exists: false });
    expect(update).toHaveBeenCalledTimes(1);
  });

  it("falls back to create when an expected item is missing", async () => {
    const create = vi.fn().mockResolvedValue({ data: {} });
    const update = vi.fn().mockResolvedValue(conditional);
    await saveGradeResponse({ models: { GradeResponse: { create, update } } }, { id: "i", input: {}, exists: true });
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("throws on other errors", async () => {
    const create = vi.fn().mockResolvedValue({ errors: [{ errorType: "Unauthorized", message: "Not Authorized" }] });
    await expect(
      saveGradeResponse({ models: { GradeResponse: { create, update: vi.fn() } } }, { id: "i", input: {}, exists: false }),
    ).rejects.toThrow("Not Authorized");
  });
});

describe("listGradeResponses", () => {
  it("pages through the byGrade index", async () => {
    const byIndex = vi
      .fn()
      .mockResolvedValueOnce({ data: [{ id: "1" }], nextToken: "t" })
      .mockResolvedValueOnce({ data: [{ id: "2" }, null], nextToken: null });
    const items = await listGradeResponses(
      { models: { GradeResponse: { listGradeResponseByGradeIDAndBlockKey: byIndex } } },
      "g1",
    );
    expect(items.map((i: any) => i.id)).toEqual(["1", "2"]);
    expect(byIndex.mock.calls[1][1]).toMatchObject({ nextToken: "t" });
  });
});

describe("isAllowedSubmissionKey", () => {
  const prefix = "private/us-east-1:abc/";
  it("accepts keys under the owner's private prefix", () => {
    expect(isAllowedSubmissionKey("private/us-east-1:abc/user-submissions/g/n/a.webm", prefix)).toBe(true);
  });
  it("refuses other owners, traversal and non-strings", () => {
    expect(isAllowedSubmissionKey("private/us-east-1:xyz/a.webm", prefix)).toBe(false);
    expect(isAllowedSubmissionKey("private/us-east-1:abc/../xyz/a.webm", prefix)).toBe(false);
    expect(isAllowedSubmissionKey(42, prefix)).toBe(false);
    expect(isAllowedSubmissionKey("private/x", "")).toBe(false);
  });
});

describe("speechRecorderOptions", () => {
  it("records Opus at 16 kbps and AAC at 24 kbps", () => {
    expect(speechRecorderOptions("audio/webm;codecs=opus")).toEqual({ mimeType: "audio/webm;codecs=opus", audioBitsPerSecond: 16000 });
    expect(speechRecorderOptions("audio/mp4;codecs=mp4a.40.2")).toEqual({ mimeType: "audio/mp4;codecs=mp4a.40.2", audioBitsPerSecond: 24000 });
    expect(speechRecorderOptions(undefined)).toEqual({ audioBitsPerSecond: 24000 });
  });
});
