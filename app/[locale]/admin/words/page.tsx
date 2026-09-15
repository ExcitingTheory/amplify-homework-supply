import { cookies } from "next/headers";
import { fetchAuthSession } from "aws-amplify/auth/server";
import { runWithAmplifyServerContext } from "@/utils/amplifyServerUtils";
import { getServerClient } from "@/utils/amplifyServerClient";
import { redirect } from "next/navigation";
import WordListClient from "./WordListClient";

const WORD_SELECTION_SET = [
  "id",
  "phrase",
  "pronunciation",
  "definition",
  "audio",
  "definitionAudio",
  "owner",
  "createdAt",
  "updatedAt",
  "moderation.*",
  "embedding.*",
] as const;

/**
 * Admin word-list maintenance. Authenticates server-side (Admins/Instructors
 * only) and pre-fetches the full vocabulary list, delegating all interactivity
 * (filtering, search, bulk delete, refresh) to the client component.
 */
export default async function WordListMaintenancePage() {
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
    redirect("/?returnUrl=" + encodeURIComponent("/admin/words"));
  }

  let initialWords: unknown = [];
  try {
    const client = getServerClient();
    const allWords: unknown[] = [];
    let nextToken: string | null = null;
    do {
      const {
        data,
        nextToken: token,
      }: { data: unknown[]; nextToken: string | null } = await (
        client as any
      ).models.Word.list({
        limit: 500,
        nextToken,
        selectionSet: WORD_SELECTION_SET,
      });
      for (const item of data || []) {
        if (item) allWords.push(item);
      }
      nextToken = token || null;
    } while (nextToken);
    initialWords = JSON.parse(JSON.stringify(allWords));
  } catch (err) {
    console.error("[AdminWords RSC] Pre-fetch error:", err);
  }

  return <WordListClient initialWords={initialWords as never} />;
}
