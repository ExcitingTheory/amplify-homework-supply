import { describe, expect, it } from "vitest";
import {
  answersAreSimilar as amplifySimilar,
  answersConflict as amplifyConflict,
} from "../../amplify/functions/documentAnalysis/analysis";
import {
  answersAreSimilar as clientSimilar,
  answersConflict as clientConflict,
} from "../../src/utils/contentSimilarity";

const similarCases: Array<[string, string, boolean]> = [
  ["The basic unit of life.", "basic unit of life", true],
  ["The control centre of the cell", "The control center of the cell", true],
  ["Yod", "Yod (Y)", true],
  ["Produces energy", "Produces energy for the cell", true],
  ["energy converted into glucose", "glucose converted into energy", false],
  ["The nucleus stores DNA", "The ribosome makes protein", false],
  ["Path 12 joins Kether", "Path 13 joins Kether", false],
  ["The nucleus holds DNA", "The nucleus does not hold DNA", false],
  ["a", "b", false],
  ["", "", false],
];

const conflictCases: Array<[string, string, boolean]> = [
  ["Path 12", "Path 13", true],
  ["holds DNA", "does not hold DNA", true],
  ["The basic unit of life", "the basic unit of life!", false],
  ["Sheet 1 of 25", "Sheet 1 of 25", false],
];

describe.each([
  ["amplify", amplifySimilar, amplifyConflict],
  ["client", clientSimilar, clientConflict],
] as const)("%s content similarity", (_name, similar, conflict) => {
  it.each(similarCases)("reads %j and %j as alike: %s", (left, right, expected) => {
    expect(similar(left, right)).toBe(expected);
  });
  it.each(conflictCases)("sees %j and %j as conflicting: %s", (left, right, expected) => {
    expect(conflict(left, right)).toBe(expected);
  });
});

describe("the two copies", () => {
  it("agree, so the browser flags what the analysis would have matched", () => {
    for (const [left, right] of [...similarCases, ...conflictCases]) {
      expect(clientSimilar(left, right)).toBe(amplifySimilar(left, right));
      expect(clientConflict(left, right)).toBe(amplifyConflict(left, right));
    }
  });
});
