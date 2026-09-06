import { cookies } from "next/headers";
import { fetchAuthSession } from "aws-amplify/auth/server";
import { runWithAmplifyServerContext } from "@/utils/amplifyServerUtils";
import { getServerClient } from "@/utils/amplifyServerClient";
import { redirect } from "next/navigation";
import SectionsClient from "./SectionsClient";

export default async function SectionsPage() {
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
    redirect("/?returnUrl=" + encodeURIComponent("/sections"));
  }

  let initialSections: any = [];
  try {
    const client = getServerClient();
    const { data } = await client.models.Section.list({ limit: 100 });
    initialSections = JSON.parse(
      JSON.stringify((data || []).filter((s: unknown) => s != null)),
    );
  } catch (err) {
    console.error("[Sections RSC] Pre-fetch error:", err);
  }

  return <SectionsClient initialSections={initialSections} />;
}
