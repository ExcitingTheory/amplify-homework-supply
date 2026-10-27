/**
 * Strict reader for GroupChallenge.stakes (a JSON string). Applying stakes
 * deducts XP, badges and cosmetics from real students, so only literal `true`
 * enables a penalty and amounts are clamped integers. Mirrors the shape the
 * instructor UI writes (src/utils/battleStakes.ts; no cross-boundary imports
 * between amplify/ and src/ in this repo).
 */

export type BadgeRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export interface BattleStakes {
  loseLevel: boolean;
  loseXP: boolean;
  xpLossAmount: number;
  loseStreakFreeze: boolean;
  resetStreak: boolean;
  loseBadge: boolean;
  loseBadgeByRarity: boolean;
  badgeRarityTarget: BadgeRarity;
  streakMissXPPenalty: boolean;
  streakMissXPPerDay: number;
  loseCosmetics: boolean;
  cosmeticPenaltyDays: number;
}

const RARITIES: BadgeRarity[] = ["common", "uncommon", "rare", "epic", "legendary"];

const flag = (value: unknown): boolean => value === true;

function amount(value: unknown, max: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(max, Math.max(0, Math.round(n)));
}

/**
 * Parse a challenge's stakes. A missing or empty value means no stakes. Throws
 * when the value is not valid JSON or not a JSON object, so a corrupt record is
 * reported instead of silently applying nothing.
 */
export function parseBattleStakes(raw: unknown): BattleStakes {
  let value: unknown = raw;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    value = trimmed ? JSON.parse(trimmed) : {};
  }
  if (value === null || value === undefined) value = {};
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Stakes must be a JSON object");
  }
  const stakes = value as Record<string, unknown>;
  const rarity = RARITIES.find((candidate) => candidate === stakes.badgeRarityTarget);

  return {
    loseLevel: flag(stakes.loseLevel),
    loseXP: flag(stakes.loseXP),
    xpLossAmount: amount(stakes.xpLossAmount, 100000),
    loseStreakFreeze: flag(stakes.loseStreakFreeze),
    resetStreak: flag(stakes.resetStreak),
    loseBadge: flag(stakes.loseBadge),
    loseBadgeByRarity: flag(stakes.loseBadgeByRarity) && rarity !== undefined,
    badgeRarityTarget: rarity ?? "common",
    streakMissXPPenalty: flag(stakes.streakMissXPPenalty),
    streakMissXPPerDay: amount(stakes.streakMissXPPerDay, 100000),
    loseCosmetics: flag(stakes.loseCosmetics),
    cosmeticPenaltyDays: amount(stakes.cosmeticPenaltyDays, 365),
  };
}
