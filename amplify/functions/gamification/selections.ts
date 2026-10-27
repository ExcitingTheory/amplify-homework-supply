/**
 * Gamification models store their embedded lists as typed GraphQL lists
 * (e.g. StudentProfile.badges is [BadgeEntry]), not JSON strings. AppSync
 * therefore requires every selection to name sub-fields, returns real arrays,
 * and rejects mutation input keys the matching `...Input` type does not
 * declare. The selections below and the ENTRY_SPECS mirror the custom types in
 * amplify/data/resource.ts; test/unit/gamification/selections.test.ts checks
 * them against it.
 */
import { toEntryList } from "../shared/parsedContentLists";

// --- StudentProfile lists ---
export const BADGES_SELECTION =
  "badges { badgeType sourceId awardedAt sectionID unitID count isAnti }";
export const MODULE_PROGRESS_SELECTION =
  "moduleProgress { moduleId completionPercent totalWorkbooks completedWorkbooks lastUpdatedAt }";
export const PERSONAL_BESTS_SELECTION =
  "personalBests { unitID bestScore achievedAt previousBest }";
export const SKILL_PROGRESS_SELECTION = "skillProgress { skillId status }";
export const UNIT_MEMORIES_SELECTION =
  "unitMemories { unitID weakConcepts strongConcepts totalAttempts averageAccuracy reviewPriority lastPracticedAt }";
export const COSMETIC_REWARDS_SELECTION =
  "cosmeticRewards { type value durationHours awardedAt expiresAt sourceId label }";

// --- Squad / GroupChallenge / EasterEgg lists ---
export const MEMBERS_SELECTION =
  "members { studentId role joinedAt avatarStyle avatarOverrides avatarSeed }";
export const CONTRIBUTIONS_SELECTION =
  "contributions { studentId xpContributed contributedAt }";
export const DISCOVERIES_SELECTION =
  "discoveries { studentId discoveredAt }";

// --- StudentMemory lists ---
export const WEAK_CONCEPTS_SELECTION =
  "weakConcepts { concept sourceType frequency lastSeen }";
export const STRONG_CONCEPTS_SELECTION =
  "strongConcepts { concept sourceType frequency lastSeen }";
export const CONFUSION_PAIRS_SELECTION =
  "confusionPairs { conceptA conceptB frequency }";

type FieldKind =
  | "string"
  | "int"
  | "float"
  | "boolean"
  | "datetime"
  | "json"
  | "stringList";

/** A trailing `!` marks a field the custom type declares as required. */
type EntrySpec = Record<string, FieldKind | `${FieldKind}!`>;

export const ENTRY_SPECS = {
  BadgeEntry: {
    badgeType: "string!",
    sourceId: "string",
    awardedAt: "datetime",
    sectionID: "string",
    unitID: "string",
    count: "int",
    isAnti: "boolean",
  },
  ModuleProgressEntry: {
    moduleId: "string!",
    completionPercent: "float!",
    totalWorkbooks: "int",
    completedWorkbooks: "int",
    lastUpdatedAt: "datetime",
  },
  PersonalBestEntry: {
    unitID: "string!",
    bestScore: "float!",
    achievedAt: "datetime",
    previousBest: "float",
  },
  SkillProgressEntry: {
    skillId: "string!",
    status: "string!",
  },
  UnitMemoryEntry: {
    unitID: "string!",
    weakConcepts: "stringList",
    strongConcepts: "stringList",
    totalAttempts: "int",
    averageAccuracy: "float",
    reviewPriority: "float",
    lastPracticedAt: "datetime",
  },
  CosmeticRewardEntry: {
    type: "string!",
    value: "string!",
    durationHours: "int",
    awardedAt: "datetime",
    expiresAt: "datetime",
    sourceId: "string",
    label: "string",
  },
  SquadMember: {
    studentId: "string!",
    role: "string",
    joinedAt: "datetime",
    avatarStyle: "string",
    avatarOverrides: "json",
    avatarSeed: "string",
  },
  ChallengeContribution: {
    studentId: "string!",
    xpContributed: "int!",
    contributedAt: "datetime",
  },
  EasterEggDiscoveryEntry: {
    studentId: "string!",
    discoveredAt: "datetime",
  },
  ConceptStrength: {
    concept: "string!",
    sourceType: "string",
    frequency: "int",
    lastSeen: "datetime",
  },
  ConfusionPair: {
    conceptA: "string!",
    conceptB: "string!",
    frequency: "int",
  },
} as const satisfies Record<string, EntrySpec>;

type Entry = Record<string, unknown>;

const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T/;

/**
 * Read a typed GraphQL list as an array. Accepts the arrays AppSync returns
 * and the JSON strings legacy records or callers may still hold; null,
 * undefined, and anything unparseable become an empty list.
 */
export function toList<T = Entry>(value: unknown): T[] {
  return toEntryList<T>(value);
}

/**
 * Read an object that may arrive as a parsed object or as an AWSJSON string
 * (AWSJSON fields such as accuracyBySource are returned as JSON strings).
 */
export function toObject<T extends object = Record<string, any>>(
  value: unknown,
): T {
  let parsed: unknown = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      return {} as T;
    }
  }
  return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)
    ? (parsed as T)
    : ({} as T);
}

/** Serialize a value for an AWSJSON input field; null/undefined are omitted. */
export function toJsonInput(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string") {
    try {
      JSON.parse(value);
      return value;
    } catch {
      return JSON.stringify(value);
    }
  }
  return JSON.stringify(value);
}

function coerce(
  kind: FieldKind,
  value: unknown,
): string | number | boolean | string[] | undefined {
  if (value === null || value === undefined) return undefined;
  switch (kind) {
    case "string":
      return typeof value === "string" && value !== "" ? value : undefined;
    case "int":
      return typeof value === "number" && Number.isFinite(value)
        ? Math.round(value)
        : undefined;
    case "float":
      return typeof value === "number" && Number.isFinite(value)
        ? value
        : undefined;
    case "boolean":
      return typeof value === "boolean" ? value : undefined;
    case "datetime":
      return typeof value === "string" &&
        ISO_DATETIME.test(value) &&
        !Number.isNaN(Date.parse(value))
        ? value
        : undefined;
    case "json":
      return toJsonInput(value);
    case "stringList":
      return Array.isArray(value)
        ? value.filter((item): item is string => typeof item === "string")
        : undefined;
  }
}

/**
 * Reduce a list to entries containing only the fields `spec` declares, with
 * null/undefined/invalid values dropped. Entries missing a required field
 * cannot be sent and are omitted.
 */
function sanitizeEntries(
  value: unknown,
  spec: EntrySpec,
  normalize?: (entry: Entry) => Entry,
): Entry[] {
  const result: Entry[] = [];
  for (const raw of toList<Entry>(value)) {
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) continue;
    const source = normalize ? normalize(raw) : raw;
    const entry: Entry = {};
    let complete = true;
    for (const [field, declared] of Object.entries(spec)) {
      const required = declared.endsWith("!");
      const kind = (required ? declared.slice(0, -1) : declared) as FieldKind;
      const coerced = coerce(kind, source[field]);
      if (coerced === undefined) {
        if (required) complete = false;
        continue;
      }
      entry[field] = coerced;
    }
    if (complete) result.push(entry);
  }
  return result;
}

export const sanitizeBadges = (value: unknown) =>
  sanitizeEntries(value, ENTRY_SPECS.BadgeEntry);
export const sanitizeModuleProgress = (value: unknown) =>
  sanitizeEntries(value, ENTRY_SPECS.ModuleProgressEntry);
export const sanitizePersonalBests = (value: unknown) =>
  sanitizeEntries(value, ENTRY_SPECS.PersonalBestEntry);
export const sanitizeSkillProgress = (value: unknown) =>
  sanitizeEntries(value, ENTRY_SPECS.SkillProgressEntry);
export const sanitizeUnitMemories = (value: unknown) =>
  sanitizeEntries(value, ENTRY_SPECS.UnitMemoryEntry);
export const sanitizeCosmeticRewards = (value: unknown) =>
  sanitizeEntries(value, ENTRY_SPECS.CosmeticRewardEntry);
export const sanitizeSquadMembers = (value: unknown) =>
  sanitizeEntries(value, ENTRY_SPECS.SquadMember);
export const sanitizeContributions = (value: unknown) =>
  sanitizeEntries(value, ENTRY_SPECS.ChallengeContribution);
export const sanitizeDiscoveries = (value: unknown) =>
  sanitizeEntries(value, ENTRY_SPECS.EasterEggDiscoveryEntry);
export const sanitizeConceptStrengths = (value: unknown) =>
  sanitizeEntries(value, ENTRY_SPECS.ConceptStrength);

/**
 * Confusion pairs arrive from callers as {item1, item2} but the schema's
 * ConfusionPair declares {conceptA, conceptB}; both shapes are accepted.
 */
export const normalizeConfusionPair = (entry: Entry): Entry => ({
  ...entry,
  conceptA: entry.conceptA ?? entry.item1,
  conceptB: entry.conceptB ?? entry.item2,
});
export const sanitizeConfusionPairs = (value: unknown) =>
  sanitizeEntries(value, ENTRY_SPECS.ConfusionPair, normalizeConfusionPair);
