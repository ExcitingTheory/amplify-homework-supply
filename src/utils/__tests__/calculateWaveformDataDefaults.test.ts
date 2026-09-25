import { afterEach, describe, expect, it, vi } from "vitest";
import { calculateWaveformData } from "../calculateWaveformData";

class MockAudioContext {
  async decodeAudioData() {
    const channelData = Float32Array.from({ length: 960 }, (_, index) =>
      Math.sin(index * 0.1),
    );

    return {
      getChannelData: () => channelData,
    };
  }

  close() {
    return Promise.resolve();
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("calculateWaveformData defaults", () => {
  it("preserves the calculator's existing 600-sample default", async () => {
    vi.stubGlobal("AudioContext", MockAudioContext);

    const waveform = await calculateWaveformData(new ArrayBuffer(8));

    expect(waveform).toHaveLength(600);
  });
});
