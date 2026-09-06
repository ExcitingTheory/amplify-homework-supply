import { cookies } from "next/headers";
import { fetchAuthSession } from "aws-amplify/auth/server";
import { runWithAmplifyServerContext } from "@/utils/amplifyServerUtils";
import { getServerClient } from "@/utils/amplifyServerClient";
import { redirect } from "next/navigation";
import UnitsClient from "./UnitsClient";

export default async function UnitsPage() {
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
    // Fall through
  }

  if (!username) {
    redirect("/?returnUrl=" + encodeURIComponent("/units"));
  }

  let initialUnits: any = [];
  try {
    const client = getServerClient();
    const { data } = await client.models.Unit.list({ limit: 200 });
    initialUnits = JSON.parse(
      JSON.stringify((data || []).filter((u: unknown) => u != null)),
    );
  } catch (err) {
    console.error("[Units RSC] Pre-fetch error:", err);
  }

  return <UnitsClient initialUnits={initialUnits} />;
}
