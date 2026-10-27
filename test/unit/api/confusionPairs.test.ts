import { describe, expect, it } from "vitest";
import {
  mergeConfusionPairs,
  normaliseConfusionPairs,
} from "../../../app/actions/gamification-engine";

describe("normaliseConfusionPairs", () => {
  it("keeps the schema shape and maps legacy item1/item2 onto it", () => {
    expect(
      normaliseConfusionPairs([
        { conceptA: "ser", conceptB: "estar", frequency: 2 },
        { item1: "por", item2: "para" },
        { conceptA: "only-one" },
        null as any,
      ]),
    ).toEqual([
      { conceptA: "ser", conceptB: "estar", frequency: 2 },
      { conceptA: "por", conceptB: "para", frequency: 1 },
    ]);
  });

  it("tolerates missing input and rounds frequency to an integer", () => {
    expect(normaliseConfusionPairs(undefined)).toEqual([]);
    expect(
      normaliseConfusionPairs([{ conceptA: "a", conceptB: "b", frequency: 2.6 }]),
    ).toEqual([{ conceptA: "a", conceptB: "b", frequency: 3 }]);
  });
});

describe("mergeConfusionPairs", () => {
  it("sums repeated pairs and keeps distinct ones distinct", () => {
    expect(
      mergeConfusionPairs(
        [
          { conceptA: "ser", conceptB: "estar", frequency: 2 },
          { conceptA: "por", conceptB: "para", frequency: 1 },
        ],
        [
          { conceptA: "ser", conceptB: "estar", frequency: 3 },
          { item1: "tú", item2: "usted" },
        ],
      ),
    ).toEqual([
      { conceptA: "ser", conceptB: "estar", frequency: 5 },
      { conceptA: "por", conceptB: "para", frequency: 1 },
      { conceptA: "tú", conceptB: "usted", frequency: 1 },
    ]);
  });

  it("does not collapse stored pairs into one entry", () => {
    const merged = mergeConfusionPairs(
      [
        { conceptA: "a", conceptB: "b", frequency: 1 },
        { conceptA: "c", conceptB: "d", frequency: 1 },
      ],
      [],
    );
    expect(merged).toHaveLength(2);
  });
});
