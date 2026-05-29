"use server";

/**
 * Gamification Server Actions
 *
 * Calls the gamification engine directly — no Lambda round-trip.
 * Flow: Client → Server Action → engine functions → DynamoDB via cookie-based client
 */

import { getServerClient } from "@/utils/amplifyServerClient";
import { chatCompletion } from "./chat";
import {
  engineAwardXP,
  engineCheckBadges,
  engineUpdateStreak,
  engineUpdateSquadXP,
  engineCheckPersonalBest,
  engineCheckEasterEggs,
  engineDiscoverEasterEgg,
  engineUpdateStudentUnitMemory,
  engineRebuildStudentMemoryProfile,
  engineAdvanceSkillProgress,
  engineGenerateSkillTree,
  engineRebuildLeaderboard,
} from "./gamification-engine";

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
    xpResult = await engineAwardXP(client, {
      studentId,
      reason,
      referenceId: referenceId ?? undefined,
      cohortId: cohortId ?? undefined,
      unitID: unitID ?? undefined,
      accuracy: accuracy ?? undefined,
    });
  } catch (err) {
    console.error("[gamification action] awardXP error:", err);
    return null;
  }

  // Fire-and-forget: badges, streak, squad XP
  Promise.allSettled([
    engineCheckBadges(client, { studentId, cohortId: cohortId ?? undefined }),
    engineUpdateStreak(client, { studentId }),
    xpResult && !xpResult.alreadyAwarded && xpResult.xpAmount > 0
      ? engineUpdateSquadXP(client, { studentId, xpAmount: xpResult.xpAmount })
      : Promise.resolve(null),
  ]).catch(() => {});

  return xpResult;
}

/**
 * Record a grade completion — batches XP award, badge check, streak update,
 * squad XP update, personal best check, and easter egg scan into a single
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
    xpResult = await engineAwardXP(client, {
      studentId,
      reason: "HOMEWORK_SUBMITTED",
      referenceId,
      cohortId: cohortId ?? undefined,
      unitID,
      accuracy,
    });
  } catch (err) {
    console.error("[gamification action] awardXP error:", err);
  }

  // 2. Check badges + update streak + squad XP (parallel)
  await Promise.allSettled([
    engineCheckBadges(client, { studentId, cohortId: cohortId ?? undefined }),
    engineUpdateStreak(client, { studentId }),
    xpResult && !xpResult.alreadyAwarded && xpResult.xpAmount > 0
      ? engineUpdateSquadXP(client, { studentId, xpAmount: xpResult.xpAmount })
      : Promise.resolve(null),
  ]);

  // 3. Check personal best (blocking — needed for UI)
  let personalBest: PersonalBestResult | null = null;
  try {
    personalBest = await engineCheckPersonalBest(client, {
      studentId,
      unitID,
      score: accuracy,
    });
  } catch (err) {
    console.error("[gamification action] checkPersonalBest error:", err);
  }

  // 4. Easter egg scan (if submission text provided)
  let easterEggs: EasterEggResult | null = null;
  if (submissionText) {
    try {
      easterEggs = await engineCheckEasterEggs(client, {
        studentId,
        submissionText,
        triggerType: undefined,
      });
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
    await engineUpdateStudentUnitMemory(client, {
      studentId,
      unitID,
      accuracy,
      weakAreas: weakAreas ?? [],
      strongAreas: strongAreas ?? [],
      confusionPairs: options?.confusionPairs ?? [],
      accuracyBySource: options?.accuracyBySource ?? {},
      sourceType: options?.sourceType ?? "practice",
    });

    // Rebuild profile (fire-and-forget on server side)
    engineRebuildStudentMemoryProfile(client, { studentId }).catch((err: any) =>
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
    return await engineAdvanceSkillProgress(client, {
      studentId,
      skillId,
      newStatus,
    });
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
    return await engineGenerateSkillTree(client, {
      unitID,
      cohortId: cohortId ?? undefined,
    });
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
    return await engineDiscoverEasterEgg(client, { studentId, eggId });
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
    console.error(
      "[gamification action] generateCampaignNarrative error:",
      err,
    );
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
    await engineRebuildLeaderboard(client, { cohortId });
  } catch (err) {
    console.warn("[gamification action] rebuildLeaderboard error:", err);
  }
}

// ============================================================================
// Challenge Recap Generation
// ============================================================================

export interface SquadPerformance {
  squadId: string;
  squadName: string;
  xpContributed: number;
  memberCount: number;
}

export interface ChallengeRecapResult {
  squadId: string;
  squadName: string;
  recap: string;
  rivalSquadId: string;
  rivalSquadName: string;
  performance: string;
}

/**
 * Generate per-squad recaps for a completed challenge.
 *
 * Each recap is an amusing AI-generated narrative summary that pits squads
 * against each other (never individuals). The "rival" for each squad is the
 * closest-XP squad at challenge end.
 *
 * Returns an array of recap objects ready to be stored on Squad.recaps.
 */
export async function generateChallengeRecaps(params: {
  challengeId: string;
  challengeTitle: string;
  setting?: string;
  outcome?: string;
  squads: SquadPerformance[];
}): Promise<ChallengeRecapResult[]> {
  const { challengeId, challengeTitle, setting, outcome, squads } = params;

  if (squads.length === 0) return [];

  // Sort squads by XP for ranking
  const sorted = [...squads].sort((a, b) => b.xpContributed - a.xpContributed);

  const systemPrompt = `You are a witty narrator for an educational gamification platform.
You write short, entertaining recap summaries after group challenges (boss battles).

RULES:
- Write from a third-person narrator perspective
- Pit SQUADS against each other, never name individual students
- Keep each recap to 2-3 sentences
- Be playful and dramatic — like a sports commentator
- Reference the setting/world if provided
- The "rival" squad should be called out by name
- Winners get triumphant recaps; losers get comedic consolation
- Never be mean-spirited — always encouraging underneath the banter

Respond ONLY with valid JSON array: [{"squadId": "...", "recap": "...", "performance": "top|middle|bottom"}]`;

  const squadSummary = sorted
    .map(
      (s, i) =>
        `#${i + 1} ${s.squadName} (${s.xpContributed} XP, ${s.memberCount} members)`,
    )
    .join("\n");

  const userPrompt = `Challenge: "${challengeTitle}"
${setting ? `Setting: ${setting}` : ""}
${outcome ? `Outcome: ${outcome}` : ""}

Final standings:
${squadSummary}

Generate a personalized recap for EACH squad. Each squad's "rival" is the squad closest to them in XP (above or below).`;

  try {
    const text = await chatCompletion({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      model: "gpt-4o-mini",
    });

    if (!text) return [];
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) return [];

    // Enrich with rival info
    return parsed.map((item: any) => {
      const squad = sorted.find((s) => s.squadId === item.squadId);
      const idx = sorted.findIndex((s) => s.squadId === item.squadId);
      // Rival = closest squad (prefer above, then below)
      const rival = idx > 0 ? sorted[idx - 1] : sorted[idx + 1];
      return {
        squadId: item.squadId,
        squadName: squad?.squadName || item.squadId,
        recap: item.recap || "",
        rivalSquadId: rival?.squadId || "",
        rivalSquadName: rival?.squadName || "",
        performance: item.performance || "middle",
      };
    });
  } catch (err) {
    console.error("[gamification action] generateChallengeRecaps error:", err);
    return [];
  }
}
