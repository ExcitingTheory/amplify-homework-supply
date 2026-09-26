const CENTER = 160;
const TAU = Math.PI * 2;

type FrequencyBand = "sub" | "bass" | "lowMid" | "highMid" | "air";
type FrequencyLevels = Partial<Record<FrequencyBand, number>>;

interface FlowingRippleClump {
  band?: FrequencyBand;
  gain?: number;
  intensity: number;
  phase: number;
  position: number;
  width: number;
}

interface FlowingLineBundle {
  band?: FrequencyBand;
  gain?: number;
  opacity: number;
  position: number;
  width: number;
  widthMultiplier: number;
}

interface FlowingWorkerConfig {
  animationIntensity: number;
  asymmetry: number;
  baseRadius: number;
  centerRepulsion: number;
  chaosIntensity: number;
  coilBreakup: number;
  fillAmount: number;
  effectiveLineCount: number;
  frequencyLevels: FrequencyLevels;
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
}

interface FlowingWorkerLineState {
  points: Float32Array;
  opacity: number;
  strokeWidth: number;
  rotation: number;
}

type WorkerMessage =
  | { config: FlowingWorkerConfig; type: "configure" }
  | { animationTime: number; requestId: number; type: "render" };

interface SampleTable {
  angles: number[];
  cosines: number[];
  sines: number[];
}

const bandOrder: FrequencyBand[] = ["sub", "bass", "lowMid", "highMid", "air"];
const sampleTableCache = new Map<number, SampleTable>();
const noiseCache: number[] = [];

let config: FlowingWorkerConfig | null = null;

function smoothPositiveRadius(value: number): number {
  const softness = 4;
  return value > softness * 5
    ? value
    : softness * Math.log1p(Math.exp(value / softness));
}

function flowingLineNoise(index: number): number {
  if (noiseCache[index] != null) return noiseCache[index];
  const value = Math.sin(index * 12.9898 + 78.233) * 43758.5453;
  const noise = (value - Math.floor(value)) * 2 - 1;
  noiseCache[index] = noise;
  return noise;
}

function getSampleTable(sampleCount: number): SampleTable {
  const cached = sampleTableCache.get(sampleCount);
  if (cached) return cached;

  const angles: number[] = [];
  const cosines: number[] = [];
  const sines: number[] = [];
  for (let sample = 0; sample <= sampleCount; sample += 1) {
    const angle = (sample / sampleCount) * TAU;
    angles.push(angle);
    cosines.push(Math.cos(angle));
    sines.push(Math.sin(angle));
  }

  const table = { angles, cosines, sines };
  sampleTableCache.set(sampleCount, table);
  return table;
}

function buildFlowingRingPath(
  phase: number,
  {
    asymmetry,
    baseRadius,
    centerRepulsion,
    fillAmount,
    chaosIntensity,
    lobeAmplitude,
    maxRadius,
    rippleAmplitude,
    rippleClumps,
    rippleIrregularity,
    sampleCount,
    swimAmplitude,
    irregularityPhase,
    strandOffset,
  }: {
    asymmetry: number;
    baseRadius: number;
    centerRepulsion: number;
    fillAmount: number;
    chaosIntensity: number;
    irregularityPhase: number;
    lobeAmplitude: number;
    maxRadius: number;
    rippleAmplitude: number;
    rippleClumps: FlowingRippleClump[];
    rippleIrregularity: number;
    sampleCount: number;
    strandOffset: number;
    swimAmplitude: number;
  },
): Float32Array {
  const rawPoints = new Float32Array((sampleCount + 1) * 2);
  const chaosBoost = 1 + chaosIntensity * 1.6;
  const { angles, cosines, sines } = getSampleTable(sampleCount);

  for (let sample = 0; sample <= sampleCount; sample += 1) {
    const angle = angles[sample];
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
    const clumpRipple = rippleClumps.reduce((total, clump) => {
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
    const offset = sample * 2;
    rawPoints[offset] = CENTER + cosines[sample] * radius;
    rawPoints[offset + 1] = CENTER + sines[sample] * radius;
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let point = 0; point < rawPoints.length; point += 2) {
    const x = rawPoints[point];
    const y = rawPoints[point + 1];
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }

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

  const points = new Float32Array(rawPoints.length);
  for (let point = 0; point < rawPoints.length; point += 2) {
    const rawX = rawPoints[point];
    const rawY = rawPoints[point + 1];
    const index = point / 2;
    const x = CENTER + (rawX - rawCenterX) * fitScale;
    const y = CENTER + (rawY - rawCenterY) * fitScale;
    points[index * 2] = x;
    points[index * 2 + 1] = y;
  }

  let smoothedPoints = points;
  for (let pass = 0; pass < 2; pass += 1) {
    const nextPoints = new Float32Array(points.length);
    for (let point = 0; point < smoothedPoints.length; point += 2) {
      const previous =
        (point - 2 + smoothedPoints.length) % smoothedPoints.length;
      const next = (point + 2) % smoothedPoints.length;
      nextPoints[point] =
        (smoothedPoints[previous] +
          smoothedPoints[point] * 2 +
          smoothedPoints[next]) /
        4;
      nextPoints[point + 1] =
        (smoothedPoints[previous + 1] +
          smoothedPoints[point + 1] * 2 +
          smoothedPoints[next + 1]) /
        4;
    }
    smoothedPoints = nextPoints;
  }

  const maxSegmentLength = 28;
  for (let point = 0; point < smoothedPoints.length; point += 2) {
    const previous =
      (point - 2 + smoothedPoints.length) % smoothedPoints.length;
    const next = (point + 2) % smoothedPoints.length;
    const currentX = smoothedPoints[point];
    const currentY = smoothedPoints[point + 1];
    const previousDistance = Math.hypot(
      currentX - smoothedPoints[previous],
      currentY - smoothedPoints[previous + 1],
    );
    const nextDistance = Math.hypot(
      currentX - smoothedPoints[next],
      currentY - smoothedPoints[next + 1],
    );
    if (
      previousDistance > maxSegmentLength &&
      nextDistance > maxSegmentLength
    ) {
      smoothedPoints[point] =
        (smoothedPoints[previous] + smoothedPoints[next]) / 2;
      smoothedPoints[point + 1] =
        (smoothedPoints[previous + 1] + smoothedPoints[next + 1]) / 2;
    }
  }

  return smoothedPoints;
}

function computeLineState(
  index: number,
  animationTime: number,
): FlowingWorkerLineState {
  if (!config) throw new Error("Flowing visualizer worker is not configured");

  const progress = index / (config.effectiveLineCount - 1);
  const noise = flowingLineNoise(index);
  const band = bandOrder[index % bandOrder.length];
  const bandLevel = config.frequencyLevels[band] ?? 0;
  const response = bandLevel;
  const spreadDirection = (progress - 0.5) * 2 + noise * 0.18;
  const strandSpread = spreadDirection * config.spreadAmplitude * response;
  const phaseAdvance = animationTime * (0.8 + config.rippleSpeed * 0.3);
  const strandOffset =
    index * 0.7 + config.ripplePhase * 0.9 + phaseAdvance * 0.15;
  const localRotation =
    animationTime *
      config.rotationSpeed *
      Math.sign(noise || 1) *
      (0.04 + Math.abs(noise) * 0.1) +
    noise * config.rotationSpeed * 0.08;
  const bundle = config.lineBundles.reduce(
    (style, clump) => {
      const distance = Math.min(
        Math.abs(progress - clump.position),
        1 - Math.abs(progress - clump.position),
      );
      const influence = Math.exp(-0.5 * (distance / clump.width) ** 2);
      const clumpBandLevel = clump.band
        ? (config?.frequencyLevels[clump.band] ?? 0)
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
      Math.min(1, (0.28 + progress * 0.58) * (1 + noise * config.opacityNoise)),
    ) * bundle.opacity;
  const opacity = opacityBase;

  return {
    points: buildFlowingRingPath(progress * TAU + phaseAdvance, {
      asymmetry: config.asymmetry,
      baseRadius:
        config.baseRadius +
        noise * config.coilBreakup +
        strandSpread * bundle.motion,
      centerRepulsion: config.centerRepulsion,
      fillAmount: config.fillAmount,
      chaosIntensity: config.chaosIntensity,
      irregularityPhase:
        index * 2.31 + noise * TAU + config.ripplePhase + phaseAdvance,
      lobeAmplitude: config.lobeAmplitude,
      maxRadius: config.maxRadius,
      rippleAmplitude: config.rippleAmplitude,
      rippleClumps: config.responsiveRippleClumps,
      rippleIrregularity: config.rippleIrregularity,
      sampleCount: config.sampleCount,
      strandOffset,
      swimAmplitude: config.swimAmplitude,
    }),
    opacity,
    strokeWidth: Math.max(
      0.1,
      config.strokeWidth * (1 + noise * config.widthNoise) * bundle.width,
    ),
    rotation: localRotation,
  };
}

const workerContext = self as unknown as DedicatedWorkerGlobalScope;

workerContext.onmessage = ({ data }: MessageEvent<WorkerMessage>) => {
  if (data.type === "configure") {
    config = data.config;
    getSampleTable(config.sampleCount);
    return;
  }

  if (!config) return;

  const states: FlowingWorkerLineState[] = [];
  for (let index = 0; index < config.effectiveLineCount; index += 1) {
    states.push(computeLineState(index, data.animationTime));
  }

  const message = {
    groupTransform: `rotate(0 ${CENTER} ${CENTER})`,
    requestId: data.requestId,
    states,
    type: "rendered",
  };
  workerContext.postMessage(
    message,
    states.map((state) => state.points.buffer),
  );
};

export {};
