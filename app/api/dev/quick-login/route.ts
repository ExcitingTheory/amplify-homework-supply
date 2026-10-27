/**
 * Dev Quick Login API Route
 *
 * Returns credentials for one of the seeded demo users (see
 * src/utils/quickLoginUsers.ts) so the login screen can offer one-click
 * sign-in during local development. Disabled
 * unless NODE_ENV=development or a demo deployment sets
 * NEXT_PUBLIC_DEMO_QUICK_LOGIN=true; requires TEST_USER_PASSWORD_SEED to be set
 * (see .env.local.example) and the backend seeded via `npx ampx sandbox seed`.
 * Only enable the flag on a deployment whose users are disposable demo data.
 */

import { NextRequest, NextResponse } from "next/server";
import { QUICK_LOGIN_USERS } from "@/utils/quickLoginUsers";
import { passwordForTestUser } from "../../../../test/devCredentials";

// Enabled in development, or on a demo deployment that opts in explicitly.
function isQuickLoginEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_DEMO_QUICK_LOGIN === "true"
  );
}

export async function GET(request: NextRequest) {
  if (!isQuickLoginEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const username = request.nextUrl.searchParams.get("username");

  if (!username) {
    return NextResponse.json({ error: "Missing username" }, { status: 400 });
  }

  const match = QUICK_LOGIN_USERS.find((u) => u.username === username);
  if (!match) {
    return NextResponse.json({ error: "Invalid username" }, { status: 400 });
  }

  try {
    const password = passwordForTestUser(match.username);
    return NextResponse.json({ username: match.username, password });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to derive credentials",
      },
      { status: 500 },
    );
  }
}
