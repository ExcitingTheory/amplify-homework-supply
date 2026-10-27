import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  BADGES_SELECTION,
  CONFUSION_PAIRS_SELECTION,
  CONTRIBUTIONS_SELECTION,
  COSMETIC_REWARDS_SELECTION,
  DISCOVERIES_SELECTION,
  ENTRY_SPECS,
  MEMBERS_SELECTION,
  MODULE_PROGRESS_SELECTION,
  PERSONAL_BESTS_SELECTION,
  SKILL_PROGRESS_SELECTION,
  STRONG_CONCEPTS_SELECTION,
  UNIT_MEMORIES_SELECTION,
  WEAK_CONCEPTS_SELECTION,
  sanitizeBadges,
  sanitizeConceptStrengths,
  sanitizeConfusionPairs,
  sanitizeContributions,
  sanitizeCosmeticRewards,
  sanitizeDiscoveries,
  sanitizeModuleProgress,
  sanitizePersonalBests,
  sanitizeSkillProgress,
  sanitizeSquadMembers,
  sanitizeUnitMemories,
  toJsonInput,
  toList,
  toObject,
} from "../../../amplify/functions/gamification/selections";

const schemaSource = readFileSync(
  resolve(__dirname, "../../../amplify/data/resource.ts"),
  "utf8",
);
const handlerSource = readFileSync(
  resolve(__dirname, "../../../amplify/functions/gamification/handler.ts"),
  "utf8",
);

const KINDS: Record<string, string> = {
  string: "string",
  integer: "int",
  float: "float",
  boolean: "boolean",
  datetime: "datetime",
  json: "json",
};

/** Field name -> spec kind (with `!` when required), read from resource.ts. */
function declaredSpec(typeName: string): Record<string, string> {
  const start = schemaSource.indexOf(`const ${typeName} = a.customType({`);
  expect(start, `${typeName} not found in schema`).toBeGreaterThan(-1);
  const body = schemaSource.slice(start, schemaSource.indexOf("});", start));
  const spec: Record<string, string> = {};
  for (const match of body.matchAll(
    /^\s{2}(\w+): a\.(\w+)\(\)(\.array\(\))?(\.required\(\))?/gm,
  )) {
    const [, field, type, array, required] = match;
    const kind = array ? `${KINDS[type]}List` : KINDS[type];
    spec[field] = `${kind}${required ? "!" : ""}`;
  }
  return spec;
}

const selectedFields = (selection: string) =>
  selection
    .slice(selection.indexOf("{") + 1, selection.indexOf("}"))
    .trim()
    .split(/\s+/);

type SpecName = keyof typeof ENTRY_SPECS;

describe("gamification entry specs", () => {
  it.each(Object.keys(ENTRY_SPECS))(
    "%s mirrors the custom type in resource.ts",
    (typeName) => {
      expect(
        ENTRY_SPECS[typeName as SpecName] as Record<string, string>,
      ).toEqual(declaredSpec(typeName));
    },
  );
});

describe("gamification selections", () => {
  const cases: Array<[string, string, SpecName]> = [
    [BADGES_SELECTION, "badges", "BadgeEntry"],
    [MODULE_PROGRESS_SELECTION, "moduleProgress", "ModuleProgressEntry"],
    [PERSONAL_BESTS_SELECTION, "personalBests", "PersonalBestEntry"],
    [SKILL_PROGRESS_SELECTION, "skillProgress", "SkillProgressEntry"],
    [UNIT_MEMORIES_SELECTION, "unitMemories", "UnitMemoryEntry"],
    [COSMETIC_REWARDS_SELECTION, "cosmeticRewards", "CosmeticRewardEntry"],
    [MEMBERS_SELECTION, "members", "SquadMember"],
    [CONTRIBUTIONS_SELECTION, "contributions", "ChallengeContribution"],
    [DISCOVERIES_SELECTION, "discoveries", "EasterEggDiscoveryEntry"],
    [WEAK_CONCEPTS_SELECTION, "weakConcepts", "ConceptStrength"],
    [STRONG_CONCEPTS_SELECTION, "strongConcepts", "ConceptStrength"],
    [CONFUSION_PAIRS_SELECTION, "confusionPairs", "ConfusionPair"],
  ];

  it.each(cases)(
    "%s selects every field its custom type declares",
    (selection, fieldName, typeName) => {
      expect(selection.startsWith(`${fieldName} {`)).toBe(true);
      expect(selectedFields(selection).sort()).toEqual(
        Object.keys(declaredSpec(typeName)).sort(),
      );
    },
  );

  it("replaces every bare list field name in the handler's documents", () => {
    const documents = [
      ...handlerSource.matchAll(/`\s*((?:query|mutation)\b[^`]*)`/g),
    ].map((match) => match[1]);
    expect(documents.length).toBeGreaterThan(10);
    const bareList =
      /[\s{](badges|moduleProgress|personalBests|skillProgress|unitMemories|cosmeticRewards|members|contributions|discoveries|weakConcepts|strongConcepts|confusionPairs)\s+[\w_]/;
    for (const doc of documents) {
      expect(doc, doc.split("\n")[0]).not.toMatch(bareList);
    }
  });
});

describe("toList", () => {
  it("returns arrays, parses legacy JSON strings, and defaults to []", () => {
    expect(toList([{ a: 1 }, null, undefined])).toEqual([{ a: 1 }]);
    expect(toList('[{"badgeType":"X"}]')).toEqual([{ badgeType: "X" }]);
    expect(toList("not json")).toEqual([]);
    expect(toList("{}")).toEqual([]);
    expect(toList(null)).toEqual([]);
    expect(toList(undefined)).toEqual([]);
    expect(toList({ a: 1 })).toEqual([]);
  });
});

describe("toObject", () => {
  it("returns objects, parses AWSJSON strings, and defaults to {}", () => {
    expect(toObject({ quiz: 80 })).toEqual({ quiz: 80 });
    expect(toObject('{"quiz":80}')).toEqual({ quiz: 80 });
    expect(toObject("bad")).toEqual({});
    expect(toObject("[1]")).toEqual({});
    expect(toObject([1])).toEqual({});
    expect(toObject(null)).toEqual({});
  });
});

describe("toJsonInput", () => {
  it("serializes objects, keeps valid JSON strings, omits null", () => {
    expect(toJsonInput({ a: 1 })).toBe('{"a":1}');
    expect(toJsonInput('{"a":1}')).toBe('{"a":1}');
    expect(toJsonInput("plain")).toBe('"plain"');
    expect(toJsonInput(null)).toBeUndefined();
    expect(toJsonInput(undefined)).toBeUndefined();
  });
});

describe("sanitizers", () => {
  const at = "2026-01-02T03:04:05.000Z";

  it("keeps only declared badge fields and drops null/undefined values", () => {
    expect(
      sanitizeBadges([
        {
          badgeType: "STREAK",
          awardedAt: at,
          sectionID: null,
          unitID: undefined,
          count: 2,
          isAnti: true,
          rarity: "rare",
          __typename: "BadgeEntry",
        },
      ]),
    ).toEqual([{ badgeType: "STREAK", awardedAt: at, count: 2, isAnti: true }]);
  });

  it("accepts legacy JSON strings and drops entries missing required fields", () => {
    expect(
      sanitizeBadges(JSON.stringify([{ badgeType: "A" }, { count: 1 }, null])),
    ).toEqual([{ badgeType: "A" }]);
    expect(sanitizeBadges(null)).toEqual([]);
    expect(sanitizeSkillProgress([{ skillId: "s1" }])).toEqual([]);
  });

  it("rounds integers and drops values of the wrong type", () => {
    expect(
      sanitizeModuleProgress([
        {
          moduleId: "m1",
          completionPercent: 66.7,
          totalWorkbooks: 3.2,
          completedWorkbooks: "2",
          lastUpdatedAt: "not a date",
        },
      ]),
    ).toEqual([{ moduleId: "m1", completionPercent: 66.7, totalWorkbooks: 3 }]);
    expect(
      sanitizeContributions([{ studentId: "s", xpContributed: 12.6 }]),
    ).toEqual([{ studentId: "s", xpContributed: 13 }]);
    expect(sanitizeContributions([{ studentId: "s" }])).toEqual([]);
  });

  it("sanitizes personal bests, skill progress and discoveries", () => {
    expect(
      sanitizePersonalBests([
        { unitID: "u", bestScore: 90, achievedAt: at, previousBest: null },
      ]),
    ).toEqual([{ unitID: "u", bestScore: 90, achievedAt: at }]);
    expect(
      sanitizeSkillProgress([{ skillId: "s", status: "MASTERED", extra: 1 }]),
    ).toEqual([{ skillId: "s", status: "MASTERED" }]);
    expect(
      sanitizeDiscoveries([{ studentId: "a", discoveredAt: at, note: "x" }]),
    ).toEqual([{ studentId: "a", discoveredAt: at }]);
  });

  it("drops empty datetimes when syncing unit memories", () => {
    expect(
      sanitizeUnitMemories([
        {
          unitID: "u",
          averageAccuracy: 80,
          totalAttempts: 2,
          reviewPriority: 0,
          lastPracticedAt: "",
          weakConcepts: ["a", 1, "b"],
        },
      ]),
    ).toEqual([
      {
        unitID: "u",
        weakConcepts: ["a", "b"],
        totalAttempts: 2,
        averageAccuracy: 80,
        reviewPriority: 0,
      },
    ]);
  });

  it("sanitizes cosmetic rewards, dropping null durations", () => {
    expect(
      sanitizeCosmeticRewards([
        {
          type: "ring",
          value: "gold",
          durationHours: null,
          awardedAt: at,
          expiresAt: null,
          sourceId: "challenge-1",
          label: "ring: gold",
        },
      ]),
    ).toEqual([
      {
        type: "ring",
        value: "gold",
        awardedAt: at,
        sourceId: "challenge-1",
        label: "ring: gold",
      },
    ]);
  });

  it("serializes squad member avatarOverrides as AWSJSON strings", () => {
    const [fromObject, fromString] = sanitizeSquadMembers([
      { studentId: "a", avatarOverrides: { skin: "dark" }, role: "LEADER" },
      { studentId: "b", avatarOverrides: '{"skin":"light"}', joinedAt: null },
    ]);
    expect(fromObject).toEqual({
      studentId: "a",
      role: "LEADER",
      avatarOverrides: '{"skin":"dark"}',
    });
    expect(fromString).toEqual({
      studentId: "b",
      avatarOverrides: '{"skin":"light"}',
    });
  });

  it("sanitizes concept strengths", () => {
    expect(
      sanitizeConceptStrengths([
        {
          concept: "fractions",
          sourceType: "practice",
          frequency: 2,
          lastSeen: at,
          junk: 1,
        },
        { sourceType: "practice" },
      ]),
    ).toEqual([
      {
        concept: "fractions",
        sourceType: "practice",
        frequency: 2,
        lastSeen: at,
      },
    ]);
  });

  it("maps legacy item1/item2 confusion pairs onto conceptA/conceptB", () => {
    expect(
      sanitizeConfusionPairs([
        { item1: "は", item2: "が", frequency: 3 },
        { conceptA: "x", conceptB: "y" },
        { item1: "lonely" },
      ]),
    ).toEqual([
      { conceptA: "は", conceptB: "が", frequency: 3 },
      { conceptA: "x", conceptB: "y" },
    ]);
  });
});
