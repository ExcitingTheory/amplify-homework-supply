import { describe, expect, it } from "vitest";
import { doubleMetaphone } from "../../src/utils/callResponse/doubleMetaphone";
import { scoreSpokenAnswer } from "../../src/utils/callResponse/scoreSpokenAnswer";

describe("doubleMetaphone", () => {
  it("produces matching alternatives for common transliteration variants", () => {
    expect(scoreSpokenAnswer("Qabalah", "Kabbalah")).toMatchObject({
      score: 85,
      correct: false,
      match: "phonetic",
    });
    expect(scoreSpokenAnswer("Sefirot", "Sephiroth")).toMatchObject({
      score: 85,
      correct: false,
      match: "phonetic",
    });
  });

  it("keeps the primary and secondary encodings bounded", () => {
    const [primary, secondary] = doubleMetaphone("Schwarzenegger");
    expect(primary).toHaveLength(4);
    expect(secondary).toHaveLength(4);
  });

  it("does not treat unrelated short answers as phonetic matches", () => {
    expect(scoreSpokenAnswer("Beth", "Path")).toMatchObject({
      correct: false,
      match: "none",
    });
  });
});
