import { defineFunction } from "@aws-amplify/backend";

/**
 * Grade Rollup Stream Lambda
 *
 * Triggered by DynamoDB Streams on the Grade table (INSERT only — Grade rows
 * are append-only, one per workbook/practice-drill attempt).
 *
 * Maintains two Lambda-only-writable rollup fields so the instructor
 * dashboard never has to scan every raw attempt:
 *  - Assignment.gradeSummary  — per unit, bounded by the section's roster size
 *  - Section.studentProgress  — per student, bounded by units assigned in the section
 *
 * Both are recomputed from the small stored per-student/per-unit maps on
 * each write, never from the Grade table itself — a student retrying a unit
 * N times only ever updates one entry, not N rows.
 */
export const gradeRollupStreamHandler = defineFunction({
  timeoutSeconds: 60,
  memoryMB: 256,
  resourceGroupName: "data",
});
