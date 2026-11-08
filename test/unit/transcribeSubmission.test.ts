import { describe, expect, it, vi } from "vitest";
import { transcribeSubmission } from "../../src/utils/transcribeSubmission";

const spoken = "Chloroplasts are where photosynthesis takes place.";
const clientReturning = (response: unknown) => ({
  queries: { transcribeUrl: vi.fn().mockResolvedValue(response) },
});
const resolveUrl = async () => "https://signed.example/audio.wav";

describe("transcribeSubmission", () => {
  it("returns what was said, so the grader reads the answer rather than a file path", async () => {
    const client = clientReturning({ data: `  ${spoken}  ` });
    expect(await transcribeSubmission("private/u/a.wav", { client, resolveUrl })).toBe(spoken);
    expect(client.queries.transcribeUrl).toHaveBeenCalledWith({
      audioUrl: "https://signed.example/audio.wav",
      model: "whisper-1",
    });
  });

  it("fails loudly when nothing was heard, rather than grading an empty answer", async () => {
    for (const response of [{ data: "" }, { data: "   " }, { data: null }, {}]) {
      await expect(
        transcribeSubmission("private/u/a.wav", { client: clientReturning(response), resolveUrl }),
      ).rejects.toThrow(/no speech/i);
    }
  });

  it("reports a transcription error instead of returning nothing", async () => {
    const client = clientReturning({ errors: [{ message: "quota exceeded" }] });
    await expect(
      transcribeSubmission("private/u/a.wav", { client, resolveUrl }),
    ).rejects.toThrow(/quota exceeded/);
  });

  it("needs a path and a reachable URL", async () => {
    const client = clientReturning({ data: spoken });
    await expect(transcribeSubmission("", { client, resolveUrl })).rejects.toThrow(/audio path/i);
    await expect(
      transcribeSubmission("private/u/a.wav", { client, resolveUrl: async () => null }),
    ).rejects.toThrow(/Unable to create a URL/);
    expect(client.queries.transcribeUrl).not.toHaveBeenCalled();
  });
});
