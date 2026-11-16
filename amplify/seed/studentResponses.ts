/**
 * Seeded student answers: GradeResponse items plus the grade block data that
 * goes with them, built the same way the app builds them.
 *
 * Each scenario is a list of steps a student took (typed an answer, recorded
 * one, drew one, retried after a failure). replayAnswerSteps() turns the steps
 * into response records with buildResponse/addResponse, exactly as the answer
 * components do, and seedGradeResponses() uploads the recordings to the
 * student's private user-submissions folder and writes one GradeResponse per
 * question with toGradeResponseInput. Grader results use the shapes the real
 * graders return (gradeVocabularyWord, transcribeAudio, verifySketchImage,
 * /api/grade-ai), so needsReview comes out the way it would in production.
 *
 * Assets live in test/mocks/student-responses (see its README):
 *  - recordings encoded like the app records speech (16 kbps Opus WebM, or
 *    24 kbps AAC MP4 for Safari), from scripts/seed/generate-response-audio.mjs
 *  - KanjiVG stroke paths for ありがとう, drawn by ./handwriting.ts
 */

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  addResponse,
  buildResponse,
  INPUT_METHOD,
  type ResponseRecord,
} from "../../src/utils/studentResponses";
import {
  gradeResponseId,
  toGradeResponseInput,
  type GradeLike,
} from "../../src/utils/gradeResponses";
import { synthesizeHandwriting, type GlyphPaths } from "./handwriting";

/** Block keys used in the seeded grades' data and GradeResponse items. */
export const VOCAB_BLOCK_KEY = "vocab-recall-1";
export const AI_BLOCK_KEY = "custom-ai-1";

/**
 * What test/mocks/student-responses/biology-chloroplast-answer.webm says.
 * It is a re-encode of test/mocks/biology-spoken-answer.wav; keep in sync
 * with ANSWER in scripts/demos/generate-spoken-answer.mjs.
 */
export const BIOLOGY_SPOKEN_ANSWER =
  "Chloroplasts are the organelles in plant cells where photosynthesis takes place. " +
  "They contain chlorophyll, a green pigment that absorbs light energy from the sun. " +
  "That energy is used to convert carbon dioxide and water into glucose, " +
  "releasing oxygen as a by-product.";

const CONTENT_TYPES: Record<string, string> = {
  webm: "audio/webm",
  m4a: "audio/mp4",
};

export interface SeedWord {
  id: string;
  phrase: string;
  definition: string;
}

export interface SeedQuestion {
  id: string;
  prompt: string;
}

type ResponseInput = Omit<Parameters<typeof buildResponse>[0], "now" | "audioPath">;

/** One thing the student did, in order. */
export interface AnswerStep {
  questionKey: string;
  /** Minutes after the student started the unit */
  atMinute: number;
  /**
   * A recording saved before this step (AudioWaveformPlayer uploads it, then
   * the component records the path). `nodeKey` is the folder the app uses.
   */
  audio?: { asset: string; nodeKey: string };
  /** Adds to the current attempt (the transcript after the recording) */
  sameAttempt?: boolean;
  record: ResponseInput;
}

export interface Scenario {
  blockKey: string;
  steps: AnswerStep[];
  /** What the component saves in grade.data[blockKey] for these answers */
  blockData: Record<string, unknown>;
}

/** The S3 key uploadStudentSubmission would use for this recording. */
export function submissionPath(
  identityId: string,
  gradeId: string,
  nodeKey: string,
  at: number,
  asset: string,
) {
  const ext = asset.split(".").pop();
  return `private/${identityId}/user-submissions/${gradeId}/${nodeKey}/${gradeId}_${nodeKey}_${at}.${ext}`;
}

/**
 * Turn steps into one response record per question, the way the answer
 * components do: each step is a buildResponse record added with addResponse.
 * `audioPaths[i]` is the uploaded key for step i's recording.
 */
export function replayAnswerSteps(
  steps: AnswerStep[],
  { startedAt, audioPaths = {} }: { startedAt: number; audioPaths?: Record<number, string> },
): Record<string, ResponseRecord> {
  let responses: Record<string, ResponseRecord> = {};
  steps.forEach((step, i) => {
    const record = buildResponse({
      ...step.record,
      ...(audioPaths[i] ? { audioPath: audioPaths[i] } : {}),
      now: startedAt + step.atMinute * 60_000,
    });
    responses = addResponse(responses, step.questionKey, record, {
      sameAttempt: step.sameAttempt,
    });
  });
  return responses;
}

// ---------------------------------------------------------------------------
// Scenarios
// ---------------------------------------------------------------------------

/**
 * Word recall for the Japanese unit's vocabulary block: the definition is
 * shown and the student gives the word (typed, spoken or handwritten).
 * Question keys are the word's index, as AnswerComponent keys them.
 *
 *  - "strong": all three right; ありがとう drawn in the correct stroke order.
 *  - "struggling": こんにちわ (a near-miss spelling), ありがとう drawn with あ's
 *    first two strokes swapped and と's second stroke backwards (the image
 *    grader still accepts it), and the casual さよなら, which the grader
 *    rejects with a middling score (flagged for review).
 *  - "silent": two typed answers (one misspelled) and a recording with no
 *    speech in it (empty transcript, flagged for review).
 */
export function japaneseVocabScenario(
  kind: "strong" | "struggling" | "silent",
  words: SeedWord[],
  glyphs: GlyphPaths[],
  startedAt: number,
): Scenario {
  const [hello, thanks, goodbye] = words;
  const audioKey = (word: SeedWord) => `${VOCAB_BLOCK_KEY}-${word.id}`;
  const vocab = (studentWord: string, word: SeedWord) =>
    studentWord === word.phrase
      ? { answer: true, verdict: "correct", score: 100, reason: `Correct: ${word.phrase}.` }
      : null;
  const steps: AnswerStep[] = [];
  const results: Record<string, any> = {};

  if (kind === "strong") {
    results["0"] = vocab(hello.phrase, hello);
    steps.push({ questionKey: "0", atMinute: 1, record: { inputMethod: INPUT_METHOD.text, prompt: hello.definition, text: hello.phrase, result: results["0"] } });

    const drawing = synthesizeHandwriting(glyphs, { seed: 11, startedAt: startedAt + 2 * 60_000 });
    results["1"] = { answer: true, reason: "The drawing clearly shows ありがとう.", accuracy: 94 };
    steps.push({ questionKey: "1", atMinute: 3, record: { inputMethod: INPUT_METHOD.drawing, prompt: thanks.definition, strokes: drawing.strokes, result: results["1"] } });

    results["2"] = { answer: true, reason: "That matches さようなら.", transcript: "さようなら", score: 96 };
    steps.push(
      { questionKey: "2", atMinute: 4, audio: { asset: "sayonara-chrome.webm", nodeKey: audioKey(goodbye) }, record: { inputMethod: INPUT_METHOD.audio, prompt: goodbye.definition } },
      { questionKey: "2", atMinute: 4, sameAttempt: true, record: { inputMethod: INPUT_METHOD.audio, prompt: goodbye.definition, transcript: "さようなら", result: results["2"] } },
    );
  }

  if (kind === "struggling") {
    results["0"] = {
      answer: false,
      verdict: "misspelled",
      score: 0,
      reason: "Close: it is spelled こんにちは. The last character is は, read as \"wa\" here.",
    };
    steps.push({ questionKey: "0", atMinute: 2, record: { inputMethod: INPUT_METHOD.text, prompt: hello.definition, text: "こんにちわ", result: results["0"] } });

    const drawing = synthesizeHandwriting(glyphs, {
      seed: 23,
      startedAt: startedAt + 3 * 60_000,
      order: { 0: [1, 0, 2] }, // あ: vertical stroke before the horizontal one
      reversed: ["3:1"], // と: the long curve drawn from the bottom up
      speed: 260,
      tremor: 0.6,
    });
    results["1"] = { answer: true, reason: "Readable ありがとう.", accuracy: 81 };
    steps.push({ questionKey: "1", atMinute: 5, record: { inputMethod: INPUT_METHOD.drawing, prompt: thanks.definition, strokes: drawing.strokes, result: results["1"] } });

    results["2"] = {
      answer: false,
      reason: "さよなら is the casual form; the word on this card is さようなら.",
      transcript: "さよなら",
      score: 60,
    };
    steps.push(
      { questionKey: "2", atMinute: 7, audio: { asset: "sayonara-casual-safari.m4a", nodeKey: audioKey(goodbye) }, record: { inputMethod: INPUT_METHOD.audio, prompt: goodbye.definition } },
      { questionKey: "2", atMinute: 7, sameAttempt: true, record: { inputMethod: INPUT_METHOD.audio, prompt: goodbye.definition, transcript: "さよなら", result: results["2"] } },
    );
  }

  if (kind === "silent") {
    results["0"] = vocab(hello.phrase, hello);
    steps.push({ questionKey: "0", atMinute: 3, record: { inputMethod: INPUT_METHOD.text, prompt: hello.definition, text: hello.phrase, result: results["0"] } });

    results["1"] = {
      answer: false,
      verdict: "misspelled",
      score: 0,
      reason: "Close: it is spelled ありがとう, with う at the end.",
    };
    steps.push({ questionKey: "1", atMinute: 6, record: { inputMethod: INPUT_METHOD.text, prompt: thanks.definition, text: "ありがと", result: results["1"] } });

    results["2"] = { answer: false, reason: "We couldn't hear an answer in the recording.", transcript: "", score: 0 };
    steps.push(
      { questionKey: "2", atMinute: 9, audio: { asset: "quiet-room.webm", nodeKey: audioKey(goodbye) }, record: { inputMethod: INPUT_METHOD.audio, prompt: goodbye.definition } },
      { questionKey: "2", atMinute: 9, sameAttempt: true, record: { inputMethod: INPUT_METHOD.audio, prompt: goodbye.definition, transcript: "", result: results["2"] } },
    );
  }

  const correctCount = Object.values(results).filter((r) => r?.answer === true).length;
  return {
    blockKey: VOCAB_BLOCK_KEY,
    steps,
    // AnswerComponent's block data
    blockData: {
      complete: true,
      accuracy: Math.floor((correctCount / words.length) * 100),
      totalWords: words.length,
      correctCount,
      answeredCount: words.length,
      feedback: results,
    },
  };
}

/**
 * The AI biology exercise (custom-ai, text and audio). The typed answer is
 * graded straight away; the first recording fails to transcribe (a timeout),
 * so the student records again and that attempt is graded. The failed one
 * stays in the item's history.
 */
export function biologyAIScenario(
  [mainProduct, organelle]: SeedQuestion[],
  startedAt: number,
): Scenario {
  const audioKey = `custom-ai-${organelle.id}`;
  const typed = { correct: true, score: 92, feedback: "Correct: glucose, with oxygen released as a by-product." };
  const spoken = { correct: true, score: 95, feedback: "Correct: chloroplasts, with a clear account of what happens inside them." };
  const steps: AnswerStep[] = [
    { questionKey: mainProduct.id, atMinute: 2, record: { inputMethod: INPUT_METHOD.text, prompt: mainProduct.prompt, text: "Glucose and oxygen", result: typed } },
    { questionKey: organelle.id, atMinute: 4, audio: { asset: "biology-first-try.webm", nodeKey: audioKey }, record: { inputMethod: INPUT_METHOD.audio, prompt: organelle.prompt } },
    { questionKey: organelle.id, atMinute: 4, sameAttempt: true, record: { inputMethod: INPUT_METHOD.audio, prompt: organelle.prompt, result: { error: "Transcription failed: the request timed out" } } },
    { questionKey: organelle.id, atMinute: 6, audio: { asset: "biology-chloroplast-answer.webm", nodeKey: audioKey }, record: { inputMethod: INPUT_METHOD.audio, prompt: organelle.prompt } },
    { questionKey: organelle.id, atMinute: 6, sameAttempt: true, record: { inputMethod: INPUT_METHOD.audio, prompt: organelle.prompt, transcript: BIOLOGY_SPOKEN_ANSWER, result: spoken } },
  ];
  const avg = (typed.score + spoken.score) / 2;
  return {
    blockKey: AI_BLOCK_KEY,
    steps,
    // CustomAIComponent's block data
    blockData: {
      complete: true,
      userResponse: "Glucose and oxygen",
      feedback: typed.feedback,
      accuracy: avg / 100,
      score: avg,
      results: {
        [mainProduct.id]: { answer: true, score: typed.score, reason: typed.feedback },
        [organelle.id]: { answer: true, score: spoken.score, reason: spoken.feedback },
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Writing
// ---------------------------------------------------------------------------

export interface SeedResponsesContext {
  /** Amplify data client, signed in as the student who owns the grade */
  client: any;
  /** aws-amplify/storage uploadData */
  uploadData: (input: { path: string; data: any; options?: { contentType?: string } }) => { result: Promise<unknown> };
  /** The student's Cognito identity ID (private/{identityId}/...) */
  identityId: string;
  /** Folder holding the recordings (test/mocks/student-responses) */
  assetsDir: string;
}

/**
 * Upload a scenario's recordings and write its GradeResponse items.
 * Must run while signed in as the grade's owner. Returns the items written.
 */
export async function seedGradeResponses(
  ctx: SeedResponsesContext,
  grade: GradeLike,
  scenario: Scenario,
  startedAt: number,
): Promise<number> {
  const audioPaths: Record<number, string> = {};
  for (const [i, step] of scenario.steps.entries()) {
    if (!step.audio) continue;
    const at = startedAt + step.atMinute * 60_000;
    const path = submissionPath(ctx.identityId, grade.id, step.audio.nodeKey, at, step.audio.asset);
    const data = await readFile(resolve(ctx.assetsDir, step.audio.asset));
    const ext = step.audio.asset.split(".").pop() || "";
    await ctx.uploadData({
      path,
      data,
      options: { contentType: CONTENT_TYPES[ext] ?? "application/octet-stream" },
    }).result;
    audioPaths[i] = path;
  }

  const records = replayAnswerSteps(scenario.steps, { startedAt, audioPaths });
  let written = 0;
  for (const [questionKey, record] of Object.entries(records)) {
    const { errors } = await ctx.client.models.GradeResponse.create({
      id: gradeResponseId(grade.id, scenario.blockKey, questionKey),
      ...toGradeResponseInput(record, { grade, blockKey: scenario.blockKey, questionKey }),
    });
    if (errors?.length) {
      throw new Error(`GradeResponse ${questionKey}: ${errors[0]?.message ?? "create failed"}`);
    }
    written++;
  }
  return written;
}
