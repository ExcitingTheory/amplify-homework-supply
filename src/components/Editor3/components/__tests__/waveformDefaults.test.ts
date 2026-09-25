import { describe, expect, it } from "vitest";
import {
  AUDIO_WAVEFORM_PLAYER_DEFAULTS,
  LEARNER_EXERCISE_WAVEFORM_PRESET,
  STATIC_WAVEFORM_DEFAULTS,
  WAVEFORM_COLOR_FALLBACKS,
  WAVEFORM_CSS_VARIABLES,
  WAVEFORM_DATA_DEFAULTS,
  WAVEFORM_LINE_STYLE,
  WAVEFORM_SEMANTIC_TOKENS,
} from "../../../../utils/waveformDefaults";

describe("waveform defaults", () => {
  it("preserves each existing component size contract", () => {
    expect(STATIC_WAVEFORM_DEFAULTS).toEqual({ width: 600, height: 100 });
    expect(AUDIO_WAVEFORM_PLAYER_DEFAULTS).toEqual({ width: 600, height: 80 });
    expect(LEARNER_EXERCISE_WAVEFORM_PRESET).toEqual({
      width: 480,
      height: 64,
      sampleCount: 480,
    });
    expect(WAVEFORM_DATA_DEFAULTS.sampleCount).toBe(600);
  });

  it("uses semantic tokens and MUI CSS variables for waveform colors", () => {
    expect(WAVEFORM_SEMANTIC_TOKENS).toEqual({
      background: "background.paper",
      color: "primary.main",
      border: "divider",
    });
    expect(WAVEFORM_CSS_VARIABLES).toEqual({
      background: "--mui-palette-background-paper",
      color: "--mui-palette-primary-main",
      border: "--mui-palette-divider",
    });
    expect(WAVEFORM_COLOR_FALLBACKS).toEqual({
      background: "#ffffff",
      color: "#556cd6",
      border: "#e0e0e0",
    });
  });

  it("preserves the existing waveform line measurements", () => {
    expect(WAVEFORM_LINE_STYLE).toMatchObject({
      amplitudeColorBase: 100,
      amplitudeColorRange: 155,
      barGap: 0.5,
      borderRadius: 4,
      borderWidth: 1,
      idleLineThickness: 1,
      placeholderBarCount: 50,
      placeholderBarGap: 1,
      placeholderMaxAmplitude: 0.7,
    });
  });
});
