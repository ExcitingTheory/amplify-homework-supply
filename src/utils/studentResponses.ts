/**
 * Student response records.
 *
 * A response record keeps what the student actually gave us, before any
 * transcription or image recognition, next to what the grader concluded.
 * Components build records here and save them as GradeResponse items
 * (see gradeResponses.ts and amplify/data/resource.ts):
 *
 *   {
 *     v: 1,
 *     inputMethod: "text" | "audio" | "drawing" | "image",
 *     prompt?: string,          // what the student was shown
 *     text?: string,            // typed answer, verbatim
 *     audioPath?: string,       // S3 key of the original recording
 *     transcript?: string,      // speech-to-text of that recording
 *     strokes?: object,         // drawings: encodeStrokes() output (see strokeLog.ts)
 *     imagePath?: string,       // uploaded photos: S3 key of the original file
 *     verdict?: "correct" | "misspelled" | "incorrect" | "error",
 *     answer?: boolean, score?: number, reason?: string,
 *     needsReview: boolean,     // low confidence: a teacher should look
 *     submittedAt: string,      // ISO time
 *     attempts: number,
 *     history?: object[],       // up to 3 earlier attempts, without strokes
 *   }
 *
 * Everything except binary files is stored on the GradeResponse item, which
 * the section's instructor group can read. Drawings are stored as strokes,
 * which are smaller than any image of them. Recordings and uploaded photos are
 * files in the student's private user-submissions folder; instructors open
 * them through getStudentSubmissionUrls, which checks the key belongs to the
 * grade's owner and that the caller teaches the section.
 */

import type { EncodedStrokes } from "./strokeLog";

export const RESPONSE_RECORD_VERSION = 1;

/** Stored `inputMethod` values. */
export const INPUT_METHOD = Object.freeze({
  text: "text",
  audio: "audio",
  drawing: "drawing",
  image: "image",
  choice: "choice",
} as const);

/** Reason stored when a grader returns nothing usable. */
export const GRADING_FAILED = "Grading failed";

export type InputMethod = (typeof INPUT_METHOD)[keyof typeof INPUT_METHOD];
export type Verdict = "correct" | "misspelled" | "incorrect" | "error";

/** A response record as buildResponse makes it. */
export interface ResponseRecord {
  v: number;
  inputMethod: InputMethod | string;
  prompt?: string;
  text?: string;
  audioPath?: string;
  transcript?: string;
  strokes?: EncodedStrokes | any;
  imagePath?: string;
  verdict?: Verdict;
  answer?: boolean;
  score?: number;
  confidence?: number;
  reason?: string;
  needsReview: boolean;
  submittedAt?: string;
  attempts?: number;
  strokeCount?: number;
  history?: ResponseRecord[];
  attemptId?: string;
}

export interface BuildResponseInput {
  inputMethod: InputMethod | string;
  prompt?: string | null;
  text?: string | null;
  audioPath?: string | null;
  transcript?: string | null;
  strokes?: unknown;
  imagePath?: string | null;
  /** The grader's result, in any of the shapes our graders return */
  result?: unknown;
  now?: number;
  attemptId?: string;
}

const MAX_TEXT = 5000;
const MAX_REASON = 1000;
const MAX_HISTORY = 3;

export function createResponseAttemptId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

const VERDICTS: readonly string[] = ["correct", "misspelled", "incorrect"];

const clip = (value: unknown, max: number): string | undefined => {
  if (value == null) return undefined;
  const s = String(value);
  return s.length > max ? s.slice(0, max) : s;
};

const asObject = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : null;

/** Map a grader result to a verdict. Accepts the shapes our graders return. */
export function verdictFromResult(result: unknown): Verdict | undefined {
  if (result == null) return undefined;
  if (typeof result === "string") return "error";
  const r = asObject(result);
  if (!r) return undefined;
  if (r.error) return "error";
  if (typeof r.verdict === "string" && VERDICTS.includes(r.verdict)) return r.verdict as Verdict;
  const ok = r.answer ?? r.correct;
  if (ok === true) return "correct";
  if (ok === false) return "incorrect";
  return undefined;
}

/**
 * Should a teacher look at this answer? True when the grader failed, the
 * answer was a near-miss spelling, a recording produced no transcript, the
 * grader's yes/no disagrees with its own score, or it reported low confidence.
 */
export function needsReview(record: Partial<ResponseRecord> | null | undefined): boolean {
  if (!record) return false;
  if (record.verdict === "error" || record.verdict === "misspelled") return true;
  if (record.inputMethod === "audio" && !String(record.transcript ?? "").trim()) return true;
  if (typeof record.confidence === "number" && record.confidence < 0.6) return true;
  if (typeof record.score === "number" && typeof record.answer === "boolean") {
    // Scores arrive as 0-100 or 0-1 depending on the grader.
    const pct = record.score <= 1 ? record.score * 100 : record.score;
    if (record.answer === true && pct < 50) return true;
    if (record.answer === false && pct >= 50) return true;
  }
  return false;
}

/**
 * Build a response record from the raw input and the grader result.
 * Undefined fields are left out so records stay small.
 */
export function buildResponse({
  inputMethod,
  prompt,
  text,
  audioPath,
  transcript,
  strokes,
  imagePath,
  result,
  attemptId,
  now = Date.now(),
}: BuildResponseInput): ResponseRecord {
  const r = asObject(result);
  const answer = r ? (r.answer ?? r.correct) : undefined;
  const score = r && typeof r.score === "number" ? r.score : undefined;
  const reason = typeof result === "string" ? result : r ? (r.reason ?? r.feedback ?? r.error) : undefined;
  const confidence = r && typeof r.confidence === "number" ? r.confidence : undefined;

  const record: ResponseRecord = {
    v: RESPONSE_RECORD_VERSION,
    inputMethod,
    prompt: clip(prompt, 500),
    text: clip(text, MAX_TEXT),
    audioPath: audioPath || undefined,
    transcript: clip(transcript, MAX_TEXT),
    strokes: strokes || undefined,
    imagePath: imagePath || undefined,
    verdict: verdictFromResult(result),
    answer: typeof answer === "boolean" ? answer : undefined,
    score,
    confidence,
    reason: clip(typeof reason === "string" ? reason : undefined, MAX_REASON),
    submittedAt: new Date(now).toISOString(),
    needsReview: false,
    attemptId,
  };
  const loose = record as unknown as Record<string, unknown>;
  for (const k of Object.keys(loose)) if (loose[k] === undefined) delete loose[k];
  record.needsReview = needsReview(record);
  return record;
}

function forHistory(record: ResponseRecord): ResponseRecord {
  const { history, strokes, ...rest } = record;
  return strokes ? { ...rest, strokeCount: strokes.strokes?.length ?? 0 } : rest;
}

/**
 * Return a new responses map with `record` stored under `key`. An earlier
 * answer for the same key moves into `history` (newest first, max 3, without
 * stroke data, to keep items small). Fields the new record does not set (for
 * example the audio path saved before the transcript arrived) are carried
 * over from the same attempt when `sameAttempt` is true.
 */
export function addResponse(
  responses: Record<string, ResponseRecord> | null | undefined,
  key: string | number,
  record: ResponseRecord,
  {
    sameAttempt = false,
    attemptId,
  }: { sameAttempt?: boolean; attemptId?: string } = {},
): Record<string, ResponseRecord> {
  const prev = responses?.[key];
  if (prev && sameAttempt && attemptId && prev.attemptId !== attemptId) {
    return { ...(responses || {}) };
  }
  if (prev && sameAttempt) {
    const merged: ResponseRecord = { ...prev, ...record, attempts: prev.attempts || 1 };
    if (prev.history) merged.history = prev.history;
    merged.needsReview = needsReview(merged);
    return { ...(responses || {}), [key]: merged };
  }
  const history = prev ? [forHistory(prev), ...(prev.history || [])].slice(0, MAX_HISTORY) : [];
  const next: ResponseRecord = { ...record, attempts: (prev?.attempts || 0) + 1 };
  if (history.length) next.history = history;
  return { ...(responses || {}), [key]: next };
}

/** True for records written by buildResponse (any version). */
export function isResponseRecord(value: unknown): value is ResponseRecord {
  const v = asObject(value);
  return !!v && typeof v.v === "number" && typeof v.inputMethod === "string";
}

export interface BlockResponse {
  key: string;
  record: ResponseRecord;
  legacy: boolean;
}

/**
 * Every answer stored in one block's grade data, in display order, as
 * response records. Reads the shapes still in the database: a `responses`
 * map, quiz attemptedAnswers/correctAnswers, per-question verdict maps
 * (`results`, or the vocabulary `feedback` map), CustomAnswer/CustomAI
 * `userResponse` or `userAnswer`, and per-question audio keys
 * (`custom-answer-{id}` / `custom-ai-{id}`) that hold audioFilePath + transcript.
 */
export function listBlockResponses(blockData: unknown): BlockResponse[] {
  const block = asObject(blockData);
  if (!block) return [];
  const out: BlockResponse[] = [];

  const responses = asObject(block.responses);
  if (responses) {
    for (const [key, value] of Object.entries(responses)) {
      const v = asObject(value);
      if (isResponseRecord(value)) {
        out.push({ key, record: value, legacy: false });
      } else if (v && "selected" in v) {
        out.push({
          key,
          legacy: true,
          record: buildLegacy({
            inputMethod: INPUT_METHOD.choice,
            text: v.selected,
            answer: typeof v.correct === "boolean" ? v.correct : undefined,
          }),
        });
      }
    }
    if (out.length) return out;
  }

  const attempted = asObject(block.attemptedAnswers);
  if (attempted) {
    const correct = asObject(block.correctAnswers) || {};
    for (const [key, value] of Object.entries(attempted)) {
      out.push({
        key,
        legacy: true,
        record: buildLegacy({ inputMethod: INPUT_METHOD.choice, text: value, answer: key in correct }),
      });
    }
    return out;
  }

  // Per-question verdicts kept in block data: `results` (CustomAnswer and
  // CustomAI since GradeResponse) or the AnswerComponent `feedback` map.
  const verdictMap =
    asObject(block.results) ??
    (block.feedback && typeof block.feedback === "object" && !Array.isArray(block.feedback)
      ? asObject(block.feedback)
      : null);
  if (verdictMap) {
    const firstText = typeof block.userResponse === "string" ? block.userResponse : undefined;
    Object.entries(verdictMap).forEach(([key, value], index) => {
      const v = asObject(value);
      if (!v) return;
      const answer = v.answer ?? v.correct;
      out.push({
        key,
        legacy: true,
        record: buildLegacy({
          inputMethod: INPUT_METHOD.text,
          text: index === 0 ? firstText : undefined,
          answer: typeof answer === "boolean" ? answer : undefined,
          reason:
            typeof v.reason === "string" ? v.reason : typeof v.feedback === "string" ? v.feedback : undefined,
        }),
      });
    });
    if (out.length) return out;
  }

  if (block.audioFilePath || block.transcript) {
    out.push({
      key: "audio",
      legacy: true,
      record: buildLegacy({
        inputMethod: INPUT_METHOD.audio,
        audioPath: typeof block.audioFilePath === "string" ? block.audioFilePath : undefined,
        transcript: typeof block.transcript === "string" ? block.transcript : undefined,
      }),
    });
    return out;
  }

  const legacyText = block.userAnswer ?? block.userResponse;
  if (typeof legacyText === "string" && legacyText.trim()) {
    out.push({
      key: "answer",
      legacy: true,
      record: buildLegacy({
        inputMethod: INPUT_METHOD.text,
        text: legacyText,
        reason: typeof block.feedback === "string" ? block.feedback : undefined,
      }),
    });
  }
  return out;
}

function buildLegacy({
  inputMethod,
  text,
  audioPath,
  transcript,
  answer,
  reason,
}: {
  inputMethod: InputMethod;
  text?: unknown;
  audioPath?: string;
  transcript?: string;
  answer?: boolean;
  reason?: string;
}): ResponseRecord {
  const record = buildResponse({
    inputMethod,
    text: text == null ? undefined : String(text),
    audioPath,
    transcript,
    result: typeof answer === "boolean" ? { answer, reason } : reason ? { reason } : undefined,
    now: 0,
  });
  delete record.submittedAt;
  // Old records never stored a transcript check, so don't flag them for that.
  if (inputMethod === INPUT_METHOD.audio && !transcript) record.needsReview = false;
  return record;
}

/** S3 keys a viewer needs signed URLs for. */
export function submissionKeysFor(records: ReadonlyArray<unknown> | null | undefined): string[] {
  const keys = new Set<string>();
  for (const r of records || []) {
    const wrapper = asObject(r);
    const rec = asObject(wrapper && "record" in wrapper ? wrapper.record : r);
    if (typeof rec?.audioPath === "string" && rec.audioPath) keys.add(rec.audioPath);
    if (typeof rec?.imagePath === "string" && rec.imagePath) keys.add(rec.imagePath);
  }
  return [...keys];
}
