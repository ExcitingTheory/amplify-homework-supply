import { cookies } from "next/headers";
import { fetchAuthSession } from "aws-amplify/auth/server";
import { runWithAmplifyServerContext } from "@/utils/amplifyServerUtils";
import { getServerClient } from "@/utils/amplifyServerClient";
import { redirect } from "next/navigation";
import SquadDetailClient from "./SquadDetailClient";

interface SquadPageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function SquadPage({ params }: SquadPageProps) {
  const { id } = await params;

  let username: string | null = null;
  try {
    const session = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: (contextSpec) => fetchAuthSession(contextSpec),
    });
    username =
      (session?.tokens?.idToken?.payload?.["cognito:username"] as
        string | undefined) ||
      (session?.tokens?.idToken?.payload?.sub as string | undefined) ||
      null;
  } catch {
    // Fall through
  }

  if (!username) {
    redirect("/?returnUrl=" + encodeURIComponent(`/squad/${id}`));
  }

  let initialCohortId: string | undefined;
  try {
    const client = getServerClient();
    const { data } = await (client as any).models.Squad.get({ id });
    initialCohortId = data?.cohortId || undefined;
  } catch (err) {
    console.error("[Squad RSC] Pre-fetch error:", err);
  }

  return <SquadDetailClient initialCohortId={initialCohortId} />;
}
