/**
 * useGamificationFeatures — Resolves gamification feature toggles using:
 *   section override → platform default → hardcoded default (true)
 *
 * Teachers override platform defaults per section via gamificationConfig.
 * When a feature is disabled, UI components are hidden but data processing
 * continues in the background so toggling back on restores accuracy.
 *
 * @module useGamificationFeatures
 */

import { useMemo, useContext } from "react";
import { usePlatformSettings } from "../context/gamificationContext";
import SectionContext from "../context/sectionContext";

// ============================================================================
// Types
// ============================================================================

/** All gamification feature keys that can be toggled */
export type GamificationFeatureKey =
  | "xpEnabled"
  | "leaderboardEnabled"
  | "badgesEnabled"
  | "antiBadgesEnabled"
  | "easterEggsEnabled"
  | "groupChallengesEnabled"
  | "squadsEnabled"
  | "skillTreesEnabled"
  | "streaksEnabled"
  | "collaborativePracticeEnabled"
  | "cosmeticsEnabled"
  | "contentLocksEnabled";

/** Resolved feature state for all gamification toggles */
export interface GamificationFeatureState {
  xpEnabled: boolean;
  leaderboardEnabled: boolean;
  badgesEnabled: boolean;
  antiBadgesEnabled: boolean;
  easterEggsEnabled: boolean;
  groupChallengesEnabled: boolean;
  squadsEnabled: boolean;
  skillTreesEnabled: boolean;
  streaksEnabled: boolean;
  collaborativePracticeEnabled: boolean;
  cosmeticsEnabled: boolean;
  contentLocksEnabled: boolean;
}

export interface UseGamificationFeaturesResult extends GamificationFeatureState {
  /** Check if a specific feature is enabled (resolved) */
  isFeatureEnabled: (feature: GamificationFeatureKey) => boolean;
  /** The raw section overrides (null = use platform default) */
  sectionOverrides: Partial<Record<GamificationFeatureKey, boolean | null>>;
  /** The platform defaults */
  platformDefaults: Partial<Record<GamificationFeatureKey, boolean | null>>;
}

// ============================================================================
// Hardcoded defaults — used when neither section nor platform specifies a value
// ============================================================================

const HARDCODED_DEFAULTS: GamificationFeatureState = {
  xpEnabled: true,
  leaderboardEnabled: true,
  badgesEnabled: true,
  antiBadgesEnabled: true,
  easterEggsEnabled: true,
  groupChallengesEnabled: true,
  squadsEnabled: true,
  skillTreesEnabled: true,
  streaksEnabled: true,
  collaborativePracticeEnabled: true,
  cosmeticsEnabled: true,
  contentLocksEnabled: true,
};

const ALL_FEATURE_KEYS: GamificationFeatureKey[] = Object.keys(
  HARDCODED_DEFAULTS,
) as GamificationFeatureKey[];

// ============================================================================
// Hook
// ============================================================================

/**
 * Resolves gamification feature toggles for a given section.
 *
 * Resolution order: sectionConfig[key] ?? platformSettings[key] ?? true
 *
 * @param sectionConfig - The section's `gamificationConfig` object (from Section model).
 *                         Also reads `badgesEnabled`, `antiBadgesEnabled`, `leaderboardEnabled`
 *                         from the section root if provided.
 * @param sectionRoot   - Optional section root fields for legacy toggles
 *                         (badgesEnabled, antiBadgesEnabled, leaderboardEnabled from Section model)
 */
export function useGamificationFeatures(
  sectionConfig?: Record<string, any> | null,
  sectionRoot?: {
    badgesEnabled?: boolean | null;
    antiBadgesEnabled?: boolean | null;
    leaderboardEnabled?: boolean | null;
  } | null,
): UseGamificationFeaturesResult {
  const { platformSettings } = usePlatformSettings();

  const result = useMemo(() => {
    // Extract platform defaults
    const platformDefaults: Partial<
      Record<GamificationFeatureKey, boolean | null>
    > = {};
    for (const key of ALL_FEATURE_KEYS) {
      platformDefaults[key] = platformSettings?.[key] ?? null;
    }

    // Extract section overrides — merge gamificationConfig + root-level fields
    const sectionOverrides: Partial<
      Record<GamificationFeatureKey, boolean | null>
    > = {};
    if (sectionConfig) {
      for (const key of ALL_FEATURE_KEYS) {
        const val = sectionConfig[key];
        sectionOverrides[key] = val != null ? Boolean(val) : null;
      }
    }
    // Legacy root-level section fields override gamificationConfig equivalents
    if (sectionRoot) {
      if (sectionRoot.badgesEnabled != null) {
        sectionOverrides.badgesEnabled = sectionRoot.badgesEnabled;
      }
      if (sectionRoot.antiBadgesEnabled != null) {
        sectionOverrides.antiBadgesEnabled = sectionRoot.antiBadgesEnabled;
      }
      if (sectionRoot.leaderboardEnabled != null) {
        sectionOverrides.leaderboardEnabled = sectionRoot.leaderboardEnabled;
      }
    }

    // Resolve: section override → platform default → hardcoded default
    const resolved: GamificationFeatureState = { ...HARDCODED_DEFAULTS };
    for (const key of ALL_FEATURE_KEYS) {
      const sectionVal = sectionOverrides[key];
      const platformVal = platformDefaults[key];
      if (sectionVal != null) {
        resolved[key] = sectionVal;
      } else if (platformVal != null) {
        resolved[key] = platformVal;
      }
      // else: keep hardcoded default (true)
    }

    const isFeatureEnabled = (feature: GamificationFeatureKey): boolean =>
      resolved[feature];

    return {
      ...resolved,
      isFeatureEnabled,
      sectionOverrides,
      platformDefaults,
    };
  }, [sectionConfig, sectionRoot, platformSettings]);

  return result;
}

// ============================================================================
// Feature metadata — for rendering toggle UIs
// ============================================================================

export interface GamificationFeatureMeta {
  key: GamificationFeatureKey;
  label: string;
  description: string;
  category: "core" | "social" | "progression" | "content";
}

export const GAMIFICATION_FEATURE_META: GamificationFeatureMeta[] = [
  {
    key: "xpEnabled",
    label: "XP & Leveling",
    description: "Students earn experience points and level up",
    category: "core",
  },
  {
    key: "leaderboardEnabled",
    label: "Leaderboard",
    description: "Show section leaderboard rankings",
    category: "social",
  },
  {
    key: "badgesEnabled",
    label: "Badges",
    description: "Award achievement badges for milestones",
    category: "progression",
  },
  {
    key: "antiBadgesEnabled",
    label: "Anti-Badges",
    description:
      "Assign anti-badges for negative patterns (humorous deterrents)",
    category: "progression",
  },
  {
    key: "streaksEnabled",
    label: "Streaks",
    description: "Track daily activity streaks",
    category: "core",
  },
  {
    key: "easterEggsEnabled",
    label: "Easter Eggs",
    description: "Hidden rewards students can discover",
    category: "content",
  },
  {
    key: "groupChallengesEnabled",
    label: "Group Challenges",
    description: "Boss battles and team challenges",
    category: "social",
  },
  {
    key: "squadsEnabled",
    label: "Squads",
    description: "Students form squads for team competition",
    category: "social",
  },
  {
    key: "skillTreesEnabled",
    label: "Skill Trees",
    description: "Visual skill progression paths",
    category: "progression",
  },
  {
    key: "collaborativePracticeEnabled",
    label: "Collaborative Practice",
    description: "Collaborative drill and practice mode",
    category: "social",
  },
  {
    key: "cosmeticsEnabled",
    label: "Cosmetics & Avatars",
    description: "Avatar customization and cosmetic unlocks",
    category: "progression",
  },
  {
    key: "contentLocksEnabled",
    label: "Content Locks",
    description: "Gate content behind XP/badge requirements",
    category: "content",
  },
];

// ============================================================================
// Convenience hook — auto-resolves section from SectionContext by ID
// ============================================================================

/**
 * Auto-resolves gamification features for a given sectionId using SectionContext.
 * Looks up the section in the context, extracts its gamificationConfig and root-level
 * toggle fields, then delegates to useGamificationFeatures.
 *
 * @param sectionId - The section ID to resolve features for (optional — falls back to platform defaults)
 */
export function useSectionGamificationFeatures(
  sectionId?: string | null,
): UseGamificationFeaturesResult {
  const { sections } = useContext(SectionContext) as { sections: any[] };

  const { sectionConfig, sectionRoot } = useMemo(() => {
    if (!sectionId || !sections?.length)
      return { sectionConfig: null, sectionRoot: null };
    const section = sections.find((s: any) => s?.id === sectionId);
    if (!section) return { sectionConfig: null, sectionRoot: null };

    let config = section.gamificationConfig;
    if (typeof config === "string") {
      try {
        config = JSON.parse(config);
      } catch {
        config = null;
      }
    }

    return {
      sectionConfig: config || null,
      sectionRoot: {
        badgesEnabled: section.badgesEnabled ?? null,
        antiBadgesEnabled: section.antiBadgesEnabled ?? null,
        leaderboardEnabled: section.leaderboardEnabled ?? null,
      },
    };
  }, [sectionId, sections]);

  return useGamificationFeatures(sectionConfig, sectionRoot);
}
