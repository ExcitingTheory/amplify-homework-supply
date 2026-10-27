/**
 * PlatformSettings.badgeConfigs / customBadges and Section.gamificationConfig are
 * typed GraphQL values, so queries must select their sub-fields (a bare
 * `gamificationConfig` is invalid). These fragments mirror the custom types in
 * amplify/data/resource.ts; test/unit/typedLists/ checks them against it.
 * `criteria` on a custom badge is AWSJSON and still arrives as a JSON string.
 */
export const BADGE_CONFIGS_SELECTION =
  "badgeConfigs { badgeType enabled thresholdOverride }";
export const CUSTOM_BADGES_SELECTION =
  "customBadges { id title description icon shape rarity category criteria isAnti autoEvaluate }";
export const SECTION_GAMIFICATION_CONFIG_SELECTION = `gamificationConfig { xpEnabled leaderboardEnabled badgesEnabled antiBadgesEnabled easterEggsEnabled groupChallengesEnabled squadsEnabled skillTreesEnabled streaksEnabled collaborativePracticeEnabled cosmeticsEnabled contentLocksEnabled streakFreezesAllowed ${BADGE_CONFIGS_SELECTION} ${CUSTOM_BADGES_SELECTION} }`;
