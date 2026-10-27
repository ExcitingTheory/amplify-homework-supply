import { cookies } from "next/headers";
import { fetchAuthSession } from "aws-amplify/auth/server";
import { runWithAmplifyServerContext } from "@/utils/amplifyServerUtils";
import { redirect } from "next/navigation";
import InstructorClient from "./InstructorClient";

const INSTRUCTOR_GROUPS = ["Admins", "Moderators", "Instructors"];

/**
 * Instructor dashboard (class health, grading queue, section analytics).
 * Admins, Moderators, and Instructors only; learners go back to their own
 * dashboard at "/".
 */
export default async function InstructorPage() {
  let username: string | null = null;
  let groups: string[] = [];
  try {
    const session = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: (contextSpec) => fetchAuthSession(contextSpec),
    });
    const payload = session?.tokens?.idToken?.payload as
      | { "cognito:username"?: string; sub?: string; "cognito:groups"?: string[] }
      | undefined;
    username = payload?.["cognito:username"] || payload?.sub || null;
    groups = payload?.["cognito:groups"] || [];
  } catch {
    // Fall through — treated as unauthenticated below
  }

  if (!username) {
    redirect("/?returnUrl=" + encodeURIComponent("/instructor"));
  }

  if (!groups.some((g) => INSTRUCTOR_GROUPS.includes(g))) {
    redirect("/");
  }

  return <InstructorClient />;
}
