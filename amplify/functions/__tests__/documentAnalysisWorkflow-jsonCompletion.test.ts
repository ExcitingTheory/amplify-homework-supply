import { describe, expect, it } from "vitest";
import { parseJsonCompletion } from "../documentAnalysisWorkflow/jsonCompletion";

const completion = (content: string | null, finish_reason = "stop") => ({
  choices: [{ finish_reason, message: { content } }],
});

describe("parseJsonCompletion", () => {
  it("parses complete JSON", () => {
    expect(parseJsonCompletion(completion('{"a":1}'), "Stage")).toEqual({
      a: 1,
    });
  });

  it("reports truncation instead of a raw SyntaxError", () => {
    expect(() =>
      parseJsonCompletion(completion('{"a":"unterminated', "length"), "Stage"),
    ).toThrow(/Stage response was truncated by the token limit/);
  });

  it("wraps malformed JSON with the stage name", () => {
    expect(() => parseJsonCompletion(completion("{nope"), "Stage")).toThrow(
      "Stage returned invalid JSON",
    );
  });

  it("rejects empty content", () => {
    expect(() => parseJsonCompletion(completion(null), "Stage")).toThrow(
      "Stage returned no content",
    );
  });
});
