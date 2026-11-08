import { describe, it, expect } from "vitest";
import { getMedallionInitials } from "../../src/utils/medallionInitials";

describe("getMedallionInitials", () => {
  it("uppercases the first letter of the first two words", () => {
    expect(getMedallionInitials("red fox den")).toBe("RF");
  });

  it("keeps punctuation tokens without counting them toward the two letters", () => {
    expect(getMedallionInitials("Cats & Dogs")).toBe("C&D");
    expect(getMedallionInitials("Cats - Dogs - Birds")).toBe("C-D-");
  });

  it("keeps leading and trailing punctuation tokens", () => {
    expect(getMedallionInitials("& Cats Dogs")).toBe("&CD");
    expect(getMedallionInitials("Cats Dogs !")).toBe("CD!");
  });

  it("only scans the first five tokens", () => {
    expect(getMedallionInitials("a b c d e & f")).toBe("AB");
    expect(getMedallionInitials("& & & & & Cats Dogs")).toBe("&&&&&");
  });

  it("handles single words, extra whitespace, and empty input", () => {
    expect(getMedallionInitials("  Falcons ")).toBe("F");
    expect(getMedallionInitials("")).toBe("");
  });
});
