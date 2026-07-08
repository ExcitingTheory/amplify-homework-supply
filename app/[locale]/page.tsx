import { cookies } from "next/headers";
import { fetchAuthSession } from "aws-amplify/auth/server";
import { runWithAmplifyServerContext } from "@/utils/amplifyServerUtils";
import { getServerClient } from "@/utils/amplifyServerClient";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  // Auth check — if no session, render with empty data and let client-side
  // AuthGate handle showing the login form (no server redirect needed).
  let username = null;
  try {
    const session = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: (contextSpec) => fetchAuthSession(contextSpec),
    });
    username =
      session?.tokens?.idToken?.payload?.["cognito:username"] ||
      session?.tokens?.idToken?.payload?.sub;
  } catch {
    // Fall through — client handles auth
  }

  // Pre-fetch initial data for faster first paint (only if authenticated)
  let initialSections: unknown[] = [];
  let initialAssignments: unknown[] = [];
  let initialGrades: unknown[] = [];

  if (username) {
    try {
      const client = getServerClient();

      const [sectionsRes, assignmentsRes, gradesRes] = await Promise.all([
        client.models.Section.list({ limit: 100 }),
        client.models.Assignment.list({ limit: 200 }),
        client.models.Grade.list({
          filter: { owner: { eq: username } },
          limit: 200,
        }),
      ]);

      // Strip lazy-load relationship functions (not serializable across RSC boundary)
      initialSections = JSON.parse(JSON.stringify((sectionsRes?.data || []).filter((s: unknown) => s != null)));
      initialAssignments = JSON.parse(JSON.stringify((assignmentsRes?.data || []).filter((a: unknown) => a != null)));
      initialGrades = JSON.parse(JSON.stringify((gradesRes?.data || []).filter((g: unknown) => g != null)));
    } catch (err) {
      console.error("[Dashboard RSC] Pre-fetch error:", err);
    }
  }

  return (
    <DashboardClient
      initialSections={initialSections}
      initialAssignments={initialAssignments}
      initialGrades={initialGrades}
    />
  );
}
