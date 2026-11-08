import { describe, expect, it } from "vitest";
import { findSimilarQuestions } from "../../src/utils/findSimilarQuestions";

const bank = [
  { id: "q1", prompt: "What is the path for The Magus?", answer: "12" },
  { id: "q2", prompt: "What does chlorophyll absorb?", answer: "Sunlight" },
  { id: "q3", prompt: "Deleted question", answer: "x", deletedAt: "2026-01-01" },
];

describe("findSimilarQuestions", () => {
  it("reports the same question asked again as a duplicate", () => {
    expect(
      findSimilarQuestions({ prompt: "what is the path for the magus?", answer: "12" }, bank),
    ).toEqual([{ question: bank[0], kind: "duplicate" }]);
  });

  it("reports a reworded question as a variation", () => {
    const [match] = findSimilarQuestions(
      { prompt: "What is the path for Magus?", answer: "12" },
      bank,
    );
    expect(match).toMatchObject({ question: bank[0], kind: "variation" });
  });

  it("reports the same question answered differently as a conflict", () => {
    expect(
      findSimilarQuestions({ prompt: "What is the path for The Magus?", answer: "13" }, bank),
    ).toEqual([{ question: bank[0], kind: "conflict" }]);
  });

  it("treats a missing answer on either side as nothing to disagree with", () => {
    expect(
      findSimilarQuestions({ prompt: "What is the path for The Magus?" }, bank),
    ).toEqual([{ question: bank[0], kind: "duplicate" }]);
  });

  it("ignores unrelated questions, deleted ones, and the question being edited", () => {
    expect(findSimilarQuestions({ prompt: "Who discovered cells?", answer: "Hooke" }, bank)).toEqual([]);
    expect(findSimilarQuestions({ prompt: "Deleted question", answer: "x" }, bank)).toEqual([]);
    expect(
      findSimilarQuestions({ prompt: "What is the path for The Magus?", answer: "12" }, bank, {
        exceptId: "q1",
      }),
    ).toEqual([]);
  });

  it("matches nothing without a prompt", () => {
    expect(findSimilarQuestions({ prompt: "   ", answer: "12" }, bank)).toEqual([]);
  });

  it("shows the closest matches first and caps how many are reported", () => {
    const crowded = [
      { id: "a", prompt: "What is a cell?", answer: "A different answer entirely" },
      { id: "b", prompt: "What is a cell?", answer: "The basic unit of life" },
      { id: "c", prompt: "What is a cell", answer: "The basic unit of life" },
    ];
    const found = findSimilarQuestions(
      { prompt: "What is a cell?", answer: "The basic unit of life" },
      crowded,
      { limit: 2 },
    );
    expect(found).toHaveLength(2);
    expect(found[0].kind).toBe("duplicate");
  });
});
