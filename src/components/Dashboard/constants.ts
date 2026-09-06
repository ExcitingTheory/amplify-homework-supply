/**
 * Dashboard Visual System Tokens
 * Unified design tokens for student and instructor dashboards
 */

export const DASHBOARD_TOKENS = {
  // Spacing & Layout
  spacing: {
    panelGap: 24, // Gap between major panel sections
    itemGap: 16, // Gap between cards/items
    itemGapCompact: 12, // Compact gap for dense layouts
  },

  // Padding
  padding: {
    panelDesktop: 24,
    panelMobile: 16,
    cardDesktop: 16,
    cardMobile: 14,
    heroDesktop: 24,
    heroMobile: 16,
  },

  // Border Radius
  radius: {
    panel: 12, // Main dashboard panels
    card: 8, // Assignment/section cards
    button: 6,
    chip: 6,
  },

  // Borders
  border: {
    divider: "1px solid",
    // Colors are theme-dependent; use theme.palette.divider
  },

  // Z-index for hero/featured elements
  zIndex: {
    heroUpNextBadge: 1,
    featured: 2,
    overlay: 10,
  },
} as const;

export type DashboardTokens = typeof DASHBOARD_TOKENS;

/**
 * Breakpoints for responsive behavior (matches MUI defaults but explicitly named)
 */
export const BREAKPOINTS = {
  xs: 0, // Mobile
  sm: 600, // Tablet
  md: 960, // Desktop
  lg: 1280,
} as const;

/**
 * Helper for responsive value selection
 * Usage: getResponsiveValue({ xs: 16, sm: 24 })
 */
export function getResponsiveValue<T>(
  values: Partial<Record<"xs" | "sm" | "md" | "lg", T>>,
  breakpoint: "xs" | "sm" | "md" | "lg" = "md",
): T {
  return values[breakpoint] as T;
}
