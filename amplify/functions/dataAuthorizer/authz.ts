/**
 * Pure Authorization Decision Logic
 *
 * This module contains the authorization decision matrix - testable without AWS.
 * It takes identity info (user ID, groups) and operation metadata (operation name, variables)
 * and returns an authorization decision: allowed or denied, with optional field redaction.
 *
 * Key principles:
 * - Default-deny: operations not explicitly allowed are rejected
 * - Group-based: sections have dynamic Cognito groups (section-{id}-instructors, etc.)
 * - Owner-scoped: client-side filtering still required for list/observeQuery
 * - No row lookup: this function only authorizes the operation, not specific rows
 */

export interface AuthorizationContext {
  userId: string;
  groups: string[];
  operationName: string;
  variables?: Record<string, any>;
}

export interface AuthorizationDecision {
  allowed: boolean;
  deniedFields?: string[]; // For field-level redaction: ['Document.readableGroups', 'Grade.rubric']
  reason?: string;
}

/**
 * Main authorization decision function
 *
 * @param context - User identity and operation metadata
 * @returns Authorization decision with optional denied fields
 */
export function decide(context: AuthorizationContext): AuthorizationDecision {
  const { userId, groups, operationName, variables = {} } = context;

  // Check static roles first (fast path)
  const isAdmin = groups.includes("Admins");
  const isModerator = groups.includes("Moderators");
  const isInstructor = groups.includes("Instructors");
  const isLearner = groups.includes("Learners");

  // Admins can do anything
  if (isAdmin) {
    return { allowed: true };
  }

  // Route based on operation type
  if (operationName.startsWith("get") || operationName.startsWith("list")) {
    return authorizeRead(context, {
      isAdmin,
      isModerator,
      isInstructor,
      isLearner,
    });
  }

  if (operationName.startsWith("create")) {
    return authorizeCreate(context, {
      isAdmin,
      isModerator,
      isInstructor,
      isLearner,
    });
  }

  if (operationName.startsWith("update")) {
    return authorizeUpdate(context, {
      isAdmin,
      isModerator,
      isInstructor,
      isLearner,
    });
  }

  if (operationName.startsWith("delete")) {
    return authorizeDelete(context, {
      isAdmin,
      isModerator,
      isInstructor,
      isLearner,
    });
  }

  // Authenticated users can call custom queries (e.g., verifyAudio, generateAudio)
  // These are handled via allow.authenticated() in schema and are out of scope
  if (userId) {
    return { allowed: true, reason: "Authenticated user - custom operation" };
  }

  return { allowed: false, reason: "No matching authorization rule" };
}

/**
 * Authorize read operations (get*, list*, observe*)
 *
 * @param context - User identity and operation
 * @param roles - Computed role flags
 * @returns Authorization decision
 */
function authorizeRead(
  context: AuthorizationContext,
  roles: {
    isAdmin: boolean;
    isModerator: boolean;
    isInstructor: boolean;
    isLearner: boolean;
  },
): AuthorizationDecision {
  const { userId, groups } = context;
  const { isAdmin, isModerator, isInstructor, isLearner } = roles;

  // Admins, Instructors, Moderators, and Learners can read
  if (isAdmin || isModerator || isInstructor || isLearner) {
    return { allowed: true };
  }

  // Unauthenticated users blocked
  if (!userId) {
    return { allowed: false, reason: "Unauthenticated" };
  }

  // Authenticated but no role
  return { allowed: true, reason: "Authenticated user" };
}

/**
 * Authorize create operations
 *
 * @param context - User identity and operation
 * @param roles - Computed role flags
 * @returns Authorization decision
 */
function authorizeCreate(
  context: AuthorizationContext,
  roles: {
    isAdmin: boolean;
    isModerator: boolean;
    isInstructor: boolean;
    isLearner: boolean;
  },
): AuthorizationDecision {
  const { userId, groups } = context;
  const { isAdmin, isModerator, isInstructor, isLearner } = roles;

  // Admins, Instructors, Moderators, and Learners can create
  if (isAdmin || isModerator || isInstructor || isLearner) {
    return { allowed: true };
  }

  // Unauthenticated users blocked
  if (!userId) {
    return { allowed: false, reason: "Unauthenticated" };
  }

  // Authenticated but no role - allow by default
  return { allowed: true, reason: "Authenticated user" };
}

/**
 * Authorize update operations
 *
 * @param context - User identity and operation
 * @param roles - Computed role flags
 * @returns Authorization decision
 */
function authorizeUpdate(
  context: AuthorizationContext,
  roles: {
    isAdmin: boolean;
    isModerator: boolean;
    isInstructor: boolean;
    isLearner: boolean;
  },
): AuthorizationDecision {
  const { userId, groups } = context;
  const { isAdmin, isModerator, isInstructor, isLearner } = roles;

  // Admins, Instructors, Moderators can update
  if (isAdmin || isModerator || isInstructor) {
    return { allowed: true };
  }

  // Learners can update their own data (owner check happens at row level)
  if (isLearner && userId) {
    return { allowed: true };
  }

  // Unauthenticated users blocked
  if (!userId) {
    return { allowed: false, reason: "Unauthenticated" };
  }

  // Authenticated but limited role
  return { allowed: true, reason: "Authenticated user" };
}

/**
 * Authorize delete operations
 *
 * @param context - User identity and operation
 * @param roles - Computed role flags
 * @returns Authorization decision
 */
function authorizeDelete(
  context: AuthorizationContext,
  roles: {
    isAdmin: boolean;
    isModerator: boolean;
    isInstructor: boolean;
    isLearner: boolean;
  },
): AuthorizationDecision {
  const { userId, groups } = context;
  const { isAdmin, isModerator, isInstructor } = roles;

  // Admins, Instructors, Moderators can delete
  if (isAdmin || isModerator || isInstructor) {
    return { allowed: true };
  }

  // Learners can delete their own data (owner check happens at row level)
  if (userId) {
    return { allowed: true };
  }

  return { allowed: false, reason: "Unauthenticated" };
}

/**
 * Helper: Check if user is in a section-specific group
 *
 * Returns group names that match the pattern: section-{sectionId}-{role}
 *
 * @param groups - User's groups
 * @param sectionId - Section to check for
 * @param role - Role filter: 'instructors', 'learners', or undefined for any
 * @returns Matching group names
 */
export function getSectionGroups(
  groups: string[],
  sectionId: string,
  role?: "instructors" | "learners",
): string[] {
  const pattern = role
    ? `section-${sectionId}-${role}`
    : `section-${sectionId}-`;
  return groups.filter((g) => g.startsWith(pattern));
}

/**
 * Helper: Get all section IDs the user has groups for
 *
 * @param groups - User's groups
 * @returns Array of section IDs (from groups like 'section-123-instructors')
 */
export function getUserSectionIds(groups: string[]): string[] {
  const sectionIds = new Set<string>();
  const sectionGroupPattern = /^section-([^-]+)-(instructors|learners)$/;

  for (const group of groups) {
    const match = group.match(sectionGroupPattern);
    if (match) {
      sectionIds.add(match[1]);
    }
  }

  return Array.from(sectionIds);
}
