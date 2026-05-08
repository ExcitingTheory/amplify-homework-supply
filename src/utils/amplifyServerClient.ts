import { generateServerClientUsingCookies } from "@aws-amplify/adapter-nextjs/data";
import { cookies } from "next/headers";
import outputs from "@/../amplify_outputs.json";

/**
 * Server-side Amplify Data Client for use in React Server Components and Server Actions.
 * Uses the user's auth cookies for authenticated access.
 *
 * IMPORTANT: Must only be called inside Server Components, Server Actions, or Route Handlers.
 */
export function getServerClient() {
  return generateServerClientUsingCookies({ config: outputs, cookies });
}
