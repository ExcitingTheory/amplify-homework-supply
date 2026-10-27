import { describe, expect, it } from "vitest";
import {
  MAX_UNIT_CONTENT_CHARS,
  buildAIMentionPrompt,
} from "../../amplify/functions/peerReviewAI/prompt";

const unit = { name: "Water Cycle", description: "Evaporation and rain" };
const grade = { accuracy: 80, complete: false };

describe("buildAIMentionPrompt", () => {
  it("names the persona and the handle students use", () => {
    const prompt = buildAIMentionPrompt(unit, grade, "");
    expect(prompt).toContain("You are Kai");
    expect(prompt).toContain("@kai");
  });

  it("includes the assignment content and tells the tutor not to give answers away", () => {
    const prompt = buildAIMentionPrompt(unit, grade, "", "Evaporation lifts water vapor.");
    expect(prompt).toContain("Assignment: Water Cycle");
    expect(prompt).toContain("Assignment content (what the students are working on):");
    expect(prompt).toContain("Evaporation lifts water vapor.");
    expect(prompt).toContain("Guide students toward answers");
  });

  it("omits the content section when there is none", () => {
    const prompt = buildAIMentionPrompt(unit, grade, "");
    expect(prompt).not.toContain("Assignment content");
  });

  it("caps the content at the configured length", () => {
    const prompt = buildAIMentionPrompt(unit, grade, "", "x".repeat(MAX_UNIT_CONTENT_CHARS + 500));
    const included = prompt.split("\n").find((line) => line.startsWith("xxxx"));
    expect(included).toHaveLength(MAX_UNIT_CONTENT_CHARS);
  });

  it("keeps the learning profile and block summary sections", () => {
    const prompt = buildAIMentionPrompt(
      unit,
      { ...grade, data: JSON.stringify({ "abcdefgh-1": { complete: true, accuracy: 90 } }) },
      "Prefers examples",
      "Some content text here.",
    );
    expect(prompt).toContain("Prefers examples");
    expect(prompt).toContain("Block abcdefgh: complete, accuracy: 90%");
  });
});
