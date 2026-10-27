/**
 * Seeded demo users offered by the dev quick-login screen.
 *
 * Shared by the client login UI (renders the list without a network round
 * trip) and the /api/dev/quick-login route (validates the requested username
 * before deriving its password). Contains no credentials.
 */

export type QuickLoginRole = "admin" | "instructor" | "student";

// Mirrors amplify/seed/seed.ts TEST_USERS — keep in sync when seed users change.
export const QUICK_LOGIN_USERS = [
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
] as const satisfies readonly {
  username: string;
  role: QuickLoginRole;
  displayName: string;
  description: string;
}[];
