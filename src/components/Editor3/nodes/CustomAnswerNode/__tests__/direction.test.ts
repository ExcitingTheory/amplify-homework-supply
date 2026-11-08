import { describe, expect, it } from "vitest";
import { getCustomAnswerDirectionPair } from "../direction";

describe("custom answer direction", () => {
  const question = {
    prompt: "What is photosynthesis?",
    answer: "The process plants use to make food",
  };

  it("uses the question as prompt by default", () => {
    expect(getCustomAnswerDirectionPair(question)).toEqual({
      prompt: question.prompt,
      expected: question.answer,
    });
  });

  it("uses the answer as prompt in reverse mode", () => {
    expect(
      getCustomAnswerDirectionPair(question, "answer-to-question"),
    ).toEqual({
      prompt: question.answer,
      expected: question.prompt,
    });
  });
});
