import { afterEach, describe, expect, it, vi } from "vitest";
import {
  extensionForMimeType,
  preferredRecordingMimeType,
} from "../../src/utils/audioRecordingFormat";

const withSupport = (supported: string[]) => {
  vi.stubGlobal("MediaRecorder", {
    isTypeSupported: (type: string) => supported.includes(type),
  });
};

afterEach(() => vi.unstubAllGlobals());

describe("preferredRecordingMimeType", () => {
  it("prefers AAC in MP4, which plays on Safari and iOS as well", () => {
    withSupport(["audio/mp4;codecs=mp4a.40.2", "audio/webm;codecs=opus"]);
    expect(preferredRecordingMimeType()).toBe("audio/mp4;codecs=mp4a.40.2");
  });

  it("falls back to Opus in WebM where MP4 recording is unavailable", () => {
    withSupport(["audio/webm;codecs=opus", "audio/webm"]);
    expect(preferredRecordingMimeType()).toBe("audio/webm;codecs=opus");
  });

  it("lets the browser choose when it supports none of them", () => {
    withSupport([]);
    expect(preferredRecordingMimeType()).toBeUndefined();
  });

  it("survives a browser without MediaRecorder, or one that throws", () => {
    vi.stubGlobal("MediaRecorder", undefined);
    expect(preferredRecordingMimeType()).toBeUndefined();
    vi.stubGlobal("MediaRecorder", {
      isTypeSupported: () => {
        throw new Error("not implemented");
      },
    });
    expect(preferredRecordingMimeType()).toBeUndefined();
  });
});

describe("extensionForMimeType", () => {
  it.each([
    ["audio/mp4;codecs=mp4a.40.2", "m4a"],
    ["audio/mp4", "m4a"],
    ["audio/aac", "m4a"],
    ["audio/webm;codecs=opus", "webm"],
    ["audio/ogg", "ogg"],
    ["audio/mpeg", "mp3"],
    ["audio/wav", "wav"],
    ["AUDIO/WAV", "wav"],
  ])("names %s as .%s", (mimeType, expected) => {
    expect(extensionForMimeType(mimeType)).toBe(expected);
  });

  it("defaults to webm when the type is missing or unknown", () => {
    for (const value of [undefined, null, "", "application/octet-stream"]) {
      expect(extensionForMimeType(value)).toBe("webm");
    }
  });
});
