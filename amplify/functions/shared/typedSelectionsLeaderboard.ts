/**
 * StudentProfile and PlatformSettings store levelThresholds, cosmeticRewards and
 * badges as typed GraphQL lists. Queries must select each list's sub-fields (a
 * bare `badges` is invalid), results are arrays, and mutation inputs must send
 * arrays whose objects carry only the fields the matching input type declares.
 * These fragments and helpers mirror the custom types in amplify/data/resource.ts;
 * test/unit/typedLists/ checks them against it.
 */
import { toEntryList } from "./parsedContentLists";

export const LEVEL_THRESHOLDS_SELECTION =
  "levelThresholds { level xpRequired title }";
export const COSMETIC_REWARDS_SELECTION =
  "cosmeticRewards { type value durationHours awardedAt expiresAt sourceId label }";
export const BADGES_SELECTION =
  "badges { badgeType sourceId awardedAt sectionID unitID count isAnti }";

export const LEVEL_THRESHOLD_FIELDS = ["level", "xpRequired", "title"] as const;
export const COSMETIC_REWARD_FIELDS = [
  "type",
  "value",
  "durationHours",
  "awardedAt",
  "expiresAt",
  "sourceId",
  "label",
] as const;
export const COSMETIC_REWARD_REQUIRED_FIELDS = ["type", "value"] as const;
export const BADGE_ENTRY_FIELDS = [
  "badgeType",
  "sourceId",
  "awardedAt",
  "sectionID",
  "unitID",
  "count",
  "isAnti",
] as const;
export const BADGE_ENTRY_REQUIRED_FIELDS = ["badgeType"] as const;

/** Keep only declared keys; null when a required key is missing. */
function pickDeclared(
  entry: unknown,
  fields: readonly string[],
  required: readonly string[],
): Record<string, unknown> | null {
  if (!entry || typeof entry !== "object") return null;
  const source = entry as Record<string, unknown>;
  if (required.some((key) => source[key] === null || source[key] === undefined)) {
    return null;
  }
  const picked: Record<string, unknown> = {};
  for (const key of fields) {
    if (source[key] !== undefined) picked[key] = source[key];
  }
  return picked;
}

function toInputList(
  value: unknown,
  fields: readonly string[],
  required: readonly string[],
): Record<string, unknown>[] {
  return toEntryList(value)
    .map((entry) => pickDeclared(entry, fields, required))
    .filter((entry): entry is Record<string, unknown> => entry !== null);
}

/** Existing cosmetic rewards (typed array or legacy JSON string) as input-safe objects. */
export function toCosmeticRewardInputs(value: unknown) {
  return toInputList(
    value,
    COSMETIC_REWARD_FIELDS,
    COSMETIC_REWARD_REQUIRED_FIELDS,
  );
}

/** Existing badges (typed array or legacy JSON string) as input-safe objects. */
export function toBadgeEntryInputs(value: unknown) {
  return toInputList(value, BADGE_ENTRY_FIELDS, BADGE_ENTRY_REQUIRED_FIELDS);
}

export interface LevelThresholdEntry {
  level: number;
  xpRequired: number;
  title?: string | null;
}

/**
 * Read PlatformSettings.levelThresholds. Returns null when unset or unreadable
 * so callers fall back to the default level curve.
 */
export function readLevelThresholds(
  value: unknown,
): LevelThresholdEntry[] | null {
  if (!value) return null;
  if (typeof value !== "string" && !Array.isArray(value)) return null;
  if (typeof value === "string") {
    try {
      if (!Array.isArray(JSON.parse(value))) return null;
    } catch {
      return null;
    }
  }
  return toEntryList<LevelThresholdEntry>(value).filter(
    (entry) =>
      typeof entry === "object" &&
      typeof entry.level === "number" &&
      typeof entry.xpRequired === "number",
  );
}
