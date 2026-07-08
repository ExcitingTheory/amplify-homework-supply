/**
 * Route Mapping between Next.js App and Storybook Stories
 *
 * Maps Next.js routes to corresponding Storybook story paths to enable
 * navigation within Storybook when clicking links.
 *
 * @module code/route-map
 */

/**
 * Mapping from Next.js route patterns to Storybook story paths
 *
 * Format:
 * - Key: Next.js route (with [id] for dynamic segments)
 * - Value: Storybook path query parameter
 *
 * Note: Story names are kebab-cased versions of the folder structure.
 * Example: '📄 Pages/Application Pages' → 'pages-application-pages'
 */
export const ROUTE_TO_STORY_MAP: Record<string, string> = {
  // Main pages - Application Pages stories
  "/": "?path=/story/📄-pages-application-pages--index",
  "/units": "?path=/story/📄-pages-application-pages--units",
  "/sections": "?path=/story/📄-pages-application-pages--sections",
  // Profile pages
  "/profile": "?path=/story/📄-pages-application-pages--profile-public",
  "/profile/[username]":
    "?path=/story/📄-pages-application-pages--profile-public",
  "/profile/notifications":
    "?path=/story/📄-pages-application-pages--notifications",
  "/settings": "?path=/story/📄-pages-application-pages--settings",
  "/leaderboard": "?path=/story/📄-pages-application-pages--leaderboard",
  "/squads": "?path=/story/📄-pages-application-pages--squads",
  "/squad/[id]": "?path=/story/📄-pages-application-pages--squad-detail",
  "/xp-history": "?path=/story/📄-pages-application-pages--xphistory",
  "/recycle-bin": "?path=/story/📄-pages-application-pages--recycle-bin",
  "/admin/settings": "?path=/story/📄-pages-application-pages--admin-settings",
  "/admin/analytics":
    "?path=/story/📄-pages-application-pages--admin-analytics",
  "/admin/archives": "?path=/story/📄-pages-application-pages--admin-archives",
  "/admin/moderation":
    "?path=/story/📄-pages-application-pages--admin-moderation",
  "/admin/words": "?path=/story/📄-pages-application-pages--admin-words",
  "/instructor/grade/[id]":
    "?path=/story/📄-pages-application-pages--instructor-grade",

  // Dynamic routes - will need ID substitution
  "/unit/[id]": "?path=/story/📄-pages-application-pages--unit-detail",
  "/section/[id]": "?path=/story/📄-pages-application-pages--section-detail",
  "/workbook/[id]": "?path=/story/📄-pages-application-pages--workbook",
  "/review/[id]": "?path=/story/📄-pages-application-pages--peer-review",
  // Feature routes
  "/drill/[id]": "?path=/story/📄-pages-application-pages--drill",
  "/offline": "?path=/story/📄-pages-application-pages--offline",
  "/privacy": "?path=/story/📄-pages-application-pages--privacy",
  "/section/[id]/settings/ai":
    "?path=/story/📄-pages-application-pages--section-ai-settings",
  "/section/[id]/settings/gamification":
    "?path=/story/📄-pages-application-pages--section-gamification-settings",
};

function normalizeRoute(route: string): string {
  let normalized = route || "/";

  // Convert absolute URLs to pathname+search+hash.
  if (/^https?:\/\//i.test(normalized)) {
    try {
      const url = new URL(normalized);
      normalized = `${url.pathname}${url.search}${url.hash}`;
    } catch {
      // Keep original on parse failure.
    }
  }

  // Drop query and hash for route matching.
  normalized = normalized.split("#")[0].split("?")[0] || "/";

  // Ensure leading slash.
  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }

  // Collapse duplicate slashes.
  normalized = normalized.replace(/\/{2,}/g, "/");

  // Remove locale prefix used by app/[locale] routes.
  const localePrefix = normalized.match(/^\/(en|es|ja)(\/|$)/);
  if (localePrefix) {
    normalized = normalized.replace(/^\/(en|es|ja)/, "") || "/";
  }

  // Remove trailing slash except root.
  if (normalized.length > 1 && normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
}

/**
 * Reverse mapping: Storybook story path to Next.js route
 */
export const STORY_TO_ROUTE_MAP: Record<string, string> = Object.entries(
  ROUTE_TO_STORY_MAP,
).reduce(
  (acc, [route, storyPath]) => {
    acc[storyPath] = route;
    return acc;
  },
  {} as Record<string, string>,
);

/**
 * Convert a Next.js route to a Storybook story path
 *
 * @param route - Next.js route (e.g., '/units' or '/unit/123')
 * @param params - Route parameters for dynamic segments
 * @returns Storybook query parameter or null if no mapping found
 *
 * @example
 * ```typescript
 * convertRouteToStory('/units')
 * // => '?path=/story/pages-units--default'
 *
 * convertRouteToStory('/unit/123')
 * // => '?path=/story/pages-unit--default&args=unitId:123'
 * ```
 */
export function convertRouteToStory(
  route: string,
  params?: Record<string, string>,
): string | null {
  const normalizedRoute = normalizeRoute(route);

  // Exact match first
  if (ROUTE_TO_STORY_MAP[normalizedRoute]) {
    return ROUTE_TO_STORY_MAP[normalizedRoute];
  }

  // Try to match dynamic routes
  for (const [pattern, storyPath] of Object.entries(ROUTE_TO_STORY_MAP)) {
    if (pattern.includes("[id]")) {
      // Extract ID from route
      const patternParts = pattern.split("/");
      const routeParts = normalizedRoute.split("/");

      if (patternParts.length === routeParts.length) {
        let matches = true;
        const extractedParams: Record<string, string> = {};

        for (let i = 0; i < patternParts.length; i++) {
          if (patternParts[i] === "[id]") {
            extractedParams.id = routeParts[i];
          } else if (patternParts[i] !== routeParts[i]) {
            matches = false;
            break;
          }
        }

        if (matches) {
          // Add ID as story arg
          const allParams = { ...extractedParams, ...params };
          const argsQuery = Object.entries(allParams)
            .map(([key, value]) => `${key}:${value}`)
            .join(";");

          return `${storyPath}&args=${argsQuery}`;
        }
      }
    }
  }

  console.warn("[Route Map] No story found for route:", normalizedRoute);
  return null;
}

/**
 * Convert a Storybook story path to a Next.js route
 *
 * @param storyPath - Storybook query parameter
 * @returns Next.js route or null if no mapping found
 *
 * @example
 * ```typescript
 * convertStoryToRoute('?path=/story/pages-units--default')
 * // => '/units'
 * ```
 */
export function convertStoryToRoute(storyPath: string): string | null {
  // Remove query parameters and normalize
  const normalizedPath = storyPath.split("&")[0];

  return STORY_TO_ROUTE_MAP[normalizedPath] || null;
}

/**
 * Extract story ID from Storybook context
 *
 * @param context - Storybook story context
 * @returns Story ID (e.g., 'pages-units--default')
 */
export function getStoryId(context: any): string {
  return context?.id || context?.storyId || "unknown-story";
}

/**
 * Get the current story's corresponding app route
 *
 * @param context - Storybook story context
 * @returns Next.js route this story represents
 */
export function getStoryRoute(context: any): string | null {
  const storyId = getStoryId(context);
  const storyPath = `?path=/story/${storyId}`;

  return convertStoryToRoute(storyPath);
}

/**
 * Common story IDs mapped to their categories for task completion
 */
export const STORY_CATEGORIES: Record<string, string> = {
  // Instructor workflows
  "📄-pages-application-pages--units": "instructor-content",
  "📄-pages-application-pages--units-empty-state": "instructor-content",
  "📄-pages-application-pages--sections": "instructor-class-management",
  "📄-pages-application-pages--sections-empty-state":
    "instructor-class-management",
  "📄-pages-application-pages--section-detail": "instructor-class-management",
  "📄-pages-application-pages--unit-detail": "instructor-content",
  "📚-creating-lessons-editor--editor-with-content": "instructor-content",
  "📁-managing-content-vocabulary-review--default": "instructor-content",

  // Alternative Index stories
  "📄-pages-index--student-dashboard": "learner-dashboard",
  "📄-pages-index--instructor-dashboard": "instructor-dashboard",
  "📄-pages-index--empty-state": "general",

  // Learner workflows
  "📄-pages-application-pages--workbook": "learner-coursework",
  "📄-pages-application-pages--workbook-timed-exercise": "learner-coursework",
  "📄-pages-application-pages--index": "learner-dashboard",
  "📄-pages-application-pages--index-assignments": "learner-coursework",
  "📄-pages-application-pages--section-detail-student": "learner-coursework",

  // User management
  "📄-pages-application-pages--profile": "developer-exploration",
  "📄-pages-application-pages--profile-password-change":
    "developer-exploration",

  // AI Tools
  "💬-ai-assistant-chat-sidebar--getting-started": "ai-tools",
};

/**
 * Get the category for a story (used for task completion)
 *
 * @param storyId - Storybook story ID
 * @returns Category name or 'general'
 */
export function getStoryCategory(storyId: string): string {
  return STORY_CATEGORIES[storyId] || "general";
}
