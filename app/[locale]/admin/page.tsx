import { cookies } from "next/headers";
import { fetchAuthSession } from "aws-amplify/auth/server";
import { runWithAmplifyServerContext } from "@/utils/amplifyServerUtils";
import { getServerClient } from "@/utils/amplifyServerClient";
import { redirect } from "next/navigation";
import { canAccessAdminArea } from "./_components/adminAccess";
import { Suspense } from "react";
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

type TriageFilter = { filter: Record<string, unknown> };

async function countMatching(
  modelName: string,
  { filter }: TriageFilter,
): Promise<number> {
  try {
    const client = getServerClient() as any;
    const { data } = await client.models[modelName].list({ filter, limit: 100 });
    return (data || []).filter((item: unknown) => item != null).length;
  } catch {
    return 0;
  }
}

async function sumCounts(counts: Promise<number>[]): Promise<number> {
  return (await Promise.all(counts)).reduce((sum, n) => sum + n, 0);
}

/**
 * Streams in after the page shell: all 11 triage queries run concurrently
 * instead of blocking the first paint.
 */
async function AdminIndexWithCounts() {
  const [flaggedCount, recycleBinCount] = await Promise.all([
    sumCounts(
      MODERATION_MODELS.map((modelName) =>
        countMatching(modelName, {
          filter: { moderationStatus: { eq: "flagged" } },
        }),
      ),
    ),
    sumCounts(
      SOFT_DELETE_MODELS.map((modelName) =>
        countMatching(modelName, {
          filter: { deletedAt: { attributeExists: true } },
        }),
      ),
    ),
  ]);

  return (
    <AdminIndexClient
      flaggedCount={flaggedCount}
      recycleBinCount={recycleBinCount}
    />
  );
}

/**
 * Admin index/directory page. Authenticates server-side (Admins
 * only), renders the tool directory immediately, and streams in lightweight
 * triage counts (flagged content, recycle bin size) so the index can highlight
 * what needs attention without delaying the first paint.
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

  if (!canAccessAdminArea(groups)) {
    redirect("/?returnUrl=" + encodeURIComponent("/admin"));
  }

  return (
    <Suspense fallback={<AdminIndexClient />}>
      <AdminIndexWithCounts />
    </Suspense>
  );
}
