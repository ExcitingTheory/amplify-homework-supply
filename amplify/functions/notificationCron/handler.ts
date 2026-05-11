/**
 * Notification Cron Handler
 *
 * Runs every hour via EventBridge to create time-based notifications:
 * - ASSIGNMENT_DUE_SOON (due within next 24h)
 * - ASSIGNMENT_DUE_NOW (due within current hour)
 * - CHALLENGE_ENDING_SOON (ending within 24h)
 * - STREAK_AT_RISK (no activity today, active streak)
 *
 * Uses IAM-authenticated GraphQL with deduplication to avoid repeat notifications.
 */

import type { Handler } from "aws-lambda";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { fromEnv } from "@aws-sdk/credential-providers";
import { createNotificationIfNotExists } from "../shared/notificationUtils";

// ============================================================================
// GraphQL Queries
// ============================================================================

const LIST_ASSIGNMENTS = `query ListAssignments($limit: Int, $nextToken: String) {
  listAssignments(limit: $limit, nextToken: $nextToken) {
    items {
      id unitID sectionID learner dueDate status
    }
    nextToken
  }
}`;

const GET_UNIT = `query GetUnit($id: ID!) {
  getUnit(id: $id) {
    id name
  }
}`;

const LIST_STUDENT_PROFILES = `query ListStudentProfiles($limit: Int, $nextToken: String) {
  listStudentProfiles(limit: $limit, nextToken: $nextToken) {
    items {
      id studentId currentStreak lastActivityDate
    }
    nextToken
  }
}`;

const LIST_CHALLENGES = `query ListGroupChallenges($limit: Int, $nextToken: String) {
  listGroupChallenges(limit: $limit, nextToken: $nextToken) {
    items {
      id title cohortId deadline active
    }
    nextToken
  }
}`;

const LIST_GUILDS = `query ListGuilds($limit: Int, $nextToken: String) {
  listGuilds(limit: $limit, nextToken: $nextToken) {
    items {
      id cohortId members { studentId }
    }
    nextToken
  }
}`;

// ============================================================================
// Client Setup (IAM auth, singleton)
// ============================================================================

let gqlClient: any = null;

function getClient() {
  if (gqlClient) return gqlClient;

  Amplify.configure(
    {
      API: {
        GraphQL: {
          endpoint: process.env.API_ENDPOINT!,
          region: process.env.AWS_REGION || "us-east-1",
          defaultAuthMode: "iam",
        },
      },
    },
    {
      Auth: {
        credentialsProvider: {
          getCredentialsAndIdentityId: async () => ({
            credentials: await fromEnv()(),
          }),
          clearCredentialsAndIdentityId: () => {},
        },
      },
    },
  );

  gqlClient = generateClient({ authMode: "iam" });
  return gqlClient;
}

// ============================================================================
// Paginated query helper
// ============================================================================

async function paginateQuery<T>(
  client: any,
  query: string,
  variablesBase: Record<string, any> = {},
): Promise<T[]> {
  const items: T[] = [];
  let nextToken: string | null = null;

  do {
    const { data } = await client.graphql({
      query,
      variables: { ...variablesBase, limit: 100, nextToken },
    });
    const result = Object.values(data)[0] as any;
    const pageItems = (result?.items || []).filter((i: any) => i != null);
    items.push(...pageItems);
    nextToken = result?.nextToken || null;
  } while (nextToken);

  return items;
}

// ============================================================================
// Unit name cache
// ============================================================================

const unitNameCache = new Map<string, string>();

async function getUnitName(client: any, unitId: string): Promise<string> {
  if (unitNameCache.has(unitId)) return unitNameCache.get(unitId)!;
  try {
    const { data } = await client.graphql({
      query: GET_UNIT,
      variables: { id: unitId },
    });
    const name = data?.getUnit?.name || unitId;
    unitNameCache.set(unitId, name);
    return name;
  } catch {
    return unitId;
  }
}

// ============================================================================
// Handler
// ============================================================================

export const handler: Handler = async () => {
  console.log("[notificationCron] Starting notification cron job");
  const client = getClient();
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in1h = new Date(now.getTime() + 60 * 60 * 1000);
  const today = now.toISOString().split("T")[0];

  const stats = {
    assignmentDueSoon: 0,
    assignmentDueNow: 0,
    challengeEndingSoon: 0,
    streakAtRisk: 0,
  };

  // ────────────────────────────────────────────────────────────
  // 1. Assignment due soon (within 24h) & due now (within 1h)
  // ────────────────────────────────────────────────────────────
  try {
    const assignments = await paginateQuery<any>(client, LIST_ASSIGNMENTS);
    const withDueDates = assignments.filter(
      (a) => a.dueDate && a.status === "PUBLISHED" && a.learner,
    );

    for (const assignment of withDueDates) {
      const dueDate = new Date(assignment.dueDate);
      if (isNaN(dueDate.getTime())) continue;

      // Due within 1h (DUE_NOW)
      if (dueDate > now && dueDate <= in1h) {
        const unitName = await getUnitName(client, assignment.unitID);
        const created = await createNotificationIfNotExists(client, {
          recipientId: assignment.learner,
          type: "ASSIGNMENT_DUE_NOW",
          title: `Assignment Due Now: ${unitName}`,
          body: `Your assignment is due right now!`,
          linkPath: `/workbook/${assignment.unitID}?sectionId=${assignment.sectionID}`,
          linkLabel: "Open Assignment",
          referenceId: assignment.id,
          referenceType: "Assignment",
          senderName: "System",
        });
        if (created) stats.assignmentDueNow++;
      }
      // Due within 24h (DUE_SOON)
      else if (dueDate > in1h && dueDate <= in24h) {
        const unitName = await getUnitName(client, assignment.unitID);
        const created = await createNotificationIfNotExists(client, {
          recipientId: assignment.learner,
          type: "ASSIGNMENT_DUE_SOON",
          title: `Assignment Due Soon: ${unitName}`,
          body: `Due ${dueDate.toLocaleString()}. Don't forget to submit!`,
          linkPath: `/workbook/${assignment.unitID}?sectionId=${assignment.sectionID}`,
          linkLabel: "Open Assignment",
          referenceId: assignment.id,
          referenceType: "Assignment",
          senderName: "System",
        });
        if (created) stats.assignmentDueSoon++;
      }
    }
  } catch (err) {
    console.error("[notificationCron] Assignment check failed:", err);
  }

  // ────────────────────────────────────────────────────────────
  // 2. Challenges ending soon (within 24h)
  // ────────────────────────────────────────────────────────────
  try {
    const challenges = await paginateQuery<any>(client, LIST_CHALLENGES);
    const endingSoon = challenges.filter((c) => {
      if (!c.active || !c.deadline) return false;
      const deadlineDate = new Date(c.deadline);
      return deadlineDate > now && deadlineDate <= in24h;
    });

    // Fetch all guilds once to look up members by cohortId
    const allGuilds = endingSoon.length
      ? await paginateQuery<any>(client, LIST_GUILDS)
      : [];

    for (const challenge of endingSoon) {
      // Find guilds in the same cohort and collect their members
      const cohortGuilds = allGuilds.filter(
        (g) => g.cohortId === challenge.cohortId,
      );
      const memberIds = new Set<string>();
      for (const guild of cohortGuilds) {
        for (const member of guild.members || []) {
          if (member?.studentId) memberIds.add(member.studentId);
        }
      }

      for (const studentId of memberIds) {
        const created = await createNotificationIfNotExists(client, {
          recipientId: studentId,
          type: "CHALLENGE_ENDING_SOON",
          title: `Challenge Ending Soon: ${challenge.title}`,
          body: `Your guild challenge ends within 24 hours. Make your final contributions!`,
          linkPath: `/challenges/${challenge.id}`,
          linkLabel: "View Challenge",
          referenceId: challenge.id,
          referenceType: "GroupChallenge",
          senderName: "System",
        });
        if (created) stats.challengeEndingSoon++;
      }
    }
  } catch (err) {
    console.error("[notificationCron] Challenge check failed:", err);
  }

  // ────────────────────────────────────────────────────────────
  // 3. Streaks at risk (active streak, no activity today)
  // ────────────────────────────────────────────────────────────
  try {
    const profiles = await paginateQuery<any>(client, LIST_STUDENT_PROFILES);
    const atRisk = profiles.filter((p) => {
      if (!p.currentStreak || p.currentStreak < 2) return false;
      if (!p.lastActivityDate) return false;
      // No activity today
      return p.lastActivityDate < today;
    });

    for (const profile of atRisk) {
      const created = await createNotificationIfNotExists(client, {
        recipientId: profile.studentId,
        type: "STREAK_AT_RISK",
        title: `Your ${profile.currentStreak}-day streak is at risk!`,
        body: `You haven't studied today. Log in and complete an activity to keep your streak alive.`,
        referenceId: `streak-risk-${today}`,
        referenceType: "StudentProfile",
        senderName: "System",
        metadata: { currentStreak: profile.currentStreak },
      });
      if (created) stats.streakAtRisk++;
    }
  } catch (err) {
    console.error("[notificationCron] Streak check failed:", err);
  }

  console.log("[notificationCron] Completed:", stats);

  return {
    statusCode: 200,
    body: JSON.stringify(stats),
  };
};
