import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchAuthSession } from "aws-amplify/auth/server";
import { runWithAmplifyServerContext } from "@/utils/amplifyServerUtils";

export default async function ProfileRedirectPage() {
  let sub = null;

  try {
    const session = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: (contextSpec) => fetchAuthSession(contextSpec),
    });

    sub = session?.tokens?.idToken?.payload?.sub;
  } catch {
    // Auth failed — fall through to login redirect
  }

  if (sub) {
    redirect(`/profile/${sub}`);
  }

  redirect("/?returnUrl=/profile");
}
