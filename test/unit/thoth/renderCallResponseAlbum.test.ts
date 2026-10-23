import { beforeEach, describe, expect, it, vi } from "vitest";
import groundTruthFixture from "../../fixtures/thoth/thoth-ground-truth.json";
import type { ThothGroundTruth } from "../../integration/thoth/scoreExtraction";
import {
  buildAlbumPlan,
  deduplicateAudioCues,
  ensureAudioCue,
  prepareAlbumUnitUpdates,
  selectAlbumCards,
} from "../../../scripts/thoth/render-call-response-album.mts";

const groundTruth = groundTruthFixture as unknown as ThothGroundTruth;

const mediaMocks = vi.hoisted(() => ({
  download: vi.fn(),
  write: vi.fn(),
}));

vi.mock("aws-amplify/storage", () => ({
  downloadData: mediaMocks.download,
  uploadData: vi.fn(),
}));

describe("Thoth audio album plan", () => {
  describe("seeded unit preflight", () => {
    const cards = selectAlbumCards(buildAlbumPlan(groundTruth), "trump-0-the-fool");
    const createUnit = () => ({
      unitId: "trumps-unit",
      content: {
        root: {
          children: [{ type: "call-response", script: structuredClone(cards[0]!.script) }],
        },
      },
    });

    it("selects only matching units without mutating content or requesting media", () => {
      const unit = createUnit();
      const original = structuredClone(unit);
      const otherUnit = { unitId: "other-unit", content: { root: { children: [] } } };

      expect(prepareAlbumUnitUpdates([otherUnit, unit], cards)).toEqual([unit]);
      expect(unit).toEqual(original);
    });

    it("rejects missing selected cards before generation", () => {
      expect(() => prepareAlbumUnitUpdates([
        { unitId: "empty-unit", content: { root: { children: [] } } },
      ], cards)).toThrow("No seeded call-response nodes found for: trump-0-the-fool");
    });

    it("rejects malformed call-response scripts", () => {
      expect(() => prepareAlbumUnitUpdates([
        { unitId: "invalid-unit", content: { type: "call-response", script: {} } },
      ], cards)).toThrow("invalid call-response script");
    });

    it.each(["text", "voice", "removed-cue", "cue-id"] as const)(
      "rejects seed speech drift: %s",
      (change) => {
        const unit = createUnit();
        const script = unit.content.root.children[0]!.script;
        const cue = script.cues.find((entry) => entry.kind !== "response")!;
        if (change === "text") cue.text = "Different prompt";
        if (change === "voice") script.voices.narrator = "echo";
        if (change === "removed-cue") script.cues = script.cues.filter((entry) => entry !== cue);
        if (change === "cue-id") cue.id = "different-cue";

        expect(() => prepareAlbumUnitUpdates([unit], cards)).toThrow(
          "speech differs from the audio plan for trump-0-the-fool in unit trumps-unit",
        );
      },
    );

    it("preserves programmatic response timing and existing audio references", () => {
      const unit = createUnit();
      const script = unit.content.root.children[0]!.script;
      const response = script.cues.find((cue) => cue.kind === "response")!;
      response.maxMs += 1000;
      script.albumTrackFileID = "legacy-track";
      const spoken = script.cues.find((cue) => cue.kind !== "response")!;
      spoken.audioFileID = "existing-audio";

      expect(prepareAlbumUnitUpdates([unit], cards)).toEqual([unit]);
      expect(script.albumTrackFileID).toBe("legacy-track");
      expect(spoken.audioFileID).toBe("existing-audio");
    });
  });

  it("keeps all deck cards in fixture order and reads glossary terms before definitions", () => {
    const plan = buildAlbumPlan(groundTruth);
    const qabalah = plan.find(
      (card) => card.cardKey === "ref-glossary-qabalah",
    );
    const glossaryTerm = groundTruth.vocabulary.find(
      (entry) => entry.set === "hebrewLetters",
    );
    const glossaryPrompt = qabalah?.script.cues.find(
      (cue) => cue.kind === "prompt" && cue.text === glossaryTerm?.term,
    );
    const glossaryAnswer = qabalah?.script.cues.find(
      (cue) =>
        cue.kind === "answer" && cue.text === glossaryTerm?.definition,
    );
    const glossaryPromptTerms = plan
      .filter((card) => card.cardKey.startsWith("ref-glossary-"))
      .flatMap((card) =>
        card.script.cues
          .flatMap((cue) => cue.kind === "prompt" ? [cue.text] : []),
      );
    const glossarySets = new Set([
      "glossary",
      "sephiroth",
      "worlds",
      "hebrewLetters",
      "planets",
      "signs",
      "elements",
      "other",
    ]);

    expect(plan.map((card) => card.cardKey)).toEqual(
      groundTruth.cards.map((card) => card.key),
    );
    expect(plan).toHaveLength(100);
    expect(glossaryPrompt?.kind).toBe("prompt");
    expect(glossaryAnswer?.kind).toBe("answer");
    expect(glossaryPromptTerms).toEqual(
      expect.arrayContaining(
        groundTruth.vocabulary
          .filter((entry) => glossarySets.has(entry.set))
          .map((entry) => entry.term),
      ),
    );
  });

  describe("Thoth audio cue reuse", () => {
    const cue = {
      id: "test-prompt",
      text: "Planet?",
      voice: "alloy",
      cacheKey: "test-cache-key",
    };
    const audio = {
      id: "audio-1",
      path: "public/audio/test.mp3",
      text: cue.text,
      voice: cue.voice,
    };
    const completed = {
      data: {
        path: audio.path,
        description: "Generated audio - completed",
      },
    };
    const createManifest = (cached = false) => ({
      version: 1 as const,
      generatedAt: null,
      cues: cached ? { [cue.cacheKey]: { ...audio } } : {},
      tracks: {},
    });
    const createClient = () => ({
      models: { File: { get: vi.fn().mockResolvedValue(completed) } },
      mutations: {
        generateAudioFile: vi.fn().mockResolvedValue({ data: audio }),
      },
    });

    beforeEach(() => {
      vi.resetAllMocks();
      mediaMocks.write.mockResolvedValue(undefined);
      mediaMocks.download.mockImplementation(() => ({
        result: Promise.resolve({
          body: {
            blob: async () => new Blob([new Uint8Array([0x49, 0x44, 0x33, 0])]),
          },
        }),
      }));
    });

    it("reuses a completed cue without another paid mutation", async () => {
      const client = createClient();
      await expect(ensureAudioCue(client, cue, createManifest(true), mediaMocks.write)).resolves.toEqual(audio);
      expect(client.mutations.generateAudioFile).not.toHaveBeenCalled();
      expect(mediaMocks.download).toHaveBeenCalledWith({ path: audio.path });
      expect(mediaMocks.write).not.toHaveBeenCalled();
    });

    it("saves the pending File before polling and resumes it after an interruption", async () => {
      const client = createClient();
      const manifest = createManifest();
      client.models.File.get.mockImplementationOnce(async () => {
        expect(mediaMocks.write).toHaveBeenCalledOnce();
        throw new Error("Connection interrupted");
      });

      await expect(ensureAudioCue(client, cue, manifest, mediaMocks.write)).rejects.toThrow("Connection interrupted");
      expect(mediaMocks.write).toHaveBeenCalledWith(
        expect.objectContaining({ cues: { [cue.cacheKey]: audio } }),
      );

      const restoredManifest: typeof manifest = JSON.parse(JSON.stringify(manifest));
      await expect(
        ensureAudioCue(client, cue, restoredManifest, mediaMocks.write),
      ).resolves.toEqual(audio);
      expect(client.mutations.generateAudioFile).toHaveBeenCalledOnce();
    });

    it("polls an existing pending request without starting a new generation", async () => {
      vi.useFakeTimers();
      try {
        const client = createClient();
        client.models.File.get.mockResolvedValueOnce({
          data: { ...completed.data, description: "Generated audio - pending" },
        });
        const result = ensureAudioCue(client, cue, createManifest(true), mediaMocks.write);
        const assertion = expect(result).resolves.toEqual(audio);
        await vi.advanceTimersByTimeAsync(1000);
        await assertion;
        expect(client.models.File.get).toHaveBeenCalledTimes(2);
        expect(client.mutations.generateAudioFile).not.toHaveBeenCalled();
      } finally {
        vi.useRealTimers();
      }
    });

    it("surfaces generation errors without charging for an automatic retry", async () => {
      const client = createClient();
      client.models.File.get.mockResolvedValueOnce({
        data: { ...completed.data, description: "Error: OpenAI unavailable" },
      });
      await expect(
        ensureAudioCue(client, cue, createManifest(true), mediaMocks.write),
      ).rejects.toThrow("TTS generation failed: Error: OpenAI unavailable");
      expect(client.mutations.generateAudioFile).not.toHaveBeenCalled();
    });

    it("does not cache a failed generation mutation", async () => {
      const client = createClient();
      const manifest = createManifest();
      client.mutations.generateAudioFile.mockResolvedValueOnce({
        data: null,
        errors: [{ message: "Unauthorized" }],
      });
      await expect(
        ensureAudioCue(client, cue, manifest, mediaMocks.write),
      ).rejects.toThrow("Unauthorized");
      expect(manifest.cues).toEqual({});
      expect(mediaMocks.write).not.toHaveBeenCalled();
      expect(client.models.File.get).not.toHaveBeenCalled();
    });

    it("does not poll if saving the newly returned File fails", async () => {
      const client = createClient();
      mediaMocks.write.mockRejectedValueOnce(new Error("Manifest disk failure"));
      await expect(ensureAudioCue(client, cue, createManifest(), mediaMocks.write)).rejects.toThrow("Manifest disk failure");
      expect(client.models.File.get).not.toHaveBeenCalled();
    });

    it("does not regenerate audio when reseeding removed its File record", async () => {
      const client = createClient();
      client.models.File.get.mockResolvedValueOnce({ data: null });
      await expect(ensureAudioCue(client, cue, createManifest(true), mediaMocks.write)).rejects.toThrow("restore its File record");
      expect(client.mutations.generateAudioFile).not.toHaveBeenCalled();
    });

    it("rejects a cache-key mismatch before making any service calls", async () => {
      const client = createClient();
      const manifest = createManifest(true);
      manifest.cues[cue.cacheKey]!.voice = "echo";
      await expect(ensureAudioCue(client, cue, manifest, mediaMocks.write)).rejects.toThrow("cache-key mismatch");
      expect(client.models.File.get).not.toHaveBeenCalled();
      expect(client.mutations.generateAudioFile).not.toHaveBeenCalled();
    });

    it("rejects a File pointing at a different S3 object", async () => {
      const client = createClient();
      client.models.File.get.mockResolvedValueOnce({
        data: { ...completed.data, path: "public/audio/other.mp3" },
      });
      await expect(ensureAudioCue(client, cue, createManifest(true), mediaMocks.write)).rejects.toThrow("unexpected S3 path");
      expect(client.mutations.generateAudioFile).not.toHaveBeenCalled();
      expect(mediaMocks.download).not.toHaveBeenCalled();
    });

    it("surfaces missing S3 audio instead of generating a replacement", async () => {
      const client = createClient();
      mediaMocks.download.mockImplementationOnce(() => ({
        result: Promise.reject(new Error("NoSuchKey")),
      }));
      await expect(ensureAudioCue(client, cue, createManifest(true), mediaMocks.write)).rejects.toThrow("NoSuchKey");
      expect(client.mutations.generateAudioFile).not.toHaveBeenCalled();
    });

    it("rejects empty or non-MP3 data without generating a replacement", async () => {
      const client = createClient();
      mediaMocks.download.mockImplementationOnce(() => ({
        result: Promise.resolve({ body: { blob: async () => new Blob([]) } }),
      }));
      await expect(ensureAudioCue(client, cue, createManifest(true), mediaMocks.write)).rejects.toThrow("not a valid MP3");
      expect(client.mutations.generateAudioFile).not.toHaveBeenCalled();
    });
  });

  it("deduplicates audio by both voice and exact cue text", () => {
    const plan = buildAlbumPlan(groundTruth);
    const cues = deduplicateAudioCues(plan);
    const allCueCount = plan.reduce(
      (total, card) => total + card.audioCues.length,
      0,
    );

    expect(cues.length).toBeLessThan(allCueCount);
    expect(new Set(cues.map((cue) => cue.cacheKey)).size).toBe(cues.length);
  });

  it("selects one card and its own unique TTS cues", () => {
    const cards = buildAlbumPlan(groundTruth);
    const selected = selectAlbumCards(cards, "trump-0-the-fool");

    expect(selected).toHaveLength(1);
    expect(selected[0]?.cardKey).toBe("trump-0-the-fool");
    expect(deduplicateAudioCues(selected)).toHaveLength(
      new Set(selected[0]?.audioCues.map((cue) => cue.cacheKey)).size,
    );
    expect(() => selectAlbumCards(cards, "not-a-card")).toThrow(
      "Unknown Thoth card key: not-a-card",
    );
  });

  it("keeps response silence as playlist timing rather than generated speech", () => {
    const magus = buildAlbumPlan(groundTruth).find(
      (card) => card.cardKey === "trump-i-the-magus",
    )!;
    const responseCue = magus.script.cues.find(
      (cue) => cue.kind === "response",
    );

    expect(responseCue).toMatchObject({
      minMs: expect.any(Number),
      maxMs: expect.any(Number),
      silenceEndMs: expect.any(Number),
    });
    expect(
      magus.audioCues.some((audioCue) => audioCue.id === responseCue?.id),
    ).toBe(false);
  });
});
