/**
 * Frontend helpers to call gamification mutations.
 *
 * These wrap the Amplify Data Client custom mutations defined in
 * amplify/data/resource.ts and backed by the gamification Lambda.
 *
 * @module gamificationActions
 */

import { getAmplifyClient } from "./amplifyClient";

export interface AwardXPResult {
  alreadyAwarded: boolean;
  xpAmount: number;
  totalXP: number;
}

/**
 * Award XP to a student and automatically run badge checks + streak update.
 *
 * @param studentId - Cognito sub of the student
 * @param reason    - One of the XPReason enum values (must match schema enum)
 * @param referenceId - Optional dedup key (gradeId, blockId, roomId, etc.)
 * @param cohortId - Optional section/cohort ID for per-section XP tracking
 * @param unitID - Optional unit ID for tracking which unit earned the XP
 * @returns The parsed awardXP result, or null on error
 */
export async function awardXPAndCheck(
  studentId: string,
  reason: string,
  referenceId?: string,
  cohortId?: string,
  unitID?: string,
): Promise<AwardXPResult | null> {
  try {
    const client = getAmplifyClient();

    // 1. Award XP
    const { data: xpResult, errors: xpErrors } = await client.mutations.awardXP(
      {
        studentId,
        reason,
        referenceId: referenceId ?? null,
        cohortId: cohortId ?? null,
        unitID: unitID ?? null,
      },
    );

    if (xpErrors?.length) {
      console.error("[gamificationActions] awardXP errors:", xpErrors);
      return null;
    }

    const parsed: AwardXPResult =
      typeof xpResult === "string" ? JSON.parse(xpResult) : xpResult;

    // 2. Check badges (fire-and-forget — don't block the caller)
    client.mutations
      .checkBadges({ studentId })
      .catch((err: any) =>
        console.error("[gamificationActions] checkBadges error:", err),
      );

    // 3. Update streak (fire-and-forget)
    client.mutations
      .updateStreak({ studentId })
      .catch((err: any) =>
        console.error("[gamificationActions] updateStreak error:", err),
      );

    // 4. Update guild XP if student has guild memberships (fire-and-forget)
    if (parsed && !parsed.alreadyAwarded && parsed.xpAmount > 0) {
      client.mutations
        .updateGuildXP?.({ studentId, xpAmount: parsed.xpAmount })
        ?.catch?.((err: any) =>
          console.error("[gamificationActions] updateGuildXP error:", err),
        );
    }

    return parsed;
  } catch (err) {
    console.error("[gamificationActions] awardXPAndCheck error:", err);
    return null;
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
    confusionPairs?: Array<{ item1: string; item2: string; frequency: number }>;
    accuracyBySource?: Record<string, number>;
    sourceType?: string;
  },
): Promise<void> {
  try {
    const client = getAmplifyClient();

    // 1. Update unit-level memory (blocking — we want this to succeed)
    const { errors } = await client.mutations.updateStudentUnitMemoryFromGrade({
      studentId,
      unitID,
      accuracy,
      weakAreas: weakAreas ?? [],
      strongAreas: strongAreas ?? [],
      confusionPairs: options?.confusionPairs ?? [],
      accuracyBySource: options?.accuracyBySource ?? {},
      sourceType: options?.sourceType ?? "practice",
    });

    if (errors?.length) {
      console.error(
        "[gamificationActions] updateStudentUnitMemoryFromGrade errors:",
        errors,
      );
      return;
    }

    // 2. Rebuild central profile (fire-and-forget)
    client.mutations
      .rebuildStudentMemoryProfile({ studentId })
      .catch((err: any) =>
        console.error(
          "[gamificationActions] rebuildStudentMemoryProfile error:",
          err,
        ),
      );
  } catch (err) {
    console.error(
      "[gamificationActions] updateUnitMemoryAndRebuild error:",
      err,
    );
  }
}

// ============================================================================
// Personal Best Check
// ============================================================================

export interface PersonalBestResult {
  isNewBest: boolean;
  firstAttempt: boolean;
  bestScore: number;
  previousBest: number | null;
}

/**
 * Check whether a student's score beats their personal best for a unit.
 * Awards PERSONAL_BEST XP automatically if it's a new record.
 *
 * @param studentId - Cognito sub of the student
 * @param unitID    - The unit that was completed
 * @param score     - The accuracy/score (0–100) to compare
 * @returns The parsed result, or null on error
 */
export async function checkPersonalBest(
  studentId: string,
  unitID: string,
  score: number,
): Promise<PersonalBestResult | null> {
  try {
    const client = getAmplifyClient();

    const { data, errors } = await client.mutations.checkPersonalBest({
      studentId,
      unitID,
      score,
    });

    if (errors?.length) {
      console.error("[gamificationActions] checkPersonalBest errors:", errors);
      return null;
    }

    return typeof data === "string" ? JSON.parse(data) : (data as any);
  } catch (err) {
    console.error("[gamificationActions] checkPersonalBest error:", err);
    return null;
  }
}

// ============================================================================
// Easter Egg Checks
// ============================================================================

export interface EasterEggResult {
  discovered: Array<{ eggId: string; message: string; xpReward: number }>;
}

/**
 * Scan submission text for keyword-based easter eggs.
 * Also supports TIME_BASED triggers if triggerType is specified.
 */
export async function checkEasterEggs(
  studentId: string,
  submissionText: string,
  triggerType?: string,
): Promise<EasterEggResult | null> {
  try {
    const client = getAmplifyClient();

    const { data, errors } = await client.mutations.checkEasterEggs({
      studentId,
      submissionText,
      triggerType: triggerType ?? null,
    });

    if (errors?.length) {
      console.error("[gamificationActions] checkEasterEggs errors:", errors);
      return null;
    }

    return typeof data === "string" ? JSON.parse(data) : (data as any);
  } catch (err) {
    console.error("[gamificationActions] checkEasterEggs error:", err);
    return null;
  }
}

/**
 * Discover a specific easter egg by ID (for UI_INTERACTION triggers).
 */
export async function discoverEasterEgg(
  studentId: string,
  eggId: string,
): Promise<{
  alreadyDiscovered: boolean;
  message?: string;
  xpReward?: number;
} | null> {
  try {
    const client = getAmplifyClient();

    const { data, errors } = await client.mutations.discoverEasterEgg({
      studentId,
      eggId,
    });

    if (errors?.length) {
      console.error("[gamificationActions] discoverEasterEgg errors:", errors);
      return null;
    }

    return typeof data === "string" ? JSON.parse(data) : (data as any);
  } catch (err) {
    console.error("[gamificationActions] discoverEasterEgg error:", err);
    return null;
  }
}

// ============================================================================
// Generate Skill Tree from Unit Content
// ============================================================================

export interface GenerateSkillTreeResult {
  generated: boolean;
  reason?: string;
  unitID?: string;
  cohortId?: string;
  skillCount?: number;
  skills?: Array<{
    id: string;
    title: string;
    description: string;
    xpReward: number;
    prerequisites: string[];
  }>;
}

/**
 * Calls GPT-4o to analyze a unit's content (text, vocabulary, questions,
 * document objectives) and auto-generate a Skill tree with prerequisite chains.
 *
 * @param unitID   - The unit to extract skills from
 * @param cohortId - Optional cohort to scope the skills to (defaults to `unit-{unitID}`)
 * @returns The generated skill tree result, or null on error
 */
export async function generateSkillTree(
  unitID: string,
  cohortId?: string,
): Promise<GenerateSkillTreeResult | null> {
  try {
    const client = getAmplifyClient();

    const { data, errors } = await client.mutations.generateSkillTree({
      unitID,
      cohortId: cohortId ?? null,
    });

    if (errors?.length) {
      console.error("[gamificationActions] generateSkillTree errors:", errors);
      return null;
    }

    return typeof data === "string" ? JSON.parse(data) : (data as any);
  } catch (err) {
    console.error("[gamificationActions] generateSkillTree error:", err);
    return null;
  }
}

/**
 * Advance a student's skill status (AVAILABLE → IN_PROGRESS → MASTERED).
 * The Lambda validates transitions and automatically unlocks dependent skills.
 */
export async function advanceSkillProgress(
  studentId: string,
  skillId: string,
  newStatus: string,
): Promise<{ success?: boolean; error?: string; unlocked?: string[] } | null> {
  try {
    const client = getAmplifyClient();

    const { data, errors } = await client.mutations.advanceSkillProgress({
      studentId,
      skillId,
      newStatus,
    });

    if (errors?.length) {
      console.error(
        "[gamificationActions] advanceSkillProgress errors:",
        errors,
      );
      return null;
    }

    return typeof data === "string" ? JSON.parse(data) : (data as any);
  } catch (err) {
    console.error("[gamificationActions] advanceSkillProgress error:", err);
    return null;
  }
}
