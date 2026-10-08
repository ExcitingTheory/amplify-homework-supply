/**
 * Dev Quick Login API Route
 *
 * Lists the seeded demo users and returns credentials for one of them so the
 * login screen can offer one-click sign-in during local development. Disabled
 * outside NODE_ENV=development; requires TEST_USER_PASSWORD_SEED to be set
 * locally (see .env.local.example) and the sandbox seeded via `npx ampx sandbox seed`.
 */

import { NextRequest, NextResponse } from "next/server";
import { passwordForTestUser } from "../../../../test/devCredentials";

// Mirrors amplify/seed/seed.ts TEST_USERS — keep in sync when seed users change.
const QUICK_LOGIN_USERS = [
  {
    username: "admin@example.com",
    role: "admin",
    displayName: "Admin User",
    description: "Full admin access; not enrolled in any section.",
  },
  {
    username: "instructor1@example.com",
    role: "instructor",
    displayName: "Maria Garcia",
    description:
      "Owns Japanese 101 & Biology 101 — units, assignments, grades, squads, and campaigns.",
  },
  {
    username: "instructor2@example.com",
    role: "instructor",
    displayName: "James Wilson",
    description: "No sections assigned — useful for empty-state testing.",
  },
  {
    username: "student1@example.com",
    role: "student",
    displayName: "Emma Johnson",
    description:
      "Enrolled in both sections; full grades, XP, squad leadership, skills, and AI chat history.",
  },
  {
    username: "student2@example.com",
    role: "student",
    displayName: "Liam Chen",
    description:
      "Enrolled in Japanese 101 only; minimal data for empty-state testing.",
  },
  {
    username: "student3@example.com",
    role: "student",
    displayName: "Aiko Nakamura",
    description: "Enrolled in both sections with completed grades.",
  },
  {
    username: "student4@example.com",
    role: "student",
    displayName: "Marcus Williams",
    description:
      "Enrolled in Japanese 101; at-risk profile with a low grade (52%).",
  },
  {
    username: "student5@example.com",
    role: "student",
    displayName: "Sophia Brown",
    description:
      "Learner account with no seeded content — simulates a brand-new user.",
  },
] as const;

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const username = request.nextUrl.searchParams.get("username");

  // No username requested: return the list of seeded users for the dropdown.
  if (!username) {
    return NextResponse.json({ users: QUICK_LOGIN_USERS });
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
