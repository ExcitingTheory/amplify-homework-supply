import { cookies } from "next/headers";
import { fetchAuthSession } from "aws-amplify/auth/server";
import { runWithAmplifyServerContext } from "@/utils/amplifyServerUtils";
import { getServerClient } from "@/utils/amplifyServerClient";
import { redirect } from "next/navigation";
import ModerationClient, { type FlaggedItem } from "./ModerationClient";

/**
 * Content moderation dashboard. Authenticates server-side (Admins/Instructors
 * only) and pre-fetches all flagged content across models, delegating the
 * content-type filter to the client.
 */
export default async function ModerationDashboardPage() {
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
    redirect("/?returnUrl=" + encodeURIComponent("/admin/moderation"));
  }

  let initialItems: FlaggedItem[] = [];
  try {
    const client = getServerClient() as any;
    const models: Array<{ name: string; model: any }> = [
      { name: "Grade", model: client.models.Grade },
      { name: "Unit", model: client.models.Unit },
      { name: "Word", model: client.models.Word },
      { name: "Question", model: client.models.Question },
    ];

    const allFlagged: FlaggedItem[] = [];
    for (const { name, model } of models) {
      try {
        const { data } = await model.list({
          filter: { moderationStatus: { eq: "flagged" } },
          limit: 100,
        });
        for (const item of data || []) {
          if (!item) continue;
          allFlagged.push({
            id: item.id,
            modelName: name,
            owner: item.owner || item.ownerId || null,
            moderation: item.moderation || {
              status: item.moderationStatus,
              flags: item.moderationFlags,
              checkedAt: item.moderationCheckedAt,
            },
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            sectionId: item.sectionID || null,
          });
        }
      } catch (err) {
        console.warn(`[Moderation RSC] Failed to load flagged ${name}s:`, err);
      }
    }

    allFlagged.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
    initialItems = JSON.parse(JSON.stringify(allFlagged));
  } catch (err) {
    console.error("[Moderation RSC] Pre-fetch error:", err);
  }

  return <ModerationClient initialItems={initialItems} />;
}
