export const MIN_RESPONSE_WINDOW_MS = 2500;
export const MAX_RESPONSE_WINDOW_MS = 8000;
export const DEFAULT_SILENCE_END_MS = 700;
export const SPEECH_RMS_THRESHOLD = 0.025;
export const MAX_POST_ROLL_MS = 500;

const WORDS_PER_SECOND = 2.5;
const MIN_SPOKEN_DURATION_MS = 400;

/** Estimates how long the answer takes to speak at a language-lesson pace. */
export function estimateSpokenDurationMs(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(
    MIN_SPOKEN_DURATION_MS,
    Math.round((words / WORDS_PER_SECOND) * 1000),
  );
}

/**
 * responseWindow = clamp(1.5 x answerDuration + 1 s, 2.5 s, 8 s). The minimum
 * speech time stays at the lower clamp so a learner is never cut off early.
 */
export function computeResponseWindow(expected: string): {
  minMs: number;
  maxMs: number;
  silenceEndMs: number;
} {
  const windowMs = 1.5 * estimateSpokenDurationMs(expected) + 1000;
  return {
    minMs: MIN_RESPONSE_WINDOW_MS,
    maxMs: Math.round(
      Math.min(
        MAX_RESPONSE_WINDOW_MS,
        Math.max(MIN_RESPONSE_WINDOW_MS, windowMs),
      ),
    ),
    silenceEndMs: DEFAULT_SILENCE_END_MS,
  };
}

export interface ResponseWindowTimings {
  minMs: number;
  maxMs: number;
  silenceEndMs: number;
}

export interface ResponseWindowState {
  startedAt: number;
  lastSpeechAt: number;
  heardSpeech: boolean;
  postRollStartedAt: number | null;
}

export type ResponseFrameDecision = "continue" | "finish";

export function createResponseWindowState(
  startedAt: number,
): ResponseWindowState {
  return {
    startedAt,
    lastSpeechAt: startedAt,
    heardSpeech: false,
    postRollStartedAt: null,
  };
}

/**
 * Evaluates one analyser frame. The window ends after post-speech silence or
 * at maxMs; speech still in progress at maxMs gets at most MAX_POST_ROLL_MS
 * more before the take is stopped.
 */
export function evaluateResponseFrame(
  state: ResponseWindowState,
  timings: ResponseWindowTimings,
  rms: number,
  now: number,
): { decision: ResponseFrameDecision; state: ResponseWindowState } {
  const speaking = rms >= SPEECH_RMS_THRESHOLD;
  const next: ResponseWindowState = speaking
    ? { ...state, heardSpeech: true, lastSpeechAt: now }
    : state;
  const elapsed = now - next.startedAt;

  if (elapsed >= timings.maxMs) {
    if (!speaking) return { decision: "finish", state: next };
    const postRollStartedAt = next.postRollStartedAt ?? now;
    const withPostRoll = { ...next, postRollStartedAt };
    return {
      decision:
        now - postRollStartedAt >= MAX_POST_ROLL_MS ? "finish" : "continue",
      state: withPostRoll,
    };
  }

  if (
    !speaking &&
    next.heardSpeech &&
    elapsed >= timings.minMs &&
    now - next.lastSpeechAt >= timings.silenceEndMs
  ) {
    return { decision: "finish", state: next };
  }
  return { decision: "continue", state: next };
}
