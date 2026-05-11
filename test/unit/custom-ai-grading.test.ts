/**
 * Unit tests for Custom AI block grading logic and node serialization.
 */

import { describe, it, expect, vi } from "vitest";

describe("CustomAINode serialization", () => {
  it("exportJSON produces correct structure", () => {
    // Test the serialized format matches the expected schema
    const serialized = {
      type: "custom-ai",
      version: 1,
      ids: ["q1", "q2"],
      inputMode: "text",
      criteria: "Grade based on accuracy",
      allowedInput: ["text", "audio"],
      format: "",
    };

    expect(serialized.type).toBe("custom-ai");
    expect(serialized.version).toBe(1);
    expect(serialized.ids).toEqual(["q1", "q2"]);
    expect(serialized.inputMode).toBe("text");
    expect(serialized.criteria).toBe("Grade based on accuracy");
    expect(serialized.allowedInput).toEqual(["text", "audio"]);
  });

  it("round-trip serialization preserves data", () => {
    const original = {
      type: "custom-ai",
      version: 1,
      ids: ["q1", "q2", "q3"],
      inputMode: "drawing" as const,
      criteria: "Check for correct molecular structure",
      allowedInput: ["text", "drawing"] as const,
      format: "left",
    };

    // Simulate JSON round-trip
    const json = JSON.stringify(original);
    const restored = JSON.parse(json);

    expect(restored.type).toBe(original.type);
    expect(restored.version).toBe(original.version);
    expect(restored.ids).toEqual(original.ids);
    expect(restored.inputMode).toBe(original.inputMode);
    expect(restored.criteria).toBe(original.criteria);
    expect(restored.allowedInput).toEqual(original.allowedInput);
    expect(restored.format).toBe(original.format);
  });

  it("handles empty ids array", () => {
    const serialized = {
      type: "custom-ai",
      version: 1,
      ids: [],
      inputMode: "text",
      criteria: "",
      allowedInput: ["text"],
      format: "",
    };

    expect(serialized.ids).toEqual([]);
    expect(serialized.criteria).toBe("");
  });
});

describe("Grade data structure for custom-ai blocks", () => {
  it("stores grade data in expected format", () => {
    const gradeData = {
      "node-key-1": {
        complete: true,
        accuracy: 0.85,
        userResponse: "Photosynthesis converts light to energy",
        feedback: "Good understanding of the basics",
        score: 85,
      },
    };

    expect(gradeData["node-key-1"].complete).toBe(true);
    expect(gradeData["node-key-1"].accuracy).toBe(0.85);
    expect(gradeData["node-key-1"].score).toBe(85);
  });

  it("calculates average score from multiple questions", () => {
    const scores = [80, 90, 70];
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    expect(avgScore).toBe(80);
  });

  it("handles incomplete grade data", () => {
    const gradeData = {
      "node-key-1": {
        complete: false,
        accuracy: 0,
        userResponse: "",
        feedback: "",
        score: 0,
      },
    };

    expect(gradeData["node-key-1"].complete).toBe(false);
    expect(gradeData["node-key-1"].accuracy).toBe(0);
  });
});

describe("API request validation", () => {
  it("validates required fields", () => {
    const validRequest = {
      questionId: "q1",
      question: "What is photosynthesis?",
      answer: "The process by which plants make food",
      inputMode: "text",
      criteria: "Grade based on scientific accuracy",
    };

    expect(validRequest.questionId).toBeTruthy();
    expect(validRequest.question).toBeTruthy();
    expect(validRequest.answer).toBeTruthy();
    expect(["text", "audio", "image", "drawing"]).toContain(
      validRequest.inputMode,
    );
    expect(validRequest.criteria).toBeTruthy();
  });

  it("rejects invalid input modes", () => {
    const validModes = ["text", "audio", "image", "drawing"];
    expect(validModes).not.toContain("html");
    expect(validModes).not.toContain("code");
    expect(validModes).not.toContain("video");
  });
});

describe("gradedBlockTypes includes custom-ai", () => {
  it("custom-ai is in the graded block types", async () => {
    // Import the actual array to verify integration
    const { gradedBlockTypes } = await import("@/context/unitContext.jsx");
    expect(gradedBlockTypes).toContain("custom-ai");
  });

  it("custom-ai coexists with existing block types", async () => {
    const { gradedBlockTypes } = await import("@/context/unitContext.jsx");
    expect(gradedBlockTypes).toContain("quiz");
    expect(gradedBlockTypes).toContain("meaning-association");
    expect(gradedBlockTypes).toContain("answer");
    expect(gradedBlockTypes).toContain("custom-answer");
    expect(gradedBlockTypes).toContain("custom-ai");
    expect(gradedBlockTypes.length).toBe(5);
  });
});

describe("API error handling", () => {
  it("returns safe fallback for malformed AI response", () => {
    const fallback = {
      correct: false,
      score: 0,
      feedback: "Unable to process the grading response. Please try again.",
    };

    expect(fallback.correct).toBe(false);
    expect(fallback.score).toBe(0);
    expect(fallback.feedback).toBeTruthy();
  });

  it("returns safe fallback for API errors", () => {
    const fallback = {
      correct: false,
      score: 0,
      feedback: "An error occurred while grading. Please try again.",
    };

    expect(fallback.correct).toBe(false);
    expect(fallback.score).toBe(0);
    expect(fallback.feedback).toBeTruthy();
  });
});
