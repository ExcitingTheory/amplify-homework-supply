import { describe, expect, it } from "vitest";
import { isSupportedFormat } from "../../amplify/functions/documentAnalysis/formatRegistry";

describe("formatRegistry.isSupportedFormat", () => {
  it("supports both .qti and .qti.xml assessments", () => {
    expect(isSupportedFormat("files/quiz.qti")).toBe(true);
    expect(isSupportedFormat("files/quiz.qti.xml")).toBe(true);
  });

  it("supports RTF", () => {
    expect(isSupportedFormat("files/notes.rtf")).toBe(true);
  });
});
