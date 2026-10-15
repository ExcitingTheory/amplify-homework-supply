import { cookies } from "next/headers";
import { fetchAuthSession } from "aws-amplify/auth/server";
import { runWithAmplifyServerContext } from "@/utils/amplifyServerUtils";
import { getServerClient } from "@/utils/amplifyServerClient";
import { redirect } from "next/navigation";
import AdminIndexClient from "./AdminIndexClient";

// Mirrors ModerationClient's model coverage — Grade/Unit/Word/Question only
// (AssistantChat isn't in the moderation queue yet, see docs/ADMIN_MANAGEMENT_PLAN.md).
const MODERATION_MODELS = ["Grade", "Unit", "Word", "Question"] as const;

// Mirrors recycleBinContext's MODELS_WITH_SOFT_DELETE.
const SOFT_DELETE_MODELS = [
  "Unit",
  "Section",
  "Question",
  "Word",
  "File",
  "Document",
  "AssistantChat",
] as const;

/**
 * Admin index/directory page. Authenticates server-side (Admins/Instructors
 * only) and pre-fetches lightweight triage counts (flagged content, recycle
 * bin size) so the index can highlight what needs attention before linking
 * out to the individual admin tools.
 */
export default async function AdminIndexPage() {
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
    redirect("/?returnUrl=" + encodeURIComponent("/admin"));
  }

  let flaggedCount = 0;
  let recycleBinCount = 0;
  try {
    const client = getServerClient() as any;

    const flaggedCounts = await Promise.all(
      MODERATION_MODELS.map(async (modelName) => {
        try {
          const { data } = await client.models[modelName].list({
            filter: { moderationStatus: { eq: "flagged" } },
            limit: 100,
          });
          return (data || []).filter((item: unknown) => item != null).length;
        } catch {
          return 0;
        }
      }),
    );
    flaggedCount = flaggedCounts.reduce((sum, n) => sum + n, 0);

    const recycleBinCounts = await Promise.all(
      SOFT_DELETE_MODELS.map(async (modelName) => {
        try {
          const { data } = await client.models[modelName].list({
            filter: { deletedAt: { attributeExists: true } },
            limit: 100,
          });
          return (data || []).filter((item: unknown) => item != null).length;
        } catch {
          return 0;
        }
      }),
    );
    recycleBinCount = recycleBinCounts.reduce((sum, n) => sum + n, 0);
  } catch (err) {
    console.error("[AdminIndex RSC] Pre-fetch error:", err);
  }

  return (
    <AdminIndexClient
      flaggedCount={flaggedCount}
      recycleBinCount={recycleBinCount}
    />
  );
}
