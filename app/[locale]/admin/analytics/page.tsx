import { cookies } from "next/headers";
import { fetchAuthSession } from "aws-amplify/auth/server";
import { runWithAmplifyServerContext } from "@/utils/amplifyServerUtils";
import { redirect } from "next/navigation";
import { canAccessAdminArea } from "../_components/adminAccess";
import AnalyticsClient from "./AnalyticsClient";

export default async function AnalyticsPage() {
  // Analytics is open to instructors as well as admins.
  let groups: string[] = [];
  try {
    const session = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: (contextSpec) => fetchAuthSession(contextSpec),
    });
    const payload = session?.tokens?.idToken?.payload as
      { "cognito:groups"?: string[] } | undefined;
    groups = payload?.["cognito:groups"] || [];
  } catch {
    // Fall through — treated as no access below
  }

  if (!canAccessAdminArea(groups, "staff")) {
    redirect("/?returnUrl=" + encodeURIComponent("/admin/analytics"));
  }

  return <AnalyticsClient />;
}
