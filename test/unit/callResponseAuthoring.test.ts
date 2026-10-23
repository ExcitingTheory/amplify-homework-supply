import { describe, expect, it, vi } from "vitest";
import {
  appendQuestionCues,
  attachAudioFiles,
  collectAudioRequests,
  questionCardKey,
} from "../../src/utils/callResponse/authoring";
import {
  generateCueAudio,
  type AudioGenerationClient,
} from "../../src/utils/callResponse/generateCueAudio";
import {
  isCallResponseScript,
  isCallResponseSlide,
  type CallResponseScript,
} from "../../src/utils/callResponse/buildCallResponseScript";

const baseScript: CallResponseScript = {
  cardKey: "custom-1",
  title: "Planets",
  voices: { narrator: "alloy", answer: "nova" },
  cues: [],
};

describe("appendQuestionCues", () => {
  it("adds a prompt, response, and answer cue per complete question", () => {
    const script = appendQuestionCues(baseScript, [
      {
        id: "q1",
        prompt: "What is the planet of The Magus?",
        answer: "Mercury",
        metadata: JSON.stringify({
          card: "trump-i-the-magus",
          field: "planet",
          accept: ["Hermes"],
        }),
      },
      { id: "q2", prompt: "No answer", answer: "" },
    ]);

    expect(script.cues.map((cue) => cue.kind)).toEqual([
      "prompt",
      "response",
      "answer",
    ]);
    expect(script.cues[1]).toMatchObject({
      expected: "Mercury",
      accept: ["Hermes"],
      field: "planet",
      minMs: 2500,
    });
    expect(isCallResponseScript(script)).toBe(true);
  });

  it("does not duplicate cues for a question that was already added", () => {
    const question = { id: "q1", prompt: "Q?", answer: "A" };
    const once = appendQuestionCues(baseScript, [question]);
    expect(appendQuestionCues(once, [question]).cues).toHaveLength(3);
  });

  it("reads the card key from question metadata and tolerates bad metadata", () => {
    expect(
      questionCardKey({ id: "q", metadata: JSON.stringify({ card: "a" }) }),
    ).toBe("a");
    expect(questionCardKey({ id: "q", metadata: "{not json" })).toBeNull();
  });
});

describe("audio generation planning", () => {
  const script = appendQuestionCues(baseScript, [
    { id: "q1", prompt: "Planet?", answer: "Mercury" },
    { id: "q2", prompt: "Planet?", answer: "Venus" },
  ]);

  it("generates repeated prompt text once per voice and skips response cues", async () => {
    const requests = await collectAudioRequests(script);
    const planetPrompt = requests.find((request) => request.text === "Planet?");
    expect(planetPrompt?.cueIds).toHaveLength(2);
    expect(planetPrompt?.voice).toBe("alloy");
    expect(requests).toHaveLength(3);
    expect(
      requests.flatMap((request) => request.cueIds).some((id) =>
        id.endsWith("-response"),
      ),
    ).toBe(false);
  });

  it("skips cues that already have audio", async () => {
    const withAudio = attachAudioFiles(script, {
      "custom-1-q-q1-prompt": "file-1",
      "custom-1-q-q2-prompt": "file-1",
    });
    const requests = await collectAudioRequests(withAudio);
    expect(requests.map((request) => request.text).sort()).toEqual([
      "Mercury",
      "Venus",
    ]);
  });

  it("generates through the client, waits for completion, and attaches file ids", async () => {
    let counter = 0;
    const generateAudioFile = vi.fn(async () => ({
      data: { id: `file-${(counter += 1)}`, path: "protected/x.mp3" },
    }));
    const get = vi
      .fn()
      .mockResolvedValue({ data: { description: "Generated audio - completed" } });
    const client: AudioGenerationClient = {
      mutations: { generateAudioFile },
      models: { File: { get } },
    };
    const progress: Array<[number, number]> = [];
    const result = await generateCueAudio(client, script, {
      pollIntervalMs: 0,
      onProgress: (completed, total) => progress.push([completed, total]),
    });

    expect(generateAudioFile).toHaveBeenCalledTimes(3);
    expect(generateAudioFile).toHaveBeenCalledWith(
      expect.objectContaining({ model: "tts-1" }),
    );
    expect(progress.at(-1)).toEqual([3, 3]);
    const promptIds = result.cues
      .filter((cue) => cue.kind === "prompt")
      .map((cue) => (cue.kind === "prompt" ? cue.audioFileID : undefined));
    expect(promptIds[0]).toBeDefined();
    expect(promptIds[0]).toBe(promptIds[1]);
    expect(
      result.cues.every((cue) => cue.kind === "response" || cue.audioFileID),
    ).toBe(true);
  });

  it("fails loudly when TTS reports an error", async () => {
    const client: AudioGenerationClient = {
      mutations: {
        generateAudioFile: async () => ({ data: { id: "file-1" } }),
      },
      models: {
        File: {
          get: async () => ({ data: { description: "Error: quota exceeded" } }),
        },
      },
    };
    await expect(
      generateCueAudio(client, script, { pollIntervalMs: 0 }),
    ).rejects.toThrow("TTS generation failed");
  });
});

describe("slide validation", () => {
  it("accepts text and lexical slides and rejects malformed ones", () => {
    expect(isCallResponseSlide({ type: "text", text: "The Magus" })).toBe(true);
    expect(isCallResponseSlide({ type: "text", text: "  " })).toBe(false);
    expect(
      isCallResponseSlide({
        type: "lexical",
        state: { root: { children: [] } },
        graded: true,
      }),
    ).toBe(true);
    expect(isCallResponseSlide({ type: "lexical", state: {} })).toBe(false);
    expect(isCallResponseSlide({ type: "video" })).toBe(false);
  });

  it("rejects a script containing an invalid slide", () => {
    expect(
      isCallResponseScript({
        ...baseScript,
        cues: [{ id: "p", kind: "prompt", text: "Hi", slide: { type: "nope" } }],
      }),
    ).toBe(false);
  });
});
