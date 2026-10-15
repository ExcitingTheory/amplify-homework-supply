/**
 * Grade Rollup Stream Handler
 *
 * Processes DynamoDB Stream INSERT events from the Grade table and maintains
 * three Lambda-only-writable rollup fields:
 *
 *  - Assignment.gradeSummary  — { perStudentBest, submittedCount, lastComputedAt }
 *    Recomputed from perStudentBest (bounded by roster size), never by
 *    re-reading every Grade attempt for the unit.
 *  - Assignment.classStats    — { avg, min, max, count }, derived from the same
 *    perStudentBest.best values but with no studentId keys — the one slice of
 *    the rollup safe for the assigned student (Learners group) to read directly.
 *  - Section.studentProgress  — { [studentId]: { perUnitBest, averageGrade,
 *    unitsCompleted, lastActive } }
 *    Recomputed from perUnitBest (bounded by units assigned in the section).
 *  - Section.activityFeed     — { activityByDay, recentActivity, recentGradeIds,
 *    lastComputedAt }, bounded to a trailing day/entry window — backs the
 *    instructor dashboard's recent-activity and weekly-participation views
 *    without scanning every Grade row in the section.
 *
 * All fields are plain JSON strings (this codebase's convention for a.json()
 * fields — see Section.gradeOverrides/accommodations for the same pattern).
 *
 * Hardening:
 *  - `_version` is a plain app-convention field, not an AppSync/DataStore
 *    conflict-detection field — nothing stops two concurrent invocations
 *    (different stream shards touching the same Assignment/Section) from
 *    racing. Every write below uses the generated `condition` argument
 *    (`_version: { eq }`) and retries with a fresh re-read on mismatch.
 *  - DynamoDB Streams + Lambda is at-least-once: a redelivered batch must not
 *    double-count. Each Grade row's own `id` is tracked (bounded window) so
 *    replays are no-ops rather than inflating `attempts`.
 *  - Only permanently-unresolvable cases (no Assignment/Section row yet) are
 *    swallowed; everything else is rethrown so Lambda's built-in retry / the
 *    event source's DLQ destination can see it, instead of silently dropping
 *    a transient failure.
 */

import type { DynamoDBStreamHandler } from "aws-lambda";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import {
  MAX_RETRY_ATTEMPTS,
  sleep,
  backoffMs,
  isConditionalCheckFailure,
} from "../shared/concurrency";
import {
  resolveGradeAggregationMethod,
  computeAggregatedGrade,
  type SectionGradeAggregationConfig,
} from "../shared/gradeAggregation";

const GET_ASSIGNMENT = /* GraphQL */ `
  query GetAssignment($id: ID!) {
    getAssignment(id: $id) {
      id
      gradeSummary
      classStats
      lateStatus
      _version
    }
  }
`;

// Lightweight — only the fields needed to resolve the configured grade-aggregation
// method, cached per sectionID so a batch touching multiple units in the same
// section doesn't re-fetch it once per unit.
const GET_SECTION_GRADE_CONFIG = /* GraphQL */ `
  query GetSectionGradeConfig($id: ID!) {
    getSection(id: $id) {
      id
      gradeAggregationMethod
      gradeAggregationOverrides {
        unitID
        method
      }
    }
  }
`;

const LIST_ASSIGNMENTS_BY_SECTION_AND_UNIT = /* GraphQL */ `
  query ListAssignmentsBySectionAndUnit($sectionID: ID!, $unitID: ID!) {
    listAssignments(
      filter: { sectionID: { eq: $sectionID }, unitID: { eq: $unitID } }
    ) {
      items {
        id
        gradeSummary
        classStats
        lateStatus
        _version
      }
    }
  }
`;

const UPDATE_ASSIGNMENT = /* GraphQL */ `
  mutation UpdateAssignment(
    $input: UpdateAssignmentInput!
    $condition: ModelAssignmentConditionInput
  ) {
    updateAssignment(input: $input, condition: $condition) {
      id
      _version
    }
  }
`;

const GET_SECTION = /* GraphQL */ `
  query GetSection($id: ID!) {
    getSection(id: $id) {
      id
      studentProgress
      activityFeed
      gradeAggregationMethod
      gradeAggregationOverrides {
        unitID
        method
      }
      _version
    }
  }
`;

const UPDATE_SECTION = /* GraphQL */ `
  mutation UpdateSection(
    $input: UpdateSectionInput!
    $condition: ModelSectionConditionInput
  ) {
    updateSection(input: $input, condition: $condition) {
      id
      _version
    }
  }
`;

// ============================================================================
// Client Setup — IAM, same pattern as leaderboardStream/handler.ts
// ============================================================================

let client: any = null;

function getClient(): any {
  if (!client) {
    Amplify.configure(
      {
        API: {
          GraphQL: {
            endpoint: process.env.API_ENDPOINT!,
            defaultAuthMode: "iam",
            region: process.env.AWS_REGION!,
          },
        },
      },
      {
        Auth: {
          credentialsProvider: {
            getCredentialsAndIdentityId: async () => ({
              credentials: await fromNodeProviderChain()(),
            }),
            clearCredentialsAndIdentityId: () => {},
          },
        },
      },
    );
    client = generateClient({ authMode: "iam" });
  }
  return client;
}

function parseJsonField(value: unknown): any {
  if (value == null) return null;
  try {
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    return null;
  }
}

interface GradeRecord {
  id: string;
  owner: string;
  unitID: string;
  sectionID: string;
  accuracy: number;
  engagedTimeMs: number;
}

interface StudentBest {
  best: number;
  /** Lowest accuracy seen across attempts — needed for the MIN aggregation method. */
  worst: number;
  /** Running sum of every counted attempt's accuracy — exact AVG regardless of attempt count. */
  sum: number;
  attempts: number;
  firstCompletedAt: string;
  /** Sum of engagedTimeMs across every counted attempt — a real time-on-task signal, not a proxy. */
  totalEngagedTimeMs: number;
  /** Bounded window of Grade row ids already counted into `attempts` — makes stream redelivery a no-op instead of double-counting. */
  recentGradeIds: string[];
  /** Bounded window of raw accuracies, aligned with recentGradeIds, used to compute MEDIAN (approximate once attempts exceed the window). */
  recentValues: number[];
  /** "The" grade for this assignment under the section's configured aggregation method (MIN | MAX | AVG | MEDIAN). */
  effective: number;
}

const RECENT_GRADE_IDS_CAP = 50;

/** Merge this batch's per-student grade records into an existing perStudentBest map, deduping by Grade row id. */
function mergeStudentBests(
  perStudentBest: Record<string, StudentBest>,
  studentRecords: Map<string, GradeRecord[]>,
  now: string,
  method: string,
): Record<string, StudentBest> {
  for (const [studentId, gradeRecords] of studentRecords) {
    const existing = perStudentBest[studentId];
    const seen = new Set(existing?.recentGradeIds || []);
    let best = existing?.best;
    let worst = existing?.worst;
    let sum = existing?.sum || 0;
    let attempts = existing?.attempts || 0;
    let firstCompletedAt = existing?.firstCompletedAt;
    let totalEngagedTimeMs = existing?.totalEngagedTimeMs || 0;
    const recentGradeIds = [...(existing?.recentGradeIds || [])];
    const recentValues = [...(existing?.recentValues || [])];

    for (const g of gradeRecords) {
      if (seen.has(g.id)) continue; // Already counted — redelivered batch, not a new attempt.
      seen.add(g.id);
      recentGradeIds.push(g.id);
      recentValues.push(g.accuracy);
      attempts += 1;
      sum += g.accuracy;
      totalEngagedTimeMs += g.engagedTimeMs || 0;
      if (best === undefined || g.accuracy > best) best = g.accuracy;
      if (worst === undefined || g.accuracy < worst) worst = g.accuracy;
      if (!firstCompletedAt) firstCompletedAt = now;
    }

    const boundedGradeIds = recentGradeIds.slice(-RECENT_GRADE_IDS_CAP);
    const boundedValues = recentValues.slice(-RECENT_GRADE_IDS_CAP);
    perStudentBest[studentId] = {
      best: best ?? 0,
      worst: worst ?? 0,
      sum,
      attempts,
      firstCompletedAt: firstCompletedAt || now,
      totalEngagedTimeMs,
      recentGradeIds: boundedGradeIds,
      recentValues: boundedValues,
      effective: computeAggregatedGrade(method, boundedValues) ?? best ?? 0,
    };
  }
  return perStudentBest;
}

/** Anonymous aggregate over perStudentBest.effective values — no studentId keys, safe for Learners to read. */
function computeClassStats(
  perStudentBest: Record<string, StudentBest>,
): { avg: number; min: number; max: number; count: number } | null {
  const effectives = Object.values(perStudentBest).map((s) => s.effective);
  if (effectives.length === 0) return null;
  return {
    avg: effectives.reduce((sum, v) => sum + v, 0) / effectives.length,
    min: Math.min(...effectives),
    max: Math.max(...effectives),
    count: effectives.length,
  };
}

interface ActivityEntry {
  owner: string;
  unitID: string;
  accuracy: number;
  timestamp: string;
}

const RECENT_ACTIVITY_CAP = 10;
const ACTIVITY_DAY_WINDOW = 14;

/** Merge this batch's grade records into a section-wide activity feed, deduping by Grade row id. */
function mergeActivityFeed(
  activityFeed: {
    activityByDay?: Record<string, number>;
    recentActivity?: ActivityEntry[];
    recentGradeIds?: string[];
  },
  sectionRecords: GradeRecord[],
  now: string,
): {
  activityByDay: Record<string, number>;
  recentActivity: ActivityEntry[];
  recentGradeIds: string[];
  lastComputedAt: string;
} {
  const seen = new Set(activityFeed.recentGradeIds || []);
  const activityByDay = { ...(activityFeed.activityByDay || {}) };
  const recentActivity = [...(activityFeed.recentActivity || [])];
  const recentGradeIds = [...(activityFeed.recentGradeIds || [])];
  const today = now.slice(0, 10); // YYYY-MM-DD

  for (const r of sectionRecords) {
    if (seen.has(r.id)) continue; // Already counted — redelivered batch, not a new event.
    seen.add(r.id);
    recentGradeIds.push(r.id);
    activityByDay[today] = (activityByDay[today] || 0) + 1;
    recentActivity.push({
      owner: r.owner,
      unitID: r.unitID,
      accuracy: r.accuracy,
      timestamp: now,
    });
  }

  // Prune day buckets outside the trailing window instead of letting the map grow forever.
  const cutoff = Date.now() - ACTIVITY_DAY_WINDOW * 86400000;
  const prunedActivityByDay: Record<string, number> = {};
  for (const [date, count] of Object.entries(activityByDay)) {
    if (new Date(date).getTime() >= cutoff) prunedActivityByDay[date] = count;
  }

  return {
    activityByDay: prunedActivityByDay,
    recentActivity: recentActivity.slice(-RECENT_ACTIVITY_CAP),
    recentGradeIds: recentGradeIds.slice(-RECENT_GRADE_IDS_CAP),
    lastComputedAt: now,
  };
}

// ============================================================================
// Stream Handler
// ============================================================================

export const handler: DynamoDBStreamHandler = async (event) => {
  const gqlClient = getClient();

  const records: GradeRecord[] = [];
  for (const rec of event.Records) {
    if (rec.eventName !== "INSERT") continue;
    const img = rec.dynamodb?.NewImage;
    if (!img) continue;

    const complete = img.complete?.BOOL === true;
    const accuracy = img.accuracy?.N ? parseFloat(img.accuracy.N) : null;
    const unitID = img.unitID?.S;
    const sectionID = img.sectionID?.S;
    const owner = img.owner?.S;
    const id = img.id?.S;
    const engagedTimeMs = img.engagedTimeMs?.N
      ? parseFloat(img.engagedTimeMs.N)
      : 0;
    // Mirrors the client-side `completedGrades` filter in InstructorDashboard —
    // only completed, scored, section-linked grades feed the rollups.
    if (
      !complete ||
      accuracy == null ||
      !unitID ||
      !sectionID ||
      !owner ||
      !id
    ) {
      continue;
    }
    records.push({ id, owner, unitID, sectionID, accuracy, engagedTimeMs });
  }
  if (records.length === 0) return;

  // Group per (section, unit) assignment, then per student, keeping every grade
  // record (not just the best) so attempt-counting can dedupe by Grade row id.
  const byAssignment = new Map<string, Map<string, GradeRecord[]>>();
  const sectionsTouched = new Set<string>();
  for (const r of records) {
    const key = `${r.sectionID}|${r.unitID}`;
    const studentRecords =
      byAssignment.get(key) || new Map<string, GradeRecord[]>();
    const list = studentRecords.get(r.owner) || [];
    list.push(r);
    studentRecords.set(r.owner, list);
    byAssignment.set(key, studentRecords);
    sectionsTouched.add(r.sectionID);
  }

  // --- 1. Assignment.gradeSummary — per unit, bounded by roster size, not attempts ---
  // Cache each distinct section's grade-aggregation config for this batch so a
  // batch touching multiple units in the same section fetches it only once.
  const sectionGradeConfigCache = new Map<
    string,
    SectionGradeAggregationConfig
  >();
  // Assignments flagged lateStatus DROPPED by the instructor — their grades are
  // excluded from both this pass and the Section.studentProgress pass below.
  const droppedAssignmentKeys = new Set<string>();
  async function getSectionGradeConfig(
    sectionID: string,
  ): Promise<SectionGradeAggregationConfig> {
    const cached = sectionGradeConfigCache.get(sectionID);
    if (cached) return cached;
    const { data } = await gqlClient.graphql({
      query: GET_SECTION_GRADE_CONFIG,
      variables: { id: sectionID },
    });
    const config: SectionGradeAggregationConfig = data?.getSection || {};
    sectionGradeConfigCache.set(sectionID, config);
    return config;
  }

  for (const [key, studentRecords] of byAssignment) {
    const [sectionID, unitID] = key.split("|");
    try {
      const sectionGradeConfig = await getSectionGradeConfig(sectionID);
      const method = resolveGradeAggregationMethod(sectionGradeConfig, unitID);
      const { data: listData } = await gqlClient.graphql({
        query: LIST_ASSIGNMENTS_BY_SECTION_AND_UNIT,
        variables: { sectionID, unitID },
      });
      const assignmentId = listData?.listAssignments?.items?.[0]?.id;
      if (!assignmentId) continue; // No Assignment row for this (section, unit) yet — permanent for this event, not retryable.

      let current = listData.listAssignments.items[0];
      if (current.lateStatus === "DROPPED") {
        droppedAssignmentKeys.add(key);
        continue; // Dropped late work — excluded from grade averages/curves/completion.
      }
      for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
        if (attempt > 0) {
          const { data } = await gqlClient.graphql({
            query: GET_ASSIGNMENT,
            variables: { id: assignmentId },
          });
          current = data?.getAssignment;
          if (!current) break; // Assignment was deleted concurrently — nothing left to roll up into.
        }

        const summary = parseJsonField(current.gradeSummary) || {};
        const perStudentBest: Record<string, StudentBest> = mergeStudentBests(
          summary.perStudentBest || {},
          studentRecords,
          new Date().toISOString(),
          method,
        );
        const expectedVersion = current._version ?? 1;

        try {
          await gqlClient.graphql({
            query: UPDATE_ASSIGNMENT,
            variables: {
              input: {
                id: assignmentId,
                gradeSummary: JSON.stringify({
                  perStudentBest,
                  submittedCount: Object.keys(perStudentBest).length,
                  lastComputedAt: new Date().toISOString(),
                }),
                classStats: JSON.stringify(computeClassStats(perStudentBest)),
                _version: expectedVersion + 1,
              },
              condition: { _version: { eq: expectedVersion } },
            },
          });
          break; // Success.
        } catch (err) {
          if (
            isConditionalCheckFailure(err) &&
            attempt < MAX_RETRY_ATTEMPTS - 1
          ) {
            await sleep(backoffMs(attempt));
            continue; // Re-read and retry with fresh data.
          }
          throw err; // Exhausted retries or a non-conflict error — surface it.
        }
      }
    } catch (err) {
      console.error("[gradeRollupStream] Assignment rollup failed:", key, err);
      throw err; // Transient/unexpected — let Lambda retry the batch / route to the DLQ.
    }
  }

  // --- 2. Section.studentProgress — per student, bounded by units assigned in the section ---
  for (const sectionID of sectionsTouched) {
    const sectionRecords = records.filter(
      (r) =>
        r.sectionID === sectionID &&
        !droppedAssignmentKeys.has(`${r.sectionID}|${r.unitID}`),
    );
    if (sectionRecords.length === 0) continue; // Every touched assignment in this section was dropped.
    try {
      let current: any;
      for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
        const { data } = await gqlClient.graphql({
          query: GET_SECTION,
          variables: { id: sectionID },
        });
        current = data?.getSection;
        if (!current) break; // No Section row — permanent for this event.

        const studentProgress = parseJsonField(current.studentProgress) || {};
        const now = new Date().toISOString();

        for (const r of sectionRecords) {
          const student = studentProgress[r.owner] || {
            perUnitStats: {},
            perUnitEffective: {},
            recentGradeIds: [],
          };
          // Back-compat: older rollup payloads only had perUnitBest — upgrade in place.
          if (!student.perUnitStats) student.perUnitStats = {};
          if (!student.perUnitEffective) student.perUnitEffective = {};
          const seen = new Set<string>(student.recentGradeIds || []);
          if (!seen.has(r.id)) {
            seen.add(r.id);
            student.recentGradeIds = [
              ...(student.recentGradeIds || []),
              r.id,
            ].slice(-RECENT_GRADE_IDS_CAP);
            const existingStats = student.perUnitStats[r.unitID] || {
              best: r.accuracy,
              worst: r.accuracy,
              sum: 0,
              attempts: 0,
              recentValues: [],
            };
            existingStats.best = Math.max(existingStats.best, r.accuracy);
            existingStats.worst = Math.min(existingStats.worst, r.accuracy);
            existingStats.sum += r.accuracy;
            existingStats.attempts += 1;
            existingStats.recentValues = [
              ...(existingStats.recentValues || []),
              r.accuracy,
            ].slice(-RECENT_GRADE_IDS_CAP);
            student.perUnitStats[r.unitID] = existingStats;

            const method = resolveGradeAggregationMethod(current, r.unitID);
            student.perUnitEffective[r.unitID] =
              computeAggregatedGrade(method, existingStats.recentValues) ??
              existingStats.best;
          }
          const effectives = Object.values(
            student.perUnitEffective,
          ) as number[];
          student.averageGrade =
            effectives.reduce((sum, v) => sum + v, 0) / effectives.length;
          student.unitsCompleted = effectives.length;
          student.lastActive = now;
          studentProgress[r.owner] = student;
        }

        const activityFeed = mergeActivityFeed(
          parseJsonField(current.activityFeed) || {},
          sectionRecords,
          now,
        );

        const expectedVersion = current._version ?? 1;
        try {
          await gqlClient.graphql({
            query: UPDATE_SECTION,
            variables: {
              input: {
                id: sectionID,
                studentProgress: JSON.stringify(studentProgress),
                activityFeed: JSON.stringify(activityFeed),
                _version: expectedVersion + 1,
              },
              condition: { _version: { eq: expectedVersion } },
            },
          });
          break; // Success.
        } catch (err) {
          if (
            isConditionalCheckFailure(err) &&
            attempt < MAX_RETRY_ATTEMPTS - 1
          ) {
            await sleep(backoffMs(attempt));
            continue; // Re-read and retry with fresh data.
          }
          throw err;
        }
      }
    } catch (err) {
      console.error(
        "[gradeRollupStream] Section rollup failed:",
        sectionID,
        err,
      );
      throw err;
    }
  }
};
