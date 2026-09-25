export const STATIC_WAVEFORM_DEFAULTS = {
  width: 600,
  height: 100,
} as const;

export const AUDIO_WAVEFORM_PLAYER_DEFAULTS = {
  width: 600,
  height: 80,
} as const;

export const LEARNER_EXERCISE_WAVEFORM_PRESET = {
  width: 480,
  height: 64,
  sampleCount: 480,
} as const;

export const WAVEFORM_DATA_DEFAULTS = {
  sampleCount: 600,
} as const;

export const WAVEFORM_SEMANTIC_TOKENS = {
  background: "background.paper",
  color: "primary.main",
  border: "divider",
} as const;

export const WAVEFORM_CSS_VARIABLES = {
  background: "--mui-palette-background-paper",
  color: "--mui-palette-primary-main",
  border: "--mui-palette-divider",
} as const;

export const WAVEFORM_COLOR_FALLBACKS = {
  background: "#ffffff",
  color: "#556cd6",
  border: "#e0e0e0",
} as const;

export const WAVEFORM_LINE_STYLE = {
  amplitudeColorBase: 100,
  amplitudeColorRange: 155,
  barGap: 0.5,
  borderRadius: 4,
  borderWidth: 1,
  idleLineThickness: 1,
  placeholderBarCount: 50,
  placeholderBarGap: 1,
  placeholderMaxAmplitude: 0.7,
} as const;

export function waveformCssColor(variable: string, fallback: string): string {
  return `var(${variable}, ${fallback})`;
}

export function resolveWaveformCssColor(
  variable: string,
  fallback: string,
): string {
  if (typeof document === "undefined") return fallback;

  return (
    getComputedStyle(document.documentElement)
      .getPropertyValue(variable)
      .trim() || fallback
  );
}

export function waveformAmplitudeColor(
  amplitude: number,
  green: number,
  blue: number,
): string {
  const red =
    Math.floor(amplitude * WAVEFORM_LINE_STYLE.amplitudeColorRange) +
    WAVEFORM_LINE_STYLE.amplitudeColorBase;
  return `rgb(${red}, ${green}, ${blue})`;
}
