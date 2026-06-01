interface UserNameFields {
  firstName?: string;
  lastName?: string;
  preferredName?: string;
  name?: string;
  id?: string;
}

/**
 * Format a user's display name as "Last, Preferred" (or "Last, First" if no preferred name).
 * Falls back to legacy `name` field, then `id`.
 */
export function formatLastFirst(user: UserNameFields): string {
  const last = user.lastName?.trim();
  const preferred = user.preferredName?.trim();
  const first = user.firstName?.trim();

  if (last && (preferred || first)) {
    return `${last}, ${preferred || first}`;
  }
  return user.name || user.id || "";
}

/**
 * Format a user's display name as "Preferred Last" (or "First Last" if no preferred name).
 * Falls back to legacy `name` field, then `id`.
 */
export function formatFirstLast(user: UserNameFields): string {
  const last = user.lastName?.trim();
  const preferred = user.preferredName?.trim();
  const first = user.firstName?.trim();

  if (last && (preferred || first)) {
    return `${preferred || first} ${last}`;
  }
  return user.name || user.id || "";
}

/**
 * Get initials from user name fields for avatars.
 * Uses preferred name initial + last name initial when available.
 */
export function getInitials(user: UserNameFields): string {
  const preferred = user.preferredName?.trim();
  const first = user.firstName?.trim();
  const last = user.lastName?.trim();
  const displayFirst = preferred || first;

  if (displayFirst && last) {
    return `${displayFirst[0]}${last[0]}`.toUpperCase();
  }
  const fallback = user.name || user.id || "";
  return fallback.slice(0, 2).toUpperCase();
}
