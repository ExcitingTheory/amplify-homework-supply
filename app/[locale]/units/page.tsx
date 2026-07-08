import { cookies } from "next/headers";
import { fetchAuthSession } from "aws-amplify/auth/server";
import { runWithAmplifyServerContext } from "@/utils/amplifyServerUtils";
import { getServerClient } from "@/utils/amplifyServerClient";
import { redirect } from "next/navigation";
import UnitsClient from "./UnitsClient";

export default async function UnitsPage() {
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
    redirect("/?returnUrl=" + encodeURIComponent("/units"));
  }

  // Pre-fetch initial units for faster first paint
  let initialUnits = [];
  try {
    const client = getServerClient();
    const { data } = await client.models.Unit.list({ limit: 200 });
    // Strip lazy-load relationship functions (not serializable across RSC boundary)
    initialUnits = JSON.parse(JSON.stringify((data || []).filter((u) => u != null)));
  } catch (err) {
    console.error("[Units RSC] Pre-fetch error:", err);
  }

  return <UnitsClient initialUnits={initialUnits} />;
}
