import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseBattleStakes } from "../../../amplify/functions/gamification/battleStakes";

const NONE = {
  loseLevel: false,
  loseXP: false,
  xpLossAmount: 0,
  loseStreakFreeze: false,
  resetStreak: false,
  loseBadge: false,
  loseBadgeByRarity: false,
  badgeRarityTarget: "common",
  streakMissXPPenalty: false,
  streakMissXPPerDay: 0,
  loseCosmetics: false,
  cosmeticPenaltyDays: 0,
};

describe("parseBattleStakes", () => {
  it("treats a missing, empty or null value as no stakes", () => {
    expect(parseBattleStakes(undefined)).toEqual(NONE);
    expect(parseBattleStakes(null)).toEqual(NONE);
    expect(parseBattleStakes("")).toEqual(NONE);
    expect(parseBattleStakes("  {}  ")).toEqual(NONE);
  });

  it("reads what the instructor UI saves", () => {
    const saved = {
      loseLevel: false,
      loseXP: true,
      xpLossAmount: 50,
      loseStreakFreeze: true,
      resetStreak: false,
      loseBadge: false,
      loseBadgeByRarity: true,
      badgeRarityTarget: "rare",
      streakMissXPPenalty: true,
      streakMissXPPerDay: 10,
      loseCosmetics: true,
      cosmeticPenaltyDays: 3,
    };
    expect(parseBattleStakes(JSON.stringify(saved))).toEqual(saved);
    expect(parseBattleStakes(saved)).toEqual(saved);
  });

  it("only enables a penalty for a literal true", () => {
    const stakes = parseBattleStakes(
      JSON.stringify({
        loseXP: "false",
        loseLevel: 1,
        resetStreak: "true",
        loseBadge: null,
        loseCosmetics: "yes",
      }),
    );
    expect(stakes.loseXP).toBe(false);
    expect(stakes.loseLevel).toBe(false);
    expect(stakes.resetStreak).toBe(false);
    expect(stakes.loseBadge).toBe(false);
    expect(stakes.loseCosmetics).toBe(false);
  });

  it("clamps amounts to safe integers and rejects bad rarities", () => {
    const stakes = parseBattleStakes({
      xpLossAmount: -40,
      streakMissXPPerDay: "7.6",
      cosmeticPenaltyDays: 9999,
      loseBadgeByRarity: true,
      badgeRarityTarget: "mythic",
    });
    expect(stakes.xpLossAmount).toBe(0);
    expect(stakes.streakMissXPPerDay).toBe(8);
    expect(stakes.cosmeticPenaltyDays).toBe(365);
    expect(stakes.loseBadgeByRarity).toBe(false);
    expect(stakes.badgeRarityTarget).toBe("common");
    expect(parseBattleStakes({ xpLossAmount: Number.NaN }).xpLossAmount).toBe(0);
  });

  it("throws on corrupt JSON or a non-object", () => {
    expect(() => parseBattleStakes("{bad")).toThrow();
    expect(() => parseBattleStakes("[1]")).toThrow("JSON object");
    expect(() => parseBattleStakes("5")).toThrow("JSON object");
  });
});

describe("challenge query", () => {
  it("selects stakes, which applyBattleStakes reads", () => {
    const source = readFileSync(
      resolve(__dirname, "../../../amplify/functions/gamification/handler.ts"),
      "utf8",
    );
    const start = source.indexOf("const LIST_ACTIVE_CHALLENGES_BY_SECTION");
    const query = source.slice(start, source.indexOf("`;", start));
    expect(query).toMatch(/\bstakes\b/);
  });
});
