/**
 * Who may read a unit's or section's search bundle.
 *
 * Bundles live at keys no client storage rule grants, so they are only reachable
 * through server code that calls these checks (the /api/search-bundle route and
 * the agent's semantic_search tool). Access follows the same enrollment signal
 * the rest of the app uses: the Cognito `section-{id}-learners` /
 * `section-{id}-instructors` groups, plus ownership and collaborator grants.
 */

import { getServerClient } from "@/utils/amplifyServerClient";

// Must match unitBundleKey / sectionBundleKey in
// amplify/functions/rebuildSearchBundle/handler.ts (which writes them).
export const unitBundlePath = (unitId: string) =>
  `search-index/unit/${unitId}.json`;
export const sectionBundlePath = (sectionId: string) =>
  `search-index/section/${sectionId}.json`;

/** An instructor's whole-content bundle; keyed by their identity id. */
export const instructorBundlePath = (identityId: string) =>
  `search-index/instructor/${identityId}.json`;

export type BundleKind = "unit" | "section" | "instructor";

export interface BundleUser {
  userId: string;
  groups: string[];
  /** Verified session identity id; never a client-supplied value. */
  identityId?: string;
  /** Values a record's `owner` field may hold for this user. */
  ownerIds: string[];
}

export interface BundleAccessData {
  getUnit(
    unitId: string,
  ): Promise<{ identityId?: string | null; owner?: string | null } | null>;
  getSection(sectionId: string): Promise<{ instructor?: string | null } | null>;
  isCollaborator(unitId: string, userId: string): Promise<boolean>;
  sectionAssignsUnit(sectionId: string, unitId: string): Promise<boolean>;
}

const SECTION_GROUP = /^section-(.+)-(learners|instructors)$/;
// A user is rarely in more than a few sections; this only bounds lookups.
const MAX_SECTION_LOOKUPS = 50;

/** Section ids the user belongs to, as a learner or an instructor. */
export function enrolledSectionIds(groups: readonly string[]): string[] {
  const ids = new Set<string>();
  for (const group of groups) {
    const match = SECTION_GROUP.exec(group);
    if (match) ids.add(match[1]);
  }
  return [...ids];
}

const isAdmin = (user: BundleUser) => user.groups.includes("Admins");

export async function canReadSectionBundle(
  user: BundleUser,
  sectionId: string,
  data: BundleAccessData,
): Promise<boolean> {
  if (isAdmin(user)) return true;
  if (enrolledSectionIds(user.groups).includes(sectionId)) return true;

  const section = await data.getSection(sectionId);
  return !!section?.instructor && user.ownerIds.includes(section.instructor);
}

export async function canReadUnitBundle(
  user: BundleUser,
  unitId: string,
  data: BundleAccessData,
): Promise<boolean> {
  if (isAdmin(user)) return true;

  const unit = await data.getUnit(unitId);
  if (!unit) return false;

  if (
    (unit.identityId && unit.identityId === user.identityId) ||
    (unit.owner && user.ownerIds.includes(unit.owner))
  ) {
    return true;
  }

  const sections = enrolledSectionIds(user.groups).slice(
    0,
    MAX_SECTION_LOOKUPS,
  );
  const viaSection = (
    await Promise.all(
      sections.map((id) => data.sectionAssignsUnit(id, unitId)),
    )
  ).some(Boolean);
  if (viaSection) return true;

  // The collaborator lookup scans a table, so only reach for it when needed.
  return data.isCollaborator(unitId, user.userId);
}

/**
 * Only the owner reads their instructor bundle, matched against the verified
 * session identity (never a client-supplied one). Admins use the platform
 * bundle instead of reading individual instructors' bundles.
 */
export function canReadInstructorBundle(
  user: BundleUser,
  identityId: string,
): boolean {
  return !!user.identityId && user.identityId === identityId;
}

export async function canReadBundle(
  kind: BundleKind,
  user: BundleUser,
  id: string,
  data: BundleAccessData,
): Promise<boolean> {
  if (kind === "instructor") return canReadInstructorBundle(user, id);
  return kind === "unit"
    ? canReadUnitBundle(user, id, data)
    : canReadSectionBundle(user, id, data);
}

// ─── AppSync-backed data access ──────────────────────────────────────────────

/** Reads through the caller's own session, so AppSync authorization still applies. */
export function createBundleAccessData(
  client: any = getServerClient(),
): BundleAccessData {
  return {
    async getUnit(unitId) {
      const { data } = await client.models.Unit.get(
        { id: unitId },
        { selectionSet: ["id", "identityId", "owner"] },
      );
      return data ?? null;
    },

    async getSection(sectionId) {
      const { data } = await client.models.Section.get(
        { id: sectionId },
        { selectionSet: ["id", "instructor"] },
      );
      return data ?? null;
    },

    async isCollaborator(unitId, userId) {
      let nextToken: string | null | undefined;
      do {
        const page: any = await client.models.CollaboratorAccess.list({
          filter: {
            unitID: { eq: unitId },
            collaboratorId: { eq: userId },
          },
          selectionSet: ["id"],
          nextToken,
        });
        if ((page.data ?? []).some(Boolean)) return true;
        nextToken = page.nextToken;
      } while (nextToken);
      return false;
    },

    // Walks only that section's assignments (an indexed lookup through the
    // Section relationship), not the whole Assignment table.
    async sectionAssignsUnit(sectionId, unitId) {
      const { data: section } = await client.models.Section.get({
        id: sectionId,
      });
      if (!section?.assignments) return false;

      let nextToken: string | null | undefined;
      do {
        const page: any = await section.assignments({
          filter: { unitID: { eq: unitId } },
          nextToken,
        });
        if ((page.data ?? []).some(Boolean)) return true;
        nextToken = page.nextToken;
      } while (nextToken);
      return false;
    },
  };
}
