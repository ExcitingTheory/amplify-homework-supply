import { describe, expect, it } from "vitest";
import { getTranscriptionAudioFormat } from "./transcriptionAudioFormat";

describe("getTranscriptionAudioFormat", () => {
  it("uses the uploaded MIME type and strips codec parameters", () => {
    expect(
      getTranscriptionAudioFormat(
        "audio/webm;codecs=opus",
        "https://example.test/answer.m4a",
      ),
    ).toEqual({ extension: "webm", mimeType: "audio/webm" });
  });

  it("falls back to the stored file extension for generic content types", () => {
    expect(
      getTranscriptionAudioFormat(
        "application/octet-stream",
        "https://example.test/private/answer.wav?signature=ignored",
      ),
    ).toEqual({ extension: "wav", mimeType: "audio/wav" });
  });

  it("rejects unknown audio formats instead of labeling them as MP3", () => {
    expect(() =>
      getTranscriptionAudioFormat(
        "application/octet-stream",
        "https://example.test/answer.bin",
      ),
    ).toThrow("Unsupported audio format for transcription");
  });
});
