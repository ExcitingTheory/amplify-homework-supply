// Shared "which stat counts as the grade" logic for the Gradebook and
// InstructorDashboard. Mirrors the equivalent TS copy in
// amplify/functions/shared/gradeAggregation.ts (no cross-boundary imports
// between amplify/ and src/ in this repo, so the small pure logic is
// duplicated rather than shared across the Lambda/frontend boundary).

export const GRADE_AGGREGATION_METHODS = ["MIN", "MAX", "AVG", "MEDIAN"];

export const GRADE_AGGREGATION_LABELS = {
  MIN: "Lowest",
  MAX: "Highest",
  AVG: "Average",
  MEDIAN: "Median",
};

export const DEFAULT_GRADE_AGGREGATION_METHOD = "MAX";

/** Aggregates a student's attempt accuracies into "the" grade under the given method. */
export function computeAggregatedGrade(method, values) {
  if (!values || values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  switch (method) {
    case "MIN":
      return sorted[0];
    case "AVG":
      return values.reduce((sum, v) => sum + v, 0) / values.length;
    case "MEDIAN": {
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 !== 0
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;
    }
    case "MAX":
    default:
      return sorted[sorted.length - 1];
  }
}

/** Picks the actual attempt closest to the aggregated value — used for click-to-review when the method isn't a literal single attempt (AVG/MEDIAN). */
export function pickRepresentativeGrade(attempts, targetAccuracy) {
  if (!attempts || attempts.length === 0 || targetAccuracy == null) return null;
  let best = attempts[0];
  let bestDiff = Math.abs(best.accuracy - targetAccuracy);
  for (const g of attempts) {
    const diff = Math.abs(g.accuracy - targetAccuracy);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = g;
    }
  }
  return best;
}
