import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import * as React from "react";
import { Box } from "@mui/material";

import StaticReferenceVisualizer from "./StaticReferenceVisualizer";

const FREQUENCY_BANDS = {
  air: [8000, 16000],
  bass: [60, 250],
  highMid: [2000, 8000],
  lowMid: [250, 2000],
  sub: [20, 60],
} as const;
const TRANSITION_DURATION_SECONDS = 0.6;

function quantizeLevel(value: number): number {
  return Math.round(Math.min(1, value * 3) * 4) / 4;
}

const meta: Meta<typeof StaticReferenceVisualizer> = {
  title: "Editor3/Static Reference Visualizer",
  component: StaticReferenceVisualizer,
  argTypes: {
    animated: {
      control: "boolean",
      if: { arg: "variant", eq: "topCenter" },
      name: "Animate",
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
      control: { type: "range", min: 40, max: 110, step: 1 },
      if: { arg: "variant", eq: "topCenter" },
      name: "Base radius",
    },
    flowingCoilBreakup: {
      control: { type: "range", min: 0, max: 14, step: 0.5 },
      if: { arg: "variant", eq: "topCenter" },
      name: "Coil breakup",
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
    flowingOpacityNoise: {
      control: { type: "range", min: 0, max: 0.8, step: 0.05 },
      if: { arg: "variant", eq: "topCenter" },
      name: "Opacity variation",
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
    variant: { control: false },
  },
  parameters: {
    minimalProviders: true,
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <Box
        sx={{
          alignItems: "center",
          aspectRatio: "1",
          bgcolor: "#21102f",
          display: "flex",
          p: 3,
          width: 360,
        }}
      >
        <Story />
      </Box>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof StaticReferenceVisualizer>;

function AudioReactiveTopCenterDemo() {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const frameRef = React.useRef<number | null>(null);
  const analyserRef = React.useRef<AnalyserNode | null>(null);
  const [energy, setEnergy] = React.useState(0);
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
      analyser.smoothingTimeConstant = 0.78;
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
      setFrequencyLevels(
        Object.fromEntries(
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
            return [band, quantizeLevel(level)];
          }),
        ),
      );
      if (!audio.paused) frameRef.current = requestAnimationFrame(updateEnergy);
    };
    updateEnergy();
  };

  return (
    <Box sx={{ display: "grid", gap: 1.5 }}>
      <button type="button" onClick={() => void startAudio()}>
        Play reactive demo
      </button>
      <StaticReferenceVisualizer
        animated={isPlaying}
        animationIntensity={0.2 + energy * 0.8}
        animationSpeed={0.25 + energy * 0.9}
        flowingOpacityNoise={0.2 + energy * 0.6}
        frequencyLevels={frequencyLevels}
        flowingRippleIrregularity={2 + energy * 12}
        flowingRippleAmplitude={3 + energy * 10}
        flowingSwimAmplitude={3 + energy * 7}
        flowingAsymmetry={1.5 + energy * 4.5}
        flowingSoftBlur={0.3 + energy * 1.4}
        flowingRotationSpeed={isPlaying ? 18 + energy * 110 : 0}
        flowingStrokeWidth={0.8 + energy * 1.1}
        flowingWidthNoise={0.2 + energy * 0.65}
        rippleSpeed={0.8 + energy * 2.4}
        title="Audio-reactive layered six-lobed waveform"
        transitionProgress={transitionProgress}
        variant="topCenter"
      />
      <StaticReferenceVisualizer
        frequencyLevels={frequencyLevels}
        radialBarCount={194}
        title="Audio-reactive radial bar visualizer"
        transitionProgress={transitionProgress}
        variant="middleCenter"
      />
      <audio
        ref={audioRef}
        src="/story-mocks/sound-design-elements-sfx-ps-022-302865.mp3"
        preload="auto"
        onEnded={() => {
          setIsPlaying(false);
          setTransitionProgress(0);
        }}
      />
    </Box>
  );
}

export const TopCenter: Story = {
  args: {
    animated: true,
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
    flowingOpacityNoise: 0,
    flowingRippleIrregularity: 14,
    flowingRippleClumps: [
      { intensity: 4, phase: 0, position: 0.8, width: 0.45 },
      { intensity: 6, phase: 2.1, position: 3.15, width: 0.32 },
      { intensity: 3, phase: 4.2, position: 5.2, width: 0.5 },
    ],
    flowingRipplePhase: 6.25,
    flowingRippleAmplitude: 7,
    flowingSwimAmplitude: 6,
    flowingAsymmetry: 3.5,
    flowingSoftBlur: 0.7,
    flowingRotationSpeed: 18,
    flowingStrokeWidth: 1.2,
    flowingWidthNoise: 0.9,
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
    flowingOpacityNoise: 0.8,
    flowingRippleAmplitude: 9.5,
    flowingSwimAmplitude: 11.5,
    flowingAsymmetry: 16,
    flowingSoftBlur: 3,
    flowingStrokeWidth: 1.8,
    rippleSpeed: 3.2,
    frequencyLevels: {}
  },
};

export const AudioReactiveTopCenter: Story = {
  render: () => <AudioReactiveTopCenterDemo />,
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
    radialInnerRadius: 77,
    radialOuterRadius: 88,
    radialPulseAmplitude: 78,
    radialStrokeWidth: 2.5,
    title: "Radial audio equalizer ring",
    variant: "middleCenter",
  },
};
