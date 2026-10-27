/**
 * @fileoverview Catalog and resolver for first-visit page hints.
 *
 * Each hint is keyed by route and role. The home route additionally adapts to
 * how far along the user's setup is. Copy lives in the `components`
 * translation namespace under `pageHints.<hint id>`.
 */

export type HintRole = "admin" | "instructor" | "learner";

export type HintRouteKey =
  | "home"
  | "sections"
  | "section"
  | "units"
  | "leaderboard"
  | "squads"
  | "admin"
  | "adminSettings"
  | "adminModeration";

export interface HintProgress {
  /** Sections the user owns (instructors/admins). */
  ownedSectionCount: number;
  /** Units the user owns. */
  ownedUnitCount: number;
  /** Assignments the user created. */
  ownedAssignmentCount: number;
  /** Sections the user has joined (learners). */
  joinedSectionCount: number;
}

export interface HintAction {
  /** Suffix of the `pageHints.actions.<id>` translation key. */
  id: string;
  href: string;
}

export interface PageHintDefinition {
  /** Stable id: persisted as "seen" and used as the translation path. */
  id: string;
  actions?: HintAction[];
}

const SETUP_ACTIONS = {
  createSection: { id: "createSection", href: "/sections" },
  createUnit: { id: "createUnit", href: "/units" },
  openSections: { id: "openSections", href: "/sections" },
  joinClass: { id: "joinClass", href: "/sections" },
  platformSettings: { id: "platformSettings", href: "/admin/settings" },
  moderation: { id: "moderation", href: "/admin/moderation" },
} satisfies Record<string, HintAction>;

/**
 * Maps Cognito groups to the hint audience. Admins outrank Instructors;
 * Moderators see the instructor experience, matching the dashboard.
 */
export function getHintRole(groups: readonly string[] | undefined): HintRole {
  const list = groups ?? [];
  if (list.includes("Admins")) return "admin";
  if (list.includes("Instructors") || list.includes("Moderators")) {
    return "instructor";
  }
  return "learner";
}

/**
 * Maps a locale-stripped pathname (from `@/i18n/navigation`) to a hint route.
 * Full-screen editors and workbooks are intentionally unmapped.
 */
export function getHintRouteKey(
  pathname: string | null | undefined,
): HintRouteKey | null {
  if (!pathname) return null;
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/") return "home";
  if (path === "/sections") return "sections";
  if (/^\/section\/[^/]+$/.test(path)) return "section";
  if (path === "/units") return "units";
  if (path === "/leaderboard") return "leaderboard";
  if (path === "/squads") return "squads";
  if (path === "/admin") return "admin";
  if (path === "/admin/settings") return "adminSettings";
  if (path === "/admin/moderation") return "adminModeration";
  return null;
}

function resolveHomeHint(
  role: HintRole,
  progress: HintProgress | null,
): PageHintDefinition | null {
  if (role === "admin") {
    return {
      id: "home.admin.tuneWorkspace",
      actions: [SETUP_ACTIONS.platformSettings, SETUP_ACTIONS.moderation],
    };
  }

  // Wait for the dashboard to report real data so we never suggest a step the
  // user has already completed.
  if (!progress) return null;

  if (role === "instructor") {
    if (progress.ownedSectionCount === 0) {
      return {
        id: "home.instructor.noSection",
        actions: [SETUP_ACTIONS.createSection],
      };
    }
    if (progress.ownedUnitCount === 0) {
      return {
        id: "home.instructor.noUnit",
        actions: [SETUP_ACTIONS.createUnit],
      };
    }
    if (progress.ownedAssignmentCount === 0) {
      return {
        id: "home.instructor.noAssignment",
        actions: [SETUP_ACTIONS.openSections],
      };
    }
    return { id: "home.instructor.active" };
  }

  if (progress.joinedSectionCount === 0) {
    return {
      id: "home.learner.noSection",
      actions: [SETUP_ACTIONS.joinClass],
    };
  }
  return { id: "home.learner.active" };
}

type StaticCatalog = Partial<
  Record<Exclude<HintRouteKey, "home">, Partial<Record<HintRole, string>>>
>;

// Value is the hint id; admins fall back to the instructor entry.
const STATIC_CATALOG: StaticCatalog = {
  sections: {
    instructor: "sections.instructor",
    learner: "sections.learner",
  },
  section: {
    instructor: "section.instructor",
    learner: "section.learner",
  },
  units: { instructor: "units.instructor" },
  leaderboard: {
    instructor: "leaderboard.all",
    learner: "leaderboard.all",
  },
  squads: {
    instructor: "squads.all",
    learner: "squads.all",
  },
  admin: { admin: "admin.index" },
  adminSettings: { admin: "adminSettings.admin" },
  adminModeration: { admin: "adminModeration.admin" },
};

/** Returns the hint to consider for a route/role, or null when none applies. */
export function resolvePageHint(
  routeKey: HintRouteKey | null,
  role: HintRole,
  progress: HintProgress | null,
): PageHintDefinition | null {
  if (!routeKey) return null;
  if (routeKey === "home") return resolveHomeHint(role, progress);

  const entry = STATIC_CATALOG[routeKey];
  const id = entry?.[role] ?? (role === "admin" ? entry?.instructor : undefined);
  return id ? { id } : null;
}

/** The slice of the Settings model that stores hint preferences. */
export interface HintSettings {
  pageHintsEnabled?: boolean | null;
  pageHintsSeen?: (string | null)[] | null;
}

export interface HintPreferences {
  /** False once the user chose to stop seeing hints. */
  enabled: boolean;
  /** Hint ids already shown or dismissed. */
  seen: string[];
}

/** Unset fields (existing Settings rows) mean enabled with nothing seen. */
export function getHintPreferences(
  settings: HintSettings | null | undefined,
): HintPreferences {
  return {
    enabled: settings?.pageHintsEnabled !== false,
    seen: (settings?.pageHintsSeen ?? []).filter(
      (id): id is string => typeof id === "string",
    ),
  };
}

/** Appends an id without duplicating it. */
export function withHintSeen(seen: readonly string[], id: string): string[] {
  return seen.includes(id) ? [...seen] : [...seen, id];
}
