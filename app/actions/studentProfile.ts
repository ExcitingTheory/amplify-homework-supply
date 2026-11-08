"use server";

import { cookies } from "next/headers";
import { fetchAuthSession } from "aws-amplify/auth/server";
import { getServerClient } from "@/utils/amplifyServerClient";
import { runWithAmplifyServerContext } from "@/utils/amplifyServerUtils";

export interface SectionStudentProfileData {
  sectionName: string;
  profile: Record<string, any> | null;
  memory: Record<string, any> | null;
  actions: Record<string, any>[];
  studentLabel: string;
}

export interface SectionStudentSummary {
  rollupVersion: string;
  generatedAt: string;
  summary: string;
  note: string;
  aggregate: {
    completionRate: number;
    xp: number;
    level: number;
    streak: number;
  };
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle];
}

export async function generateSectionStudentSummary({
  sectionName,
  studentLabel,
  profile,
  sectionProfiles,
}: {
  sectionName: string;
  studentLabel: string;
  profile: Record<string, any> | null;
  sectionProfiles: Array<Record<string, any>>;
}): Promise<SectionStudentSummary> {
  const completionRate =
    profile && profile.totalSubmissions > 0
      ? Math.round(
          (toNumber(profile.completedAssignments, 0) /
            toNumber(profile.totalSubmissions, 0)) *
            100,
        )
      : 0;

  const sectionMetrics = (sectionProfiles || [])
    .map((entry) => {
      const totalSubmissions = toNumber(entry?.totalSubmissions, 0);
      const completedAssignments = toNumber(entry?.completedAssignments, 0);
      return {
        completionRate:
          totalSubmissions > 0
            ? Math.round((completedAssignments / totalSubmissions) * 100)
            : 0,
        xp: toNumber(entry?.totalXP, 0),
        level: toNumber(entry?.level, 1),
        streak: toNumber(entry?.currentStreak, 0),
      };
    })
    .filter((entry) => Number.isFinite(entry.xp));

  const summarizeMetric = (selector: (entry: typeof sectionMetrics[number]) => number) => {
    const values = sectionMetrics.map(selector);
    if (!values.length) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  };

  const sectionAverageCompletion = summarizeMetric((entry) => entry.completionRate);
  const sectionAverageXp = summarizeMetric((entry) => entry.xp);
  const sectionAverageStreak = summarizeMetric((entry) => entry.streak);
  const sectionAverageLevel = summarizeMetric((entry) => entry.level);
  const completionGap = completionRate - sectionAverageCompletion;

  const metricParts: string[] = [];
  if (sectionMetrics.length) {
    metricParts.push(
      `${studentLabel} is at ${profile?.level ?? 1} with ${profile?.totalXP ?? 0} XP and ${profile?.currentStreak ?? 0}-day streak versus a section average of ${Math.round(sectionAverageLevel)} level, ${Math.round(sectionAverageXp)} XP, and ${Math.round(sectionAverageStreak)} days.`,
    );
  } else {
    metricParts.push(
      `${studentLabel} is at ${profile?.level ?? 1} with ${profile?.totalXP ?? 0} XP and ${profile?.currentStreak ?? 0}-day streak in ${sectionName}.`,
    );
  }

  if (completionRate > 0) {
    const trendPhrase =
      completionGap > 0
        ? `This is ${Math.round(Math.abs(completionGap))}% above the section completion average.`
        : completionGap < 0
          ? `This is ${Math.round(Math.abs(completionGap))}% below the section completion average.`
          : "This matches the current section completion average.";
    metricParts.push(
      `Completion is ${completionRate}% (${trendPhrase})`,
    );
  }

  if (!profile || !sectionProfiles.length) {
    const summary = `${metricParts.join(" ")} This section rollup is still sparse, so the summary should be treated as a tentative snapshot.`;
    return {
      rollupVersion: "section-rollup-v0",
      generatedAt: new Date().toISOString(),
      summary,
      note: "Generated from the available section records. Treat as a provisional view until more data is recorded.",
      aggregate: {
        completionRate,
        xp: profile?.totalXP ?? 0,
        level: profile?.level ?? 1,
        streak: profile?.currentStreak ?? 0,
      },
    };
  }

  const versionInput = JSON.stringify({
    sectionName,
    studentLabel,
    completionRate,
    averageCompletion: sectionAverageCompletion,
    xp: profile?.totalXP ?? 0,
    averageXp: sectionAverageXp,
    streak: profile?.currentStreak ?? 0,
    averageStreak: sectionAverageStreak,
  });

  const cryptoModule = await import("node:crypto");
  const hash = cryptoModule
    .createHash("sha256")
    .update(versionInput)
    .digest("hex")
    .slice(0, 10);

  const summary = `${metricParts.join(" ")} This generated summary is a suggestion, not a diagnosis, and is tied to section rollup ${hash}.`;

  return {
    rollupVersion: `section-rollup-${hash}`,
    generatedAt: new Date().toISOString(),
    summary,
    note: "Generated from section-scoped metrics only. Observations may be incomplete when the section record set is sparse.",
    aggregate: {
      completionRate,
      xp: profile?.totalXP ?? 0,
      level: profile?.level ?? 1,
      streak: profile?.currentStreak ?? 0,
    },
  };
}

export async function saveSectionStudentSummary({
  sectionId,
  studentId,
  sectionName,
  studentLabel,
  summaryText,
  summaryVersion,
  note,
  aggregate,
}: {
  sectionId: string;
  studentId: string;
  sectionName: string;
  studentLabel: string;
  summaryText: string;
  summaryVersion: string;
  note: string;
  aggregate: { completionRate: number; xp: number; level: number; streak: number };
}): Promise<{ success: boolean; error?: string; profile?: Record<string, any> }> {
  if (!sectionId || !studentId || !summaryText.trim()) {
    return {
      success: false,
      error: "Section, student, and summary text are required.",
    };
  }

  let username: string | null = null;
  try {
    const session = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: (contextSpec) => fetchAuthSession(contextSpec),
    });
    username =
      (session?.tokens?.idToken?.payload?.["cognito:username"] as
        string | undefined) ||
      (session?.tokens?.idToken?.payload?.sub as string | undefined) ||
      null;
  } catch {
    return { success: false, error: "You must be signed in to save section summaries." };
  }

  if (!username) {
    return { success: false, error: "You must be signed in to save section summaries." };
  }

  const client = getServerClient();

  try {
    const { data: existingProfiles, errors: listErrors } = await (client as any).models.StudentProfile.list({
      filter: {
        sectionID: { eq: sectionId },
        studentId: { eq: studentId },
      },
      limit: 20,
    });

    if (listErrors?.length) {
      return {
        success: false,
        error: listErrors[0]?.message || "Unable to load the student profile for summary persistence.",
      };
    }

    const currentProfile = (existingProfiles || [])[0];
    const nextProfile = currentProfile || {
      studentId,
      sectionID: sectionId,
      studentName: studentLabel,
      owner: username,
      totalXP: 0,
      level: 1,
      currentStreak: 0,
      totalSubmissions: 0,
      completedAssignments: 0,
    };

    const { data: savedProfile, errors } = currentProfile
      ? await (client as any).models.StudentProfile.update({
          id: currentProfile.id,
          _version: currentProfile._version,
          summaryText: summaryText.trim(),
          summaryVersion: summaryVersion,
          summaryGeneratedAt: new Date().toISOString(),
          summaryContext: {
            sectionName,
            studentLabel,
            note,
            aggregate,
          },
        })
      : await (client as any).models.StudentProfile.create({
          studentId,
          sectionID: sectionId,
          studentName: studentLabel,
          owner: username,
          totalXP: aggregate.xp,
          level: aggregate.level,
          currentStreak: aggregate.streak,
          totalSubmissions: 0,
          completedAssignments: 0,
          summaryText: summaryText.trim(),
          summaryVersion: summaryVersion,
          summaryGeneratedAt: new Date().toISOString(),
          summaryContext: {
            sectionName,
            studentLabel,
            note,
            aggregate,
          },
        });

    if (errors?.length) {
      return {
        success: false,
        error: errors[0]?.message || "Unable to save the section summary.",
      };
    }

    return { success: true, profile: savedProfile || nextProfile };
  } catch (error: any) {
    console.error("[studentProfile action] saveSectionStudentSummary", error);
    return {
      success: false,
      error: error?.message || "Unable to save the section summary.",
    };
  }
}

export async function getSectionStudentProfile(
  sectionId: string,
  studentId: string,
): Promise<SectionStudentProfileData | null> {
  if (!sectionId || !studentId) {
    return null;
  }

  let username: string | null = null;
  try {
    const session = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: (contextSpec) => fetchAuthSession(contextSpec),
    });
    username =
      (session?.tokens?.idToken?.payload?.["cognito:username"] as
        string | undefined) ||
      (session?.tokens?.idToken?.payload?.sub as string | undefined) ||
      null;
  } catch {
    // Fall back to the authenticated caller check below.
  }

  if (!username) {
    return null;
  }

  const client = getServerClient();

  const [sectionRes, profileRes, memoryRes, actionRes] = await Promise.all([
    (client as any).models.Section.get({ id: sectionId }),
    (client as any).models.StudentProfile.list({
      filter: {
        sectionID: { eq: sectionId },
        studentId: { eq: studentId },
      },
      limit: 20,
    }),
    (client as any).models.StudentMemory.list({
      filter: {
        sectionID: { eq: sectionId },
        studentId: { eq: studentId },
      },
      limit: 20,
    }),
    (client as any).models.StudentActionRecord.list({
      filter: {
        sectionID: { eq: sectionId },
        studentId: { eq: studentId },
      },
      limit: 50,
    }),
  ]);

  const profile = (profileRes?.data || [])[0] || null;
  const memory = (memoryRes?.data || [])[0] || null;
  const actions = actionRes?.data || [];

  return {
    sectionName: sectionRes?.data?.name || "Section",
    profile,
    memory,
    actions,
    studentLabel:
      profile?.studentName || memory?.studentId || decodeURIComponent(studentId),
  };
}

export interface CreateStudentActionInput {
  sectionId: string;
  studentId: string;
  description: string;
  status?: string;
  actionType?: string;
  targetDate?: string | null;
  outcome?: string | null;
  followUp?: string | null;
  previousActionId?: string | null;
}

export async function reviseStudentActionRecord(
  input: CreateStudentActionInput & { actionId: string },
): Promise<{ success: boolean; error?: string; action?: Record<string, any> }> {
  const { sectionId, studentId, description, actionId } = input;

  if (!actionId || !sectionId || !studentId || !description?.trim()) {
    return {
      success: false,
      error: "Action ID, section, student, and description are required.",
    };
  }

  let username: string | null = null;
  try {
    const session = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: (contextSpec) => fetchAuthSession(contextSpec),
    });
    username =
      (session?.tokens?.idToken?.payload?.["cognito:username"] as
        string | undefined) ||
      (session?.tokens?.idToken?.payload?.sub as string | undefined) ||
      null;
  } catch {
    return { success: false, error: "You must be signed in to revise actions." };
  }

  if (!username) {
    return { success: false, error: "You must be signed in to revise actions." };
  }

  const client = getServerClient();

  try {
    const { data: currentAction, errors: lookupErrors } = await (client as any).models.StudentActionRecord.get({
      id: actionId,
    });

    if (lookupErrors?.length || !currentAction) {
      return {
        success: false,
        error: "The action record could not be found.",
      };
    }

    if (currentAction.sectionID !== sectionId || currentAction.studentId !== studentId) {
      return {
        success: false,
        error: "The action does not belong to the selected student and section.",
      };
    }

    const timestamp = new Date().toISOString();
    const nextVersion = (Number(currentAction.version ?? 1) || 1) + 1;
    const { data, errors } = await (client as any).models.StudentActionRecord.create({
      studentId,
      sectionID: sectionId,
      createdBy: username,
      actionType: input.actionType || currentAction.actionType || "follow-up",
      status: input.status || currentAction.status || "planned",
      description: description.trim(),
      targetDate: input.targetDate ? new Date(input.targetDate).toISOString() : currentAction.targetDate || null,
      outcome: input.outcome?.trim() || currentAction.outcome || null,
      followUp: input.followUp?.trim() || currentAction.followUp || null,
      previousActionId: currentAction.id,
      version: nextVersion,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    if (errors?.length) {
      return {
        success: false,
        error: errors[0]?.message || "Unable to save the revised action record.",
      };
    }

    return { success: true, action: data || null };
  } catch (error: any) {
    console.error("[studentProfile action] reviseStudentActionRecord", error);
    return {
      success: false,
      error: error?.message || "Unable to revise the action record.",
    };
  }
}

export async function createStudentActionRecord(
  input: CreateStudentActionInput,
): Promise<{ success: boolean; error?: string; action?: Record<string, any> }> {
  const { sectionId, studentId, description } = input;

  if (!sectionId || !studentId || !description?.trim()) {
    return {
      success: false,
      error: "Section, student, and description are required.",
    };
  }

  let username: string | null = null;
  try {
    const session = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: (contextSpec) => fetchAuthSession(contextSpec),
    });
    username =
      (session?.tokens?.idToken?.payload?.["cognito:username"] as
        string | undefined) ||
      (session?.tokens?.idToken?.payload?.sub as string | undefined) ||
      null;
  } catch {
    return { success: false, error: "You must be signed in to create actions." };
  }

  if (!username) {
    return { success: false, error: "You must be signed in to create actions." };
  }

  const client = getServerClient();

  try {
    const timestamp = new Date().toISOString();
    const { data, errors } = await (client as any).models.StudentActionRecord.create({
      studentId,
      sectionID: sectionId,
      createdBy: username,
      actionType: input.actionType || "follow-up",
      status: input.status || "planned",
      description: description.trim(),
      targetDate: input.targetDate ? new Date(input.targetDate).toISOString() : null,
      outcome: input.outcome?.trim() || null,
      followUp: input.followUp?.trim() || null,
      previousActionId: input.previousActionId || null,
      version: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    if (errors?.length) {
      return {
        success: false,
        error: errors[0]?.message || "Unable to save the action record.",
      };
    }

    return { success: true, action: data || null };
  } catch (error: any) {
    console.error("[studentProfile action] createStudentActionRecord", error);
    return {
      success: false,
      error: error?.message || "Unable to save the action record.",
    };
  }
}
