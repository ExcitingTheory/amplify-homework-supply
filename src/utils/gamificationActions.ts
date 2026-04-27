/**
 * Frontend helpers to call gamification mutations.
 *
 * These wrap the Amplify Data Client custom mutations defined in
 * amplify/data/resource.ts and backed by the gamification Lambda.
 *
 * @module gamificationActions
 */

import { getAmplifyClient } from './amplifyClient'

export interface AwardXPResult {
  alreadyAwarded: boolean
  xpAmount: number
  totalXP: number
}

/**
 * Award XP to a student and automatically run badge checks + streak update.
 *
 * @param studentId - Cognito sub of the student
 * @param reason    - One of the XPReason enum values (must match schema enum)
 * @param referenceId - Optional dedup key (gradeId, blockId, roomId, etc.)
 * @returns The parsed awardXP result, or null on error
 */
export async function awardXPAndCheck(
  studentId: string,
  reason: string,
  referenceId?: string,
): Promise<AwardXPResult | null> {
  try {
    const client = getAmplifyClient()

    // 1. Award XP
    const { data: xpResult, errors: xpErrors } = await client.mutations.awardXP({
      studentId,
      reason,
      referenceId: referenceId ?? null,
    })

    if (xpErrors?.length) {
      console.error('[gamificationActions] awardXP errors:', xpErrors)
      return null
    }

    const parsed: AwardXPResult =
      typeof xpResult === 'string' ? JSON.parse(xpResult) : xpResult

    // 2. Check badges (fire-and-forget — don't block the caller)
    client.mutations
      .checkBadges({ studentId })
      .catch((err: any) =>
        console.error('[gamificationActions] checkBadges error:', err),
      )

    // 3. Update streak (fire-and-forget)
    client.mutations
      .updateStreak({ studentId })
      .catch((err: any) =>
        console.error('[gamificationActions] updateStreak error:', err),
      )

    return parsed
  } catch (err) {
    console.error('[gamificationActions] awardXPAndCheck error:', err)
    return null
  }
}

/**
 * Update per-unit learning memory after a Grade or PracticeSession completion.
 * Merges new weak/strong concepts into the student's unit memory and
 * triggers a fire-and-forget profile rebuild.
 *
 * @param studentId - Cognito sub of the student
 * @param unitID    - The unit the student just practiced/completed
 * @param accuracy  - Overall accuracy (0–100) for this session
 * @param weakAreas - Concept strings where accuracy < 70%
 * @param strongAreas - Concept strings where accuracy >= 90%
 * @param options   - Optional: confusionPairs, accuracyBySource, sourceType
 */
export async function updateUnitMemoryAndRebuild(
  studentId: string,
  unitID: string,
  accuracy: number,
  weakAreas: string[],
  strongAreas: string[],
  options?: {
    confusionPairs?: Array<{ item1: string; item2: string; frequency: number }>
    accuracyBySource?: Record<string, number>
    sourceType?: string
  },
): Promise<void> {
  try {
    const client = getAmplifyClient()

    // 1. Update unit-level memory (blocking — we want this to succeed)
    const { errors } = await client.mutations.updateStudentUnitMemoryFromGrade({
      studentId,
      unitID,
      accuracy,
      weakAreas: weakAreas ?? [],
      strongAreas: strongAreas ?? [],
      confusionPairs: options?.confusionPairs ?? [],
      accuracyBySource: options?.accuracyBySource ?? {},
      sourceType: options?.sourceType ?? 'practice',
    })

    if (errors?.length) {
      console.error('[gamificationActions] updateStudentUnitMemoryFromGrade errors:', errors)
      return
    }

    // 2. Rebuild central profile (fire-and-forget)
    client.mutations
      .rebuildStudentMemoryProfile({ studentId })
      .catch((err: any) =>
        console.error('[gamificationActions] rebuildStudentMemoryProfile error:', err),
      )
  } catch (err) {
    console.error('[gamificationActions] updateUnitMemoryAndRebuild error:', err)
  }
}
