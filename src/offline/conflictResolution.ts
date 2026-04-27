/**
 * Conflict Resolution for offline sync.
 *
 * When a grade is synced after being edited offline, the server _version may
 * have advanced. This module handles version conflicts using the strategy:
 * "student data wins" — the student's local answers are canonical.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ConflictResolutionResult {
  resolved: boolean;
  strategy: 'local-wins' | 'merge' | 'server-wins';
  mergedData?: Record<string, unknown>;
  requiresInstructorReview?: boolean;
}

interface GradeBlockData {
  complete?: boolean;
  accuracy?: number;
  userAnswer?: string;
  gradedOffline?: boolean;
  [key: string]: unknown;
}

// ── Implementation ────────────────────────────────────────────────────────────

/**
 * Resolve a version conflict between local and server grade data.
 *
 * Strategy: Student answers (userAnswer, complete, accuracy) always come
 * from the local version. Server-only fields (instructor feedback) are
 * preserved from the server version. If block-level accuracy differs by
 * more than 15 points, flag for instructor review.
 */
export function resolveGradeConflict(
  localData: Record<string, GradeBlockData>,
  serverData: Record<string, GradeBlockData>,
): ConflictResolutionResult {
  const merged: Record<string, GradeBlockData> = { ...serverData };
  let requiresReview = false;

  for (const [blockId, localBlock] of Object.entries(localData)) {
    const serverBlock = serverData[blockId];

    if (!serverBlock) {
      // Block only exists locally — keep it
      merged[blockId] = { ...localBlock, gradedOffline: true };
      continue;
    }

    // Student answers always win
    merged[blockId] = {
      ...serverBlock,
      userAnswer: localBlock.userAnswer ?? serverBlock.userAnswer,
      complete: localBlock.complete ?? serverBlock.complete,
    };

    // If local was graded offline, keep the offline score but flag for review
    // if it differs significantly from any existing server score
    if (localBlock.gradedOffline) {
      merged[blockId].gradedOffline = true;
      merged[blockId].accuracy = localBlock.accuracy;
      merged[blockId].offlineScore = localBlock.accuracy;

      if (
        serverBlock.accuracy != null &&
        localBlock.accuracy != null &&
        Math.abs(serverBlock.accuracy - localBlock.accuracy) > 15
      ) {
        requiresReview = true;
        merged[blockId].serverScore = serverBlock.accuracy;
      }
    }
  }

  return {
    resolved: true,
    strategy: 'local-wins',
    mergedData: merged,
    requiresInstructorReview: requiresReview,
  };
}

/**
 * Attempt to update a grade on the server, handling _version conflicts.
 *
 * @param client — Amplify data client
 * @param gradeId — grade to update
 * @param localData — the student's local grade data (parsed JSON)
 * @param localVersion — the _version from when the grade was cached locally
 */
export async function syncGradeWithConflictResolution(
  client: {
    models: {
      Grade: {
        get: (args: { id: string }) => Promise<{ data: any }>;
        update: (args: Record<string, unknown>) => Promise<{ data: any }>;
      };
    };
  },
  gradeId: string,
  localData: Record<string, GradeBlockData>,
  localVersion?: number,
): Promise<{ success: boolean; requiresReview: boolean }> {
  // Fetch current server state
  const { data: serverGrade } = await client.models.Grade.get({ id: gradeId });

  if (!serverGrade) {
    throw new Error(`Grade ${gradeId} not found on server`);
  }

  const serverVersion = serverGrade._version ?? 0;

  // No conflict — versions match
  if (localVersion != null && localVersion === serverVersion) {
    await client.models.Grade.update({
      id: gradeId,
      data: JSON.stringify(localData),
      _version: serverVersion,
    });
    return { success: true, requiresReview: false };
  }

  // Version conflict — merge
  const serverData =
    typeof serverGrade.data === 'string'
      ? JSON.parse(serverGrade.data)
      : serverGrade.data ?? {};

  const resolution = resolveGradeConflict(localData, serverData);

  await client.models.Grade.update({
    id: gradeId,
    data: JSON.stringify(resolution.mergedData),
    _version: serverVersion,
  });

  return {
    success: true,
    requiresReview: resolution.requiresInstructorReview ?? false,
  };
}
