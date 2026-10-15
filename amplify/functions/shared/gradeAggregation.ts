/**
 * Shared "which stat counts as the grade" logic for the gradeRollupStream
 * Lambda. Mirrors the equivalent JS copy in src/utils/gradeAggregation.js (no
 * cross-boundary imports between amplify/ and src/ in this repo, so the small
 * pure logic is duplicated rather than shared across the runtime boundary).
 */

export const DEFAULT_GRADE_AGGREGATION_METHOD = "MAX";

export interface GradeAggregationOverride {
  unitID: string;
  method: string;
}

export interface SectionGradeAggregationConfig {
  gradeAggregationMethod?: string | null;
  gradeAggregationOverrides?: (GradeAggregationOverride | null)[] | null;
}

/** Resolves the effective method for a unit: per-assignment override wins, else the section-wide default, else MAX. */
export function resolveGradeAggregationMethod(
  section: SectionGradeAggregationConfig | null | undefined,
  unitID: string,
): string {
  if (!section) return DEFAULT_GRADE_AGGREGATION_METHOD;
  const overrides = section.gradeAggregationOverrides || [];
  const override = overrides.find((o) => o != null && o.unitID === unitID);
  return (
    override?.method ||
    section.gradeAggregationMethod ||
    DEFAULT_GRADE_AGGREGATION_METHOD
  );
}

/** Aggregates a student's attempt accuracies into "the" grade under the given method. */
export function computeAggregatedGrade(
  method: string,
  values: number[],
): number | null {
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
