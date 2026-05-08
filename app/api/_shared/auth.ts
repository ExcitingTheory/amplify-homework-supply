/**
 * Auth validation for Route Handlers.
 *
 * Uses Amplify's server-side auth to verify the user has a valid session
 * before allowing access to AI-powered endpoints.
 */

import { runWithAmplifyServerContext } from "@/utils/amplifyServerUtils";
import { fetchAuthSession } from "aws-amplify/auth/server";
import { cookies } from "next/headers";

export interface AuthResult {
  authenticated: boolean;
  userId?: string;
  groups?: string[];
}

/**
 * Validate the current request has a valid Amplify auth session.
 * Returns the userId and groups if authenticated.
 */
export async function validateAuth(): Promise<AuthResult> {
  try {
    const session = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: (contextSpec) => fetchAuthSession(contextSpec),
    });

    const idToken = session?.tokens?.idToken;
    if (!idToken) {
      return { authenticated: false };
    }

    const userId = idToken.payload?.sub as string;
    const groups = (idToken.payload?.["cognito:groups"] as string[]) || [];

    return { authenticated: true, userId, groups };
  } catch {
    return { authenticated: false };
  }
}

/**
 * Returns a 401 Response if the user is not authenticated.
 * Use at the top of Route Handlers:
 *
 * ```ts
 * const authError = await requireAuth();
 * if (authError) return authError;
 * ```
 */
export async function requireAuth(): Promise<Response | null> {
  const { authenticated } = await validateAuth();
  if (!authenticated) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return null;
}
