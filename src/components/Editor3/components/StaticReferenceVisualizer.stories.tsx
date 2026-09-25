import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import * as React from "react";
import { Box } from "@mui/material";

import StaticReferenceVisualizer, {
  FlowingReferenceVisualizer,
  RadialReferenceVisualizer,
  type FrequencyLevels,
  type StaticReferenceVisualizerProps,
} from "./StaticReferenceVisualizer";

type VisualizerStoryArgs = StaticReferenceVisualizerProps & {
  previewPadding?: number;
  previewSize?: number;
};

const FREQUENCY_BANDS = {
  air: [8000, 16000],
  bass: [60, 250],
  highMid: [2000, 8000],
  lowMid: [250, 2000],
  sub: [20, 60],
} as const;
const TRANSITION_DURATION_SECONDS = 0.6;
const AUDIO_UPDATE_INTERVAL_MS = 1000 / 30;
// The canvas/SVG viewBox is 320×320 (see CENTER=160 in StaticReferenceVisualizer.tsx),
// so a point can travel this far from center before leaving the visible frame.
const VISUALIZER_HALF_EXTENT = 160;
// How far past "just barely offscreen" to push the hidden-state scale, so the ring
// is decisively clipped by the container rather than sitting right at its edge.
const HIDE_SCALE_SAFETY_MARGIN = 1.4;
// Impact ("thud") onset detection now spans bass + mids, not just bass, so snare/mid
// hits pulse the ring too. A fast rolling baseline lets sudden jumps above it register
// as a hit, which then pops the ring and decays back down like a transient. Levels are
// raw analyser readings now (no quantization gain or attack/release smoothing applied),
// so thresholds below are tuned for that smaller raw scale.
const IMPACT_LOW_MID_WEIGHT = 0.85;
const IMPACT_HIGH_MID_WEIGHT = 0.55;
const THUD_TRIGGER_DELTA = 0.07;
const THUD_BASELINE_FOLLOW = 0.06;
const THUD_RETRIGGER_SECONDS = 0.15;
const THUD_PULSE_DECAY_PER_SECOND = 7;
// Two hand-tuned keyframes for the ring's overall character: "quiet" is the calm
// baseline (Storybook args below), "loud" is where it morphs to while a thud rings out.
const LOUD_THUD_KEYFRAME = {
  animationIntensity: 1,
  animationSpeed: 1.1,
  flowingAsymmetry: 12,
  flowingCenterRepulsion: 8,
  flowingCoilBreakup: 18,
  flowingFillAmount: 1,
  flowingLobeAmplitude: 5,
  flowingResponsiveStrandRatio: 0.66,
  flowingRippleAmplitude: 22,
  flowingRippleIrregularity: 14,
  flowingSoftBlur: 3,
  flowingSwimAmplitude: 16,
} as const;
// Continuous "how loud is the music right now" scaling — unlike the thud blend above,
// this ranges smoothly from a hushed quiet floor to an exaggerated loud ceiling based
// on sustained loudness (`energy`), not just onset transients.
const MUSIC_INTENSITY_AMPLITUDE_RANGE = { max: 2.4, min: 0.55 } as const;
const MUSIC_INTENSITY_SPEED_RANGE = { max: 2.6, min: 0.6 } as const;
const MUSIC_INTENSITY_ROTATION_RANGE = { max: 2.4, min: 0.6 } as const;
const MUSIC_INTENSITY_PHASE_GAIN = 2.4;

function lerp(quiet: number, loud: number, amount: number): number {
  return quiet + (loud - quiet) * amount;
}

function musicIntensityScale(
  range: { max: number; min: number },
  energyLevel: number,
): number {
  return lerp(range.min, range.max, Math.min(1, Math.max(0, energyLevel)));
}

// Scale factor that guarantees the ring's diameter exceeds the container at rest
// (transitionProgress 0), so it's hidden by clipping instead of relying on opacity.
function computeAutoHideScale(effectiveMaxRadius: number): number {
  const requiredRadius = VISUALIZER_HALF_EXTENT * HIDE_SCALE_SAFETY_MARGIN;
  return Math.max(0, requiredRadius / Math.max(1, effectiveMaxRadius) - 1);
}

const BAND_RESPONSE_CURVES: Record<
  keyof typeof FREQUENCY_BANDS,
  { ceiling: number; exponent: number; floor: number }
> = {
  air: { ceiling: 0.06, exponent: 1.5, floor: 0.0017 },
  bass: { ceiling: 0.15, exponent: 0.75, floor: 0.0067 },
  highMid: { ceiling: 0.083, exponent: 1.2, floor: 0.0033 },
  lowMid: { ceiling: 0.117, exponent: 0.8, floor: 0.005 },
  sub: { ceiling: 0.1, exponent: 0.8, floor: 0.0033 },
};

function normalizeFrequencyLevels(levels: FrequencyLevels): FrequencyLevels {
  return Object.fromEntries(
    Object.keys(FREQUENCY_BANDS).map((band) => {
      const { ceiling, exponent, floor } =
        BAND_RESPONSE_CURVES[band as keyof typeof FREQUENCY_BANDS];
      const value = levels[band as keyof typeof FREQUENCY_BANDS] ?? 0;
      const normalized = Math.min(
        1,
        Math.max(0, (value - floor) / Math.max(0.0001, ceiling - floor)),
      );
      return [band, normalized ** exponent];
    }),
  ) as FrequencyLevels;
}

const meta: Meta<VisualizerStoryArgs> = {
  title: "Editor3/Static Reference Visualizer",
  component: StaticReferenceVisualizer,
  argTypes: {
    animated: {
      control: "boolean",
      if: { arg: "variant", eq: "topCenter" },
      name: "Animate",
    },
    animationFrameRate: {
      control: { type: "range", min: 12, max: 60, step: 1 },
      if: { arg: "variant", eq: "topCenter" },
      name: "Animation FPS",
    },
    animationIntensity: {
      control: { type: "range", min: 0, max: 1, step: 0.05 },
      if: { arg: "variant", eq: "topCenter" },
      name: "Motion intensity",
    },
    animationSpeed: {
      control: { type: "range", min: 0.05, max: 2, step: 0.05 },
      if: { arg: "variant", eq: "topCenter" },
      name: "Motion speed",
    },
    flowingBaseRadius: {
      control: { type: "range", min: 60, max: 110, step: 1 },
      if: { arg: "variant", eq: "topCenter" },
      name: "Base radius",
    },
    flowingColorStops: {
      control: "object",
      if: { arg: "variant", eq: "topCenter" },
      name: "Flowing color stops",
    },
    frequencyLevels: {
      control: "object",
      name: "Frequency levels",
    },
    previewPadding: {
      control: { type: "range", min: 0, max: 120, step: 4 },
      name: "Preview padding",
    },
    previewSize: {
      control: { type: "range", min: 320, max: 1200, step: 20 },
      name: "Preview size",
    },
    flowingCoilBreakup: {
      control: { type: "range", min: 0, max: 14, step: 0.5 },
      if: { arg: "variant", eq: "topCenter" },
      name: "Coil breakup",
    },
    flowingCenterRepulsion: {
      control: { type: "range", min: 8, max: 24, step: 0.5 },
      if: { arg: "variant", eq: "topCenter" },
      name: "Center repulsion",
    },
    flowingFillAmount: {
      control: { type: "range", min: 0, max: 1, step: 0.05 },
      if: { arg: "variant", eq: "topCenter" },
      name: "Bounds fill",
    },
    flowingLineCount: {
      control: { type: "range", min: 12, max: 100, step: 1 },
      if: { arg: "variant", eq: "topCenter" },
      name: "Line count",
    },
    flowingLineBundles: {
      control: "object",
      if: { arg: "variant", eq: "topCenter" },
      name: "Line bundles",
    },
    flowingLobeAmplitude: {
      control: { type: "range", min: 0, max: 42, step: 1 },
      if: { arg: "variant", eq: "topCenter" },
      name: "Lobe depth",
    },
    flowingMaxRadius: {
      control: { type: "range", min: 90, max: 150, step: 1 },
      if: { arg: "variant", eq: "topCenter" },
      name: "Max radius",
    },
    flowingOpacityNoise: {
      control: { type: "range", min: 0, max: 0.8, step: 0.05 },
      if: { arg: "variant", eq: "topCenter" },
      name: "Opacity variation",
    },
    flowingResponsiveStrandRatio: {
      control: { type: "range", min: 0.12, max: 1, step: 0.02 },
      if: { arg: "variant", eq: "topCenter" },
      name: "Responsive strands",
    },
    flowingRippleIrregularity: {
      control: { type: "range", min: 0, max: 14, step: 0.5 },
      if: { arg: "variant", eq: "topCenter" },
      name: "Ripple irregularity",
    },
    flowingRippleClumps: {
      control: "object",
      if: { arg: "variant", eq: "topCenter" },
      name: "Ripple clumps",
    },
    flowingRipplePhase: {
      control: { type: "range", min: 0, max: 6.28, step: 0.05 },
      if: { arg: "variant", eq: "topCenter" },
      name: "Ripple phase",
    },
    flowingRippleAmplitude: {
      control: { type: "range", min: 0, max: 16, step: 0.5 },
      if: { arg: "variant", eq: "topCenter" },
      name: "Ripple depth",
    },
    flowingSampleCount: {
      control: { type: "range", min: 36, max: 180, step: 6 },
      if: { arg: "variant", eq: "topCenter" },
      name: "Path samples",
    },
    flowingSwimAmplitude: {
      control: { type: "range", min: 0, max: 18, step: 0.5 },
      if: { arg: "variant", eq: "topCenter" },
      name: "Swim drift",
    },
    flowingAsymmetry: {
      control: { type: "range", min: 0, max: 16, step: 0.5 },
      if: { arg: "variant", eq: "topCenter" },
      name: "Peak/valley asymmetry",
    },
    flowingRotationSpeed: {
      control: { type: "range", min: -180, max: 180, step: 1 },
      if: { arg: "variant", eq: "topCenter" },
      name: "Line rotation speed",
    },
    flowingChaosIntensity: {
      control: { type: "range", min: 0, max: 1, step: 0.05 },
      if: { arg: "variant", eq: "topCenter" },
      name: "Chaos intensity",
    },
    flowingSoftBlur: {
      control: { type: "range", min: 0, max: 3, step: 0.1 },
      if: { arg: "variant", eq: "topCenter" },
      name: "Soft blur",
    },
    flowingStrokeWidth: {
      control: { type: "range", min: 0.2, max: 3, step: 0.1 },
      if: { arg: "variant", eq: "topCenter" },
      name: "Stroke width",
    },
    flowingSpreadAmplitude: {
      control: { type: "range", min: 0, max: 34, step: 0.5 },
      if: { arg: "variant", eq: "topCenter" },
      name: "Audio strand spread",
    },
    flowingWidthNoise: {
      control: { type: "range", min: 0, max: 0.9, step: 0.05 },
      if: { arg: "variant", eq: "topCenter" },
      name: "Width variation",
    },
    radialBarCount: {
      control: { type: "range", min: 48, max: 240, step: 1 },
      if: { arg: "variant", eq: "middleCenter" },
      name: "Bar count",
    },
    radialBarSectors: {
      control: "object",
      if: { arg: "variant", eq: "middleCenter" },
      name: "Bar sectors",
    },
    radialColorStops: {
      control: "object",
      if: { arg: "variant", eq: "middleCenter" },
      name: "Radial color stops",
    },
    radialInnerRadius: {
      control: { type: "range", min: 28, max: 86, step: 1 },
      if: { arg: "variant", eq: "middleCenter" },
      name: "Inner radius",
    },
    radialOuterRadius: {
      control: { type: "range", min: 70, max: 130, step: 1 },
      if: { arg: "variant", eq: "middleCenter" },
      name: "Outer radius",
    },
    radialPulseAmplitude: {
      control: { type: "range", min: 0, max: 80, step: 1 },
      if: { arg: "variant", eq: "middleCenter" },
      name: "Bar variation",
    },
    radialStrokeWidth: {
      control: { type: "range", min: 0.2, max: 4, step: 0.1 },
      if: { arg: "variant", eq: "middleCenter" },
      name: "Stroke width",
    },
    rippleSpeed: {
      control: { type: "range", min: 0.1, max: 4, step: 0.1 },
      if: { arg: "variant", eq: "topCenter" },
      name: "Ripple travel speed",
    },
    transitionProgress: {
      control: { type: "range", min: 0, max: 1, step: 0.01 },
      name: "Transition progress",
    },
    transitionScale: {
      control: { type: "range", min: 0, max: 1.5, step: 0.05 },
      name: "Transition start scale",
    },
    variant: { control: false },
  },
  parameters: {
    minimalProviders: true,
    layout: "centered",
  },
  args: {
    previewPadding: 32,
    previewSize: 760,
  },
  decorators: [
    (Story, context) => {
      const { previewPadding = 32, previewSize = 760 } =
        context.args as VisualizerStoryArgs;

      return (
        <Box
          sx={{
            alignItems: "center",
            aspectRatio: "1",
            bgcolor: "#21102f",
            display: "flex",
            justifyContent: "center",
            maxWidth: "calc(100vw - 48px)",
            p: `${previewPadding}px`,
            width: previewSize,
            "& > *": {
              width: "100%",
            },
            "& svg": {
              display: "block",
              height: "auto",
              width: "100%",
            },
          }}
        >
          <Story />
        </Box>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<VisualizerStoryArgs>;

const FLOWING_COLOR_STOPS = [
  { color: "#00b8e6", offset: 0 },
  { color: "#4b48db", offset: 0.28 },
  { color: "#ee2b91", offset: 0.52 },
  { color: "#ffad26", offset: 0.72 },
  { color: "#1198e2", offset: 1 },
];

const RADIAL_COLOR_STOPS = [
  { color: "#fc3384", offset: 0 },
  { color: "#e933a2", offset: 0.3 },
  { color: "#ffab38", offset: 0.52 },
  { color: "#d243d6", offset: 0.75 },
  { color: "#f82e8d", offset: 1 },
];

function mergeFrequencyLevels(
  liveLevels: FrequencyLevels,
  controlLevels: FrequencyLevels = {},
): FrequencyLevels {
  return Object.fromEntries(
    Object.entries(FREQUENCY_BANDS).map(([band]) => [
      band,
      Math.max(
        liveLevels[band as keyof typeof FREQUENCY_BANDS] ?? 0,
        controlLevels[band as keyof typeof FREQUENCY_BANDS] ?? 0,
      ),
    ]),
  ) as FrequencyLevels;
}

function useAudioReactiveSignal(controlLevels: FrequencyLevels = {}) {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const frameRef = React.useRef<number | null>(null);
  const lastAudioUpdateRef = React.useRef(0);
  const audioTimeRef = React.useRef(0);
  const analyserRef = React.useRef<AnalyserNode | null>(null);
  const impactBaselineRef = React.useRef(0);
  const lastThudTimeRef = React.useRef(-Infinity);
  const bassPulseRef = React.useRef(0);
  const lastPulseTickRef = React.useRef<number | null>(null);
  const [energy, setEnergy] = React.useState(0);
  const [bassPulse, setBassPulse] = React.useState(0);
  const [frequencyLevels, setFrequencyLevels] = React.useState({
    air: 0,
    bass: 0,
    highMid: 0,
    lowMid: 0,
    sub: 0,
  });
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [transitionProgress, setTransitionProgress] = React.useState(0);

  React.useEffect(() => {
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      void audioContextRef.current?.close();
    };
  }, []);

  const startAudio = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audioContextRef.current) {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.2;
      const source = audioContext.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
    }

    await audioContextRef.current.resume();
    audio.currentTime = 0;
    const mediaPlay = Object.getOwnPropertyDescriptor(
      HTMLMediaElement.prototype,
      "play",
    )?.value;
    if (typeof mediaPlay !== "function") return;
    await Reflect.apply(mediaPlay, audio, []);
    setIsPlaying(true);

    const frequencyData = new Uint8Array(analyserRef.current.frequencyBinCount);
    const updateEnergy = () => {
      audioTimeRef.current = audio.currentTime;
      const now = performance.now();
      if (now - lastAudioUpdateRef.current < AUDIO_UPDATE_INTERVAL_MS) {
        if (!audio.paused) {
          frameRef.current = requestAnimationFrame(updateEnergy);
        }
        return;
      }
      lastAudioUpdateRef.current = now;
      analyserRef.current?.getByteFrequencyData(frequencyData);
      const average =
        frequencyData.reduce((total, value) => total + value, 0) /
        (frequencyData.length * 255);
      setEnergy(average);
      const entryProgress = Math.min(
        1,
        audio.currentTime / TRANSITION_DURATION_SECONDS,
      );
      const exitProgress = Number.isFinite(audio.duration)
        ? Math.min(
            1,
            Math.max(0, audio.duration - audio.currentTime) /
              TRANSITION_DURATION_SECONDS,
          )
        : 1;
      setTransitionProgress(Math.min(entryProgress, exitProgress));
      const binWidth =
        audioContextRef.current.sampleRate / analyserRef.current.fftSize;
      const measuredLevels = Object.fromEntries(
        Object.entries(FREQUENCY_BANDS).map(([band, [minimum, maximum]]) => {
          const start = Math.floor(minimum / binWidth);
          const end = Math.min(
            frequencyData.length,
            Math.ceil(maximum / binWidth),
          );
          const level =
            frequencyData
              .slice(start, end)
              .reduce((total, value) => total + value, 0) /
            Math.max(1, end - start) /
            255;
          return [band, level];
        }),
      ) as typeof frequencyLevels;
      const rawImpactLevel = Math.max(
        measuredLevels.bass,
        measuredLevels.lowMid * IMPACT_LOW_MID_WEIGHT,
        measuredLevels.highMid * IMPACT_HIGH_MID_WEIGHT,
      );
      const impactBaseline = impactBaselineRef.current;
      const isThud =
        rawImpactLevel - impactBaseline > THUD_TRIGGER_DELTA &&
        audio.currentTime - lastThudTimeRef.current > THUD_RETRIGGER_SECONDS;
      if (isThud) {
        lastThudTimeRef.current = audio.currentTime;
        bassPulseRef.current = 1;
      }
      impactBaselineRef.current =
        impactBaseline +
        (rawImpactLevel - impactBaseline) * THUD_BASELINE_FOLLOW;
      const previousTick = lastPulseTickRef.current ?? audio.currentTime;
      lastPulseTickRef.current = audio.currentTime;
      const elapsedSeconds = Math.max(0, audio.currentTime - previousTick);
      bassPulseRef.current *= Math.exp(
        -THUD_PULSE_DECAY_PER_SECOND * elapsedSeconds,
      );
      setBassPulse(bassPulseRef.current);
      setFrequencyLevels(measuredLevels);
      if (!audio.paused) frameRef.current = requestAnimationFrame(updateEnergy);
    };
    updateEnergy();
  };

  const mixedFrequencyLevels = mergeFrequencyLevels(
    frequencyLevels,
    controlLevels,
  );

  const audioElement = (
    <audio
      ref={audioRef}
      src="/story-mocks/sound-design-elements-sfx-ps-022-302865.mp3"
      preload="auto"
      onEnded={() => {
        setIsPlaying(false);
        setTransitionProgress(0);
      }}
    />
  );

  return {
    audioElement,
    bassPulse,
    energy,
    isPlaying,
    mixedFrequencyLevels,
    audioTimeRef,
    startAudio,
    transitionProgress,
  };
}

function AudioReactiveTopCenterDemo(
  args: Partial<StaticReferenceVisualizerProps>,
) {
  const {
    audioTimeRef,
    audioElement,
    bassPulse,
    energy,
    isPlaying,
    mixedFrequencyLevels,
    startAudio,
    transitionProgress,
  } = useAudioReactiveSignal(args.frequencyLevels);
  const normalizedFrequencyLevels =
    normalizeFrequencyLevels(mixedFrequencyLevels);
  const [visualizerReady, setVisualizerReady] = React.useState(false);
  // 0 = quiet keyframe (args below), 1 = LOUD_THUD_KEYFRAME, driven by the thud pulse.
  const thudAmount = bassPulse;
  const effectiveMaxRadius = (args.flowingMaxRadius ?? 150) + bassPulse * 26;
  // Hidden (scaled past the container, clipped) before playback starts and after it
  // ends; scales back down to reveal the ring only while transitionProgress ramps in.
  const autoHideScale = computeAutoHideScale(effectiveMaxRadius);

  return (
    <Box sx={{ display: "grid", gap: 1.5 }}>
      <button
        disabled={!visualizerReady}
        type="button"
        onClick={() => void startAudio()}
      >
        {visualizerReady ? "Play reactive demo" : "Preparing visualizer..."}
      </button>
      <FlowingReferenceVisualizer
        {...args}
        animated={isPlaying}
        animationTimeRef={audioTimeRef}
        onReady={() => setVisualizerReady(true)}
        animationIntensity={lerp(
          args.animationIntensity ?? 0.25,
          LOUD_THUD_KEYFRAME.animationIntensity,
          thudAmount,
        )}
        animationSpeed={
          lerp(
            args.animationSpeed ?? 0.05,
            LOUD_THUD_KEYFRAME.animationSpeed,
            thudAmount,
          ) * musicIntensityScale(MUSIC_INTENSITY_SPEED_RANGE, energy)
        }
        flowingBaseRadius={
          (args.flowingBaseRadius ?? 50) +
          (normalizedFrequencyLevels.bass ?? 0) * 5 +
          energy * 1.5 +
          bassPulse * 28
        }
        flowingAsymmetry={lerp(
          args.flowingAsymmetry ?? 10.5,
          LOUD_THUD_KEYFRAME.flowingAsymmetry,
          thudAmount,
        )}
        flowingCenterRepulsion={lerp(
          args.flowingCenterRepulsion ?? 24,
          LOUD_THUD_KEYFRAME.flowingCenterRepulsion,
          thudAmount,
        )}
        flowingCoilBreakup={lerp(
          args.flowingCoilBreakup ?? 5,
          LOUD_THUD_KEYFRAME.flowingCoilBreakup,
          thudAmount,
        )}
        flowingFillAmount={lerp(
          args.flowingFillAmount ?? 0,
          LOUD_THUD_KEYFRAME.flowingFillAmount,
          thudAmount,
        )}
        flowingChaosIntensity={args.flowingChaosIntensity ?? 0}
        flowingLobeAmplitude={
          lerp(
            args.flowingLobeAmplitude ?? 12,
            LOUD_THUD_KEYFRAME.flowingLobeAmplitude,
            thudAmount,
          ) * musicIntensityScale(MUSIC_INTENSITY_AMPLITUDE_RANGE, energy)
        }
        flowingMaxRadius={effectiveMaxRadius}
        flowingOpacityNoise={args.flowingOpacityNoise ?? 0.2}
        flowingResponsiveStrandRatio={lerp(
          args.flowingResponsiveStrandRatio ?? 1,
          LOUD_THUD_KEYFRAME.flowingResponsiveStrandRatio,
          thudAmount,
        )}
        flowingRippleAmplitude={
          lerp(
            args.flowingRippleAmplitude ?? 0,
            LOUD_THUD_KEYFRAME.flowingRippleAmplitude,
            thudAmount,
          ) * musicIntensityScale(MUSIC_INTENSITY_AMPLITUDE_RANGE, energy)
        }
        flowingRippleIrregularity={lerp(
          args.flowingRippleIrregularity ?? 0,
          LOUD_THUD_KEYFRAME.flowingRippleIrregularity,
          thudAmount,
        )}
        flowingRipplePhase={
          (args.flowingRipplePhase ?? 0) + energy * MUSIC_INTENSITY_PHASE_GAIN
        }
        flowingRotationSpeed={
          (args.flowingRotationSpeed ?? 0) *
          musicIntensityScale(MUSIC_INTENSITY_ROTATION_RANGE, energy)
        }
        flowingSoftBlur={lerp(
          args.flowingSoftBlur ?? 0,
          LOUD_THUD_KEYFRAME.flowingSoftBlur,
          thudAmount,
        )}
        flowingSpreadAmplitude={
          (args.flowingSpreadAmplitude ?? 0) +
          (normalizedFrequencyLevels.bass ?? 0) * 3 +
          bassPulse * 10
        }
        flowingStrokeWidth={(args.flowingStrokeWidth ?? 0.8) + bassPulse * 1}
        flowingSwimAmplitude={
          (lerp(
            args.flowingSwimAmplitude ?? 7.5,
            LOUD_THUD_KEYFRAME.flowingSwimAmplitude,
            thudAmount,
          ) +
            (normalizedFrequencyLevels.lowMid ?? 0) * 7) *
          musicIntensityScale(MUSIC_INTENSITY_AMPLITUDE_RANGE, energy)
        }
        flowingWidthNoise={args.flowingWidthNoise ?? 0.2}
        frequencyLevels={normalizedFrequencyLevels}
        rippleSpeed={
          (args.rippleSpeed ?? 0.8) *
          musicIntensityScale(MUSIC_INTENSITY_SPEED_RANGE, energy)
        }
        title={args.title ?? "Audio-reactive layered six-lobed waveform"}
        transitionProgress={transitionProgress}
        transitionScale={autoHideScale}
      />
      {audioElement}
    </Box>
  );
}

function AudioReactiveMiddleCenterDemo(
  args: Partial<StaticReferenceVisualizerProps>,
) {
  const { audioElement, mixedFrequencyLevels, startAudio, transitionProgress } =
    useAudioReactiveSignal(args.frequencyLevels);

  return (
    <Box sx={{ display: "grid", gap: 1.5 }}>
      <button type="button" onClick={() => void startAudio()}>
        Play reactive demo
      </button>
      <RadialReferenceVisualizer
        frequencyLevels={mixedFrequencyLevels}
        radialBarCount={args.radialBarCount ?? 194}
        radialBarSectors={args.radialBarSectors}
        radialColorStops={args.radialColorStops}
        radialInnerRadius={args.radialInnerRadius}
        radialOuterRadius={args.radialOuterRadius}
        radialPulseAmplitude={args.radialPulseAmplitude}
        radialStrokeWidth={args.radialStrokeWidth}
        title="Audio-reactive radial bar visualizer"
        transitionScale={args.transitionScale}
        transitionProgress={args.transitionProgress ?? 1}
      />
      {audioElement}
    </Box>
  );
}

export const TopCenter: Story = {
  args: {
    animated: true,
    animationFrameRate: 30,
    animationIntensity: 1,
    animationSpeed: 1,
    flowingBaseRadius: 110,
    flowingCoilBreakup: 0,
    flowingLineCount: 26,
    flowingLineBundles: [
      { opacity: 1.2, position: 0.15, width: 0.1, widthMultiplier: 1.35 },
      { opacity: 0.7, position: 0.5, width: 0.08, widthMultiplier: 0.65 },
      { opacity: 1.15, position: 0.82, width: 0.12, widthMultiplier: 1.2 },
    ],
    flowingLobeAmplitude: 30,
    flowingMaxRadius: 138,
    flowingOpacityNoise: 0,
    flowingResponsiveStrandRatio: 0.35,
    flowingRippleIrregularity: 14,
    flowingRippleClumps: [
      { intensity: 4, phase: 0, position: 0.8, width: 0.45 },
      { intensity: 6, phase: 2.1, position: 3.15, width: 0.32 },
      { intensity: 3, phase: 4.2, position: 5.2, width: 0.5 },
    ],
    flowingRipplePhase: 6.25,
    flowingRippleAmplitude: 7,
    flowingSampleCount: 96,
    flowingSwimAmplitude: 6,
    flowingAsymmetry: 3.5,
    flowingColorStops: FLOWING_COLOR_STOPS,
    flowingChaosIntensity: 0.2,
    flowingSoftBlur: 0.7,
    flowingRotationSpeed: 18,
    flowingStrokeWidth: 1.2,
    flowingSpreadAmplitude: 0,
    flowingWidthNoise: 0.9,
    frequencyLevels: {
      air: 0,
      bass: 0,
      highMid: 0,
      lowMid: 0,
      sub: 0,
    },
    rippleSpeed: 1.6,
    title: "Layered six-lobed audio waveform",
    variant: "topCenter",
  },
};

export const AnimatedTopCenter: Story = {
  args: {
    ...TopCenter.args,
    animated: true,
    title: "Animated layered six-lobed audio waveform",
    flowingCoilBreakup: 14,
    flowingLineCount: 22,
    flowingOpacityNoise: 0.8,
    flowingRippleAmplitude: 9.5,
    flowingSwimAmplitude: 11.5,
    flowingAsymmetry: 16,
    flowingSoftBlur: 3,
    flowingStrokeWidth: 1.8,
    flowingSampleCount: 84,
    rippleSpeed: 3.2,
    frequencyLevels: {},
  },
};

export const AudioReactiveTopCenter: Story = {
  args: {
    ...AnimatedTopCenter.args,
    animated: true,
    flowingBaseRadius: 60,
    flowingFillAmount: 0,

    flowingLineBundles: [
      {
        band: "sub",
        gain: 1,
        opacity: 1.2,
        position: 0.15,
        width: 0.1,
        widthMultiplier: 1.35,
      },
      {
        band: "highMid",
        gain: 1.2,
        opacity: 0.7,
        position: 0.5,
        width: 0.08,
        widthMultiplier: 0.65,
      },
      {
        band: "air",
        gain: 1,
        opacity: 1.15,
        position: 0.82,
        width: 0.12,
        widthMultiplier: 1.2,
      },
    ],

    flowingMaxRadius: 150,

    frequencyLevels: {
      air: 0,
      bass: 0,
      highMid: 0,
      lowMid: 0,
      sub: 0,
    },

    title: "Audio-reactive layered six-lobed waveform",
    variant: "topCenter",
    previewPadding: 0,
    previewSize: 340,
    animationFrameRate: 33,
    animationSpeed: 0.05,
    flowingCoilBreakup: 5,
    flowingLineCount: 63,
    flowingLobeAmplitude: 12,
    flowingResponsiveStrandRatio: 1,
    flowingRippleIrregularity: 0,
    flowingRippleAmplitude: 0,

    flowingRippleClumps: [
      {
        band: "bass",
        gain: 1.2,
        intensity: 4,
        phase: 0,
        position: 0.8,
        width: 0.45,
      },
      {
        band: "lowMid",
        gain: 1,
        intensity: 6,
        phase: 2.1,
        position: 3.15,
        width: 0.32,
      },
      {
        band: "highMid",
        gain: 0.8,
        intensity: 3,
        phase: 4.2,
        position: 5.2,
        width: 0.5,
      },
    ],

    flowingSampleCount: 78,
    flowingSwimAmplitude: 7.5,
    flowingRotationSpeed: -180,
    flowingStrokeWidth: 1.6,
    flowingSpreadAmplitude: 0,
    rippleSpeed: 1.3,
    transitionScale: 1.5,
    transitionProgress: 1,
    animationIntensity: 0.25,
    flowingOpacityNoise: 0.8,
    flowingRipplePhase: 0,
    flowingAsymmetry: 10.5,
    flowingChaosIntensity: 0,
    flowingSoftBlur: 0,
    flowingCenterRepulsion: 24,
  },
  render: (args) => <AudioReactiveTopCenterDemo {...args} />,
};

export const AudioReactiveMiddleCenter: Story = {
  args: {
    frequencyLevels: {
      air: 0,
      bass: 0,
      highMid: 0,
      lowMid: 0,
      sub: 0,
    },
    radialBarCount: 194,
    radialBarSectors: [
      {
        arcWidth: 0.8,
        band: "bass",
        gain: 1.2,
        lengthMultiplier: 1.6,
        opacityMultiplier: 1.15,
        startAngle: -1.8,
        strokeMultiplier: 1.3,
      },
      {
        arcWidth: 0.55,
        band: "highMid",
        gain: 1,
        lengthMultiplier: 1.4,
        opacityMultiplier: 1.25,
        startAngle: 0.4,
        strokeMultiplier: 1.15,
      },
      {
        arcWidth: 0.7,
        band: "air",
        gain: 0.8,
        lengthMultiplier: 1.2,
        opacityMultiplier: 1.35,
        startAngle: 2.5,
        strokeMultiplier: 0.9,
      },
    ],
    radialColorStops: RADIAL_COLOR_STOPS,
    radialInnerRadius: 77,
    radialOuterRadius: 88,
    radialPulseAmplitude: 78,
    radialStrokeWidth: 2.5,
    title: "Audio-reactive radial bar visualizer",
    variant: "middleCenter",
  },
  render: (args) => <AudioReactiveMiddleCenterDemo {...args} />,
};

export const MiddleCenter: Story = {
  args: {
    radialBarCount: 194,
    radialBarSectors: [
      {
        arcWidth: 0.8,
        band: "bass",
        gain: 1.2,
        lengthMultiplier: 1.6,
        opacityMultiplier: 1.15,
        startAngle: -1.8,
        strokeMultiplier: 1.3,
      },
      {
        arcWidth: 0.55,
        band: "highMid",
        gain: 1,
        lengthMultiplier: 1.4,
        opacityMultiplier: 1.25,
        startAngle: 0.4,
        strokeMultiplier: 1.15,
      },
      {
        arcWidth: 0.7,
        band: "air",
        gain: 0.8,
        lengthMultiplier: 1.2,
        opacityMultiplier: 1.35,
        startAngle: 2.5,
        strokeMultiplier: 0.9,
      },
    ],
    radialColorStops: RADIAL_COLOR_STOPS,
    radialInnerRadius: 77,
    radialOuterRadius: 88,
    radialPulseAmplitude: 78,
    radialStrokeWidth: 2.5,
    title: "Radial audio equalizer ring",
    variant: "middleCenter",
  },
};
