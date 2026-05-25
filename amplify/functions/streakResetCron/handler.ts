/**
 * Streak Reset Cron Handler
 *
 * Runs daily. Scans all StudentProfile records and resets currentStreak to 0
 * for any student whose lastActivityDate is before yesterday (UTC).
 */

import type { Handler } from "aws-lambda";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { fromEnv } from "@aws-sdk/credential-providers";

const LIST_PROFILES = `query ListStudentProfiles($nextToken: String) {
  listStudentProfiles(limit: 100, nextToken: $nextToken) {
    items { id studentId currentStreak longestStreak lastActivityDate _version _lastChangedAt _deleted }
    nextToken
  }
}`;

const UPDATE_PROFILE = `mutation UpdateStudentProfile($input: UpdateStudentProfileInput!) {
  updateStudentProfile(input: $input) { id studentId currentStreak _version _lastChangedAt _deleted }
}`;

let client: any = null;

function getClient() {
  if (!client) {
    Amplify.configure(
      {
        API: {
          GraphQL: {
            endpoint: process.env.API_ENDPOINT || "",
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
    client = generateClient({ authMode: "iam" });
  }
  return client;
}

export const handler: Handler = async () => {
  const gql = getClient();

  // Yesterday at start of day UTC
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  yesterday.setUTCHours(0, 0, 0, 0);
  const yesterdayISO = yesterday.toISOString().split("T")[0]; // YYYY-MM-DD

  let nextToken: string | null = null;
  let resetCount = 0;

  do {
    const result: any = await gql.graphql({
      query: LIST_PROFILES,
      variables: { nextToken },
    });

    const items = result?.data?.listStudentProfiles?.items || [];
    nextToken = result?.data?.listStudentProfiles?.nextToken || null;

    for (const profile of items) {
      if (!profile || profile.currentStreak === 0) continue;

      // Compare lastActivityDate (YYYY-MM-DD or ISO) to yesterday
      const lastDate = profile.lastActivityDate
        ? profile.lastActivityDate.split("T")[0]
        : null;

      if (!lastDate || lastDate < yesterdayISO) {
        try {
          await gql.graphql({
            query: UPDATE_PROFILE,
            variables: {
              input: {
                id: profile.id,
                currentStreak: 0,
                _version: profile._version ?? 1,
              },
            },
          });
          resetCount++;
        } catch (err: any) {
          console.error(
            `[streakResetCron] Failed to reset streak for ${profile.studentId}:`,
            err?.message || err,
          );
        }
      }
    }
  } while (nextToken);

  console.log(`[streakResetCron] Reset ${resetCount} streaks`);
  return { statusCode: 200, body: JSON.stringify({ resetCount }) };
};
