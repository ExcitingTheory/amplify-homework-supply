interface OwnerSession {
  idToken?: { payload?: Record<string, unknown> };
}

interface OwnableItem {
  owner?: string | null;
  instructor?: string | null;
  learner?: string | null;
  readableGroups?: (string | null)[] | null;
}

/**
 * Identifiers a record's `owner` (or `instructor`) field may hold for the
 * current user. Amplify stores owners as `sub::username` by default, while
 * some records written by Lambdas hold the bare `sub` or username.
 */
export function getOwnerIdentifiers(session?: OwnerSession | null): string[] {
  const payload = session?.idToken?.payload;
  const sub = typeof payload?.sub === "string" ? payload.sub : undefined;
  const username =
    typeof payload?.["cognito:username"] === "string"
      ? (payload["cognito:username"] as string)
      : undefined;
  const ids = [sub, username];
  if (sub && username) ids.push(`${sub}::${username}`);
  return ids.filter((id): id is string => Boolean(id));
}

export function isOwnedByUser(
  item: OwnableItem | null | undefined,
  ownerIds: string[],
): boolean {
  if (!item || ownerIds.length === 0) return false;
  return [item.owner, item.instructor].some(
    (value) => typeof value === "string" && ownerIds.includes(value),
  );
}

/**
 * True when one of the user's groups is a learner group that grants access to
 * the item (the section's `learner` group or a `section-{id}-learners` entry
 * in its readable groups).
 */
export function isAttendingViaLearnerGroup(
  item: OwnableItem | null | undefined,
  groups: string[],
): boolean {
  if (!item || groups.length === 0) return false;
  if (item.learner && groups.includes(item.learner)) return true;
  return (item.readableGroups ?? []).some(
    (group) =>
      typeof group === "string" &&
      group.endsWith("-learners") &&
      groups.includes(group),
  );
}

/**
 * Splits items by how the user reaches them: owned, attending (through a
 * learner group), or administering (any other granted access, such as an
 * instructor group or the Admins group).
 */
export function partitionByAccess<T extends OwnableItem>(
  items: T[],
  ownerIds: string[],
  groups: string[],
): { owned: T[]; attending: T[]; administering: T[] } {
  const owned: T[] = [];
  const attending: T[] = [];
  const administering: T[] = [];
  for (const item of items) {
    if (isOwnedByUser(item, ownerIds)) owned.push(item);
    else if (isAttendingViaLearnerGroup(item, groups)) attending.push(item);
    else administering.push(item);
  }
  return { owned, attending, administering };
}
