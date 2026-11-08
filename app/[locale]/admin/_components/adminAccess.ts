/**
 * Who may use the admin area. Everything under /admin is Admins-only unless a
 * route opts into "staff" (analytics and the instructor gamification settings
 * are used by instructors too). New admin tools, such as user management,
 * should stay on the "admins" default.
 */
export type AdminAccess = "admins" | "staff";

export function canAccessAdminArea(
  groups: readonly string[] | undefined | null,
  access: AdminAccess = "admins",
): boolean {
  const list = groups ?? [];
  if (list.includes("Admins")) return true;
  return access === "staff" && list.includes("Instructors");
}
