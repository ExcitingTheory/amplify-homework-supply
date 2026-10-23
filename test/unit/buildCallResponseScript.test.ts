import { describe, expect, it } from "vitest";
import groundTruthFixture from "../fixtures/thoth/thoth-ground-truth.json";
import type { ThothGroundTruth } from "../integration/thoth/scoreExtraction";
import {
  buildCallResponseScript,
  isCallResponseScript,
} from "../../src/utils/callResponse/buildCallResponseScript";
import { scoreSpokenAnswer } from "../../src/utils/callResponse/scoreSpokenAnswer";

const groundTruth = groundTruthFixture as unknown as ThothGroundTruth;

describe("buildCallResponseScript", () => {
  it("creates ordered prompt, response, and answer cues without source defects", () => {
    const magus = groundTruth.cards.find(
      (card) => card.key === "trump-i-the-magus",
    );
    expect(magus).toBeDefined();
    const script = buildCallResponseScript(magus!);
    const kinds = script.cues.map((cue) => cue.kind);

    expect(script.cardKey).toBe("trump-i-the-magus");
    expect(script.title).toBe("The Magus");
    expect(kinds).toHaveLength(magus!.facts.filter((fact) => !fact.sourceDefect).length * 3);
    expect(kinds.slice(0, 3)).toEqual(["prompt", "response", "answer"]);
    expect(script.cues[1]).toMatchObject({
      kind: "response",
      expected: magus!.facts.find((fact) => fact.field === "number")?.value,
      minMs: 2500,
      maxMs: 2500,
      silenceEndMs: 700,
    });
  });

  it("sizes each response window from the expected answer length", () => {
    const glossary = groundTruth.cards.find(
      (card) => card.key === "ref-glossary-tarot",
    )!;
    const script = buildCallResponseScript(glossary, groundTruth.vocabulary);
    const windows = new Set(
      script.cues.flatMap((cue) => (cue.kind === "response" ? [cue.maxMs] : [])),
    );
    expect(windows.size).toBeGreaterThan(1);
    for (const maxMs of windows) {
      expect(maxMs).toBeGreaterThanOrEqual(2500);
      expect(maxMs).toBeLessThanOrEqual(8000);
    }
  });

  it("excludes reference defects and returns a safe empty script", () => {
    const card = groundTruth.cards.find((candidate) =>
      candidate.facts.some((fact) => fact.sourceDefect),
    )!;
    const script = buildCallResponseScript({
      ...card,
      facts: card.facts.filter((fact) => fact.sourceDefect),
    });
    expect(script.cues).toEqual([]);
  });

  it("validates unique cue ids and response timing before editor import", () => {
    const magus = groundTruth.cards.find(
      (card) => card.key === "trump-i-the-magus",
    )!;
    const script = buildCallResponseScript(magus);
    expect(isCallResponseScript(script)).toBe(true);

    const duplicateCueScript = {
      ...script,
      cues: [script.cues[0]!, script.cues[0]!],
    };
    expect(isCallResponseScript(duplicateCueScript)).toBe(false);

    const invalidTimingScript = {
      ...script,
      cues: script.cues.map((cue) =>
        cue.kind === "response" ? { ...cue, maxMs: cue.minMs - 1 } : cue,
      ),
    };
    expect(isCallResponseScript(invalidTimingScript)).toBe(false);
  });

  it("scores exact, numeral-equivalent, token, and phonetic responses", () => {
    expect(scoreSpokenAnswer("Mercury", "Mercury")).toMatchObject({
      score: 100,
      correct: true,
      match: "exact",
    });
    expect(scoreSpokenAnswer("one", "I")).toMatchObject({
      score: 100,
      correct: true,
      match: "numeric",
    });
    expect(scoreSpokenAnswer("The radiant self", "radiant self")).toMatchObject({
      correct: true,
      match: "token",
    });
    expect(scoreSpokenAnswer("Qabalah", "Kabbalah")).toMatchObject({
      match: "phonetic",
    });
    expect(scoreSpokenAnswer("", "Beth")).toMatchObject({
      score: 0,
      correct: false,
      match: "none",
    });
  });
});
