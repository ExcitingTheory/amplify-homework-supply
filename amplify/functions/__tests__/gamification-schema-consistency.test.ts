/**
 * Schema–Handler consistency test
 *
 * Validates that every custom mutation in amplify/data/resource.ts
 * that routes to gamificationHandler has a matching case in handler.ts,
 * and vice versa.
 */

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("gamification schema ↔ handler consistency", () => {
  const rootDir = path.resolve(__dirname, "..", "..");
  const schemaPath = path.join(rootDir, "data", "resource.ts");
  const handlerPath = path.join(
    rootDir,
    "functions",
    "gamification",
    "handler.ts",
  );

  const schemaSource = fs.readFileSync(schemaPath, "utf-8");
  const handlerSource = fs.readFileSync(handlerPath, "utf-8");

  /** Extract mutation names from schema that use gamificationHandler */
  function getSchemaMutations(): string[] {
    const mutations: string[] = [];
    // Pattern: "    mutationName: a\n      .mutation()\n    ...  .handler(a.handler.function(gamificationHandler))"
    const lines = schemaSource.split("\n");
    let currentMutation: string | null = null;

    for (const line of lines) {
      // Matches "    awardXP: a" at the start of a mutation block (4 spaces indentation)
      const nameMatch = line.match(/^\s+(\w+):\s+a\s*$/);
      if (nameMatch) {
        currentMutation = nameMatch[1];
        continue;
      }

      // Check if this line has a .handler() call
      if (currentMutation && line.includes(".handler(")) {
        if (line.includes("gamificationHandler")) {
          mutations.push(currentMutation);
        }
        // Either way, this mutation block is done
        currentMutation = null;
        continue;
      }

      // Reset if we hit another mutation/query definition
      if (currentMutation && /^\s+\w+:\s+a\s*$/.test(line)) {
        currentMutation = null;
      }
    }

    return mutations;
  }

  /** Extract case names from the main handler fieldName switch statement */
  function getHandlerCases(): string[] {
    // Find the switch(fieldName) block and extract cases from it only
    const switchMatch = handlerSource.match(
      /switch\s*\(\s*fieldName\s*\)\s*\{([\s\S]*?)\n\s{4}\}/m,
    );
    if (!switchMatch) return [];
    const switchBlock = switchMatch[1];
    const caseRegex = /case\s+["'](\w+)["']/g;
    const cases: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = caseRegex.exec(switchBlock)) !== null) {
      cases.push(match[1]);
    }
    return cases;
  }

  const schemaMutations = getSchemaMutations();
  const handlerCases = getHandlerCases();

  it("schema defines at least one gamification mutation", () => {
    expect(schemaMutations.length).toBeGreaterThan(0);
  });

  it("handler has at least one case", () => {
    expect(handlerCases.length).toBeGreaterThan(0);
  });

  it("every schema mutation has a handler case", () => {
    const missing = schemaMutations.filter((m) => !handlerCases.includes(m));
    expect(missing).toEqual([]);
  });

  // Handler cases that are intentionally internal-only (no schema mutation)
  const internalOnlyCases = ["applyBattleStakes"];

  it("every handler case has a schema mutation (excluding internal-only)", () => {
    const orphaned = handlerCases.filter(
      (c) => !schemaMutations.includes(c) && !internalOnlyCases.includes(c),
    );
    expect(orphaned).toEqual([]);
  });

  it("mutation count matches (accounting for internal-only cases)", () => {
    expect(schemaMutations.length).toBe(
      handlerCases.length - internalOnlyCases.length,
    );
  });

  // Verify the specific expected operations
  const expectedOps = [
    "awardXP",
    "checkBadges",
    "checkBadgesBatch",
    "updateStreak",
    "rebuildLeaderboard",
    "upsertStudentMemory",
    "bootstrapStudentMemory",
    "updateStudentUnitMemoryFromGrade",
    "rebuildStudentMemoryProfile",
    "checkPersonalBest",
    "recomputeProgress",
    "checkEasterEggs",
    "discoverEasterEgg",
    "updateGuildXP",
    "contributeToChallenge",
    "generateSkillTree",
    "advanceSkillProgress",
    "evaluateSkillsForUnit",
    "claimStorybookBadges",
  ];

  expectedOps.forEach((op) => {
    it(`schema defines "${op}" mutation`, () => {
      expect(schemaMutations).toContain(op);
    });

    it(`handler has "${op}" case`, () => {
      expect(handlerCases).toContain(op);
    });
  });
});
