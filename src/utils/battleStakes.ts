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

export const DEFAULT_BATTLE_STAKES: BattleStakes = {
  loseLevel: false,
  loseXP: false,
  xpLossAmount: 50,
  loseStreakFreeze: true,
  resetStreak: false,
  loseBadge: false,
  loseBadgeByRarity: false,
  badgeRarityTarget: "common",
  streakMissXPPenalty: false,
  streakMissXPPerDay: 10,
  loseCosmetics: false,
  cosmeticPenaltyDays: 3,
};

const ALLOWED_KEYS = new Set([
  "loseLevel",
  "loseXP",
  "xpLossAmount",
  "loseStreakFreeze",
  "resetStreak",
  "loseBadge",
  "loseBadgeByRarity",
  "badgeRarityTarget",
  "streakMissXPPenalty",
  "streakMissXPPerDay",
  "loseCosmetics",
  "cosmeticPenaltyDays",
]);

const BADGE_RARITIES: BadgeRarity[] = [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
];

function toInteger(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  const rounded = Math.round(n);
  return Math.min(max, Math.max(min, rounded));
}

function toBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  return fallback;
}

function toObject(input: unknown): Record<string, unknown> {
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) return {};
    const parsed = JSON.parse(trimmed);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Stakes must be a JSON object");
    }
    return parsed as Record<string, unknown>;
  }

  if (!input) return {};

  if (typeof input === "object" && !Array.isArray(input)) {
    return input as Record<string, unknown>;
  }

  throw new Error("Stakes must be a JSON object");
}

export function parseAndValidateBattleStakes(input: unknown): BattleStakes {
  const raw = toObject(input);
  const unknownKeys = Object.keys(raw).filter((key) => !ALLOWED_KEYS.has(key));
  if (unknownKeys.length > 0) {
    throw new Error(`Unsupported stakes field(s): ${unknownKeys.join(", ")}`);
  }

  const stakeRarity =
    typeof raw.badgeRarityTarget === "string" &&
    BADGE_RARITIES.includes(raw.badgeRarityTarget as BadgeRarity)
      ? (raw.badgeRarityTarget as BadgeRarity)
      : DEFAULT_BATTLE_STAKES.badgeRarityTarget;

  const normalized: BattleStakes = {
    loseLevel: toBoolean(raw.loseLevel, DEFAULT_BATTLE_STAKES.loseLevel),
    loseXP: toBoolean(raw.loseXP, DEFAULT_BATTLE_STAKES.loseXP),
    xpLossAmount: toInteger(
      raw.xpLossAmount,
      DEFAULT_BATTLE_STAKES.xpLossAmount,
      1,
      100000,
    ),
    loseStreakFreeze: toBoolean(
      raw.loseStreakFreeze,
      DEFAULT_BATTLE_STAKES.loseStreakFreeze,
    ),
    resetStreak: toBoolean(raw.resetStreak, DEFAULT_BATTLE_STAKES.resetStreak),
    loseBadge: toBoolean(raw.loseBadge, DEFAULT_BATTLE_STAKES.loseBadge),
    loseBadgeByRarity: toBoolean(
      raw.loseBadgeByRarity,
      DEFAULT_BATTLE_STAKES.loseBadgeByRarity,
    ),
    badgeRarityTarget: stakeRarity,
    streakMissXPPenalty: toBoolean(
      raw.streakMissXPPenalty,
      DEFAULT_BATTLE_STAKES.streakMissXPPenalty,
    ),
    streakMissXPPerDay: toInteger(
      raw.streakMissXPPerDay,
      DEFAULT_BATTLE_STAKES.streakMissXPPerDay,
      1,
      100000,
    ),
    loseCosmetics: toBoolean(
      raw.loseCosmetics,
      DEFAULT_BATTLE_STAKES.loseCosmetics,
    ),
    cosmeticPenaltyDays: toInteger(
      raw.cosmeticPenaltyDays,
      DEFAULT_BATTLE_STAKES.cosmeticPenaltyDays,
      1,
      30,
    ),
  };

  if (!normalized.loseXP)
    normalized.xpLossAmount = DEFAULT_BATTLE_STAKES.xpLossAmount;
  if (!normalized.loseBadgeByRarity)
    normalized.badgeRarityTarget = DEFAULT_BATTLE_STAKES.badgeRarityTarget;
  if (!normalized.streakMissXPPenalty)
    normalized.streakMissXPPerDay = DEFAULT_BATTLE_STAKES.streakMissXPPerDay;
  if (!normalized.loseCosmetics)
    normalized.cosmeticPenaltyDays = DEFAULT_BATTLE_STAKES.cosmeticPenaltyDays;

  return normalized;
}

export function serializeBattleStakes(input: unknown): string {
  return JSON.stringify(parseAndValidateBattleStakes(input));
}
