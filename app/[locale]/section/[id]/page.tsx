import { cookies } from "next/headers";
import { fetchAuthSession } from "aws-amplify/auth/server";
import { runWithAmplifyServerContext } from "@/utils/amplifyServerUtils";
import { getServerClient } from "@/utils/amplifyServerClient";
import { redirect } from "next/navigation";
import SectionDetailClient from "./SectionDetailClient";

interface SectionPageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function SectionPage({ params }: SectionPageProps) {
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
    redirect("/?returnUrl=" + encodeURIComponent(`/section/${id}`));
  }

  let initialSection: unknown = null;
  let initialAssignments: unknown[] = [];

  try {
    const client = getServerClient();

    const [sectionRes, assignmentsRes] = await Promise.all([
      (client as any).models.Section.get({ id }),
      (client as any).models.Assignment.list({
        filter: { sectionID: { eq: id } },
        limit: 200,
      }),
    ]);

    if (sectionRes?.data) {
      initialSection = JSON.parse(JSON.stringify(sectionRes.data));
    }
    initialAssignments = JSON.parse(
      JSON.stringify(
        (assignmentsRes?.data || []).filter((a: unknown) => a != null),
      ),
    );
  } catch (err) {
    console.error("[SectionDetail RSC] Pre-fetch error:", err);
  }

  return (
    <SectionDetailClient
      initialSection={initialSection}
      initialAssignments={initialAssignments}
    />
  );
}
