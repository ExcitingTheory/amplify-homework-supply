import { describe, expect, it } from "vitest";
import {
  blockAccuracyFraction,
  computeUnitAccuracy,
} from "../../src/context/unitContext";

/**
 * Graded blocks record accuracy as a 0..1 fraction (`correct / attempted`),
 * while `Grade.accuracy` is a 0..100 percentage that the completion screen
 * renders directly. Mixing the two scales silently turned every score into
 * 0% or 1%, so both directions are pinned here.
 */
describe("blockAccuracyFraction", () => {
  it("keeps a fraction as it is", () => {
    expect(blockAccuracyFraction(1)).toBe(1);
    expect(blockAccuracyFraction(0.85)).toBe(0.85);
    expect(blockAccuracyFraction(0.5)).toBe(0.5);
  });

  it("reads a legacy percentage as its fraction", () => {
    expect(blockAccuracyFraction(100)).toBe(1);
    expect(blockAccuracyFraction(85)).toBe(0.85);
  });

  it("does not truncate a fraction the way parseInt did", () => {
    // parseInt(0.85) is 0, which is what made a good answer score zero.
    expect(blockAccuracyFraction(0.85)).not.toBe(0);
    expect(blockAccuracyFraction("0.85")).toBe(0.85);
  });

  it("treats anything unusable as no score", () => {
    for (const value of [0, -1, null, undefined, "", "n/a", NaN]) {
      expect(blockAccuracyFraction(value)).toBe(0);
    }
  });
});

/** The mean of the blocks' fractions, as the percentage stored on a Grade. */
function gradeAccuracy(blocks: Array<{ accuracy?: unknown }>): number {
  if (blocks.length === 0) return 0;
  const total = blocks.reduce(
    (sum, block) => sum + blockAccuracyFraction(block.accuracy),
    0,
  );
  return Math.round((total / blocks.length) * 100);
}

describe("a grade's accuracy", () => {
  it("is a percentage, so a perfect workbook reads as 100 rather than 1", () => {
    expect(gradeAccuracy([{ accuracy: 1 }, { accuracy: 1 }])).toBe(100);
  });

  it("keeps partial credit instead of collapsing it to 0 or 1", () => {
    expect(gradeAccuracy([{ accuracy: 0.85 }])).toBe(85);
    expect(gradeAccuracy([{ accuracy: 1 }, { accuracy: 0.5 }])).toBe(75);
    expect(gradeAccuracy([{ accuracy: 0.4 }])).toBe(40);
  });

  it("counts a block with no score as zero rather than dropping it", () => {
    expect(gradeAccuracy([{ accuracy: 1 }, {}])).toBe(50);
  });

  it("has no score without blocks", () => {
    expect(gradeAccuracy([])).toBe(0);
  });
});

describe("computeUnitAccuracy (the unit's stored accuracy)", () => {
  it("counts a completed block that scored 0 instead of dropping it", () => {
    // Before: the 0 block was skipped and this unit read as 100%.
    expect(
      computeUnitAccuracy({
        a: { complete: true, accuracy: 1 },
        b: { complete: true, accuracy: 0 },
      }),
    ).toBe(50);
  });

  it("ignores incomplete blocks and blocks with no usable score", () => {
    expect(
      computeUnitAccuracy({
        a: { complete: true, accuracy: 0.5 },
        b: { complete: false, accuracy: 0 },
        c: { complete: true },
        d: { complete: true, accuracy: NaN },
      }),
    ).toBe(50);
  });

  it("counts a completed practice mode that scored 0", () => {
    expect(
      computeUnitAccuracy({
        m: {
          learn: { complete: true, accuracy: 1 },
          easy: { complete: true, accuracy: 0 },
        },
      }),
    ).toBe(50);
  });

  it("keeps counting in-progress modes only once they have a non-zero score", () => {
    expect(
      computeUnitAccuracy({
        m: {
          learn: { complete: false, accuracy: 0.5 },
          easy: { complete: false, accuracy: 0 },
        },
      }),
    ).toBe(50);
  });

  it("is 0 with nothing scored", () => {
    expect(computeUnitAccuracy({})).toBe(0);
    expect(computeUnitAccuracy(null)).toBe(0);
  });
});
