import * as React from "react";

const CENTER = 160;
const TAU = Math.PI * 2;
const FLOWING_LINE_COUNT = 54;
const RADIAL_BAR_COUNT = 168;
const FLOWING_BASE_RADIUS = 77;
const FLOWING_LOBE_AMPLITUDE = 22;
const FLOWING_RIPPLE_AMPLITUDE = 4;
const FLOWING_SWIM_AMPLITUDE = 10;
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
  animationIntensity?: number;
  animationSpeed?: number;
  className?: string;
  flowingBaseRadius?: number;
  frequencyLevels?: FrequencyLevels;
  flowingLineBundles?: FlowingLineBundle[];
  flowingCoilBreakup?: number;
  flowingLineCount?: number;
  flowingLobeAmplitude?: number;
  flowingOpacityNoise?: number;
  flowingRippleIrregularity?: number;
  flowingRippleClumps?: FlowingRippleClump[];
  flowingRipplePhase?: number;
  flowingRippleAmplitude?: number;
  flowingRotationSpeed?: number;
  flowingStrokeWidth?: number;
  flowingSwimAmplitude?: number;
  flowingAsymmetry?: number;
  flowingSoftBlur?: number;
  flowingWidthNoise?: number;
  radialBarCount?: number;
  radialBarSectors?: RadialBarSector[];
  radialInnerRadius?: number;
  radialOuterRadius?: number;
  radialPulseAmplitude?: number;
  radialStrokeWidth?: number;
  rippleSpeed?: number;
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
  | "flowingLobeAmplitude"
  | "flowingRippleAmplitude"
  | "flowingRippleIrregularity"
  | "flowingRippleClumps"
  | "flowingAsymmetry"
  | "flowingSwimAmplitude"
> {
  irregularityPhase?: number;
  strandOffset?: number;
}

function formatCoordinate(value: number): string {
  return value.toFixed(2);
}

export function flowingLineNoise(index: number): number {
  const value = Math.sin(index * 12.9898 + 78.233) * 43758.5453;
  return (value - Math.floor(value)) * 2 - 1;
}

export function buildFlowingRingPath(
  phase: number,
  {
    flowingBaseRadius: baseRadius = FLOWING_BASE_RADIUS,
    flowingLobeAmplitude: lobeAmplitude = FLOWING_LOBE_AMPLITUDE,
    flowingRippleIrregularity: rippleIrregularity = FLOWING_RIPPLE_IRREGULARITY,
    flowingRippleClumps: rippleClumps = DEFAULT_RIPPLE_CLUMPS,
    flowingRippleAmplitude: rippleAmplitude = FLOWING_RIPPLE_AMPLITUDE,
    flowingAsymmetry: asymmetry = FLOWING_ASYMMETRY,
    flowingSwimAmplitude: swimAmplitude = FLOWING_SWIM_AMPLITUDE,
    irregularityPhase = 0,
    strandOffset = 0,
  }: FlowingPathOptions = {},
): string {
  const points: string[] = [];
  const sampleCount = 180;

  for (let sample = 0; sample <= sampleCount; sample += 1) {
    const angle = (sample / sampleCount) * TAU;
    const lobe = Math.sin(angle * 6 + phase);
    const ripple = Math.sin(angle * 12 - phase * 0.7);
    const strandDrift = Math.sin(
      angle * (3.4 + strandOffset * 0.35) + phase * 1.1 + strandOffset * 2.6,
    );
    const asymmetryWave =
      Math.sin(angle * 1.8 + irregularityPhase + strandOffset * 1.5) *
        (asymmetry * 0.72) +
      Math.sin(angle * 3.2 - irregularityPhase * 0.8 + strandOffset * 2.1) *
        (asymmetry * 0.25);
    const irregularRipple =
      Math.sin(angle * 7.8 + irregularityPhase + strandOffset) * 0.7 +
      Math.sin(angle * 12.5 - irregularityPhase * 0.8 - strandOffset * 1.2) *
        0.3;
    const clumpRipple = rippleClumps.reduce((total: number, clump) => {
      const distance = Math.atan2(
        Math.sin(angle - clump.position),
        Math.cos(angle - clump.position),
      );
      const envelope = Math.exp(-0.5 * (distance / clump.width) ** 2);
      return (
        total +
        envelope *
          Math.sin(angle * 8.2 + clump.phase + strandOffset) *
          clump.intensity *
          0.72
      );
    }, 0);
    const radius =
      baseRadius +
      lobe * lobeAmplitude +
      ripple * rippleAmplitude +
      strandDrift * swimAmplitude * 0.72 +
      asymmetryWave +
      irregularRipple * rippleIrregularity * 0.68 +
      clumpRipple;
    const x = CENTER + Math.cos(angle) * radius;
    const y = CENTER + Math.sin(angle) * radius;
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

function useAnimationTime(enabled: boolean, speed: number): number {
  const [time, setTime] = React.useState(0);

  React.useEffect(() => {
    if (
      !enabled ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const startTime = performance.now();
    let frameId = 0;

    const tick = (currentTime: number) => {
      setTime(((currentTime - startTime) / 1000) * speed);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [enabled, speed]);

  return enabled ? time : 0;
}

function FlowingRing({
  animationIntensity,
  animationTime,
  baseRadius,
  coilBreakup,
  frequencyLevels,
  lineCount,
  lineBundles,
  lobeAmplitude,
  opacityNoise,
  rippleIrregularity,
  rippleClumps,
  ripplePhase,
  rippleAmplitude,
  rotationSpeed,
  rippleSpeed,
  strokeWidth,
  widthNoise,
  swimAmplitude,
  asymmetry,
  softBlur,
}: {
  animationIntensity: number;
  animationTime: number;
  asymmetry: number;
  baseRadius: number;
  coilBreakup: number;
  frequencyLevels: FrequencyLevels;
  lineCount: number;
  lineBundles: FlowingLineBundle[];
  lobeAmplitude: number;
  opacityNoise: number;
  rippleIrregularity: number;
  rippleClumps: FlowingRippleClump[];
  ripplePhase: number;
  rippleAmplitude: number;
  rotationSpeed: number;
  rippleSpeed: number;
  softBlur: number;
  strokeWidth: number;
  swimAmplitude: number;
  widthNoise: number;
}) {
  return (
    <g
      fill="none"
      stroke="url(#flowing-gradient)"
      transform={`rotate(${animationTime * rotationSpeed * 0.22} ${CENTER} ${CENTER})`}
    >
      {Array.from({ length: lineCount }, (_, index) => {
        const progress = index / (lineCount - 1);
        const noise = flowingLineNoise(index);
        const movement =
          Math.sin(animationTime * 1.15 + index * 0.81) * animationIntensity;
        const strandOffset = index * 0.7 + ripplePhase * 0.9 + animationTime * 0.18;
        const localRotation =
          Math.sin(animationTime * 1.3 + index * 0.62) * rotationSpeed * 0.18 +
          noise * rotationSpeed * 0.08;
        const bundle = lineBundles.reduce(
          (style, clump) => {
            const distance = Math.min(
              Math.abs(progress - clump.position),
              1 - Math.abs(progress - clump.position),
            );
            const influence = Math.exp(-0.5 * (distance / clump.width) ** 2);
            const bandLevel = clump.band
              ? (frequencyLevels[clump.band] ?? 0)
              : 0;
            const pulse = 1 + bandLevel * (clump.gain ?? 1);
            return {
              opacity:
                style.opacity * (1 + (clump.opacity * pulse - 1) * influence),
              width:
                style.width *
                (1 + (clump.widthMultiplier * pulse - 1) * influence),
            };
          },
          { opacity: 1, width: 1 },
        );
        const opacityBase =
          Math.max(
            0.08,
            Math.min(
              1,
              (0.28 + progress * 0.58) *
                (1 + noise * opacityNoise + movement * opacityNoise * 0.35),
            ),
          ) * bundle.opacity;
        const opacity =
          opacityBase * (0.78 + 0.22 * Math.sin(animationTime * 1.7 + index * 0.52));
        const lowOpacity = opacity < 0.28;
        return (
          <path
            d={buildFlowingRingPath(
              progress * TAU + animationTime * animationIntensity * 0.45,
              {
                flowingAsymmetry: asymmetry,
                flowingBaseRadius:
                  baseRadius +
                  noise * coilBreakup +
                  movement * coilBreakup * 0.22,
                flowingSwimAmplitude: swimAmplitude,
                irregularityPhase:
                  index * 2.31 +
                  noise * TAU +
                  ripplePhase +
                  animationTime * rippleSpeed * animationIntensity,
                flowingLobeAmplitude: lobeAmplitude,
                flowingRippleIrregularity: rippleIrregularity,
                flowingRippleClumps: rippleClumps.map((clump) => ({
                  ...clump,
                  intensity:
                    clump.intensity *
                    (1 +
                      (frequencyLevels[clump.band ?? "bass"] ?? 0) *
                        (clump.gain ?? 1)),
                })),
                flowingRippleAmplitude: rippleAmplitude,
                strandOffset,
              },
            )}
            filter={lowOpacity ? "url(#flowing-soft-blur)" : undefined}
            key={index}
            opacity={opacity}
            strokeWidth={Math.max(
              0.1,
              strokeWidth *
                (1 + noise * widthNoise + movement * widthNoise * 0.3) *
                bundle.width,
            )}
            transform={`rotate(${localRotation} ${CENTER} ${CENTER})`}
          />
        );
      })}
    </g>
  );
}

function RadialRing({
  barCount,
  frequencyLevels,
  innerRadius,
  outerRadius,
  pulseAmplitude,
  sectors,
  strokeWidth,
}: {
  barCount: number;
  frequencyLevels: FrequencyLevels;
  innerRadius: number;
  outerRadius: number;
  pulseAmplitude: number;
  sectors: RadialBarSector[];
  strokeWidth: number;
}) {
  return (
    <g
      fill="none"
      stroke="url(#radial-gradient)"
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

export default function StaticReferenceVisualizer({
  animated = false,
  animationIntensity = 0.45,
  animationSpeed = 0.35,
  className,
  flowingBaseRadius = FLOWING_BASE_RADIUS,
  frequencyLevels = {},
  flowingLineBundles = DEFAULT_LINE_BUNDLES,
  flowingCoilBreakup = FLOWING_COIL_BREAKUP,
  flowingLineCount = FLOWING_LINE_COUNT,
  flowingLobeAmplitude = FLOWING_LOBE_AMPLITUDE,
  flowingOpacityNoise = FLOWING_OPACITY_NOISE,
  flowingRippleIrregularity = FLOWING_RIPPLE_IRREGULARITY,
  flowingRippleClumps = DEFAULT_RIPPLE_CLUMPS,
  flowingRipplePhase = FLOWING_RIPPLE_PHASE,
  flowingRippleAmplitude = FLOWING_RIPPLE_AMPLITUDE,
  flowingRotationSpeed = 0,
  flowingStrokeWidth = 1.1,
  flowingSwimAmplitude = FLOWING_SWIM_AMPLITUDE,
  flowingAsymmetry = FLOWING_ASYMMETRY,
  flowingSoftBlur = FLOWING_SOFT_BLUR,
  flowingWidthNoise = FLOWING_WIDTH_NOISE,
  radialBarCount = RADIAL_BAR_COUNT,
  radialBarSectors = DEFAULT_RADIAL_BAR_SECTORS,
  radialInnerRadius = RADIAL_INNER_RADIUS,
  radialOuterRadius = RADIAL_OUTER_RADIUS,
  radialPulseAmplitude = RADIAL_PULSE_AMPLITUDE,
  radialStrokeWidth = 1.65,
  rippleSpeed = 1.6,
  transitionProgress = 1,
  title,
  variant,
}: StaticReferenceVisualizerProps) {
  const animationTime = useAnimationTime(
    animated && variant === "topCenter",
    animationSpeed,
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
          id="flowing-gradient"
          x1="42"
          x2="278"
          y1="32"
          y2="286"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#00b8e6" />
          <stop offset="0.28" stopColor="#4b48db" />
          <stop offset="0.52" stopColor="#ee2b91" />
          <stop offset="0.72" stopColor="#ffad26" />
          <stop offset="1" stopColor="#1198e2" />
        </linearGradient>
        <linearGradient
          id="radial-gradient"
          x1="38"
          x2="282"
          y1="42"
          y2="278"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#fc3384" />
          <stop offset="0.3" stopColor="#e933a2" />
          <stop offset="0.52" stopColor="#ffab38" />
          <stop offset="0.75" stopColor="#d243d6" />
          <stop offset="1" stopColor="#f82e8d" />
        </linearGradient>
        <filter
          id="flowing-soft-blur"
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
        >
          <feGaussianBlur stdDeviation={flowingSoftBlur} />
        </filter>
      </defs>
      <g
        opacity={transitionProgress}
        transform={`translate(0 ${(1 - transitionProgress) * -70}) translate(${CENTER} ${CENTER}) scale(${1 + (1 - transitionProgress) * 0.55}) translate(${-CENTER} ${-CENTER})`}
      >
        {variant === "topCenter" ? (
          <FlowingRing
            animationIntensity={animationIntensity}
            animationTime={animationTime}
            asymmetry={flowingAsymmetry}
            baseRadius={flowingBaseRadius}
            coilBreakup={flowingCoilBreakup}
            frequencyLevels={frequencyLevels}
            lineCount={flowingLineCount}
            lineBundles={flowingLineBundles}
            lobeAmplitude={flowingLobeAmplitude}
            opacityNoise={flowingOpacityNoise}
            rippleIrregularity={flowingRippleIrregularity}
            rippleClumps={flowingRippleClumps}
            ripplePhase={flowingRipplePhase}
            rippleAmplitude={flowingRippleAmplitude}
            rotationSpeed={flowingRotationSpeed}
            rippleSpeed={rippleSpeed}
            softBlur={flowingSoftBlur}
            strokeWidth={flowingStrokeWidth}
            swimAmplitude={flowingSwimAmplitude}
            widthNoise={flowingWidthNoise}
          />
        ) : (
          <RadialRing
            barCount={radialBarCount}
            frequencyLevels={frequencyLevels}
            innerRadius={radialInnerRadius}
            outerRadius={radialOuterRadius}
            pulseAmplitude={radialPulseAmplitude}
            sectors={radialBarSectors}
            strokeWidth={radialStrokeWidth}
          />
        )}
      </g>
    </svg>
  );
}
