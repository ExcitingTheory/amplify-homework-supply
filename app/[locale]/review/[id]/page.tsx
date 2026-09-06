import { cookies } from "next/headers";
import { fetchAuthSession } from "aws-amplify/auth/server";
import { runWithAmplifyServerContext } from "@/utils/amplifyServerUtils";
import { redirect } from "next/navigation";
import PeerReviewClient from "./PeerReviewClient";

interface PeerReviewPageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function PeerReviewPage({ params }: PeerReviewPageProps) {
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
    redirect("/?returnUrl=" + encodeURIComponent(`/review/${id}`));
  }

  return <PeerReviewClient />;
}
