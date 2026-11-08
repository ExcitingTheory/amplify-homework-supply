import { describe, expect, it } from "vitest";
import { normaliseTerm as amplifyNormalise } from "../../amplify/functions/documentAnalysis/analysis";
import { normaliseTerm as clientNormalise } from "../../src/utils/termNormalisation";

const cases: Array<[string, string]> = [
  ["Chloroplasts", "chloroplast"],
  ["chloroplast", "chloroplast"],
  ["  The   Plasma Membrane!  ", "the plasma membrane"],
  ["Café", "cafe"],
  ["Mitochondria (singular: mitochondrion)", "mitochondria singular mitochondrion"],
  ["Analyses", "analysis"],
  ["Children", "child"],
  ["Species", "species"],
  ["Nucleus", "nucleus"],
  ["Boxes", "box"],
  ["Properties", "property"],
  ["ATP", "atp"],
  ["日本語", "日本語"],
  ["ぎんこう", "ぎんこう"],
  ["", ""],
];

describe.each([
  ["amplify", amplifyNormalise],
  ["client", clientNormalise],
] as const)("%s normaliseTerm", (_name, normalise) => {
  it.each(cases)("normalises %j to %j", (input, expected) => {
    expect(normalise(input)).toBe(expected);
  });
});

describe("the two copies", () => {
  it("agree on every case, so a term matches the same way in a Lambda and in the browser", () => {
    for (const [input] of cases) {
      expect(clientNormalise(input)).toBe(amplifyNormalise(input));
    }
  });
});
