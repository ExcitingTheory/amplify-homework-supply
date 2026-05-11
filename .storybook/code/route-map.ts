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
  "/profile": "?path=/story/📄-pages-application-pages--profile",
  "/profile/[username]": "?path=/story/📄-pages-application-pages--profile",
  "/settings": "?path=/story/📄-pages-application-pages--settings",

  // Dynamic routes - will need ID substitution
  "/unit/[id]": "?path=/story/📄-pages-application-pages--unit-detail",
  "/section/[id]": "?path=/story/📄-pages-application-pages--section-detail",
  "/workbook/[id]": "?path=/story/📄-pages-application-pages--workbook",
  "/review/[id]": "?path=/story/📄-pages-application-pages--peer-review",
};

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
  // Exact match first
  if (ROUTE_TO_STORY_MAP[route]) {
    return ROUTE_TO_STORY_MAP[route];
  }

  // Try to match dynamic routes
  for (const [pattern, storyPath] of Object.entries(ROUTE_TO_STORY_MAP)) {
    if (pattern.includes("[id]")) {
      // Extract ID from route
      const patternParts = pattern.split("/");
      const routeParts = route.split("/");

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

  console.warn("[Route Map] No story found for route:", route);
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
