import { cookies } from "next/headers";
import { fetchAuthSession } from "aws-amplify/auth/server";
import { runWithAmplifyServerContext } from "@/utils/amplifyServerUtils";
import { getServerClient } from "@/utils/amplifyServerClient";
import { redirect } from "next/navigation";
import SectionsClient from "./SectionsClient";

export default async function SectionsPage() {
  // Auth check
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
    // Fall through — client handles auth redirect
  }

  if (!username) {
    redirect("/?returnUrl=" + encodeURIComponent("/sections"));
  }

  // Pre-fetch initial sections for faster first paint
  let initialSections = [];
  try {
    const client = getServerClient();
    const { data } = await client.models.Section.list({ limit: 100 });
    // Strip lazy-load relationship functions (not serializable across RSC boundary)
    initialSections = JSON.parse(JSON.stringify((data || []).filter((s) => s != null)));
  } catch (err) {
    console.error("[Sections RSC] Pre-fetch error:", err);
  }

  return <SectionsClient initialSections={initialSections} />;
}
