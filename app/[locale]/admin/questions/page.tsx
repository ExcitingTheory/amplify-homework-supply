import { cookies } from "next/headers";
import { fetchAuthSession } from "aws-amplify/auth/server";
import { runWithAmplifyServerContext } from "@/utils/amplifyServerUtils";
import { getServerClient } from "@/utils/amplifyServerClient";
import { redirect } from "next/navigation";
import QuestionListClient from "./QuestionListClient";

const QUESTION_SELECTION_SET = [
  "id",
  "prompt",
  "answer",
  "hint",
  "choices",
  "audio",
  "answerAudio",
  "generated",
  "model",
  "difficulty",
  "owner",
  "createdAt",
  "updatedAt",
  "moderation.*",
  "embedding.*",
] as const;

/**
 * Admin question-list maintenance. Authenticates server-side (Admins/Instructors
 * only) and pre-fetches the full question bank, delegating all interactivity
 * (filtering, search, bulk delete, refresh) to the client component.
 */
export default async function QuestionListMaintenancePage() {
  let groups: string[] = [];
  try {
    const session = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: (contextSpec) => fetchAuthSession(contextSpec),
    });
    const payload = session?.tokens?.idToken?.payload as
      { "cognito:groups"?: string[] } | undefined;
    groups = payload?.["cognito:groups"] || [];
  } catch {
    // Fall through — treated as no access below
  }

  if (!groups.includes("Admins") && !groups.includes("Instructors")) {
    redirect("/?returnUrl=" + encodeURIComponent("/admin/questions"));
  }

  let initialQuestions: unknown = [];
  try {
    const client = getServerClient();
    const allQuestions: unknown[] = [];
    let nextToken: string | null = null;
    do {
      const {
        data,
        nextToken: token,
      }: { data: unknown[]; nextToken: string | null } = await (
        client as any
      ).models.Question.list({
        limit: 500,
        nextToken,
        selectionSet: QUESTION_SELECTION_SET,
      });
      for (const item of data || []) {
        if (item) allQuestions.push(item);
      }
      nextToken = token || null;
    } while (nextToken);
    initialQuestions = JSON.parse(JSON.stringify(allQuestions));
  } catch (err) {
    console.error("[AdminQuestions RSC] Pre-fetch error:", err);
  }

  return <QuestionListClient initialQuestions={initialQuestions as never} />;
}
