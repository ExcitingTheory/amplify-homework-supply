import { describe, expect, it } from "vitest";
import { getMissedAnswerCount, hasMissedAnswers } from "../practiceDrillReview";

describe("practiceDrillReview", () => {
  it("counts completed answers below full accuracy", () => {
    expect(
      getMissedAnswerCount({
        first: { complete: true, accuracy: 80 },
        second: { complete: true, accuracy: 100 },
        third: { complete: false, accuracy: 0 },
      }),
    ).toBe(1);
  });

  it("reports whether a drill has mistakes to review", () => {
    expect(hasMissedAnswers({ first: { complete: true, accuracy: 60 } })).toBe(
      true,
    );
    expect(hasMissedAnswers({ first: { complete: true, accuracy: 100 } })).toBe(
      false,
    );
  });
});
