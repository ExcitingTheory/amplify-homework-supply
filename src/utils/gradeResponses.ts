/**
 * GradeResponse items: one typed DynamoDB item per answer.
 *
 * Components build response records with buildResponse/addResponse
 * (studentResponses.ts). This module maps those records to and from the
 * GradeResponse model (amplify/data/resource.ts) and writes them. Recordings
 * and photos stay in S3; their keys are stored here.
 */

import type { InputMethod, ResponseRecord, Verdict } from "./studentResponses";
import type { EncodedStrokes } from "./strokeLog";

type InputEnum = "TEXT" | "AUDIO" | "DRAWING" | "IMAGE" | "CHOICE";
type VerdictEnum = "CORRECT" | "MISSPELLED" | "INCORRECT" | "ERROR";

const INPUT_TO_ENUM: Record<InputMethod, InputEnum> = {
  text: "TEXT",
  audio: "AUDIO",
  drawing: "DRAWING",
  image: "IMAGE",
  choice: "CHOICE",
};
const VERDICT_TO_ENUM: Record<Verdict, VerdictEnum> = {
  correct: "CORRECT",
  misspelled: "MISSPELLED",
  incorrect: "INCORRECT",
  error: "ERROR",
};
const ENUM_TO_INPUT = Object.fromEntries(
  Object.entries(INPUT_TO_ENUM).map(([k, v]) => [v, k]),
) as Record<InputEnum, InputMethod>;
const ENUM_TO_VERDICT = Object.fromEntries(
  Object.entries(VERDICT_TO_ENUM).map(([k, v]) => [v, k]),
) as Record<VerdictEnum, Verdict>;

const inputEnum = (m: string | undefined): InputEnum | undefined =>
  m ? INPUT_TO_ENUM[m as InputMethod] : undefined;
const verdictEnum = (v: string | undefined): VerdictEnum | null =>
  (v && VERDICT_TO_ENUM[v as Verdict]) || null;

/** The grade fields a GradeResponse copies. */
export interface GradeLike {
  id: string;
  unitID?: string | null;
  sectionID?: string | null;
  instructorGroup?: string | null;
}

/** An earlier attempt, as the ResponseAttempt type stores it. */
export interface ResponseAttemptInput {
  inputMethod: InputEnum | null;
  text: string | null;
  transcript: string | null;
  audioPath: string | null;
  imagePath: string | null;
  strokeCount: number | null;
  verdict: VerdictEnum | null;
  correct: boolean | null;
  score: number | null;
  reason: string | null;
  needsReview: boolean | null;
  submittedAt: string | null;
}

/** Input for client.models.GradeResponse.create / update (without id). */
export interface GradeResponseInput {
  gradeID: string;
  blockKey: string;
  questionKey: string;
  unitID: string | null;
  sectionID: string | null;
  instructorGroup: string | null;
  inputMethod: InputEnum;
  prompt: string | null;
  text: string | null;
  transcript: string | null;
  audioPath: string | null;
  imagePath: string | null;
  strokes: EncodedStrokes | null;
  verdict: VerdictEnum | null;
  correct: boolean | null;
  score: number | null;
  confidence: number | null;
  reason: string | null;
  needsReview: boolean;
  attempts: number;
  history: ResponseAttemptInput[];
  submittedAt: string | null;
}

/**
 * The Amplify Data client, or anything with the same GradeResponse methods
 * (tests pass a stub). Kept structural so this module does not depend on the
 * generated schema types.
 */
type ModelResult = { data?: any; nextToken?: string | null; errors?: Array<{ message?: string; errorType?: string }> };
export interface GradeResponseClient {
  models: {
    GradeResponse: {
      create?(input: Record<string, unknown>): Promise<ModelResult>;
      update?(input: Record<string, unknown>): Promise<ModelResult>;
      get?(key: { id: string }): Promise<ModelResult>;
      list?(options: Record<string, unknown>): Promise<ModelResult>;
      listGradeResponseByGradeIDAndBlockKey?(
        key: { gradeID: string },
        options?: Record<string, unknown>,
      ): Promise<ModelResult>;
    };
  };
}

/** One item per grade, block and question, so a re-answer updates in place. */
export function gradeResponseId(gradeId: string, blockKey: string | number, questionKey: string | number): string {
  return `${gradeId}:${blockKey}:${questionKey}`;
}

/** The section's instructor group (see groupManager.getInstructorGroupName). */
export function instructorGroupFor(grade: Partial<GradeLike> | null | undefined): string | null {
  if (grade?.instructorGroup) return grade.instructorGroup;
  return grade?.sectionID ? `section-${grade.sectionID}-instructors` : null;
}

const orNull = <T>(v: T | undefined): T | null => (v === undefined ? null : v);

function attemptToInput(h: ResponseRecord): ResponseAttemptInput {
  return {
    inputMethod: inputEnum(h.inputMethod) ?? null,
    text: orNull(h.text),
    transcript: orNull(h.transcript),
    audioPath: orNull(h.audioPath),
    imagePath: orNull(h.imagePath),
    strokeCount: orNull(h.strokeCount),
    verdict: verdictEnum(h.verdict),
    correct: orNull(h.answer),
    score: orNull(h.score),
    reason: orNull(h.reason),
    needsReview: orNull(h.needsReview),
    submittedAt: orNull(h.submittedAt),
  };
}

/**
 * Model input for a response record. Every field is sent (null when unset) so
 * an update for a new attempt clears fields the previous attempt had, such as
 * an audio path when the new answer was typed.
 */
export function toGradeResponseInput(
  record: ResponseRecord,
  { grade, blockKey, questionKey }: { grade: GradeLike; blockKey: string | number; questionKey: string | number },
): GradeResponseInput {
  return {
    gradeID: grade.id,
    blockKey: String(blockKey),
    questionKey: String(questionKey),
    unitID: orNull(grade.unitID ?? undefined),
    sectionID: orNull(grade.sectionID ?? undefined),
    instructorGroup: instructorGroupFor(grade),
    inputMethod: inputEnum(record.inputMethod) ?? "TEXT",
    prompt: orNull(record.prompt),
    text: orNull(record.text),
    transcript: orNull(record.transcript),
    audioPath: orNull(record.audioPath),
    imagePath: orNull(record.imagePath),
    strokes: orNull(record.strokes as EncodedStrokes | undefined),
    verdict: verdictEnum(record.verdict),
    correct: orNull(record.answer),
    score: orNull(record.score),
    confidence: orNull(record.confidence),
    reason: orNull(record.reason),
    needsReview: !!record.needsReview,
    attempts: record.attempts ?? 1,
    history: (record.history || []).map(attemptToInput),
    submittedAt: orNull(record.submittedAt),
  };
}

function dropNulls<T extends Record<string, unknown>>(o: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [k, v] of Object.entries(o)) if (v !== null && v !== undefined) out[k as keyof T] = v as T[keyof T];
  return out;
}

/** Response record (as buildResponse makes it) from a GradeResponse item. */
export function fromGradeResponse(item: Record<string, any> | null | undefined): ResponseRecord | null {
  if (!item) return null;
  const record = {
    ...dropNulls({
      prompt: item.prompt,
      text: item.text,
      transcript: item.transcript,
      audioPath: item.audioPath,
      imagePath: item.imagePath,
      strokes: item.strokes,
      verdict: ENUM_TO_VERDICT[item.verdict as VerdictEnum],
      answer: item.correct,
      score: item.score,
      confidence: item.confidence,
      reason: item.reason,
      submittedAt: item.submittedAt,
    }),
    v: 1,
    inputMethod: ENUM_TO_INPUT[item.inputMethod as InputEnum] ?? "text",
    needsReview: !!item.needsReview,
    attempts: item.attempts ?? 1,
  } as ResponseRecord;
  const history = ((item.history || []) as Array<Record<string, any> | null>)
    .filter((h): h is Record<string, any> => !!h)
    .map(
      (h) =>
        ({
          ...dropNulls({
            text: h.text,
            transcript: h.transcript,
            audioPath: h.audioPath,
            imagePath: h.imagePath,
            strokeCount: h.strokeCount,
            verdict: ENUM_TO_VERDICT[h.verdict as VerdictEnum],
            answer: h.correct,
            score: h.score,
            reason: h.reason,
            needsReview: h.needsReview,
            submittedAt: h.submittedAt,
          }),
          v: 1,
          inputMethod: ENUM_TO_INPUT[h.inputMethod as InputEnum] ?? "text",
        }) as ResponseRecord,
    );
  if (history.length) record.history = history;
  return record;
}

const isConditionalFailure = (errors: ModelResult["errors"]) =>
  (errors || []).some((e) => /ConditionalCheckFailed/i.test(`${e?.errorType ?? ""} ${e?.message ?? ""}`));

/**
 * Create or update the item. `exists` picks the first try; a conditional-check
 * failure (item already there, or missing) falls back to the other operation.
 * Returns true once the item is written; throws otherwise.
 */
export async function saveGradeResponse(
  client: GradeResponseClient,
  { id, input, exists }: { id: string; input: GradeResponseInput | Record<string, unknown>; exists: boolean },
): Promise<boolean> {
  const model = client.models.GradeResponse;
  if (!model.create || !model.update) throw new Error("GradeResponse model is not available");
  const create = model.create.bind(model);
  const update = model.update.bind(model);
  const [first, second] = exists ? [update, create] : [create, update];
  const firstResult = await first({ id, ...input });
  if (!firstResult?.errors?.length) return true;
  if (!isConditionalFailure(firstResult.errors)) {
    throw new Error(firstResult.errors[0]?.message || "Saving response failed");
  }
  const secondResult = await second({ id, ...input });
  if (secondResult?.errors?.length) {
    throw new Error(secondResult.errors[0]?.message || "Saving response failed");
  }
  return true;
}

/**
 * Every GradeResponse of one grade (all blocks), ordered by block key.
 * Uses the byGrade index; falls back to a filtered list if the generated
 * client predates the index.
 */
export async function listGradeResponses(client: GradeResponseClient, gradeId: string): Promise<any[]> {
  const model = client.models.GradeResponse;
  const items: any[] = [];
  let nextToken: string | null = null;
  do {
    const page: ModelResult = model.listGradeResponseByGradeIDAndBlockKey
      ? await model.listGradeResponseByGradeIDAndBlockKey({ gradeID: gradeId }, { nextToken, limit: 200 })
      : model.list
        ? await model.list({ filter: { gradeID: { eq: gradeId } }, nextToken, limit: 200 })
        : { data: [] };
    if (page?.errors?.length) throw new Error(page.errors[0]?.message || "Listing responses failed");
    items.push(...((page?.data as unknown[]) || []).filter(Boolean));
    nextToken = page?.nextToken ?? null;
  } while (nextToken);
  return items;
}
