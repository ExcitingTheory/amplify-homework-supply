"use server";

/**
 * Gamification Server Actions
 *
 * Calls the gamification engine directly — no Lambda round-trip.
 * Flow: Client → Server Action → engine functions → DynamoDB via cookie-based client
 */

import { getServerClient } from "@/utils/amplifyServerClient";
import { runWithAmplifyServerContext } from "@/utils/amplifyServerUtils";
import { fetchAuthSession } from "aws-amplify/auth/server";
import { cookies } from "next/headers";
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
// Caller Identity Guards
// ============================================================================

/**
 * Resolve the authenticated caller's Cognito sub and groups from the
 * current request's cookie-based session. Returns null if unauthenticated.
 */
async function getCallerSession(): Promise<{
  sub: string;
  groups: string[];
} | null> {
  try {
    const session = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: (contextSpec) => fetchAuthSession(contextSpec),
    });
    const idToken = session?.tokens?.idToken;
    if (!idToken) return null;
    const sub = idToken.payload?.sub as string;
    const groups = (idToken.payload?.["cognito:groups"] as string[]) || [];
    return { sub, groups };
  } catch {
    return null;
  }
}

function isPrivilegedCaller(groups: string[]): boolean {
  return groups.some(
    (g) => g === "Instructors" || g === "Admins" || g === "Moderators",
  );
}

/**
 * Check whether an instructor has the given student in one of their sections.
 * Admins/Moderators are not section-scoped — they can act on any student.
 */
async function isStudentInCallerSection(
  callerSub: string,
  callerGroups: string[],
  studentId: string,
): Promise<boolean> {
  // Admins and Moderators are global — no section restriction
  if (callerGroups.includes("Admins") || callerGroups.includes("Moderators")) {
    return true;
  }

  // Instructors: verify student has an assignment in a section they own
  try {
    const client = getServerClient() as any;

    // Get sections owned by the instructor
    const { data: sections } = await client.models.Section.list({
      filter: { owner: { eq: callerSub } },
      selectionSet: ["id"],
      limit: 100,
    });

    if (!sections || sections.length === 0) return false;

    const sectionIds = sections.map((s: any) => s.id);

    // Check if the student has an assignment in any of those sections
    for (const sectionId of sectionIds) {
      const { data: assignments } = await client.models.Assignment.list({
        filter: {
          sectionID: { eq: sectionId },
          owner: { eq: studentId },
        },
        selectionSet: ["id"],
        limit: 1,
      });
      if (assignments && assignments.length > 0) return true;
    }

    return false;
  } catch (err) {
    console.error("[gamification] Section membership check failed:", err);
    // Fail closed — deny on error
    return false;
  }
}

/**
 * Guard: verify the caller is either the student themselves or a privileged
 * user (Instructor/Admin/Moderator). Instructors must also have the student
 * in one of their sections. Logs a warning and returns false if not.
 */
async function assertCallerIsStudentOrPrivileged(
  studentId: string,
): Promise<boolean> {
  const caller = await getCallerSession();
  if (!caller) {
    console.warn(
      "[gamification] Unauthenticated action attempt for student",
      studentId,
    );
    return false;
  }
  // Student acting on their own data — always allowed
  if (caller.sub === studentId) {
    return true;
  }
  // Non-privileged callers cannot act on other students
  if (!isPrivilegedCaller(caller.groups)) {
    console.warn(
      "[gamification] Unauthorized action: caller",
      caller.sub,
      "attempted to modify records for student",
      studentId,
    );
    return false;
  }
  // Privileged callers: verify section membership (Admins exempt)
  const hasAccess = await isStudentInCallerSection(
    caller.sub,
    caller.groups,
    studentId,
  );
  if (!hasAccess) {
    console.warn(
      "[gamification] Cross-section denied: instructor",
      caller.sub,
      "has no section containing student",
      studentId,
    );
    return false;
  }
  return true;
}

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
  if (!(await assertCallerIsStudentOrPrivileged(studentId))) return null;

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
  if (!(await assertCallerIsStudentOrPrivileged(studentId))) {
    return { xp: null, personalBest: null, easterEggs: null };
  }

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

  // 1b. On-time bonus — check if submitted before Assignment.dueDate
  if (cohortId && unitID) {
    try {
      const { data: assignmentData } = await (
        client as any
      ).models.Assignment.list({
        filter: {
          sectionID: { eq: cohortId },
          unitID: { eq: unitID },
        },
        limit: 1,
      });
      const assignment = (assignmentData || [])[0];
      if (assignment?.dueDate) {
        const dueDate = new Date(assignment.dueDate);
        if (new Date() <= dueDate) {
          await engineAwardXP(client, {
            studentId,
            reason: "ON_TIME_SUBMISSION",
            referenceId: `${referenceId}-ontime`,
            cohortId,
            unitID,
            accuracy,
          });
        }
      }
    } catch (err) {
      console.warn("[gamification action] on-time check error:", err);
    }
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
  if (!(await assertCallerIsStudentOrPrivileged(studentId))) {
    return { success: false };
  }

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
  if (!(await assertCallerIsStudentOrPrivileged(studentId))) return null;

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
 * Optionally accepts sectionId to provide course progression context.
 */
export async function generateSkillTreeFromUnit(
  unitID: string,
  cohortId?: string,
  sectionId?: string,
): Promise<GenerateSkillTreeResult | null> {
  const client = getServerClient();

  try {
    return await engineGenerateSkillTree(client, {
      unitID,
      cohortId: cohortId ?? undefined,
      sectionId: sectionId ?? undefined,
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
  if (!(await assertCallerIsStudentOrPrivileged(studentId))) return null;

  const client = getServerClient();

  try {
    const result = await engineDiscoverEasterEgg(client, { studentId, eggId });
    if (!result || "error" in result) return null;
    return result;
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
}

/**
 * Generate a campaign narrative (setting + rhetorical stakes) using AI.
 * Replaces the client-side `generateCampaignNarrative` from gamificationActions.ts.
 *
 * When sectionId is provided, fetches the course outline to create
 * thematically relevant narratives grounded in actual course content.
 */
export async function generateCampaignNarrative(
  title: string,
  sectionId?: string,
): Promise<GenerateCampaignResult | null> {
  try {
    // Fetch section course outline for contextual narrative generation
    let courseContext = "";
    if (sectionId) {
      try {
        const client = getServerClient() as any;
        const { data: section } = await client.models.Section.get(
          { id: sectionId },
          { selectionSet: ["id", "name", "courseOutline"] },
        );
        if (section?.courseOutline) {
          const outline = Array.isArray(section.courseOutline)
            ? section.courseOutline
            : typeof section.courseOutline === "string"
              ? JSON.parse(section.courseOutline)
              : [];
          if (outline.length > 0) {
            const chapters = outline
              .map(
                (e: any) =>
                  `${e.number != null ? `${e.number}. ` : ""}${e.name}`,
              )
              .join(", ");
            courseContext = `\n\nThe course covers these topics: ${chapters}. Use these as thematic inspiration for the narrative world.`;
          }
        }
      } catch {
        // Non-fatal — generate without context
      }
    }

    const systemPrompt = `You are a creative writing assistant for an educational gamification platform. 
Given a campaign title, generate a vivid description of the fictional world or scenario (2-3 sentences). This frames the learning journey as an adventure.
${courseContext}
Respond ONLY with valid JSON: {"setting": "..."}
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
    if (parsed?.setting) {
      return { setting: parsed.setting };
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
  sectionId?: string;
}): Promise<ChallengeRecapResult[]> {
  const { challengeId, challengeTitle, setting, outcome, squads, sectionId } =
    params;

  if (squads.length === 0) return [];

  // Fetch course context for richer narratives
  let courseThemes = "";
  if (sectionId) {
    try {
      const client = getServerClient() as any;
      const { data: section } = await client.models.Section.get(
        { id: sectionId },
        { selectionSet: ["id", "name", "courseOutline"] },
      );
      if (section?.courseOutline) {
        const outline = Array.isArray(section.courseOutline)
          ? section.courseOutline
          : typeof section.courseOutline === "string"
            ? JSON.parse(section.courseOutline)
            : [];
        if (outline.length > 0) {
          const topics = outline.map((e: any) => e.name).join(", ");
          courseThemes = `\nThe class is studying: ${topics}. Weave subtle references to these topics into the recaps when natural.`;
        }
      }
    } catch {
      // Non-fatal
    }
  }

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
${courseThemes}
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
