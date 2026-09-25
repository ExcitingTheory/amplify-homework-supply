import * as React from "react";

const CENTER = 160;
const TAU = Math.PI * 2;
const FLOWING_LINE_COUNT = 54;
const FLOWING_SAMPLE_COUNT = 96;
const FLOWING_FRAME_RATE = 30;
const RADIAL_BAR_COUNT = 168;
const FLOWING_BASE_RADIUS = 77;
const FLOWING_LOBE_AMPLITUDE = 22;
const FLOWING_MAX_RADIUS = 138;
const FLOWING_RIPPLE_AMPLITUDE = 4;
const FLOWING_SWIM_AMPLITUDE = 10;
const FLOWING_SPREAD_AMPLITUDE = 0;
const FLOWING_ASYMMETRY = 5;
const FLOWING_SOFT_BLUR = 0.9;
const FLOWING_COIL_BREAKUP = 5;
const FLOWING_OPACITY_NOISE = 0.26;
const FLOWING_RIPPLE_IRREGULARITY = 3;
const FLOWING_RIPPLE_PHASE = 0;
const FLOWING_WIDTH_NOISE = 0.45;
const RADIAL_INNER_RADIUS = 54;
const RADIAL_OUTER_RADIUS = 101;
const RADIAL_PULSE_AMPLITUDE = 47;

export interface VisualizerColorStop {
  color: string;
  offset: number | string;
}

const DEFAULT_FLOWING_COLOR_STOPS: VisualizerColorStop[] = [
  { color: "#00b8e6", offset: 0 },
  { color: "#4b48db", offset: 0.28 },
  { color: "#ee2b91", offset: 0.52 },
  { color: "#ffad26", offset: 0.72 },
  { color: "#1198e2", offset: 1 },
];

const DEFAULT_RADIAL_COLOR_STOPS: VisualizerColorStop[] = [
  { color: "#fc3384", offset: 0 },
  { color: "#e933a2", offset: 0.3 },
  { color: "#ffab38", offset: 0.52 },
  { color: "#d243d6", offset: 0.75 },
  { color: "#f82e8d", offset: 1 },
];

export type FrequencyBand = "sub" | "bass" | "lowMid" | "highMid" | "air";
export type FrequencyLevels = Partial<Record<FrequencyBand, number>>;

export interface FlowingRippleClump {
  band?: FrequencyBand;
  gain?: number;
  intensity: number;
  phase: number;
  position: number;
  width: number;
}

export interface FlowingLineBundle {
  band?: FrequencyBand;
  gain?: number;
  opacity: number;
  position: number;
  width: number;
  widthMultiplier: number;
}

export interface RadialBarSector {
  arcWidth: number;
  band: FrequencyBand;
  gain: number;
  lengthMultiplier: number;
  opacityMultiplier: number;
  startAngle: number;
  strokeMultiplier: number;
}

const DEFAULT_RADIAL_BAR_SECTORS: RadialBarSector[] = [
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
];

const DEFAULT_RIPPLE_CLUMPS: FlowingRippleClump[] = [
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
];

const DEFAULT_LINE_BUNDLES: FlowingLineBundle[] = [
  {
    band: "sub",
    gain: 0.8,
    opacity: 1.2,
    position: 0.15,
    width: 0.1,
    widthMultiplier: 1.35,
  },
  {
    band: "highMid",
    gain: 1.1,
    opacity: 0.7,
    position: 0.5,
    width: 0.08,
    widthMultiplier: 0.65,
  },
  {
    band: "air",
    gain: 0.9,
    opacity: 1.15,
    position: 0.82,
    width: 0.12,
    widthMultiplier: 1.2,
  },
];

export type StaticReferenceVisualizerVariant = "topCenter" | "middleCenter";

export interface StaticReferenceVisualizerProps {
  animated?: boolean;
  animationFrameRate?: number;
  animationTimeRef?: React.RefObject<number>;
  onReady?: () => void;
  animationIntensity?: number;
  animationSpeed?: number;
  className?: string;
  flowingBaseRadius?: number;
  flowingCenterRepulsion?: number;
  flowingColorStops?: VisualizerColorStop[];
  frequencyLevels?: FrequencyLevels;
  flowingLineBundles?: FlowingLineBundle[];
  flowingCoilBreakup?: number;
  flowingFillAmount?: number;
  flowingLineCount?: number;
  flowingLobeAmplitude?: number;
  flowingMaxRadius?: number;
  flowingOpacityNoise?: number;
  flowingResponsiveStrandRatio?: number;
  flowingRippleIrregularity?: number;
  flowingRippleClumps?: FlowingRippleClump[];
  flowingRipplePhase?: number;
  flowingRippleAmplitude?: number;
  flowingSampleCount?: number;
  flowingRotationSpeed?: number;
  flowingStrokeWidth?: number;
  flowingSpreadAmplitude?: number;
  flowingSwimAmplitude?: number;
  flowingAsymmetry?: number;
  flowingChaosIntensity?: number;
  flowingSoftBlur?: number;
  flowingWidthNoise?: number;
  radialBarCount?: number;
  radialColorStops?: VisualizerColorStop[];
  radialBarSectors?: RadialBarSector[];
  radialInnerRadius?: number;
  radialOuterRadius?: number;
  radialPulseAmplitude?: number;
  radialStrokeWidth?: number;
  rippleSpeed?: number;
  transitionScale?: number;
  transitionProgress?: number;
  title?: string;
  variant: StaticReferenceVisualizerVariant;
}

export interface RadialBar {
  angle: number;
  innerRadius: number;
  outerRadius: number;
}

interface FlowingPathOptions extends Pick<
  StaticReferenceVisualizerProps,
  | "flowingBaseRadius"
  | "flowingCenterRepulsion"
  | "flowingFillAmount"
  | "flowingLobeAmplitude"
  | "flowingMaxRadius"
  | "flowingRippleAmplitude"
  | "flowingRippleIrregularity"
  | "flowingSampleCount"
  | "flowingRippleClumps"
  | "flowingAsymmetry"
  | "flowingSwimAmplitude"
  | "flowingChaosIntensity"
> {
  irregularityPhase?: number;
  strandOffset?: number;
}

function formatCoordinate(value: number): string {
  return value.toFixed(2);
}

function smoothPositiveRadius(value: number): number {
  const softness = 4;
  return value > softness * 5
    ? value
    : softness * Math.log1p(Math.exp(value / softness));
}

function useSvgId(prefix: string): string {
  const reactId = React.useId().replace(/:/g, "");
  return `${prefix}-${reactId}`;
}

function renderGradientStops(colorStops: VisualizerColorStop[]) {
  return colorStops.map((stop, index) => (
    <stop
      key={`${stop.offset}-${stop.color}-${index}`}
      offset={stop.offset}
      stopColor={stop.color}
    />
  ));
}

function useArrayControlValue<T>(value: T[] | undefined, fallback: T[]): T[] {
  return Array.isArray(value) ? value : fallback;
}

export function flowingLineNoise(index: number): number {
  const value = Math.sin(index * 12.9898 + 78.233) * 43758.5453;
  return (value - Math.floor(value)) * 2 - 1;
}

export function buildFlowingRingPath(
  phase: number,
  {
    flowingBaseRadius: baseRadius = FLOWING_BASE_RADIUS,
    flowingCenterRepulsion: centerRepulsion = 6,
    flowingFillAmount: fillAmount = 0,
    flowingLobeAmplitude: lobeAmplitude = FLOWING_LOBE_AMPLITUDE,
    flowingMaxRadius: maxRadius = FLOWING_MAX_RADIUS,
    flowingRippleIrregularity: rippleIrregularity = FLOWING_RIPPLE_IRREGULARITY,
    flowingSampleCount: sampleCount = FLOWING_SAMPLE_COUNT,
    flowingRippleClumps: rippleClumps = DEFAULT_RIPPLE_CLUMPS,
    flowingRippleAmplitude: rippleAmplitude = FLOWING_RIPPLE_AMPLITUDE,
    flowingAsymmetry: asymmetry = FLOWING_ASYMMETRY,
    flowingSwimAmplitude: swimAmplitude = FLOWING_SWIM_AMPLITUDE,
    flowingChaosIntensity: chaosIntensity = 0,
    irregularityPhase = 0,
    strandOffset = 0,
  }: FlowingPathOptions = {},
): string {
  const points: string[] = [];
  const rawPoints: Array<[number, number]> = [];
  const chaosBoost = 1 + chaosIntensity * 1.6;

  for (let sample = 0; sample <= sampleCount; sample += 1) {
    const angle = (sample / sampleCount) * TAU;
    const lobe = Math.sin(angle * 6 + phase);
    const ripple = Math.sin(angle * 12 - phase * 0.7);
    const strandDrift = Math.sin(
      angle * (3.4 + strandOffset * 0.35) + phase * 1.1 + strandOffset * 2.6,
    );
    const asymmetryWave =
      Math.sin(
        angle * (1.8 + chaosIntensity * 1.2) +
          irregularityPhase +
          strandOffset * 1.5,
      ) *
        (asymmetry * (0.72 + chaosIntensity * 0.9)) +
      Math.sin(
        angle * (3.2 + chaosIntensity * 1.5) -
          irregularityPhase * 0.8 +
          strandOffset * 2.1,
      ) *
        (asymmetry * (0.25 + chaosIntensity * 0.55));
    const irregularRipple =
      Math.sin(
        angle * (7.8 + chaosIntensity * 3.5) + irregularityPhase + strandOffset,
      ) *
        (0.7 + chaosIntensity * 0.8) +
      Math.sin(
        angle * (12.5 + chaosIntensity * 4.2) -
          irregularityPhase * 0.8 -
          strandOffset * 1.2,
      ) *
        (0.3 + chaosIntensity * 0.4);
    const clumpRipple = rippleClumps.reduce((total: number, clump) => {
      const distance = Math.atan2(
        Math.sin(angle - clump.position),
        Math.cos(angle - clump.position),
      );
      const envelope = Math.exp(-0.5 * (distance / clump.width) ** 2);
      return (
        total +
        envelope *
          Math.sin(
            angle * (8.2 + chaosIntensity * 5.8) + clump.phase + strandOffset,
          ) *
          clump.intensity *
          (0.72 + chaosIntensity * 1.15)
      );
    }, 0);
    const rawRadius =
      baseRadius +
      lobe * lobeAmplitude +
      ripple * rippleAmplitude +
      strandDrift * swimAmplitude * (0.72 + chaosIntensity * 0.2) +
      asymmetryWave +
      irregularRipple * rippleIrregularity * (0.68 + chaosIntensity * 0.7) +
      clumpRipple * chaosBoost;
    const positiveRadius = smoothPositiveRadius(rawRadius);
    const radius =
      positiveRadius +
      centerRepulsion *
        Math.exp(-positiveRadius / Math.max(1, centerRepulsion));
    rawPoints.push([
      CENTER + Math.cos(angle) * radius,
      CENTER + Math.sin(angle) * radius,
    ]);
  }

  const xValues = rawPoints.map(([x]) => x);
  const yValues = rawPoints.map(([, y]) => y);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);
  const rawWidth = maxX - minX;
  const rawHeight = maxY - minY;
  const boxSize = maxRadius * 2;
  const maxFitScale = Math.min(boxSize / rawWidth, boxSize / rawHeight);
  const baseFitScale = Math.min(1, maxFitScale);
  const fitScale =
    baseFitScale +
    Math.min(1, Math.max(0, fillAmount)) * (maxFitScale - baseFitScale);
  const rawCenterX = minX + rawWidth / 2;
  const rawCenterY = minY + rawHeight / 2;

  const fittedPoints = rawPoints.map(([rawX, rawY]) => [
    CENTER + (rawX - rawCenterX) * fitScale,
    CENTER + (rawY - rawCenterY) * fitScale,
  ]);
  for (let point = 0; point < fittedPoints.length; point += 1) {
    const previous =
      fittedPoints[(point - 1 + fittedPoints.length) % fittedPoints.length];
    const current = fittedPoints[point];
    const next = fittedPoints[(point + 1) % fittedPoints.length];
    const x = (previous[0] + current[0] * 2 + next[0]) / 4;
    const y = (previous[1] + current[1] * 2 + next[1]) / 4;
    points.push(`${formatCoordinate(x)} ${formatCoordinate(y)}`);
  }

  return `M ${points.join(" L ")} Z`;
}

export function buildRadialBars(
  count = RADIAL_BAR_COUNT,
  {
    radialInnerRadius: innerRadius = RADIAL_INNER_RADIUS,
    radialOuterRadius: outerRadius = RADIAL_OUTER_RADIUS,
    radialPulseAmplitude: pulseAmplitude = RADIAL_PULSE_AMPLITUDE,
  }: Pick<
    StaticReferenceVisualizerProps,
    "radialInnerRadius" | "radialOuterRadius" | "radialPulseAmplitude"
  > = {},
): RadialBar[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * TAU - Math.PI / 2;
    const noise = (Math.sin(index * 12.9898) * 43758.5453) % 1;
    const normalizedNoise = Math.abs(noise);
    const pulse =
      0.47 +
      Math.sin(angle * 5 + 0.8) * 0.22 +
      Math.sin(angle * 13 - 0.6) * 0.1 +
      normalizedNoise * 0.21;

    return {
      angle,
      innerRadius: innerRadius + normalizedNoise * 5,
      outerRadius: outerRadius + Math.max(0, pulse) * pulseAmplitude,
    };
  });
}

function polarPoint(angle: number, radius: number): [number, number] {
  return [CENTER + Math.cos(angle) * radius, CENTER + Math.sin(angle) * radius];
}

interface FlowingLineState {
  d?: string;
  points?: Float32Array;
  filter?: string;
  opacity: number;
  rotation?: number;
  strokeWidth: number;
  transform: string;
}

interface FlowingWorkerRenderedMessage {
  groupTransform: string;
  requestId: number;
  states: FlowingLineState[];
  type: "rendered";
}

function computeFlowingLineState({
  animationIntensity,
  animationTime,
  asymmetry,
  baseRadius,
  centerRepulsion,
  fillAmount = 0,
  chaosIntensity,
  coilBreakup,
  effectiveLineCount,
  frequencyLevels,
  index,
  lineBundles,
  lobeAmplitude,
  maxRadius,
  opacityNoise,
  responsiveRippleClumps,
  responseInterval,
  rippleAmplitude,
  rippleIrregularity,
  ripplePhase,
  rippleSpeed,
  rotationSpeed,
  sampleCount,
  softBlurFilterId,
  spreadAmplitude,
  strokeWidth,
  swimAmplitude,
  widthNoise,
}: {
  animationIntensity: number;
  animationTime: number;
  asymmetry: number;
  baseRadius: number;
  centerRepulsion: number;
  fillAmount: number;
  chaosIntensity: number;
  coilBreakup: number;
  effectiveLineCount: number;
  frequencyLevels: FrequencyLevels;
  index: number;
  lineBundles: FlowingLineBundle[];
  lobeAmplitude: number;
  maxRadius: number;
  opacityNoise: number;
  responsiveRippleClumps: FlowingRippleClump[];
  responseInterval: number;
  rippleAmplitude: number;
  rippleIrregularity: number;
  ripplePhase: number;
  rippleSpeed: number;
  rotationSpeed: number;
  sampleCount: number;
  softBlurFilterId: string;
  spreadAmplitude: number;
  strokeWidth: number;
  swimAmplitude: number;
  widthNoise: number;
}): FlowingLineState {
  const bandOrder: FrequencyBand[] = [
    "sub",
    "bass",
    "lowMid",
    "highMid",
    "air",
  ];
  const progress = index / (effectiveLineCount - 1);
  const noise = flowingLineNoise(index);
  const band = bandOrder[index % bandOrder.length];
  const bandLevel = frequencyLevels[band] ?? 0;
  const response = bandLevel;
  const spreadDirection = (progress - 0.5) * 2 + noise * 0.18;
  const strandSpread = spreadDirection * spreadAmplitude * response;
  const phaseAdvance = animationTime * (0.8 + rippleSpeed * 0.3);
  const strandOffset = index * 0.7 + ripplePhase * 0.9 + phaseAdvance * 0.15;
  const localRotation =
    animationTime *
      rotationSpeed *
      Math.sign(noise || 1) *
      (0.04 + Math.abs(noise) * 0.1) +
    noise * rotationSpeed * 0.08;
  const bundle = lineBundles.reduce(
    (style, clump) => {
      const distance = Math.min(
        Math.abs(progress - clump.position),
        1 - Math.abs(progress - clump.position),
      );
      const influence = Math.exp(-0.5 * (distance / clump.width) ** 2);
      const clumpBandLevel = clump.band
        ? (frequencyLevels[clump.band] ?? 0)
        : 0;
      return {
        motion:
          style.motion * (1 + clumpBandLevel * (clump.gain ?? 1) * influence),
        opacity: style.opacity * (1 + (clump.opacity - 1) * influence),
        width: style.width * (1 + (clump.widthMultiplier - 1) * influence),
      };
    },
    { motion: 1, opacity: 1, width: 1 },
  );
  const opacityBase =
    Math.max(
      0.08,
      Math.min(1, (0.28 + progress * 0.58) * (1 + noise * opacityNoise)),
    ) * bundle.opacity;
  const opacity = opacityBase;

  return {
    d: buildFlowingRingPath(progress * TAU + phaseAdvance, {
      flowingAsymmetry: asymmetry,
      flowingBaseRadius:
        baseRadius + noise * coilBreakup + strandSpread * bundle.motion + 0,
      flowingCenterRepulsion: centerRepulsion,
      flowingFillAmount: fillAmount,
      flowingChaosIntensity: chaosIntensity,
      flowingMaxRadius: maxRadius,
      flowingSwimAmplitude: swimAmplitude,
      irregularityPhase:
        index * 2.31 + noise * TAU + ripplePhase + phaseAdvance,
      flowingLobeAmplitude: lobeAmplitude,
      flowingRippleIrregularity: rippleIrregularity,
      flowingSampleCount: sampleCount,
      flowingRippleClumps: responsiveRippleClumps,
      flowingRippleAmplitude: rippleAmplitude,
      strandOffset,
    }),
    filter: opacity < 0.28 ? `url(#${softBlurFilterId})` : undefined,
    opacity,
    strokeWidth: Math.max(
      0.1,
      strokeWidth * (1 + noise * widthNoise) * bundle.width,
    ),
    transform: `rotate(${localRotation} ${CENTER} ${CENTER})`,
  };
}

function FlowingRing({
  animated,
  animationFrameRate,
  animationIntensity,
  animationSpeed,
  animationTimeRef,
  onReady,
  className,
  baseRadius,
  centerRepulsion,
  fillAmount,
  coilBreakup,
  frequencyLevels,
  lineCount,
  lineBundles,
  colorStops,
  lobeAmplitude,
  maxRadius,
  opacityNoise,
  responsiveStrandRatio,
  rippleIrregularity,
  rippleClumps,
  ripplePhase,
  rippleAmplitude,
  sampleCount,
  rotationSpeed,
  rippleSpeed,
  softBlurFilterId,
  strokeWidth,
  spreadAmplitude,
  widthNoise,
  swimAmplitude,
  asymmetry,
  chaosIntensity,
  softBlur,
  transitionProgress,
  transitionScale,
  title,
}: {
  animated: boolean;
  animationFrameRate: number;
  animationIntensity: number;
  animationSpeed: number;
  animationTimeRef?: React.RefObject<number>;
  onReady?: () => void;
  className?: string;
  asymmetry: number;
  baseRadius: number;
  centerRepulsion: number;
  fillAmount: number;
  chaosIntensity: number;
  coilBreakup: number;
  frequencyLevels: FrequencyLevels;
  colorStops: VisualizerColorStop[];
  lineCount: number;
  lineBundles: FlowingLineBundle[];
  lobeAmplitude: number;
  maxRadius: number;
  opacityNoise: number;
  responsiveStrandRatio: number;
  rippleIrregularity: number;
  rippleClumps: FlowingRippleClump[];
  ripplePhase: number;
  rippleAmplitude: number;
  sampleCount: number;
  rotationSpeed: number;
  rippleSpeed: number;
  softBlurFilterId: string;
  softBlur: number;
  strokeWidth: number;
  spreadAmplitude: number;
  swimAmplitude: number;
  widthNoise: number;
  transitionProgress: number;
  transitionScale: number;
  title?: string;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const workerRef = React.useRef<Worker | null>(null);
  const workerUnavailableRef = React.useRef(false);
  const requestIdRef = React.useRef(0);
  const inFlightRef = React.useRef(false);
  const pendingAnimationTimeRef = React.useRef<number | null>(null);
  const hasRenderedRef = React.useRef(false);
  const readyRef = React.useRef(false);
  const animationStartTimeRef = React.useRef<number | null>(null);
  const effectiveLineCount = Math.max(12, Math.min(24, Math.round(lineCount)));
  const effectiveSampleCount = Math.min(
    64,
    Math.max(36, Math.round(sampleCount)),
  );
  const responseInterval = Math.max(
    1,
    Math.round(1 / Math.max(0.12, responsiveStrandRatio)),
  );
  const responsiveRippleClumps = rippleClumps;

  React.useEffect(() => {
    if (workerRef.current || workerUnavailableRef.current) return;

    try {
      workerRef.current = new Worker(
        new URL("./StaticReferenceVisualizer.worker.ts", import.meta.url),
        { type: "module" },
      );
    } catch {
      workerUnavailableRef.current = true;
    }

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const gradient = context.createLinearGradient(42, 32, 278, 286);
    colorStops.forEach((stop) => {
      const offset =
        typeof stop.offset === "string" && stop.offset.endsWith("%")
          ? Number.parseFloat(stop.offset) / 100
          : Number(stop.offset);
      if (Number.isFinite(offset)) gradient.addColorStop(offset, stop.color);
    });
    const applyStates = (
      groupTransform: string,
      states: FlowingLineState[],
    ) => {
      if (!readyRef.current) {
        readyRef.current = true;
        onReady?.();
      }
      const rotation = Number(
        groupTransform.match(/rotate\(([-\d.]+)/)?.[1] ?? 0,
      );
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.save();
      context.translate(CENTER, CENTER);
      context.translate(0, (1 - transitionProgress) * -70);
      context.scale(
        1 + (1 - transitionProgress) * transitionScale,
        1 + (1 - transitionProgress) * transitionScale,
      );
      context.rotate((rotation * Math.PI) / 180);
      context.translate(-CENTER, -CENTER);
      context.globalAlpha = transitionProgress;
      context.strokeStyle = gradient;
      context.lineJoin = "round";
      context.lineCap = "round";
      states.forEach((state, index) => {
        const localRotation =
          state.rotation ??
          Number(state.transform.match(/rotate\(([-\d.]+)/)?.[1] ?? 0);
        context.save();
        context.translate(CENTER, CENTER);
        context.rotate((localRotation * Math.PI) / 180);
        context.translate(-CENTER, -CENTER);
        context.globalAlpha = state.opacity;
        context.lineWidth = state.strokeWidth;
        context.filter = state.filter ? `blur(${softBlur}px)` : "none";
        if (state.points) {
          context.beginPath();
          const pointCount = state.points.length / 2;
          const lastPoint = (pointCount - 1) * 2;
          context.moveTo(
            (state.points[lastPoint] + state.points[0]) / 2,
            (state.points[lastPoint + 1] + state.points[1]) / 2,
          );
          for (let point = 0; point < pointCount; point += 1) {
            const offset = point * 2;
            const nextOffset = ((point + 1) % pointCount) * 2;
            context.quadraticCurveTo(
              state.points[offset],
              state.points[offset + 1],
              (state.points[offset] + state.points[nextOffset]) / 2,
              (state.points[offset + 1] + state.points[nextOffset + 1]) / 2,
            );
          }
          context.closePath();
          context.stroke();
        } else if (state.d) {
          context.stroke(new Path2D(state.d));
        }
        context.restore();
      });
      context.restore();
    };

    const renderOnMainThread = (animationTime: number) => {
      const states: FlowingLineState[] = [];
      for (let index = 0; index < effectiveLineCount; index += 1) {
        states.push(
          computeFlowingLineState({
            animationIntensity,
            animationTime,
            asymmetry,
            baseRadius,
            fillAmount,
            chaosIntensity,
            coilBreakup,
            effectiveLineCount,
            frequencyLevels,
            index,
            lineBundles,
            lobeAmplitude,
            maxRadius,
            opacityNoise,
            responsiveRippleClumps,
            responseInterval,
            rippleAmplitude,
            rippleIrregularity,
            ripplePhase,
            rippleSpeed,
            rotationSpeed,
            sampleCount: effectiveSampleCount,
            softBlurFilterId,
            spreadAmplitude,
            strokeWidth,
            swimAmplitude,
            widthNoise,
          }),
        );
      }
      applyStates(`rotate(0 ${CENTER} ${CENTER})`, states);
    };

    const worker = workerRef.current;
    if (worker) {
      inFlightRef.current = false;
      worker.onmessage = ({
        data,
      }: MessageEvent<FlowingWorkerRenderedMessage>) => {
        if (data.type !== "rendered") return;
        if (data.requestId !== requestIdRef.current) return;
        inFlightRef.current = false;
        applyStates(data.groupTransform, data.states);
        const pendingAnimationTime = pendingAnimationTimeRef.current;
        pendingAnimationTimeRef.current = null;
        if (pendingAnimationTime !== null) {
          requestRender(pendingAnimationTime);
        }
      };
      worker.postMessage({
        config: {
          animationIntensity,
          asymmetry,
          baseRadius,
          centerRepulsion,
          fillAmount,
          chaosIntensity,
          coilBreakup,
          effectiveLineCount,
          frequencyLevels,
          lineBundles,
          lobeAmplitude,
          maxRadius,
          opacityNoise,
          responsiveRippleClumps,
          responseInterval,
          rippleAmplitude,
          rippleIrregularity,
          ripplePhase,
          rippleSpeed,
          rotationSpeed,
          sampleCount: effectiveSampleCount,
          softBlurFilterId,
          spreadAmplitude,
          strokeWidth,
          swimAmplitude,
          widthNoise,
        },
        type: "configure",
      });
    }

    const requestRender = (animationTime: number) => {
      const activeWorker = workerRef.current;
      if (!activeWorker) {
        renderOnMainThread(animationTime);
        return;
      }

      if (inFlightRef.current) {
        pendingAnimationTimeRef.current = animationTime;
        return;
      }
      inFlightRef.current = true;
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      activeWorker.postMessage({ animationTime, requestId, type: "render" });
    };

    if (!animated || !hasRenderedRef.current) {
      requestRender(0);
      hasRenderedRef.current = true;
    }
    if (
      !animated ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const startTime =
      animationStartTimeRef.current ??
      (animationStartTimeRef.current = performance.now());
    const frameInterval = 1000 / Math.max(1, animationFrameRate);
    let frameId = 0;
    let lastFrameTime = startTime;

    const tick = (currentTime: number) => {
      if (currentTime - lastFrameTime >= frameInterval) {
        lastFrameTime = currentTime;
        requestRender(
          animationTimeRef?.current ??
            ((currentTime - startTime) / 1000) * animationSpeed,
        );
      }
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frameId);
      if (workerRef.current) workerRef.current.onmessage = null;
      inFlightRef.current = false;
      pendingAnimationTimeRef.current = null;
    };
  }, [
    animated,
    animationFrameRate,
    animationIntensity,
    animationSpeed,
    animationTimeRef,
    onReady,
    asymmetry,
    baseRadius,
    centerRepulsion,
    fillAmount,
    colorStops,
    chaosIntensity,
    coilBreakup,
    effectiveLineCount,
    frequencyLevels,
    lineBundles,
    lobeAmplitude,
    maxRadius,
    opacityNoise,
    responsiveRippleClumps,
    responseInterval,
    rippleAmplitude,
    rippleIrregularity,
    ripplePhase,
    rippleSpeed,
    rotationSpeed,
    effectiveSampleCount,
    softBlurFilterId,
    spreadAmplitude,
    strokeWidth,
    swimAmplitude,
    softBlur,
    transitionProgress,
    transitionScale,
    widthNoise,
  ]);

  return (
    <canvas
      aria-label={title ?? "Flowing audio waveform"}
      className={className}
      height={320}
      ref={canvasRef}
      role="img"
      style={{ display: "block", height: "auto", width: "100%" }}
      width={320}
    />
  );
}

function RadialRing({
  barCount,
  frequencyLevels,
  gradientId,
  innerRadius,
  outerRadius,
  pulseAmplitude,
  sectors,
  strokeWidth,
}: {
  barCount: number;
  frequencyLevels: FrequencyLevels;
  gradientId: string;
  innerRadius: number;
  outerRadius: number;
  pulseAmplitude: number;
  sectors: RadialBarSector[];
  strokeWidth: number;
}) {
  return (
    <g
      fill="none"
      stroke={`url(#${gradientId})`}
      strokeLinecap="round"
      strokeWidth={strokeWidth}
    >
      {buildRadialBars(barCount, {
        radialInnerRadius: innerRadius,
        radialOuterRadius: outerRadius,
        radialPulseAmplitude: pulseAmplitude,
      }).map(
        (
          { angle, innerRadius: barInnerRadius, outerRadius: barOuterRadius },
          index,
        ) => {
          const sector = sectors.reduce(
            (style, currentSector) => {
              const distance = Math.atan2(
                Math.sin(angle - currentSector.startAngle),
                Math.cos(angle - currentSector.startAngle),
              );
              const influence = Math.exp(
                -0.5 * (distance / currentSector.arcWidth) ** 2,
              );
              const level = frequencyLevels[currentSector.band] ?? 0;
              const pulse = 1 + level * currentSector.gain;
              return {
                length:
                  style.length *
                  (1 +
                    (currentSector.lengthMultiplier * pulse - 1) * influence),
                opacity:
                  style.opacity *
                  (1 +
                    (currentSector.opacityMultiplier * pulse - 1) * influence),
                stroke:
                  style.stroke *
                  (1 +
                    (currentSector.strokeMultiplier * pulse - 1) * influence),
              };
            },
            { length: 1, opacity: 1, stroke: 1 },
          );
          const [x1, y1] = polarPoint(angle, barInnerRadius);
          const [x2, y2] = polarPoint(
            angle,
            barInnerRadius + (barOuterRadius - barInnerRadius) * sector.length,
          );
          return (
            <line
              key={index}
              opacity={Math.min(
                1,
                (0.52 + (index % 7) * 0.06) * sector.opacity,
              )}
              strokeWidth={strokeWidth * sector.stroke}
              x1={x1}
              x2={x2}
              y1={y1}
              y2={y2}
            />
          );
        },
      )}
    </g>
  );
}

export type FlowingReferenceVisualizerProps = Omit<
  StaticReferenceVisualizerProps,
  "variant"
>;

export function FlowingReferenceVisualizer({
  animated = false,
  animationFrameRate = FLOWING_FRAME_RATE,
  animationIntensity = 0.45,
  animationSpeed = 0.35,
  animationTimeRef,
  onReady,
  className,
  flowingBaseRadius = FLOWING_BASE_RADIUS,
  flowingCenterRepulsion = 6,
  flowingColorStops = DEFAULT_FLOWING_COLOR_STOPS,
  flowingFillAmount = 0,
  frequencyLevels = {},
  flowingLineBundles = DEFAULT_LINE_BUNDLES,
  flowingCoilBreakup = FLOWING_COIL_BREAKUP,
  flowingLineCount = FLOWING_LINE_COUNT,
  flowingLobeAmplitude = FLOWING_LOBE_AMPLITUDE,
  flowingMaxRadius = FLOWING_MAX_RADIUS,
  flowingOpacityNoise = FLOWING_OPACITY_NOISE,
  flowingResponsiveStrandRatio = 0.35,
  flowingRippleIrregularity = FLOWING_RIPPLE_IRREGULARITY,
  flowingRippleClumps = DEFAULT_RIPPLE_CLUMPS,
  flowingRipplePhase = FLOWING_RIPPLE_PHASE,
  flowingRippleAmplitude = FLOWING_RIPPLE_AMPLITUDE,
  flowingSampleCount = FLOWING_SAMPLE_COUNT,
  flowingRotationSpeed = 0,
  flowingStrokeWidth = 1.1,
  flowingSpreadAmplitude = FLOWING_SPREAD_AMPLITUDE,
  flowingSwimAmplitude = FLOWING_SWIM_AMPLITUDE,
  flowingAsymmetry = FLOWING_ASYMMETRY,
  flowingChaosIntensity = 0,
  flowingSoftBlur = FLOWING_SOFT_BLUR,
  flowingWidthNoise = FLOWING_WIDTH_NOISE,
  rippleSpeed = 1.6,
  transitionScale = 0.55,
  transitionProgress = 1,
  title,
}: FlowingReferenceVisualizerProps) {
  const softBlurFilterId = useSvgId("flowing-soft-blur");
  const colorStops = useArrayControlValue(
    flowingColorStops,
    DEFAULT_FLOWING_COLOR_STOPS,
  );
  const lineBundles = useArrayControlValue(
    flowingLineBundles,
    DEFAULT_LINE_BUNDLES,
  );
  const rippleClumps = useArrayControlValue(
    flowingRippleClumps,
    DEFAULT_RIPPLE_CLUMPS,
  );

  return (
    <FlowingRing
      animated={animated}
      animationFrameRate={animationFrameRate}
      animationIntensity={animationIntensity}
      animationSpeed={animationSpeed}
      animationTimeRef={animationTimeRef}
      onReady={onReady}
      asymmetry={flowingAsymmetry}
      baseRadius={flowingBaseRadius}
      centerRepulsion={flowingCenterRepulsion}
      fillAmount={flowingFillAmount}
      chaosIntensity={flowingChaosIntensity}
      className={className}
      coilBreakup={flowingCoilBreakup}
      colorStops={colorStops}
      frequencyLevels={frequencyLevels}
      lineBundles={lineBundles}
      lineCount={flowingLineCount}
      lobeAmplitude={flowingLobeAmplitude}
      maxRadius={flowingMaxRadius}
      opacityNoise={flowingOpacityNoise}
      responsiveStrandRatio={flowingResponsiveStrandRatio}
      rippleAmplitude={flowingRippleAmplitude}
      rippleClumps={rippleClumps}
      rippleIrregularity={flowingRippleIrregularity}
      ripplePhase={flowingRipplePhase}
      rippleSpeed={rippleSpeed}
      rotationSpeed={flowingRotationSpeed}
      sampleCount={flowingSampleCount}
      softBlur={flowingSoftBlur}
      softBlurFilterId={softBlurFilterId}
      spreadAmplitude={flowingSpreadAmplitude}
      strokeWidth={flowingStrokeWidth}
      swimAmplitude={flowingSwimAmplitude}
      title={title}
      transitionProgress={transitionProgress}
      transitionScale={transitionScale}
      widthNoise={flowingWidthNoise}
    />
  );
}

export type RadialReferenceVisualizerProps = Omit<
  StaticReferenceVisualizerProps,
  "variant"
>;

export function RadialReferenceVisualizer({
  className,
  frequencyLevels = {},
  radialBarCount = RADIAL_BAR_COUNT,
  radialBarSectors = DEFAULT_RADIAL_BAR_SECTORS,
  radialColorStops = DEFAULT_RADIAL_COLOR_STOPS,
  radialInnerRadius = RADIAL_INNER_RADIUS,
  radialOuterRadius = RADIAL_OUTER_RADIUS,
  radialPulseAmplitude = RADIAL_PULSE_AMPLITUDE,
  radialStrokeWidth = 1.65,
  transitionScale = 0.55,
  transitionProgress = 1,
  title,
}: RadialReferenceVisualizerProps) {
  const gradientId = useSvgId("radial-gradient");
  const colorStops = useArrayControlValue(
    radialColorStops,
    DEFAULT_RADIAL_COLOR_STOPS,
  );
  const sectors = useArrayControlValue(
    radialBarSectors,
    DEFAULT_RADIAL_BAR_SECTORS,
  );

  return (
    <svg
      aria-hidden={title ? undefined : true}
      className={className}
      preserveAspectRatio="xMidYMid meet"
      role={title ? "img" : undefined}
      viewBox="0 0 320 320"
      xmlns="http://www.w3.org/2000/svg"
    >
      {title && <title>{title}</title>}
      <defs>
        <linearGradient
          id={gradientId}
          x1="38"
          x2="282"
          y1="42"
          y2="278"
          gradientUnits="userSpaceOnUse"
        >
          {renderGradientStops(colorStops)}
        </linearGradient>
      </defs>
      <g
        opacity={transitionProgress}
        transform={`translate(0 ${(1 - transitionProgress) * -70}) translate(${CENTER} ${CENTER}) scale(${1 + (1 - transitionProgress) * transitionScale}) translate(${-CENTER} ${-CENTER})`}
      >
        <RadialRing
          barCount={radialBarCount}
          frequencyLevels={frequencyLevels}
          gradientId={gradientId}
          innerRadius={radialInnerRadius}
          outerRadius={radialOuterRadius}
          pulseAmplitude={radialPulseAmplitude}
          sectors={sectors}
          strokeWidth={radialStrokeWidth}
        />
      </g>
    </svg>
  );
}

export default function StaticReferenceVisualizer({
  variant,
  ...props
}: StaticReferenceVisualizerProps) {
  return variant === "topCenter" ? (
    <FlowingReferenceVisualizer {...props} />
  ) : (
    <RadialReferenceVisualizer {...props} />
  );
}
