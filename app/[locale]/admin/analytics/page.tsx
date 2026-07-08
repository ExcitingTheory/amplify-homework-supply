import { cookies } from "next/headers";
import { fetchAuthSession } from "aws-amplify/auth/server";
import { runWithAmplifyServerContext } from "@/utils/amplifyServerUtils";
import { getServerClient } from "@/utils/amplifyServerClient";
import { redirect } from "next/navigation";
import AnalyticsClient from "./AnalyticsClient";

export default async function AnalyticsPage() {
  // Auth check — admin pages require authentication
  try {
    const session = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: (contextSpec) => fetchAuthSession(contextSpec),
    });
    if (!session?.tokens?.idToken) {
      redirect("/");
    }
  } catch {
    redirect("/");
  }

  // Pre-fetch sections list for the date-range filter
  let initialSections = [];
  try {
    const client = getServerClient();
    const { data } = await client.models.Section.list({ limit: 100 });
    // Strip lazy-load relationship functions (not serializable across RSC boundary)
    initialSections = JSON.parse(JSON.stringify((data || []).filter((s) => s != null)));
  } catch (err) {
    console.error("[Analytics RSC] Failed to pre-fetch sections:", err);
  }

  return <AnalyticsClient initialSections={initialSections} />;
}
