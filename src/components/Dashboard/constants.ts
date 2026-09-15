/**
 * Dashboard Visual System Tokens
 * Unified design tokens for student and instructor dashboards
 */

import { SEMANTIC_THEME } from "../../themes/semanticTheme";

export const DASHBOARD_TOKENS = {
  // Spacing & Layout
  spacing: {
    panelGap: SEMANTIC_THEME.spacing.panelGap, // Gap between major panel sections
    itemGap: SEMANTIC_THEME.spacing.itemGap, // Gap between cards/items
    itemGapCompact: SEMANTIC_THEME.spacing.itemGapCompact, // Compact gap for dense layouts
  },

  // Padding
  padding: {
    panelDesktop: SEMANTIC_THEME.padding.panelDesktop,
    panelMobile: SEMANTIC_THEME.padding.panelMobile,
    cardDesktop: SEMANTIC_THEME.padding.cardDesktop,
    cardMobile: SEMANTIC_THEME.padding.cardMobile,
    heroDesktop: SEMANTIC_THEME.padding.panelDesktop,
    heroMobile: SEMANTIC_THEME.padding.panelMobile,
  },

  // Border Radius
  radius: {
    panel: SEMANTIC_THEME.radius.panel, // Main dashboard panels
    card: SEMANTIC_THEME.radius.card, // Assignment/section cards
    button: SEMANTIC_THEME.radius.control,
    chip: SEMANTIC_THEME.radius.chip,
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
