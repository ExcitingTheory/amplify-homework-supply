"use server";

/**
 * Gamification Server Actions
 *
 * Replaces client-side gamificationActions.ts calls that traverse:
 * Client → AppSync GraphQL → Lambda → DynamoDB → Lambda → AppSync → Client
 *
 * New flow: Client → Server Action → AppSync GraphQL → Lambda → DynamoDB (2 fewer hops)
 *
 * These actions batch multiple sequential operations into single server round-trips.
 */

import { getServerClient } from "@/utils/amplifyServerClient";
import { chatCompletion } from "./chat";

// ============================================================================
// Types
// ============================================================================

export interface AwardXPResult {
  alreadyAwarded: boolean;
  xpAmount: number;
  totalXP: number;
}

export interface PersonalBestResult {
  isNewBest: boolean;
  firstAttempt: boolean;
  bestScore: number;
  previousBest: number | null;
}

export interface EasterEggResult {
  discovered: Array<{ eggId: string; message: string; xpReward: number }>;
}

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

export interface GradeCompletionResult {
  xp: AwardXPResult | null;
  personalBest: PersonalBestResult | null;
  easterEggs: EasterEggResult | null;
}

// ============================================================================
// Core Actions
// ============================================================================

/**
 * Award XP for a single reason (e.g. NAILED_IT, PEER_REVIEW_HOSTED).
 * Batches the XP award + badge check + streak update into one server call.
 *
 * Replaces the client-side `awardXPAndCheck` utility from gamificationActions.ts.
 */
export async function awardXP(
  studentId: string,
  reason: string,
  referenceId?: string,
  cohortId?: string,
  unitID?: string,
  accuracy?: number,
): Promise<AwardXPResult | null> {
  const client = getServerClient();

  let xpResult: AwardXPResult | null = null;
  try {
    const { data, errors } = await (client as any).mutations.awardXP({
      studentId,
      reason,
      referenceId: referenceId ?? null,
      cohortId: cohortId ?? null,
      unitID: unitID ?? null,
      accuracy: accuracy != null ? accuracy : null,
    });
    if (errors?.length) {
      console.error("[gamification action] awardXP errors:", errors);
      return null;
    }
    xpResult = typeof data === "string" ? JSON.parse(data) : data;
  } catch (err) {
    console.error("[gamification action] awardXP error:", err);
    return null;
  }

  // Fire-and-forget: badges, streak, guild XP
  Promise.allSettled([
    (client as any).mutations.checkBadges({ studentId }),
    (client as any).mutations.updateStreak({ studentId }),
    xpResult && !xpResult.alreadyAwarded && xpResult.xpAmount > 0
      ? (client as any).mutations.updateGuildXP?.({
          studentId,
          xpAmount: xpResult.xpAmount,
        })
      : Promise.resolve(null),
  ]).catch(() => {});

  return xpResult;
}

/**
 * Record a grade completion — batches XP award, badge check, streak update,
 * guild XP update, personal best check, and easter egg scan into a single
 * server round-trip.
 *
 * Replaces 4-5 sequential client-side calls.
 */
export async function recordGradeCompletion(
  studentId: string,
  unitID: string,
  accuracy: number,
  referenceId: string,
  submissionText?: string,
  cohortId?: string,
): Promise<GradeCompletionResult> {
  const client = getServerClient();

  // 1. Award XP (blocking — core operation)
  let xpResult: AwardXPResult | null = null;
  try {
    const { data, errors } = await (client as any).mutations.awardXP({
      studentId,
      reason: "HOMEWORK_SUBMITTED",
      referenceId,
      cohortId: cohortId ?? null,
      unitID,
      accuracy,
    });
    if (!errors?.length) {
      xpResult = typeof data === "string" ? JSON.parse(data) : data;
    }
  } catch (err) {
    console.error("[gamification action] awardXP error:", err);
  }

  // 2. Check badges + update streak (parallel, fire-and-forget on server)
  const [badgeResult, streakResult, guildResult] = await Promise.allSettled([
    (client as any).mutations.checkBadges({ studentId }),
    (client as any).mutations.updateStreak({ studentId }),
    xpResult && !xpResult.alreadyAwarded && xpResult.xpAmount > 0
      ? (client as any).mutations.updateGuildXP?.({
          studentId,
          xpAmount: xpResult.xpAmount,
        })
      : Promise.resolve(null),
  ]);

  // 3. Check personal best (blocking — needed for UI)
  let personalBest: PersonalBestResult | null = null;
  try {
    const { data, errors } = await (client as any).mutations.checkPersonalBest({
      studentId,
      unitID,
      score: accuracy,
    });
    if (!errors?.length) {
      personalBest = typeof data === "string" ? JSON.parse(data) : data;
    }
  } catch (err) {
    console.error("[gamification action] checkPersonalBest error:", err);
  }

  // 4. Easter egg scan (if submission text provided)
  let easterEggs: EasterEggResult | null = null;
  if (submissionText) {
    try {
      const { data, errors } = await (client as any).mutations.checkEasterEggs({
        studentId,
        submissionText,
        triggerType: null,
      });
      if (!errors?.length) {
        easterEggs = typeof data === "string" ? JSON.parse(data) : data;
      }
    } catch (err) {
      console.error("[gamification action] checkEasterEggs error:", err);
    }
  }

  return { xp: xpResult, personalBest, easterEggs };
}

/**
 * Update learning memory after completion — merges weak/strong areas
 * and triggers profile rebuild.
 */
export async function updateLearningMemory(
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
): Promise<{ success: boolean }> {
  const client = getServerClient();

  try {
    const { errors } = await (
      client as any
    ).mutations.updateStudentUnitMemoryFromGrade({
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
      console.error("[gamification action] updateUnitMemory errors:", errors);
      return { success: false };
    }

    // Rebuild profile (fire-and-forget on server side)
    (client as any).mutations
      .rebuildStudentMemoryProfile({ studentId })
      .catch((err: any) =>
        console.error("[gamification action] rebuildProfile error:", err),
      );

    return { success: true };
  } catch (err) {
    console.error("[gamification action] updateLearningMemory error:", err);
    return { success: false };
  }
}

/**
 * Advance a skill's progress status.
 */
export async function advanceSkill(
  studentId: string,
  skillId: string,
  newStatus: string,
): Promise<{ success?: boolean; error?: string; unlocked?: string[] } | null> {
  const client = getServerClient();

  try {
    const { data, errors } = await (
      client as any
    ).mutations.advanceSkillProgress({
      studentId,
      skillId,
      newStatus,
    });

    if (errors?.length) {
      console.error("[gamification action] advanceSkill errors:", errors);
      return null;
    }

    return typeof data === "string" ? JSON.parse(data) : data;
  } catch (err) {
    console.error("[gamification action] advanceSkill error:", err);
    return null;
  }
}

/**
 * Generate a skill tree from unit content using AI.
 */
export async function generateSkillTreeFromUnit(
  unitID: string,
  cohortId?: string,
): Promise<GenerateSkillTreeResult | null> {
  const client = getServerClient();

  try {
    const { data, errors } = await (client as any).mutations.generateSkillTree({
      unitID,
      cohortId: cohortId ?? null,
    });

    if (errors?.length) {
      console.error("[gamification action] generateSkillTree errors:", errors);
      return null;
    }

    return typeof data === "string" ? JSON.parse(data) : data;
  } catch (err) {
    console.error("[gamification action] generateSkillTree error:", err);
    return null;
  }
}

/**
 * Discover a specific easter egg (for UI interaction triggers).
 */
export async function discoverEasterEgg(
  studentId: string,
  eggId: string,
): Promise<{
  alreadyDiscovered: boolean;
  message?: string;
  xpReward?: number;
} | null> {
  const client = getServerClient();

  try {
    const { data, errors } = await (client as any).mutations.discoverEasterEgg({
      studentId,
      eggId,
    });

    if (errors?.length) {
      console.error("[gamification action] discoverEasterEgg errors:", errors);
      return null;
    }

    return typeof data === "string" ? JSON.parse(data) : data;
  } catch (err) {
    console.error("[gamification action] discoverEasterEgg error:", err);
    return null;
  }
}

// ============================================================================
// Campaign Narrative Generation
// ============================================================================

export interface GenerateCampaignResult {
  setting: string;
  stakes: string;
}

/**
 * Generate a campaign narrative (setting + rhetorical stakes) using AI.
 * Replaces the client-side `generateCampaignNarrative` from gamificationActions.ts.
 */
export async function generateCampaignNarrative(
  title: string,
): Promise<GenerateCampaignResult | null> {
  try {
    const systemPrompt = `You are a creative writing assistant for an educational gamification platform. 
Given a campaign title, generate two short pieces of narrative text:

1. "setting" — A vivid description of the fictional world or scenario (2-3 sentences). This frames the learning journey as an adventure.
2. "stakes" — Rhetorical, in-world consequences if students don't succeed (2-3 sentences). These are NOT real consequences — they are motivating story tension. Think video game narrative stakes.

Respond ONLY with valid JSON: {"setting": "...", "stakes": "..."}
Do not include any other text or markdown formatting.`;

    const text = await chatCompletion({
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Generate a campaign narrative for: "${title}"`,
        },
      ],
      model: "gpt-4o-mini",
    });

    if (!text) return null;
    const parsed = JSON.parse(text);
    if (parsed?.setting && parsed?.stakes) {
      return { setting: parsed.setting, stakes: parsed.stakes };
    }
    return null;
  } catch (err) {
    console.error("[gamification action] generateCampaignNarrative error:", err);
    return null;
  }
}

// ============================================================================
// Rebuild Leaderboard
// ============================================================================

/**
 * Triggers a leaderboard rebuild for a cohort (section).
 * Fire-and-forget — rebuilds StudentProfile leaderboard fields.
 */
export async function rebuildLeaderboard(cohortId: string): Promise<void> {
  if (!cohortId) return;

  const client = getServerClient();

  try {
    await (client as any).mutations.rebuildLeaderboard({ cohortId });
  } catch (err) {
    console.warn("[gamification action] rebuildLeaderboard error:", err);
  }
}
