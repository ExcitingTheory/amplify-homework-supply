import { cookies } from "next/headers";
import { fetchAuthSession } from "aws-amplify/auth/server";
import { runWithAmplifyServerContext } from "@/utils/amplifyServerUtils";
import { getServerClient } from "@/utils/amplifyServerClient";
import { redirect } from "next/navigation";
import SectionAISettingsClient from "./SectionAISettingsClient";

interface SectionAISettingsPageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function SectionAISettingsPage({
  params,
}: SectionAISettingsPageProps) {
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
    redirect("/?returnUrl=" + encodeURIComponent(`/section/${id}/settings/ai`));
  }

  let initialSection: unknown = null;
  try {
    const client = getServerClient();
    const { data } = await (client as any).models.Section.get({ id });
    if (data) {
      initialSection = JSON.parse(JSON.stringify(data));
    }
  } catch (err) {
    console.error("[SectionAISettings RSC] Pre-fetch error:", err);
  }

  return <SectionAISettingsClient initialSection={initialSection} />;
}
