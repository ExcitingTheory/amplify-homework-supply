import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  BADGE_CONFIGS_SELECTION,
  CUSTOM_BADGES_SELECTION,
  SECTION_GAMIFICATION_CONFIG_SELECTION,
} from "../../../amplify/functions/shared/typedSelectionsGamificationConfig";
import {
  BADGE_ENTRY_FIELDS,
  BADGES_SELECTION,
  COSMETIC_REWARD_FIELDS,
  COSMETIC_REWARDS_SELECTION,
  LEVEL_THRESHOLD_FIELDS,
  LEVEL_THRESHOLDS_SELECTION,
  readLevelThresholds,
  toBadgeEntryInputs,
  toCosmeticRewardInputs,
} from "../../../amplify/functions/shared/typedSelectionsLeaderboard";
import {
  MODERATION_SELECTION,
  buildModerationField,
} from "../../../amplify/functions/moderation/typedSelections";

const schemaSource = readFileSync(
  resolve(__dirname, "../../../amplify/data/resource.ts"),
  "utf8",
);

function customTypeBody(typeName: string): string {
  const start = schemaSource.indexOf(`const ${typeName} = a.customType({`);
  expect(start, `${typeName} not found in schema`).toBeGreaterThan(-1);
  return schemaSource.slice(start, schemaSource.indexOf("\n});", start));
}

function declaredFields(typeName: string): string[] {
  return [...customTypeBody(typeName).matchAll(/^ {2}(\w+):/gm)].map(
    (match) => match[1],
  );
}

/** Field name -> referenced custom type for `a.ref("X")` fields. */
function declaredRefs(typeName: string): Record<string, string> {
  return Object.fromEntries(
    [
      ...customTypeBody(typeName).matchAll(
        /^ {2}(\w+):\s*a\.ref\("(\w+)"\)/gm,
      ),
    ].map((match) => [match[1], match[2]]),
  );
}

interface SelectionNode {
  [field: string]: SelectionNode | null;
}

function parseSelection(selection: string): SelectionNode {
  const tokens = selection.match(/[{}]|[^\s{}]+/g) ?? [];
  let index = 0;
  const parseSet = (): SelectionNode => {
    const node: SelectionNode = {};
    while (index < tokens.length && tokens[index] !== "}") {
      const field = tokens[index++];
      if (tokens[index] === "{") {
        index++;
        node[field] = parseSet();
        index++;
      } else {
        node[field] = null;
      }
    }
    return node;
  };
  return parseSet();
}

/** Assert a sub-selection selects every declared field, recursing into refs. */
function expectMatchesType(node: SelectionNode, typeName: string): void {
  expect(Object.keys(node).sort(), typeName).toEqual(
    declaredFields(typeName).sort(),
  );
  for (const [field, refType] of Object.entries(declaredRefs(typeName))) {
    expect(node[field], `${typeName}.${field}`).not.toBeNull();
    expectMatchesType(node[field] as SelectionNode, refType);
  }
}

function singleField(selection: string): [string, SelectionNode] {
  const parsed = parseSelection(selection);
  const [name] = Object.keys(parsed);
  expect(Object.keys(parsed)).toHaveLength(1);
  return [name, parsed[name] as SelectionNode];
}

describe("typed selections match amplify/data/resource.ts", () => {
  const cases: Array<[string, string, string]> = [
    [LEVEL_THRESHOLDS_SELECTION, "levelThresholds", "LevelThreshold"],
    [COSMETIC_REWARDS_SELECTION, "cosmeticRewards", "CosmeticRewardEntry"],
    [BADGES_SELECTION, "badges", "BadgeEntry"],
    [BADGE_CONFIGS_SELECTION, "badgeConfigs", "BadgeConfig"],
    [CUSTOM_BADGES_SELECTION, "customBadges", "CustomBadgeDefinition"],
    [
      SECTION_GAMIFICATION_CONFIG_SELECTION,
      "gamificationConfig",
      "SectionGamificationConfig",
    ],
    [MODERATION_SELECTION, "moderation", "ModerationInfo"],
  ];

  it.each(cases)("%s selects every declared field", (selection, field, type) => {
    const [name, node] = singleField(selection);
    expect(name).toBe(field);
    expect(node).not.toBeNull();
    expectMatchesType(node, type);
  });

  it("declares each field with the expected custom type", () => {
    expect(schemaSource).toMatch(/levelThresholds: a\.ref\("LevelThreshold"\)\.array\(\)/);
    expect(schemaSource).toMatch(/cosmeticRewards: a\.ref\("CosmeticRewardEntry"\)\.array\(\)/);
    expect(schemaSource).toMatch(/gamificationConfig: a\.ref\("SectionGamificationConfig"\)/);
    expect(schemaSource).toMatch(/moderation: ModerationInfo/);
  });

  it("keeps the input allow-lists in step with the custom types", () => {
    expect([...LEVEL_THRESHOLD_FIELDS].sort()).toEqual(declaredFields("LevelThreshold").sort());
    expect([...COSMETIC_REWARD_FIELDS].sort()).toEqual(declaredFields("CosmeticRewardEntry").sort());
    expect([...BADGE_ENTRY_FIELDS].sort()).toEqual(declaredFields("BadgeEntry").sort());
  });
});

describe("toCosmeticRewardInputs / toBadgeEntryInputs", () => {
  it("accepts typed arrays and legacy JSON strings, emitting only declared fields", () => {
    const rewards = [
      { type: "ring", value: "gold", durationHours: null, extra: "x", __typename: "T" },
      null,
      { value: "missing-type" },
    ];
    expect(toCosmeticRewardInputs(rewards)).toEqual([
      { type: "ring", value: "gold", durationHours: null },
    ]);
    expect(toCosmeticRewardInputs(JSON.stringify(rewards))).toEqual([
      { type: "ring", value: "gold", durationHours: null },
    ]);
    expect(toBadgeEntryInputs([{ badgeType: "b", sourceId: "s", legacy: 1 }])).toEqual([
      { badgeType: "b", sourceId: "s" },
    ]);
    expect(toBadgeEntryInputs('[{"badgeType":"b","count":2}]')).toEqual([
      { badgeType: "b", count: 2 },
    ]);
  });

  it("returns an empty list for missing or unreadable values", () => {
    for (const value of [null, undefined, "", "{bad", "{}", 5]) {
      expect(toCosmeticRewardInputs(value)).toEqual([]);
      expect(toBadgeEntryInputs(value)).toEqual([]);
    }
  });
});

describe("readLevelThresholds", () => {
  const thresholds = [
    { level: 2, xpRequired: 100, title: null },
    { level: 1, xpRequired: 0, title: "Novice" },
  ];

  it("reads typed arrays and legacy JSON strings", () => {
    expect(readLevelThresholds(thresholds)).toEqual(thresholds);
    expect(readLevelThresholds(JSON.stringify(thresholds))).toEqual(thresholds);
    expect(readLevelThresholds([])).toEqual([]);
  });

  it("drops null and malformed entries", () => {
    expect(readLevelThresholds([null, { level: 1 }, thresholds[0]])).toEqual([thresholds[0]]);
  });

  it("returns null when unset or not a list", () => {
    for (const value of [null, undefined, "", "{bad", '{"a":1}', { level: 1 }, 5]) {
      expect(readLevelThresholds(value)).toBeNull();
    }
  });
});

describe("buildModerationField", () => {
  const result = {
    flagged: true,
    categories: { hate: true },
    categoryScores: { hate: 0.9 },
    model: "omni-moderation-latest",
  };
  const now = new Date("2026-01-02T03:04:05.000Z");

  it("sends only ModerationInfo fields with flags as an AWSJSON string", () => {
    const field = buildModerationField(result, now);
    expect(Object.keys(field).sort()).toEqual(declaredFields("ModerationInfo").sort());
    expect(field.status).toBe("flagged");
    expect(typeof field.flags).toBe("string");
    expect(JSON.parse(field.flags as string)).toEqual({
      categories: result.categories,
      categoryScores: result.categoryScores,
      model: result.model,
    });
    expect(field.checkedAt).toBe("2026-01-02T03:04:05.000Z");
  });

  it("approves unflagged content with null flags", () => {
    expect(buildModerationField({ ...result, flagged: false }, now)).toEqual({
      status: "approved",
      flags: null,
      checkedAt: "2026-01-02T03:04:05.000Z",
    });
  });
});
