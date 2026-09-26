/**
 * Pure helpers for the Admin Analytics dashboard: trend series shaping and
 * statistical anomaly detection (z-score vs. the series mean).
 */

export interface TrendPoint {
  date: string;
  value: number;
}

export interface MetricSeries {
  key: string;
  label: string;
  points: TrendPoint[];
}

export interface Anomaly {
  metricKey: string;
  metricLabel: string;
  date: string;
  value: number;
  mean: number;
  stdDev: number;
  direction: "above" | "below";
  severity: "warning" | "error";
}

const Z_SCORE_WARNING = 2;
const Z_SCORE_ERROR = 3;
// Fewer points than this makes mean/stdDev too noisy to flag outliers reliably.
const MIN_POINTS_FOR_DETECTION = 5;

function meanOf(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function stdDevOf(values: number[], mean: number): number {
  const variance =
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Flags points whose z-score vs. the series mean exceeds the warning threshold.
 * Returns [] when there isn't enough data or the series has zero variance.
 */
export function detectMetricAnomalies(
  metricKey: string,
  metricLabel: string,
  points: TrendPoint[],
): Anomaly[] {
  if (points.length < MIN_POINTS_FOR_DETECTION) return [];
  const values = points.map((p) => p.value);
  const mean = meanOf(values);
  const stdDev = stdDevOf(values, mean);
  if (stdDev === 0) return [];

  const anomalies: Anomaly[] = [];
  for (const p of points) {
    const z = (p.value - mean) / stdDev;
    const absZ = Math.abs(z);
    if (absZ < Z_SCORE_WARNING) continue;
    anomalies.push({
      metricKey,
      metricLabel,
      date: p.date,
      value: p.value,
      mean,
      stdDev,
      direction: z > 0 ? "above" : "below",
      severity: absZ >= Z_SCORE_ERROR ? "error" : "warning",
    });
  }
  return anomalies;
}

/** Runs anomaly detection across multiple metric series, newest first. */
export function detectAnomaliesAcrossMetrics(
  metricSeries: MetricSeries[],
): Anomaly[] {
  return metricSeries
    .flatMap(({ key, label, points }) =>
      detectMetricAnomalies(key, label, points),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
}
