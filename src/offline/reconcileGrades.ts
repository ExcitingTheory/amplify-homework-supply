/**
 * Deferred Grading Reconciliation
 *
 * When a student completes work offline with on-device AI grading then
 * reconnects, this module re-grades with the cloud AI (GPT-4o) for
 * authoritative scoring. If scores differ significantly (>15 points),
 * the submission is flagged for instructor review.
 */

import { getCachedGrade, cacheGrade } from "./OfflineDataStore";
import { syncGradeWithConflictResolution } from "./conflictResolution";
import { gradeShortAnswer } from "../../app/actions/grading";

// ── Types ─────────────────────────────────────────────────────────────────────

interface BlockData {
  complete?: boolean;
  accuracy?: number;
  userAnswer?: string;
  prompt?: string;
  expectedAnswer?: string;
  gradedOffline?: boolean;
  offlineScore?: number;
  reconciledFromOffline?: boolean;
  [key: string]: unknown;
}

export interface ReconciliationResult {
  gradeId: string;
  blocksReconciled: number;
  blocksChanged: number;
  flaggedForReview: boolean;
}

// ── Implementation ────────────────────────────────────────────────────────────

/**
 * Re-grade offline-graded blocks with the cloud AI and update the grade.
 *
 * @param client — Amplify data client (for Grade CRUD + verify queries)
 * @param gradeId — the grade to reconcile
 * @param cloudGrader — function that calls the Lambda grading endpoint
 */
export async function reconcileOfflineGrades(
  client: {
    models: {
      Grade: {
        get: (args: { id: string }) => Promise<{ data: any }>;
        update: (args: Record<string, unknown>) => Promise<{ data: any }>;
      };
    };
    queries?: {
      verifyShortAnswer?: (
        args: Record<string, string>,
      ) => Promise<{ score: number; feedback: string }>;
      verifyDefinition?: (
        args: Record<string, string>,
      ) => Promise<{ score: number; feedback: string }>;
    };
  },
  gradeId: string,
  cloudGrader?: (params: {
    answer: string;
    prompt: string;
    expected: string;
    type: string;
  }) => Promise<{ score: number; feedback: string }>,
): Promise<ReconciliationResult> {
  const localGrade = await getCachedGrade(gradeId);
  if (!localGrade) {
    throw new Error(`Grade ${gradeId} not found in offline store`);
  }

  const gradeData: Record<string, BlockData> = JSON.parse(localGrade.data);
  let blocksReconciled = 0;
  let blocksChanged = 0;
  let flaggedForReview = false;

  for (const [blockId, block] of Object.entries(gradeData)) {
    if (!block.gradedOffline) continue;
    if (!block.userAnswer || !block.expectedAnswer || !block.prompt) continue;

    blocksReconciled++;

    try {
      let serverResult: { score: number; feedback: string } | null = null;

      // Use provided cloud grader, or fall back to Server Action
      if (cloudGrader) {
        serverResult = await cloudGrader({
          answer: block.userAnswer,
          prompt: block.prompt,
          expected: block.expectedAnswer,
          type: "shortAnswer",
        });
      } else {
        serverResult = await gradeShortAnswer({
          question: block.prompt || "",
          answer: block.userAnswer,
          expectedAnswer: block.expectedAnswer,
        });
      }

      if (!serverResult) continue;

      const offlineScore = block.accuracy ?? 0;
      const scoreDiff = Math.abs(serverResult.score - offlineScore);

      if (scoreDiff > 15) {
        // Significant difference — update with server score and flag
        gradeData[blockId] = {
          ...block,
          accuracy: serverResult.score,
          feedback: serverResult.reason,
          reconciledFromOffline: true,
          offlineScore,
        };
        blocksChanged++;
        flaggedForReview = true;
      } else {
        // Minor difference — keep offline score, mark as reconciled
        gradeData[blockId] = {
          ...block,
          reconciledFromOffline: true,
          offlineScore,
        };
      }
    } catch {
      // Cloud grading failed for this block — keep offline score
      console.warn(
        `[Reconciliation] Cloud re-grade failed for block ${blockId}`,
      );
    }
  }

  // Sync to server with conflict resolution
  if (blocksReconciled > 0) {
    const syncResult = await syncGradeWithConflictResolution(
      client,
      gradeId,
      gradeData,
      localGrade.version,
    );
    flaggedForReview = flaggedForReview || syncResult.requiresReview;

    // Update local cache
    await cacheGrade({
      ...localGrade,
      data: JSON.stringify(gradeData),
      synced: 1,
    });
  }

  return {
    gradeId,
    blocksReconciled,
    blocksChanged,
    flaggedForReview,
  };
}
