/**
 * Gamification config cache and merge utility.
 *
 * Caches PlatformSettings (global) and Section.gamificationConfig (per-section)
 * in Lambda warm-container memory with a configurable TTL. Provides a merge
 * function that produces the effective badge/gamification config for a given section.
 *
 * Merge rules:
 * - Boolean toggles: section value wins if defined, else falls back to global
 * - badgeConfigs: merge by badgeType key — section overrides global per-type
 * - customBadges: union of global + section (dedup by id, section wins on conflict)
 * - Numeric overrides (streakFreezesAllowed): section wins if defined
 */

// =============================================================================
// Types
// =============================================================================

export interface BadgeConfigEntry {
  badgeType: string;
  enabled: boolean;
  thresholdOverride?: number | null;
}

export interface CustomBadgeDefinitionEntry {
  id: string;
  title: string;
  description?: string | null;
  icon?: string | null;
  shape?: string | null;
  rarity?: string | null;
  category?: string | null;
  criteria?: any;
  isAnti?: boolean | null;
  autoEvaluate?: boolean | null;
}

export interface SectionGamificationConfig {
  easterEggsEnabled?: boolean | null;
  groupChallengesEnabled?: boolean | null;
  squadsEnabled?: boolean | null;
  skillTreesEnabled?: boolean | null;
  streaksEnabled?: boolean | null;
  collaborativePracticeEnabled?: boolean | null;
  streakFreezesAllowed?: number | null;
  badgeConfigs?: BadgeConfigEntry[] | null;
  customBadges?: CustomBadgeDefinitionEntry[] | null;
}

export interface GlobalSettings {
  badgesEnabled?: boolean | null;
  antiBadgesEnabled?: boolean | null;
  badgeConfigs?: BadgeConfigEntry[] | null;
  customBadges?: CustomBadgeDefinitionEntry[] | null;
  streakFreezesAllowed?: number | null;
}

export interface EffectiveGamificationConfig {
  badgesEnabled: boolean;
  antiBadgesEnabled: boolean;
  easterEggsEnabled: boolean;
  groupChallengesEnabled: boolean;
  squadsEnabled: boolean;
  skillTreesEnabled: boolean;
  streaksEnabled: boolean;
  collaborativePracticeEnabled: boolean;
  streakFreezesAllowed: number;
  /** Merged badge configs — keyed by badgeType for O(1) lookup */
  badgeConfigs: Map<string, BadgeConfigEntry>;
  /** Union of global + section custom badges */
  customBadges: CustomBadgeDefinitionEntry[];
}

// =============================================================================
// TTL Cache
// =============================================================================

const DEFAULT_TTL_MS = 15 * 60 * 1000; // 15 minutes

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class TtlCache<T> {
  private store = new Map<string, CacheEntry<T>>();
  private ttlMs: number;

  constructor(ttlMs: number = DEFAULT_TTL_MS) {
    this.ttlMs = ttlMs;
  }

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data;
  }

  set(key: string, data: T): void {
    this.store.set(key, { data, expiresAt: Date.now() + this.ttlMs });
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

// Singleton caches — persist across warm Lambda invocations
const platformSettingsCache = new TtlCache<GlobalSettings>(DEFAULT_TTL_MS);
const sectionConfigCache = new TtlCache<SectionGamificationConfig>(
  DEFAULT_TTL_MS,
);

const GLOBAL_KEY = "__platform_settings__";

// =============================================================================
// Fetch helpers (with cache)
// =============================================================================

const GET_PLATFORM_SETTINGS_FOR_BADGES = `query GetPlatformSettings {
  listPlatformSettings(limit: 1) {
    items { id badgesEnabled antiBadgesEnabled badgeConfigs customBadges streakFreezesAllowed }
  }
}`;

const GET_SECTION_GAMIFICATION = `query GetSectionGamification($id: ID!) {
  getSection(id: $id) { id badgesEnabled antiBadgesEnabled gamificationConfig }
}`;

export async function getGlobalSettings(
  gqlClient: any,
): Promise<GlobalSettings> {
  const cached = platformSettingsCache.get(GLOBAL_KEY);
  if (cached) return cached;

  try {
    const { data } = await gqlClient.graphql({
      query: GET_PLATFORM_SETTINGS_FOR_BADGES,
    });
    const raw = data?.listPlatformSettings?.items?.[0] || {};

    const settings: GlobalSettings = {
      badgesEnabled: raw.badgesEnabled ?? true,
      antiBadgesEnabled: raw.antiBadgesEnabled ?? true,
      badgeConfigs: parseBadgeConfigs(raw.badgeConfigs),
      customBadges: parseCustomBadges(raw.customBadges),
      streakFreezesAllowed: raw.streakFreezesAllowed ?? 3,
    };

    platformSettingsCache.set(GLOBAL_KEY, settings);
    return settings;
  } catch (err) {
    console.warn(
      "[gamificationConfigCache] Failed to fetch PlatformSettings:",
      err,
    );
    return {
      badgesEnabled: true,
      antiBadgesEnabled: true,
      badgeConfigs: [],
      customBadges: [],
      streakFreezesAllowed: 3,
    };
  }
}

export async function getSectionConfig(
  gqlClient: any,
  sectionId: string,
): Promise<{
  badgesEnabled?: boolean | null;
  antiBadgesEnabled?: boolean | null;
  config: SectionGamificationConfig;
}> {
  const cached = sectionConfigCache.get(sectionId);
  if (cached) {
    // We store the full section response; need badge toggles too
    // Re-read from a separate cache entry
    const sectionMeta = sectionConfigCache.get(`${sectionId}__meta`) as any;
    return {
      badgesEnabled: sectionMeta?.badgesEnabled ?? null,
      antiBadgesEnabled: sectionMeta?.antiBadgesEnabled ?? null,
      config: cached,
    };
  }

  try {
    const { data } = await gqlClient.graphql({
      query: GET_SECTION_GAMIFICATION,
      variables: { id: sectionId },
    });
    const section = data?.getSection;
    if (!section) {
      return { badgesEnabled: null, antiBadgesEnabled: null, config: {} };
    }

    const config: SectionGamificationConfig = parseGamificationConfig(
      section.gamificationConfig,
    );

    sectionConfigCache.set(sectionId, config);
    // Store section-level badge toggles
    (sectionConfigCache as any).store.set(`${sectionId}__meta`, {
      data: {
        badgesEnabled: section.badgesEnabled,
        antiBadgesEnabled: section.antiBadgesEnabled,
      },
      expiresAt: Date.now() + DEFAULT_TTL_MS,
    });

    return {
      badgesEnabled: section.badgesEnabled,
      antiBadgesEnabled: section.antiBadgesEnabled,
      config,
    };
  } catch (err) {
    console.warn(
      "[gamificationConfigCache] Failed to fetch Section config:",
      err,
    );
    return { badgesEnabled: null, antiBadgesEnabled: null, config: {} };
  }
}

// =============================================================================
// Merge logic
// =============================================================================

/**
 * Merges global PlatformSettings with section-level gamification config.
 * Section values override global when defined.
 */
export function mergeConfigs(
  global: GlobalSettings,
  sectionBadgesEnabled: boolean | null | undefined,
  sectionAntiBadgesEnabled: boolean | null | undefined,
  section: SectionGamificationConfig,
): EffectiveGamificationConfig {
  // Boolean toggles: section wins if explicitly set (not null/undefined)
  const badgesEnabled = sectionBadgesEnabled ?? global.badgesEnabled ?? true;
  const antiBadgesEnabled =
    sectionAntiBadgesEnabled ?? global.antiBadgesEnabled ?? true;

  // Feature toggles from section gamification config (all default true)
  const easterEggsEnabled = section.easterEggsEnabled ?? true;
  const groupChallengesEnabled = section.groupChallengesEnabled ?? true;
  const squadsEnabled = section.squadsEnabled ?? true;
  const skillTreesEnabled = section.skillTreesEnabled ?? true;
  const streaksEnabled = section.streaksEnabled ?? true;
  const collaborativePracticeEnabled =
    section.collaborativePracticeEnabled ?? true;

  // Numeric: section overrides global
  const streakFreezesAllowed =
    section.streakFreezesAllowed ?? global.streakFreezesAllowed ?? 3;

  // Badge configs: merge by badgeType — section overrides global per-type
  const badgeConfigs = new Map<string, BadgeConfigEntry>();
  // Start with global
  for (const gc of global.badgeConfigs || []) {
    badgeConfigs.set(gc.badgeType, { ...gc });
  }
  // Section overrides
  for (const sc of section.badgeConfigs || []) {
    badgeConfigs.set(sc.badgeType, { ...sc });
  }

  // Custom badges: union, section wins on ID conflict
  const customBadgeMap = new Map<string, CustomBadgeDefinitionEntry>();
  for (const gb of global.customBadges || []) {
    customBadgeMap.set(gb.id, gb);
  }
  for (const sb of section.customBadges || []) {
    customBadgeMap.set(sb.id, sb);
  }
  const customBadges = Array.from(customBadgeMap.values());

  return {
    badgesEnabled,
    antiBadgesEnabled,
    easterEggsEnabled,
    groupChallengesEnabled,
    squadsEnabled,
    skillTreesEnabled,
    streaksEnabled,
    collaborativePracticeEnabled,
    streakFreezesAllowed,
    badgeConfigs,
    customBadges,
  };
}

/**
 * High-level: fetch global + section, merge, return effective config.
 * Uses cache to avoid repeated fetches within TTL window.
 */
export async function getEffectiveConfig(
  gqlClient: any,
  sectionId?: string,
): Promise<EffectiveGamificationConfig> {
  const global = await getGlobalSettings(gqlClient);

  if (!sectionId) {
    return mergeConfigs(global, null, null, {});
  }

  const { badgesEnabled, antiBadgesEnabled, config } = await getSectionConfig(
    gqlClient,
    sectionId,
  );

  return mergeConfigs(global, badgesEnabled, antiBadgesEnabled, config);
}

/**
 * Checks whether a specific badge type is enabled in the effective config.
 * If no badgeConfigs entry exists for that type, defaults to enabled.
 */
export function isBadgeEnabled(
  config: EffectiveGamificationConfig,
  badgeType: string,
): boolean {
  if (!config.badgesEnabled) return false;
  const entry = config.badgeConfigs.get(badgeType);
  // If no config entry exists, badge is enabled by default
  return entry?.enabled ?? true;
}

/**
 * Gets threshold override for a badge type, or null if no override.
 */
export function getBadgeThresholdOverride(
  config: EffectiveGamificationConfig,
  badgeType: string,
): number | null {
  const entry = config.badgeConfigs.get(badgeType);
  return entry?.thresholdOverride ?? null;
}

/**
 * Invalidate cached section config (e.g., after instructor updates settings).
 */
export function invalidateSectionCache(sectionId: string): void {
  sectionConfigCache.invalidate(sectionId);
  sectionConfigCache.invalidate(`${sectionId}__meta`);
}

/**
 * Invalidate global settings cache (e.g., after admin updates PlatformSettings).
 */
export function invalidateGlobalCache(): void {
  platformSettingsCache.invalidate(GLOBAL_KEY);
}

/**
 * Clear all caches (useful in tests or cold-start scenarios).
 */
export function clearAllCaches(): void {
  platformSettingsCache.clear();
  sectionConfigCache.clear();
}

// =============================================================================
// Parse helpers
// =============================================================================

function parseBadgeConfigs(raw: any): BadgeConfigEntry[] {
  if (!raw) return [];
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseCustomBadges(raw: any): CustomBadgeDefinitionEntry[] {
  if (!raw) return [];
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseGamificationConfig(raw: any): SectionGamificationConfig {
  if (!raw) return {};
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return {
      easterEggsEnabled: parsed.easterEggsEnabled ?? null,
      groupChallengesEnabled: parsed.groupChallengesEnabled ?? null,
      squadsEnabled: parsed.squadsEnabled ?? null,
      skillTreesEnabled: parsed.skillTreesEnabled ?? null,
      streaksEnabled: parsed.streaksEnabled ?? null,
      collaborativePracticeEnabled: parsed.collaborativePracticeEnabled ?? null,
      streakFreezesAllowed: parsed.streakFreezesAllowed ?? null,
      badgeConfigs: parseBadgeConfigs(parsed.badgeConfigs),
      customBadges: parseCustomBadges(parsed.customBadges),
    };
  } catch {
    return {};
  }
}
