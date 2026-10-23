import { describe, expect, it } from "vitest";
import {
  MAX_POST_ROLL_MS,
  SPEECH_RMS_THRESHOLD,
  computeResponseWindow,
  createResponseWindowState,
  estimateSpokenDurationMs,
  evaluateResponseFrame,
} from "../../src/utils/callResponse/responseWindow";
import {
  ROOM_TONE_DBFS,
  dbfsToGain,
  generatePinkNoise,
} from "../../src/utils/callResponse/roomTone";
import {
  cueAccuracy,
  isCueComplete,
  summarizeBlockGrade,
  summarizeSlideBlocks,
} from "../../src/utils/callResponse/gradeCues";

const SPEECH = SPEECH_RMS_THRESHOLD * 4;
const timings = { minMs: 2500, maxMs: 6000, silenceEndMs: 700 };

describe("computeResponseWindow", () => {
  it("clamps short answers to 2.5 s and long answers to 8 s", () => {
    expect(computeResponseWindow("I").maxMs).toBe(2500);
    expect(computeResponseWindow(Array(60).fill("word").join(" ")).maxMs).toBe(
      8000,
    );
  });

  it("applies 1.5 x spoken duration + 1 s between the clamps", () => {
    const answer = "Kether and Binah and Chokmah and Geburah";
    const duration = estimateSpokenDurationMs(answer);
    const expected = Math.round(1.5 * duration + 1000);
    expect(expected).toBeGreaterThan(2500);
    expect(expected).toBeLessThan(8000);
    expect(computeResponseWindow(answer)).toEqual({
      minMs: 2500,
      maxMs: expected,
      silenceEndMs: 700,
    });
  });
});

describe("evaluateResponseFrame", () => {
  it("keeps waiting when no speech arrives until maxMs", () => {
    let state = createResponseWindowState(0);
    for (const now of [500, 3000, 5900]) {
      const frame = evaluateResponseFrame(state, timings, 0, now);
      expect(frame.decision).toBe("continue");
      state = frame.state;
    }
    expect(evaluateResponseFrame(state, timings, 0, 6000).decision).toBe(
      "finish",
    );
  });

  it("finishes after post-speech silence once the minimum has elapsed", () => {
    let state = createResponseWindowState(0);
    state = evaluateResponseFrame(state, timings, SPEECH, 2000).state;
    state = evaluateResponseFrame(state, timings, SPEECH, 3000).state;
    expect(evaluateResponseFrame(state, timings, 0, 3500).decision).toBe(
      "continue",
    );
    expect(evaluateResponseFrame(state, timings, 0, 3700).decision).toBe(
      "finish",
    );
  });

  it("does not finish on silence before the minimum response time", () => {
    let state = createResponseWindowState(0);
    state = evaluateResponseFrame(state, timings, SPEECH, 200).state;
    expect(evaluateResponseFrame(state, timings, 0, 1500).decision).toBe(
      "continue",
    );
  });

  it("allows at most 500 ms of post-roll while speech continues at maxMs", () => {
    let state = createResponseWindowState(0);
    let frame = evaluateResponseFrame(state, timings, SPEECH, 6000);
    expect(frame.decision).toBe("continue");
    state = frame.state;
    frame = evaluateResponseFrame(state, timings, SPEECH, 6000 + MAX_POST_ROLL_MS - 1);
    expect(frame.decision).toBe("continue");
    state = frame.state;
    expect(
      evaluateResponseFrame(state, timings, SPEECH, 6000 + MAX_POST_ROLL_MS)
        .decision,
    ).toBe("finish");
  });

  it("stops the post-roll as soon as speech ends", () => {
    let state = createResponseWindowState(0);
    state = evaluateResponseFrame(state, timings, SPEECH, 6100).state;
    expect(evaluateResponseFrame(state, timings, 0, 6200).decision).toBe(
      "finish",
    );
  });
});

describe("room tone", () => {
  it("converts -50 dBFS to a linear gain of about 0.00316", () => {
    expect(ROOM_TONE_DBFS).toBe(-50);
    expect(dbfsToGain(-50)).toBeCloseTo(0.003162, 5);
    expect(dbfsToGain(0)).toBe(1);
  });

  it("generates bounded pink noise with more low- than high-frequency energy", () => {
    let seed = 42;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    const noise = generatePinkNoise(20000, random);
    expect(noise).toHaveLength(20000);
    expect(Math.max(...noise)).toBeLessThanOrEqual(1);
    expect(Math.min(...noise)).toBeGreaterThanOrEqual(-1);

    let lowEnergy = 0;
    let highEnergy = 0;
    for (let index = 1; index < noise.length; index += 1) {
      const sample = noise[index]!;
      lowEnergy += sample * sample;
      const difference = sample - noise[index - 1]!;
      highEnergy += difference * difference;
    }
    // White noise would give highEnergy ~= 2 x lowEnergy; pink is much smoother.
    expect(highEnergy).toBeLessThan(lowEnergy);
  });
});

describe("cue grade aggregation", () => {
  it("averages nested graded block accuracy and requires every block to be complete", () => {
    expect(
      summarizeSlideBlocks({
        a: { accuracy: 100, complete: true },
        b: { accuracy: 50, complete: false },
      }),
    ).toEqual({ accuracy: 75, complete: false });
    expect(summarizeSlideBlocks({})).toEqual({ accuracy: 0, complete: false });
  });

  it("requires both a spoken score and a complete slide for graded-slide cues", () => {
    const slideOnly = { slide: { blocks: {}, accuracy: 100, complete: true } };
    const spokenOnly = { score: 80 };
    const both = { score: 80, slide: { blocks: {}, accuracy: 60, complete: true } };

    expect(isCueComplete(slideOnly, true)).toBe(false);
    expect(isCueComplete(spokenOnly, true)).toBe(false);
    expect(isCueComplete(spokenOnly, false)).toBe(true);
    expect(isCueComplete(both, true)).toBe(true);
    expect(cueAccuracy(both, true)).toBe(70);
    expect(cueAccuracy(spokenOnly, false)).toBe(80);
  });

  it("summarises a block, counting ungraded cues as zero", () => {
    const block = summarizeBlockGrade(
      [
        { id: "a", gradedSlide: false },
        { id: "b", gradedSlide: true },
      ],
      { a: { score: 100 } },
    );
    expect(block).toMatchObject({ complete: false, accuracy: 50 });
  });
});
