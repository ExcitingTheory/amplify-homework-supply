/**
 * Unit tests for gamificationConfigCache — merge logic, caching, and badge filtering
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  mergeConfigs,
  isBadgeEnabled,
  getBadgeThresholdOverride,
  getEffectiveConfig,
  clearAllCaches,
  type GlobalSettings,
  type SectionGamificationConfig,
} from "../shared/gamificationConfigCache";

describe("mergeConfigs", () => {
  const defaultGlobal: GlobalSettings = {
    badgesEnabled: true,
    antiBadgesEnabled: true,
    badgeConfigs: [
      { badgeType: "FIRST_SUBMISSION", enabled: true },
      { badgeType: "SHARPSHOOTER", enabled: true, thresholdOverride: 3 },
      { badgeType: "SPEED_RUN_SCHOLAR", enabled: true },
    ],
    customBadges: [
      { id: "global-badge-1", title: "Global Star", category: "special" },
      { id: "shared-id", title: "Global Version", category: "shared" },
    ],
    streakFreezesAllowed: 3,
  };

  it("uses global defaults when section has no overrides", () => {
    const result = mergeConfigs(defaultGlobal, null, null, {});

    expect(result.badgesEnabled).toBe(true);
    expect(result.antiBadgesEnabled).toBe(true);
    expect(result.easterEggsEnabled).toBe(true);
    expect(result.groupChallengesEnabled).toBe(true);
    expect(result.squadsEnabled).toBe(true);
    expect(result.skillTreesEnabled).toBe(true);
    expect(result.streaksEnabled).toBe(true);
    expect(result.collaborativePracticeEnabled).toBe(true);
    expect(result.streakFreezesAllowed).toBe(3);
    expect(result.badgeConfigs.size).toBe(3);
    expect(result.customBadges).toHaveLength(2);
  });

  it("section badge toggles override global", () => {
    const result = mergeConfigs(defaultGlobal, false, true, {});
    expect(result.badgesEnabled).toBe(false);
    expect(result.antiBadgesEnabled).toBe(true);
  });

  it("section gamification feature toggles override defaults", () => {
    const section: SectionGamificationConfig = {
      easterEggsEnabled: false,
      squadsEnabled: false,
      streaksEnabled: false,
    };
    const result = mergeConfigs(defaultGlobal, null, null, section);

    expect(result.easterEggsEnabled).toBe(false);
    expect(result.squadsEnabled).toBe(false);
    expect(result.streaksEnabled).toBe(false);
    // Others still default true
    expect(result.groupChallengesEnabled).toBe(true);
    expect(result.skillTreesEnabled).toBe(true);
    expect(result.collaborativePracticeEnabled).toBe(true);
  });

  it("section badgeConfigs override global by badgeType", () => {
    const section: SectionGamificationConfig = {
      badgeConfigs: [
        { badgeType: "SHARPSHOOTER", enabled: false },
        { badgeType: "DRILL_MASTER", enabled: true, thresholdOverride: 5 },
      ],
    };
    const result = mergeConfigs(defaultGlobal, null, null, section);

    // SHARPSHOOTER overridden to disabled
    expect(result.badgeConfigs.get("SHARPSHOOTER")?.enabled).toBe(false);
    // FIRST_SUBMISSION still from global
    expect(result.badgeConfigs.get("FIRST_SUBMISSION")?.enabled).toBe(true);
    // DRILL_MASTER added from section
    expect(result.badgeConfigs.get("DRILL_MASTER")?.enabled).toBe(true);
    expect(result.badgeConfigs.get("DRILL_MASTER")?.thresholdOverride).toBe(5);
    // Total: 3 from global + 1 new from section = 4
    expect(result.badgeConfigs.size).toBe(4);
  });

  it("section customBadges union with global, section wins on ID conflict", () => {
    const section: SectionGamificationConfig = {
      customBadges: [
        { id: "section-badge-1", title: "Section Star" },
        { id: "shared-id", title: "Section Override", category: "section" },
      ],
    };
    const result = mergeConfigs(defaultGlobal, null, null, section);

    expect(result.customBadges).toHaveLength(3); // global-badge-1, shared-id (section), section-badge-1
    const sharedBadge = result.customBadges.find((b) => b.id === "shared-id");
    expect(sharedBadge?.title).toBe("Section Override");
    expect(sharedBadge?.category).toBe("section");
  });

  it("section streakFreezesAllowed overrides global", () => {
    const section: SectionGamificationConfig = {
      streakFreezesAllowed: 5,
    };
    const result = mergeConfigs(defaultGlobal, null, null, section);
    expect(result.streakFreezesAllowed).toBe(5);
  });

  it("handles empty/null global gracefully", () => {
    const emptyGlobal: GlobalSettings = {};
    const result = mergeConfigs(emptyGlobal, null, null, {});

    expect(result.badgesEnabled).toBe(true);
    expect(result.antiBadgesEnabled).toBe(true);
    expect(result.streakFreezesAllowed).toBe(3);
    expect(result.badgeConfigs.size).toBe(0);
    expect(result.customBadges).toHaveLength(0);
  });
});

describe("isBadgeEnabled", () => {
  it("returns false when badgesEnabled is false globally", () => {
    const config = mergeConfigs(
      { badgesEnabled: false, antiBadgesEnabled: true },
      null,
      null,
      {},
    );
    expect(isBadgeEnabled(config, "FIRST_SUBMISSION")).toBe(false);
  });

  it("returns true when badge has no config entry (default enabled)", () => {
    const config = mergeConfigs(
      { badgesEnabled: true, antiBadgesEnabled: true },
      null,
      null,
      {},
    );
    expect(isBadgeEnabled(config, "UNKNOWN_BADGE")).toBe(true);
  });

  it("returns false when badge is explicitly disabled in config", () => {
    const config = mergeConfigs(
      {
        badgesEnabled: true,
        antiBadgesEnabled: true,
        badgeConfigs: [{ badgeType: "SHARPSHOOTER", enabled: false }],
      },
      null,
      null,
      {},
    );
    expect(isBadgeEnabled(config, "SHARPSHOOTER")).toBe(false);
  });

  it("section disable overrides global enable for specific badge", () => {
    const config = mergeConfigs(
      {
        badgesEnabled: true,
        antiBadgesEnabled: true,
        badgeConfigs: [{ badgeType: "DRILL_MASTER", enabled: true }],
      },
      null,
      null,
      {
        badgeConfigs: [{ badgeType: "DRILL_MASTER", enabled: false }],
      },
    );
    expect(isBadgeEnabled(config, "DRILL_MASTER")).toBe(false);
  });
});

describe("getBadgeThresholdOverride", () => {
  it("returns null when no override exists", () => {
    const config = mergeConfigs(
      { badgesEnabled: true, antiBadgesEnabled: true },
      null,
      null,
      {},
    );
    expect(getBadgeThresholdOverride(config, "FIRST_SUBMISSION")).toBeNull();
  });

  it("returns section threshold override over global", () => {
    const config = mergeConfigs(
      {
        badgesEnabled: true,
        antiBadgesEnabled: true,
        badgeConfigs: [
          { badgeType: "SHARPSHOOTER", enabled: true, thresholdOverride: 3 },
        ],
      },
      null,
      null,
      {
        badgeConfigs: [
          { badgeType: "SHARPSHOOTER", enabled: true, thresholdOverride: 10 },
        ],
      },
    );
    expect(getBadgeThresholdOverride(config, "SHARPSHOOTER")).toBe(10);
  });
});

describe("getEffectiveConfig with caching", () => {
  const mockGraphql = vi.fn();
  const mockClient = { graphql: mockGraphql };

  beforeEach(() => {
    clearAllCaches();
    mockGraphql.mockReset();
  });

  function setupMocks(platformSettings: any, section?: any) {
    mockGraphql.mockImplementation(({ query }: any) => {
      if (query.includes("listPlatformSettings")) {
        return Promise.resolve({
          data: {
            listPlatformSettings: { items: [platformSettings] },
          },
        });
      }
      if (query.includes("getSection")) {
        return Promise.resolve({
          data: { getSection: section || null },
        });
      }
      return Promise.resolve({ data: {} });
    });
  }

  it("fetches and caches global settings", async () => {
    setupMocks({ badgesEnabled: true, antiBadgesEnabled: false });

    const config1 = await getEffectiveConfig(mockClient);
    const config2 = await getEffectiveConfig(mockClient);

    expect(config1.badgesEnabled).toBe(true);
    expect(config1.antiBadgesEnabled).toBe(false);
    // Second call should use cache — only 1 graphql call total
    expect(mockGraphql).toHaveBeenCalledTimes(1);
    expect(config2.antiBadgesEnabled).toBe(false);
  });

  it("fetches section config and merges with global", async () => {
    setupMocks(
      {
        badgesEnabled: true,
        antiBadgesEnabled: true,
        badgeConfigs: [{ badgeType: "FIRST_SUBMISSION", enabled: true }],
        customBadges: [{ id: "g1", title: "Global Badge" }],
      },
      {
        id: "section-1",
        badgesEnabled: true,
        antiBadgesEnabled: false,
        gamificationConfig: JSON.stringify({
          easterEggsEnabled: false,
          customBadges: [{ id: "s1", title: "Section Badge" }],
        }),
      },
    );

    const config = await getEffectiveConfig(mockClient, "section-1");

    expect(config.badgesEnabled).toBe(true);
    expect(config.antiBadgesEnabled).toBe(false); // Section override
    expect(config.easterEggsEnabled).toBe(false); // Section override
    expect(config.customBadges).toHaveLength(2); // g1 + s1
    // 2 calls: 1 for PlatformSettings, 1 for Section
    expect(mockGraphql).toHaveBeenCalledTimes(2);
  });

  it("caches section config on subsequent calls", async () => {
    setupMocks(
      { badgesEnabled: true, antiBadgesEnabled: true },
      {
        id: "section-1",
        badgesEnabled: null,
        antiBadgesEnabled: null,
        gamificationConfig: null,
      },
    );

    await getEffectiveConfig(mockClient, "section-1");
    await getEffectiveConfig(mockClient, "section-1");

    // PlatformSettings cached after first call, Section cached after first call
    // Total: 2 calls (1 platform + 1 section), not 4
    expect(mockGraphql).toHaveBeenCalledTimes(2);
  });

  it("returns safe defaults when fetch fails", async () => {
    mockGraphql.mockRejectedValue(new Error("network error"));

    const config = await getEffectiveConfig(mockClient, "section-1");

    expect(config.badgesEnabled).toBe(true);
    expect(config.antiBadgesEnabled).toBe(true);
    expect(config.easterEggsEnabled).toBe(true);
    expect(config.streakFreezesAllowed).toBe(3);
  });
});
